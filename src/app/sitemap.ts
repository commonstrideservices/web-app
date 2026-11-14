import type { MetadataRoute } from 'next'
import { serviceCatalog } from '@/features/catalog/catalog'
import { siteUrl } from '@/features/site/metadata'

export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/connect', '/privacy-policy', '/terms-of-service', ...serviceCatalog.map(({ id }) => `/${id}`)]
    .map((path) => ({ url: new URL(path, siteUrl).href }))
}
