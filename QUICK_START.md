# QUICK START - Guía Rápida para Claude Code

## 🚀 Iniciar Proyecto Desde Cero

### Paso 1: Setup Inicial
```bash
# Mensaje para Claude Code:
"Crear proyecto Mystery Events según PROJECT.md:
1. Next.js 14 con TypeScript y Tailwind
2. Instalar dependencias del ARCHITECTURE.md
3. Crear estructura de carpetas del PROJECT.md
4. Crear archivo .env.local con placeholders"
```

### Paso 2: Base de Datos
```bash
# Mensaje para Claude Code:
"Configurar Prisma según ARCHITECTURE.md:
1. Crear schema completo con todos los modelos
2. Configurar cliente Prisma
3. Crear script de seed con datos de ejemplo"
```

### Paso 3: Backend Base
```bash
# Mensaje para Claude Code:
"Implementar APIs según API_SPEC.md:
1. CRUD de eventos con validación Zod
2. Sistema de reservas
3. Manejo de errores
Empezar con /api/events"
```

## 🔄 Retomar Trabajo

### Si pierdes contexto:
```bash
"Revisar PROJECT.md y TASKS.md.
Continuar con la tarea actual en progreso.
Mantener stack y estructura definidos."
```

### Para tareas específicas:
```bash
"Implementar [CARACTERÍSTICA] según docs/:
- Ver arquitectura en ARCHITECTURE.md
- Ver especificación en API_SPEC.md
- Actualizar TASKS.md al terminar"
```

## 🧪 Testing Rápido

### Test de APIs:
```bash
# Crear archivo test-api.http
GET http://localhost:3000/api/events
###
POST http://localhost:3000/api/events
Content-Type: application/json

{
  "title": "Test Event",
  "description": "Test",
  ...
}
```

### Test de Flujo Completo:
1. Crear evento (admin)
2. Ver evento (público)
3. Hacer reserva
4. Simular pago
5. Verificar confirmación

## 🎯 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Base de datos
npx prisma studio     # Ver/editar datos
npx prisma db push    # Actualizar schema
npx prisma generate   # Regenerar cliente

# Stripe
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Build
npm run build
npm run start
```

## ⚠️ Problemas Comunes

### "Cannot find module"
```bash
npm install
npx prisma generate
```

### "Database connection failed"
```bash
# Verificar DATABASE_URL en .env.local
# Verificar Supabase está activo
```

### "Stripe webhook error"
```bash
# Usar Stripe CLI para testing local
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 📱 Orden de Implementación Recomendado

1. **Core** (2-3h)
   - Setup + DB + Auth

2. **Admin Básico** (3-4h)
   - CRUD eventos
   - Upload imágenes
   - Ver reservas

3. **Público Básico** (3-4h)
   - Ver eventos
   - Hacer reserva
   - Pago Stripe

4. **Integraciones** (2-3h)
   - Email confirmación
   - Google Calendar
   - Recordatorios

5. **Polish** (2-3h)
   - UI/UX refinado
   - Testing
   - Deploy

Total estimado: 12-17 horas de desarrollo activo