import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Limpiar datos existentes
  await prisma.ticket.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.event.deleteMany()
  await prisma.emailTemplate.deleteMany()
  await prisma.adminUser.deleteMany()

  // Crear usuario admin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.adminUser.create({
    data: {
      email: 'admin@mysteryevents.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'admin',
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Crear plantillas de email
  const emailTemplates = [
    {
      name: 'booking_confirmation',
      subject: '✅ Confirmación de reserva - {{eventTitle}}',
      html: `
        <h1>¡Reserva confirmada!</h1>
        <p>Hola {{customerName}},</p>
        <p>Tu reserva para <strong>{{eventTitle}}</strong> ha sido confirmada.</p>
        <ul>
          <li><strong>Fecha:</strong> {{eventDate}}</li>
          <li><strong>Hora:</strong> {{eventTime}}</li>
          <li><strong>Ubicación:</strong> {{eventLocation}}</li>
          <li><strong>Código de reserva:</strong> {{bookingCode}}</li>
          <li><strong>Tickets:</strong> {{quantity}}</li>
        </ul>
        <p>¡Te esperamos!</p>
      `,
      variables: JSON.stringify({
        customerName: 'string',
        eventTitle: 'string',
        eventDate: 'string',
        eventTime: 'string',
        eventLocation: 'string',
        bookingCode: 'string',
        quantity: 'number',
      }),
    },
    {
      name: 'booking_reminder',
      subject: '⏰ Recordatorio - {{eventTitle}} es mañana',
      html: `
        <h1>¡No olvides tu evento!</h1>
        <p>Hola {{customerName}},</p>
        <p>Te recordamos que mañana tienes el evento <strong>{{eventTitle}}</strong>.</p>
        <p><strong>Detalles:</strong></p>
        <ul>
          <li><strong>Fecha:</strong> {{eventDate}}</li>
          <li><strong>Hora:</strong> {{eventTime}}</li>
          <li><strong>Ubicación:</strong> {{eventLocation}}</li>
        </ul>
        <p>¡Nos vemos pronto!</p>
      `,
      variables: JSON.stringify({
        customerName: 'string',
        eventTitle: 'string',
        eventDate: 'string',
        eventTime: 'string',
        eventLocation: 'string',
      }),
    },
  ]

  for (const template of emailTemplates) {
    await prisma.emailTemplate.create({ data: template })
  }
  console.log('✅ Email templates created')

  // Crear eventos de prueba
  const events = [
    {
      title: 'Asesinato en el Orient Express',
      description: 'Un misterioso asesinato en el famoso tren. ¿Podrás resolver el caso antes de llegar a destino?',
      category: 'murder',
      imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
      date: new Date('2025-09-15T19:30:00'),
      time: '19:30',
      duration: 180,
      location: 'Teatro Principal, Madrid',
      capacity: 30,
      availableTickets: 30,
      price: 45.0,
      status: 'active',
    },
    {
      title: 'Escape Room: La Mansión Embrujada',
      description: 'Tienes 60 minutos para escapar de una mansión llena de secretos y misterios.',
      category: 'escape',
      imageUrl: 'https://images.unsplash.com/photo-1520637836862-4d197d17c89a?w=800',
      date: new Date('2025-09-20T20:00:00'),
      time: '20:00',
      duration: 60,
      location: 'Escape Center, Barcelona',
      capacity: 8,
      availableTickets: 8,
      price: 25.0,
      status: 'active',
    },
    {
      title: 'Detective Privado: Caso Perdido',
      description: 'Conviértete en detective y resuelve un caso que la policía no pudo resolver.',
      category: 'detective',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      date: new Date('2025-09-25T18:00:00'),
      time: '18:00',
      duration: 120,
      location: 'Club Detective, Valencia',
      capacity: 20,
      availableTickets: 20,
      price: 35.0,
      status: 'active',
    },
    {
      title: 'Terror Nocturno: La Casa del Horror',
      description: 'Una experiencia de terror inmersiva que te mantendrá despierto toda la noche.',
      category: 'horror',
      imageUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=800',
      date: new Date('2025-10-31T21:00:00'),
      time: '21:00',
      duration: 90,
      location: 'Casa del Terror, Sevilla',
      capacity: 15,
      availableTickets: 15,
      price: 55.0,
      status: 'active',
    },
  ]

  for (const event of events) {
    await prisma.event.create({ data: event })
  }
  console.log('✅ Sample events created')

  // Crear algunos clientes de prueba
  const customers = [
    {
      email: 'ana.garcia@email.com',
      name: 'Ana García',
      phone: '+34600123456',
    },
    {
      email: 'carlos.lopez@email.com',
      name: 'Carlos López',
      phone: '+34600654321',
    },
  ]

  for (const customer of customers) {
    await prisma.customer.create({ data: customer })
  }
  console.log('✅ Sample customers created')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })