import Link from 'next/link'
import { Calendar, MapPin, Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react'

export function PublicFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">Mystery Events</span>
                <p className="text-sm text-gray-400 leading-none">Vive el misterio</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Creamos experiencias únicas de misterio, escape rooms y eventos de detective 
              que te mantendrán al borde de tu asiento.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/events" className="text-gray-300 hover:text-white transition-colors">
                  Todos los Eventos
                </Link>
              </li>
              <li>
                <Link href="/events?category=murder" className="text-gray-300 hover:text-white transition-colors">
                  Murder Mystery
                </Link>
              </li>
              <li>
                <Link href="/events?category=escape" className="text-gray-300 hover:text-white transition-colors">
                  Escape Rooms
                </Link>
              </li>
              <li>
                <Link href="/events?category=detective" className="text-gray-300 hover:text-white transition-colors">
                  Detective
                </Link>
              </li>
              <li>
                <Link href="/events?category=horror" className="text-gray-300 hover:text-white transition-colors">
                  Terror
                </Link>
              </li>
            </ul>
          </div>

          {/* Gift Vouchers */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Vales Regalo</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/gift-vouchers" className="text-gray-300 hover:text-white transition-colors">
                  Comprar Vale
                </Link>
              </li>
              <li>
                <p className="text-gray-300 text-sm">
                  Regala experiencias únicas de misterio y aventura
                </p>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 text-sm">
                    Calle del Misterio, 123
                    <br />
                    28001 Madrid, España
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-purple-400 flex-shrink-0" />
                <a 
                  href="tel:+34900123456" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  +34 900 123 456
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-purple-400 flex-shrink-0" />
                <a 
                  href="mailto:info@mysteryevents.com" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  info@mysteryevents.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} Mystery Events Platform. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="mailto:info@mysteryevents.com" className="text-gray-400 hover:text-white text-sm transition-colors">
                Soporte
              </a>
              <a href="tel:+34900123456" className="text-gray-400 hover:text-white text-sm transition-colors">
                +34 900 123 456
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}