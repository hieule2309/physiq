export const PROFILE = {
  sex: 'Nam',
  age: 27,
  heightCm: 175,
  startWeight: 76,
  goalWeight: 70,
  bmr: 1764,
  tdee: 2735,
} as const

export const TARGETS = {
  kcal: 1850,
  protein: 160,
  carbs: 225,
  fat: 32,
} as const

export type MealId = 'breakfast' | 'lunch' | 'preWorkout' | 'postWorkout'

export const MEALS: { id: MealId; label: string }[] = [
  { id: 'breakfast', label: 'Bữa sáng' },
  { id: 'lunch', label: 'Bữa trưa' },
  { id: 'preWorkout', label: 'Pre-workout' },
  { id: 'postWorkout', label: 'Post-workout' },
]

export type FoodEntry = {
  id: string
  name: string
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export type QuickFood = {
  name: string
  baseAmount: number
  unit: string
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export const QUICK_FOODS: QuickFood[] = [
  { name: 'Lòng trắng trứng', baseAmount: 100, unit: 'g', kcal: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  { name: 'Ức gà', baseAmount: 100, unit: 'g', kcal: 120, protein: 23, carbs: 0, fat: 2.6 },
  { name: 'Bánh mì', baseAmount: 1, unit: 'ổ', kcal: 190, protein: 6, carbs: 38, fat: 1.5 },
  { name: 'Chuối', baseAmount: 1, unit: 'quả', kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
  { name: 'Cơm trắng', baseAmount: 100, unit: 'g', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: 'Rau luộc', baseAmount: 100, unit: 'g', kcal: 25, protein: 2, carbs: 4, fat: 0.3 },
  { name: 'Chà bông heo', baseAmount: 100, unit: 'g', kcal: 390, protein: 45, carbs: 35, fat: 7 },
  { name: 'Dưa leo', baseAmount: 1, unit: 'trái', kcal: 24, protein: 1, carbs: 5, fat: 0.2 },
  { name: 'Trứng luộc', baseAmount: 1, unit: 'quả', kcal: 72, protein: 6, carbs: 0.5, fat: 5 },
  { name: 'Cafe đen zero', baseAmount: 1, unit: 'ly', kcal: 2, protein: 0.2, carbs: 0, fat: 0 },
  { name: 'Milo ít đường', baseAmount: 1, unit: 'hộp', kcal: 106, protein: 2.6, carbs: 16, fat: 3.8},
  { name: 'Hạt dẻ cười muối', baseAmount: 30, unit: 'g', kcal: 160, protein: 6, carbs: 8, fat: 13}
]

export function formatFoodName(food: QuickFood, amount: number): string {
  if (food.unit === 'g') {
    return `${amount}g ${food.name}`
  }
  const capitalizedUnit = food.unit.charAt(0).toUpperCase() + food.unit.slice(1)
  return `${amount} ${capitalizedUnit} ${food.name}`
}

export type WorkoutType = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'fullbody' | 'rest'

export const WORKOUT_TYPES: { id: WorkoutType; label: string }[] = [
  { id: 'push', label: 'Push' },
  { id: 'pull', label: 'Pull' },
  { id: 'legs', label: 'Legs' },
  { id: 'upper', label: 'Upper' },
  { id: 'lower', label: 'Lower' },
  { id: 'fullbody', label: 'Full Body' },
  { id: 'rest', label: 'Nghỉ' },
]

export type ExerciseEntry = {
  id: string
  name: string
  sets: number
  weight?: number
  reps?: number
}

export type CardioType = 'incline-walk' | 'cycling' | 'running' | 'elliptical' | 'stairs' | 'jump-rope' | 'swimming'

export const CARDIO_TYPES: { id: CardioType; label: string; met: number }[] = [
  { id: 'incline-walk', label: 'Đi bộ dốc', met: 6 },
  { id: 'cycling', label: 'Đạp xe', met: 7 },
  { id: 'running', label: 'Chạy bộ', met: 9.8 },
  { id: 'elliptical', label: 'Máy Elliptical', met: 5 },
  { id: 'stairs', label: 'Leo cầu thang', met: 9 },
  { id: 'jump-rope', label: 'Nhảy dây', met: 11 },
  { id: 'swimming', label: 'Bơi lội', met: 7 },
]

export type CardioEntry = {
  id: string
  type: CardioType
  minutes: number
  kcal: number
}

export type DayLog = {
  meals: Record<MealId, FoodEntry[]>
  supplements: {
    creatine: boolean
    omega3Morning: boolean
    omega3Evening: boolean
    omega3?: boolean
  }
  weight: number | null
  workoutType: WorkoutType | null
  exercises: ExerciseEntry[]
  cardio: CardioEntry[]
}

export type AppData = {
  version: 1
  days: Record<string, DayLog>
}

export const EMPTY_APP_DATA: AppData = { version: 1, days: {} }

export function createEmptyDay(): DayLog {
  return {
    meals: { breakfast: [], lunch: [], preWorkout: [], postWorkout: [] },
    supplements: {
      creatine: false,
      omega3Morning: false,
      omega3Evening: false,
      omega3: false,
    },
    weight: null,
    workoutType: null,
    exercises: [],
    cardio: [],
  }
}

export const EMPTY_DAY: DayLog = createEmptyDay()

export function getDay(data: AppData, key: string): DayLog {
  return data.days[key] ?? EMPTY_DAY
}

export function uid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

export function round1(n: number) {
  return Math.round(n * 10) / 10
}

export function sumFoods(foods: FoodEntry[]) {
  return foods.reduce(
    (acc, f) => ({
      kcal: acc.kcal + f.kcal,
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fat: acc.fat + f.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

export function dayTotals(day: DayLog) {
  return sumFoods(MEALS.flatMap((m) => day.meals[m.id]))
}

export function cardioKcal(type: CardioType, minutes: number, weightKg: number) {
  const met = CARDIO_TYPES.find((c) => c.id === type)?.met ?? 5
  return Math.round(met * weightKg * (minutes / 60))
}

export function exerciseVolume(e: ExerciseEntry) {
  return (e.weight ?? 0) * (e.reps ?? 0) * e.sets
}

/* ---------- Dates (local time, yyyy-mm-dd) ---------- */

export function toDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, n: number) {
  const d = fromDateKey(key)
  d.setDate(d.getDate() + n)
  return toDateKey(d)
}

export function todayKey() {
  return toDateKey(new Date())
}

export function formatDateLong(key: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(fromDateKey(key))
}

export function formatDateShort(key: string) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(fromDateKey(key))
}

/* ---------- Weight analytics ---------- */

export function weeklyAverage(data: AppData, endKey: string) {
  const weights: number[] = []
  for (let i = 0; i < 7; i++) {
    const w = data.days[addDays(endKey, -i)]?.weight
    if (typeof w === 'number') weights.push(w)
  }
  if (weights.length === 0) return { avg: null, count: 0 }
  return { avg: round1(weights.reduce((a, b) => a + b, 0) / weights.length), count: weights.length }
}

export function weeklyTrend(data: AppData, endKey: string, weeks = 8) {
  const points: { label: string; avg: number | null; days: number }[] = []
  for (let w = weeks - 1; w >= 0; w--) {
    const weekEnd = addDays(endKey, -w * 7)
    const { avg, count } = weeklyAverage(data, weekEnd)
    points.push({ label: formatDateShort(weekEnd), avg, days: count })
  }
  return points
}

export function latestWeight(data: AppData, upToKey: string) {
  const keys = Object.keys(data.days)
    .filter((k) => k <= upToKey && typeof data.days[k].weight === 'number')
    .sort()
  const last = keys.at(-1)
  return last ? (data.days[last].weight as number) : null
}
