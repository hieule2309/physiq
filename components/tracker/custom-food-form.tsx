'use client'

import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { QuickFood } from '@/lib/fitness'

const FIELDS = [
  { key: 'kcal', label: 'Kcal' },
  { key: 'protein', label: 'Protein (g)' },
  { key: 'carbs', label: 'Carb (g)' },
  { key: 'fat', label: 'Fat (g)' },
] as const

export function CustomFoodForm({ onAdd }: { onAdd: (food: QuickFood) => void }) {
  const [open, setOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const num = (k: string) => Math.max(0, Number(form.get(k)) || 0)
    const name = String(form.get('name') ?? '').trim()
    if (!name) return
    onAdd({ name, kcal: num('kcal'), protein: num('protein'), carbs: num('carbs'), fat: num('fat') })
    e.currentTarget.reset()
  }

  return (
    <div className="rounded-lg border border-dashed">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-semibold"
      >
        Nhập món tùy chỉnh
        <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-3 pb-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="food-name">Tên món</Label>
            <Input id="food-name" name="name" placeholder="VD: 200g Khoai lang" required maxLength={60} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {FIELDS.map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <Label htmlFor={`food-${f.key}`} className="text-xs">
                  {f.label}
                </Label>
                <Input
                  id={`food-${f.key}`}
                  name={f.key}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.1"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <Button type="submit" size="lg">
            <Plus data-icon="inline-start" />
            Thêm món
          </Button>
        </form>
      )}
    </div>
  )
}
