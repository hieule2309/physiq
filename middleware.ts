import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const authToken = process.env.AUTH_TOKEN || 'fittrack_secret_session_token_xyz987'
  const sessionCookie = request.cookies.get('fittrack_session')?.value
  const isAuthenticated = sessionCookie === authToken

  const pathname = request.nextUrl.pathname
  const isLoginPage = pathname === '/login'
  const isApi = pathname.startsWith('/api/')

  // Cho phép các API routes hoạt động không bị redirect sang trang HTML
  if (isApi) {
    return NextResponse.next()
  }

  // Chưa đăng nhập và truy cập trang khác -> redirect về /login
  if (!isAuthenticated && !isLoginPage) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Đã đăng nhập nhưng truy cập /login -> redirect về trang chủ /
  if (isAuthenticated && isLoginPage) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/'
    return NextResponse.redirect(homeUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match tất cả routes ngoại trừ:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
