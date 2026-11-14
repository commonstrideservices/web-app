import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { homeDescription, homeTitle, siteName, siteUrl } from '@/features/site/metadata'
import './globals.css'

const heading = localFont({
  src: './fonts/bricolage-grotesque.woff2',
  weight: '200 800',
  variable: '--common-stride-heading',
  display: 'swap',
})
const body = localFont({
  src: './fonts/inter.woff2',
  weight: '100 900',
  variable: '--common-stride-body',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: homeTitle, template: `%s | ${siteName}` },
  description: homeDescription,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${heading.variable} ${body.variable}`}><body>{children}</body></html>
}
