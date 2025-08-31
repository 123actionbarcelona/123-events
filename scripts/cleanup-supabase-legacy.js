#!/usr/bin/env node

/**
 * SCRIPT DE LIMPIEZA POST-MIGRACIÓN SUPABASE → SQLite
 * 
 * Este script identifica y limpia registros antiguos que hacen referencia a Supabase
 * y otros problemas potenciales tras la migración.
 * 
 * Mystery Events Platform - Post-Migration Cleanup Script
 */

const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

console.log('🧹 INICIANDO LIMPIEZA POST-MIGRACIÓN SUPABASE')
console.log('Mystery Events Platform - Cleanup Tool\n')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./prisma/dev.db'
    }
  }
})

async function cleanupSupabaseReferences() {
  try {
    console.log('📊 ANÁLISIS DE BASE DE DATOS ACTUAL...')
    
    // 1. Verificar URLs de imágenes de Supabase
    const eventsWithSupabaseImages = await prisma.event.findMany({
      where: {
        imageUrl: {
          contains: 'supabase.co'
        }
      },
      select: {
        id: true,
        title: true,
        imageUrl: true
      }
    })
    
    if (eventsWithSupabaseImages.length > 0) {
      console.log(`⚠️  ENCONTRADOS ${eventsWithSupabaseImages.length} eventos con URLs de Supabase Storage:`)
      eventsWithSupabaseImages.forEach(event => {
        console.log(`   - "${event.title}": ${event.imageUrl}`)
      })
      console.log('\n🔧 SOLUCIÓN: Estas imágenes deberán ser re-subidas o usar URLs externas\n')
    } else {
      console.log('✅ No se encontraron eventos con URLs de Supabase Storage')
    }
    
    // 2. Verificar vales regalo con PDFs de Supabase
    const vouchersWithSupabasePDFs = await prisma.giftVoucher.findMany({
      where: {
        pdfUrl: {
          contains: 'supabase.co'
        }
      },
      select: {
        id: true,
        code: true,
        pdfUrl: true
      }
    })
    
    if (vouchersWithSupabasePDFs.length > 0) {
      console.log(`⚠️  ENCONTRADOS ${vouchersWithSupabasePDFs.length} vales con PDFs en Supabase Storage:`)
      vouchersWithSupabasePDFs.forEach(voucher => {
        console.log(`   - Vale "${voucher.code}": ${voucher.pdfUrl}`)
      })
      console.log('\n🔧 SOLUCIÓN: Los PDFs deberán ser regenerados localmente\n')
    } else {
      console.log('✅ No se encontraron vales con PDFs de Supabase Storage')
    }
    
    // 3. Estadísticas generales
    const totalEvents = await prisma.event.count()
    const totalVouchers = await prisma.giftVoucher.count()
    const totalBookings = await prisma.booking.count()
    const totalCustomers = await prisma.customer.count()
    
    console.log('\n📈 ESTADÍSTICAS DE LA BASE DE DATOS:')
    console.log(`   - Eventos: ${totalEvents}`)
    console.log(`   - Vales regalo: ${totalVouchers}`)
    console.log(`   - Reservas: ${totalBookings}`)
    console.log(`   - Clientes: ${totalCustomers}`)
    
    // 4. Verificar plantillas de email con problemas de serialización
    const templates = await prisma.emailTemplate.findMany({
      select: {
        id: true,
        name: true,
        variables: true
      }
    })
    
    console.log('\n📧 VERIFICACIÓN PLANTILLAS EMAIL:')
    let templatesWithIssues = 0
    
    templates.forEach(template => {
      try {
        if (typeof template.variables === 'string') {
          JSON.parse(template.variables)
          console.log(`   ✅ ${template.name}: JSON válido`)
        } else {
          console.log(`   ⚠️  ${template.name}: No es string (tipo: ${typeof template.variables})`)
          templatesWithIssues++
        }
      } catch (error) {
        console.log(`   ❌ ${template.name}: JSON inválido`)
        templatesWithIssues++
      }
    })
    
    if (templatesWithIssues === 0) {
      console.log('✅ Todas las plantillas de email están correctamente serializadas')
    }
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function cleanupConfigFiles() {
  console.log('\n🗂️  LIMPIEZA DE ARCHIVOS DE CONFIGURACIÓN...')
  
  const filesToCheck = [
    '.env.demo',
    'vercel-env.txt',
    'env.local.example'
  ]
  
  filesToCheck.forEach(fileName => {
    const filePath = path.join(process.cwd(), fileName)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      if (content.includes('supabase.co')) {
        console.log(`   ⚠️  ${fileName} contiene referencias a Supabase`)
        console.log(`       🔧 Acción requerida: Actualizar manualmente`)
      } else {
        console.log(`   ✅ ${fileName} limpio de referencias Supabase`)
      }
    }
  })
}

function generateCleanupReport() {
  console.log('\n📋 GENERANDO REPORTE DE LIMPIEZA...')
  
  const report = {
    timestamp: new Date().toISOString(),
    migrationStatus: 'completed',
    database: 'SQLite',
    storage: 'Local filesystem',
    checkedItems: [
      'Event images with Supabase URLs',
      'Voucher PDFs with Supabase URLs', 
      'Email template JSON serialization',
      'Configuration files cleanup'
    ],
    nextSteps: [
      'Update documentation files',
      'Re-upload any Supabase-hosted images',
      'Regenerate voucher PDFs if needed',
      'Configure Google Calendar credentials'
    ]
  }
  
  const reportPath = path.join(process.cwd(), 'migration-cleanup-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`   ✅ Reporte guardado: ${reportPath}`)
}

async function main() {
  await cleanupSupabaseReferences()
  cleanupConfigFiles()
  generateCleanupReport()
  
  console.log('\n🎉 LIMPIEZA COMPLETADA')
  console.log('Mystery Events Platform - Cleanup Tool')
}

main().catch(console.error)