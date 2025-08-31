import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    // Verificar conexión con la base de datos
    console.log('Testing database connection...')
    
    // Intentar crear un usuario admin si no existe
    const existingAdmin = await db.adminUser.findUnique({
      where: { email: 'admin@mysteryevents.com' }
    })

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10)
      const admin = await db.adminUser.create({
        data: {
          email: 'admin@mysteryevents.com',
          password: hashedPassword,
          name: 'Administrador',
          role: 'admin',
        },
      })
      console.log('Admin user created:', admin.email)
    } else {
      console.log('Admin user already exists:', existingAdmin.email)
    }

    // Contar registros
    const counts = {
      adminUsers: await db.adminUser.count(),
      events: await db.event.count(),
      customers: await db.customer.count(),
      bookings: await db.booking.count(),
      emailTemplates: await db.emailTemplate.count(),
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      counts,
      adminExists: !!existingAdmin,
    })
  } catch (error) {
    console.error('Database test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}