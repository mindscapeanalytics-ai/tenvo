import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { BusinessProvider } from '@/lib/context/BusinessContext'
import { AuthProvider } from '@/lib/context/AuthContext'
import { LanguageProvider } from '@/lib/context/LanguageContext'
import { BusyModeProvider } from '@/lib/context/BusyModeContext'
import { CommandPalette } from '@/components/layout/CommandPalette'

// Note: ErrorBoundary must be a class component, so it's imported separately

export const metadata: Metadata = {
  title: 'TENVO - Complete Business Management Software (Pakistan)',
  description: 'Streamline your business operations with our comprehensive inventory and accounting software. Features include FBR compliance, Sales Tax invoicing (PST/FST), multi-business support, and advanced analytics for the Pakistani market.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
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
