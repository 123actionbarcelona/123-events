#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client')
const { execSync } = require('child_process')

const prisma = new PrismaClient()

async function restoreData() {
  console.log('🔄 Restaurando datos desde backup...')
  
  try {
    // Obtener eventos del backup phantom
    const eventsSQL = execSync(`sqlite3 "./prisma/dev.db.phantom_backup" "SELECT id, title, description, category, imageUrl, date, time, duration, location, capacity, availableTickets, price, status, createdAt, updatedAt FROM events;"`, { encoding: 'utf8' })
    
    if (eventsSQL.trim()) {
      const events = eventsSQL.trim().split('\n').map(row => {
        const [id, title, description, category, imageUrl, date, time, duration, location, capacity, availableTickets, price, status, createdAt, updatedAt] = row.split('|')
        return {
          id,
          title,
          description,
          category,
          imageUrl: imageUrl === 'NULL' ? null : imageUrl,
          date: new Date(parseInt(date)),
          time,
          duration: parseInt(duration),
          location,
          capacity: parseInt(capacity),
          availableTickets: parseInt(availableTickets),
          price: parseFloat(price),
          status,
          createdAt: new Date(parseInt(createdAt)),
          updatedAt: new Date(parseInt(updatedAt))
        }
      })
      
      console.log(`📋 Encontrados ${events.length} eventos para restaurar`)
      
      for (const event of events) {
        try {
          await prisma.event.create({ data: event })
          console.log(`✅ Restaurado: ${event.title}`)
        } catch (error) {
          console.log(`⚠️ Error restaurando ${event.title}:`, error.message)
        }
      }
    }
    
    // Restaurar customers si existen
    const customersSQL = execSync(`sqlite3 "./prisma/dev.db.phantom_backup" "SELECT id, email, name, phone, totalBookings, totalSpent, createdAt, updatedAt FROM customers;" 2>/dev/null || echo ""`, { encoding: 'utf8' })
    
    if (customersSQL.trim()) {
      const customers = customersSQL.trim().split('\n').map(row => {
        const [id, email, name, phone, totalBookings, totalSpent, createdAt, updatedAt] = row.split('|')
        return {
          id,
          email,
          name: name === 'NULL' ? null : name,
          phone: phone === 'NULL' ? null : phone,
          totalBookings: parseInt(totalBookings),
          totalSpent: parseFloat(totalSpent),
          createdAt: new Date(parseInt(createdAt)),
          updatedAt: new Date(parseInt(updatedAt))
        }
      })
      
      console.log(`👥 Encontrados ${customers.length} customers para restaurar`)
      
      for (const customer of customers) {
        try {
          await prisma.customer.create({ data: customer })
          console.log(`✅ Restaurado customer: ${customer.email}`)
        } catch (error) {
          console.log(`⚠️ Error restaurando customer ${customer.email}:`, error.message)
        }
      }
    }
    
    // Verificar resultado
    const totalEvents = await prisma.event.count()
    const totalCustomers = await prisma.customer.count()
    
    console.log('\n📊 Resumen de restauración:')
    console.log(`  - Eventos: ${totalEvents}`)
    console.log(`  - Customers: ${totalCustomers}`)
    
  } catch (error) {
    console.error('❌ Error restaurando datos:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

restoreData()