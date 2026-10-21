'use client'

import { useRef, useState } from 'react'
import { Camera, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateShort } from '@/lib/fitness'
import { compressImage, removePhoto, setPhoto, usePhotos } from '@/lib/storage'
import { CompareSlider } from './compare-slider'

export function PhotoTracker({ date }: { date: string }) {
  const photos = usePhotos()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const current = photos[date]
  const dates = Object.keys(photos).sort()

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const dataUrl = await compressImage(file)
      if (!setPhoto(date, dataUrl)) {
        setError('Bộ nhớ trình duyệt đã đầy. Hãy xóa bớt ảnh cũ.')
      }
    } catch {
      setError('Không đọc được ảnh. Vui lòng thử ảnh khác.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="size-4 text-primary" aria-hidden="true" />
            Ảnh Progress Body
          </CardTitle>
          <CardDescription>Ảnh được nén và lưu trên thiết bị này.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            id="photo-input"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {current ? (
            <div className="relative overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element -- data URLs from localStorage */}
              <img src={current} alt={`Ảnh body ngày ${formatDateShort(date)}`} className="aspect-[3/4] w-full object-cover" />
              <div className="absolute inset-x-2 bottom-2 flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => fileRef.current?.click()} disabled={busy}>
                  {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
                  Thay ảnh
                </Button>
                <Button variant="destructive" size="icon" aria-label="Xóa ảnh" onClick={() => removePhoto(date)}>
                  <Trash2 />
                </Button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="photo-input"
              className="flex aspect-[3/4] max-h-72 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {busy ? (
                <Loader2 className="size-6 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="size-6 text-primary" aria-hidden="true" />
              )}
              <span className="font-semibold">Tải ảnh hôm nay</span>
              <span className="text-xs">Chụp hoặc chọn từ thư viện</span>
            </label>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          {dates.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Thư viện ({dates.length} ảnh)</span>
              <ul className="flex gap-2 overflow-x-auto pb-1">
                {[...dates].reverse().map((d) => (
                  <li key={d} className="shrink-0">
                    <figure
                      className={`w-16 overflow-hidden rounded-md border ${d === date ? 'border-primary' : ''}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- data URLs from localStorage */}
                      <img src={photos[d]} alt={`Ảnh ngày ${formatDateShort(d)}`} className="aspect-[3/4] w-full object-cover" />
                      <figcaption className="py-0.5 text-center text-[10px] tabular-nums text-muted-foreground">
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
