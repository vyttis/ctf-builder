-- ============================================
-- 00025: Security Advisor fixes (applied in production 2026-11-05)
-- ============================================
-- Applied manually via the SQL Editor, like earlier migrations
-- (see docs/migration-history.md). Idempotent.
--
-- Context: on 2026-11-05 production was missing 00021 (needs_answer), which
-- broke the game page and challenge creation. 00021 was applied the same day
-- after copying public.challenges to backup_20261105.challenges (RLS on,
-- schema not exposed through the API).

-- 1. Pin search_path on public functions ("Function Search Path Mutable").
--    Same resolution order PostgREST uses (public, extensions), pg_temp last.
--    Rollback per function: ALTER FUNCTION <signature> RESET search_path;
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
      AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%')
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions, pg_temp', r.sig);
  END LOOP;
END $$;

-- 2. challenge-images: stop public listing ("Public Bucket Allows Listing")
--    and keep uploads inside the uploader's own folder. Public object URLs
--    keep working because the bucket is public.
BEGIN;
DROP POLICY IF EXISTS "Public can read challenge images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can read own challenge images" ON storage.objects;
CREATE POLICY "Owners can read own challenge images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'challenge-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Authenticated users can upload challenge images" ON storage.objects;
CREATE POLICY "Authenticated users can upload challenge images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'challenge-images' AND (storage.foldername(name))[1] = auth.uid()::text);
COMMIT;
