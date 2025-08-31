import { z } from 'zod'

// Esquema para crear/actualizar eventos
export const eventSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(200, 'Máximo 200 caracteres'),
  description: z.string().min(1, 'La descripción es obligatoria').max(2000, 'Máximo 2000 caracteres'),
  category: z.enum(['murder', 'escape', 'detective', 'horror'], {
    required_error: 'Selecciona una categoría',
  }),
  imageUrl: z.string()
    .refine((val) => {
      if (!val || val === '') return true // Opcional
      // Aceptar URLs completas o rutas locales
      return val.startsWith('http') ? z.string().url().safeParse(val).success : val.startsWith('/')
    }, 'URL de imagen inválida')
    .optional()
    .or(z.literal('')),
  date: z.string().refine((date) => {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime())
  }, 'Fecha inválida'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
  duration: z.number().min(30, 'Mínimo 30 minutos').max(480, 'Máximo 8 horas'),
  location: z.string().min(1, 'La ubicación es obligatoria').max(200, 'Máximo 200 caracteres'),
  capacity: z.number().min(1, 'Mínimo 1 persona').max(100, 'Máximo 100 personas'),
  price: z.number().min(0, 'El precio no puede ser negativo').max(1000, 'Máximo €1000'),
  minTickets: z.number().min(1, 'Mínimo 1 ticket').max(20, 'Máximo 20 tickets').optional().default(2),
  maxTickets: z.number().min(1, 'Mínimo 1 ticket').max(50, 'Máximo 50 tickets').optional().default(10),
  status: z.enum(['draft', 'active', 'soldout', 'cancelled']).optional().default('draft'),
  // Template fields - opcionales para personalización por evento
  confirmationTemplateId: z.string().nullable().optional(),
  reminderTemplateId: z.string().nullable().optional(),
  voucherTemplateId: z.string().nullable().optional(),
}).refine((data) => {
  if (data.minTickets && data.maxTickets) {
    return data.minTickets <= data.maxTickets
  }
  return true
}, {
  message: 'El mínimo de tickets no puede ser mayor al máximo',
  path: ['minTickets'],
})

export type EventFormData = z.infer<typeof eventSchema>

// Esquema para filtros de eventos
export const eventFiltersSchema = z.object({
  status: z.enum(['draft', 'active', 'soldout', 'cancelled']).optional(),
  category: z.enum(['murder', 'escape', 'detective', 'horror']).optional(),
  search: z.string().optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(10),
})

export type EventFilters = z.infer<typeof eventFiltersSchema>

// Esquema para actualizar estado de evento
export const eventStatusSchema = z.object({
  status: z.enum(['draft', 'active', 'soldout', 'cancelled']),
})

export type EventStatusUpdate = z.infer<typeof eventStatusSchema>