'use client'

import { BarChart2, Dumbbell, Flame, LayoutDashboard, LogOut, Scale, Settings, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/supabase-helpers'
import type { TabId } from './bottom-nav'

const NAV_ITEMS: { id: TabId; label: string; icon: typeof Dumbbell }[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'nutrition', label: 'Dinh dưỡng', icon: UtensilsCrossed },
  { id: 'weight', label: 'Cân nặng', icon: Scale },
  { id: 'workout', label: 'Tập luyện', icon: Dumbbell },
  { id: 'analytics', label: 'Thống kê', icon: BarChart2 },
]

export function DesktopSidebar({
  active,
  onChange,
  onOpenSettings,
}: {
  active: TabId
  onChange: (t: TabId) => void
  onOpenSettings: () => void
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card/80 backdrop-blur-xl md:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b px-5 py-5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Flame className="size-5" aria-hidden="true" />
        </span>
        <span className="text-xl font-extrabold tracking-tight">FitTrack</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 pt-4" aria-label="Điều hướng chính">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                onChange(id)
                window.scrollTo({ top: 0 })
              }}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                isActive
                  ? 'bg-primary/15 text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Footer buttons at bottom */}
      <div className="flex flex-col gap-1 border-t p-3">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings className="size-5" aria-hidden="true" />
          Cài đặt thông số
        </button>
        <button
          type="button"
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-5" aria-hidden="true" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
