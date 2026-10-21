'use client'

import { BedDouble, Dumbbell, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { exerciseVolume, getDay, uid, WORKOUT_TYPES } from '@/lib/fitness'
import { updateDay, useAppData } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { CardioCard } from './cardio-card'
import { fmt } from './shared'

export function WorkoutTab({ date }: { date: string }) {
  const data = useAppData()
  const day = getDay(data, date)
  const isRest = day.workoutType === 'rest'
  const totalVolume = day.exercises.reduce((a, e) => a + exerciseVolume(e), 0)

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const weight = Math.max(0, Number(form.get('weight')) || 0)
    const reps = Math.max(1, Math.round(Number(form.get('reps')) || 0))
    const sets = Math.max(1, Math.round(Number(form.get('sets')) || 0))
    if (!name) return
    updateDay(date, (d) => ({ ...d, exercises: [...d.exercises, { id: uid(), name, weight, reps, sets }] }))
    const nameInput = e.currentTarget.elements.namedItem('name') as HTMLInputElement | null
    nameInput?.focus()
    nameInput?.select()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="size-4 text-primary" aria-hidden="true" />
            Loại buổi tập
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div role="radiogroup" aria-label="Loại buổi tập" className="grid grid-cols-4 gap-2">
            {WORKOUT_TYPES.map((w) => {
              const active = day.workoutType === w.id
              return (
                <button
                  key={w.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => updateDay(date, (d) => ({ ...d, workoutType: active ? null : w.id }))}
                  className={cn(
                    'flex h-10 items-center justify-center gap-1 rounded-lg border text-sm font-semibold transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'bg-muted/40 text-muted-foreground hover:text-foreground',
                  )}
                >
                  {w.id === 'rest' && <BedDouble className="size-4" aria-hidden="true" />}
                  {w.label}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {isRest ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center">
          <BedDouble className="size-8 text-primary" aria-hidden="true" />
          <p className="font-semibold">Ngày nghỉ – phục hồi cơ bắp</p>
          <p className="text-sm text-muted-foreground">Ngủ đủ 7–9 tiếng và vẫn giữ đủ 160g protein nhé.</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Bài tập
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                Volume: {fmt(totalVolume)} kg
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ex-name">Tên bài</Label>
                <Input id="ex-name" name="name" placeholder="VD: Bench Press" required maxLength={60} list="ex-suggestions" />
                <datalist id="ex-suggestions">
                  {[...new Set(Object.values(data.days).flatMap((d) => d.exercises.map((e) => e.name)))].map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ex-weight">Tạ (kg)</Label>
                  <Input id="ex-weight" name="weight" type="number" inputMode="decimal" min={0} step="0.5" placeholder="60" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ex-reps">Reps</Label>
                  <Input id="ex-reps" name="reps" type="number" inputMode="numeric" min={1} step="1" placeholder="10" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ex-sets">Sets</Label>
                  <Input id="ex-sets" name="sets" type="number" inputMode="numeric" min={1} step="1" placeholder="3" required />
                </div>
              </div>
              <Button type="submit" size="lg">
                <Plus data-icon="inline-start" />
                Thêm bài tập
              </Button>
            </form>

            {day.exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa ghi bài tập nào.</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {day.exercises.map((ex, i) => (
                  <li key={ex.id} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-semibold">{ex.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {fmt(ex.weight, 1)}kg × {ex.reps} reps × {ex.sets} sets
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Xóa ${ex.name}`}
                      onClick={() => updateDay(date, (d) => ({ ...d, exercises: d.exercises.filter((x) => x.id !== ex.id) }))}
                    >
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      )}

      <CardioCard date={date} />
    </>
  )
}
