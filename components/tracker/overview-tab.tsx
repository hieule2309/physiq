'use client'

import { ArrowRight, Target, TrendingDown, UtensilsCrossed } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  addDays,
  dayTotals,
  getDay,
  latestWeight,
  WORKOUT_TYPES,
  weeklyAverage,
} from '@/lib/fitness'
import { useUserSettings } from '@/lib/settings-context'
import { useAppData } from '@/lib/storage'
import type { TabId } from './bottom-nav'
import { DailyMacros } from './daily-macros'
import { fmt, ProgressBar, StatTile } from './shared'
import { SupplementsCard } from './supplements-card'

export function OverviewTab({ date, onNavigate }: { date: string; onNavigate: (t: TabId) => void }) {
  const data = useAppData()
  const { settings } = useUserSettings()
  const day = getDay(data, date)
  const totals = dayTotals(day)
  const burned = day.cardio.reduce((a, c) => a + c.kcal, 0)

  const thisWeek = weeklyAverage(data, date)
  const lastWeek = weeklyAverage(data, addDays(date, -7))
  const delta = thisWeek.avg !== null && lastWeek.avg !== null ? thisWeek.avg - lastWeek.avg : null

  const startWeight = settings?.weight ?? 76
  const goalWeight = settings?.goal_weight ?? 70
  const current = latestWeight(data, date) ?? startWeight
  const totalToLose = startWeight - goalWeight
  const lost = Math.max(0, startWeight - current)

  const bmr = settings?.calculated_bmr ?? 1764
  const tdee = settings?.calculated_tdee ?? 2735
  const targetKcal = settings?.target_calories ?? 1850

  const workoutLabel = WORKOUT_TYPES.find((w) => w.id === day.workoutType)?.label

  return (
    <>
      <DailyMacros totals={totals} burned={burned} />

      {/* Supplements — shown inline on mobile, sidebar handles desktop */}
      <div className="md:hidden">
        <SupplementsCard date={date} day={day} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => onNavigate('weight')} className="text-left">
          <StatTile
            label="TB cân nặng tuần"
            value={thisWeek.avg !== null ? fmt(thisWeek.avg, 1) : '--'}
            unit="kg"
            hint={
              delta !== null ? (
                <span className={delta <= 0 ? 'text-primary' : 'text-destructive'}>
                  {delta <= 0 ? '▼' : '▲'} {fmt(Math.abs(delta), 1)} kg so với tuần trước
                </span>
              ) : (
                `${thisWeek.count}/7 ngày đã cân`
              )
            }
            className="h-full"
          />
        </button>
        <button type="button" onClick={() => onNavigate('workout')} className="text-left">
          <StatTile
            label="Buổi tập hôm nay"
            value={workoutLabel ?? 'Chưa chọn'}
            hint={`${day.exercises.length} bài · ${day.cardio.length} cardio`}
            className="h-full"
          />
        </button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold">
              <Target className="size-4 text-primary" aria-hidden="true" />
              Mục tiêu {goalWeight}kg
            </span>
            <span className="text-sm tabular-nums text-muted-foreground">
              {fmt(lost, 1)} / {totalToLose} kg
            </span>
          </div>
          <ProgressBar value={lost} max={totalToLose} label="Tiến trình giảm cân" />
          <dl className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-muted/50 p-2">
              <dt className="text-muted-foreground">BMR</dt>
              <dd className="mt-0.5 text-sm font-bold tabular-nums">{fmt(bmr)}</dd>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <dt className="text-muted-foreground">TDEE</dt>
              <dd className="mt-0.5 text-sm font-bold tabular-nums">{fmt(tdee)}</dd>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <dt className="text-muted-foreground">Thâm hụt</dt>
              <dd className="mt-0.5 text-sm font-bold tabular-nums text-primary">
                -{fmt(tdee - targetKcal)}
              </dd>
            </div>
          </dl>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingDown className="size-3.5" aria-hidden="true" />
            {settings?.gender === 'female' ? 'Nữ' : 'Nam'}, {settings?.age ?? 27} tuổi · {settings?.height ?? 175}cm · Bắt đầu {startWeight}kg
          </p>
        </CardContent>
      </Card>

      <button
        type="button"
        onClick={() => onNavigate('nutrition')}
        className="flex items-center justify-between rounded-xl bg-primary px-4 py-3.5 font-bold text-primary-foreground"
      >
        <span className="flex items-center gap-2">
          <UtensilsCrossed className="size-4" aria-hidden="true" />
          Ghi bữa ăn ngay
        </span>
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </>
  )
}
