-- Accurate public registration count.
--
-- event_registrations RLS only exposes rows to staff/coordinators/owners, so
-- a client-side COUNT returned 0 for ordinary visitors and the "X registered"
-- figure on the event page was wrong for them. This SECURITY DEFINER function
-- returns ONLY the aggregate count (never row data) and is callable by anyone.
--
-- Applied live on 2026-06-09; committed for history. Idempotent.
CREATE OR REPLACE FUNCTION public.get_event_registration_count(p_event_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int
  FROM public.event_registrations
  WHERE event_id = p_event_id;
$$;

REVOKE EXECUTE ON FUNCTION public.get_event_registration_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_event_registration_count(uuid) TO anon, authenticated;
