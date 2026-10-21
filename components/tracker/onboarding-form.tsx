'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calculator, CheckCircle2, Loader2, Settings, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ACTIVITY_LEVELS,
  calculateBMR,
  calculateMacros,
  calculateTargetCalories,
  calculateTDEE,
  type Gender,
} from '@/lib/calculations'
import { useUserSettings } from '@/lib/settings-context'
import { cn } from '@/lib/utils'
import { NativeSelect } from '@/components/tracker/shared'

const formSchema = z.object({
  age: z.number().min(15).max(80),
  gender: z.enum(['male', 'female']),
  height: z.number().min(120).max(230),
  weight: z.number().min(30).max(250),
  activityLevel: z.number().min(1).max(2.5),
  caloricDeficit: z.number().min(-1500).max(0),
  goalWeight: z.number().min(30).max(250),
})

type FormValues = z.infer<typeof formSchema>

export function OnboardingForm({ onComplete }: { onComplete?: () => void }) {
  const { settings, saveSettings } = useUserSettings()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: settings?.age ?? 27,
      gender: (settings?.gender as Gender) ?? 'male',
      height: settings?.height ?? 175,
      weight: settings?.weight ?? 76,
      activityLevel: settings?.activity_level ?? 1.55,
      caloricDeficit: settings?.caloric_deficit ?? -500,
      goalWeight: settings?.goal_weight ?? 70,
    },
  })

  const watched = watch()
  const isValid =
    watched.age > 0 && watched.height > 0 && watched.weight > 0

  // Live preview calculations
  const previewBMR = isValid ? calculateBMR(watched.weight, watched.height, watched.age, watched.gender) : 0
  const previewTDEE = isValid ? calculateTDEE(previewBMR, watched.activityLevel) : 0
  const previewTarget = isValid ? calculateTargetCalories(previewTDEE, watched.caloricDeficit) : 0
  const previewMacros = isValid ? calculateMacros(previewTarget, watched.weight) : { protein: 0, carbs: 0, fat: 0 }

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    setSuccess(false)

    const bmr = calculateBMR(values.weight, values.height, values.age, values.gender)
    const tdee = calculateTDEE(bmr, values.activityLevel)
    const target = calculateTargetCalories(tdee, values.caloricDeficit)
    const macros = calculateMacros(target, values.weight)

    const ok = await saveSettings({
      age: values.age,
      gender: values.gender,
      height: values.height,
      weight: values.weight,
      activity_level: values.activityLevel,
      caloric_deficit: values.caloricDeficit,
      calculated_bmr: bmr,
      calculated_tdee: tdee,
      target_calories: target,
      target_protein: macros.protein,
      target_carb: macros.carbs,
      target_fat: macros.fat,
      goal_weight: values.goalWeight,
    })

    setSaving(false)
    if (ok) {
      setSuccess(true)
      setTimeout(() => onComplete?.(), 600)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Settings className="size-7" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {settings ? 'Cập nhật thông số' : 'Thiết lập ban đầu'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Nhập thông số cơ thể để tự động tính BMR, TDEE và phân bổ Macro.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
            <CardDescription>Dùng để tính BMR theo Mifflin-St Jeor.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="age">Tuổi</Label>
                <Input
                  id="age"
                  type="number"
                  inputMode="numeric"
                  {...register('age', { valueAsNumber: true })}
                  className={cn(errors.age && 'border-destructive')}
                />
                {errors.age && <span className="text-xs text-destructive">15-80 tuổi</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gender">Giới tính</Label>
                <NativeSelect id="gender" {...register('gender')}>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </NativeSelect>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="height">Chiều cao (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  {...register('height', { valueAsNumber: true })}
                  className={cn(errors.height && 'border-destructive')}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="weight">Cân nặng (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  {...register('weight', { valueAsNumber: true })}
                  className={cn(errors.weight && 'border-destructive')}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goalWeight">Cân nặng mục tiêu (kg)</Label>
              <Input
                id="goalWeight"
                type="number"
                inputMode="decimal"
                step="0.1"
                {...register('goalWeight', { valueAsNumber: true })}
                className={cn(errors.goalWeight && 'border-destructive')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mức vận động & Thâm hụt</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="activityLevel">Mức độ vận động</Label>
              <NativeSelect id="activityLevel" {...register('activityLevel', { valueAsNumber: true })}>
                {ACTIVITY_LEVELS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label} — {a.description} (×{a.value})
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="caloricDeficit">Thâm hụt Calo (kcal)</Label>
              <Input
                id="caloricDeficit"
                type="number"
                inputMode="numeric"
                step="50"
                {...register('caloricDeficit', { valueAsNumber: true })}
                className={cn(errors.caloricDeficit && 'border-destructive')}
              />
              <span className="text-xs text-muted-foreground">
                Nhập số âm. VD: -500 nghĩa là giảm 500 kcal so với TDEE.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Live preview */}
        {isValid && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="size-4 text-primary" aria-hidden="true" />
                Kết quả tính toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-muted/50 p-3">
                  <dt className="text-xs text-muted-foreground">BMR</dt>
                  <dd className="mt-0.5 text-lg font-bold tabular-nums">{previewBMR.toLocaleString('vi-VN')}</dd>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <dt className="text-xs text-muted-foreground">TDEE</dt>
                  <dd className="mt-0.5 text-lg font-bold tabular-nums">{previewTDEE.toLocaleString('vi-VN')}</dd>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <dt className="text-xs text-muted-foreground">Target</dt>
                  <dd className="mt-0.5 text-lg font-bold tabular-nums text-primary">
                    {previewTarget.toLocaleString('vi-VN')}
                  </dd>
                </div>
              </dl>
              <div className="mt-3 flex gap-3">
                <div className="flex-1 rounded-lg bg-muted/50 p-2 text-center">
                  <span className="text-xs font-semibold text-protein">Protein</span>
                  <p className="text-sm font-bold tabular-nums">{previewMacros.protein}g</p>
                </div>
                <div className="flex-1 rounded-lg bg-muted/50 p-2 text-center">
                  <span className="text-xs font-semibold text-carbs">Carb</span>
                  <p className="text-sm font-bold tabular-nums">{previewMacros.carbs}g</p>
                </div>
                <div className="flex-1 rounded-lg bg-muted/50 p-2 text-center">
                  <span className="text-xs font-semibold text-fat">Fat</span>
                  <p className="text-sm font-bold tabular-nums">{previewMacros.fat}g</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Button type="submit" size="lg" disabled={saving} className="h-12 text-base font-bold">
          {saving ? (
            <>
              <Loader2 className="animate-spin" />
              Đang lưu…
            </>
          ) : success ? (
            <>
              <CheckCircle2 />
              Đã lưu!
            </>
          ) : (
            <>
              <Sparkles />
              {settings ? 'Cập nhật & Quay lại' : 'Bắt đầu ngay!'}
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
