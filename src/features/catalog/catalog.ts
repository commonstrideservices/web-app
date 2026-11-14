import { z } from 'zod'
import source from './config/services.json'

const catalogSchema = z.object({
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    seo: z.object({ title: z.string().min(1), description: z.string().min(1) }).optional(),
    hero: z.object({ image: z.string(), alt: z.string(), introduction: z.string() }),
    offerings: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      examples: z.array(z.string()),
    })),
  })),
})

export const serviceCatalog = catalogSchema.parse(source).categories
