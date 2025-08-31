import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
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

    const resolvedParams = await params
    const bookingId = resolvedParams.id

    if (!bookingId) {
      return NextResponse.json(
        { error: 'ID de reserva requerido' },
        { status: 400 }
      )
    }

    // Buscar la reserva con todas sus relaciones
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            time: true,
            location: true,
            price: true,
          }
        },
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        },
        tickets: {
          select: {
            id: true,
            ticketCode: true,
            status: true,
            usedAt: true,
          }
        },
        formResponses: {
          include: {
            field: {
              select: {
                label: true,
                fieldName: true,
                fieldType: true,
              }
            }
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      booking
    })

  } catch (error) {
    console.error('Error fetching booking detail:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}