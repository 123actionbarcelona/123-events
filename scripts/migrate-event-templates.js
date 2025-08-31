const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

// Plantillas por defecto para cada categoría de evento
const defaultTemplates = [
  // CONFIRMACIÓN DE RESERVA POR CATEGORÍA
  {
    name: 'murder_confirmation',
    subject: '🔍 ¡Tu aventura de misterio está confirmada! - {{eventTitle}}',
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reserva Confirmada - {{eventTitle}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #8b0000;">
      <h1 style="color: #8b0000; font-size: 28px; margin: 0;">🕵️‍♂️ Mystery Events</h1>
      <p style="color: #666; font-size: 16px;">El crimen perfecto te espera</p>
    </div>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 25px;">
      <h2 style="color: #dc2626; margin-top: 0;">🔍 ¡Reserva Confirmada para el Crimen!</h2>
      <p style="margin: 0;">Hola <strong>{{customerName}}</strong>,</p>
      <p>¡Excelente! Has reservado tu lugar en <strong>{{eventTitle}}</strong>. Prepárate para una noche llena de misterio, intriga y asesinatos por resolver.</p>
    </div>

    <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
      <h3 style="color: #1e40af; margin-top: 0;">📋 Detalles de tu Investigación</h3>
      <div style="display: grid; gap: 8px;">
        <p><strong>🎭 Evento:</strong> {{eventTitle}}</p>
        <p><strong>📅 Fecha del Crimen:</strong> {{eventDate}}</p>
        <p><strong>🕐 Hora:</strong> {{eventTime}}</p>
        <p><strong>📍 Escena del Crimen:</strong> {{eventLocation}}</p>
        <p><strong>🎟️ Detectives:</strong> {{quantity}} persona(s)</p>
        <p><strong>💰 Total:</strong> {{totalAmount}}</p>
        <p><strong>🔢 Código de Reserva:</strong> <span style="font-family: monospace; background: #f1f5f9; padding: 2px 4px;">{{bookingCode}}</span></p>
      </div>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 25px;">
      <h3 style="color: #d97706; margin-top: 0;">🕵️‍♀️ Instrucciones para Detectives</h3>
      <ul style="padding-left: 20px; margin: 10px 0;">
        <li><strong>Llega 15 minutos antes</strong> para recibir tu briefing inicial</li>
        <li><strong>Viste elegante</strong> - estás infiltrándote en un evento exclusivo</li>
        <li><strong>Trae tu mente detectivesca</strong> - necesitarás observar cada detalle</li>
        <li><strong>Mantén el secreto</strong> - no reveles pistas a otros detectives</li>
        <li><strong>Prepárate para actuar</strong> - podrías tener un papel en el misterio</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://mysteryevents.com/booking/{{bookingCode}}" style="background-color: #8b0000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        🔍 Ver Detalles del Caso
      </a>
    </div>

    <div style="border-top: 1px solid #ddd; padding-top: 20px; font-size: 14px; color: #666;">
      <p><strong>🚨 Política de Cancelación:</strong> Cancelación gratuita hasta 24 horas antes del "crimen".</p>
      <p>¿Necesitas más pistas? Contáctanos en info@mysteryevents.com</p>
      <p style="font-style: italic; color: #8b0000;">¡Que comience la investigación! 🔍</p>
    </div>
  </div>
</body>
</html>`,
    variables: ['customerName', 'eventTitle', 'eventDate', 'eventTime', 'eventLocation', 'quantity', 'totalAmount', 'bookingCode'],
    active: true
  },

  {
    name: 'escape_confirmation',
    subject: '🔓 ¡Tu escape está asegurado! - {{eventTitle}}',
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reserva Confirmada - {{eventTitle}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #f59e0b;">
      <h1 style="color: #f59e0b; font-size: 28px; margin: 0;">🔓 Mystery Events</h1>
      <p style="color: #666; font-size: 16px;">Tu escape te espera</p>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 25px;">
      <h2 style="color: #d97706; margin-top: 0;">🔓 ¡Reserva Confirmada para tu Escape!</h2>
      <p style="margin: 0;">Hola <strong>{{customerName}}</strong>,</p>
      <p>¡Perfecto! Has reservado tu lugar en <strong>{{eventTitle}}</strong>. Prepárate para una experiencia llena de puzzles, acertijos y mucha adrenalina.</p>
    </div>

    <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
      <h3 style="color: #1e40af; margin-top: 0;">📋 Detalles de tu Misión</h3>
      <div style="display: grid; gap: 8px;">
        <p><strong>🏃‍♂️ Escape Room:</strong> {{eventTitle}}</p>
        <p><strong>📅 Fecha de Escape:</strong> {{eventDate}}</p>
        <p><strong>🕐 Hora de Inicio:</strong> {{eventTime}}</p>
        <p><strong>📍 Ubicación:</strong> {{eventLocation}}</p>
        <p><strong>👥 Equipo:</strong> {{quantity}} persona(s)</p>
        <p><strong>💰 Total:</strong> {{totalAmount}}</p>
        <p><strong>🔢 Código de Reserva:</strong> <span style="font-family: monospace; background: #f1f5f9; padding: 2px 4px;">{{bookingCode}}</span></p>
      </div>
    </div>

    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 25px;">
      <h3 style="color: #1d4ed8; margin-top: 0;">🧩 Consejos para tu Escape</h3>
      <ul style="padding-left: 20px; margin: 10px 0;">
        <li><strong>Llega puntual</strong> - cada minuto cuenta para escapar</li>
        <li><strong>Viste ropa cómoda</strong> - podrías necesitar moverte ágilmente</li>
        <li><strong>Trabaja en equipo</strong> - la comunicación es clave</li>
        <li><strong>Observa todo</strong> - las pistas están en los detalles</li>
        <li><strong>No te rindas</strong> - siempre hay una solución</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://mysteryevents.com/booking/{{bookingCode}}" style="background-color: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        🔓 Ver Detalles de la Misión
      </a>
    </div>

    <div style="border-top: 1px solid #ddd; padding-top: 20px; font-size: 14px; color: #666;">
      <p><strong>⏰ Política de Cancelación:</strong> Cancelación gratuita hasta 24 horas antes del escape.</p>
      <p>¿Necesitas ayuda? Contáctanos en info@mysteryevents.com</p>
      <p style="font-style: italic; color: #f59e0b;">¡El tiempo corre... ¿podrás escapar? 🏃‍♂️</p>
    </div>
  </div>
</body>
</html>`,
    variables: ['customerName', 'eventTitle', 'eventDate', 'eventTime', 'eventLocation', 'quantity', 'totalAmount', 'bookingCode'],
    active: true
  },

  {
    name: 'detective_confirmation',
    subject: '🕵️ ¡El caso te espera, detective! - {{eventTitle}}',
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reserva Confirmada - {{eventTitle}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1e40af;">
      <h1 style="color: #1e40af; font-size: 28px; margin: 0;">🕵️ Mystery Events</h1>
      <p style="color: #666; font-size: 16px;">El misterio está por comenzar</p>
    </div>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin-bottom: 25px;">
      <h2 style="color: #1d4ed8; margin-top: 0;">🕵️ ¡Caso Asignado, Detective!</h2>
      <p style="margin: 0;">Estimado Detective <strong>{{customerName}}</strong>,</p>
      <p>Su reserva para el caso <strong>{{eventTitle}}</strong> ha sido confirmada. Prepare su lupa y su mente analítica para una investigación fascinante.</p>
    </div>

    <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
      <h3 style="color: #1e40af; margin-top: 0;">📋 Expediente del Caso</h3>
      <div style="display: grid; gap: 8px;">
        <p><strong>📁 Caso:</strong> {{eventTitle}}</p>
        <p><strong>📅 Fecha de Investigación:</strong> {{eventDate}}</p>
        <p><strong>🕐 Hora de Inicio:</strong> {{eventTime}}</p>
        <p><strong>📍 Escena:</strong> {{eventLocation}}</p>
        <p><strong>👨‍💼 Detectives Asignados:</strong> {{quantity}} persona(s)</p>
        <p><strong>💰 Honorarios:</strong> {{totalAmount}}</p>
        <p><strong>🔢 Número de Caso:</strong> <span style="font-family: monospace; background: #f1f5f9; padding: 2px 4px;">{{bookingCode}}</span></p>
      </div>
    </div>

    <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin-bottom: 25px;">
      <h3 style="color: #047857; margin-top: 0;">📝 Protocolo de Investigación</h3>
      <ul style="padding-left: 20px; margin: 10px 0;">
        <li><strong>Llegada puntual</strong> - el briefing inicial es crucial</li>
        <li><strong>Vestimenta apropiada</strong> - debe pasar desapercibido</li>
        <li><strong>Mente abierta</strong> - todos son sospechosos hasta demostrar lo contrario</li>
        <li><strong>Trabajo metódico</strong> - anote todas las pistas</li>
        <li><strong>Discreción absoluta</strong> - la investigación es confidencial</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://mysteryevents.com/booking/{{bookingCode}}" style="background-color: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        🕵️ Revisar Expediente
      </a>
    </div>

    <div style="border-top: 1px solid #ddd; padding-top: 20px; font-size: 14px; color: #666;">
      <p><strong>📋 Política de Cancelación:</strong> Cancelación gratuita hasta 24 horas antes de la investigación.</p>
      <p>¿Necesita asistencia? Contáctenos en info@mysteryevents.com</p>
      <p style="font-style: italic; color: #1e40af;">¡El caso está en sus manos, detective! 🔍</p>
    </div>
  </div>
</body>
</html>`,
    variables: ['customerName', 'eventTitle', 'eventDate', 'eventTime', 'eventLocation', 'quantity', 'totalAmount', 'bookingCode'],
    active: true
  },

  {
    name: 'horror_confirmation',
    subject: '👻 ¡Tu pesadilla está reservada! - {{eventTitle}}',
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reserva Confirmada - {{eventTitle}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f0f0f;">
  <div style="background-color: #1a1a1a; padding: 30px; border-radius: 8px; box-shadow: 0 2px 20px rgba(255,0,0,0.2); border: 1px solid #333;">
    
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #dc2626;">
      <h1 style="color: #dc2626; font-size: 28px; margin: 0; text-shadow: 0 0 10px #dc2626;">👻 Mystery Events</h1>
      <p style="color: #999; font-size: 16px;">¿Estás preparado para el terror?</p>
    </div>
    
    <div style="background-color: #1a0a0a; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
      <h2 style="color: #dc2626; margin-top: 0;">👻 ¡Tu Pesadilla Está Reservada!</h2>
      <p style="margin: 0; color: #ccc;">Hola <strong style="color: #fff;">{{customerName}}</strong>,</p>
      <p style="color: #ccc;">¡Excelente! Has reservado tu lugar en <strong style="color: #fff;">{{eventTitle}}</strong>. Prepárate para una experiencia que pondrá a prueba tu valor y tus nervios.</p>
    </div>

    <div style="background-color: #0a0a0a; border: 2px solid #333; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
      <h3 style="color: #dc2626; margin-top: 0;">📋 Detalles de tu Pesadilla</h3>
      <div style="display: grid; gap: 8px; color: #ccc;">
        <p><strong style="color: #fff;">👻 Experiencia:</strong> {{eventTitle}}</p>
        <p><strong style="color: #fff;">📅 Fecha del Terror:</strong> {{eventDate}}</p>
        <p><strong style="color: #fff;">🕐 Hora:</strong> {{eventTime}}</p>
        <p><strong style="color: #fff;">📍 Ubicación Maldita:</strong> {{eventLocation}}</p>
        <p><strong style="color: #fff;">👥 Víctimas:</strong> {{quantity}} persona(s)</p>
        <p><strong style="color: #fff;">💰 Precio del Miedo:</strong> {{totalAmount}}</p>
        <p><strong style="color: #fff;">🔢 Código de Reserva:</strong> <span style="font-family: monospace; background: #333; padding: 2px 4px; color: #dc2626;">{{bookingCode}}</span></p>
      </div>
    </div>

    <div style="background-color: #1a0a0a; border-left: 4px solid #ef4444; padding: 20px; margin-bottom: 25px;">
      <h3 style="color: #ef4444; margin-top: 0;">⚠️ Advertencias Importantes</h3>
      <ul style="padding-left: 20px; margin: 10px 0; color: #ccc;">
        <li><strong>No recomendado para cardíacos</strong> - la experiencia es intensa</li>
        <li><strong>Viste ropa que puedas ensuciar</strong> - las cosas pueden ponerse salvajes</li>
        <li><strong>Mantén la calma</strong> - los actores están entrenados</li>
        <li><strong>Sigue las reglas</strong> - por tu seguridad y la de otros</li>
        <li><strong>Disfruta el terror</strong> - es solo una experiencia... ¿o no?</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://mysteryevents.com/booking/{{bookingCode}}" style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; text-shadow: 0 0 5px #dc2626; box-shadow: 0 0 15px rgba(220,38,38,0.5);">
        👻 Entrar al Infierno
      </a>
    </div>

    <div style="border-top: 1px solid #333; padding-top: 20px; font-size: 14px; color: #999;">
      <p><strong style="color: #dc2626;">⚰️ Política de Cancelación:</strong> No hay vuelta atrás... (cancelación gratuita hasta 24h antes).</p>
      <p>¿Necesitas exorcismo de última hora? Contáctanos en info@mysteryevents.com</p>
      <p style="font-style: italic; color: #dc2626;">¡Que comience la pesadilla! 👻</p>
    </div>
  </div>
</body>
</html>`,
    variables: ['customerName', 'eventTitle', 'eventDate', 'eventTime', 'eventLocation', 'quantity', 'totalAmount', 'bookingCode'],
    active: true
  },

  // PLANTILLAS ESPECÍFICAS PARA VALES REGALO
  {
    name: 'voucher_gift',
    subject: '🎁 {{recipientName}}, ¡tienes un Vale Regalo!',
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Has recibido un Vale Regalo!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
    
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #e11d48; font-size: 28px; margin-bottom: 10px;">🎁 ¡Tienes un Vale Regalo!</h1>
      <p style="font-size: 16px; color: #666;">Mystery Events - Experiencias Únicas</p>
    </div>

    <div style="background-color: #fef2f2; border: 2px dashed #e11d48; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
      <h2 style="color: #e11d48; margin-bottom: 10px;">Vale por {{amount}}</h2>
      <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p style="margin: 0; font-size: 14px; color: #666;">Código del Vale:</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #e11d48;">{{voucherCode}}</p>
      </div>
    </div>

    <p style="font-size: 16px; margin-bottom: 15px;">Hola <strong>{{recipientName}}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 15px;"><strong>{{purchaserName}}</strong> te ha enviado este vale regalo para que disfrutes de nuestras experiencias de misterio únicas.</p>

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

    <div style="text-align: center; margin-bottom: 30px;">
      <a href="{{downloadUrl}}" style="background-color: #e11d48; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">📄 Descargar Vale en PDF</a>
    </div>

    <div style="border-top: 1px solid #ddd; padding-top: 20px; font-size: 14px; color: #666;">
      <p><strong>Válido hasta:</strong> {{expirationDate}}</p>
      <p><strong>Términos:</strong> Este vale es transferible y se puede usar en múltiples reservas hasta agotar el saldo.</p>
      <p>¿Necesitas ayuda? Contáctanos en info@mysteryevents.com</p>
    </div>
  </div>
</body>
</html>`,
    variables: ['recipientName', 'purchaserName', 'voucherCode', 'amount', 'personalMessage', 'expirationDate', 'downloadUrl'],
    active: true
  },

  {
    name: 'voucher_purchase_confirmation',
    subject: '✅ Confirmación de Vale Regalo - {{voucherCode}}',
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de compra - Vale Regalo</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
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
      <p><strong>Valor:</strong> {{amount}}</p>
      <p><strong>Destinatario:</strong> {{recipientName}}</p>
      <p><strong>Email del destinatario:</strong> {{recipientEmail}}</p>
    </div>

    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #059669; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 14px; color: #666;">Tu mensaje personalizado:</p>
      <p style="margin: 10px 0 0 0; font-style: italic;">"{{personalMessage}}"</p>
    </div>

    <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <h3 style="color: #d97706; margin-top: 0;">¿Qué sucede ahora?</h3>
      <p>Hemos enviado el vale regalo directamente al destinatario con tu mensaje personalizado. El destinatario podrá usar el código para reservar cualquier experiencia en nuestra plataforma.</p>
    </div>

    <div style="border-top: 1px solid #ddd; padding-top: 20px; font-size: 14px; color: #666;">
      <p>El vale no tiene fecha de expiración y puede ser usado en múltiples reservas.</p>
      <p>¿Necesitas ayuda? Contáctanos en info@mysteryevents.com</p>
    </div>
  </div>
</body>
</html>`,
    variables: ['purchaserName', 'voucherCode', 'amount', 'recipientName', 'recipientEmail', 'personalMessage'],
    active: true
  },

  // PLANTILLA GENÉRICA DE FALLBACK
  {
    name: 'booking_confirmation',
    subject: '✅ ¡Reserva confirmada! - {{eventTitle}}',
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reserva Confirmada - {{eventTitle}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e11d48;">
      <h1 style="color: #e11d48; font-size: 28px; margin: 0;">🎭 Mystery Events</h1>
      <p style="color: #666; font-size: 16px;">Tu aventura te espera</p>
    </div>
    
    <div style="background-color: #ecfdf5; border-left: 4px solid #059669; padding: 20px; margin-bottom: 25px;">
      <h2 style="color: #059669; margin-top: 0;">✅ ¡Reserva Confirmada!</h2>
      <p style="margin: 0;">Hola <strong>{{customerName}}</strong>,</p>
      <p>¡Excelente! Has confirmado tu reserva para <strong>{{eventTitle}}</strong>. Prepárate para una experiencia única.</p>
    </div>

    <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
      <h3 style="color: #1e40af; margin-top: 0;">📋 Detalles de tu Reserva</h3>
      <div style="display: grid; gap: 8px;">
        <p><strong>🎭 Evento:</strong> {{eventTitle}}</p>
        <p><strong>📅 Fecha:</strong> {{eventDate}}</p>
        <p><strong>🕐 Hora:</strong> {{eventTime}}</p>
        <p><strong>📍 Ubicación:</strong> {{eventLocation}}</p>
        <p><strong>🎟️ Entradas:</strong> {{quantity}} persona(s)</p>
        <p><strong>💰 Total:</strong> {{totalAmount}}</p>
        <p><strong>🔢 Código de Reserva:</strong> <span style="font-family: monospace; background: #f1f5f9; padding: 2px 4px;">{{bookingCode}}</span></p>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://mysteryevents.com/booking/{{bookingCode}}" style="background-color: #e11d48; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        🎭 Ver mi Reserva
      </a>
    </div>

    <div style="border-top: 1px solid #ddd; padding-top: 20px; font-size: 14px; color: #666;">
      <p><strong>📋 Política de Cancelación:</strong> Cancelación gratuita hasta 24 horas antes del evento.</p>
      <p>¿Necesitas ayuda? Contáctanos en info@mysteryevents.com</p>
    </div>
  </div>
</body>
</html>`,
    variables: ['customerName', 'eventTitle', 'eventDate', 'eventTime', 'eventLocation', 'quantity', 'totalAmount', 'bookingCode'],
    active: true
  }
]

async function migrateEventTemplates() {
  try {
    console.log('🚀 Iniciando migración de plantillas de eventos...')
    
    // Crear plantillas por defecto
    console.log('📧 Creando plantillas por defecto...')
    
    for (const template of defaultTemplates) {
      try {
        // Verificar si la plantilla ya existe
        const existing = await prisma.emailTemplate.findUnique({
          where: { name: template.name }
        })
        
        if (existing) {
          console.log(`⚠️  Plantilla '${template.name}' ya existe, actualizando...`)
          await prisma.emailTemplate.update({
            where: { name: template.name },
            data: {
              subject: template.subject,
              html: template.html,
              variables: template.variables,
              active: template.active
            }
          })
        } else {
          console.log(`✅ Creando plantilla '${template.name}'...`)
          await prisma.emailTemplate.create({
            data: template
          })
        }
      } catch (error) {
        console.error(`❌ Error procesando plantilla '${template.name}':`, error.message)
      }
    }
    
    console.log('✅ Migración de plantillas completada exitosamente!')
    console.log('')
    console.log('📋 Plantillas creadas:')
    console.log('  - murder_confirmation: Para eventos de misterio/asesinato')
    console.log('  - escape_confirmation: Para escape rooms')
    console.log('  - detective_confirmation: Para eventos detectivescos')
    console.log('  - horror_confirmation: Para experiencias de terror')
    console.log('  - booking_confirmation: Plantilla genérica (fallback)')
    console.log('')
    console.log('🎯 Próximos pasos:')
    console.log('  1. Actualizar formulario de eventos para asignar plantillas')
    console.log('  2. Modificar lógica de envío de emails')
    console.log('  3. Probar con eventos reales')
    
  } catch (error) {
    console.error('❌ Error en migración:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar migración
migrateEventTemplates()