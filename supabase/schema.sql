-- ==============================================================================
-- Supabase SQL Schema for FitTrack (Single-User, Protected via Next.js .env)
-- Không cần bảng auth / users trong database. Toàn bộ đăng nhập quản lý qua .env
-- ==============================================================================

-- 1. Bảng User Settings
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY DEFAULT 'default-user',
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  height REAL NOT NULL,          -- cm
  weight REAL NOT NULL,          -- kg
  activity_level REAL NOT NULL,  -- multiplier e.g. 1.55
  caloric_deficit REAL NOT NULL DEFAULT -500,  -- e.g. -500 kcal
  calculated_bmr REAL NOT NULL,
  calculated_tdee REAL NOT NULL,
  target_calories REAL NOT NULL,
  target_protein REAL NOT NULL,
  target_carb REAL NOT NULL,
  target_fat REAL NOT NULL,
  goal_weight REAL NOT NULL DEFAULT 70,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Nếu bảng đã tồn tại với kiểu id UUID hoặc có foreign key, đổi lại kiểu TEXT an toàn:
DO $$
BEGIN
  ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_id_fkey;
  ALTER TABLE user_settings ALTER COLUMN id TYPE TEXT USING id::text;
  ALTER TABLE user_settings ALTER COLUMN id SET DEFAULT 'default-user';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Bảng Daily Tracking (Dinh dưỡng, meals JSONB, supplements)
CREATE TABLE IF NOT EXISTS daily_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  date DATE NOT NULL,
  consumed_protein REAL NOT NULL DEFAULT 0,
  consumed_carb REAL NOT NULL DEFAULT 0,
  consumed_fat REAL NOT NULL DEFAULT 0,
  creatine_taken BOOLEAN NOT NULL DEFAULT FALSE,
  omega3_morning_taken BOOLEAN NOT NULL DEFAULT FALSE,
  omega3_evening_taken BOOLEAN NOT NULL DEFAULT FALSE,
  meals JSONB NOT NULL DEFAULT '{"breakfast":[],"lunch":[],"preWorkout":[],"postWorkout":[]}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Nếu bảng đã tồn tại với kiểu user_id UUID:
DO $$
BEGIN
  ALTER TABLE daily_tracking DROP CONSTRAINT IF EXISTS fk_daily_tracking_user;
  ALTER TABLE daily_tracking DROP CONSTRAINT IF EXISTS daily_tracking_user_id_fkey;
  ALTER TABLE daily_tracking ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  ALTER TABLE daily_tracking ALTER COLUMN user_id SET DEFAULT 'default-user';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE daily_tracking
  ADD COLUMN IF NOT EXISTS meals JSONB NOT NULL DEFAULT '{"breakfast":[],"lunch":[],"preWorkout":[],"postWorkout":[]}'::jsonb;

-- 3. Bảng Workout Logs (Nhật ký tập luyện & cardio)
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  workout_type TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  cardio_type TEXT,
  cardio_duration_minutes INTEGER DEFAULT 0,
  cardio_calories_burned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Nếu bảng workout_logs có foreign key tới auth.users:
DO $$
BEGIN
  ALTER TABLE workout_logs DROP CONSTRAINT IF EXISTS workout_logs_user_id_fkey;
  ALTER TABLE workout_logs ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  ALTER TABLE workout_logs ALTER COLUMN user_id SET DEFAULT 'default-user';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_tracking_user_date ON daily_tracking (user_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs (date);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs (user_id, date);

-- 4. Bật Row Level Security (RLS) mở quyền cho ứng dụng FitTrack
-- Vì toàn bộ frontend & API đã được bảo vệ 100% bằng Middleware + .env mật khẩu,
-- RLS ở Supabase chỉ cần cho phép đọc ghi thông qua anon key:
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_settings_owner_policy" ON user_settings;
DROP POLICY IF EXISTS "Allow all access on user_settings" ON user_settings;
CREATE POLICY "Allow all access on user_settings" ON user_settings
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "daily_tracking_owner_policy" ON daily_tracking;
DROP POLICY IF EXISTS "Allow all access on daily_tracking" ON daily_tracking;
CREATE POLICY "Allow all access on daily_tracking" ON daily_tracking
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "workout_logs_owner_policy" ON workout_logs;
DROP POLICY IF EXISTS "Allow all access on workout_logs" ON workout_logs;
CREATE POLICY "Allow all access on workout_logs" ON workout_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Bảng Weight Logs (Cân nặng & Link ảnh Progress Body)
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  weight REAL,
  image_url TEXT,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, logged_at)
);

-- Nếu bảng đã tồn tại với user_id UUID:
DO $$
BEGIN
  ALTER TABLE weight_logs DROP CONSTRAINT IF EXISTS weight_logs_user_id_fkey;
  ALTER TABLE weight_logs ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  ALTER TABLE weight_logs ALTER COLUMN user_id SET DEFAULT 'default-user';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_logged ON weight_logs (user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_weight_logs_logged_at ON weight_logs (logged_at);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "weight_logs_owner_policy" ON weight_logs;
DROP POLICY IF EXISTS "Allow all access on weight_logs" ON weight_logs;
CREATE POLICY "Allow all access on weight_logs" ON weight_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 6. Supabase Storage Bucket: progress-images (Public Access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-images', 'progress-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy cho bucket progress-images
DROP POLICY IF EXISTS "Public Access progress-images" ON storage.objects;
CREATE POLICY "Public Access progress-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'progress-images');

DROP POLICY IF EXISTS "Allow upload to progress-images" ON storage.objects;
CREATE POLICY "Allow upload to progress-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'progress-images');

DROP POLICY IF EXISTS "Allow update in progress-images" ON storage.objects;
CREATE POLICY "Allow update in progress-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'progress-images');

DROP POLICY IF EXISTS "Allow delete in progress-images" ON storage.objects;
CREATE POLICY "Allow delete in progress-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'progress-images');

