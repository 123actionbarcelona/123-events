'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { usePrefetch } from '@/lib/hooks'
import { 
  Calendar, 
  Users, 
  Settings, 
  BarChart3, 
  Mail, 
  LogOut,
  Home,
  Ticket,
  Gift
} from 'lucide-react'
import Link from 'next/link'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
  { name: 'Eventos', href: '/admin/events', icon: Calendar },
  { name: 'Reservas', href: '/admin/bookings', icon: Ticket },
  { name: 'Vales Regalo', href: '/admin/vouchers', icon: Gift },
  { name: 'Clientes', href: '/admin/customers', icon: Users },
  { name: 'Plantillas Email', href: '/admin/templates', icon: Mail },
  { name: 'Estadísticas', href: '/admin/stats', icon: BarChart3 },
  { name: 'Configuración', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  
  // OPTIMIZACIÓN FASE 2: Prefetching inteligente
  const { prefetchRoute } = usePrefetch()

  // Prefetch de las rutas más comunes al cargar
  useEffect(() => {
    const commonRoutes = ['/admin/events', '/admin/bookings', '/admin/dashboard']
    commonRoutes.forEach(route => {
      if (route !== pathname) {
        router.prefetch(route) // Prefetch de Next.js
        prefetchRoute(route)   // Prefetch de datos
      }
    })
  }, [pathname, prefetchRoute, router])

  useEffect(() => {
    if (status === 'loading') return // Aún cargando

    if (!session && !pathname.includes('/login')) {
      router.push('/admin/login')
    }
  }, [session, status, router, pathname])

  // Si está en login, mostrar solo el children
  if (pathname.includes('/login')) {
    return <>{children}</>
  }

  // Si no hay sesión y no está cargando, no mostrar nada
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/admin/login' })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 text-white min-h-screen">
          <div className="p-6">
            <h2 className="text-xl font-bold">Mystery Events</h2>
            <p className="text-gray-400 text-sm">Panel Admin</p>
          </div>

          <nav className="mt-6">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-6 py-3 text-sm hover:bg-gray-700 transition ${
                    isActive ? 'bg-gray-700 border-r-2 border-blue-500' : ''
                  }`}
                  onMouseEnter={() => {
                    // Prefetch en hover para navegación rápida
                    if (!isActive) {
                      console.log(`🔍 Prefetching on hover: ${item.name}`)
                      router.prefetch(item.href) // Next.js route prefetch
                      prefetchRoute(item.href)   // Data prefetch
                    }
                  }}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info y logout */}
          <div className="absolute bottom-0 w-64 p-6 border-t border-gray-700">
            <div className="flex items-center mb-4">
              <div className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold">
                  {session.user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{session.user.name}</p>
                <p className="text-xs text-gray-400">{session.user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}