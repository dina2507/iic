-- Member self-service: schema additions, approval gate, RLS swap.
-- Lets students (@vitstudent.ac.in) and faculty (@vit.ac.in) own & edit their own
-- public member row. New columns: contact, about, extra socials + per-handle visibility.

-- 1. New columns on student_members ------------------------------------------------
ALTER TABLE public.student_members
  ADD COLUMN IF NOT EXISTS phone_number      text,
  ADD COLUMN IF NOT EXISTS about             varchar(500),
  ADD COLUMN IF NOT EXISTS twitter_url       text,
  ADD COLUMN IF NOT EXISTS instagram_url     text,
  ADD COLUMN IF NOT EXISTS github_url        text,
  -- linkedin_url, whatsapp_url already exist
  ADD COLUMN IF NOT EXISTS social_visibility jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. New columns on faculty_members (add the account link + socials) ---------------
ALTER TABLE public.faculty_members
  ADD COLUMN IF NOT EXISTS user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS phone_number      text,
  ADD COLUMN IF NOT EXISTS about             varchar(500),
  -- linkedin_url, email already exist
  ADD COLUMN IF NOT EXISTS whatsapp_url      text,
  ADD COLUMN IF NOT EXISTS twitter_url       text,
  ADD COLUMN IF NOT EXISTS instagram_url     text,
  ADD COLUMN IF NOT EXISTS github_url        text,
  ADD COLUMN IF NOT EXISTS social_visibility jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 3. Approval gate: new self-registered rows start hidden --------------------------
-- (Only affects rows inserted after this migration; existing rows keep their value.)
ALTER TABLE public.student_members ALTER COLUMN is_active SET DEFAULT false;
ALTER TABLE public.faculty_members ALTER COLUMN is_active SET DEFAULT false;

-- 4. One member row per account (legacy admin rows with NULL user_id excluded) -----
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_members_user_id
  ON public.student_members(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_faculty_members_user_id
  ON public.faculty_members(user_id) WHERE user_id IS NOT NULL;

-- 5. is_member(): true when an ACTIVE member row exists for the uid ----------------
-- SECURITY DEFINER so it can read the member tables even after we lock their SELECT
-- policy down. Used by the masking view to decide who sees members-only fields.
CREATE OR REPLACE FUNCTION public.is_member(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _uid IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.student_members WHERE user_id = _uid AND is_active)
    OR EXISTS (SELECT 1 FROM public.faculty_members WHERE user_id = _uid AND is_active)
  );
$$;

-- 6. RLS swap: column masking requires removing the public row-read ----------------
-- Row-level RLS cannot hide individual columns, so the public read path becomes the
-- member_directory view (next migration). Base tables are readable only by
-- admins/moderators (admin UI) and by the owner of the row (the self-service portal).
DROP POLICY IF EXISTS "Student members are viewable by everyone" ON public.student_members;
DROP POLICY IF EXISTS "Faculty members are viewable by everyone" ON public.faculty_members;

CREATE POLICY "Admins and moderators can view student members"
ON public.student_members FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Users can view their own student member row"
ON public.student_members FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins and moderators can view faculty members"
ON public.faculty_members FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Users can view their own faculty member row"
ON public.faculty_members FOR SELECT
USING (user_id = auth.uid());
