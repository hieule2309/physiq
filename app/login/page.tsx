'use client'

import { useState } from 'react'
import { Flame, Lock, User, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!username.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Tên đăng nhập hoặc mật khẩu không chính xác.')
        return
      }

      // Đăng nhập thành công -> chuyển về trang chủ
      window.location.href = '/'
    } catch (err: unknown) {
      console.error('Lỗi đăng nhập:', err)
      setErrorMsg('Đã có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      {/* Background ambient glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="w-full max-w-sm">
        {/* Logo & Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Flame className="size-8" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">FitTrack</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Hệ thống quản lý dinh dưỡng & tập luyện cá nhân
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border border-border/80 bg-card/80 p-6 shadow-xl backdrop-blur-xl">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {errorMsg && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-sm text-destructive animate-in fade-in"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username" className="text-xs font-semibold text-foreground">
                Tên đăng nhập
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                Mật khẩu
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 w-full font-bold shadow-md shadow-primary/20"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Bảo mật một người dùng &bull; Cấu hình qua file .env
        </p>
      </div>
    </div>
  )
}
