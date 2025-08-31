// Datos mock para mostrar la interfaz cuando no hay conexión a BD

export const mockEvents = [
  {
    id: "1",
    title: "El Misterio de la Mansión Victorian",
    description: "Una noche oscura, una mansión abandonada y un crimen sin resolver. ¿Podrás descubrir la verdad antes de que sea demasiado tarde? Sumérgete en esta experiencia inmersiva de murder mystery.",
    category: "murder",
    imageUrl: "https://images.unsplash.com/photo-1520637836862-4d197d17c98a?w=400&h=300&fit=crop",
    date: "2025-08-25",
    time: "19:30",
    duration: 150,
    location: "Centro de Madrid - Sala Misterio",
    capacity: 12,
    availableTickets: 8,
    price: 45.00,
    status: "active"
  },
  {
    id: "2", 
    title: "Escape Room: La Prisión de Alcatraz",
    description: "Estás atrapado en la famosa prisión de Alcatraz. Tienes 60 minutos para encontrar la forma de escapar antes de que los guardias regresen. Trabajo en equipo y lógica serán clave.",
    category: "escape",
    imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
    date: "2025-08-26",
    time: "18:00",
    duration: 60,
    location: "EscapeRoom Madrid - Sala 3",
    capacity: 6,
    availableTickets: 2,
    price: 25.00,
    status: "active"
  },
  {
    id: "3",
    title: "Detective Privado: El Caso del Collar Perdido",
    description: "Un valioso collar ha desaparecido de una elegante fiesta. Como detective privado, debes interrogar sospechosos, encontrar pistas y resolver el caso.",
    category: "detective", 
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop",
    date: "2025-08-27",
    time: "20:00",
    duration: 120,
    location: "Hotel Palace - Salón Sherlock",
    capacity: 10,
    availableTickets: 6,
    price: 35.00,
    status: "active"
  },
  {
    id: "4",
    title: "La Casa del Horror: Pesadillas Nocturnas",
    description: "Una experiencia de terror que pondrá a prueba tus nervios. Adéntrate en una casa embrujada llena de sorpresas escalofriantes. No apto para cardíacos.",
    category: "horror",
    imageUrl: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&h=300&fit=crop",
    date: "2025-10-31",
    time: "21:30",
    duration: 90,
    location: "Casa del Terror - Zona Norte",
    capacity: 8,
    availableTickets: 8,
    price: 40.00,
    status: "active"
  },
  {
    id: "5",
    title: "Murder Mystery: Cena con Crimen",
    description: "Una elegante cena se convierte en escena del crimen. Mientras disfrutas de una deliciosa comida, deberás resolver un asesinato en tiempo real.",
    category: "murder",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
    date: "2025-08-30",
    time: "19:00",
    duration: 180,
    location: "Restaurante El Enigma",
    capacity: 16,
    availableTickets: 12,
    price: 65.00,
    status: "active"
  },
  {
    id: "6",
    title: "Escape Digital: Matrix Reloaded",
    description: "Te has quedado atrapado en el mundo digital. Usa tecnología de realidad virtual para resolver puzzles y encontrar la salida de la matrix.",
    category: "escape",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop",
    date: "2025-09-05",
    time: "17:30",
    duration: 90,
    location: "VR Experience Center",
    capacity: 4,
    availableTickets: 1,
    price: 35.00,
    status: "active"
  }
]

export const mockStats = {
  totalEvents: 45,
  totalBookings: 1250,
  totalRevenue: 58750,
  activeEvents: 12,
  monthlyRevenue: 4500,
  monthlyBookings: 89,
  averageTicketPrice: 42.50,
  topCategory: 'murder'
}

export const mockRecentBookings = [
  {
    id: "b1",
    bookingCode: "MST-2025-001",
    customerName: "Ana García",
    customerEmail: "ana.garcia@email.com",
    eventTitle: "El Misterio de la Mansión Victorian", 
    quantity: 2,
    totalAmount: 90.00,
    paymentStatus: "completed",
    createdAt: "2025-08-20T10:30:00Z"
  },
  {
    id: "b2", 
    bookingCode: "MST-2025-002",
    customerName: "Carlos López",
    customerEmail: "carlos.lopez@email.com",
    eventTitle: "Escape Room: La Prisión de Alcatraz",
    quantity: 4,
    totalAmount: 100.00,
    paymentStatus: "completed",
    createdAt: "2025-08-20T09:15:00Z"
  }
]

// Función para simular API response
export function getMockEvents(options: {
  category?: string
  limit?: number
  page?: number
  status?: string
} = {}) {
  let filtered = [...mockEvents]
  
  if (options.category) {
    filtered = filtered.filter(event => event.category === options.category)
  }
  
  if (options.status) {
    filtered = filtered.filter(event => event.status === options.status)
  }
  
  const total = filtered.length
  const page = options.page || 1
  const limit = options.limit || 10
  const skip = (page - 1) * limit
  
  const events = filtered.slice(skip, skip + limit).map(event => ({
    ...event,
    availableTickets: event.capacity - (Math.floor(Math.random() * event.capacity * 0.6))
  }))
  
  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

export function getMockEventById(id: string) {
  const event = mockEvents.find(e => e.id === id)
  if (!event) return null
  
  return {
    ...event,
    availableTickets: event.capacity - Math.floor(Math.random() * event.capacity * 0.6),
    bookedTickets: Math.floor(Math.random() * event.capacity * 0.6)
  }
}