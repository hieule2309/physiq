import type * as React from 'react'
import { cn } from '@/lib/utils'

export function ProgressBar({
  value,
  max,
  colorClass = 'bg-primary',
  label,
}: {
  value: number
  max: number
  colorClass?: string
  label: string
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const over = value > max
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', over ? 'bg-destructive' : colorClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-9 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
      {...props}
    />
  )
}

export function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-base font-bold">
      <span className="text-primary">{icon}</span>
      {children}
    </h2>
  )
}

export function StatTile({
  label,
  value,
  unit,
  hint,
  className,
}: {
  label: string
  value: React.ReactNode
  unit?: string
  hint?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1 rounded-xl border bg-card p-3', className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-bold tabular-nums">
        {value}
        {unit && <span className="ml-1 text-xs font-medium text-muted-foreground">{unit}</span>}
      </span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}

export function fmt(n: number, digits = 0) {
  return n.toLocaleString('vi-VN', { maximumFractionDigits: digits })
}
