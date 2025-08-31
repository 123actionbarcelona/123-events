# 📚 LECCIONES APRENDIDAS - Sistema de Emails y PDFs

## ✅ CAMBIOS APLICADOS (31 Agosto 2025)

### 1. Instalación de Chrome para Puppeteer
**Archivo**: Sistema
**Cambio**: Ejecutado `npx puppeteer browsers install chrome`
**Estado**: ✅ COMPLETADO

### 2. Mejora de Logging en Webhook
**Archivo**: `app/api/vouchers/success/route.ts`
**Cambio**: Agregada verificación del valor de retorno
```typescript
// ANTES:
await sendVoucherWithPDF(voucher.id, voucher.purchaserEmail)
console.log(`📧 Email sent`)

// AHORA:
const emailSent = await sendVoucherWithPDF(voucher.id, voucher.purchaserEmail)
if (emailSent) {
  console.log(`📧 Email sent`)
} else {
  console.error(`❌ Failed to send email`)
}
```
**Estado**: ✅ APLICADO

### 3. Mejora de Logging en Servicio de Email
**Archivo**: `lib/voucher-email-with-pdf.ts`
**Cambio**: Agregado logging detallado en cada paso
```typescript
// Agregado:
console.log(`📨 Preparing to send email to: ${emailData.to}`)
console.log(`📤 Sending via Gmail API...`)
console.log(`📧 Email sent successfully! Message ID: ${result.data.id}`)
console.error('Error details:', error.response?.data || error.message)
```
**Estado**: ✅ APLICADO

### 4. Corrección de DATABASE_URL
**Archivo**: `.env.local`
**Cambio**: `DATABASE_URL="file:./dev.db"` (antes era `file:../dev.db`)
**Estado**: ✅ APLICADO

### 5. Actualización de Scripts de Validación
**Archivos**: 
- `scripts/validate-environment.js`
- `scripts/fix-common-issues.js`
**Cambio**: Actualizada la ruta esperada de DATABASE_URL
**Estado**: ✅ APLICADO

## 🔴 Problemas Encontrados y Soluciones

### 1. Error de Puppeteer/Chrome
**Problema**: `Could not find Chrome (ver. 139.0.7258.154)`
**Solución**: 
```bash
npx puppeteer browsers install chrome
```
**Prevención**: Agregar a los scripts de instalación del proyecto

### 2. Logging Engañoso en Webhooks
**Problema**: Los logs decían "email enviado" aunque fallara
**Causa**: No se verificaba el valor de retorno de las funciones async

**Código Problemático**:
```typescript
await sendEmail()
console.log("Email sent!") // Se imprime aunque falle
```

**Código Correcto**:
```typescript
const result = await sendEmail()
if (result) {
  console.log("Email sent!")
} else {
  console.error("Email failed!")
}
```

### 3. Manejo de Errores Silenciosos
**Problema**: Las funciones devolvían `false` en vez de lanzar excepciones
**Impacto**: Los try/catch no capturaban los fallos

**Mejor Práctica**:
```typescript
// Opción 1: Lanzar excepciones
async function sendEmail() {
  if (error) {
    throw new Error(`Email failed: ${error.message}`)
  }
}

// Opción 2: Retornar objeto con detalles
async function sendEmail() {
  return {
    success: boolean,
    error?: string,
    messageId?: string
  }
}
```

## ✅ Checklist de Debugging para Emails

1. **Verificar instalaciones**:
   - [ ] Chrome/Chromium para Puppeteer instalado
   - [ ] Variables de entorno configuradas (.env.local)
   - [ ] Credenciales de Gmail API válidas

2. **Verificar logs en cascada**:
   - [ ] ¿Se genera el PDF? (buscar "PDF generated")
   - [ ] ¿Se prepara el email? (buscar "Preparing to send")
   - [ ] ¿Gmail API responde? (buscar "Message ID")
   - [ ] ¿Se actualiza la BD? (buscar "purchaserEmailSent")

3. **Puntos de fallo comunes**:
   - Puppeteer sin Chrome → Instalar Chrome
   - Gmail API sin credenciales → Verificar .env.local
   - Token expirado → Renovar refresh token
   - Email en spam → Revisar carpeta spam

## 🛠️ Scripts de Utilidad

### Test de Email Simple
```bash
node scripts/test-email.js
```

### Test de Voucher con PDF
```bash
npx tsx scripts/test-voucher-email.ts
```

### Validar Entorno
```bash
npm run validate-env
```

## 📝 Variables de Entorno Requeridas

```env
# Gmail API (CRÍTICAS)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REFRESH_TOKEN=xxx
GMAIL_FROM_EMAIL=xxx

# Base de datos
DATABASE_URL="file:./dev.db"  # NO usar ../dev.db

# Stripe (para webhooks)
STRIPE_SECRET_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx
```

## 🚨 Señales de Alerta

1. **Log dice "email sent" pero no llega**: 
   - Verificar valor de retorno, no solo ausencia de excepciones

2. **Error "Cannot find Chrome"**:
   - Puppeteer necesita Chrome instalado localmente

3. **401 Unauthorized en endpoints admin**:
   - Normal, requieren autenticación
   - Login: admin@mysteryevents.com / admin123

4. **"mode: 'insensitive'" en queries**:
   - SQLite no lo soporta, usar LIKE o contains

## 💡 Recomendaciones

1. **Siempre verificar valores de retorno** de funciones async
2. **Agregar logging detallado** en cada paso crítico
3. **Usar scripts de test** antes de probar en producción
4. **Mantener este documento actualizado** con nuevos problemas

## 🚀 Estado Actual del Sistema

### ✅ Funcionando Correctamente:
- **Generación de PDFs**: Chrome instalado y funcionando
- **Envío de Emails**: Gmail API configurada y probada
- **Logging Mejorado**: Ahora muestra errores reales
- **Base de Datos**: Conectada correctamente a `./dev.db`
- **Validación de Entorno**: Scripts actualizados

### 📦 Archivos Modificados:
1. `app/api/vouchers/success/route.ts` - Verificación de retorno
2. `lib/voucher-email-with-pdf.ts` - Logging detallado
3. `.env.local` - DATABASE_URL corregida
4. `scripts/validate-environment.js` - Ruta actualizada
5. `scripts/fix-common-issues.js` - Ruta actualizada

### 🧪 Scripts de Test Creados:
- `scripts/test-email.js` - Prueba Gmail API
- `scripts/test-voucher-email.ts` - Prueba envío con PDF
- `scripts/resend-voucher-email.ts` - Reenvío manual
- `scripts/force-send-voucher.js` - Forzar envío

---

Última actualización: 31 Agosto 2025
Problema resuelto: Emails no se enviaban por falta de Chrome y logging engañoso
Cambios aplicados: Todos los fixes documentados arriba están implementados