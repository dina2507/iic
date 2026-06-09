-- =====================================================================
-- PERFORMANCE: stop RLS policies from re-evaluating auth.uid() per row.
--
-- Postgres re-runs `auth.uid()` for every row a policy is checked against.
-- Wrapping it as `(select auth.uid())` turns it into a one-shot initPlan
-- evaluated once per statement. The boolean outcome of each policy is
-- identical — this is purely a query-planning optimization (cleared 49
-- `auth_rls_initplan` advisor warnings).
--
-- Applied live on 2026-06-09. The DO block is idempotent: each field is
-- rewritten only if it still contains an unwrapped auth.uid().
-- =====================================================================
DO $$
DECLARE
  pol   record;
  v_qual  text;
  v_check text;
  v_sql   text;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (qual       IS NOT NULL AND qual       LIKE '%auth.uid()%' AND lower(qual)       NOT LIKE '%select auth.uid()%')
        OR (with_check IS NOT NULL AND with_check LIKE '%auth.uid()%' AND lower(with_check) NOT LIKE '%select auth.uid()%')
      )
  LOOP
    v_qual  := pol.qual;
    v_check := pol.with_check;

    IF v_qual IS NOT NULL AND lower(v_qual) NOT LIKE '%select auth.uid()%' THEN
      v_qual := replace(v_qual, 'auth.uid()', '(select auth.uid())');
    END IF;
    IF v_check IS NOT NULL AND lower(v_check) NOT LIKE '%select auth.uid()%' THEN
      v_check := replace(v_check, 'auth.uid()', '(select auth.uid())');
    END IF;

    v_sql := format('ALTER POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    IF v_qual  IS NOT NULL THEN v_sql := v_sql || format(' USING (%s)', v_qual); END IF;
    IF v_check IS NOT NULL THEN v_sql := v_sql || format(' WITH CHECK (%s)', v_check); END IF;
    EXECUTE v_sql;
  END LOOP;
END $$;

-- Cover the two foreign keys flagged as unindexed.
CREATE INDEX IF NOT EXISTS idx_events_created_by
  ON public.events (created_by);
CREATE INDEX IF NOT EXISTS idx_user_domain_roles_domain_id
  ON public.user_domain_roles (domain_id);
