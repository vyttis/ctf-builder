-- Security checks for answers, roles, library moderation and stats.
-- Runs after bootstrap.sql and every migration (scripts/test-db.sh).
\set ON_ERROR_STOP on

-- Helpers: a query must fail with insufficient_privilege (42501), or succeed.
CREATE FUNCTION public.t_denied(q text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE q;
  EXCEPTION WHEN insufficient_privilege THEN
    RETURN;
  END;
  RAISE EXCEPTION 'expected permission denied, query ran: %', q;
END $$;
CREATE FUNCTION public.t_ok(q text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE q;
END $$;
CREATE FUNCTION public.t_rows(q text, expected int) RETURNS void LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  EXECUTE format('SELECT count(*) FROM (%s) x', q) INTO n;
  IF n <> expected THEN
    RAISE EXCEPTION 'expected % rows, got %: %', expected, n, q;
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.t_denied(text), public.t_ok(text), public.t_rows(text, int)
  TO anon, authenticated, service_role;

-- Two teachers, one active activity each, one admin.
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'a@example.lt'),
  ('00000000-0000-0000-0000-00000000000b', 'b@example.lt'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin@example.lt'),
  ('00000000-0000-0000-0000-0000000000ee', 'pending@example.lt');
UPDATE public.profiles SET role = 'super_admin' WHERE id = '00000000-0000-0000-0000-0000000000ad';
-- Approved accounts; ...ee stays as it was created (waiting for approval).
UPDATE public.profiles SET status = 'active'
  WHERE id IN ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000ad');

INSERT INTO public.games (id, teacher_id, title, game_code, status) VALUES
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'A', 'AAAAAA', 'active'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b', 'B', 'BBBBBB', 'active');
INSERT INTO public.challenges (id, game_id, title, answer_hash, explanation) VALUES
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'A1', '$2a$10$hashA', 'A sprendimas'),
  ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b', 'B1', '$2a$10$hashB', 'B sprendimas');
INSERT INTO public.teams (id, game_id, name, session_token) VALUES
  ('30000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b', 'Komanda', 'token-b');
INSERT INTO public.submissions (team_id, challenge_id, answer, is_correct, points_awarded) VALUES
  ('30000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-00000000000b', 'teisingas', true, 100);

-- Signed in as teacher A, looking at teacher B's activity.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
SELECT set_config('request.jwt.claim.role', 'authenticated', false);

SELECT public.t_denied('SELECT answer_hash FROM public.challenges');
SELECT public.t_denied('SELECT * FROM public.challenges');
SELECT public.t_denied('SELECT answer FROM public.submissions');
SELECT public.t_denied('SELECT * FROM public.submissions');
-- What pages and the live view still read keeps working.
SELECT public.t_ok('SELECT id, title, hints, options, needs_answer, explanation, verification_issues FROM public.challenges');
-- Only own tasks: explanations of other activities stay hidden.
SELECT public.t_rows('SELECT id FROM public.challenges', 1);
SELECT public.t_rows($q$SELECT explanation FROM public.challenges WHERE game_id = '10000000-0000-0000-0000-00000000000b'$q$, 0);
SELECT public.t_ok('SELECT count(*) FROM public.challenges');
SELECT public.t_ok('SELECT id, team_id, challenge_id, is_correct, points_awarded, attempted_at FROM public.submissions');
SELECT public.t_ok('SELECT g.id, (SELECT count(*) FROM public.challenges c WHERE c.game_id = g.id) FROM public.games g');

-- Own profile: contact details yes, role no.
SELECT public.t_ok($q$UPDATE public.profiles SET full_name = 'Vardenis', school = 'Mokykla', phone = NULL, onboarding_completed = true WHERE id = auth.uid()$q$);
SELECT public.t_denied($q$UPDATE public.profiles SET role = 'super_admin' WHERE id = auth.uid()$q$);
SELECT public.t_denied($q$UPDATE public.profiles SET email = 'x@example.lt' WHERE id = auth.uid()$q$);
SELECT public.t_denied($q$INSERT INTO public.profiles (id, email, role) VALUES (gen_random_uuid(), 'x@example.lt', 'super_admin')$q$);

-- Own statistics fields yes; status, DI limit, approval no.
SELECT public.t_ok($q$UPDATE public.profiles SET first_name = 'Vardenis', last_name = 'Pavardenis', school_code = '190000000', municipality = 'Klaipėdos m.', subjects = '{Matematika}', grades = '{5-8}', consent_at = now() WHERE id = auth.uid()$q$);
SELECT public.t_denied($q$UPDATE public.profiles SET status = 'active' WHERE id = auth.uid()$q$);
SELECT public.t_denied($q$UPDATE public.profiles SET ai_monthly_limit = 100000 WHERE id = auth.uid()$q$);
SELECT public.t_denied($q$UPDATE public.profiles SET approved_at = now() WHERE id = auth.uid()$q$);
-- Server-only tables.
SELECT public.t_denied('SELECT * FROM public.access_requests');
SELECT public.t_denied($q$INSERT INTO public.access_requests (email, first_name, last_name, school_name, source) VALUES ('x@example.lt', 'A', 'B', 'Mokykla', 'qr')$q$);
SELECT public.t_denied('SELECT * FROM public.admin_audit_log');
SELECT public.t_denied('SELECT * FROM public.request_links');
SELECT public.t_denied('SELECT * FROM public.ai_usage');
SELECT public.t_denied('SELECT * FROM public.platform_settings');

-- Library: only new items in review.
SELECT public.t_ok($q$INSERT INTO public.library_items (title, published_by, status) VALUES ('Šablonas', auth.uid(), 'pending_review')$q$);
SELECT public.t_denied($q$INSERT INTO public.library_items (title, published_by, status) VALUES ('Šablonas', auth.uid(), 'approved')$q$);
SELECT public.t_denied($q$INSERT INTO public.library_items (title, published_by, status, reviewed_by) VALUES ('Šablonas', auth.uid(), 'pending_review', auth.uid())$q$);

-- Stats and reflections: own activity yes, someone else's no.
SELECT public.t_ok($q$SELECT public.get_game_stats('10000000-0000-0000-0000-00000000000a')$q$);
SELECT public.t_ok($q$SELECT public.get_game_reflections('10000000-0000-0000-0000-00000000000a')$q$);
SELECT public.t_denied($q$SELECT public.get_game_stats('10000000-0000-0000-0000-00000000000b')$q$);
SELECT public.t_denied($q$SELECT public.get_game_reflections('10000000-0000-0000-0000-00000000000b')$q$);
SELECT public.t_denied($q$SELECT public.get_platform_stats()$q$);
SELECT public.t_denied($q$SELECT public.get_game_stats_unchecked('10000000-0000-0000-0000-00000000000b')$q$);
RESET ROLE;

-- Admin: platform stats and any activity.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000ad', false);
SELECT public.t_ok($q$SELECT public.get_platform_stats()$q$);
SELECT public.t_ok($q$SELECT public.get_game_stats('10000000-0000-0000-0000-00000000000b')$q$);
SELECT public.t_rows('SELECT id FROM public.challenges', 2);
SELECT public.t_denied('SELECT answer_hash FROM public.challenges');
RESET ROLE;

-- Anonymous participant.
SET ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', false);
SELECT set_config('request.jwt.claim.role', 'anon', false);
SELECT public.t_denied('SELECT answer_hash FROM public.challenges');
SELECT public.t_denied('SELECT answer FROM public.submissions');
SELECT public.t_ok('SELECT id, title, hints FROM public.challenges');
SELECT public.t_denied('SELECT explanation FROM public.challenges');
SELECT public.t_rows('SELECT id FROM public.challenges', 2);
SELECT public.t_denied($q$SELECT public.get_game_stats('10000000-0000-0000-0000-00000000000b')$q$);
SELECT public.t_denied($q$SELECT public.get_game_reflections('10000000-0000-0000-0000-00000000000b')$q$);
SELECT public.t_denied($q$SELECT public.get_platform_stats()$q$);
SELECT public.t_denied($q$UPDATE public.profiles SET role = 'super_admin'$q$);
SELECT public.t_denied('SELECT * FROM public.access_requests');
SELECT public.t_denied('SELECT * FROM public.ai_usage');
RESET ROLE;

-- New accounts wait for approval; the service role activates them.
DO $$
BEGIN
  IF (SELECT status FROM public.profiles WHERE id = '00000000-0000-0000-0000-0000000000ee') <> 'pending' THEN
    RAISE EXCEPTION 'a new profile must start as pending';
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public) VALUES ('challenge-images', 'challenge-images', true)
  ON CONFLICT DO NOTHING;

-- A pending account cannot write facilitator data through the REST API;
-- an active one can.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000ee', false);
SELECT set_config('request.jwt.claim.role', 'authenticated', false);
SELECT public.t_denied($q$INSERT INTO public.games (teacher_id, title, game_code) VALUES (auth.uid(), 'Laukia', 'PPPPPP')$q$);
SELECT public.t_denied($q$INSERT INTO public.library_items (title, published_by, status) VALUES ('Šablonas', auth.uid(), 'pending_review')$q$);
SELECT public.t_denied($q$INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('challenge-images', '00000000-0000-0000-0000-0000000000ee/x.png', auth.uid())$q$);
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
SELECT public.t_ok($q$INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('challenge-images', '00000000-0000-0000-0000-00000000000a/x.png', auth.uid())$q$);
SELECT public.t_ok($q$INSERT INTO public.games (teacher_id, title, game_code) VALUES (auth.uid(), 'Aktyvus', 'QQQQQQ')$q$);
SELECT public.t_ok($q$UPDATE public.games SET title = 'A2' WHERE id = '10000000-0000-0000-0000-00000000000a'$q$);
RESET ROLE;
-- Blocking an account stops its writes at once.
UPDATE public.profiles SET status = 'blocked' WHERE id = '00000000-0000-0000-0000-00000000000a';
SET ROLE authenticated;
SELECT public.t_denied($q$INSERT INTO public.games (teacher_id, title, game_code) VALUES (auth.uid(), 'Blokuotas', 'RRRRRR')$q$);
UPDATE public.games SET title = 'pakeista' WHERE id = '10000000-0000-0000-0000-00000000000a';
RESET ROLE;
DO $$
BEGIN
  IF (SELECT title FROM public.games WHERE id = '10000000-0000-0000-0000-00000000000a') <> 'A2' THEN
    RAISE EXCEPTION 'a blocked account must not update its activities';
  END IF;
END $$;
UPDATE public.profiles SET status = 'active' WHERE id = '00000000-0000-0000-0000-00000000000a';

-- A blocked admin keeps a session but loses admin powers and profile edits.
UPDATE public.profiles SET status = 'blocked' WHERE id = '00000000-0000-0000-0000-0000000000ad';
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000ad', false);
SELECT public.t_denied($q$SELECT public.get_platform_stats()$q$);
SELECT public.t_denied($q$SELECT public.get_game_stats('10000000-0000-0000-0000-00000000000b')$q$);
SELECT public.t_rows('SELECT id FROM public.profiles', 1);
UPDATE public.profiles SET full_name = 'Pakeista' WHERE id = auth.uid();
RESET ROLE;
DO $$
BEGIN
  IF (SELECT full_name FROM public.profiles WHERE id = '00000000-0000-0000-0000-0000000000ad') IS NOT DISTINCT FROM 'Pakeista' THEN
    RAISE EXCEPTION 'a blocked account must not update its profile';
  END IF;
END $$;
UPDATE public.profiles SET status = 'active' WHERE id = '00000000-0000-0000-0000-0000000000ad';
SET ROLE authenticated;
SELECT public.t_ok($q$SELECT public.get_platform_stats()$q$);
RESET ROLE;

-- finished_at follows the status and cannot be moved by hand.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
UPDATE public.games SET status = 'finished' WHERE id = '10000000-0000-0000-0000-00000000000a';
UPDATE public.games SET finished_at = now() + interval '30 days', title = 'A3' WHERE id = '10000000-0000-0000-0000-00000000000a';
RESET ROLE;
DO $$
DECLARE f timestamptz;
BEGIN
  SELECT finished_at INTO f FROM public.games WHERE id = '10000000-0000-0000-0000-00000000000a';
  IF f IS NULL OR f > now() + interval '1 minute' THEN
    RAISE EXCEPTION 'finished_at must be set by the trigger, got %', f;
  END IF;
  UPDATE public.games SET status = 'active' WHERE id = '10000000-0000-0000-0000-00000000000a';
  IF (SELECT finished_at FROM public.games WHERE id = '10000000-0000-0000-0000-00000000000a') IS NOT NULL THEN
    RAISE EXCEPTION 'reopening must clear finished_at';
  END IF;
END $$;

-- A request link stops at its limit.
DO $$
DECLARE link uuid;
BEGIN
  INSERT INTO public.request_links (token, label, max_uses) VALUES ('test-token-aaaaaaaaaaaaaa', 'Seminaras', 1) RETURNING id INTO link;
  INSERT INTO public.access_requests (email, first_name, last_name, school_name, source, source_link_id)
    VALUES ('l1@example.lt', 'A', 'B', 'Mokykla', 'link', link);
  BEGIN
    INSERT INTO public.access_requests (email, first_name, last_name, school_name, source, source_link_id)
      VALUES ('l2@example.lt', 'A', 'B', 'Mokykla', 'link', link);
    RAISE EXCEPTION 'a second request over the limit must fail';
  EXCEPTION WHEN SQLSTATE 'KS410' THEN
    NULL;
  END;
  UPDATE public.request_links SET max_uses = NULL, revoked_at = now() WHERE id = link;
  BEGIN
    INSERT INTO public.access_requests (email, first_name, last_name, school_name, source, source_link_id)
      VALUES ('l3@example.lt', 'A', 'B', 'Mokykla', 'link', link);
    RAISE EXCEPTION 'a revoked link must not take requests';
  EXCEPTION WHEN SQLSTATE 'KS410' THEN
    NULL;
  END;
END $$;

-- Service role (server API): everything it uses today.
SET ROLE service_role;
SELECT set_config('request.jwt.claim.role', 'service_role', false);
SELECT public.t_ok('SELECT answer_hash FROM public.challenges');
SELECT public.t_ok('SELECT answer FROM public.submissions');
SELECT public.t_ok($q$SELECT public.get_game_stats('10000000-0000-0000-0000-00000000000b')$q$);
SELECT public.t_ok($q$UPDATE public.profiles SET role = 'teacher', status = 'active' WHERE id = '00000000-0000-0000-0000-00000000000a'$q$);
SELECT public.t_ok($q$INSERT INTO public.access_requests (email, first_name, last_name, school_name, source) VALUES ('x@example.lt', 'A', 'B', 'Mokykla', 'qr')$q$);
SELECT public.t_ok($q$INSERT INTO public.ai_usage (user_id, request_id, endpoint, model, input_tokens, output_tokens, cost_usd) VALUES ('00000000-0000-0000-0000-00000000000a', gen_random_uuid(), 'di/generate', 'claude', 1000, 500, 0.01)$q$);
SELECT public.t_rows('SELECT * FROM public.platform_settings', 1);
RESET ROLE;

