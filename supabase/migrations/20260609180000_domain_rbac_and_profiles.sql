-- Phase 1: Database Setup for Domain RBAC and Profiles

-- 1. Create domain_role Enum
CREATE TYPE public.domain_role AS ENUM ('head', 'coordinator', 'member');

-- 2. Create user_domain_roles table
CREATE TABLE public.user_domain_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
    role public.domain_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, domain_id)
);

ALTER TABLE public.user_domain_roles ENABLE ROW LEVEL SECURITY;

-- 3. RLS for user_domain_roles
-- Admins can manage all
CREATE POLICY "Admins can manage user domain roles"
ON public.user_domain_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can view roles
CREATE POLICY "User domain roles are viewable by everyone"
ON public.user_domain_roles
FOR SELECT
USING (true);

-- Domain heads can manage roles for their domain
CREATE POLICY "Domain heads can manage roles for their domain"
ON public.user_domain_roles
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_domain_roles udr
        WHERE udr.user_id = auth.uid()
        AND udr.domain_id = user_domain_roles.domain_id
        AND udr.role = 'head'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_domain_roles udr
        WHERE udr.user_id = auth.uid()
        AND udr.domain_id = user_domain_roles.domain_id
        AND udr.role = 'head'
    )
    AND role IN ('coordinator', 'member')
);

-- 4. Update profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS about VARCHAR(500),
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- 5. Update student_members table to link to auth user
ALTER TABLE public.student_members
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 6. RLS for events: Domain Heads and Coordinators can create events
CREATE POLICY "Domain heads and coordinators can create events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_domain_roles
        WHERE user_id = auth.uid()
        AND role IN ('head', 'coordinator')
    )
);

CREATE POLICY "Domain heads and coordinators can update their events"
ON public.events
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.event_domains ed
        JOIN public.user_domain_roles udr ON udr.domain_id = ed.domain_id
        WHERE ed.event_id = events.id
        AND udr.user_id = auth.uid()
        AND udr.role IN ('head', 'coordinator')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.event_domains ed
        JOIN public.user_domain_roles udr ON udr.domain_id = ed.domain_id
        WHERE ed.event_id = events.id
        AND udr.user_id = auth.uid()
        AND udr.role IN ('head', 'coordinator')
    )
);

-- 7. RLS for event_domains
CREATE POLICY "Domain heads and coordinators can create event domains"
ON public.event_domains
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_domain_roles
        WHERE user_id = auth.uid()
        AND domain_id = event_domains.domain_id
        AND role IN ('head', 'coordinator')
    )
);

-- 8. RLS for event_registrations (Managing Forms)
-- Domain Heads and Coordinators can view registrations for events in their domain
CREATE POLICY "Domain heads and coordinators can view registrations for their events"
ON public.event_registrations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.event_domains ed
        JOIN public.user_domain_roles udr ON udr.domain_id = ed.domain_id
        WHERE ed.event_id = event_registrations.event_id
        AND udr.user_id = auth.uid()
        AND udr.role IN ('head', 'coordinator')
    )
);
