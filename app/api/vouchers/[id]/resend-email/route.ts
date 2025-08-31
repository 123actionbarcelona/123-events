import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resendVoucherEmail } from '@/lib/voucher-email-service'
import { z } from 'zod'

const resendEmailSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  type: z.enum(['recipient', 'purchaser']).default('recipient')
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación de admin
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id: voucherId } = await params
    
    // Manejar body vacío o inválido
    let body = {}
    try {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch (parseError) {
      // Si no hay body o es inválido, usar defaults
      console.log('Using default body for resend email')
    }
    
    // Validar datos
    const validatedData = resendEmailSchema.parse(body)

    // Reenviar email
    const success = await resendVoucherEmail(
      voucherId, 
      validatedData.email
    )

    if (!success) {
      return NextResponse.json(
        { error: 'Error al reenviar email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email reenviado correctamente'
    })

  } catch (error) {
    console.error('Error en resend email:', error)
    
    if (error instanceof z.ZodError) {
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