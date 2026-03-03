-- Secure answer_hash column from anonymous (player) access
-- CRITICAL: Players could read answer_hash via Supabase client browser console
-- answer_hash is stored as normalized plaintext (lower+trim), so exposure = full answer leak
--
-- Fix: Revoke broad SELECT from anon on challenges table,
--       then grant SELECT only on safe columns.
-- Teachers (authenticated role) retain full access.
-- check_answer() function uses SECURITY DEFINER so it can still read answer_hash.

-- Remove anon's ability to read ALL columns
revoke select on public.challenges from anon;

-- Grant anon access to only the safe columns (everything except answer_hash)
grant select (
  id,
  game_id,
  title,
  description,
  type,
  points,
  hints,
  options,
  order_index,
  image_url,
  maps_url,
  created_at,
  updated_at
) on public.challenges to anon;
