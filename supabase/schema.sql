-- Supabase SQL Schema for FitTrack
-- Run this in Supabase SQL Editor

-- 1. User Settings Table
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

-- 2. Daily Tracking Table (with meals JSONB support)
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

-- For existing databases: add meals column if it doesn't exist yet
ALTER TABLE daily_tracking
  ADD COLUMN IF NOT EXISTS meals JSONB NOT NULL DEFAULT '{"breakfast":[],"lunch":[],"preWorkout":[],"postWorkout":[]}'::jsonb;

-- 3. Workout Logs Table
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  workout_type TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  cardio_type TEXT,
  cardio_duration_minutes INTEGER DEFAULT 0,
  cardio_calories_burned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_tracking_user_date ON daily_tracking (user_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs (date);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs (user_id, date);

-- RLS (Row Level Security) - Allow public access for single-user app
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on user_settings" ON user_settings;
CREATE POLICY "Allow all access on user_settings" ON user_settings
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access on daily_tracking" ON daily_tracking;
CREATE POLICY "Allow all access on daily_tracking" ON daily_tracking
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access on workout_logs" ON workout_logs;
CREATE POLICY "Allow all access on workout_logs" ON workout_logs
  FOR ALL USING (true) WITH CHECK (true);
