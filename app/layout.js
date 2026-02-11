import './globals.css'
import { ToastProvider } from '@/components/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { BusinessProvider } from '@/lib/context/BusinessContext'
import { AuthProvider } from '@/lib/context/AuthContext'
import { LanguageProvider } from '@/lib/context/LanguageContext'
import { CommandPalette } from '@/components/layout/CommandPalette'

// Note: ErrorBoundary must be a class component, so it's imported separately

export const metadata = {
  title: 'TENVO - Complete Business Management Software (Pakistan)',
  description: 'Streamline your business operations with our comprehensive inventory and accounting software. Features include FBR compliance, Sales Tax invoicing (PST/FST), multi-business support, and advanced analytics for the Pakistani market.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <BusinessProvider>
              <LanguageProvider>
                <ToastProvider />
                <CommandPalette />
                {children}
              </LanguageProvider>
            </BusinessProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

