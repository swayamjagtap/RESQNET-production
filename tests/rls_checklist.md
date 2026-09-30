# RESQNET RLS Policy Checklist
# Status: NOT YET EXECUTED against a database.
# No test database was used. These are manual verification steps to be run in Supabase SQL Editor
# after applying migration 20260930120000_extend_scenarios_resources.sql.

## Legend
#  [ ] = not yet run
#  [x] = confirmed passing (fill in when you run each check)

---

## Prerequisites
- Two test Supabase auth users created (User A and User B).
- User A has signed in and their JWT is available.
- User B has signed in and their JWT is available.
- Migration 20260930120000 has been applied.

---

## 1. Scenarios – SELECT isolation

[ ] 1a. User A creates a scenario. Confirm it appears in User A's SELECT.
    SQL (run as User A via API key with anon/auth context):
      select * from scenarios;
    Expected: only User A's own rows.

[ ] 1b. User B selects from scenarios.
    Expected: User A's row is NOT visible to User B.

---

## 2. Scenarios – INSERT constraint

[ ] 2a. User A inserts a scenario with owner_id = auth.uid(). Should succeed.
[ ] 2b. User A attempts to insert a scenario with owner_id = <User B's UUID>. Should fail with RLS violation.

---

## 3. Scenarios – UPDATE immutability

[ ] 3a. User A updates title of their own scenario. Should succeed.
[ ] 3b. User A attempts to set owner_id to User B's UUID. Should be rejected by trigger.
    SQL: update scenarios set owner_id = '<user_b_uuid>' where id = '<scenario_id>';
    Expected: ERROR: owner_id is immutable on scenarios

[ ] 3c. User B attempts to update User A's scenario. Should return 0 rows (RLS blocks it silently).

---

## 4. Scenarios – DELETE

[ ] 4a. User A deletes their own scenario. Should succeed and CASCADE to hospitals/ambulances.
[ ] 4b. User B attempts to delete User A's scenario. Should be blocked by RLS (0 rows affected).

---

## 5. Hospitals – child table ownership check

[ ] 5a. User A inserts a hospital under their own scenario. Should succeed.
[ ] 5b. User A inserts a hospital with scenario_id = User B's scenario. Should fail (EXISTS policy fails).
[ ] 5c. User B queries hospitals where scenario_id = User A's scenario. Should return 0 rows.
[ ] 5d. User A attempts UPDATE on hospital to change scenario_id. Should fail via trigger:
    SQL: update hospitals set scenario_id = '<other_id>' where id = '<hosp_id>';
    Expected: ERROR: scenario_id is immutable on hospitals

---

## 6. Ambulances – child table ownership check

[ ] 6a. Same checks as Hospitals (5a–5d) but for the ambulances table.

---

## 7. Anonymous access

[ ] 7a. Make a request with no Authorization header to /rest/v1/scenarios.
    Expected: HTTP 401 or HTTP 200 with empty array (anon has no GRANT).
[ ] 7b. Same for /rest/v1/hospitals and /rest/v1/ambulances.

---

## 8. Cascade delete

[ ] 8a. User A adds a hospital and an ambulance under a scenario, then deletes the scenario.
    Expected: hospitals and ambulances rows are also deleted (ON DELETE CASCADE).

---

## Notes
- All checks above require the Supabase client to send the user's JWT via the Authorization header.
- Direct psql access (as the `postgres` superuser) bypasses RLS — use the API or anon/service-role key
  with SET ROLE authenticated and SET LOCAL request.jwt.claims.sub = '<user_uuid>' for direct DB testing.
