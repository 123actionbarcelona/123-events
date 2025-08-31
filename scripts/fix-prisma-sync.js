#!/usr/bin/env node
/**
 * Script para forzar sincronización entre Prisma y SQLite
 * Detecta y corrige desincronizaciones de datos
 */

const { PrismaClient } = require('@prisma/client')
const { execSync } = require('child_process')

async function fixPrismaSync() {
  console.log('🔍 Diagnosticando desincronización Prisma-SQLite...')
  
  let prisma = null
  
  try {
    // 1. Verificar SQLite directo
    const sqliteResult = execSync(`sqlite3 dev.db "SELECT COUNT(*) FROM events;"`, { encoding: 'utf8' }).trim()
    console.log(`📊 SQLite directo: ${sqliteResult} eventos`)
    
    // 2. Verificar Prisma
    prisma = new PrismaClient()
    const prismaResult = await prisma.event.count()
    console.log(`🔧 Prisma ORM: ${prismaResult} eventos`)
    
    // 3. Comparar
    if (parseInt(sqliteResult) !== prismaResult) {
      console.log('⚠️  DESINCRONIZACIÓN DETECTADA!')
      
      // 4. Forzar reconexión de Prisma
      console.log('🔄 Forzando reconexión de Prisma...')
      await prisma.$disconnect()
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 5. Crear nueva instancia
      prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL || 'file:./dev.db'
          }
        }
      })
      
      // 6. Re-verificar
      const newPrismaResult = await prisma.event.count()
      console.log(`🔧 Prisma (después de reconexión): ${newPrismaResult} eventos`)
      
      // 7. Mostrar eventos reales
      const events = await prisma.event.findMany({
        select: { id: true, title: true, createdAt: true }
      })
      
      console.log('📋 Eventos encontrados por Prisma:')
      events.forEach((event, i) => {
        console.log(`  ${i+1}. ${event.title} (${event.id})`)
      })
      
      if (parseInt(sqliteResult) === newPrismaResult) {
        console.log('✅ Sincronización corregida!')
      } else {
        console.log('❌ Sincronización aún incorrecta - problema más profundo')
      }
      
    } else {
      console.log('✅ Prisma y SQLite están sincronizados')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixPrismaSync()
}

module.exports = { fixPrismaSync }