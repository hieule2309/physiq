'use client'

import { useState } from 'react'
import { todayKey } from '@/lib/fitness'
import { useHydrated } from '@/lib/storage'
import { DateHeader } from './date-header'
import { BottomNav, type TabId } from './bottom-nav'
import { OverviewTab } from './overview-tab'
import { NutritionTab } from './nutrition-tab'
import { WeightTab } from './weight-tab'
import { WorkoutTab } from './workout-tab'

export function TrackerApp() {
  const hydrated = useHydrated()
  const [tab, setTab] = useState<TabId>('overview')
  const [date, setDate] = useState<string | null>(null)

  if (!hydrated) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 pt-6" aria-busy="true">
        <div className="h-16 animate-pulse rounded-2xl bg-card" />
        <div className="h-44 animate-pulse rounded-2xl bg-card" />
        <div className="h-32 animate-pulse rounded-2xl bg-card" />
        <span className="sr-only">Đang tải dữ liệu…</span>
      </div>
    )
  }

  const selected = date ?? todayKey()

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <DateHeader date={selected} onChange={setDate} />
      <main className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-28">
        {tab === 'overview' && <OverviewTab date={selected} onNavigate={setTab} />}
        {tab === 'nutrition' && <NutritionTab date={selected} />}
        {tab === 'weight' && <WeightTab date={selected} />}
        {tab === 'workout' && <WorkoutTab date={selected} />}
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
