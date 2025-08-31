import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Middleware personalizado si necesario
    console.log('Token:', req.nextauth.token)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Proteger rutas /admin/* excepto /admin/login
        if (req.nextUrl.pathname.startsWith('/admin') && !req.nextUrl.pathname.startsWith('/admin/login')) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*']
}