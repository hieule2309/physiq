'use client'

import { useMemo, useState } from 'react'
import { HeartPulse, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CARDIO_TYPES, cardioKcal, uid, type CardioType } from '@/lib/fitness'
import { useUserSettings } from '@/lib/settings-context'
import { useDailyData } from '@/lib/daily-data-context'
import { fmt, NativeSelect } from './shared'

export function CardioCard({ date }: { date: string }) {
  const { getDay, updateDay, days } = useDailyData()
  const { settings } = useUserSettings()
  const day = getDay(date)
  const [type, setType] = useState<CardioType>('incline-walk')
  const [minutes, setMinutes] = useState('')
  const startWeight = settings?.weight ?? 76

  // Get latest weight from context days data
  const weight = useMemo(() => {
    const keys = Object.keys(days)
      .filter((k) => k <= date && typeof days[k].weight === 'number')
      .sort()
    const last = keys.at(-1)
    return last ? (days[last].weight as number) : startWeight
  }, [days, date, startWeight])

  const mins = Math.max(0, Number(minutes) || 0)
  const preview = cardioKcal(type, mins, weight)
  const total = day.cardio.reduce((a, c) => a + c.kcal, 0)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (mins <= 0) return
    updateDay(date, (d) => ({ ...d, cardio: [...d.cardio, { id: uid(), type, minutes: mins, kcal: preview }] }))
    setMinutes('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <HeartPulse className="size-4 text-primary" aria-hidden="true" />
            Cardio
          </span>
          <span className="text-sm font-semibold tabular-nums text-primary">{fmt(total)} kcal</span>
        </CardTitle>
        <CardDescription>Calo ước tính theo MET × {weight}kg × thời gian.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-[1fr_6rem] gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cardio-type">Hình thức</Label>
              <NativeSelect id="cardio-type" value={type} onChange={(e) => setType(e.target.value as CardioType)}>
                {CARDIO_TYPES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cardio-min">Số phút</Label>
              <Input
                id="cardio-min"
                type="number"
                inputMode="numeric"
                min={1}
                max={600}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="30"
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5 text-sm">
            <span className="text-muted-foreground">Calo tiêu hao dự kiến</span>
            <span className="font-bold tabular-nums text-primary" aria-live="polite">
              ~{fmt(preview)} kcal
            </span>
          </div>
          <Button type="submit" size="lg" disabled={mins <= 0}>
            <Plus data-icon="inline-start" />
            Thêm cardio
          </Button>
        </form>

        {day.cardio.length > 0 && (
          <ul className="flex flex-col divide-y">
            {day.cardio.map((c) => (
              <li key={c.id} className="flex items-center gap-2 py-2 first:pt-0 last:pb-0">
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold">{CARDIO_TYPES.find((t) => t.id === c.type)?.label}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {c.minutes} phút · {fmt(c.kcal)} kcal
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Xóa cardio"
                  onClick={() => updateDay(date, (d) => ({ ...d, cardio: d.cardio.filter((x) => x.id !== c.id) }))}
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
}
