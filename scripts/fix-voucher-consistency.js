// scripts/fix-voucher-consistency.js
// Script para corregir inconsistencias en vouchers existentes
// Ejecutar: node scripts/fix-voucher-consistency.js
// Creado: 31 Agosto 2025

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function main() {
  console.log('🔍 Verificando consistencia de vouchers...')

  try {
    // Encontrar vouchers con problemas
    const problematicVouchers = await db.giftVoucher.findMany({
      where: {
        OR: [
          // Vouchers sin stripeSessionId pero con stripePaymentId
          {
            stripeSessionId: null,
            stripePaymentId: { not: null }
          },
          // Vouchers con pago completado pero sin paidAt
          {
            paymentStatus: 'completed',
            paidAt: null
          },
          // Vouchers con pago completado pero status pendiente
          {
            paymentStatus: 'completed',
            status: 'pending'
          }
        ]
      }
    })

    console.log(`📊 Encontrados ${problematicVouchers.length} vouchers con problemas`)

    if (problematicVouchers.length === 0) {
      console.log('✅ No se encontraron problemas de consistencia')
      return
    }

    console.log('\n🔧 Aplicando correcciones...')

    let fixed = 0
    let skipped = 0

    for (const voucher of problematicVouchers) {
      console.log(`\n🎫 Procesando voucher ${voucher.code} (${voucher.id})`)
      
      const updates = {}
      const issues = []

      // Verificar problemas específicos
      if (!voucher.stripeSessionId && voucher.stripePaymentId) {
        issues.push('stripeSessionId faltante')
        // No podemos recuperar el sessionId automáticamente
        console.log(`  ⚠️  stripeSessionId faltante - requiere intervención manual`)
        skipped++
        continue
      }

      if (voucher.paymentStatus === 'completed' && voucher.status !== 'active') {
        issues.push('status inconsistente')
        updates.status = 'active'
        console.log(`  ✅ Corrigiendo status: pending → active`)
      }

      if (voucher.paymentStatus === 'completed' && !voucher.paidAt) {
        issues.push('paidAt faltante')
        updates.paidAt = new Date()
        console.log(`  ✅ Añadiendo paidAt: ${updates.paidAt}`)
      }

      // Aplicar actualizaciones
      if (Object.keys(updates).length > 0) {
        try {
          await db.giftVoucher.update({
            where: { id: voucher.id },
            data: updates
          })
          console.log(`  ✅ Voucher ${voucher.code} corregido`)
          fixed++
        } catch (error) {
          console.error(`  ❌ Error corrigiendo voucher ${voucher.code}:`, error.message)
        }
      }
    }

    console.log(`\n📈 Resumen:`)
    console.log(`  ✅ Vouchers corregidos: ${fixed}`)
    console.log(`  ⏭️  Vouchers omitidos: ${skipped}`)
    console.log(`  📊 Total procesados: ${fixed + skipped}`)

    if (skipped > 0) {
      console.log(`\n⚠️  Los vouchers omitidos requieren corrección manual:`)
      console.log(`   - Falta stripeSessionId: verificar logs de Stripe`)
      console.log(`   - Usar el endpoint /api/admin/voucher-health para más detalles`)
    }

  } catch (error) {
    console.error('❌ Error en el script:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()
  .then(() => {
    console.log('\n🎉 Script completado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })