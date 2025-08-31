import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { sendBookingConfirmationEmail } from '@/lib/gmail'
import { addAttendeeToCalendarEvent, updateCalendarEventWithBookingTotals } from '@/lib/calendar'
import { sendVoucherEmail, sendVoucherPurchaseConfirmation } from '@/lib/voucher-email-service'
import { updateVoucherWithStripeData, validateWebhookData } from '@/lib/voucher-validation'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe webhook is not configured' },
      { status: 503 }
    )
  }

  const body = await request.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id)

  // Verificar si es un vale regalo o una reserva
  const { type, voucherId, bookingId } = session.metadata || {}
  
  if (type === 'voucher_purchase' && voucherId) {
    await handleVoucherPurchaseCompleted(session, voucherId)
    return
  }
  
  if (bookingId) {
    await handleBookingCompleted(session, bookingId)
    return
  }
  
  console.error('No valid metadata in session:', session.metadata)
}

async function handleVoucherPurchaseCompleted(session: Stripe.Checkout.Session, voucherId: string) {
  console.log('Processing voucher purchase:', voucherId)
  
  try {
    // Actualizar el vale usando función validada
    const voucher = await updateVoucherWithStripeData(voucherId, {
      sessionId: session.id,
      paymentIntentId: session.payment_intent as string,
      paymentStatus: 'completed',
      status: 'active'
    })
    
    // Obtener datos completos del voucher actualizado
    const fullVoucher = await db.giftVoucher.findUnique({
      where: { id: voucherId },
      include: {
        event: {
          select: { id: true, title: true, date: true }
        }
      }
    })

    console.log(`Voucher ${fullVoucher?.code} payment completed`)

    // Enviar email de confirmación de compra al comprador con PDF adjunto
    if (fullVoucher?.purchaserEmail) {
      try {
        const { sendVoucherWithPDF } = await import('@/lib/voucher-email-with-pdf')
        await sendVoucherWithPDF(fullVoucher.id, fullVoucher.purchaserEmail)
        console.log(`Purchase confirmation with PDF sent to ${fullVoucher.purchaserEmail}`)
      } catch (emailError) {
        console.error('Error sending purchase confirmation with PDF:', emailError)
      }
    }

    // Enviar vale al destinatario (si tiene email y no está programado para después)
    if (fullVoucher?.recipientEmail) {
      const shouldSendNow = !fullVoucher.scheduledDeliveryDate || 
                          new Date() >= fullVoucher.scheduledDeliveryDate
      
      if (shouldSendNow) {
        try {
          const { sendVoucherWithPDF } = await import('@/lib/voucher-email-with-pdf')
          await sendVoucherWithPDF(fullVoucher.id, fullVoucher.recipientEmail)
          console.log(`Voucher with PDF sent to recipient ${fullVoucher.recipientEmail}`)
        } catch (emailError) {
          console.error('Error sending voucher with PDF to recipient:', emailError)
        }
      } else {
        console.log(`Voucher ${fullVoucher.code} scheduled for delivery on ${fullVoucher.scheduledDeliveryDate}`)
      }
    }

  } catch (error) {
    console.error('Error processing voucher purchase:', error)
  }
}

async function handleBookingCompleted(session: Stripe.Checkout.Session, bookingId: string) {
  console.log('Processing booking:', bookingId)

  try {
    const { voucherId, voucherCode, voucherAmount } = session.metadata || {}
    
    // Actualizar el estado de la reserva
    const booking = await db.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'paid',
        stripeSessionId: session.id,
        stripeAmount: session.amount_total ? session.amount_total / 100 : 0,
      },
      include: {
        event: {
          include: {
            confirmationTemplate: true,
            reminderTemplate: true,
            voucherTemplate: true,
          }
        },
        customer: true,
        tickets: true,
      },
    })

    // Si hay un vale involucrado (pago mixto), procesarlo
    if (voucherId && voucherCode && voucherAmount) {
      const voucherAmountFloat = parseFloat(voucherAmount)
      
      // Obtener el vale
      const voucher = await db.giftVoucher.findUnique({
        where: { id: voucherId }
      })

      if (voucher) {
        // Crear redención del vale
        await db.voucherRedemption.create({
          data: {
            voucherId: voucher.id,
            bookingId: booking.id,
            amountUsed: voucherAmountFloat,
            redeemedAt: new Date(),
          },
        })

        // Actualizar balance del vale
        const newBalance = voucher.currentBalance - voucherAmountFloat
        await db.giftVoucher.update({
          where: { id: voucher.id },
          data: {
            currentBalance: newBalance,
            status: newBalance <= 0 ? 'redeemed' : 'active',
          },
        })

        // Actualizar el monto del voucher en la reserva
        await db.booking.update({
          where: { id: booking.id },
          data: {
            voucherAmount: voucherAmountFloat,
            paymentMethod: 'mixed',
          },
        })

        console.log(`Mixed payment processed: €${voucherAmountFloat} voucher + €${(session.amount_total || 0) / 100} card`)
      }
    }

    // Actualizar tickets disponibles del evento
    await db.event.update({
      where: { id: booking.eventId },
      data: {
        availableTickets: {
          decrement: booking.quantity,
        },
      },
    })
    console.log(`✅ Webhook: Tickets actualizados -${booking.quantity} para evento ${booking.event.title}`)

    // Actualizar estadísticas del cliente
    await db.customer.update({
      where: { id: booking.customer.id },
      data: {
        totalBookings: {
          increment: 1,
        },
        totalSpent: {
          increment: booking.totalAmount,
        },
      },
    })

    // Verificar si el evento está agotado
    const remainingTickets = await db.event.findUnique({
      where: { id: booking.eventId },
      select: { availableTickets: true },
    })

    if (remainingTickets && remainingTickets.availableTickets <= 0) {
      await db.event.update({
        where: { id: booking.eventId },
        data: { status: 'soldout' },
      })
    }

    console.log(`Booking ${booking.bookingCode} confirmed for ${booking.customerEmail}`)

    // Enviar email de confirmación
    try {
      const emailSent = await sendBookingConfirmationEmail(booking)
      if (emailSent) {
        await db.booking.update({
          where: { id: bookingId },
          data: { confirmationSent: true },
        })
        console.log(`Confirmation email sent for booking ${booking.bookingCode}`)
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
    }

    // Agregar al calendario si el evento está sincronizado
    try {
      if (booking.event.calendarEventId) {
        // Obtener el evento actualizado con los nuevos totales
        const updatedEvent = await db.event.findUnique({
          where: { id: booking.eventId },
        })
        
        if (updatedEvent) {
          const totalTicketsSold = updatedEvent.capacity - updatedEvent.availableTickets
          await updateCalendarEventWithBookingTotals(
            booking.event.calendarEventId,
            {
              title: booking.event.title,
              totalTicketsSold,
              availableTickets: updatedEvent.availableTickets,
              capacity: updatedEvent.capacity,
              attendeeEmail: booking.customerEmail,
              attendeeName: booking.customerName,
            }
          )
          console.log(`Calendar event updated with totals for booking ${booking.bookingCode}`)
        }
      }
    } catch (calendarError) {
      console.error('Error updating calendar:', calendarError)
    }

  } catch (error) {
    console.error('Error processing completed checkout:', error)
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  console.log('Checkout session expired:', session.id)

  const { type, voucherId, bookingId } = session.metadata || {}
  
  if (type === 'voucher_purchase' && voucherId) {
    await handleVoucherPurchaseExpired(voucherId)
    return
  }
  
  if (bookingId) {
    await handleBookingExpired(bookingId)
    return
  }
  
  console.error('No valid metadata in expired session:', session.metadata)
}

async function handleVoucherPurchaseExpired(voucherId: string) {
  console.log('Processing expired voucher purchase:', voucherId)
  
  try {
    // Marcar el vale como fallido/cancelado
    await db.giftVoucher.update({
      where: { id: voucherId },
      data: {
        status: 'cancelled',
        paymentStatus: 'failed'
      }
    })
    
    console.log(`Voucher ${voucherId} marked as cancelled due to payment expiration`)
    
  } catch (error) {
    console.error('Error processing expired voucher:', error)
  }
}

async function handleBookingExpired(bookingId: string) {

  try {
    // Encontrar la reserva
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { event: true },
    })

    if (!booking) {
      console.error('Booking not found:', bookingId)
      return
    }

    // Marcar reserva como fallida
    await db.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'failed',
      },
    })

    // Devolver tickets al inventario
    await db.event.update({
      where: { id: booking.eventId },
      data: {
        availableTickets: {
          increment: booking.quantity,
        },
      },
    })

    // Marcar tickets como cancelados
    await db.ticket.updateMany({
      where: { bookingId: bookingId },
      data: { status: 'cancelled' },
    })

    console.log(`Booking ${booking.bookingCode} expired and tickets returned to inventory`)

  } catch (error) {
    console.error('Error processing expired checkout:', error)
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id)
  // Lógica adicional si es necesaria
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id)
  // Lógica adicional si es necesaria
}