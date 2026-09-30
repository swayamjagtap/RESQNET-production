-- RESQNET Incremental Migration 2
-- Adds: scenario extensions, hospitals table, ambulances table
-- with strict RLS, ownership-through-parent policies, and immutability guards.
-- This migration is safe to run after 20260930000000_create_scenarios.sql.
-- DO NOT EDIT the prior applied migration.
--
-- TO APPLY: paste the entire contents into Supabase Dashboard → SQL Editor → Run.

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. EXTEND public.scenarios
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.scenarios
  ADD COLUMN IF NOT EXISTS disaster_type    TEXT         NOT NULL DEFAULT 'building_collapse',
  ADD COLUMN IF NOT EXISTS incident_lat     NUMERIC,
  ADD COLUMN IF NOT EXISTS incident_lng     NUMERIC,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  -- Synthetic / illustrative casualty counts – NOT real patient data
  ADD COLUMN IF NOT EXISTS fracture         INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blood_loss       INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unconscious      INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS limb_loss        INTEGER      NOT NULL DEFAULT 0;

-- Range checks on new columns
ALTER TABLE public.scenarios
  ADD CONSTRAINT scenarios_incident_lat_range
    CHECK (incident_lat IS NULL OR (incident_lat >= -90  AND incident_lat <= 90)),
  ADD CONSTRAINT scenarios_incident_lng_range
    CHECK (incident_lng IS NULL OR (incident_lng >= -180 AND incident_lng <= 180)),
  ADD CONSTRAINT scenarios_disaster_type_nonempty
    CHECK (char_length(trim(disaster_type)) > 0),
  ADD CONSTRAINT scenarios_fracture_range
    CHECK (fracture    >= 0 AND fracture    <= 200),
  ADD CONSTRAINT scenarios_blood_loss_range
    CHECK (blood_loss  >= 0 AND blood_loss  <= 200),
  ADD CONSTRAINT scenarios_unconscious_range
    CHECK (unconscious >= 0 AND unconscious <= 200),
  ADD CONSTRAINT scenarios_limb_loss_range
    CHECK (limb_loss   >= 0 AND limb_loss   <= 200);

-- updated_at trigger function (shared)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS scenarios_set_updated_at ON public.scenarios;
CREATE TRIGGER scenarios_set_updated_at
  BEFORE UPDATE ON public.scenarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Prevent owner_id changes on scenarios via trigger
CREATE OR REPLACE FUNCTION public.prevent_scenarios_owner_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.owner_id <> OLD.owner_id THEN
    RAISE EXCEPTION 'owner_id is immutable on scenarios';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS scenarios_immutable_owner ON public.scenarios;
CREATE TRIGGER scenarios_immutable_owner
  BEFORE UPDATE ON public.scenarios
  FOR EACH ROW EXECUTE FUNCTION public.prevent_scenarios_owner_change();

-- ────────────────────────────────────────────────────────────────
-- 2. SCENARIOS RLS – add UPDATE and DELETE (owner-scoped)
-- ────────────────────────────────────────────────────────────────

-- Revoke everything first, then grant exactly what is needed
REVOKE ALL ON TABLE public.scenarios FROM PUBLIC;
REVOKE ALL ON TABLE public.scenarios FROM anon;
REVOKE ALL ON TABLE public.scenarios FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.scenarios TO authenticated;

DROP POLICY IF EXISTS scenarios_select_owner  ON public.scenarios;
DROP POLICY IF EXISTS scenarios_insert_owner  ON public.scenarios;
DROP POLICY IF EXISTS scenarios_update_owner  ON public.scenarios;
DROP POLICY IF EXISTS scenarios_delete_owner  ON public.scenarios;

-- Use (select auth.uid()) per RLS-performance best practices (cached per query)
CREATE POLICY scenarios_select_owner ON public.scenarios
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = owner_id);

CREATE POLICY scenarios_insert_owner ON public.scenarios
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = owner_id);

-- WITH CHECK keeps owner_id immutable at policy level (trigger is the hard stop)
CREATE POLICY scenarios_update_owner ON public.scenarios
  FOR UPDATE TO authenticated
  USING      ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY scenarios_delete_owner ON public.scenarios
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = owner_id);

-- ────────────────────────────────────────────────────────────────
-- 3. TABLE: public.hospitals
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hospitals (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id   UUID        NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL CHECK (char_length(trim(name)) > 0 AND char_length(name) <= 255),
  lat           NUMERIC     NOT NULL CHECK (lat >= -90  AND lat <= 90),
  lng           NUMERIC     NOT NULL CHECK (lng >= -180 AND lng <= 180),
  -- Synthetic / illustrative inventory fields
  icu_beds      INTEGER     NOT NULL DEFAULT 0 CHECK (icu_beds      >= 0),
  blood_units   INTEGER     NOT NULL DEFAULT 0 CHECK (blood_units   >= 0),
  ventilators   INTEGER     NOT NULL DEFAULT 0 CHECK (ventilators   >= 0),
  general_beds  INTEGER     NOT NULL DEFAULT 0 CHECK (general_beds  >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hospitals_scenario_id_idx ON public.hospitals(scenario_id);

-- Prevent reparenting via trigger
CREATE OR REPLACE FUNCTION public.prevent_hospital_reparent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.scenario_id <> OLD.scenario_id THEN
    RAISE EXCEPTION 'scenario_id is immutable on hospitals';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hospitals_immutable_scenario ON public.hospitals;
CREATE TRIGGER hospitals_immutable_scenario
  BEFORE UPDATE ON public.hospitals
  FOR EACH ROW EXECUTE FUNCTION public.prevent_hospital_reparent();

-- RLS on hospitals
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.hospitals FROM PUBLIC;
REVOKE ALL ON TABLE public.hospitals FROM anon;
REVOKE ALL ON TABLE public.hospitals FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hospitals TO authenticated;

DROP POLICY IF EXISTS hospitals_select_owner ON public.hospitals;
DROP POLICY IF EXISTS hospitals_insert_owner ON public.hospitals;
DROP POLICY IF EXISTS hospitals_update_owner ON public.hospitals;
DROP POLICY IF EXISTS hospitals_delete_owner ON public.hospitals;

-- Child policies check ownership through the parent scenario
CREATE POLICY hospitals_select_owner ON public.hospitals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scenarios s
      WHERE s.id = scenario_id AND s.owner_id = (select auth.uid())
    )
  );

CREATE POLICY hospitals_insert_owner ON public.hospitals
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scenarios s
      WHERE s.id = scenario_id AND s.owner_id = (select auth.uid())
    )
  );

CREATE POLICY hospitals_update_owner ON public.hospitals
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scenarios s
      WHERE s.id = scenario_id AND s.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scenarios s
      WHERE s.id = scenario_id AND s.owner_id = (select auth.uid())
    )
  );

CREATE POLICY hospitals_delete_owner ON public.hospitals
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scenarios s
      WHERE s.id = scenario_id AND s.owner_id = (select auth.uid())
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 4. TABLE: public.ambulances
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ambulances (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID        NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  label       TEXT        NOT NULL CHECK (char_length(trim(label)) > 0 AND char_length(label) <= 64),
  base_lat    NUMERIC     NOT NULL CHECK (base_lat >= -90  AND base_lat <= 90),
  base_lng    NUMERIC     NOT NULL CHECK (base_lng >= -180 AND base_lng <= 180),
  capacity    INTEGER     NOT NULL CHECK (capacity > 0 AND capacity <= 20),
  available   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scenario_id, label)
);

CREATE INDEX IF NOT EXISTS ambulances_scenario_id_idx ON public.ambulances(scenario_id);

-- Prevent reparenting via trigger
CREATE OR REPLACE FUNCTION public.prevent_ambulance_reparent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.scenario_id <> OLD.scenario_id THEN
    RAISE EXCEPTION 'scenario_id is immutable on ambulances';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ambulances_immutable_scenario ON public.ambulances;
CREATE TRIGGER ambulances_immutable_scenario
  BEFORE UPDATE ON public.ambulances
  FOR EACH ROW EXECUTE FUNCTION public.prevent_ambulance_reparent();

-- RLS on ambulances
ALTER TABLE public.ambulances ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ambulances FROM PUBLIC;
REVOKE ALL ON TABLE public.ambulances FROM anon;
REVOKE ALL ON TABLE public.ambulances FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ambulances TO authenticated;

DROP POLICY IF EXISTS ambulances_select_owner ON public.ambulances;
DROP POLICY IF EXISTS ambulances_insert_owner ON public.ambulances;
DROP POLICY IF EXISTS ambulances_update_owner ON public.ambulances;
DROP POLICY IF EXISTS ambulances_delete_owner ON public.ambulances;

CREATE POLICY ambulances_select_owner ON public.ambulances
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scenarios s
      WHERE s.id = scenario_id AND s.owner_id = (select auth.uid())
    )
  );

CREATE POLICY ambulances_insert_owner ON public.ambulances
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scenarios s
      WHERE s.id = scenario_id AND s.owner_id = (select auth.uid())
    )
  );

CREATE POLICY ambulances_update_owner ON public.ambulances
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scenarios s
      WHERE s.id = scenario_id AND s.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scenarios s
      WHERE s.id = scenario_id AND s.owner_id = (select auth.uid())
    )
  );

CREATE POLICY ambulances_delete_owner ON public.ambulances
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scenarios s
      WHERE s.id = scenario_id AND s.owner_id = (select auth.uid())
    )
  );

COMMIT;
