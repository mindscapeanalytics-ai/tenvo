import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { BusinessProvider } from '@/lib/context/BusinessContext'
import { AuthProvider } from '@/lib/context/AuthContext'
import { LanguageProvider } from '@/lib/context/LanguageContext'
import { BusyModeProvider } from '@/lib/context/BusyModeContext'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { DefaultJsonLd } from '@/components/marketing/DefaultJsonLd'
import { getSiteUrl } from '@/lib/marketing/site-url'

// Note: ErrorBoundary must be a class component, so it's imported separately

const siteUrl = getSiteUrl()
const site = new URL(siteUrl)

export const metadata: Metadata = {
  metadataBase: site,
  title: {
    default: 'TENVO: Inventory, POS, storefront, and accounting in one platform',
    template: '%s | TENVO',
  },
  description:
    'TENVO is one connected platform for inventory, warehouses, POS, branded storefront, orders, and accounting. Deep Pakistan fit at launch; scaling globally. Built by Mindscape Analytics LLC (Sheridan, WY, USA).',
  keywords: [
    'TENVO',
    'business operations software',
    'inventory software',
    'POS',
    'FBR invoicing',
    'Pakistan ERP',
    'global ERP',
    'storefront',
    'Mindscape Analytics LLC',
  ],
  authors: [{ name: 'Mindscape Analytics LLC', url: 'https://www.mindscapeanalytics.com/' }],
  creator: 'TENVO',
  publisher: 'Mindscape Analytics LLC',
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: siteUrl,
    siteName: 'TENVO',
    title: 'TENVO: Operations, commerce, and finance in one platform',
    description:
      'Replace stitched apps with inventory, POS, storefront, orders, and accounting. Pakistan-first launch; global roadmap.',
    images: [{ url: '/industrial_hero_image.png', width: 1200, height: 630, alt: 'TENVO' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TENVO: Business operations in one platform',
    description:
      'Inventory, POS, storefront, accounting, and integrations. See pricing, book a demo, or talk to our team.',
    images: ['/industrial_hero_image.png'],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <DefaultJsonLd />
        <ErrorBoundary>
          <AuthProvider>
            <BusinessProvider>
              <LanguageProvider>
                <BusyModeProvider>
                  <ToastProvider />
                  <CommandPalette />
                  {children}
                </BusyModeProvider>
              </LanguageProvider>
            </BusinessProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
