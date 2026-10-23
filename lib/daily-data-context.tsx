'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  createEmptyDay,
  dayTotals,
  round1,
  type DayLog,
  type FoodEntry,
  type MealId,
} from './fitness'
import {
  getDailyTracking,
  getWorkoutLog,
  upsertDailyTracking,
  saveWorkoutLogInSupabase,
  getAllWeightLogs,
  getWeightLog,
  saveWeightLogInSupabase,
  saveWeightImageInSupabase,
  type DailyTracking,
  type WorkoutLog,
} from './supabase-helpers'
import { WORKOUT_TYPES, CARDIO_TYPES, uid, type CardioType, type WorkoutType } from './fitness'

/* ---------- PhotoMap type (replaces storage.ts export) ---------- */
export type PhotoMap = Record<string, string>

/* ---------- Context shape ---------- */
type DailyDataContextType = {
  /** Get the DayLog for a given date key (yyyy-mm-dd). Returns EMPTY_DAY if not loaded. */
  getDay: (date: string) => DayLog
  /** Update a day's data locally + sync to Supabase */
  updateDay: (date: string, fn: (prev: DayLog) => DayLog) => void
  /** Push nutrition/supplements data to Supabase daily_tracking */
  syncDailyTracking: (date: string, dayOverride?: DayLog) => Promise<void>
  /** Fetch & load a specific date from Supabase */
  fetchDate: (date: string) => Promise<void>
  /** Whether the initial load for a given date is in progress */
  isLoading: (date: string) => boolean
  /** Photos map: date -> URL */
  photos: PhotoMap
  /** Set a photo URL for a date */
  setPhoto: (date: string, url: string) => void
  /** Remove photo for a date */
  removePhoto: (date: string) => void
  /** Weight logs - all weight data from Supabase */
  weightData: Map<string, number | null>
  /** All days data for analytics */
  days: Record<string, DayLog>
}

const DailyDataContext = createContext<DailyDataContextType | null>(null)

export function useDailyData() {
  const ctx = useContext(DailyDataContext)
  if (!ctx) throw new Error('useDailyData must be used within DailyDataProvider')
  return ctx
}

/* ---------- Provider ---------- */

export function DailyDataProvider({ children }: { children: ReactNode }) {
  const [days, setDays] = useState<Record<string, DayLog>>({})
  const [photos, setPhotos] = useState<PhotoMap>({})
  const [loadingDates, setLoadingDates] = useState<Set<string>>(new Set())
  const [weightData, setWeightData] = useState<Map<string, number | null>>(new Map())
  const fetchedDatesRef = useRef<Set<string>>(new Set())
  const initialLoadDone = useRef(false)

  // Initial load: fetch all weight logs & photos from Supabase (once)
  useEffect(() => {
    if (initialLoadDone.current) return
    initialLoadDone.current = true

    async function loadInitial() {
      try {
        const allLogs = await getAllWeightLogs()
        if (allLogs && allLogs.length > 0) {
          const newWeightData = new Map<string, number | null>()
          const newPhotos: PhotoMap = {}
          const dayUpdates: Record<string, Partial<DayLog>> = {}

          allLogs.forEach((log) => {
            if (log.logged_at) {
              if (typeof log.weight === 'number') {
                newWeightData.set(log.logged_at, log.weight)
                dayUpdates[log.logged_at] = {
                  ...(dayUpdates[log.logged_at] || {}),
                  weight: log.weight,
                }
              }
              if (log.image_url) {
                newPhotos[log.logged_at] = log.image_url
              }
            }
          })

          setWeightData(newWeightData)
          setPhotos((prev) => ({ ...prev, ...newPhotos }))
          setDays((prev) => {
            const next = { ...prev }
            for (const [dateKey, partial] of Object.entries(dayUpdates)) {
              const existing = next[dateKey] ?? createEmptyDay()
              next[dateKey] = { ...existing, ...partial }
            }
            return next
          })
        }
      } catch (err) {
        console.error('Error loading initial weight/photo data:', err)
      }
    }

    loadInitial()
  }, [])

  // Fetch a single date's data from Supabase (daily_tracking + workout_logs + weight_logs)
  const fetchDate = useCallback(async (date: string) => {
    if (fetchedDatesRef.current.has(date)) return
    fetchedDatesRef.current.add(date)

    setLoadingDates((prev) => new Set(prev).add(date))

    try {
      const [tracking, workout, weight] = await Promise.all([
        getDailyTracking(date),
        getWorkoutLog(date),
        getWeightLog(date),
      ])

      setDays((prev) => {
        const existing = prev[date] ?? createEmptyDay()
        let updated = { ...existing }

        // Merge daily_tracking (meals, supplements, macros)
        if (tracking) {
          const remoteMeals = tracking.meals
          const hasRemoteMeals =
            remoteMeals && Object.values(remoteMeals).some((m) => m && m.length > 0)
          const hasLocalMeals = Object.values(updated.meals).some((m) => m.length > 0)

          updated = {
            ...updated,
            supplements: {
              ...updated.supplements,
              creatine: tracking.creatine_taken,
              omega3Morning: tracking.omega3_morning_taken,
              omega3Evening: tracking.omega3_evening_taken,
            },
            meals: !hasLocalMeals && hasRemoteMeals ? remoteMeals! : updated.meals,
          }
        }

        // Merge workout_logs
        if (workout) {
          const matchedType = WORKOUT_TYPES.find(
            (w) => w.label.toLowerCase() === workout.workout_type.toLowerCase(),
          )
          const remoteExercises = Array.isArray(workout.exercises)
            ? workout.exercises.map((e) => ({
                id: uid(),
                name: e.exercise_name,
                sets: e.sets,
              }))
            : []

          const matchedCardio = workout.cardio_type
            ? CARDIO_TYPES.find(
                (c) => c.label.toLowerCase() === workout.cardio_type?.toLowerCase(),
              )
            : null

          const remoteCardio =
            workout.cardio_type && workout.cardio_duration_minutes > 0
              ? [
                  {
                    id: uid(),
                    type: (matchedCardio?.id ?? 'incline-walk') as CardioType,
                    minutes: workout.cardio_duration_minutes,
                    kcal: workout.cardio_calories_burned,
                  },
                ]
              : []

          updated = {
            ...updated,
            workoutType:
              (matchedType?.id as WorkoutType) ??
              (workout.workout_type === 'Nghỉ' ? 'rest' : null),
            exercises: remoteExercises.length > 0 ? remoteExercises : updated.exercises,
            cardio: remoteCardio.length > 0 ? remoteCardio : updated.cardio,
          }
        }

        // Merge weight
        if (weight && typeof weight.weight === 'number') {
          updated = { ...updated, weight: weight.weight }
        }

        return { ...prev, [date]: updated }
      })

      // Update photos if weight log has image
      if (weight?.image_url) {
        setPhotos((prev) => ({ ...prev, [date]: weight.image_url! }))
      }
    } catch (err) {
      console.error(`Failed to fetch date ${date} from Supabase:`, err)
      // Allow retry on next navigation
      fetchedDatesRef.current.delete(date)
    } finally {
      setLoadingDates((prev) => {
        const next = new Set(prev)
        next.delete(date)
        return next
      })
    }
  }, [])

  const getDay = useCallback(
    (date: string): DayLog => {
      return days[date] ?? createEmptyDay()
    },
    [days],
  )

  const updateDayFn = useCallback((date: string, fn: (prev: DayLog) => DayLog) => {
    setDays((prev) => {
      const existing = prev[date] ?? createEmptyDay()
      const next = fn(existing)
      return { ...prev, [date]: next }
    })
  }, [])

  const syncDailyTracking = useCallback(
    async (date: string, dayOverride?: DayLog) => {
      const day = dayOverride ?? days[date] ?? createEmptyDay()
      try {
        const totals = dayTotals(day)
        await upsertDailyTracking(date, {
          consumed_protein: round1(totals.protein),
          consumed_carb: round1(totals.carbs),
          consumed_fat: round1(totals.fat),
          creatine_taken: Boolean(day.supplements.creatine),
          omega3_morning_taken: Boolean(day.supplements.omega3Morning),
          omega3_evening_taken: Boolean(day.supplements.omega3Evening),
          meals: day.meals,
        })
      } catch (e) {
        console.error('Failed to sync daily tracking to Supabase:', e)
      }
    },
    [days],
  )

  const isLoading = useCallback(
    (date: string) => loadingDates.has(date),
    [loadingDates],
  )

  const setPhotoFn = useCallback((date: string, url: string) => {
    setPhotos((prev) => ({ ...prev, [date]: url }))
  }, [])

  const removePhotoFn = useCallback((date: string) => {
    setPhotos((prev) => {
      const next = { ...prev }
      delete next[date]
      return next
    })
  }, [])

  return (
    <DailyDataContext.Provider
      value={{
        getDay,
        updateDay: updateDayFn,
        syncDailyTracking,
        fetchDate,
        isLoading,
        photos,
        setPhoto: setPhotoFn,
        removePhoto: removePhotoFn,
        weightData,
        days,
      }}
    >
      {children}
    </DailyDataContext.Provider>
  )
}
