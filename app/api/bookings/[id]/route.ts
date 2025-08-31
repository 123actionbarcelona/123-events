import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Obtener la reserva con todos los detalles necesarios
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            time: true,
            duration: true,
            location: true,
            price: true,
            imageUrl: true,
            category: true,
          },
        },
        tickets: {
          select: {
            id: true,
            ticketCode: true,
            status: true,
          },
        },
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Formatear la respuesta para el cliente
    const formattedBooking = {
      id: booking.id,
      bookingCode: booking.bookingCode,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      quantity: booking.quantity,
      totalAmount: booking.totalAmount,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      voucherAmount: booking.voucherAmount,
      stripeAmount: booking.stripeAmount,
      confirmationSent: booking.confirmationSent,
      event: booking.event,
      tickets: booking.tickets,
      createdAt: booking.createdAt,
    }

    return NextResponse.json(formattedBooking)

  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}