'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Cloud, Loader2, Scale, TrendingDown, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addDays, getDay, round1, weeklyAverage, weeklyTrend } from '@/lib/fitness'
import { setPhoto, updateDay, useAppData } from '@/lib/storage'
import {
  getAllWeightLogs,
  getWeightLog,
  saveWeightLogInSupabase,
} from '@/lib/supabase-helpers'
import { PhotoTracker } from './photo-tracker'
import { fmt, StatTile } from './shared'
import { WeightChart } from './weight-chart'

export function WeightTab({ date }: { date: string }) {
  const data = useAppData()
  const day = getDay(data, date)

  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // 1. Initial load: sync all historical weight logs and photos from Supabase to local state
  useEffect(() => {
    let cancelled = false
    const syncAllLogs = async () => {
      try {
        setSyncing(true)
        const allLogs = await getAllWeightLogs()
        if (!cancelled && allLogs && allLogs.length > 0) {
          allLogs.forEach((log) => {
            if (log.logged_at && typeof log.weight === 'number') {
              updateDay(log.logged_at, (d) => {
                if (d.weight !== log.weight) {
                  return { ...d, weight: log.weight }
                }
                return d
              })
            }
            if (log.logged_at && log.image_url) {
              setPhoto(log.logged_at, log.image_url)
            }
          })
        }
      } catch (err) {
        console.error('Error syncing all weight logs from Supabase:', err)
      } finally {
        if (!cancelled) setSyncing(false)
      }
    }

    syncAllLogs()
    return () => {
      cancelled = true
    }
  }, [])

  // 2. Sync weight log for the active date from Supabase
  useEffect(() => {
    let cancelled = false
    const syncCurrentDate = async () => {
      try {
        const remote = await getWeightLog(date)
        if (!cancelled && remote) {
          if (typeof remote.weight === 'number' && remote.weight !== day.weight) {
            updateDay(date, (d) => ({ ...d, weight: remote.weight }))
          }
          if (remote.image_url) {
            setPhoto(date, remote.image_url)
          }
        }
      } catch (err) {
        console.error('Error syncing remote weight for date:', err)
      }
    }

    syncCurrentDate()
    return () => {
      cancelled = true
    }
  }, [date])

  const thisWeek = weeklyAverage(data, date)
  const lastWeek = weeklyAverage(data, addDays(date, -7))
  const delta =
    thisWeek.avg !== null && lastWeek.avg !== null
      ? round1(thisWeek.avg - lastWeek.avg)
      : null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const value = Number(new FormData(e.currentTarget).get('weight'))
    if (!Number.isFinite(value) || value < 30 || value > 250) return

    const rounded = round1(value)
    // 1. Update local state immediately for snappy UI reaction
    updateDay(date, (d) => ({ ...d, weight: rounded }))

    // 2. Persist to Supabase weight_logs table
    setSaving(true)
    setSaveSuccess(false)
    try {
      await saveWeightLogInSupabase(rounded, date)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (err) {
      console.error('Failed to save weight to Supabase:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    updateDay(date, (d) => ({ ...d, weight: null }))
    setSaving(true)
    try {
      await saveWeightLogInSupabase(null, date)
    } catch (err) {
      console.error('Failed to delete weight log from Supabase:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Scale className="size-4 text-primary" aria-hidden="true" />
              Cân nặng buổi sáng
            </CardTitle>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Cloud className="size-3.5 text-emerald-400" />
              <span>Đồng bộ Supabase</span>
            </div>
          </div>
          <CardDescription>Cân sau khi thức dậy, trước khi ăn uống.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            key={`${date}-${day.weight}`}
            onSubmit={handleSubmit}
            className="flex items-end gap-2"
          >
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="weight-input">Cân nặng (kg)</Label>
              <Input
                id="weight-input"
                name="weight"
                type="number"
                inputMode="decimal"
                step="0.1"
                min={30}
                max={250}
                defaultValue={day.weight ?? ''}
                placeholder="VD: 75.4"
                required
                className="h-10 text-lg font-bold"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-10 px-4 transition-all"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Đang lưu...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="mr-1.5 size-4 text-emerald-300" />
                  Đã lưu!
                </>
              ) : day.weight !== null ? (
                'Cập nhật'
              ) : (
                'Lưu'
              )}
            </Button>
          </form>
          {day.weight !== null && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="mt-2 text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
            >
              Xóa cân nặng ngày này
            </button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="TB tuần này"
          value={thisWeek.avg !== null ? fmt(thisWeek.avg, 1) : '--'}
          unit="kg"
          hint={`${thisWeek.count}/7 ngày có số liệu`}
        />
        <StatTile
          label="TB tuần trước"
          value={lastWeek.avg !== null ? fmt(lastWeek.avg, 1) : '--'}
          unit="kg"
          hint={`${lastWeek.count}/7 ngày có số liệu`}
        />
      </div>

      <DeltaBanner delta={delta} />

      <WeightChart data={weeklyTrend(data, date)} />

      <PhotoTracker date={date} />
    </>
  )
}

function DeltaBanner({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        Cần số liệu cân nặng của cả tuần này và tuần trước để tính lượng giảm thực tế (Delta).
      </p>
    )
  }
  const losing = delta <= 0
  const Icon = losing ? TrendingDown : TrendingUp
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-4 ${
        losing
          ? 'border-primary/40 bg-primary/10'
          : 'border-destructive/40 bg-destructive/10'
      }`}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
          losing
            ? 'bg-primary text-primary-foreground'
            : 'bg-destructive text-background'
        }`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">Delta trung bình tuần</span>
        <span
          className={`text-lg font-extrabold tabular-nums ${
            losing ? 'text-primary' : 'text-destructive'
          }`}
        >
          {losing ? '-' : '+'}
          {fmt(Math.abs(delta), 1)} kg
        </span>
        <span className="text-xs text-muted-foreground">
          {losing
            ? 'Đang giảm đúng hướng. Giữ vững!'
            : 'Tăng so với tuần trước – kiểm tra lại calo.'}
        </span>
      </div>
    </div>
  )
}
