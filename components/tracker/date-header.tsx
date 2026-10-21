'use client'

import { useRef } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addDays, formatDateLong, todayKey } from '@/lib/fitness'

export function DateHeader({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const today = todayKey()
  const isToday = date === today

  return (
    <header className="sticky top-0 z-20 border-b bg-background/85 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 backdrop-blur-lg">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="size-4.5" aria-hidden="true" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">FitTrack</span>
        </div>
        {!isToday && (
          <Button size="sm" variant="secondary" onClick={() => onChange(today)}>
            Về hôm nay
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon-lg" aria-label="Ngày trước" onClick={() => onChange(addDays(date, -1))}>
          <ChevronLeft />
        </Button>

        <button
          type="button"
          onClick={() => inputRef.current?.showPicker?.()}
          className="relative flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border bg-card px-3 text-sm font-semibold"
        >
          <CalendarDays className="size-4 text-primary" aria-hidden="true" />
          <span className="first-letter:uppercase">{isToday ? `Hôm nay · ${formatDateLong(date)}` : formatDateLong(date)}</span>
          <input
            ref={inputRef}
            type="date"
            value={date}
            max={today}
            onChange={(e) => e.target.value && onChange(e.target.value)}
            aria-label="Chọn ngày xem"
            className="pointer-events-none absolute inset-0 opacity-0"
            tabIndex={-1}
          />
        </button>

        <Button
          variant="outline"
          size="icon-lg"
          aria-label="Ngày sau"
          disabled={isToday}
          onClick={() => onChange(addDays(date, 1))}
        >
          <ChevronRight />
        </Button>
      </div>
    </header>
  )
}
