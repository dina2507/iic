-- Drop the recursive policy
DROP POLICY IF EXISTS "Domain heads can manage roles for their domain" ON public.user_domain_roles;

-- Create separate policies for INSERT, UPDATE, DELETE to avoid infinite recursion with SELECT
CREATE POLICY "Domain heads can insert roles for their domain"
ON public.user_domain_roles
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_domain_roles udr
        WHERE udr.user_id = auth.uid()
        AND udr.domain_id = user_domain_roles.domain_id
        AND udr.role = 'head'
    )
    AND role IN ('coordinator', 'member')
);

CREATE POLICY "Domain heads can update roles for their domain"
ON public.user_domain_roles
FOR UPDATE
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

CREATE POLICY "Domain heads can delete roles for their domain"
ON public.user_domain_roles
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_domain_roles udr
        WHERE udr.user_id = auth.uid()
        AND udr.domain_id = user_domain_roles.domain_id
        AND udr.role = 'head'
    )
);
