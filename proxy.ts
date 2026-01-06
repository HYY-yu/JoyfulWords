import { NextResponse, type NextRequest } from 'next/server'

const REFRESH_TOKEN_KEY = 'refresh_token'

// Routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password']

export async function proxy(request: NextRequest) {
  // TODO: 临时禁用登录验证，用于开发测试
  // 正式环境需要恢复认证逻辑
  return NextResponse.next()

  // const { pathname } = request.nextUrl

  // // Get refresh token from cookies
  // const refreshToken = request.cookies.get(REFRESH_TOKEN_KEY)?.value
  // const isAuthenticated = !!refreshToken

  // // Redirect authenticated users away from auth pages
  // if (isAuthenticated && publicRoutes.some(route => pathname.startsWith(route))) {
  //   return NextResponse.redirect(new URL('/', request.url))
  // }

  // // Redirect unauthenticated users to login for protected routes
  // if (!isAuthenticated && !publicRoutes.some(route => pathname.startsWith(route))) {
  //   const url = new URL('/auth/login', request.url)
  //   url.searchParams.set('redirect', pathname)
  //   return NextResponse.redirect(url)
  // }

  // return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
