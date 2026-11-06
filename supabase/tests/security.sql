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
  -- A finished activity stays finished (20261106150000), for every writer.
  BEGIN
    UPDATE public.games SET status = 'active' WHERE id = '10000000-0000-0000-0000-00000000000a';
    RAISE EXCEPTION 'a finished activity must not be reopened';
  EXCEPTION WHEN SQLSTATE 'KS409' THEN
    NULL;
  END;
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


-- Pause clock, status rules and time extensions (20261106150000).
INSERT INTO public.games (id, teacher_id, title, game_code, status, settings) VALUES
  ('10000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000000a', 'Laikas', 'CLOCK1', 'draft', '{"time_limit_minutes": 30}'),
  ('10000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-00000000000a', 'Be laiko', 'CLOCK2', 'active', '{}');

SET ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', false);
SELECT public.t_denied($q$SELECT public.set_game_status('10000000-0000-0000-0000-0000000000c1', 'active')$q$);
SELECT public.t_denied($q$SELECT public.extend_game_time('10000000-0000-0000-0000-0000000000c1', 5)$q$);
RESET ROLE;

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.role', 'authenticated', false);
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
DO $$
BEGIN
  PERFORM public.set_game_status('10000000-0000-0000-0000-0000000000c1', 'active');
  RAISE EXCEPTION 'another teacher must not change this activity';
EXCEPTION WHEN SQLSTATE 'P0002' THEN
  NULL;
END $$;

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
DO $$
DECLARE g public.games;
BEGIN
  g := public.set_game_status('10000000-0000-0000-0000-0000000000c1', 'active');
  IF g.status <> 'active' OR g.starts_at IS NULL THEN
    RAISE EXCEPTION 'starting must set the status and starts_at, got % %', g.status, g.starts_at;
  END IF;
  g := public.set_game_status('10000000-0000-0000-0000-0000000000c1', 'paused');
  IF g.paused_at IS NULL OR g.paused_ms <> 0 THEN
    RAISE EXCEPTION 'pausing must mark paused_at, got % %', g.paused_at, g.paused_ms;
  END IF;
  -- The same status again changes nothing.
  g := public.set_game_status('10000000-0000-0000-0000-0000000000c1', 'paused');
  IF g.paused_at IS NULL THEN
    RAISE EXCEPTION 'a repeated pause must keep the pause running';
  END IF;
END $$;
RESET ROLE;

-- Two minutes of pause pass (the trigger keeps the clock, so step around it).
ALTER TABLE public.games DISABLE TRIGGER games_status_rules;
UPDATE public.games SET paused_at = now() - interval '2 minutes' WHERE id = '10000000-0000-0000-0000-0000000000c1';
ALTER TABLE public.games ENABLE TRIGGER games_status_rules;

SET ROLE authenticated;
DO $$
DECLARE g public.games;
BEGIN
  g := public.set_game_status('10000000-0000-0000-0000-0000000000c1', 'active');
  IF g.paused_at IS NOT NULL OR g.paused_ms NOT BETWEEN 119000 AND 125000 THEN
    RAISE EXCEPTION 'resuming must add the pause to paused_ms, got % %', g.paused_at, g.paused_ms;
  END IF;
  IF g.resumed_at IS NULL OR g.resumed_at < now() - interval '1 minute' THEN
    RAISE EXCEPTION 'resuming must record resumed_at, got %', g.resumed_at;
  END IF;

  -- A client creates drafts only, so a paused activity cannot appear
  -- without a running pause clock.
  BEGIN
    INSERT INTO public.games (teacher_id, title, game_code, status)
      VALUES (auth.uid(), 'Iš karto pristabdyta', 'PAUSE1', 'paused');
    RAISE EXCEPTION 'a client must not insert a paused activity';
  EXCEPTION WHEN SQLSTATE 'KS409' THEN
    NULL;
  END;

  -- A client cannot set the clock fields directly.
  UPDATE public.games SET paused_ms = 0, paused_at = now() WHERE id = '10000000-0000-0000-0000-0000000000c1';
  IF (SELECT paused_ms FROM public.games WHERE id = '10000000-0000-0000-0000-0000000000c1') < 119000
     OR (SELECT paused_at FROM public.games WHERE id = '10000000-0000-0000-0000-0000000000c1') IS NOT NULL THEN
    RAISE EXCEPTION 'paused_ms and paused_at must ignore direct writes';
  END IF;

  -- A settings save while running keeps the limit and merges the rest.
  g := public.update_game_settings('10000000-0000-0000-0000-0000000000c1', '{"time_limit_minutes": 1, "show_leaderboard": false}');
  IF (g.settings ->> 'time_limit_minutes')::numeric <> 30 OR (g.settings ->> 'show_leaderboard')::boolean IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'a running settings save must keep the limit and merge the rest, got %', g.settings;
  END IF;
  -- The title and description of the same save go in the same statement.
  g := public.update_game_settings('10000000-0000-0000-0000-0000000000c1', '{"show_leaderboard": true}',
    '{"title": "Pervadinta", "description": null}');
  IF g.title <> 'Pervadinta' OR g.description IS NOT NULL OR (g.settings ->> 'show_leaderboard')::boolean IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'details must be saved with the settings, got % % %', g.title, g.description, g.settings;
  END IF;

  g := public.extend_game_time('10000000-0000-0000-0000-0000000000c1', 5);
  g := public.extend_game_time('10000000-0000-0000-0000-0000000000c1', 5);
  IF (g.settings ->> 'time_limit_minutes')::numeric <> 40 THEN
    RAISE EXCEPTION 'two extensions of 5 must give 40, got %', g.settings ->> 'time_limit_minutes';
  END IF;

  BEGIN
    PERFORM public.extend_game_time('10000000-0000-0000-0000-0000000000c2', 5);
    RAISE EXCEPTION 'an activity without a limit must not get one by extending';
  EXCEPTION WHEN SQLSTATE 'KS422' THEN
    NULL;
  END;

  g := public.set_game_status('10000000-0000-0000-0000-0000000000c1', 'finished');
  IF g.status <> 'finished' OR g.finished_at IS NULL THEN
    RAISE EXCEPTION 'finishing must set finished_at';
  END IF;
  BEGIN
    PERFORM public.set_game_status('10000000-0000-0000-0000-0000000000c1', 'active');
    RAISE EXCEPTION 'a finished activity must not be reopened';
  EXCEPTION WHEN SQLSTATE 'KS409' THEN
    NULL;
  END;
  BEGIN
    UPDATE public.games SET status = 'paused' WHERE id = '10000000-0000-0000-0000-0000000000c1';
    RAISE EXCEPTION 'a direct update must not reopen a finished activity either';
  EXCEPTION WHEN SQLSTATE 'KS409' THEN
    NULL;
  END;
  BEGIN
    PERFORM public.extend_game_time('10000000-0000-0000-0000-0000000000c1', 5);
    RAISE EXCEPTION 'a finished activity must not get more time';
  EXCEPTION WHEN SQLSTATE 'KS409' THEN
    NULL;
  END;
END $$;
RESET ROLE;

-- A server-side insert of a running or paused activity gets a consistent clock.
INSERT INTO public.games (id, teacher_id, title, game_code, status, paused_ms, paused_at, resumed_at) VALUES
  ('10000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-00000000000a', 'Serverio', 'SRVPSE', 'paused', 999, NULL, now());
DO $$
DECLARE g public.games;
BEGIN
  SELECT * INTO g FROM public.games WHERE id = '10000000-0000-0000-0000-0000000000c3';
  IF g.paused_at IS NULL OR g.paused_ms <> 0 OR g.resumed_at IS NOT NULL OR g.starts_at IS NULL THEN
    RAISE EXCEPTION 'an inserted paused activity must start its pause clock, got % % % %',
      g.paused_at, g.paused_ms, g.resumed_at, g.starts_at;
  END IF;
END $$;

-- A team that starts after a pause gets the pause offset from the database,
-- whatever the caller wrote.
INSERT INTO public.teams (id, game_id, name, session_token) VALUES
  ('30000000-0000-0000-0000-0000000000c1', '10000000-0000-0000-0000-0000000000c1', 'Vėlyva', 'token-late');
UPDATE public.teams SET started_at = now(), pause_offset_ms = 0 WHERE id = '30000000-0000-0000-0000-0000000000c1';
DO $$
DECLARE offset_ms bigint;
BEGIN
  SELECT pause_offset_ms INTO offset_ms FROM public.teams WHERE id = '30000000-0000-0000-0000-0000000000c1';
  IF offset_ms < 119000 THEN
    RAISE EXCEPTION 'a late team must start with the earlier pause as its offset, got %', offset_ms;
  END IF;
  UPDATE public.teams SET pause_offset_ms = 0, name = 'Vėlyva 2' WHERE id = '30000000-0000-0000-0000-0000000000c1';
  IF (SELECT pause_offset_ms FROM public.teams WHERE id = '30000000-0000-0000-0000-0000000000c1') <> offset_ms THEN
    RAISE EXCEPTION 'the pause offset must not change after the start';
  END IF;
END $$;

-- A task without an answer: the activity does not start with it, and a
-- running activity cannot get one.
INSERT INTO public.games (id, teacher_id, title, game_code, status) VALUES
  ('10000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-00000000000a', 'Be atsakymo', 'NOANSW', 'draft');
INSERT INTO public.challenges (id, game_id, title, answer_hash, needs_answer) VALUES
  ('20000000-0000-0000-0000-0000000000c4', '10000000-0000-0000-0000-0000000000c4', 'Kopija', '$2a$10$random', true);
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
DO $$
BEGIN
  BEGIN
    PERFORM public.set_game_status('10000000-0000-0000-0000-0000000000c4', 'active');
    RAISE EXCEPTION 'an activity with a task without an answer must not start';
  EXCEPTION WHEN SQLSTATE 'KS428' THEN
    NULL;
  END;
END $$;
RESET ROLE;
UPDATE public.challenges SET needs_answer = false WHERE id = '20000000-0000-0000-0000-0000000000c4';
SET ROLE authenticated;
DO $$
DECLARE g public.games;
BEGIN
  g := public.set_game_status('10000000-0000-0000-0000-0000000000c4', 'active');
  IF g.status <> 'active' THEN
    RAISE EXCEPTION 'an activity whose tasks all have answers must start';
  END IF;
  BEGIN
    INSERT INTO public.challenges (game_id, title, answer_hash, needs_answer)
      VALUES ('10000000-0000-0000-0000-0000000000c4', 'Bibliotekos užduotis', '$2a$10$random', true);
    RAISE EXCEPTION 'a running activity must not get a task without an answer';
  EXCEPTION WHEN SQLSTATE 'KS409' THEN
    NULL;
  END;
  -- A task with an answer may still be added.
  INSERT INTO public.challenges (game_id, title, answer_hash, needs_answer)
    VALUES ('10000000-0000-0000-0000-0000000000c4', 'Nauja užduotis', '$2a$10$real', false);
END $$;
RESET ROLE;

-- A blocked account cannot change its activity through the functions either.
UPDATE public.profiles SET status = 'blocked' WHERE id = '00000000-0000-0000-0000-00000000000a';
SET ROLE authenticated;
DO $$
BEGIN
  PERFORM public.set_game_status('10000000-0000-0000-0000-0000000000c2', 'paused');
  IF (SELECT status FROM public.games WHERE id = '10000000-0000-0000-0000-0000000000c2') = 'paused' THEN
    RAISE EXCEPTION 'a blocked account must not pause its activity';
  END IF;
EXCEPTION WHEN SQLSTATE 'P0002' OR insufficient_privilege THEN
  NULL;
END $$;
RESET ROLE;
UPDATE public.profiles SET status = 'active' WHERE id = '00000000-0000-0000-0000-00000000000a';
