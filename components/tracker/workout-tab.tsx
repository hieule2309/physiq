'use client'

import { useState, useEffect } from 'react'
import { BedDouble, CheckCircle2, Cloud, Dumbbell, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CARDIO_TYPES, getDay, uid, WORKOUT_TYPES, type WorkoutType } from '@/lib/fitness'
import { useUserSettings } from '@/lib/settings-context'
import { updateDay, useAppData } from '@/lib/storage'
import { getWorkoutLog, saveWorkoutLogInSupabase } from '@/lib/supabase-helpers'
import { cn } from '@/lib/utils'
import { CardioCard } from './cardio-card'

export function WorkoutTab({ date }: { date: string }) {
  const data = useAppData()
  const { settings } = useUserSettings()
  const day = getDay(data, date)
  const isRest = day.workoutType === 'rest'
  const proteinTarget = settings?.target_protein ?? 160

  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [setsInput, setSetsInput] = useState('4')

  // Load workout log from Supabase on date change if local has no entries yet
  useEffect(() => {
    let cancelled = false
    async function fetchRemoteWorkout() {
      if (day.workoutType || day.exercises.length > 0) return
      try {
        const remote = await getWorkoutLog(date)
        if (cancelled || !remote) return

        // Map remote workout_type back to WorkoutType id
        const matchedType = WORKOUT_TYPES.find(
          (w) => w.label.toLowerCase() === remote.workout_type.toLowerCase(),
        )

        updateDay(date, (d) => ({
          ...d,
          workoutType: (matchedType?.id as WorkoutType) ?? (remote.workout_type === 'Nghỉ' ? 'rest' : null),
          exercises: remote.exercises.map((e) => ({
            id: uid(),
            name: e.exercise_name,
            sets: e.sets,
          })),
        }))
      } catch (err) {
        console.error('Failed to load remote workout:', err)
      }
    }

    fetchRemoteWorkout()
    return () => {
      cancelled = true
    }
  }, [date, day.workoutType, day.exercises.length])

  // Add exercise handler
  const handleAddExercise = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = String(form.get('gym_ex_name_v2') ?? '').trim()
    const sets = Math.max(1, Math.round(Number(form.get('gym_ex_sets_v2')) || 4))

    if (!name) return

    updateDay(date, (d) => ({
      ...d,
      exercises: [...d.exercises, { id: uid(), name, sets }],
    }))

    // Reset input fields
    const nameInput = e.currentTarget.elements.namedItem('gym_ex_name_v2') as HTMLInputElement | null
    if (nameInput) {
      nameInput.value = ''
      nameInput.focus()
    }
    setSetsInput('4')
  }

  // Save workout to Supabase
  const handleSaveWorkout = async () => {
    setSaving(true)
    setSaveSuccess(false)

    try {
      const workoutLabel =
        WORKOUT_TYPES.find((w) => w.id === day.workoutType)?.label ??
        (isRest ? 'Nghỉ' : 'Khác')

      const exercisesPayload = isRest
        ? []
        : day.exercises.map((e) => ({
            exercise_name: e.name,
            sets: e.sets,
          }))

      const primaryCardio = !isRest && day.cardio.length > 0 ? day.cardio[0] : null
      const cardioTypeLabel = primaryCardio
        ? CARDIO_TYPES.find((c) => c.id === primaryCardio.type)?.label ?? primaryCardio.type
        : null

      const cardioMinutes = isRest ? 0 : day.cardio.reduce((acc, c) => acc + c.minutes, 0)
      const cardioBurned = isRest ? 0 : day.cardio.reduce((acc, c) => acc + c.kcal, 0)

      const saved = await saveWorkoutLogInSupabase({
        date,
        workout_type: workoutLabel,
        exercises: exercisesPayload,
        cardio_type: cardioTypeLabel,
        cardio_duration_minutes: cardioMinutes,
        cardio_calories_burned: cardioBurned,
      })

      if (saved) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save workout log:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* 1. Workout Type Selector */}
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
                  onClick={() =>
                    updateDay(date, (d) => ({ ...d, workoutType: active ? null : w.id }))
                  }
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

      {/* 2. Rest Day or Exercise + Cardio Content */}
      {isRest ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center bg-card">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BedDouble className="size-7" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-base font-bold text-foreground">Hôm nay là Ngày nghỉ (Rest Day)</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Cơ bắp phát triển khi nghỉ ngơi. Hãy ngủ đủ 7–9 tiếng và đảm bảo nạp đủ{' '}
              <strong className="text-primary">{proteinTarget}g Protein</strong> trong ngày.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Exercise Card with Simplified UI (Name + Sets only) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Bài tập</span>
                {day.exercises.length > 0 && (
                  <span className="text-xs font-semibold text-primary tabular-nums">
                    {day.exercises.length} bài đã thêm
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Form Input: Name + Sets only with anti-autofill attributes */}
              <form onSubmit={handleAddExercise} className="flex flex-col gap-3">
                <div className="grid grid-cols-[1fr_6.5rem] gap-2.5">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="gym_ex_name_v2">Tên bài tập</Label>
                    <Input
                      id="gym_ex_name_v2"
                      name="gym_ex_name_v2"
                      placeholder="VD: Bench Press, Squat..."
                      required
                      maxLength={60}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-form-type="other"
                      className="h-10"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="gym_ex_sets_v2">Số sets</Label>
                    <Input
                      id="gym_ex_sets_v2"
                      name="gym_ex_sets_v2"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={50}
                      value={setsInput}
                      onChange={(e) => setSetsInput(e.target.value)}
                      placeholder="4"
                      required
                      className="h-10 text-center font-bold"
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="font-semibold">
                  <Plus className="size-4" data-icon="inline-start" />
                  Thêm bài tập
                </Button>
              </form>

              {/* Added exercises list: Name & Sets only */}
              {day.exercises.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">Chưa ghi bài tập nào.</p>
              ) : (
                <ol className="flex flex-col gap-2">
                  {day.exercises.map((ex, i) => (
                    <li
                      key={ex.id}
                      className="flex items-center gap-3 rounded-lg bg-muted/40 px-3.5 py-2.5 transition-colors hover:bg-muted/60"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{ex.name}</span>
                        <span className="shrink-0 rounded-md bg-background/80 px-2.5 py-1 text-xs font-bold tabular-nums text-foreground border">
                          {ex.sets} sets
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Xóa ${ex.name}`}
                        onClick={() =>
                          updateDay(date, (d) => ({
                            ...d,
                            exercises: d.exercises.filter((x) => x.id !== ex.id),
                          }))
                        }
                      >
                        <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Cardio Card (Hidden when Rest) */}
          <CardioCard date={date} />
        </>
      )}

      {/* 3. Save Workout Button to Supabase */}
      <Button
        type="button"
        size="lg"
        onClick={handleSaveWorkout}
        disabled={saving}
        className={cn(
          'h-12 w-full text-base font-bold shadow-md transition-all',
          saveSuccess && 'bg-green-600 hover:bg-green-700 text-white',
        )}
      >
        {saving ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Đang lưu buổi tập lên Supabase…
          </>
        ) : saveSuccess ? (
          <>
            <CheckCircle2 className="size-5" />
            Đã lưu buổi tập thành công!
          </>
        ) : (
          <>
            <Cloud className="size-5" />
            {isRest ? 'Lưu ngày nghỉ vào Supabase' : 'Hoàn tất & Lưu buổi tập'}
          </>
        )}
      </Button>
    </>
  )
}
