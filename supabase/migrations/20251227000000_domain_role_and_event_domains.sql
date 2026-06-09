-- Add a per-member designation so each domain's Head / Coordinator / Members
-- can be derived from the single student_members list.
ALTER TABLE public.student_members
  ADD COLUMN IF NOT EXISTS domain_role TEXT NOT NULL DEFAULT 'member';

-- Join table linking events to the domain(s) that organize them.
-- An event can belong to multiple domains.
CREATE TABLE IF NOT EXISTS public.event_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (event_id, domain_id)
);

-- Enable Row Level Security
ALTER TABLE public.event_domains ENABLE ROW LEVEL SECURITY;

-- Viewable by everyone (so public domain pages can read the linkage)
CREATE POLICY "Event domains are viewable by everyone"
ON public.event_domains
FOR SELECT
USING (true);

-- Managed by admins and moderators (mirrors student_members / events management policies)
CREATE POLICY "Admins and moderators can create event domains"
ON public.event_domains
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins and moderators can update event domains"
ON public.event_domains
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins and moderators can delete event domains"
ON public.event_domains
FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Helpful indexes for lookups in both directions
CREATE INDEX IF NOT EXISTS idx_event_domains_event_id ON public.event_domains(event_id);
CREATE INDEX IF NOT EXISTS idx_event_domains_domain_id ON public.event_domains(domain_id);
