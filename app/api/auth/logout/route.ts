import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('fittrack_session')
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Lỗi API Logout:', err)
    return NextResponse.json(
      { error: 'Không thể đăng xuất' },
      { status: 500 }
    )
  }
}
