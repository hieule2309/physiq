'use client'

import { useState } from 'react'
import { Check, CheckCircle2, Cloud, Loader2, Pill } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import type { DayLog } from '@/lib/fitness'
import { dayTotals, round1 } from '@/lib/fitness'
import { updateDay } from '@/lib/storage'
import { upsertDailyTracking } from '@/lib/supabase-helpers'
import { cn } from '@/lib/utils'

export type SupplementKey = 'creatine' | 'omega3Morning' | 'omega3Evening'

type ItemConfig = {
  key: SupplementKey
  label: string
  sub?: string
  dbField: 'creatine_taken' | 'omega3_morning_taken' | 'omega3_evening_taken'
}

const ITEMS: ItemConfig[] = [
  {
    key: 'creatine',
    label: 'Uống 5g Creatine',
    sub: 'Tăng sức mạnh & phát triển cơ',
    dbField: 'creatine_taken',
  },
  {
    key: 'omega3Morning',
    label: 'Omega-3 Buổi sáng',
    sub: '1 viên OstroVit Extreme sau ăn',
    dbField: 'omega3_morning_taken',
  },
  {
    key: 'omega3Evening',
    label: 'Omega-3 Buổi tối',
    sub: '1 viên OstroVit Extreme sau ăn',
    dbField: 'omega3_evening_taken',
  },
]

export function SupplementsCard({ date, day }: { date: string; day: DayLog }) {
  const [syncingKey, setSyncingKey] = useState<string | null>(null)

  const isChecked = (key: SupplementKey): boolean => {
    if (key === 'creatine') return Boolean(day.supplements.creatine)
    if (key === 'omega3Morning') return Boolean(day.supplements.omega3Morning)
    if (key === 'omega3Evening') return Boolean(day.supplements.omega3Evening)
    return false
  }

  const doneCount = ITEMS.filter((i) => isChecked(i.key)).length
  const allDone = doneCount === ITEMS.length

  const handleToggle = async (item: ItemConfig, checked: boolean) => {
    // 1. Update local storage
    updateDay(date, (d) => ({
      ...d,
      supplements: {
        ...d.supplements,
        [item.key]: checked,
      },
    }))

    // 2. Sync to Supabase daily_tracking table
    setSyncingKey(item.key)
    try {
      const totals = dayTotals(day)
      await upsertDailyTracking(date, {
        consumed_protein: round1(totals.protein),
        consumed_carb: round1(totals.carbs),
        consumed_fat: round1(totals.fat),
        creatine_taken: item.key === 'creatine' ? checked : Boolean(day.supplements.creatine),
        omega3_morning_taken:
          item.key === 'omega3Morning' ? checked : Boolean(day.supplements.omega3Morning),
        omega3_evening_taken:
          item.key === 'omega3Evening' ? checked : Boolean(day.supplements.omega3Evening),
      })
    } catch (err) {
      console.error('Failed to sync supplement to Supabase:', err)
    } finally {
      setSyncingKey(null)
    }
  }

  return (
    <Card className={cn('transition-all', allDone && 'border-primary/50 bg-primary/5')}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Pill className="size-4 text-primary" aria-hidden="true" />
            Thực phẩm bổ sung
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
              allDone ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
            )}
          >
            {allDone ? <Check className="size-3" /> : null}
            {doneCount}/{ITEMS.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {ITEMS.map((item) => {
          const checked = isChecked(item.key)
          const isSyncing = syncingKey === item.key
          const id = `supp-${item.key}`

          return (
            <label
              key={item.key}
              htmlFor={id}
              className={cn(
                'group flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-sm transition-all select-none',
                checked
                  ? 'border-primary/40 bg-primary/10 hover:bg-primary/15'
                  : 'bg-muted/40 hover:bg-muted border-transparent',
              )}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={(value) => handleToggle(item, value === true)}
                  className="size-5 rounded-md"
                />
                <div className="flex flex-col">
                  <span
                    className={cn(
                      'font-medium transition-colors',
                      checked && 'text-muted-foreground line-through',
                    )}
                  >
                    {item.label}
                  </span>
                  {item.sub && (
                    <span className="text-[11px] text-muted-foreground">{item.sub}</span>
                  )}
                </div>
              </div>

              {isSyncing ? (
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              ) : checked ? (
                <CheckCircle2 className="size-4 text-primary opacity-80" />
              ) : null}
            </label>
          )
        })}

        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Cloud className="size-3 text-primary" />
            Đồng bộ Supabase
          </span>
          <span>{allDone ? 'Hoàn thành ngày!' : 'Chưa đủ'}</span>
        </div>
      </CardContent>
    </Card>
  )
}
