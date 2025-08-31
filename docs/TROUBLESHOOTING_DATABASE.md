# 🚨 Solución de Problemas de Base de Datos

## Problema: "Database not available, using mock data"

Si ves este mensaje en los logs o la aplicación muestra datos de prueba en lugar de los datos reales, significa que hay un problema de conexión con la base de datos de Supabase.

### 🔍 Síntomas
- Los eventos muestran datos genéricos/de prueba
- En los logs aparece "Database not available, using mock data"
- La aplicación funciona pero sin datos reales
- Error: "Can't reach database server" o "Authentication failed"

---

## 🛠️ Solución Paso a Paso

### PASO 1: Verificar el Estado de la Base de Datos
1. Ve a https://supabase.com/dashboard
2. Busca el proyecto `mzbysfhtnsjzjradsrmj`
3. Si ves que dice "Paused" o "Inactive", haz clic para reactivarlo

### PASO 2: Obtener Nueva URL de Conexión
1. En el dashboard, ve a **Settings → Database**
2. Busca la sección **"Connection pooling"**
3. Selecciona **"Session pooler"** (más estable)
4. Copia la URL que aparece (debe parecerse a esto):
   ```
   postgresql://postgres.mzbysfhtnsjzjradsrmj:[YOUR-PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres
   ```

### PASO 3: Generar Nuevo Password
1. En la misma página (**Settings → Database**)
2. Busca **"Reset database password"**
3. Haz clic en **"Generate new password"**
4. **IMPORTANTE**: Copia el password exactamente como aparece

### PASO 4: Actualizar Variables de Entorno

#### Para Desarrollo (archivo .env.local):
```bash
DATABASE_URL="postgresql://postgres.mzbysfhtnsjzjradsrmj:TU_NUEVO_PASSWORD@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"
```

#### Para Producción (Vercel/Netlify/etc):
- Ve a tu plataforma de hosting
- Busca "Environment Variables" o "Configuración"  
- Actualiza la variable `DATABASE_URL` con el nuevo valor

### PASO 5: Reiniciar la Aplicación
```bash
# En desarrollo
npm run dev

# En producción - hacer nuevo deploy o reiniciar
```

---

## ✅ Verificación

Para confirmar que funciona:

1. Ve a la sección de **Admin → Events** 
2. Deberías ver tus eventos reales (ej: "Cluedo en Vivo")
3. Los logs deberían mostrar queries de Prisma exitosos
4. Ya no deberías ver "using mock data"

---

## 🔧 Información Técnica

### Configuración Correcta:
- **Usuario**: `postgres.mzbysfhtnsjzjradsrmj` (con punto)
- **Host**: `aws-1-eu-west-3.pooler.supabase.com`
- **Puerto**: `5432` (Session pooler - más estable)
- **Base de datos**: `postgres`

### Tipos de Pooler:
- **Transaction pooler (puerto 6543)**: Intermitente, puede fallar
- **Session pooler (puerto 5432)**: ✅ Recomendado para aplicaciones web

---

## 🚨 Prevención

### Para evitar que vuelva a pasar:
1. **Supabase Pro** ($25/mes): La BD nunca se pausa
2. **Keep-alive**: Configurar cron job que haga ping diario
3. **Monitoring**: Configurar alertas de uptime

### Señales de advertencia:
- Aplicación lenta repentinamente
- Datos incompletos ocasionales  
- Logs con errores de conexión intermitentes

---

## 📞 Contacto de Emergencia

Si no puedes resolver el problema:

1. **Verificar status de Supabase**: https://status.supabase.com
2. **Dashboard del proyecto**: https://supabase.com/dashboard/project/mzbysfhtnsjzjradsrmj
3. **Documentación**: https://supabase.com/docs/guides/database/connecting-to-postgres

---

## 📋 Lista de Verificación Rápida

- [ ] Proyecto activo en Supabase dashboard
- [ ] Password nuevo generado y copiado
- [ ] URL de conexión actualizada (Session pooler, puerto 5432)
- [ ] Variable DATABASE_URL actualizada en .env.local/.env.production
- [ ] Aplicación reiniciada
- [ ] Verificación: eventos reales visibles en admin panel

**Tiempo estimado de resolución: 5-10 minutos**