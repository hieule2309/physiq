import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    const expectedUser = process.env.AUTH_USERNAME || 'admin'
    const expectedPass = process.env.AUTH_PASSWORD || 'admin123'
    const authToken = process.env.AUTH_TOKEN || 'fittrack_secret_session_token_xyz987'

    if (
      typeof username === 'string' &&
      typeof password === 'string' &&
      username.trim() === expectedUser.trim() &&
      password === expectedPass
    ) {
      const cookieStore = await cookies()
      cookieStore.set('fittrack_session', authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 ngày
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' },
      { status: 401 }
    )
  } catch (err) {
    console.error('Lỗi API Login:', err)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra trong quá trình xử lý.' },
      { status: 500 }
    )
  }
}
