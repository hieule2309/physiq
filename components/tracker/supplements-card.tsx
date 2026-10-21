'use client'

import { Pill } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import type { DayLog } from '@/lib/fitness'
import { updateDay } from '@/lib/storage'
import { cn } from '@/lib/utils'

const ITEMS = [
  { key: 'creatine', label: 'Uống 5g Creatine' },
  { key: 'omega3', label: 'Uống 2 viên OstroVit Omega-3 Extreme' },
] as const

export function SupplementsCard({ date, day }: { date: string; day: DayLog }) {
  const done = ITEMS.filter((i) => day.supplements[i.key]).length
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Pill className="size-4 text-primary" aria-hidden="true" />
            Thực phẩm bổ sung
          </span>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {done}/{ITEMS.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {ITEMS.map((item) => {
          const checked = day.supplements[item.key]
          const id = `supp-${item.key}`
          return (
            <label
              key={item.key}
              htmlFor={id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-colors',
                checked ? 'border-primary/40 bg-primary/10' : 'bg-muted/40 hover:bg-muted',
              )}
            >
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(value) =>
                  updateDay(date, (d) => ({ ...d, supplements: { ...d.supplements, [item.key]: value === true } }))
                }
                className="size-5"
              />
              <span className={cn('font-medium', checked && 'text-muted-foreground line-through')}>{item.label}</span>
            </label>
          )
        })}
      </CardContent>
    </Card>
  )
}
