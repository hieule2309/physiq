'use client'

import { supabase } from './supabase'
import type { FoodEntry, MealId } from './fitness'

/* ---------- Types matching Supabase tables ---------- */

export type UserSettings = {
  id: string
  age: number
  gender: 'male' | 'female'
  height: number
  weight: number
  activity_level: number
  caloric_deficit: number
  calculated_bmr: number
  calculated_tdee: number
  target_calories: number
  target_protein: number
  target_carb: number
  target_fat: number
  goal_weight: number
}

export type DailyTracking = {
  id: string
  user_id: string
  date: string
  consumed_protein: number
  consumed_carb: number
  consumed_fat: number
  creatine_taken: boolean
  omega3_morning_taken: boolean
  omega3_evening_taken: boolean
  meals?: Record<MealId, FoodEntry[]>
}

/* ---------- Default user ID (single-user app) ---------- */

const DEFAULT_USER_ID = 'default-user'

/* ---------- User Settings CRUD ---------- */

export async function getUserSettings(): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', DEFAULT_USER_ID)
    .single()

  if (error || !data) return null
  return data as UserSettings
}

export async function upsertUserSettings(
  settings: Omit<UserSettings, 'id'>,
): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({ id: DEFAULT_USER_ID, ...settings }, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    console.error('Error upserting user_settings:', error)
    return null
  }
  return data as UserSettings
}

/* ---------- Daily Tracking CRUD ---------- */

export async function getDailyTracking(date: string): Promise<DailyTracking | null> {
  const { data, error } = await supabase
    .from('daily_tracking')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .eq('date', date)
    .single()

  if (error || !data) return null
  return data as DailyTracking
}

export async function upsertDailyTracking(
  date: string,
  tracking: Partial<Omit<DailyTracking, 'id' | 'user_id' | 'date'>>,
): Promise<DailyTracking | null> {
  const existing = await getDailyTracking(date)

  const payload = {
    user_id: DEFAULT_USER_ID,
    date,
    consumed_protein: tracking.consumed_protein ?? existing?.consumed_protein ?? 0,
    consumed_carb: tracking.consumed_carb ?? existing?.consumed_carb ?? 0,
    consumed_fat: tracking.consumed_fat ?? existing?.consumed_fat ?? 0,
    creatine_taken: tracking.creatine_taken ?? existing?.creatine_taken ?? false,
    omega3_morning_taken:
      tracking.omega3_morning_taken ?? existing?.omega3_morning_taken ?? false,
    omega3_evening_taken:
      tracking.omega3_evening_taken ?? existing?.omega3_evening_taken ?? false,
    meals:
      tracking.meals ??
      existing?.meals ?? { breakfast: [], lunch: [], preWorkout: [], postWorkout: [] },
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('daily_tracking')
    .upsert(payload, { onConflict: 'user_id,date' })
    .select()
    .single()

  if (error) {
    console.error('Error upserting daily_tracking:', error)
    return null
  }
  return data as DailyTracking
}

/* ---------- Workout Logs CRUD ---------- */

export type WorkoutExerciseItem = {
  exercise_name: string
  sets: number
}

export type WorkoutLog = {
  id?: string
  user_id?: string | null
  date: string
  workout_type: string
  exercises: WorkoutExerciseItem[]
  cardio_type: string | null
  cardio_duration_minutes: number
  cardio_calories_burned: number
  created_at?: string
  updated_at?: string
}

export async function getWorkoutLog(date: string): Promise<WorkoutLog | null> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data as WorkoutLog
}

export async function saveWorkoutLogInSupabase(
  log: Omit<WorkoutLog, 'id' | 'created_at' | 'updated_at'>,
): Promise<WorkoutLog | null> {
  let userId: string | null = null
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user?.id) {
      userId = session.user.id
    }
  } catch {}

  const existing = await getWorkoutLog(log.date)

  const payload: Record<string, unknown> = {
    date: log.date,
    workout_type: log.workout_type,
    exercises: log.exercises,
    cardio_type: log.cardio_type,
    cardio_duration_minutes: log.cardio_duration_minutes,
    cardio_calories_burned: log.cardio_calories_burned,
    updated_at: new Date().toISOString(),
  }

  if (userId) {
    payload.user_id = userId
  }

  let result
  if (existing?.id) {
    result = await supabase
      .from('workout_logs')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single()
  } else {
    result = await supabase
      .from('workout_logs')
      .insert(payload)
      .select()
      .single()
  }

  if (result.error) {
    console.error('Error saving workout log to Supabase:', result.error)
    return null
  }
  return result.data as WorkoutLog
}
