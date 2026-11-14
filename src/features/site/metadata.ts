import type { Metadata } from 'next'

const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL
const configuredUrl = process.env.SITE_URL?.trim() || (productionDomain ? `https://${productionDomain}` : 'http://localhost:3000')

export const siteUrl = new URL(new URL(configuredUrl).origin)
export const isPreviewDeployment = process.env.VERCEL_ENV === 'preview'
export const siteName = 'Common Stride'
export const homeTitle = `${siteName} | Web, Social Media & Business Support`
export const homeDescription = 'Common Stride helps businesses build and maintain websites, manage social media, research leads, and delegate day-to-day work to virtual assistants.'
export const organizationId = new URL('/#organization', siteUrl).href

const socialImage = {
  url: '/images/social-preview.jpg',
  width: 1200,
  height: 630,
  type: 'image/jpeg',
  alt: 'Common Stride logo and wordmark beside a sunlit orange and ivory staircase',
}

export function publicPageMetadata({ path, title, description }: {
  path: string
  title?: string
  description: string
}): Metadata {
  const shareTitle = title ? `${title} | ${siteName}` : homeTitle

  return {
    title: title ?? { absolute: homeTitle },
    description,
    alternates: { canonical: path },
    robots: isPreviewDeployment
      ? { index: false, follow: false }
      : { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: {
      type: 'website',
      siteName,
      url: path,
      title: shareTitle,
      description,
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
      images: [{ url: socialImage.url, alt: socialImage.alt }],
    },
  }
}
