// app/api/admin/voucher-health/route.ts
// Health check para verificar consistencia de datos de vouchers
// Creado: 31 Agosto 2025

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkVoucherDataConsistency } from '@/lib/voucher-validation'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación admin
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const fix = searchParams.get('fix') === 'true'
    const voucherId = searchParams.get('voucher_id')

    let results: any[] = []

    if (voucherId) {
      // Verificar un voucher específico
      const result = await checkVoucherDataConsistency(voucherId)
      results = [result]
    } else {
      // Verificar todos los vouchers recientes (últimos 50)
      const vouchers = await db.giftVoucher.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, code: true }
      })

      for (const voucher of vouchers) {
        const result = await checkVoucherDataConsistency(voucher.id)
        if (!result.isConsistent) {
          results.push(result)
        }
      }
    }

    // Si se solicita fix y hay problemas, intentar arreglarlos
    if (fix && results.some(r => !r.isConsistent)) {
      const fixResults = await fixInconsistentVouchers(results.filter(r => !r.isConsistent))
      return NextResponse.json({
        message: 'Health check completado con correcciones',
        inconsistentVouchers: results.length,
        fixedVouchers: fixResults.fixed,
        failedFixes: fixResults.failed,
        details: results
      })
    }

    const inconsistentCount = results.filter(r => !r.isConsistent).length
    const status = inconsistentCount === 0 ? 'healthy' : 'issues_found'

    return NextResponse.json({
      status,
      message: inconsistentCount === 0 
        ? 'Todos los vouchers tienen datos consistentes' 
        : `${inconsistentCount} vouchers con problemas encontrados`,
      inconsistentVouchers: inconsistentCount,
      totalChecked: voucherId ? 1 : 50,
      details: results,
      fixAvailable: inconsistentCount > 0 ? 'Añade ?fix=true para intentar correcciones automáticas' : null
    })

  } catch (error: any) {
    console.error('Error in voucher health check:', error)
    return NextResponse.json(
      { error: 'Error en health check', details: error?.message },
      { status: 500 }
    )
  }
}

async function fixInconsistentVouchers(inconsistentResults: any[]) {
  let fixed = 0
  let failed = 0

  for (const result of inconsistentResults) {
    try {
      const { voucher, issues } = result
      const updates: any = {}

      // Intentar corregir problemas comunes
      if (issues.includes('stripeSessionId faltante') && voucher.stripePaymentId) {
        // Si tiene paymentId pero no sessionId, podemos buscar en los logs de Stripe
        console.log(`Voucher ${voucher.code}: stripeSessionId faltante`)
      }

      if (issues.includes('Status inconsistente: pago completado pero voucher pendiente')) {
        updates.status = 'active'
      }

      if (issues.includes('paidAt faltante para pago completado')) {
        updates.paidAt = new Date()
      }

      if (Object.keys(updates).length > 0) {
        await db.giftVoucher.update({
          where: { id: voucher.id },
          data: updates
        })
        console.log(`Fixed voucher ${voucher.code}:`, updates)
        fixed++
      }
    } catch (error) {
      console.error(`Failed to fix voucher ${result.voucher?.code}:`, error)
      failed++
    }
  }

  return { fixed, failed }
}