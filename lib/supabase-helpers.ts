'use client'

import { supabase } from './supabase'
import type { FoodEntry, MealId } from './fitness'
import { convertImageToWebP } from './image-utils'

export { convertImageToWebP }

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

/* ---------- Single-user App Constants ---------- */

const DEFAULT_USER_ID = 'default-user'

export async function getCurrentUserId(): Promise<string> {
  return DEFAULT_USER_ID
}

export async function signOut(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' })
  } finally {
    window.location.href = '/login'
  }
}

/* ---------- User Settings CRUD ---------- */

export async function getUserSettings(): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', DEFAULT_USER_ID)
    .maybeSingle()

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
    .maybeSingle()

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

/* ---------- Analytics Range Fetching ---------- */

export async function getAnalyticsDataFromSupabase(startDate: string, endDate: string) {
  try {
    const [trackingRes, workoutsRes] = await Promise.all([
      supabase
        .from('daily_tracking')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true }),
      supabase
        .from('workout_logs')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true }),
    ])

    return {
      tracking: (trackingRes.data ?? []) as DailyTracking[],
      workouts: (workoutsRes.data ?? []) as WorkoutLog[],
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return {
      tracking: [],
      workouts: [],
    }
  }
}

/* ---------- Weight Logs & Progress Images CRUD ---------- */

export type WeightLog = {
  id?: string
  user_id?: string | null
  weight: number | null
  image_url: string | null
  logged_at: string
  created_at?: string
  updated_at?: string
}

export async function getWeightLog(loggedAt: string): Promise<WeightLog | null> {
  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('logged_at', loggedAt)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data as WeightLog
}

export async function getAllWeightLogs(): Promise<WeightLog[]> {
  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .order('logged_at', { ascending: true })

  if (error || !data) return []
  return data as WeightLog[]
}

export async function saveWeightLogInSupabase(
  weight: number | null,
  loggedAt: string,
): Promise<WeightLog | null> {
  const userId = await getCurrentUserId()
  const existing = await getWeightLog(loggedAt)

  const payload = {
    user_id: userId,
    logged_at: loggedAt,
    weight,
    image_url: existing?.image_url ?? null,
    updated_at: new Date().toISOString(),
  }

  let result
  if (existing?.id) {
    result = await supabase
      .from('weight_logs')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single()
  } else {
    result = await supabase
      .from('weight_logs')
      .insert(payload)
      .select()
      .single()
  }

  if (result.error) {
    console.error('Error saving weight log to Supabase:', result.error)
    return null
  }
  return result.data as WeightLog
}

export async function saveWeightImageInSupabase(
  imageUrl: string | null,
  loggedAt: string,
): Promise<WeightLog | null> {
  const userId = await getCurrentUserId()
  const existing = await getWeightLog(loggedAt)

  const payload = {
    user_id: userId,
    logged_at: loggedAt,
    weight: existing?.weight ?? null,
    image_url: imageUrl,
    updated_at: new Date().toISOString(),
  }

  let result
  if (existing?.id) {
    result = await supabase
      .from('weight_logs')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single()
  } else {
    result = await supabase
      .from('weight_logs')
      .insert(payload)
      .select()
      .single()
  }

  if (result.error) {
    console.error('Error saving progress image url to Supabase:', result.error)
    return null
  }
  return result.data as WeightLog
}

export async function uploadProgressImage(
  file: File,
  loggedAt: string,
): Promise<string> {
  const userId = await getCurrentUserId()

  // 1. Client-side conversion to WebP format (with graceful fallback)
  let uploadBlob: Blob
  try {
    uploadBlob = await convertImageToWebP(file, 1200, 0.82)
  } catch (convErr) {
    console.warn('convertImageToWebP warning, fallback to original file:', convErr)
    uploadBlob = file
  }

  // Determine appropriate content-type and file extension
  let contentType = uploadBlob.type || 'image/webp'
  let extension = 'webp'
  if (contentType === 'image/jpeg') {
    extension = 'jpg'
  } else if (contentType === 'image/png') {
    extension = 'png'
  } else if (!contentType.startsWith('image/')) {
    contentType = 'image/webp'
  }

  const filename = `${userId}/${loggedAt}_${Date.now()}.${extension}`

  // 2. Upload to Supabase Storage 'progress-images' bucket
  const { error: uploadError } = await supabase.storage
    .from('progress-images')
    .upload(filename, uploadBlob, {
      contentType,
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    console.error('Supabase storage upload error:', uploadError)
    throw new Error(uploadError.message || 'Lỗi khi upload ảnh lên Supabase Storage')
  }

  // 3. Get Public URL
  const { data } = supabase.storage.from('progress-images').getPublicUrl(filename)
  const publicUrl = data.publicUrl

  // 4. Update image_url in weight_logs
  await saveWeightImageInSupabase(publicUrl, loggedAt)

  return publicUrl
}

export async function deleteProgressImage(loggedAt: string): Promise<boolean> {
  const existing = await getWeightLog(loggedAt)
  if (existing?.image_url) {
    try {
      const urlParts = existing.image_url.split('/progress-images/')
      if (urlParts.length > 1) {
        const filePath = decodeURIComponent(urlParts[1].split('?')[0])
        await supabase.storage.from('progress-images').remove([filePath])
      }
    } catch (e) {
      console.warn('Could not remove file from storage:', e)
    }
  }

  await saveWeightImageInSupabase(null, loggedAt)
  return true
}



