-- Server-side email-domain enforcement + Google avatar capture.

-- 1. Replace handle_new_user(): also copy the Google avatar into profiles, and make
--    the insert idempotent so a double-fire never raises (which GoTrue surfaces as a
--    generic "Database error saving new user" 500).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Enforce that only VIT accounts (@vit.ac.in faculty / @vitstudent.ac.in students)
--    can be created. This is the real enforcement -- the Google `hd` hint and the
--    client checks are not authoritative.
--
--    NOTE: a raised exception here surfaces to the client as a generic signup failure
--    (often HTTP 500 with a masked message), so Auth.tsx must show a friendly
--    "use your VIT email" hint proactively rather than relying on this message.
--    BEFORE deploying, confirm every existing admin/staff account is already on a VIT
--    domain -- this trigger only blocks NEW inserts, but future re-creations would fail.
CREATE OR REPLACE FUNCTION public.enforce_email_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;  -- non-email providers are not used; do not block them
  END IF;
  IF lower(NEW.email) NOT LIKE '%@vit.ac.in'
     AND lower(NEW.email) NOT LIKE '%@vitstudent.ac.in' THEN
    RAISE EXCEPTION 'Only @vit.ac.in or @vitstudent.ac.in email addresses are allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_email_domain_trg ON auth.users;
CREATE TRIGGER enforce_email_domain_trg
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_email_domain();
