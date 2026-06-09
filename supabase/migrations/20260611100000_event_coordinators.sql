-- Add coordinator columns to events
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS faculty_coordinator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS student_coordinator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Allow coordinators to manage their assigned events
CREATE POLICY "Coordinators can update their assigned events" ON public.events
FOR UPDATE USING (
  auth.uid() = faculty_coordinator_id OR auth.uid() = student_coordinator_id
) WITH CHECK (
  auth.uid() = faculty_coordinator_id OR auth.uid() = student_coordinator_id
);

-- Allow coordinators to view and update registrations for their events
CREATE POLICY "Coordinators can view registrations for their events" ON public.event_registrations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = event_registrations.event_id
    AND (faculty_coordinator_id = auth.uid() OR student_coordinator_id = auth.uid())
  )
);

CREATE POLICY "Coordinators can update registrations for their events" ON public.event_registrations
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = event_registrations.event_id
    AND (faculty_coordinator_id = auth.uid() OR student_coordinator_id = auth.uid())
  )
);

-- RPC for searching potential coordinators (Admins/Moderators use this when creating events)
CREATE OR REPLACE FUNCTION public.search_potential_coordinators(search_query text, member_type text)
RETURNS TABLE (
  user_id uuid,
  name text,
  designation text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF member_type = 'faculty' THEN
    RETURN QUERY
    SELECT 
      f.user_id, 
      f.name, 
      f.designation, 
      f.email
    FROM public.faculty_members f
    WHERE f.is_active = true
      AND f.user_id IS NOT NULL
      AND (
        f.name ILIKE '%' || search_query || '%'
        OR f.email ILIKE '%' || search_query || '%'
      )
    ORDER BY f.name
    LIMIT 20;
    
  ELSIF member_type = 'student' THEN
    RETURN QUERY
    SELECT 
      s.user_id, 
      s.name, 
      s.role AS designation, 
      p.email
    FROM public.student_members s
    LEFT JOIN public.profiles p ON s.user_id = p.id
    WHERE s.is_active = true
      AND s.user_id IS NOT NULL
      AND (
        s.name ILIKE '%' || search_query || '%'
        OR p.email ILIKE '%' || search_query || '%'
      )
    ORDER BY s.name
    LIMIT 20;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_potential_coordinators(text, text) TO authenticated;
