'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getDailyTracking, upsertDailyTracking, type DailyTracking } from './supabase-helpers'
import { dayTotals, getDay, round1 } from './fitness'
import { updateDay, useAppData } from './storage'

export function useDailyTrackingSync(date: string) {
  const data = useAppData()
  const day = getDay(data, date)
  const [supabaseTracking, setSupabaseTracking] = useState<DailyTracking | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const isInitialFetch = useRef(true)

  // Fetch daily_tracking from Supabase on date change
  useEffect(() => {
    let cancelled = false
    isInitialFetch.current = true
    setLoading(true)

    async function fetchTracking() {
      try {
        const remote = await getDailyTracking(date)
        if (cancelled) return

        setSupabaseTracking(remote)
        if (remote) {
          // Sync remote supplements and meals into local state if local is empty
          updateDay(date, (d) => {
            const hasLocalMeals = Object.values(d.meals).some((m) => m.length > 0)
            const hasLocalSupps =
              d.supplements.creatine ||
              d.supplements.omega3Morning ||
              d.supplements.omega3Evening

            const nextSupplements = hasLocalSupps
              ? d.supplements
              : {
                  ...d.supplements,
                  creatine: remote.creatine_taken,
                  omega3Morning: remote.omega3_morning_taken,
                  omega3Evening: remote.omega3_evening_taken,
                }

            // If local meals are empty but remote has meals, sync remote meals
            const remoteMeals = remote.meals
            const hasRemoteMeals =
              remoteMeals && Object.values(remoteMeals).some((m) => m && m.length > 0)

            const nextMeals = !hasLocalMeals && hasRemoteMeals ? remoteMeals : d.meals

            return {
              ...d,
              supplements: nextSupplements,
              meals: nextMeals,
            }
          })
        }
      } catch (err) {
        console.error('Failed to fetch daily tracking from Supabase:', err)
      } finally {
        if (!cancelled) {
          setLoading(false)
          isInitialFetch.current = false
        }
      }
    }

    fetchTracking()

    return () => {
      cancelled = true
    }
  }, [date])

  // Sync current totals, meals, and supplements to Supabase
  const pushToSupabase = useCallback(
    async (override?: Partial<DailyTracking>) => {
      setSyncing(true)
      try {
        const totals = dayTotals(day)
        const payload: Omit<DailyTracking, 'id' | 'user_id' | 'date'> = {
          consumed_protein: round1(totals.protein),
          consumed_carb: round1(totals.carbs),
          consumed_fat: round1(totals.fat),
          creatine_taken: day.supplements.creatine,
          omega3_morning_taken: Boolean(day.supplements.omega3Morning),
          omega3_evening_taken: Boolean(day.supplements.omega3Evening),
          meals: day.meals,
          ...override,
        }

        const res = await upsertDailyTracking(date, payload)
        if (res) {
          setSupabaseTracking(res)
          setLastSynced(new Date())
        }
      } catch (err) {
        console.error('Failed to sync daily tracking to Supabase:', err)
      } finally {
        setSyncing(false)
      }
    },
    [date, day],
  )

  return {
    supabaseTracking,
    loading,
    syncing,
    lastSynced,
    pushToSupabase,
  }
}
