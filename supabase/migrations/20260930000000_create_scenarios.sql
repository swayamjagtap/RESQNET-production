-- RESQNET Foundation Database Migration
-- Target table: public.scenarios
-- Purpose: Store user-created draft scenarios with strict owner access.

BEGIN;

-- 1. Create the scenarios table.
CREATE TABLE IF NOT EXISTS public.scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (
        char_length(trim(title)) > 0
        AND char_length(title) <= 255
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security.
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

-- 3. Clear existing table permissions.
REVOKE ALL ON TABLE public.scenarios FROM PUBLIC;
REVOKE ALL ON TABLE public.scenarios FROM anon;
REVOKE ALL ON TABLE public.scenarios FROM authenticated;

-- 4. Grant only SELECT and INSERT to signed-in users.
GRANT SELECT, INSERT ON TABLE public.scenarios TO authenticated;

-- 5. Replace our policies so this migration can be run again.
DROP POLICY IF EXISTS scenarios_select_owner ON public.scenarios;
DROP POLICY IF EXISTS scenarios_insert_owner ON public.scenarios;

-- 6. Users can read only their own scenarios.
CREATE POLICY scenarios_select_owner
ON public.scenarios
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

-- 7. Users can create scenarios only under their own account.
CREATE POLICY scenarios_insert_owner
ON public.scenarios
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Anonymous users have no table access.
-- Signed-in users cannot UPDATE or DELETE scenarios.

COMMIT;