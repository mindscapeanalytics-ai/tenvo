import type { Metadata, Viewport } from 'next'
import './globals.css'
import { openSans } from '@/lib/fonts'
import { cn } from '@/lib/utils'
import { ToastProvider } from '@/components/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { BusinessProvider } from '@/lib/context/BusinessContext'
import { AuthProvider } from '@/lib/context/AuthContext'
import { LanguageProvider } from '@/lib/context/LanguageContext'
import { BusyModeProvider } from '@/lib/context/BusyModeContext'
import { DefaultJsonLd } from '@/components/marketing/DefaultJsonLd'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { getSiteUrl } from '@/lib/marketing/site-url'
import { SITE_NAME } from '@/lib/marketing/seo'

const site = new URL(getSiteUrl())

export const viewport: Viewport = {
  themeColor: '#0f766e',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: site,
  applicationName: SITE_NAME,
  title: {
    default: 'TENVO: Inventory, POS, storefront, and accounting in one platform',
    template: '%s | TENVO',
  },
  description: 'Complete business operations platform for inventory management, point of sale, online storefront, and accounting. Start free at tenvo.store - trusted by growing businesses.',
  keywords: [
    'business management software',
    'inventory management system',
    'POS software',
    'point of sale system',
    'online storefront builder',
    'e-commerce platform',
    'accounting software',
    'ERP system',
    'business operations software',
    'retail management',
    'tenvo',
    'tanvo.store',
  ],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/tenvo.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: ['/icons/icon-32.png'],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  other: {
    'msapplication-TileColor': '#0f766e',
    'msapplication-TileImage': '/icons/icon-192.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={openSans.variable} suppressHydrationWarning>
      <body
        className={cn(openSans.className, 'min-h-dvh overflow-x-clip font-sans antialiased')}
        suppressHydrationWarning
      >
        <DefaultJsonLd />
        <GoogleAnalytics />
        <ErrorBoundary>
          <AuthProvider>
            <BusinessProvider>
              <LanguageProvider>
                <BusyModeProvider>
                  <ToastProvider />
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
