-- Public read path for members, with per-column masking.
--
-- IMPORTANT: this view is intentionally SECURITY DEFINER (security_invoker = false).
-- It is the ONLY way anon/authenticated clients read member data; the base tables'
-- public SELECT policy was removed in the previous migration. The view evaluates
-- public.is_member(auth.uid()) per row to decide whether members-only fields are
-- returned. Supabase's database linter will flag this as `security_definer_view` --
-- that warning is expected and is the standard pattern for column-level masking.
--
-- Visibility rules:
--   * phone_number  -> members only (always; no public toggle)
--   * each social   -> public when social_visibility->>'<key>' is true OR missing
--                      (default public), otherwise members-only
--   * faculty email -> same toggle, default public

CREATE OR REPLACE VIEW public.member_directory
WITH (security_invoker = false) AS
SELECT
  s.id,
  'student'::text                          AS member_type,
  s.name,
  s.role,
  s.domain,
  s.domain_role,
  s.is_core_member,
  NULL::text                               AS designation,
  NULL::text                               AS department,
  s.image_url,
  s.about,
  s.display_order,
  CASE WHEN public.is_member(auth.uid()) THEN s.phone_number END AS phone_number,
  CASE WHEN COALESCE((s.social_visibility->>'linkedin')::boolean, true)
            OR public.is_member(auth.uid()) THEN s.linkedin_url END  AS linkedin_url,
  CASE WHEN COALESCE((s.social_visibility->>'twitter')::boolean, true)
            OR public.is_member(auth.uid()) THEN s.twitter_url END   AS twitter_url,
  CASE WHEN COALESCE((s.social_visibility->>'instagram')::boolean, true)
            OR public.is_member(auth.uid()) THEN s.instagram_url END AS instagram_url,
  CASE WHEN COALESCE((s.social_visibility->>'github')::boolean, true)
            OR public.is_member(auth.uid()) THEN s.github_url END    AS github_url,
  CASE WHEN COALESCE((s.social_visibility->>'whatsapp')::boolean, true)
            OR public.is_member(auth.uid()) THEN s.whatsapp_url END  AS whatsapp_url,
  NULL::text                               AS email
FROM public.student_members s
WHERE s.is_active
UNION ALL
SELECT
  f.id,
  'faculty'::text                          AS member_type,
  f.name,
  NULL::text                               AS role,
  NULL::text                               AS domain,
  NULL::text                               AS domain_role,
  NULL::boolean                            AS is_core_member,
  f.designation,
  f.department,
  f.image_url,
  f.about,
  f.display_order,
  CASE WHEN public.is_member(auth.uid()) THEN f.phone_number END AS phone_number,
  CASE WHEN COALESCE((f.social_visibility->>'linkedin')::boolean, true)
            OR public.is_member(auth.uid()) THEN f.linkedin_url END  AS linkedin_url,
  CASE WHEN COALESCE((f.social_visibility->>'twitter')::boolean, true)
            OR public.is_member(auth.uid()) THEN f.twitter_url END   AS twitter_url,
  CASE WHEN COALESCE((f.social_visibility->>'instagram')::boolean, true)
            OR public.is_member(auth.uid()) THEN f.instagram_url END AS instagram_url,
  CASE WHEN COALESCE((f.social_visibility->>'github')::boolean, true)
            OR public.is_member(auth.uid()) THEN f.github_url END    AS github_url,
  CASE WHEN COALESCE((f.social_visibility->>'whatsapp')::boolean, true)
            OR public.is_member(auth.uid()) THEN f.whatsapp_url END  AS whatsapp_url,
  CASE WHEN COALESCE((f.social_visibility->>'email')::boolean, true)
            OR public.is_member(auth.uid()) THEN f.email END         AS email
FROM public.faculty_members f
WHERE f.is_active;

GRANT SELECT ON public.member_directory TO anon, authenticated;
