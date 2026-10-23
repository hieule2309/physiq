'use client'

import { useState, useEffect } from 'react'
import { Settings, LogOut } from 'lucide-react'
import { todayKey } from '@/lib/fitness'
import { useDailyData } from '@/lib/daily-data-context'
import { useUserSettings } from '@/lib/settings-context'
import { signOut } from '@/lib/supabase-helpers'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { BottomNav, type TabId } from './bottom-nav'
import { DateHeader } from './date-header'
import { DesktopSidebar } from './desktop-sidebar'
import { OnboardingForm } from './onboarding-form'
import { OverviewTab } from './overview-tab'
import { NutritionTab } from './nutrition-tab'
import { SupplementsCard } from './supplements-card'
import { WeightTab } from './weight-tab'
import { WorkoutTab } from './workout-tab'
import { AnalyticsTab } from './analytics-tab'

export function TrackerApp() {
  const { settings, loading } = useUserSettings()
  const { getDay, fetchDate } = useDailyData()
  const [tab, setTab] = useState<TabId>('overview')
  const [date, setDate] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  const selected = date ?? todayKey()

  // Mark as hydrated once mounted on client
  useEffect(() => {
    setHydrated(true)
  }, [])

  // Fetch data from Supabase when date changes
  useEffect(() => {
    fetchDate(selected)
  }, [selected, fetchDate])

  if (!hydrated || loading) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 pt-6" aria-busy="true">
        <div className="h-16 animate-pulse rounded-2xl bg-card" />
        <div className="h-44 animate-pulse rounded-2xl bg-card" />
        <div className="h-32 animate-pulse rounded-2xl bg-card" />
        <span className="sr-only">Đang tải dữ liệu…</span>
      </div>
    )
  }

  // Show onboarding if no settings exist, or if user explicitly opened settings
  if (!settings || showSettings) {
    return (
      <OnboardingForm
        onComplete={() => setShowSettings(false)}
      />
    )
  }

  const day = getDay(selected)

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar — hidden on mobile */}
      <DesktopSidebar active={tab} onChange={setTab} onOpenSettings={() => setShowSettings(true)} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col md:ml-64">
        <DateHeader date={selected} onChange={setDate}>
          {/* Mobile settings button */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cài đặt thông số"
            onClick={() => setShowSettings(true)}
            className="md:hidden"
          >
            <Settings className="size-5" />
          </Button>

          {/* Mobile logout button */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Đăng xuất"
            onClick={() => signOut()}
            className="text-muted-foreground hover:text-destructive md:hidden"
          >
            <LogOut className="size-5" />
          </Button>
        </DateHeader>

        <main
          className={cn(
            'mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 pt-4 pb-28 md:px-8 md:pb-8',
            tab === 'overview'
              ? 'md:grid md:grid-cols-[1fr_22rem] md:items-start md:gap-6'
              : 'max-w-4xl',
          )}
        >
          {/* Main / Left Column */}
          <div className="flex flex-col gap-4 md:gap-6">
            {tab === 'overview' && <OverviewTab date={selected} onNavigate={setTab} />}
            {tab === 'nutrition' && <NutritionTab date={selected} />}
            {tab === 'weight' && <WeightTab date={selected} />}
            {tab === 'workout' && <WorkoutTab date={selected} />}
            {tab === 'analytics' && <AnalyticsTab />}
          </div>

          {/* Right Column — only on overview desktop */}
          {tab === 'overview' && (
            <div className="hidden md:flex md:sticky md:top-24 md:flex-col md:gap-4">
              <SupplementsCard date={selected} day={day} />
            </div>
          )}
        </main>

        {/* Mobile bottom nav — hidden on desktop */}
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  )
}
