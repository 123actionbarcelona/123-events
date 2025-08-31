// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' })

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Plantillas hardcodeadas que vamos a migrar a la BD
const emailTemplates = [
  {
    name: 'voucher_gift_received',
    subject: '🎁 ¡Has recibido un Vale Regalo!',
    html: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #e11d48; font-size: 28px; margin-bottom: 10px;">🎁 ¡Tienes un Vale Regalo!</h1>
      <p style="font-size: 16px; color: #666;">Mystery Events - Experiencias Únicas</p>
    </div>

    <div style="background-color: #fef2f2; border: 2px dashed #e11d48; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
      <h2 style="color: #e11d48; margin-bottom: 10px;">Vale por {{amount}}€</h2>
      <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p style="margin: 0; font-size: 14px; color: #666;">Código del Vale:</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #e11d48;">{{voucherCode}}</p>
      </div>
    </div>

    <p style="font-size: 16px; margin-bottom: 15px;">Hola <strong>{{recipientName}}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 15px;">
      <strong>{{purchaserName}}</strong> te ha enviado este vale regalo para que disfrutes de nuestras experiencias de misterio únicas.
    </p>

    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e11d48; margin-bottom: 20px;">
      <p style="margin: 0; font-style: italic;">"{{personalMessage}}"</p>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">- {{purchaserName}}</p>
    </div>

    <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <h3 style="color: #1e40af; margin-top: 0;">¿Cómo usar tu vale?</h3>
      <ol style="padding-left: 20px;">
        <li>Visita nuestra web y elige tu experiencia</li>
        <li>En el proceso de reserva, introduce el código: <strong>{{voucherCode}}</strong></li>
        <li>El importe del vale se aplicará automáticamente</li>
        <li>¡Disfruta de tu experiencia de misterio!</li>
      </ol>
    </div>

    <div style="border-top: 1px solid #ddd; padding-top: 20px; font-size: 14px; color: #666;">
      <p><strong>Válido hasta:</strong> {{expirationDate}}</p>
      <p><strong>Términos:</strong> Este vale es transferible y se puede usar en múltiples reservas hasta agotar el saldo.</p>
      <p>¿Necesitas ayuda? Contáctanos en info@mysteryevents.com</p>
    </div>
  </div>
</div>
    `,
    variables: JSON.stringify(['voucherCode', 'recipientName', 'purchaserName', 'personalMessage', 'amount', 'expirationDate']),
    active: true
  },
  {
    name: 'voucher_purchase_confirmation',
    subject: '✅ Vale Regalo Comprado - {{voucherCode}}',
    html: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #059669; font-size: 28px; margin-bottom: 10px;">✅ Compra Confirmada</h1>
      <p style="font-size: 16px; color: #666;">Vale Regalo - Mystery Events</p>
    </div>

    <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>{{purchaserName}}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">¡Gracias por tu compra! Hemos procesado exitosamente tu vale regalo.</p>

    <div style="background-color: #ecfdf5; border: 2px solid #059669; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <h2 style="color: #059669; margin-top: 0;">Detalles de tu Vale Regalo</h2>
      <p><strong>Código:</strong> {{voucherCode}}</p>
      <p><strong>Valor:</strong> {{amount}}€</p>
      <p><strong>Destinatario:</strong> {{recipientName}}</p>
      <p><strong>Email del destinatario:</strong> {{recipientEmail}}</p>
    </div>

    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #059669; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 14px; color: #666;">Tu mensaje personalizado:</p>
      <p style="margin: 10px 0 0 0; font-style: italic;">"{{personalMessage}}"</p>
    </div>

    <div style="border-top: 1px solid #ddd; padding-top: 20px; font-size: 14px; color: #666;">
      <p>El vale no tiene fecha de expiración y puede ser usado en múltiples reservas.</p>
      <p>¿Necesitas ayuda? Contáctanos en info@mysteryevents.com</p>
    </div>
  </div>
</div>
    `,
    variables: JSON.stringify(['purchaserName', 'voucherCode', 'amount', 'recipientName', 'recipientEmail', 'personalMessage']),
    active: true
  }
]

async function migrateTemplates() {
  console.log('🚀 Iniciando migración de plantillas de email...')
  
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect()
    console.log('✅ Conectado a la base de datos')

    let created = 0
    let updated = 0

    for (const template of emailTemplates) {
      // Verificar si la plantilla ya existe
      const existingTemplate = await prisma.emailTemplate.findFirst({
        where: { name: template.name }
      })

      if (existingTemplate) {
        // Actualizar plantilla existente
        await prisma.emailTemplate.update({
          where: { id: existingTemplate.id },
          data: {
            subject: template.subject,
            html: template.html,
            variables: template.variables,
            active: template.active,
            updatedAt: new Date()
          }
        })
        console.log(`📝 Plantilla actualizada: ${template.name}`)
        updated++
      } else {
        // Crear nueva plantilla
        await prisma.emailTemplate.create({
          data: template
        })
        console.log(`✨ Plantilla creada: ${template.name}`)
        created++
      }
    }

    console.log('\n🎉 Migración completada exitosamente!')
    console.log(`📊 Resumen:`)
    console.log(`   - Plantillas creadas: ${created}`)
    console.log(`   - Plantillas actualizadas: ${updated}`)
    console.log(`   - Total procesadas: ${emailTemplates.length}`)

  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Desconectado de la base de datos')
  }
}

// Ejecutar migración
migrateTemplates()