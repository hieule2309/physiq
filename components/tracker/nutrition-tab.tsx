'use client'

import { useState } from 'react'
import { Plus, Trash2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  dayTotals,
  getDay,
  MEALS,
  QUICK_FOODS,
  sumFoods,
  TARGETS,
  uid,
  type MealId,
  type QuickFood,
} from '@/lib/fitness'
import { updateDay, useAppData } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { CustomFoodForm } from './custom-food-form'
import { fmt } from './shared'

export function NutritionTab({ date }: { date: string }) {
  const data = useAppData()
  const day = getDay(data, date)
  const totals = dayTotals(day)
  const [meal, setMeal] = useState<MealId>('breakfast')

  const addFood = (food: QuickFood) =>
    updateDay(date, (d) => ({
      ...d,
      meals: { ...d.meals, [meal]: [...d.meals[meal], { ...food, id: uid() }] },
    }))

  const removeFood = (mealId: MealId, id: string) =>
    updateDay(date, (d) => ({
      ...d,
      meals: { ...d.meals, [mealId]: d.meals[mealId].filter((f) => f.id !== id) },
    }))

  return (
    <>
      <div className="grid grid-cols-4 gap-2 rounded-xl border bg-card p-3 text-center">
        <MacroPill label="Kcal" value={totals.kcal} target={TARGETS.kcal} className="text-primary" />
        <MacroPill label="P" value={totals.protein} target={TARGETS.protein} className="text-protein" />
        <MacroPill label="C" value={totals.carbs} target={TARGETS.carbs} className="text-carbs" />
        <MacroPill label="F" value={totals.fat} target={TARGETS.fat} className="text-fat" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-4 text-primary" aria-hidden="true" />
            Thêm nhanh vào
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div role="radiogroup" aria-label="Chọn bữa ăn" className="grid grid-cols-2 gap-2">
            {MEALS.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={meal === m.id}
                onClick={() => setMeal(m.id)}
                className={cn(
                  'h-9 rounded-lg border text-sm font-semibold transition-colors',
                  meal === m.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {QUICK_FOODS.map((food) => (
              <button
                key={food.name}
                type="button"
                onClick={() => addFood(food)}
                className="group flex flex-col items-start gap-1 rounded-lg border bg-muted/30 p-3 text-left transition-colors hover:border-primary/50 active:scale-[0.98]"
              >
                <span className="flex w-full items-start justify-between gap-1 text-sm font-semibold leading-tight">
                  {food.name}
                  <Plus className="size-4 shrink-0 text-primary" aria-hidden="true" />
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {food.kcal} kcal · {food.protein > 5 ? `${food.protein}g P` : `${food.carbs}g C`}
                </span>
              </button>
            ))}
          </div>

          <CustomFoodForm onAdd={addFood} />
        </CardContent>
      </Card>

      {MEALS.map((m) => {
        const foods = day.meals[m.id]
        const sub = sumFoods(foods)
        return (
          <Card key={m.id} size="sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {m.label}
                <span className="text-sm font-semibold tabular-nums text-primary">{fmt(sub.kcal)} kcal</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {foods.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có món nào.</p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {foods.map((f) => (
                    <li key={f.id} className="flex items-center gap-2 py-2 first:pt-0 last:pb-0">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{f.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {fmt(f.kcal)} kcal · P {fmt(f.protein, 1)} · C {fmt(f.carbs, 1)} · F {fmt(f.fat, 1)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Xóa ${f.name}`}
                        onClick={() => removeFood(m.id, f.id)}
                      >
                        <Trash2 className="text-muted-foreground" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )
      })}
    </>
  )
}

function MacroPill({
  label,
  value,
  target,
  className,
}: {
  label: string
  value: number
  target: number
  className?: string
}) {
  return (
    <div className="flex flex-col">
      <span className={cn('text-xs font-semibold', className)}>{label}</span>
      <span className="text-sm font-bold tabular-nums">{fmt(value, label === 'Kcal' ? 0 : 1)}</span>
      <span className="text-[10px] text-muted-foreground tabular-nums">/ {fmt(target)}</span>
    </div>
  )
}
