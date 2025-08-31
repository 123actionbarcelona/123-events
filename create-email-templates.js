// Script para crear las plantillas de email sin borrar datos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createEmailTemplates() {
  console.log('📧 Creando plantillas de email...');

  // Plantillas de email
  const emailTemplates = [
    {
      name: 'booking_confirmation',
      subject: '✅ Confirmación de reserva - {{eventTitle}}',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h1 style="color: #1a1a2e; text-align: center;">¡Reserva Confirmada! 🎉</h1>
            
            <p style="font-size: 16px; color: #333;">Hola <strong>{{customerName}}</strong>,</p>
            
            <p style="font-size: 16px; color: #333;">Tu reserva para <strong style="color: #6c63ff;">{{eventTitle}}</strong> ha sido confirmada exitosamente.</p>
            
            <div style="background-color: #f9f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6c63ff;">
              <h2 style="color: #1a1a2e; margin-top: 0;">Detalles del Evento:</h2>
              <ul style="list-style: none; padding: 0;">
                <li style="padding: 8px 0;"><strong>📅 Fecha:</strong> {{eventDate}}</li>
                <li style="padding: 8px 0;"><strong>🕐 Hora:</strong> {{eventTime}}</li>
                <li style="padding: 8px 0;"><strong>📍 Ubicación:</strong> {{eventLocation}}</li>
                <li style="padding: 8px 0;"><strong>🎫 Código de reserva:</strong> <span style="background-color: #6c63ff; color: white; padding: 5px 10px; border-radius: 4px;">{{bookingCode}}</span></li>
                <li style="padding: 8px 0;"><strong>👥 Cantidad de tickets:</strong> {{quantity}}</li>
                <li style="padding: 8px 0;"><strong>💰 Total pagado:</strong> {{totalAmount}}</li>
              </ul>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              <strong>Importante:</strong> Guarda este email como comprobante. Te enviaremos un recordatorio 24 horas antes del evento.
            </p>
            
            <p style="font-size: 16px; color: #333; margin-top: 30px;">¡Te esperamos para vivir una experiencia inolvidable!</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="text-align: center; color: #999; font-size: 12px;">
              Mystery Events Platform<br>
              Este es un email automático, por favor no respondas a este mensaje.
            </p>
          </div>
        </body>
        </html>
      `,
      variables: JSON.stringify({
        customerName: 'string',
        eventTitle: 'string',
        eventDate: 'string',
        eventTime: 'string',
        eventLocation: 'string',
        bookingCode: 'string',
        quantity: 'number',
        totalAmount: 'string',
      }),
    },
    {
      name: 'booking_reminder',
      subject: '⏰ Recordatorio - {{eventTitle}} es mañana',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h1 style="color: #1a1a2e; text-align: center;">⏰ ¡Tu evento es mañana!</h1>
            
            <p style="font-size: 16px; color: #333;">Hola <strong>{{customerName}}</strong>,</p>
            
            <p style="font-size: 16px; color: #333;">Te recordamos que mañana tienes el evento <strong style="color: #6c63ff;">{{eventTitle}}</strong>.</p>
            
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h2 style="color: #1a1a2e; margin-top: 0;">No olvides:</h2>
              <ul style="list-style: none; padding: 0;">
                <li style="padding: 8px 0;"><strong>📅 Fecha:</strong> {{eventDate}}</li>
                <li style="padding: 8px 0;"><strong>🕐 Hora:</strong> {{eventTime}}</li>
                <li style="padding: 8px 0;"><strong>📍 Ubicación:</strong> {{eventLocation}}</li>
                <li style="padding: 8px 0;"><strong>🎫 Tu código:</strong> {{bookingCode}}</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; color: #333;">¡Nos vemos pronto! 🎭</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="text-align: center; color: #999; font-size: 12px;">
              Mystery Events Platform<br>
              Este es un recordatorio automático.
            </p>
          </div>
        </body>
        </html>
      `,
      variables: JSON.stringify({
        customerName: 'string',
        eventTitle: 'string',
        eventDate: 'string',
        eventTime: 'string',
        eventLocation: 'string',
        bookingCode: 'string',
      }),
    },
    {
      name: 'voucher_purchase',
      subject: '🎁 Tu vale regalo ha sido generado - {{amount}}',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h1 style="color: #1a1a2e; text-align: center;">🎁 ¡Vale Regalo Generado!</h1>
            
            <p style="font-size: 16px; color: #333;">Hola <strong>{{purchaserName}}</strong>,</p>
            
            <p style="font-size: 16px; color: #333;">Tu vale regalo ha sido generado exitosamente.</p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h2 style="color: #1a1a2e; margin-top: 0;">Detalles del Vale:</h2>
              <ul style="list-style: none; padding: 0;">
                <li style="padding: 8px 0;"><strong>🎫 Código:</strong> <span style="background-color: #3b82f6; color: white; padding: 5px 10px; border-radius: 4px;">{{voucherCode}}</span></li>
                <li style="padding: 8px 0;"><strong>💰 Valor:</strong> {{amount}}</li>
                <li style="padding: 8px 0;"><strong>📅 Válido hasta:</strong> {{expiryDate}}</li>
              </ul>
            </div>
            
            <p style="font-size: 14px; color: #666;">El PDF del vale está adjunto a este email.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="text-align: center; color: #999; font-size: 12px;">
              Mystery Events Platform
            </p>
          </div>
        </body>
        </html>
      `,
      variables: JSON.stringify({
        purchaserName: 'string',
        voucherCode: 'string',
        amount: 'string',
        expiryDate: 'string',
      }),
    },
  ];

  // Crear plantillas
  for (const template of emailTemplates) {
    try {
      const existing = await prisma.emailTemplate.findUnique({
        where: { name: template.name }
      });
      
      if (existing) {
        console.log(`ℹ️  Plantilla '${template.name}' ya existe, actualizando...`);
        await prisma.emailTemplate.update({
          where: { name: template.name },
          data: template
        });
      } else {
        await prisma.emailTemplate.create({ data: template });
        console.log(`✅ Plantilla '${template.name}' creada`);
      }
    } catch (error) {
      console.error(`❌ Error con plantilla '${template.name}':`, error.message);
    }
  }

  console.log('✅ Proceso completado');
}

createEmailTemplates()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });