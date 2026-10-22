import { NextResponse } from 'next/server'
import sharp from 'sharp'
// @ts-expect-error heic-convert has no bundled type definitions
import convertHeic from 'heic-convert'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file ảnh' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    let buffer: Buffer = Buffer.from(arrayBuffer)

    const fileName = (file.name || '').toLowerCase()
    const isHeic =
      fileName.endsWith('.heic') ||
      fileName.endsWith('.heif') ||
      file.type === 'image/heic' ||
      file.type === 'image/heif'

    // 1. Nếu là file HEIC/HEIF: giải mã qua heic-convert sang JPEG trước
    if (isHeic) {
      try {
        const converted = await convertHeic({
          buffer,
          format: 'JPEG',
          quality: 0.95,
        })
        buffer = Buffer.from(converted)
      } catch (heicErr) {
        console.warn('heic-convert notice:', heicErr)
      }
    }

    // 2. Chuyển đổi và nén sang WebP bằng Sharp (tự xoay EXIF orientation)
    let webpBuffer: Buffer
    try {
      webpBuffer = await sharp(buffer)
        .rotate()
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer()
    } catch (sharpErr) {
      // Nếu sharp ban đầu không đọc được mà chưa thử qua heic-convert:
      if (!isHeic) {
        try {
          const converted = await convertHeic({
            buffer,
            format: 'JPEG',
            quality: 0.95,
          })
          webpBuffer = await sharp(Buffer.from(converted))
            .rotate()
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer()
        } catch {
          throw sharpErr
        }
      } else {
        throw sharpErr
      }
    }

    return new Response(webpBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error: unknown) {
    console.error('Lỗi khi convert ảnh sang WebP trên server:', error)
    const message = error instanceof Error ? error.message : 'Lỗi xử lý ảnh'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
