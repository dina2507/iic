-- =====================================================================
-- SECURITY HARDENING (part 2): storage buckets
-- Applied live on 2026-06-09; committed for history. Idempotent.
-- =====================================================================

-- The `avatars` bucket had no server-side size/type limit, leaving only
-- the (bypassable) client-side check. Enforce limits at the bucket level.
UPDATE storage.buckets
SET file_size_limit   = 5242880,  -- 5 MB
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
WHERE id = 'avatars';

-- Public buckets serve objects via their public CDN URL WITHOUT consulting
-- these SELECT policies; the broad SELECT policies only enabled the LIST
-- API, letting anyone enumerate every uploaded filename. No client code
-- calls .list(), so dropping them removes the enumeration surface while
-- getPublicUrl() keeps working.
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Event images are publicly accessible"   ON storage.objects;
