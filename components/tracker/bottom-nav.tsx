'use client'

import { BarChart2, Dumbbell, LayoutDashboard, Scale, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TabId = 'overview' | 'nutrition' | 'weight' | 'workout' | 'analytics'

const ITEMS: { id: TabId; label: string; icon: typeof Dumbbell }[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'nutrition', label: 'Dinh dưỡng', icon: UtensilsCrossed },
  { id: 'weight', label: 'Cân nặng', icon: Scale },
  { id: 'workout', label: 'Tập luyện', icon: Dumbbell },
  { id: 'analytics', label: 'Thống kê', icon: BarChart2 },
]

export function BottomNav({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => {
                  onChange(id)
                  window.scrollTo({ top: 0 })
                }}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex w-full flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-10 items-center justify-center rounded-full transition-colors',
                    isActive && 'bg-primary/15',
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

