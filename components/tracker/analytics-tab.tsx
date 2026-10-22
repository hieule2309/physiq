'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  BarChart2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Flame,
  HeartPulse,
  Info,
  Layers,
  Sparkles,
  Timer,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUserSettings } from '@/lib/settings-context'
import { useAppData } from '@/lib/storage'
import {
  addDays,
  CARDIO_TYPES,
  dayTotals,
  formatDateShort,
  fromDateKey,
  getDay,
  todayKey,
  WORKOUT_TYPES,
  type DayLog,
} from '@/lib/fitness'
import {
  getAnalyticsDataFromSupabase,
  type DailyTracking,
  type WorkoutLog,
} from '@/lib/supabase-helpers'

type TimeRange = '7' | '14' | '30'
type NutritionViewMode = 'calories' | 'macros'

function getCardioLabel(type: string | null | undefined): string {
  if (!type) return ''
  const found = CARDIO_TYPES.find(
    (c) => c.id === type || c.label.toLowerCase() === type.toLowerCase(),
  )
  return found ? found.label : type
}

export function AnalyticsTab() {
  const { settings } = useUserSettings()
  const localData = useAppData()

  const [timeRange, setTimeRange] = useState<TimeRange>('30')
  const [nutritionMode, setNutritionMode] = useState<NutritionViewMode>('calories')
  const [loading, setLoading] = useState(true)
  const [supabaseData, setSupabaseData] = useState<{
    tracking: DailyTracking[]
    workouts: WorkoutLog[]
  }>({ tracking: [], workouts: [] })

  const targetCalories = settings?.target_calories ?? 1850
  const targetProtein = settings?.target_protein ?? 160
  const targetCarbs = settings?.target_carb ?? 225
  const targetFat = settings?.target_fat ?? 32

  // Fetch Supabase data for the past 30 days
  useEffect(() => {
    let cancelled = false
    const fetchRangeData = async () => {
      setLoading(true)
      const end = todayKey()
      const start = addDays(end, -35) // Fetch a little extra buffer
      try {
        const res = await getAnalyticsDataFromSupabase(start, end)
        if (!cancelled) {
          setSupabaseData(res)
        }
      } catch (err) {
        console.error('Failed to fetch analytics from Supabase:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRangeData()
    return () => {
      cancelled = true
    }
  }, [])

  // Process data for the selected time range
  const chartData = useMemo(() => {
    const daysCount = parseInt(timeRange, 10)
    const end = todayKey()
    const points = []

    for (let i = daysCount - 1; i >= 0; i--) {
      const dateKey = addDays(end, -i)
      const displayDate = formatDateShort(dateKey)

      // Supabase match
      const remoteTrack = supabaseData.tracking.find((t) => t.date === dateKey)
      const remoteWorkout = supabaseData.workouts.find((w) => w.date === dateKey)

      // Local storage match
      const localDay = getDay(localData, dateKey)
      const localTotals = dayTotals(localDay)

      // Nutrition values: prefer Supabase if present, else local
      let calories = 0
      let protein = 0
      let carbs = 0
      let fat = 0
      let hasNutrition = false

      if (remoteTrack) {
        protein = remoteTrack.consumed_protein || 0
        carbs = remoteTrack.consumed_carb || 0
        fat = remoteTrack.consumed_fat || 0
        calories = Math.round(protein * 4 + carbs * 4 + fat * 9)
        if (protein > 0 || carbs > 0 || fat > 0) hasNutrition = true
      } else if (localTotals.kcal > 0 || localTotals.protein > 0) {
        calories = localTotals.kcal
        protein = localTotals.protein
        carbs = localTotals.carbs
        fat = localTotals.fat
        hasNutrition = true
      }

      // Workout values: prefer Supabase if present, else local
      let workoutLabel = ''
      let exercisesSummary: string[] = []
      let dayVolume = 0
      let totalSets = 0
      let isCompletedWorkout = false

      if (remoteWorkout) {
        workoutLabel = remoteWorkout.workout_type || ''
        const isRest = workoutLabel === 'Nghỉ'
        if (!isRest && remoteWorkout.exercises && remoteWorkout.exercises.length > 0) {
          isCompletedWorkout = true
          remoteWorkout.exercises.forEach((ex) => {
            const sets = ex.sets || 1
            const anyEx = ex as unknown as { weight?: number; reps?: number }
            const weight = anyEx.weight ?? 0
            const reps = anyEx.reps ?? 10
            const vol = weight > 0 ? sets * weight * reps : sets * 10 // fallback metric
            dayVolume += vol
            totalSets += sets
            exercisesSummary.push(`${ex.exercise_name} (${sets} sets)`)
          })
        }
      } else if (localDay.workoutType && localDay.workoutType !== 'rest') {
        const typeMatch = WORKOUT_TYPES.find((w) => w.id === localDay.workoutType)
        workoutLabel = typeMatch?.label ?? 'Tập luyện'
        if (localDay.exercises.length > 0) {
          isCompletedWorkout = true
          localDay.exercises.forEach((ex) => {
            const sets = ex.sets || 1
            const weight = ex.weight ?? 0
            const reps = ex.reps ?? 10
            const vol = weight > 0 ? sets * weight * reps : sets * 10
            dayVolume += vol
            totalSets += sets
            exercisesSummary.push(`${ex.name} (${sets} sets)`)
          })
        }
      } else if (localDay.workoutType === 'rest') {
        workoutLabel = 'Nghỉ'
      }

      // Cardio values: prefer Supabase if duration or kcal > 0, else local
      let cardioMinutes = 0
      let cardioKcal = 0
      let cardioType = ''

      if (
        remoteWorkout &&
        (remoteWorkout.cardio_duration_minutes > 0 || remoteWorkout.cardio_calories_burned > 0)
      ) {
        cardioMinutes = remoteWorkout.cardio_duration_minutes || 0
        cardioKcal = remoteWorkout.cardio_calories_burned || 0
        cardioType = getCardioLabel(remoteWorkout.cardio_type)
      } else if (localDay.cardio && localDay.cardio.length > 0) {
        cardioMinutes = localDay.cardio.reduce((acc, c) => acc + (c.minutes || 0), 0)
        cardioKcal = localDay.cardio.reduce((acc, c) => acc + (c.kcal || 0), 0)
        cardioType = localDay.cardio.map((c) => getCardioLabel(c.type)).join(', ')
      }

      points.push({
        dateKey,
        displayDate,
        calories: hasNutrition ? calories : 0,
        protein: hasNutrition ? Math.round(protein * 10) / 10 : 0,
        carbs: hasNutrition ? Math.round(carbs * 10) / 10 : 0,
        fat: hasNutrition ? Math.round(fat * 10) / 10 : 0,
        hasNutrition,
        volume: dayVolume,
        totalSets,
        workoutLabel: workoutLabel || (dayVolume > 0 ? 'Buổi tập' : 'Chưa ghi nhận'),
        exercisesSummary,
        isCompletedWorkout,
        cardioMinutes,
        cardioKcal,
        cardioType,
      })
    }

    return points
  }, [timeRange, supabaseData, localData])

  // Aggregate KPI stats
  const kpiStats = useMemo(() => {
    const nutritionDays = chartData.filter((d) => d.hasNutrition)
    const totalCals = nutritionDays.reduce((acc, d) => acc + d.calories, 0)
    const totalP = nutritionDays.reduce((acc, d) => acc + d.protein, 0)
    const avgCalories = nutritionDays.length > 0 ? Math.round(totalCals / nutritionDays.length) : 0
    const avgProtein = nutritionDays.length > 0 ? Math.round(totalP / nutritionDays.length) : 0

    const totalVolume = chartData.reduce((acc, d) => acc + d.volume, 0)
    const completedWorkouts = chartData.filter((d) => d.isCompletedWorkout).length

    return {
      avgCalories,
      avgProtein,
      totalVolume,
      completedWorkouts,
      nutritionDaysCount: nutritionDays.length,
    }
  }, [chartData])

  // Aggregate Cardio summary stats
  const cardioStats = useMemo(() => {
    const cardioDays = chartData.filter((d) => d.cardioMinutes > 0)
    const totalMinutes = chartData.reduce((acc, d) => acc + d.cardioMinutes, 0)
    const totalKcal = chartData.reduce((acc, d) => acc + d.cardioKcal, 0)
    const avgKcalPerSession =
      cardioDays.length > 0 ? Math.round(totalKcal / cardioDays.length) : 0

    const typeCounts: Record<string, number> = {}
    chartData.forEach((d) => {
      if (d.cardioMinutes > 0 && d.cardioType) {
        typeCounts[d.cardioType] = (typeCounts[d.cardioType] || 0) + d.cardioMinutes
      }
    })

    let popularType = 'Chưa có'
    let maxMins = 0
    for (const [t, mins] of Object.entries(typeCounts)) {
      if (mins > maxMins) {
        maxMins = mins
        popularType = t
      }
    }

    return {
      totalMinutes,
      totalKcal,
      avgKcalPerSession,
      popularType,
      cardioDaysCount: cardioDays.length,
    }
  }, [chartData])

  const maxCal = Math.max(targetCalories + 300, ...chartData.map((d) => d.calories))
  const maxVolume = Math.max(100, ...chartData.map((d) => d.volume))
  const maxCardioMin = Math.max(
    60,
    Math.ceil(Math.max(...chartData.map((d) => d.cardioMinutes), 0) * 1.25),
  )
  const maxCardioKcal = Math.max(
    300,
    Math.ceil(Math.max(...chartData.map((d) => d.cardioKcal), 0) * 1.25),
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <TrendingUp className="size-4" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Thống Kê & Phân Tích</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Theo dõi tiến độ dinh dưỡng, hiệu suất tập luyện và hoạt động cardio
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1.5 self-start rounded-xl border bg-card/60 p-1 backdrop-blur-md sm:self-auto">
          {(['7', '14', '30'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                timeRange === r
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {r} ngày
            </button>
          ))}
        </div>
      </div>

      {/* 4 KPI Top Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Calo TB */}
        <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Calo TB / ngày</span>
              <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                <Flame className="size-4" />
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black tracking-tight tabular-nums">
                {kpiStats.avgCalories.toLocaleString()}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">kcal</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span>Mục tiêu:</span>
              <span className="font-semibold text-foreground tabular-nums">
                {targetCalories} kcal
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Protein TB */}
        <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Protein TB / ngày</span>
              <span className="flex size-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                <Sparkles className="size-4" />
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black tracking-tight tabular-nums text-blue-400">
                {kpiStats.avgProtein}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">g</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span>Mục tiêu:</span>
              <span className="font-semibold text-foreground tabular-nums">{targetProtein} g</span>
            </div>
          </CardContent>
        </Card>

        {/* Tổng Volume */}
        <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Tổng Volume</span>
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <Dumbbell className="size-4" />
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black tracking-tight tabular-nums text-emerald-400">
                {kpiStats.totalVolume.toLocaleString()}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">kg</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span>{timeRange} ngày gần nhất</span>
            </div>
          </CardContent>
        </Card>

        {/* Số buổi hoàn thành */}
        <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Buổi tập xong</span>
              <span className="flex size-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
                <CheckCircle2 className="size-4" />
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black tracking-tight tabular-nums text-purple-400">
                {kpiStats.completedWorkouts}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">buổi</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span>Tỉ lệ:</span>
              <span className="font-semibold text-foreground">
                {Math.round((kpiStats.completedWorkouts / parseInt(timeRange, 10)) * 100)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Biểu đồ 1: Daily Nutrition Trend */}
      <Card className="border-border/60 bg-card/70 backdrop-blur-md">
        <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary/20 text-primary">
                <UtensilsCrossed className="size-3.5" />
              </span>
              <CardTitle className="text-base font-bold">Xu Hướng Dinh Dưỡng Hằng Ngày</CardTitle>
            </div>
            <CardDescription className="mt-1 text-xs">
              Theo dõi Calo và 3 chỉ số Macronutrients trong {timeRange} ngày qua
            </CardDescription>
          </div>

          {/* Toggle View: Calories vs Macros */}
          <div className="flex items-center gap-1 self-start rounded-lg border bg-background/60 p-1 sm:self-auto">
            <button
              type="button"
              onClick={() => setNutritionMode('calories')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                nutritionMode === 'calories'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Calo (kcal)
            </button>
            <button
              type="button"
              onClick={() => setNutritionMode('macros')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                nutritionMode === 'macros'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Macros (P / C / F)
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {/* Legend Badges */}
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
            {nutritionMode === 'calories' ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#22c55e]" />
                  <span className="font-medium text-foreground">Calo tiêu thụ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 border-b border-dashed border-[#eab308]" />
                  <span className="text-muted-foreground">Mục tiêu ({targetCalories} kcal)</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#3b82f6]" />
                  <span className="font-medium text-foreground">Protein (g)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#f97316]" />
                  <span className="font-medium text-foreground">Carb (g)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#ec4899]" />
                  <span className="font-medium text-foreground">Fat (g)</span>
                </div>
              </>
            )}
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                  tick={{ fill: '#a1a1aa', fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, nutritionMode === 'calories' ? maxCal : 'auto']}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                  tick={{ fill: '#a1a1aa', fontSize: 10 }}
                  allowDecimals={false}
                />
                <Tooltip content={<NutritionCustomTooltip />} />

                {nutritionMode === 'calories' ? (
                  <>
                    <ReferenceLine
                      y={targetCalories}
                      stroke="#eab308"
                      strokeDasharray="4 4"
                      label={{
                        value: `${targetCalories} kcal`,
                        fill: '#eab308',
                        fontSize: 10,
                        position: 'insideTopRight',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="calories"
                      name="Calo"
                      stroke="#22c55e"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#22c55e' }}
                      activeDot={{ r: 6, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </>
                ) : (
                  <>
                    <Line
                      type="monotone"
                      dataKey="protein"
                      name="Protein"
                      stroke="#3b82f6"
                      strokeWidth={2.2}
                      dot={{ r: 2.5, fill: '#3b82f6' }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="carbs"
                      name="Carb"
                      stroke="#f97316"
                      strokeWidth={2.2}
                      dot={{ r: 2.5, fill: '#f97316' }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="fat"
                      name="Fat"
                      stroke="#ec4899"
                      strokeWidth={2.2}
                      dot={{ r: 2.5, fill: '#ec4899' }}
                      activeDot={{ r: 5 }}
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Biểu đồ 2: Daily Workout Volume Bar Chart */}
      <Card className="border-border/60 bg-card/70 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400">
              <Dumbbell className="size-3.5" />
            </span>
            <CardTitle className="text-base font-bold">
              Khối Lượng Tập Luyện (Volume Bar Chart)
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Tổng tải trọng (kg × reps × sets) của tất cả bài tập hoàn thành trong ngày
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                  tick={{ fill: '#a1a1aa', fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, maxVolume]}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                  tick={{ fill: '#a1a1aa', fontSize: 10 }}
                  allowDecimals={false}
                />
                <Tooltip content={<WorkoutCustomTooltip />} />
                <Bar
                  dataKey="volume"
                  fill="#22c55e"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Section Biểu đồ 3: Thống Kê Cardio (Cardio Analytics Chart & Summary) */}
      <div className="flex flex-col gap-4">
        {/* Cardio Summary Cards (3 Cards) */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Card 1: Tổng thời gian */}
          <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Tổng thời gian Cardio
                </span>
                <span className="flex size-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                  <Timer className="size-4" />
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black tracking-tight tabular-nums text-blue-400">
                  {cardioStats.totalMinutes}
                </span>
                <span className="text-xs font-medium text-muted-foreground">phút</span>
                <span className="text-[11px] text-muted-foreground">
                  (~{(cardioStats.totalMinutes / 60).toFixed(1)} giờ)
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-[11px] text-muted-foreground">
                {cardioStats.cardioDaysCount} buổi trong {timeRange} ngày qua
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Tổng Calo đốt */}
          <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Tổng Calo Cardio đốt
                </span>
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                  <Flame className="size-4" />
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black tracking-tight tabular-nums text-emerald-400">
                  {cardioStats.totalKcal.toLocaleString()}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">kcal</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-[11px] text-muted-foreground">
                TB ~{cardioStats.avgKcalPerSession} kcal / buổi tập
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Hình thức phổ biến nhất */}
          <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Cardio phổ biến nhất
                </span>
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Activity className="size-4" />
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="truncate text-xl font-bold tracking-tight text-foreground">
                  {cardioStats.popularType}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-[11px] text-muted-foreground">
                Chiếm thời lượng cao nhất trong chu kỳ
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Biểu đồ Cardio Dual-Axis ComposedChart */}
        <Card className="border-border/60 bg-card/70 backdrop-blur-md">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-blue-500/20 text-blue-400">
                <HeartPulse className="size-3.5" />
              </span>
              <CardTitle className="text-base font-bold">
                Hiệu Suất Cardio (Thời Gian & Calo Tiêu Thụ)
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Biểu đồ kết hợp: Cột xanh dương biểu thị thời gian (phút), đường xanh lá neon biểu thị calo đốt (kcal)
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            {/* Legend Badges */}
            <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#3b82f6]" />
                <span className="font-medium text-foreground">Thời gian Cardio (phút) - Trục trái</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#22c55e]" />
                <span className="font-medium text-foreground">Calo tiêu thụ (kcal) - Trục phải</span>
              </div>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                    tick={{ fill: '#a1a1aa', fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  {/* Trục Y trái: Thời gian (phút) */}
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    domain={[0, maxCardioMin]}
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                    tick={{ fill: '#3b82f6', fontSize: 10 }}
                    allowDecimals={false}
                  />
                  {/* Trục Y phải: Calo (kcal) */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, maxCardioKcal]}
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                    tick={{ fill: '#22c55e', fontSize: 10 }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CardioCustomTooltip />} />
                  <Bar
                    yAxisId="left"
                    dataKey="cardioMinutes"
                    name="Thời gian (phút)"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cardioKcal"
                    name="Calo đốt (kcal)"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#22c55e' }}
                    activeDot={{ r: 6, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ---------- Custom Tooltips ---------- */

function NutritionCustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{
    payload: {
      dateKey: string
      calories: number
      protein: number
      carbs: number
      fat: number
      hasNutrition: boolean
    }
  }>
  label?: string
}) {
  if (!active || !payload || !payload.length) return null
  const item = payload[0].payload

  return (
    <div className="rounded-xl border border-border/80 bg-popover/95 p-3 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-1.5 border-b border-border/60 pb-1.5 text-xs font-semibold text-foreground">
        <Calendar className="size-3.5 text-primary" />
        <span>Ngày {label}</span>
      </div>

      {item.hasNutrition ? (
        <div className="mt-2 flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between gap-4 font-bold text-emerald-400">
            <span>Calo:</span>
            <span className="tabular-nums">{item.calories.toLocaleString()} kcal</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-blue-400">
            <span>Protein:</span>
            <span className="tabular-nums">{item.protein} g</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-amber-500">
            <span>Carb:</span>
            <span className="tabular-nums">{item.carbs} g</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-pink-400">
            <span>Fat:</span>
            <span className="tabular-nums">{item.fat} g</span>
          </div>
        </div>
      ) : (
        <div className="mt-2 text-[11px] text-muted-foreground">Chưa có dữ liệu bữa ăn</div>
      )}
    </div>
  )
}

function WorkoutCustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{
    payload: {
      dateKey: string
      volume: number
      totalSets: number
      workoutLabel: string
      exercisesSummary: string[]
      isCompletedWorkout: boolean
    }
  }>
  label?: string
}) {
  if (!active || !payload || !payload.length) return null
  const item = payload[0].payload

  return (
    <div className="max-w-[260px] rounded-xl border border-border/80 bg-popover/95 p-3 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border/60 pb-1.5 text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3.5 text-primary" />
          <span>Ngày {label}</span>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {item.workoutLabel}
        </Badge>
      </div>

      <div className="mt-2 flex flex-col gap-1 text-xs">
        <div className="flex items-center justify-between gap-3 font-bold text-emerald-400">
          <span>Tổng Volume:</span>
          <span className="tabular-nums">{item.volume.toLocaleString()} kg</span>
        </div>
        {item.totalSets > 0 && (
          <div className="flex items-center justify-between gap-3 text-muted-foreground">
            <span>Tổng số hiệp:</span>
            <span className="font-semibold text-foreground tabular-nums">{item.totalSets} sets</span>
          </div>
        )}

        {item.exercisesSummary.length > 0 && (
          <div className="mt-2 border-t border-border/40 pt-1.5">
            <span className="text-[10px] font-medium text-muted-foreground">Các bài tập:</span>
            <ul className="mt-1 flex flex-col gap-0.5 text-[11px] text-foreground/90">
              {item.exercisesSummary.slice(0, 4).map((ex, idx) => (
                <li key={idx} className="truncate">
                  • {ex}
                </li>
              ))}
              {item.exercisesSummary.length > 4 && (
                <li className="text-[10px] text-muted-foreground">
                  +{item.exercisesSummary.length - 4} bài khác...
                </li>
              )}
            </ul>
          </div>
        )}

        {!item.isCompletedWorkout && item.workoutLabel !== 'Nghỉ' && (
          <p className="mt-1 text-[11px] text-muted-foreground">Chưa có bài tập nào được lưu</p>
        )}
      </div>
    </div>
  )
}

function CardioCustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{
    payload: {
      dateKey: string
      cardioMinutes: number
      cardioKcal: number
      cardioType: string
    }
  }>
  label?: string
}) {
  if (!active || !payload || !payload.length) return null
  const item = payload[0].payload

  return (
    <div className="min-w-[200px] rounded-xl border border-border/80 bg-popover/95 p-3 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border/60 pb-1.5 text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3.5 text-primary" />
          <span>Ngày {label}</span>
        </div>
        {item.cardioType ? (
          <Badge variant="outline" className="border-blue-500/30 text-[10px] text-blue-400">
            {item.cardioType}
          </Badge>
        ) : null}
      </div>

      <div className="mt-2 flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between gap-3 text-blue-400">
          <span className="flex items-center gap-1 font-medium">
            <span className="inline-block size-2 rounded-full bg-blue-500" />
            Thời gian:
          </span>
          <span className="font-bold tabular-nums">{item.cardioMinutes} phút</span>
        </div>

        <div className="flex items-center justify-between gap-3 text-emerald-400">
          <span className="flex items-center gap-1 font-medium">
            <span className="inline-block size-2 rounded-full bg-emerald-500" />
            Calo tiêu thụ:
          </span>
          <span className="font-bold tabular-nums">{item.cardioKcal.toLocaleString()} kcal</span>
        </div>

        {item.cardioMinutes === 0 && (
          <div className="mt-1 text-[11px] text-muted-foreground">Không có bài tập cardio</div>
        )}
      </div>
    </div>
  )
}
