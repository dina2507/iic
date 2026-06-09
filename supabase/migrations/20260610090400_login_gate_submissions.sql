-- Require login before submitting membership-related forms (anti-spam / brute-force).
-- Idea submissions and join requests now require an authenticated (VIT) account.
-- Contact submissions remain public (a captcha will be added separately).

DROP POLICY IF EXISTS "Anyone can submit ideas" ON public.idea_submissions;
CREATE POLICY "Authenticated users can submit ideas"
ON public.idea_submissions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can submit join requests" ON public.join_requests;
CREATE POLICY "Authenticated users can submit join requests"
ON public.join_requests FOR INSERT TO authenticated WITH CHECK (true);

-- contact_submissions: unchanged (stays open to the public).
