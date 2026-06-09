-- Secure self-service write path for member profiles.
--
-- This SECURITY DEFINER function is the ONLY way a non-admin user writes to
-- student_members / faculty_members (their base-table write policies remain
-- admin/moderator-only). It keys strictly on auth.uid() and whitelists the editable
-- fields, so a user can never set is_active, domain_role, is_core_member or
-- display_order, nor edit anyone else's row. Student vs faculty is decided by the
-- caller's verified email domain (read from auth.users, never trusted from the client).

CREATE OR REPLACE FUNCTION public.upsert_my_member_profile(
  p_name              text,
  p_phone_number      text  DEFAULT NULL,
  p_about             text  DEFAULT NULL,
  p_domain            text  DEFAULT NULL,   -- students
  p_role              text  DEFAULT NULL,   -- students (display role, NOT domain_role)
  p_designation       text  DEFAULT NULL,   -- faculty
  p_department        text  DEFAULT NULL,   -- faculty
  p_image_url         text  DEFAULT NULL,
  p_linkedin_url      text  DEFAULT NULL,
  p_twitter_url       text  DEFAULT NULL,
  p_instagram_url     text  DEFAULT NULL,
  p_github_url        text  DEFAULT NULL,
  p_whatsapp_url      text  DEFAULT NULL,
  p_social_visibility jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_email text;
  v_id    uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  IF length(coalesce(p_about, '')) > 500 THEN
    RAISE EXCEPTION 'About must be 500 characters or fewer';
  END IF;

  SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_uid;

  IF v_email LIKE '%@vitstudent.ac.in' THEN
    INSERT INTO public.student_members
      (user_id, name, role, domain, image_url, phone_number, about,
       linkedin_url, twitter_url, instagram_url, github_url, whatsapp_url,
       social_visibility, is_active)
    VALUES
      (v_uid, p_name, COALESCE(NULLIF(trim(p_role), ''), 'Member'), p_domain, p_image_url,
       p_phone_number, p_about,
       p_linkedin_url, p_twitter_url, p_instagram_url, p_github_url, p_whatsapp_url,
       COALESCE(p_social_visibility, '{}'::jsonb), false)
    ON CONFLICT (user_id) WHERE user_id IS NOT NULL DO UPDATE SET
       name              = EXCLUDED.name,
       role              = EXCLUDED.role,
       domain            = EXCLUDED.domain,
       image_url         = EXCLUDED.image_url,
       phone_number      = EXCLUDED.phone_number,
       about             = EXCLUDED.about,
       linkedin_url      = EXCLUDED.linkedin_url,
       twitter_url       = EXCLUDED.twitter_url,
       instagram_url     = EXCLUDED.instagram_url,
       github_url        = EXCLUDED.github_url,
       whatsapp_url      = EXCLUDED.whatsapp_url,
       social_visibility = EXCLUDED.social_visibility,
       updated_at        = now()
       -- is_active / domain_role / is_core_member / display_order intentionally preserved
    RETURNING id INTO v_id;

  ELSIF v_email LIKE '%@vit.ac.in' THEN
    IF p_designation IS NULL OR length(trim(p_designation)) = 0
       OR p_department IS NULL OR length(trim(p_department)) = 0 THEN
      RAISE EXCEPTION 'Designation and department are required for faculty';
    END IF;
    INSERT INTO public.faculty_members
      (user_id, name, designation, department, image_url, email, phone_number, about,
       linkedin_url, twitter_url, instagram_url, github_url, whatsapp_url,
       social_visibility, is_active)
    VALUES
      (v_uid, p_name, p_designation, p_department, p_image_url, v_email, p_phone_number, p_about,
       p_linkedin_url, p_twitter_url, p_instagram_url, p_github_url, p_whatsapp_url,
       COALESCE(p_social_visibility, '{}'::jsonb), false)
    ON CONFLICT (user_id) WHERE user_id IS NOT NULL DO UPDATE SET
       name              = EXCLUDED.name,
       designation       = EXCLUDED.designation,
       department        = EXCLUDED.department,
       image_url         = EXCLUDED.image_url,
       phone_number      = EXCLUDED.phone_number,
       about             = EXCLUDED.about,
       linkedin_url      = EXCLUDED.linkedin_url,
       twitter_url       = EXCLUDED.twitter_url,
       instagram_url     = EXCLUDED.instagram_url,
       github_url        = EXCLUDED.github_url,
       whatsapp_url      = EXCLUDED.whatsapp_url,
       social_visibility = EXCLUDED.social_visibility,
       updated_at        = now()
    RETURNING id INTO v_id;

  ELSE
    RAISE EXCEPTION 'Your email domain is not permitted for membership';
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_my_member_profile(
  text, text, text, text, text, text, text, text, text, text, text, text, text, jsonb
) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.upsert_my_member_profile(
  text, text, text, text, text, text, text, text, text, text, text, text, text, jsonb
) TO authenticated;
