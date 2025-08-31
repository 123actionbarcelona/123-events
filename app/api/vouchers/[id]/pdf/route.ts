// app/api/vouchers/[id]/pdf/route.ts
// API para generar y servir PDFs de vales regalo
// Creado: 24 Agosto 2025

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateVoucherPDF, VoucherPDFData } from '@/lib/pdf-generator'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// ================================
// GET - Generar y servir PDF
// ================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const voucherId = (await params).id
    const { searchParams } = new URL(request.url)
    const download = searchParams.get('download') === 'true'
    const adminAccess = searchParams.get('admin') === 'true'

    // Si es acceso admin, verificar autenticación
    if (adminAccess) {
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        return NextResponse.json(
          { error: 'No autorizado' }, 
          { status: 401 }
        )
      }
    }

    // Buscar el vale
    const voucher = await db.giftVoucher.findUnique({
      where: { id: voucherId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true
          }
        }
      }
    })

    if (!voucher) {
      return NextResponse.json(
        { error: 'Vale no encontrado' },
        { status: 404 }
      )
    }

    // Para acceso no-admin, verificar que el vale esté activo o sea reciente
    if (!adminAccess) {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      
      if (voucher.status === 'cancelled' || voucher.createdAt < twoDaysAgo) {
        return NextResponse.json(
          { error: 'Vale no disponible para descarga' },
          { status: 403 }
        )
      }
    }

    // Preparar datos para el PDF
    const pdfData: VoucherPDFData = {
      id: voucher.id,
      code: voucher.code,
      type: voucher.type as 'amount' | 'event' | 'pack',
      originalAmount: voucher.originalAmount,
      currentBalance: voucher.currentBalance,
      purchaserName: voucher.purchaserName,
      recipientName: voucher.recipientName || undefined,
      personalMessage: voucher.personalMessage || undefined,
      expiryDate: voucher.expiryDate,
      templateUsed: voucher.templateUsed,
      eventTitle: voucher.event?.title,
      purchaseDate: voucher.purchaseDate
    }

    // Generar el PDF
    const pdfBuffer = await generateVoucherPDF(pdfData)

    // Incrementar contador de descargas (solo para acceso no-admin)
    if (!adminAccess) {
      await db.giftVoucher.update({
        where: { id: voucherId },
        data: {
          downloadCount: {
            increment: 1
          }
        }
      })
    }

    // Preparar headers de respuesta
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Length', pdfBuffer.length.toString())
    
    if (download) {
      // Forzar descarga
      const filename = `vale-regalo-${voucher.code}.pdf`
      headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    } else {
      // Mostrar en navegador
      headers.set('Content-Disposition', 'inline')
    }

    // Cache headers para PDFs (válido por 1 hora)
    headers.set('Cache-Control', 'private, max-age=3600')
    headers.set('ETag', `"${voucher.id}-${voucher.updatedAt.getTime()}"`)

    return new NextResponse(pdfBuffer, { headers })

  } catch (error) {
    console.error('Error generating voucher PDF:', error)
    return NextResponse.json(
      { error: 'Error generando PDF' },
      { status: 500 }
    )
  }
}

// ================================
// POST - Regenerar PDF (ADMIN)
// ================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación admin
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' }, 
        { status: 401 }
      )
    }

    const voucherId = (await params).id
    const body = await request.json()
    const { template } = body

    // Buscar el vale
    const voucher = await db.giftVoucher.findUnique({
      where: { id: voucherId },
      include: {
        event: {
          select: { title: true, date: true }
        }
      }
    })

    if (!voucher) {
      return NextResponse.json(
        { error: 'Vale no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar template si se especifica
    let updatedVoucher = voucher
    if (template && template !== voucher.templateUsed) {
      updatedVoucher = await db.giftVoucher.update({
        where: { id: voucherId },
        data: { templateUsed: template },
        include: {
          event: {
            select: { title: true, date: true }
          }
        }
      })
    }

    // Preparar datos para el PDF
    const pdfData: VoucherPDFData = {
      id: updatedVoucher.id,
      code: updatedVoucher.code,
      type: updatedVoucher.type as 'amount' | 'event' | 'pack',
      originalAmount: updatedVoucher.originalAmount,
      currentBalance: updatedVoucher.currentBalance,
      purchaserName: updatedVoucher.purchaserName,
      recipientName: updatedVoucher.recipientName || undefined,
      personalMessage: updatedVoucher.personalMessage || undefined,
      expiryDate: updatedVoucher.expiryDate,
      templateUsed: updatedVoucher.templateUsed,
      eventTitle: updatedVoucher.event?.title,
      purchaseDate: updatedVoucher.purchaseDate
    }

    // Generar nuevo PDF
    const pdfBuffer = await generateVoucherPDF(pdfData)

    return NextResponse.json({
      success: true,
      message: 'PDF regenerado exitosamente',
      voucher: {
        id: updatedVoucher.id,
        code: updatedVoucher.code,
        templateUsed: updatedVoucher.templateUsed
      },
      pdfSize: pdfBuffer.length
    })

  } catch (error) {
    console.error('Error regenerating PDF:', error)
    return NextResponse.json(
      { error: 'Error regenerando PDF' },
      { status: 500 }
    )
  }
}

// ================================
// DELETE - Eliminar caché PDF (ADMIN)
// ================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación admin
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' }, 
        { status: 401 }
      )
    }

    const voucherId = (await params).id

    // Verificar que el vale existe
    const voucher = await db.giftVoucher.findUnique({
      where: { id: voucherId },
      select: { id: true, code: true, pdfUrl: true }
    })

    if (!voucher) {
      return NextResponse.json(
        { error: 'Vale no encontrado' },
        { status: 404 }
      )
    }

    // Limpiar URL de PDF y resetear contador de descargas
    await db.giftVoucher.update({
      where: { id: voucherId },
      data: {
        pdfUrl: null,
        downloadCount: 0
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Caché de PDF eliminado',
      voucher: {
        id: voucher.id,
        code: voucher.code
      }
    })

  } catch (error) {
    console.error('Error clearing PDF cache:', error)
    return NextResponse.json(
      { error: 'Error limpiando caché' },
      { status: 500 }
    )
  }
}