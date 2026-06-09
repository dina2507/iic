-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket policies
-- Public can read
CREATE POLICY "Avatar images are publicly accessible." 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Authenticated users can insert
CREATE POLICY "Anyone can upload an avatar." 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Users can update/delete their own avatar
CREATE POLICY "Anyone can update their own avatar." 
ON storage.objects FOR UPDATE 
TO authenticated
USING (auth.uid() = owner) 
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can delete their own avatar." 
ON storage.objects FOR DELETE 
TO authenticated
USING (auth.uid() = owner AND bucket_id = 'avatars');
