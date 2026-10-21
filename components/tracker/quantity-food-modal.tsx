'use client'

import { useState, useEffect } from 'react'
import { Plus, Utensils, Zap } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatFoodName, type FoodEntry, type QuickFood } from '@/lib/fitness'
import { fmt } from './shared'
import { cn } from '@/lib/utils'

interface QuantityFoodModalProps {
  food: QuickFood | null
  mealLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (food: Omit<FoodEntry, 'id'>) => void
}

export function QuantityFoodModal({
  food,
  mealLabel,
  open,
  onOpenChange,
  onConfirm,
}: QuantityFoodModalProps) {
  const [quantity, setQuantity] = useState<string>('100')

  // Reset quantity to baseAmount when food changes or modal opens
  useEffect(() => {
    if (food) {
      setQuantity(String(food.baseAmount))
    }
  }, [food, open])

  if (!food) return null

  const numQuantity = Math.max(0, Number(quantity) || 0)
  const multiplier = food.baseAmount > 0 ? numQuantity / food.baseAmount : 1

  const calcKcal = Math.round(food.kcal * multiplier)
  const calcProtein = Math.round(food.protein * multiplier * 10) / 10
  const calcCarbs = Math.round(food.carbs * multiplier * 10) / 10
  const calcFat = Math.round(food.fat * multiplier * 10) / 10
  const dynamicName = formatFoodName(food, numQuantity)

  // Presets based on food unit
  const presets =
    food.unit === 'g'
      ? [50, 100, 150, 200, 250, 300]
      : [1, 2, 3, 4, 5]

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (numQuantity <= 0) return

    onConfirm({
      name: dynamicName,
      kcal: calcKcal,
      protein: calcProtein,
      carbs: calcCarbs,
      fat: calcFat,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Utensils className="size-5 text-primary" aria-hidden="true" />
            Tùy chỉnh số lượng món ăn
          </DialogTitle>
          <DialogDescription>
            Nhập lượng thực tế để tự động tính Calo và Macro nạp vào.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
          {/* Live Preview Card */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-base font-bold text-foreground transition-all">
                  {dynamicName}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Gốc: {food.baseAmount}{food.unit} · {food.kcal} kcal
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold tabular-nums text-primary">
                  {fmt(calcKcal)}
                </span>
                <span className="ml-1 text-xs font-semibold text-muted-foreground">kcal</span>
              </div>
            </div>

            <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-background/80 p-2 shadow-xs">
                <span className="text-[11px] font-semibold text-protein">Protein</span>
                <p className="mt-0.5 text-sm font-bold tabular-nums">{fmt(calcProtein, 1)}g</p>
              </div>
              <div className="rounded-lg bg-background/80 p-2 shadow-xs">
                <span className="text-[11px] font-semibold text-carbs">Carb</span>
                <p className="mt-0.5 text-sm font-bold tabular-nums">{fmt(calcCarbs, 1)}g</p>
              </div>
              <div className="rounded-lg bg-background/80 p-2 shadow-xs">
                <span className="text-[11px] font-semibold text-fat">Fat</span>
                <p className="mt-0.5 text-sm font-bold tabular-nums">{fmt(calcFat, 1)}g</p>
              </div>
            </div>
          </div>

          {/* Quantity Input Field */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="food-quantity" className="text-sm font-semibold">
                Nhập số lượng ({food.unit})
              </Label>
              <span className="text-xs text-muted-foreground">
                Đơn vị tính: <strong className="text-foreground">{food.unit}</strong>
              </span>
            </div>

            <div className="relative">
              <Input
                id="food-quantity"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                autoFocus
                className="h-12 pr-12 text-lg font-bold"
                placeholder={`VD: ${food.baseAmount}`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm font-semibold text-muted-foreground">
                {food.unit}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-medium text-muted-foreground">Nhanh:</span>
              {presets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuantity(String(val))}
                  className={cn(
                    'rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors',
                    Number(quantity) === val
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  {val}{food.unit}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={numQuantity <= 0}
              className="h-11 font-bold"
            >
              <Plus className="size-4" data-icon="inline-start" />
              Thêm vào {mealLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
