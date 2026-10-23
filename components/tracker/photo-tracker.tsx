'use client'

import { useRef, useState } from 'react'
import { Camera, Check, Cloud, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateShort } from '@/lib/fitness'
import { useDailyData } from '@/lib/daily-data-context'
import { deleteProgressImage, uploadProgressImage } from '@/lib/supabase-helpers'
import { CompareSlider } from './compare-slider'

export function PhotoTracker({ date }: { date: string }) {
  const { photos, setPhoto, removePhoto } = useDailyData()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const current = photos[date]
  const dates = Object.keys(photos).sort()

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setBusy(true)
    setSuccess(false)

    try {
      // 1. Convert to WebP & Upload to Supabase Storage 'progress-images'
      // 2. Automatically updates image_url in weight_logs
      const publicUrl = await uploadProgressImage(file, date)

      // 3. Update context photos for immediate preview & compare slider
      setPhoto(date, publicUrl)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      console.error('Lỗi upload ảnh progress:', err)
      const msg = err instanceof Error ? err.message : 'Lỗi khi upload ảnh lên Supabase Storage.'
      setError(msg)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa ảnh progress của ngày này?')) return
    setBusy(true)
    try {
      await deleteProgressImage(date)
      removePhoto(date)
    } catch (err) {
      console.error('Lỗi xóa ảnh:', err)
      setError('Không thể xóa ảnh. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="size-4 text-primary" aria-hidden="true" />
              Ảnh Progress Body
            </CardTitle>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Cloud className="size-3.5 text-blue-400" />
              <span>Storage WebP</span>
            </div>
          </div>
          <CardDescription>
            Ảnh được tự động nén & chuyển sang định dạng .WebP, lưu an toàn trên Supabase Storage.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,image/*"
            capture="environment"
            className="sr-only"
            id="photo-input"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          {current ? (
            <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current}
                alt={`Ảnh body ngày ${formatDateShort(date)}`}
                className="aspect-[3/4] w-full object-cover"
                loading="lazy"
              />

              {/* Status indicator badge */}
              <div className="absolute top-2 right-2 rounded-md bg-black/60 px-2 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md">
                .WebP Cloud
              </div>

              {/* Action buttons bar */}
              <div className="absolute inset-x-2 bottom-2 flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 bg-background/90 shadow-md backdrop-blur-md hover:bg-background"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-1.5 size-4 animate-spin" />
                      Đang tải lên...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="mr-1.5 size-4" />
                      Thay ảnh
                    </>
                  )}
                </Button>

                <Button
                  variant="destructive"
                  size="icon"
                  aria-label="Xóa ảnh"
                  onClick={handleDelete}
                  disabled={busy}
                  className="shadow-md"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="photo-input"
              className={`flex aspect-[3/4] max-h-72 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/20 text-sm text-muted-foreground transition-all hover:border-primary/50 hover:bg-muted/40 hover:text-foreground ${
                busy ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              {busy ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
                  <span className="text-xs font-semibold text-primary">
                    Đang nén WebP & Upload...
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ImagePlus className="size-6" aria-hidden="true" />
                  </div>
                  <span className="font-semibold text-foreground">Tải ảnh hôm nay</span>
                  <span className="text-xs text-muted-foreground">
                    Tự động nén WebP trước khi lưu
                  </span>
                </>
              )}
            </label>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2 text-xs font-medium text-emerald-400">
              <Check className="size-4" />
              <span>Đã lưu ảnh WebP lên Supabase Storage thành công!</span>
            </div>
          )}

          {error && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {error}
            </p>
          )}

          {/* Gallery carousel / thumbnail list */}
          {dates.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Thư viện ({dates.length} ảnh)
              </span>
              <ul className="flex gap-2.5 overflow-x-auto pb-1.5">
                {[...dates].reverse().map((d) => (
                  <li key={d} className="shrink-0">
                    <figure
                      className={`relative w-16 overflow-hidden rounded-lg border transition-all ${
                        d === date
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-border/60 opacity-80 hover:opacity-100'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photos[d]}
                        alt={`Ảnh ngày ${formatDateShort(d)}`}
                        className="aspect-[3/4] w-full object-cover"
                        loading="lazy"
                      />
                      <figcaption className="bg-background/90 py-0.5 text-center text-[10px] font-bold tabular-nums text-foreground">
                        {formatDateShort(d)}
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <CompareSlider photos={photos} dates={dates} />
    </>
  )
}
