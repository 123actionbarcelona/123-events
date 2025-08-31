'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Calendar, Phone, Mail, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Eventos', href: '/events' },
  { name: 'Vales Regalo', href: '/gift-vouchers', icon: Gift },
]

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Mystery Events</span>
                <p className="text-xs text-gray-500 leading-none">Vive el misterio</p>
              </div>
            </Link>
          </div>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-700 hover:text-purple-600'
                }`}
              >
                {item.icon && <item.icon className="h-4 w-4 mr-1" />}
                {item.name}
              </Link>
            ))}
          </div>

          {/* Contact Info Desktop */}
          <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Phone className="h-4 w-4" />
              <span>+34 900 123 456</span>
            </div>
            <div className="flex items-center space-x-1">
              <Mail className="h-4 w-4" />
              <span>info@mysteryevents.com</span>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-base font-medium transition-colors ${
                    pathname === item.href
                      ? 'text-purple-600 bg-purple-50'
                      : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon && <item.icon className="h-4 w-4 mr-2" />}
                  {item.name}
                </Link>
              ))}
              <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>+34 900 123 456</span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>info@mysteryevents.com</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}