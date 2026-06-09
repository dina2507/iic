-- =====================================================================
-- SECURITY HARDENING (part 1): profiles PII, SECURITY DEFINER trigger
-- function exposure, and submission-table payload limits.
--
-- NOTE: applied live to the remote project on 2026-06-09 via the Supabase
-- tooling. Committed here for version history. Written to be idempotent so
-- it is safe to re-apply via `supabase db push` / `db reset`.
-- =====================================================================

-- 1) Lock down profiles. The old "Profiles are viewable by everyone"
--    policy (USING true) let ANY anonymous visitor read every user's
--    email. Restrict SELECT to the row owner + staff who genuinely need
--    cross-user reads (admins/moderators for user management, and domain
--    heads/coordinators for the Domain Panel "add member by email" search).
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by self and staff" ON public.profiles;

CREATE POLICY "Profiles are viewable by self and staff"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = id
    OR public.has_role((select auth.uid()), 'admin'::public.app_role)
    OR public.has_role((select auth.uid()), 'moderator'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_domain_roles udr
      WHERE udr.user_id = (select auth.uid())
        AND udr.role = ANY (ARRAY['head'::public.domain_role, 'coordinator'::public.domain_role])
    )
  );

-- 2) Revoke direct RPC execution of SECURITY DEFINER trigger functions.
--    Triggers run as the function owner regardless of caller privileges, so
--    revoking EXECUTE from API roles removes the /rest/v1/rpc/* attack
--    surface without affecting trigger behaviour.
DO $$
BEGIN
  IF to_regprocedure('public.handle_new_user()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated';
  END IF;
  IF to_regprocedure('public.enforce_email_domain()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.enforce_email_domain() FROM PUBLIC, anon, authenticated';
  END IF;
  IF to_regprocedure('public.upsert_my_member_profile(text,text,text,text,text,text,text,text,text,text,text,text,text,jsonb)') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.upsert_my_member_profile(text,text,text,text,text,text,text,text,text,text,text,text,text,jsonb) FROM PUBLIC, anon';
  END IF;
END $$;

-- 3) Defense-in-depth: bound the size of public submission payloads so the
--    open INSERT policies (public contact form / member idea & join forms)
--    can't be abused to write multi-megabyte rows.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_name_len') THEN
    ALTER TABLE public.contact_submissions
      ADD CONSTRAINT contact_name_len    CHECK (char_length(name)    BETWEEN 1 AND 200),
      ADD CONSTRAINT contact_email_len   CHECK (char_length(email)   BETWEEN 3 AND 320),
      ADD CONSTRAINT contact_subject_len CHECK (char_length(subject) BETWEEN 1 AND 300),
      ADD CONSTRAINT contact_message_len CHECK (char_length(message) BETWEEN 1 AND 5000);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idea_name_len') THEN
    ALTER TABLE public.idea_submissions
      ADD CONSTRAINT idea_name_len  CHECK (char_length(name)  BETWEEN 1 AND 200),
      ADD CONSTRAINT idea_email_len CHECK (char_length(email) BETWEEN 3 AND 320),
      ADD CONSTRAINT idea_idea_len  CHECK (char_length(idea)  BETWEEN 1 AND 5000);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'join_name_len') THEN
    ALTER TABLE public.join_requests
      ADD CONSTRAINT join_name_len   CHECK (char_length(name)  BETWEEN 1 AND 200),
      ADD CONSTRAINT join_email_len  CHECK (char_length(email) BETWEEN 3 AND 320),
      ADD CONSTRAINT join_reason_len CHECK (reason IS NULL OR char_length(reason) BETWEEN 1 AND 5000);
  END IF;
END $$;
