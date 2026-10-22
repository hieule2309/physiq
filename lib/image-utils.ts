/**
 * Helper nén và convert file ảnh sang định dạng WebP.
 * Hỗ trợ toàn diện:
 * 1. Với ảnh HEIC/HEIF (từ iPhone): Tự động chuyển đổi mượt mà qua API route sử dụng Sharp C++ native.
 * 2. Với ảnh JPEG/PNG/WEBP thông thường: Chuyển đổi siêu nhanh ngay tại Client bằng HTML5 Canvas.
 * 3. Tự động fallback linh hoạt nếu có bất kỳ lỗi nào.
 *
 * @param file File ảnh gốc (PNG, JPG, HEIC, WEBP, ...)
 * @param maxWidth Chiều rộng tối đa (giữ nguyên tỷ lệ, mặc định 1200px)
 * @param quality Chất lượng nén từ 0.0 đến 1.0 (mặc định 0.82)
 * @returns Promise<Blob> Blob ảnh định dạng image/webp
 */
export async function convertImageToWebP(
  file: File,
  maxWidth = 1200,
  quality = 0.82,
): Promise<Blob> {
  const fileName = (file.name || '').toLowerCase()
  const isHeic =
    fileName.endsWith('.heic') ||
    fileName.endsWith('.heif') ||
    file.type === 'image/heic' ||
    file.type === 'image/heif'

  // 1. Ảnh HEIC/HEIF từ iPhone: Chuyển đổi qua endpoint Sharp siêu tốc và chính xác 100%
  if (isHeic) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/convert-webp', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      if (res.ok) {
        const webpBlob = await res.blob()
        return webpBlob
      } else {
        const errJson = await res.json().catch(() => ({}))
        console.warn('Endpoint /api/convert-webp trả về lỗi:', errJson)
      }
    } catch (e) {
      console.warn('Lỗi gọi /api/convert-webp cho file HEIC, thử giải mã client:', e)
    }
  }

  // 2. Ảnh tiêu chuẩn (JPEG, PNG, WEBP): Nén ngay tại Browser bằng HTML5 Canvas
  if (typeof window !== 'undefined' && typeof window.createImageBitmap === 'function') {
    try {
      const bitmap = await window.createImageBitmap(file)
      let { width, height } = bitmap

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, width, height)
        bitmap.close()

        let blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/webp', quality),
        )

        // Nếu browser không hỗ trợ xuất WebP, fallback sang JPEG
        if (!blob) {
          blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', quality),
          )
        }

        if (blob) {
          return blob
        }
      }
    } catch (bitmapErr) {
      console.warn('Client canvas không đọc được, chuyển tiếp sang Sharp fallback:', bitmapErr)
    }
  }

  // 3. Tầng Fallback an toàn: Dùng Sharp trên server
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/convert-webp', {
      method: 'POST',
      body: formData,
    })
    if (res.ok) {
      return await res.blob()
    }
  } catch (err) {
    console.warn('Server sharp fallback failed:', err)
  }

  // 4. Nếu bất khả kháng, trả về file gốc
  return file
}
