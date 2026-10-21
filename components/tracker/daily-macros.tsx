import { Card, CardContent } from '@/components/ui/card'
import { TARGETS } from '@/lib/fitness'
import { fmt, ProgressBar } from './shared'

type Totals = { kcal: number; protein: number; carbs: number; fat: number }

const MACROS = [
  { key: 'protein', label: 'Protein', color: 'bg-protein', text: 'text-protein' },
  { key: 'carbs', label: 'Carb', color: 'bg-carbs', text: 'text-carbs' },
  { key: 'fat', label: 'Fat', color: 'bg-fat', text: 'text-fat' },
] as const

export function DailyMacros({ totals, burned }: { totals: Totals; burned: number }) {
  const remaining = TARGETS.kcal - totals.kcal + burned
  const pct = Math.min(1, totals.kcal / TARGETS.kcal)
  const r = 52
  const circ = 2 * Math.PI * r
  const over = totals.kcal > TARGETS.kcal

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center gap-5">
          <div className="relative size-32 shrink-0">
            <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
              <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
              <circle
                cx="60"
                cy="60"
                r={r}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct)}
                className={over ? 'stroke-destructive' : 'stroke-primary'}
                style={{ transition: 'stroke-dashoffset 600ms ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold tabular-nums">{fmt(totals.kcal)}</span>
              <span className="text-xs text-muted-foreground">/ {fmt(TARGETS.kcal)} kcal</span>
            </div>
          </div>

          <dl className="flex flex-1 flex-col gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Còn lại</dt>
              <dd className={`text-xl font-bold tabular-nums ${remaining < 0 ? 'text-destructive' : 'text-primary'}`}>
                {fmt(remaining)} <span className="text-xs font-medium text-muted-foreground">kcal</span>
              </dd>
            </div>
            <div className="flex gap-4">
              <div>
                <dt className="text-xs text-muted-foreground">Đã nạp</dt>
                <dd className="font-semibold tabular-nums">{fmt(totals.kcal)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Cardio đốt</dt>
                <dd className="font-semibold tabular-nums">+{fmt(burned)}</dd>
              </div>
            </div>
          </dl>
        </div>

        <ProgressBar value={totals.kcal} max={TARGETS.kcal} label="Calo nạp vào" />

        <div className="flex flex-col gap-3">
          {MACROS.map((m) => {
            const value = totals[m.key]
            const target = TARGETS[m.key]
            return (
              <div key={m.key} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className={`font-semibold ${m.text}`}>{m.label}</span>
                  <span className="tabular-nums">
                    <span className="font-bold">{fmt(value, 1)}</span>
                    <span className="text-muted-foreground"> / {target}g</span>
                  </span>
                </div>
                <ProgressBar value={value} max={target} colorClass={m.color} label={m.label} />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
