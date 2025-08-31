import { db } from '@/lib/db'

// Configuraciones por defecto para vales regalo
export const DEFAULT_VOUCHER_SETTINGS = {
  'voucher.min_tickets': {
    value: '2',
    type: 'number',
    description: 'Mínimo de tickets por vale de evento',
    category: 'vouchers'
  },
  'voucher.max_tickets': {
    value: '9',
    type: 'number', 
    description: 'Máximo de tickets por vale de evento',
    category: 'vouchers'
  },
  'voucher.allow_partial_redemption': {
    value: 'true',
    type: 'boolean',
    description: 'Permitir usar parcialmente los vales',
    category: 'vouchers'
  },
  'voucher.default_expiry_days': {
    value: '365',
    type: 'number',
    description: 'Días de validez por defecto para vales',
    category: 'vouchers'
  },
  'voucher.templates_enabled': {
    value: '["elegant", "mystery", "christmas"]',
    type: 'json',
    description: 'Plantillas de PDF disponibles',
    category: 'vouchers'
  }
}

// Configuraciones por defecto para templates de email
export const DEFAULT_EMAIL_TEMPLATE_SETTINGS = {
  // Templates globales por defecto
  'email.default_confirmation_template': {
    value: '',
    type: 'template',
    description: 'Template global por defecto para confirmaciones de reserva',
    category: 'email'
  },
  'email.default_reminder_template': {
    value: '',
    type: 'template', 
    description: 'Template global por defecto para recordatorios de evento',
    category: 'email'
  },
  'email.default_voucher_template': {
    value: '',
    type: 'template',
    description: 'Template global por defecto para vales regalo',
    category: 'email'
  },
  
  // Templates específicos por categoría - Murder Mystery
  'email.murder_confirmation_template': {
    value: '',
    type: 'template',
    description: 'Template para confirmaciones de eventos Murder Mystery',
    category: 'email'
  },
  'email.murder_reminder_template': {
    value: '',
    type: 'template',
    description: 'Template para recordatorios de eventos Murder Mystery', 
    category: 'email'
  },
  'email.murder_voucher_template': {
    value: '',
    type: 'template',
    description: 'Template para vales de eventos Murder Mystery',
    category: 'email'
  },
  
  // Templates específicos por categoría - Escape Room
  'email.escape_confirmation_template': {
    value: '',
    type: 'template',
    description: 'Template para confirmaciones de eventos Escape Room',
    category: 'email'
  },
  'email.escape_reminder_template': {
    value: '',
    type: 'template',
    description: 'Template para recordatorios de eventos Escape Room',
    category: 'email'
  },
  'email.escape_voucher_template': {
    value: '',
    type: 'template',
    description: 'Template para vales de eventos Escape Room',
    category: 'email'
  },
  
  // Templates específicos por categoría - Detective
  'email.detective_confirmation_template': {
    value: '',
    type: 'template',
    description: 'Template para confirmaciones de eventos Detective',
    category: 'email'
  },
  'email.detective_reminder_template': {
    value: '',
    type: 'template',
    description: 'Template para recordatorios de eventos Detective',
    category: 'email'
  },
  'email.detective_voucher_template': {
    value: '',
    type: 'template',
    description: 'Template para vales de eventos Detective',
    category: 'email'
  },
  
  // Templates específicos por categoría - Horror
  'email.horror_confirmation_template': {
    value: '',
    type: 'template',
    description: 'Template para confirmaciones de eventos Horror',
    category: 'email'
  },
  'email.horror_reminder_template': {
    value: '',
    type: 'template',
    description: 'Template para recordatorios de eventos Horror',
    category: 'email'
  },
  'email.horror_voucher_template': {
    value: '',
    type: 'template',
    description: 'Template para vales de eventos Horror',
    category: 'email'
  }
}

export interface AppSetting {
  key: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'json' | 'template'
  description?: string
  category: string
}

class SettingsService {
  
  // Obtener una configuración específica
  async getSetting(key: string): Promise<string | null> {
    try {
      const setting = await db.appSettings.findUnique({
        where: { key }
      })
      
      if (!setting) {
        // Si no existe, crear con valor por defecto si está definido
        const voucherDefault = DEFAULT_VOUCHER_SETTINGS[key as keyof typeof DEFAULT_VOUCHER_SETTINGS]
        const templateDefault = DEFAULT_EMAIL_TEMPLATE_SETTINGS[key as keyof typeof DEFAULT_EMAIL_TEMPLATE_SETTINGS]
        const defaultSetting = voucherDefault || templateDefault
        
        if (defaultSetting) {
          await this.setSetting(key, defaultSetting.value, defaultSetting.type as any, defaultSetting.description, defaultSetting.category)
          return defaultSetting.value
        }
        return null
      }
      
      return setting.value
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error)
      return null
    }
  }

  // Obtener configuración como número
  async getSettingAsNumber(key: string, defaultValue: number = 0): Promise<number> {
    const value = await this.getSetting(key)
    if (value === null) return defaultValue
    
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? defaultValue : parsed
  }

  // Obtener configuración como boolean
  async getSettingAsBoolean(key: string, defaultValue: boolean = false): Promise<boolean> {
    const value = await this.getSetting(key)
    if (value === null) return defaultValue
    
    return value.toLowerCase() === 'true'
  }

  // Obtener configuración como JSON
  async getSettingAsJSON(key: string, defaultValue: any = null): Promise<any> {
    const value = await this.getSetting(key)
    if (value === null) return defaultValue
    
    try {
      return JSON.parse(value)
    } catch {
      return defaultValue
    }
  }

  // Establecer una configuración
  async setSetting(
    key: string, 
    value: string, 
    type: 'string' | 'number' | 'boolean' | 'json' | 'template' = 'string',
    description?: string,
    category: string = 'general'
  ): Promise<void> {
    try {
      await db.appSettings.upsert({
        where: { key },
        update: { value, type, description, category },
        create: { key, value, type, description, category }
      })
    } catch (error) {
      console.error(`Error setting ${key}:`, error)
      throw error
    }
  }

  // Obtener todas las configuraciones de una categoría
  async getSettingsByCategory(category: string): Promise<AppSetting[]> {
    try {
      const settings = await db.appSettings.findMany({
        where: { category },
        orderBy: { key: 'asc' }
      })
      
      return settings.map(s => ({
        key: s.key,
        value: s.value,
        type: s.type as any,
        description: s.description || undefined,
        category: s.category
      }))
    } catch (error) {
      console.error(`Error getting settings for category ${category}:`, error)
      return []
    }
  }

  // Inicializar configuraciones por defecto
  async initializeDefaultSettings(): Promise<void> {
    try {
      // Inicializar configuraciones de vouchers
      for (const [key, config] of Object.entries(DEFAULT_VOUCHER_SETTINGS)) {
        const existing = await db.appSettings.findUnique({ where: { key } })
        if (!existing) {
          await this.setSetting(key, config.value, config.type as any, config.description, config.category)
        }
      }
      
      // Inicializar configuraciones de email templates
      for (const [key, config] of Object.entries(DEFAULT_EMAIL_TEMPLATE_SETTINGS)) {
        const existing = await db.appSettings.findUnique({ where: { key } })
        if (!existing) {
          await this.setSetting(key, config.value, config.type as any, config.description, config.category)
        }
      }
    } catch (error) {
      console.error('Error initializing default settings:', error)
    }
  }

  // Obtener configuraciones específicas para vales
  async getVoucherSettings() {
    return {
      minTickets: await this.getSettingAsNumber('voucher.min_tickets', 2),
      maxTickets: await this.getSettingAsNumber('voucher.max_tickets', 9),
      allowPartialRedemption: await this.getSettingAsBoolean('voucher.allow_partial_redemption', true),
      defaultExpiryDays: await this.getSettingAsNumber('voucher.default_expiry_days', 365),
      templatesEnabled: await this.getSettingAsJSON('voucher.templates_enabled', ['elegant', 'mystery', 'christmas'])
    }
  }

  // Sistema jerárquico de asignación de templates
  async getTemplateForEvent(
    eventCategory: string,
    templateType: 'confirmation' | 'reminder' | 'voucher',
    eventSpecificTemplateId?: string | null
  ): Promise<string | null> {
    // 1. PRIORIDAD MÁXIMA: Template específico del evento
    if (eventSpecificTemplateId) {
      return eventSpecificTemplateId
    }
    
    // 2. PRIORIDAD MEDIA: Template por categoría (murder, escape, detective, horror)
    const categoryKey = `email.${eventCategory.toLowerCase()}_${templateType}_template`
    const categoryTemplate = await this.getSetting(categoryKey)
    if (categoryTemplate) {
      return categoryTemplate
    }
    
    // 3. PRIORIDAD MÍNIMA: Template global por defecto
    const globalKey = `email.default_${templateType}_template`
    const globalTemplate = await this.getSetting(globalKey)
    return globalTemplate
  }

  // Obtener todos los templates disponibles organizados por categoría
  async getAvailableTemplates() {
    try {
      const templates = await db.emailTemplate.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          subject: true,
          updatedAt: true
        },
        orderBy: { name: 'asc' }
      })

      // Organizar por categoría detectada
      const categorized = {
        global: [] as any[],
        murder: [] as any[],
        escape: [] as any[],
        detective: [] as any[],
        horror: [] as any[]
      }

      templates.forEach(template => {
        const category = this.detectTemplateCategory(template.name)
        if (categorized[category as keyof typeof categorized]) {
          categorized[category as keyof typeof categorized].push({
            id: template.id,
            name: template.name,
            subject: template.subject,
            lastModified: template.updatedAt
          })
        } else {
          categorized.global.push({
            id: template.id,
            name: template.name,
            subject: template.subject,
            lastModified: template.updatedAt
          })
        }
      })

      return categorized
    } catch (error) {
      console.error('Error getting available templates:', error)
      return {
        global: [],
        murder: [],
        escape: [],
        detective: [],
        horror: []
      }
    }
  }

  // Detectar categoría del template basado en el nombre
  private detectTemplateCategory(templateName: string): string {
    const name = templateName.toLowerCase()
    if (name.includes('murder')) return 'murder'
    if (name.includes('escape')) return 'escape'  
    if (name.includes('detective')) return 'detective'
    if (name.includes('horror')) return 'horror'
    return 'global'
  }

  // Obtener configuraciones de templates por categoría de evento
  async getTemplateSettingsForCategory(category: string) {
    const categoryLower = category.toLowerCase()
    return {
      confirmationTemplate: await this.getSetting(`email.${categoryLower}_confirmation_template`),
      reminderTemplate: await this.getSetting(`email.${categoryLower}_reminder_template`),
      voucherTemplate: await this.getSetting(`email.${categoryLower}_voucher_template`)
    }
  }
}

export const settingsService = new SettingsService()

// Helpers para uso directo
export const getVoucherMinTickets = () => settingsService.getSettingAsNumber('voucher.min_tickets', 2)
export const getVoucherMaxTickets = () => settingsService.getSettingAsNumber('voucher.max_tickets', 9)
export const getVoucherSettings = () => settingsService.getVoucherSettings()