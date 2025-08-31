import React from 'react'
import { render } from '@react-email/render'

interface GiftVoucherEmailProps {
  voucherCode: string
  recipientName?: string
  purchaserName: string
  personalMessage?: string
  amount: number
  expirationDate?: Date
  downloadUrl?: string
}

interface VoucherPurchaseConfirmationProps {
  purchaserName: string
  voucherCode: string
  amount: number
  recipientName?: string
  recipientEmail?: string
  personalMessage?: string
}

// Plantilla para envío del vale regalo al destinatario
export const GiftVoucherEmail: React.FC<GiftVoucherEmailProps> = ({
  voucherCode,
  recipientName,
  purchaserName,
  personalMessage,
  amount,
  expirationDate,
  downloadUrl
}) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <title>¡Has recibido un Vale Regalo!</title>
    </head>
    <body style={{
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6',
      color: '#333',
      backgroundColor: '#f4f4f4',
      margin: 0,
      padding: 0
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            color: '#e11d48',
            fontSize: '28px',
            marginBottom: '10px'
          }}>🎁 ¡Tienes un Vale Regalo!</h1>
          <p style={{ fontSize: '16px', color: '#666' }}>
            Mystery Events - Experiencias Únicas
          </p>
        </div>

        <div style={{
          backgroundColor: '#fef2f2',
          border: '2px dashed #e11d48',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h2 style={{ color: '#e11d48', marginBottom: '10px' }}>
            Vale por {amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </h2>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '15px',
            borderRadius: '5px',
            margin: '15px 0'
          }}>
            <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>Código del Vale:</p>
            <p style={{
              margin: '5px 0 0 0',
              fontSize: '24px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              color: '#e11d48'
            }}>{voucherCode}</p>
          </div>
        </div>

        {recipientName && (
          <p style={{ fontSize: '16px', marginBottom: '15px' }}>
            Hola <strong>{recipientName}</strong>,
          </p>
        )}

        <p style={{ fontSize: '16px', marginBottom: '15px' }}>
          <strong>{purchaserName}</strong> te ha enviado este vale regalo para que disfrutes de nuestras experiencias de misterio únicas.
        </p>

        {personalMessage && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderLeft: '4px solid #e11d48',
            marginBottom: '20px'
          }}>
            <p style={{ margin: '0', fontStyle: 'italic' }}>
              "{personalMessage}"
            </p>
            <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
              - {purchaserName}
            </p>
          </div>
        )}

        <div style={{
          backgroundColor: '#f0f9ff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#1e40af', marginTop: '0' }}>¿Cómo usar tu vale?</h3>
          <ol style={{ paddingLeft: '20px' }}>
            <li>Visita nuestra web y elige tu experiencia</li>
            <li>En el proceso de reserva, introduce el código: <strong>{voucherCode}</strong></li>
            <li>El importe del vale se aplicará automáticamente</li>
            <li>¡Disfruta de tu experiencia de misterio!</li>
          </ol>
        </div>

        {downloadUrl && (
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <a href={downloadUrl} style={{
              backgroundColor: '#e11d48',
              color: 'white',
              padding: '12px 25px',
              textDecoration: 'none',
              borderRadius: '5px',
              display: 'inline-block',
              fontWeight: 'bold'
            }}>
              📄 Descargar Vale en PDF
            </a>
          </div>
        )}

        <div style={{
          borderTop: '1px solid #ddd',
          paddingTop: '20px',
          fontSize: '14px',
          color: '#666'
        }}>
          {expirationDate && (
            <p><strong>Válido hasta:</strong> {expirationDate.toLocaleDateString('es-ES')}</p>
          )}
          <p><strong>Términos:</strong> Este vale es transferible y se puede usar en múltiples reservas hasta agotar el saldo.</p>
          <p>¿Necesitas ayuda? Contáctanos en info@mysteryevents.com</p>
        </div>
      </div>
    </body>
  </html>
)

// Plantilla para confirmación de compra del vale regalo
export const VoucherPurchaseConfirmationEmail: React.FC<VoucherPurchaseConfirmationProps> = ({
  purchaserName,
  voucherCode,
  amount,
  recipientName,
  recipientEmail,
  personalMessage
}) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <title>Confirmación de compra - Vale Regalo</title>
    </head>
    <body style={{
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6',
      color: '#333',
      backgroundColor: '#f4f4f4',
      margin: 0,
      padding: 0
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            color: '#059669',
            fontSize: '28px',
            marginBottom: '10px'
          }}>✅ Compra Confirmada</h1>
          <p style={{ fontSize: '16px', color: '#666' }}>
            Vale Regalo - Mystery Events
          </p>
        </div>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          Hola <strong>{purchaserName}</strong>,
        </p>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          ¡Gracias por tu compra! Hemos procesado exitosamente tu vale regalo.
        </p>

        <div style={{
          backgroundColor: '#ecfdf5',
          border: '2px solid #059669',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h2 style={{ color: '#059669', marginTop: '0' }}>Detalles de tu Vale Regalo</h2>
          <p><strong>Código:</strong> {voucherCode}</p>
          <p><strong>Valor:</strong> {amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
          {recipientName && <p><strong>Destinatario:</strong> {recipientName}</p>}
          {recipientEmail && <p><strong>Email del destinatario:</strong> {recipientEmail}</p>}
        </div>

        {personalMessage && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderLeft: '4px solid #059669',
            marginBottom: '20px'
          }}>
            <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>Tu mensaje personalizado:</p>
            <p style={{ margin: '10px 0 0 0', fontStyle: 'italic' }}>
              "{personalMessage}"
            </p>
          </div>
        )}

        <div style={{
          backgroundColor: '#fef3c7',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#d97706', marginTop: '0' }}>¿Qué sucede ahora?</h3>
          {recipientEmail ? (
            <p>
              Hemos enviado el vale regalo directamente a <strong>{recipientEmail}</strong> 
              con tu mensaje personalizado. El destinatario podrá usar el código para reservar 
              cualquier experiencia en nuestra plataforma.
            </p>
          ) : (
            <p>
              Puedes compartir el código <strong>{voucherCode}</strong> directamente con el 
              destinatario, o descargar el PDF del vale para imprimirlo o enviarlo por tu cuenta.
            </p>
          )}
        </div>

        <div style={{
          borderTop: '1px solid #ddd',
          paddingTop: '20px',
          fontSize: '14px',
          color: '#666'
        }}>
          <p>El vale no tiene fecha de expiración y puede ser usado en múltiples reservas.</p>
          <p>¿Necesitas ayuda? Contáctanos en info@mysteryevents.com</p>
        </div>
      </div>
    </body>
  </html>
)

// Plantilla para confirmación de reserva
interface BookingConfirmationProps {
  customerName: string
  eventName: string
  eventDate: string
  eventTime: string
  eventLocation: string
  bookingId: string
  totalAmount: number
  ticketCount: number
  specialInstructions?: string
}

export const BookingConfirmationEmail: React.FC<BookingConfirmationProps> = ({
  customerName,
  eventName,
  eventDate,
  eventTime,
  eventLocation,
  bookingId,
  totalAmount,
  ticketCount,
  specialInstructions
}) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <title>Reserva Confirmada - {eventName}</title>
    </head>
    <body style={{
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6',
      color: '#333',
      backgroundColor: '#f4f4f4',
      margin: 0,
      padding: 0
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            color: '#059669',
            fontSize: '28px',
            marginBottom: '10px'
          }}>✅ ¡Reserva Confirmada!</h1>
          <p style={{ fontSize: '16px', color: '#666' }}>
            Mystery Events - Tu aventura te espera
          </p>
        </div>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          Hola <strong>{customerName}</strong>,
        </p>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          ¡Excelente! Hemos confirmado tu reserva para <strong>{eventName}</strong>. 
          Prepárate para vivir una experiencia única llena de misterio y emoción.
        </p>

        <div style={{
          backgroundColor: '#ecfdf5',
          border: '2px solid #059669',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h2 style={{ color: '#059669', marginTop: '0' }}>Detalles de tu Reserva</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            <p style={{ margin: '5px 0' }}><strong>ID de Reserva:</strong> {bookingId}</p>
            <p style={{ margin: '5px 0' }}><strong>Evento:</strong> {eventName}</p>
            <p style={{ margin: '5px 0' }}><strong>Fecha:</strong> {eventDate}</p>
            <p style={{ margin: '5px 0' }}><strong>Hora:</strong> {eventTime}</p>
            <p style={{ margin: '5px 0' }}><strong>Ubicación:</strong> {eventLocation}</p>
            <p style={{ margin: '5px 0' }}><strong>Tickets:</strong> {ticketCount} persona{ticketCount > 1 ? 's' : ''}</p>
            <p style={{ margin: '5px 0' }}><strong>Total Pagado:</strong> {totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
          </div>
        </div>

        {specialInstructions && (
          <div style={{
            backgroundColor: '#fef3c7',
            padding: '15px',
            borderLeft: '4px solid #f59e0b',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#d97706', marginTop: '0' }}>Instrucciones Especiales:</h3>
            <p style={{ margin: '0' }}>{specialInstructions}</p>
          </div>
        )}

        <div style={{
          backgroundColor: '#f0f9ff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#1e40af', marginTop: '0' }}>¿Qué debes saber?</h3>
          <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
            <li>Llega 15 minutos antes del inicio</li>
            <li>Trae una identificación válida</li>
            <li>Viste ropa cómoda y adecuada para la ocasión</li>
            <li>Mantén tu mente abierta y prepárate para la diversión</li>
          </ul>
        </div>

        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <a href={`https://mysteryevents.com/booking/${bookingId}`} style={{
            backgroundColor: '#7c3aed',
            color: 'white',
            padding: '12px 25px',
            textDecoration: 'none',
            borderRadius: '5px',
            display: 'inline-block',
            fontWeight: 'bold'
          }}>
            📱 Ver Detalles de la Reserva
          </a>
        </div>

        <div style={{
          borderTop: '1px solid #ddd',
          paddingTop: '20px',
          fontSize: '14px',
          color: '#666'
        }}>
          <p><strong>Política de Cancelación:</strong> Cancelación gratuita hasta 24 horas antes del evento.</p>
          <p>¿Tienes preguntas? Contáctanos en info@mysteryevents.com o +34 900 123 456</p>
        </div>
      </div>
    </body>
  </html>
)

// Plantilla para recordatorio de evento
interface EventReminderProps {
  customerName: string
  eventName: string
  eventDate: string
  eventTime: string
  eventLocation: string
  bookingId: string
  checkinInstructions?: string
  weatherTip?: string
}

export const EventReminderEmail: React.FC<EventReminderProps> = ({
  customerName,
  eventName,
  eventDate,
  eventTime,
  eventLocation,
  bookingId,
  checkinInstructions,
  weatherTip
}) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <title>Recordatorio: {eventName} es mañana</title>
    </head>
    <body style={{
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6',
      color: '#333',
      backgroundColor: '#f4f4f4',
      margin: 0,
      padding: 0
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            color: '#f59e0b',
            fontSize: '28px',
            marginBottom: '10px'
          }}>⏰ ¡Tu aventura es mañana!</h1>
          <p style={{ fontSize: '16px', color: '#666' }}>
            Recordatorio de Evento - Mystery Events
          </p>
        </div>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          Hola <strong>{customerName}</strong>,
        </p>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          ¡Esperamos que estés emocionado! Tu experiencia de misterio 
          <strong> {eventName}</strong> es mañana. Aquí tienes todos los detalles:
        </p>

        <div style={{
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h2 style={{ color: '#d97706', marginTop: '0' }}>Detalles del Evento</h2>
          <div style={{ fontSize: '16px' }}>
            <p style={{ margin: '8px 0' }}><strong>🎭 Evento:</strong> {eventName}</p>
            <p style={{ margin: '8px 0' }}><strong>📅 Fecha:</strong> {eventDate}</p>
            <p style={{ margin: '8px 0' }}><strong>🕐 Hora:</strong> {eventTime}</p>
            <p style={{ margin: '8px 0' }}><strong>📍 Ubicación:</strong> {eventLocation}</p>
            <p style={{ margin: '8px 0' }}><strong>🎟️ Reserva:</strong> #{bookingId}</p>
          </div>
        </div>

        {checkinInstructions && (
          <div style={{
            backgroundColor: '#dbeafe',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#1e40af', marginTop: '0' }}>📋 Instrucciones de Llegada</h3>
            <p style={{ margin: '0' }}>{checkinInstructions}</p>
          </div>
        )}

        <div style={{
          backgroundColor: '#f0fdf4',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#059669', marginTop: '0' }}>✅ Lista de Verificación</h3>
          <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
            <li>Llega 15 minutos antes (muy importante)</li>
            <li>Trae una identificación válida</li>
            <li>Viste ropa cómoda</li>
            <li>Carga tu móvil (podrías necesitarlo)</li>
            <li>Ven con mente abierta y listo para divertirte</li>
          </ul>
        </div>

        {weatherTip && (
          <div style={{
            backgroundColor: '#f3f4f6',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <p style={{ margin: '0', fontSize: '14px' }}>
              <strong>🌤️ Consejo del clima:</strong> {weatherTip}
            </p>
          </div>
        )}

        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <a href={`https://mysteryevents.com/booking/${bookingId}`} style={{
            backgroundColor: '#7c3aed',
            color: 'white',
            padding: '12px 25px',
            textDecoration: 'none',
            borderRadius: '5px',
            display: 'inline-block',
            fontWeight: 'bold',
            marginRight: '10px'
          }}>
            📱 Ver mi Reserva
          </a>
          <a href="https://maps.google.com/?q=${eventLocation}" style={{
            backgroundColor: '#059669',
            color: 'white',
            padding: '12px 25px',
            textDecoration: 'none',
            borderRadius: '5px',
            display: 'inline-block',
            fontWeight: 'bold'
          }}>
            📍 Ver Ubicación
          </a>
        </div>

        <div style={{
          borderTop: '1px solid #ddd',
          paddingTop: '20px',
          fontSize: '14px',
          color: '#666'
        }}>
          <p>¿Necesitas cambiar algo de última hora? Contáctanos inmediatamente en info@mysteryevents.com</p>
          <p><strong>¡Nos vemos mañana y que comience el misterio! 🕵️‍♂️</strong></p>
        </div>
      </div>
    </body>
  </html>
)

// Funciones para renderizar las plantillas
export const renderGiftVoucherEmail = (props: GiftVoucherEmailProps) => {
  return render(<GiftVoucherEmail {...props} />)
}

export const renderVoucherPurchaseConfirmationEmail = (props: VoucherPurchaseConfirmationProps) => {
  return render(<VoucherPurchaseConfirmationEmail {...props} />)
}

export const renderBookingConfirmationEmail = (props: BookingConfirmationProps) => {
  return render(<BookingConfirmationEmail {...props} />)
}

export const renderEventReminderEmail = (props: EventReminderProps) => {
  return render(<EventReminderEmail {...props} />)
}