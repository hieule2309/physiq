/**
 * Fitness calculation utilities — Mifflin-St Jeor BMR, TDEE, and Macro distribution.
 * These are pure functions with no side effects.
 */

export type Gender = 'male' | 'female'

export type ActivityLevel = {
  value: number
  label: string
  description: string
}

export const ACTIVITY_LEVELS: ActivityLevel[] = [
  { value: 1.2, label: 'Ít vận động', description: 'Ngồi văn phòng, không tập' },
  { value: 1.375, label: 'Nhẹ nhàng', description: '1-3 buổi/tuần' },
  { value: 1.55, label: 'Trung bình', description: '3-5 buổi/tuần' },
  { value: 1.725, label: 'Năng động', description: '6-7 buổi/tuần' },
  { value: 1.9, label: 'Rất năng động', description: 'Tập 2 lần/ngày hoặc lao động nặng' },
]

/**
 * Mifflin-St Jeor BMR
 * Male:   10 × weight(kg) + 6.25 × height(cm) – 5 × age – 5  (was +5 originally, but standard is: 10W + 6.25H - 5A + 5 for male)
 * Female: 10 × weight(kg) + 6.25 × height(cm) – 5 × age – 161
 */
export function calculateBMR(weight: number, height: number, age: number, gender: Gender): number {
  const base = 10 * weight + 6.25 * height - 5 * age
  return Math.round(gender === 'male' ? base + 5 : base - 161)
}

/**
 * TDEE = BMR × Activity Level Multiplier
 */
export function calculateTDEE(bmr: number, activityLevel: number): number {
  return Math.round(bmr * activityLevel)
}

/**
 * Target Calories = TDEE + deficit (deficit is negative, e.g. -500)
 */
export function calculateTargetCalories(tdee: number, deficit: number): number {
  return Math.max(1200, Math.round(tdee + deficit)) // minimum 1200 kcal safety floor
}

/**
 * Auto-calculate macros from target calories and body weight.
 *
 * Protein: 2.2g per kg bodyweight
 * Fat: 25% of target calories (÷ 9 kcal/g)
 * Carbs: remaining calories (÷ 4 kcal/g)
 */
export function calculateMacros(targetCalories: number, weightKg: number) {
  const proteinGrams = Math.round(weightKg * 2.2)
  const proteinCalories = proteinGrams * 4

  const fatCalories = Math.round(targetCalories * 0.25)
  const fatGrams = Math.round(fatCalories / 9)

  const carbCalories = Math.max(0, targetCalories - proteinCalories - fatCalories)
  const carbGrams = Math.round(carbCalories / 4)

  return {
    protein: proteinGrams,
    carbs: carbGrams,
    fat: fatGrams,
  }
}
