import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { ErrorBoundary } from '@/components/error-boundary'
import { FeedbackWidget } from '@/components/feedback-widget'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LX Notes - Production Notes Manager',
  description: 'Collaborative lighting and production notes management for theatrical teams',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' }
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            {children}
            <FeedbackWidget />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}