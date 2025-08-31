// app/api/vouchers/route.ts
// API principal para vales regalo
// Creado: 24 Agosto 2025

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { 
  CreateVoucherSchema, 
  generateVoucherCode, 
  calculateExpiryDate,
  VoucherStatus 
} from '@/lib/voucher-utils'
import { updateVoucherWithStripeData } from '@/lib/voucher-validation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// ================================
// GET - Listar vales (ADMIN)
// ================================
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (search) {
      // SQLite no soporta mode: 'insensitive', usar LIKE con UPPER/LOWER
      const searchUpper = search.toUpperCase()
      where.OR = [
        { code: { contains: search } },
        { purchaserName: { contains: search } },
        { purchaserEmail: { contains: search } },
        { recipientName: { contains: search } }
      ]
    }

    // Obtener vales con paginación
    const [vouchers, total] = await Promise.all([
      db.giftVoucher.findMany({
        where,
        include: {
          event: {
            select: { id: true, title: true, date: true }
          },
          redemptions: {
            include: {
              booking: {
                select: { id: true, bookingCode: true, customerName: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.giftVoucher.count({ where })
    ])

    // Calcular estadísticas
    const stats = await db.giftVoucher.aggregate({
      where: { status: VoucherStatus.ACTIVE },
      _sum: { currentBalance: true, originalAmount: true },
      _count: true
    })

    return NextResponse.json({
      vouchers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalActive: stats._count,
        totalValueActive: stats._sum.currentBalance || 0,
        totalValueSold: stats._sum.originalAmount || 0
      }
    })

  } catch (error) {
    console.error('Error fetching vouchers:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// ================================
// POST - Crear vale regalo
// ================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos de entrada
    const validatedData = CreateVoucherSchema.parse(body)
    
    // Generar código único
    let code: string
    let isUnique = false
    let attempts = 0
    
    while (!isUnique && attempts < 10) {
      code = generateVoucherCode()
      const existing = await db.giftVoucher.findUnique({
        where: { code }
      })
      isUnique = !existing
      attempts++
    }
    
    if (!isUnique) {
      return NextResponse.json(
        { error: 'No se pudo generar código único' },
        { status: 500 }
      )
    }

    // Determinar monto según tipo
    let amount: number
    let eventData = null

    if (validatedData.type === 'event' && validatedData.eventId) {
      // Vale para evento específico
      const event = await db.event.findUnique({
        where: { id: validatedData.eventId },
        select: { price: true, title: true }
      })
      
      if (!event) {
        return NextResponse.json(
          { error: 'Evento no encontrado' },
          { status: 404 }
        )
      }
      
      const ticketQuantity = validatedData.ticketQuantity || 2
      amount = event.price * ticketQuantity
      eventData = event
    } else {
      // Vale por importe
      amount = validatedData.amount || 50
    }

    // Calcular fecha de expiración
    const expiryDate = calculateExpiryDate()

    // Crear vale en base de datos
    const voucher = await db.giftVoucher.create({
      data: {
        code: code!,
        type: validatedData.type,
        originalAmount: amount,
        currentBalance: amount,
        eventId: validatedData.eventId,
        ticketQuantity: validatedData.type === 'event' ? (validatedData.ticketQuantity || 2) : null,
        purchaserName: validatedData.purchaserName,
        purchaserEmail: validatedData.purchaserEmail,
        recipientName: validatedData.recipientName,
        recipientEmail: validatedData.recipientEmail,
        personalMessage: validatedData.personalMessage,
        deliveryDate: validatedData.deliveryDate,
        templateUsed: validatedData.template,
        expiryDate,
        status: VoucherStatus.ACTIVE
      },
      include: {
        event: {
          select: { title: true, date: true, price: true }
        }
      }
    })

    // Crear sesión de pago con Stripe
    const { stripe } = await import('@/lib/stripe')
    
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe no está configurado' },
        { status: 503 }
      )
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Vale Regalo Mystery Events`,
              description: validatedData.type === 'event' 
                ? `Vale para: ${eventData?.title} (${validatedData.ticketQuantity || 2} tickets)`
                : `Vale por ${amount}€`,
              images: []
            },
            unit_amount: Math.round(amount * 100) // Stripe usa centavos
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/gift-vouchers/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/gift-vouchers`,
      metadata: {
        type: 'voucher_purchase',
        voucherId: voucher.id,
        voucherCode: voucher.code
      },
      customer_email: validatedData.purchaserEmail
    })

    // Actualizar voucher con session ID usando función validada
    await updateVoucherWithStripeData(voucher.id, {
      sessionId: session.id,
      paymentIntentId: session.payment_intent as string || undefined,
      paymentStatus: 'pending'
    })

    return NextResponse.json({
      voucher: {
        id: voucher.id,
        code: voucher.code,
        amount: voucher.originalAmount,
        type: voucher.type,
        expiryDate: voucher.expiryDate
      },
      checkoutUrl: session.url
    })

  } catch (error: any) {
    console.error('Error creating voucher:', error)
    
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// ================================
// PUT - Actualizar vale (ADMIN)
// ================================
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación admin
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    // Validar que el vale existe
    const existingVoucher = await db.giftVoucher.findUnique({
      where: { id }
    })

    if (!existingVoucher) {
      return NextResponse.json(
        { error: 'Vale no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar vale
    const updatedVoucher = await db.giftVoucher.update({
      where: { id },
      data: updateData,
      include: {
        event: {
          select: { title: true, date: true }
        },
        redemptions: {
          include: {
            booking: {
              select: { bookingCode: true, customerName: true }
            }
          }
        }
      }
    })

    return NextResponse.json({ voucher: updatedVoucher })

  } catch (error) {
    console.error('Error updating voucher:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}