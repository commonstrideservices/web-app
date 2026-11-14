import type { MetadataRoute } from 'next'
import { isPreviewDeployment, siteUrl } from '@/features/site/metadata'

export default function robots(): MetadataRoute.Robots {
  const rules = { userAgent: '*', allow: '/' }
  // Crawlers need access to read the noindex tag on preview pages.
  if (isPreviewDeployment) return { rules }

  return {
    rules,
    sitemap: new URL('/sitemap.xml', siteUrl).href,
  }
}
