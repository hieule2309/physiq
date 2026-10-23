'use client'

import { useState } from 'react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BedDouble, CheckCircle2, Cloud, Dumbbell, GripVertical, Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CARDIO_TYPES, uid, WORKOUT_TYPES, type ExerciseEntry, type WorkoutType } from '@/lib/fitness'
import { useUserSettings } from '@/lib/settings-context'
import { useDailyData } from '@/lib/daily-data-context'
import { saveWorkoutLogInSupabase } from '@/lib/supabase-helpers'
import { cn } from '@/lib/utils'
import { CardioCard } from './cardio-card'

/* ---------- Sortable Exercise Item ---------- */

function SortableExerciseItem({
  ex,
  index,
  onDelete,
}: {
  ex: ExerciseEntry
  index: number
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ex.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2.5 transition-colors',
        isDragging
          ? 'z-50 opacity-80 shadow-xl ring-2 ring-primary/50 bg-card scale-[1.02]'
          : 'hover:bg-muted/60',
      )}
    >
      {/* Drag Handle */}
      <button
        type="button"
        aria-label="Kéo để sắp xếp"
        {...attributes}
        {...listeners}
        className="flex shrink-0 cursor-grab items-center justify-center rounded p-0.5 text-muted-foreground/50 transition-colors hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>

      {/* Index Badge */}
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary tabular-nums">
        {index + 1}
      </span>

      {/* Name + Sets */}
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold">{ex.name}</span>
        <span className="shrink-0 rounded-md border bg-background/80 px-2.5 py-1 text-xs font-bold tabular-nums text-foreground">
          {ex.sets} sets
        </span>
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Xóa ${ex.name}`}
        onClick={() => onDelete(ex.id)}
      >
        <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
      </Button>
    </li>
  )
}

/* ---------- WorkoutTab ---------- */

export function WorkoutTab({ date }: { date: string }) {
  const { getDay, updateDay } = useDailyData()
  const { settings } = useUserSettings()
  const day = getDay(date)
  const isRest = day.workoutType === 'rest'
  const proteinTarget = settings?.target_protein ?? 160

  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [setsInput, setSetsInput] = useState('4')

  // DnD sensors – supports mouse, touch, and keyboard
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Drag end handler – re-order exercises
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    updateDay(date, (d) => {
      const oldIndex = d.exercises.findIndex((e) => e.id === active.id)
      const newIndex = d.exercises.findIndex((e) => e.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return d
      return {
        ...d,
        exercises: arrayMove(d.exercises, oldIndex, newIndex),
      }
    })
  }

  const handleDeleteExercise = (id: string) => {
    updateDay(date, (d) => ({
      ...d,
      exercises: d.exercises.filter((x) => x.id !== id),
    }))
  }

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

      // Preserve current array order when saving to Supabase
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
          {/* Exercise Card with Drag & Drop */}
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
              {/* Form Input */}
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

              {/* Sortable Exercise List */}
              {day.exercises.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">Chưa ghi bài tập nào.</p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={day.exercises.map((e) => e.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ol className="flex flex-col gap-2">
                      {day.exercises.map((ex, i) => (
                        <SortableExerciseItem
                          key={ex.id}
                          ex={ex}
                          index={i}
                          onDelete={handleDeleteExercise}
                        />
                      ))}
                    </ol>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>

          {/* Cardio Card */}
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
