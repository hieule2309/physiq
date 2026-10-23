'use client'

import { useState } from 'react'
import { ChevronsLeftRight, GitCompareArrows } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { formatDateShort } from '@/lib/fitness'
import { NativeSelect } from './shared'

export type PhotoMap = Record<string, string>

export function CompareSlider({ photos, dates }: { photos: PhotoMap; dates: string[] }) {
  const [beforeSel, setBefore] = useState<string | null>(null)
  const [afterSel, setAfter] = useState<string | null>(null)
  const [pos, setPos] = useState(50)

  if (dates.length < 2) {
    return (
      <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        Cần ít nhất 2 ảnh ở 2 ngày khác nhau để dùng tính năng so sánh Before/After.
      </p>
    )
  }

  const before = beforeSel && photos[beforeSel] ? beforeSel : dates[0]
  const after = afterSel && photos[afterSel] ? afterSel : dates[dates.length - 1]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompareArrows className="size-4 text-primary" aria-hidden="true" />
          So sánh Before / After
        </CardTitle>
        <CardDescription>Kéo thanh trượt để so sánh 2 ngày bất kỳ.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cmp-before">Before</Label>
            <NativeSelect id="cmp-before" value={before} onChange={(e) => setBefore(e.target.value)}>
              {dates.map((d) => (
                <option key={d} value={d}>
                  {formatDateShort(d)}/{d.slice(0, 4)}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cmp-after">After</Label>
            <NativeSelect id="cmp-after" value={after} onChange={(e) => setAfter(e.target.value)}>
              {dates.map((d) => (
                <option key={d} value={d}>
                  {formatDateShort(d)}/{d.slice(0, 4)}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <div className="relative aspect-[3/4] w-full touch-none overflow-hidden rounded-lg border select-none">
          {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URLs */}
          <img src={photos[after]} alt={`After ${formatDateShort(after)}`} className="absolute inset-0 size-full object-cover" />
          {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URLs */}
          <img
            src={photos[before]}
            alt={`Before ${formatDateShort(before)}`}
            className="absolute inset-0 size-full object-cover"
            style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          />
          <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-primary" style={{ left: `${pos}%` }}>
            <span className="absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <ChevronsLeftRight className="size-5" aria-hidden="true" />
            </span>
          </div>
          <span className="pointer-events-none absolute top-2 left-2 rounded-md bg-background/80 px-2 py-0.5 text-xs font-semibold">
            Before · {formatDateShort(before)}
          </span>
          <span className="pointer-events-none absolute top-2 right-2 rounded-md bg-background/80 px-2 py-0.5 text-xs font-semibold">
            After · {formatDateShort(after)}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            aria-label="Vị trí thanh so sánh"
            className="absolute inset-0 size-full cursor-ew-resize opacity-0"
          />
        </div>
      </CardContent>
    </Card>
  )
}
