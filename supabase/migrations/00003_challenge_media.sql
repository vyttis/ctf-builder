-- CTF Builder Sprint 3: Challenge Media
-- STEAM LT Klaipeda

-- ============================================
-- 1. Pridėti media laukus prie challenges
-- ============================================
ALTER TABLE public.challenges ADD COLUMN image_url text;
ALTER TABLE public.challenges ADD COLUMN maps_url text;

-- ============================================
-- 2. Storage bucket paveiksliukams
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'challenge-images',
  'challenge-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- ============================================
-- 3. Storage RLS policies
-- ============================================

-- Autentifikuoti vartotojai gali įkelti
CREATE POLICY "Authenticated users can upload challenge images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'challenge-images');

-- Visi gali skaityti (public bucket)
CREATE POLICY "Public can read challenge images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'challenge-images');

-- Savininkas gali trinti (pagal folder = user_id)
CREATE POLICY "Users can delete own challenge images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'challenge-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Savininkas gali atnaujinti
CREATE POLICY "Users can update own challenge images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'challenge-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
