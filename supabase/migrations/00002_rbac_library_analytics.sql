-- CTF Builder Sprint 2: RBAC, Library, Analytics
-- STEAM LT Klaipėda

-- ============================================
-- 1. RBAC — Add super_admin role
-- ============================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('teacher', 'admin', 'super_admin'));

-- Add avatar_url column for Google OAuth
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Helper: get current user's role (SECURITY DEFINER — safe for RLS)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- 2. Updated RLS — admin/super_admin powers
-- ============================================

-- Admins can read ALL games (not just their own)
CREATE POLICY "admins_read_all_games" ON games
  FOR SELECT USING (get_my_role() IN ('admin', 'super_admin'));

-- Admins can update ALL games
CREATE POLICY "admins_update_all_games" ON games
  FOR UPDATE USING (get_my_role() IN ('admin', 'super_admin'));

-- Admins can read ALL profiles
CREATE POLICY "admins_read_all_profiles" ON profiles
  FOR SELECT USING (get_my_role() IN ('admin', 'super_admin'));

-- Super admin can update ANY profile (role changes)
CREATE POLICY "super_admin_update_profiles" ON profiles
  FOR UPDATE USING (get_my_role() = 'super_admin');

-- Admins can read ALL challenges (for library review)
CREATE POLICY "admins_read_all_challenges" ON challenges
  FOR SELECT USING (get_my_role() IN ('admin', 'super_admin'));

-- ============================================
-- 3. Update handle_new_user to capture avatar
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. LIBRARY ITEMS — shared CTF templates
-- ============================================
CREATE TABLE public.library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_game_id uuid REFERENCES games(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  subject text,
  grade_level text,
  tags text[] DEFAULT '{}',
  challenge_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb,
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'rejected')),
  published_by uuid REFERENCES profiles(id),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  clone_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_items_status ON library_items(status);
CREATE INDEX idx_library_items_published_by ON library_items(published_by);
CREATE INDEX idx_library_items_subject ON library_items(subject);

ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can see approved items + their own
CREATE POLICY "read_approved_library" ON library_items
  FOR SELECT USING (
    status = 'approved'
    OR published_by = auth.uid()
    OR get_my_role() IN ('admin', 'super_admin')
  );

-- Teachers can publish (insert)
CREATE POLICY "teacher_insert_library" ON library_items
  FOR INSERT WITH CHECK (auth.uid() = published_by);

-- Admin/super_admin can update (approve/reject)
CREATE POLICY "admin_update_library" ON library_items
  FOR UPDATE USING (
    get_my_role() IN ('admin', 'super_admin')
    OR published_by = auth.uid()
  );

-- Only super_admin can delete
CREATE POLICY "super_admin_delete_library" ON library_items
  FOR DELETE USING (get_my_role() = 'super_admin');

-- Updated_at trigger
CREATE TRIGGER update_library_items_updated_at
  BEFORE UPDATE ON library_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 5. ANALYTICS FUNCTIONS
-- ============================================

-- Platform-wide stats (admin only in app layer)
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS json AS $$
  SELECT json_build_object(
    'total_games', (SELECT count(*) FROM games),
    'active_games', (SELECT count(*) FROM games WHERE status = 'active'),
    'total_teachers', (SELECT count(*) FROM profiles WHERE role = 'teacher'),
    'total_admins', (SELECT count(*) FROM profiles WHERE role IN ('admin', 'super_admin')),
    'total_users', (SELECT count(*) FROM profiles),
    'total_teams', (SELECT count(*) FROM teams),
    'total_submissions', (SELECT count(*) FROM submissions),
    'correct_submissions', (SELECT count(*) FROM submissions WHERE is_correct = true),
    'library_items_approved', (SELECT count(*) FROM library_items WHERE status = 'approved'),
    'library_items_pending', (SELECT count(*) FROM library_items WHERE status = 'pending_review')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Per-game stats
CREATE OR REPLACE FUNCTION get_game_stats(game_uuid uuid)
RETURNS json AS $$
  SELECT json_build_object(
    'total_teams', (SELECT count(*) FROM teams WHERE game_id = game_uuid),
    'total_submissions', (
      SELECT count(*) FROM submissions s
      JOIN challenges c ON s.challenge_id = c.id
      WHERE c.game_id = game_uuid
    ),
    'correct_submissions', (
      SELECT count(*) FROM submissions s
      JOIN challenges c ON s.challenge_id = c.id
      WHERE c.game_id = game_uuid AND s.is_correct = true
    ),
    'avg_completion_time_seconds', (
      SELECT avg(EXTRACT(EPOCH FROM (s.attempted_at - t.joined_at)))
      FROM submissions s
      JOIN teams t ON s.team_id = t.id
      JOIN challenges c ON s.challenge_id = c.id
      WHERE c.game_id = game_uuid AND s.is_correct = true
    ),
    'challenge_stats', (
      SELECT coalesce(json_agg(cs ORDER BY cs.order_index), '[]'::json)
      FROM (
        SELECT
          c.id AS challenge_id,
          c.title,
          c.order_index,
          c.points,
          count(s.id) AS attempts,
          count(s.id) FILTER (WHERE s.is_correct = true) AS solves,
          CASE
            WHEN count(DISTINCT s.team_id) FILTER (WHERE s.is_correct = true) > 0
            THEN round(count(s.id)::numeric / count(DISTINCT s.team_id) FILTER (WHERE s.is_correct = true), 1)
            ELSE 0
          END AS avg_attempts_to_solve
        FROM challenges c
        LEFT JOIN submissions s ON s.challenge_id = c.id
        WHERE c.game_id = game_uuid
        GROUP BY c.id, c.title, c.order_index, c.points
      ) cs
    )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
