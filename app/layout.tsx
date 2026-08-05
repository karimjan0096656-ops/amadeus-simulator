import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Amadeus Master — Learn the Amadeus GDS',
  description:
    'A high-tech learning platform for mastering the Amadeus GDS reservation system for aviation and travel careers. Interactive lessons, a real terminal simulator, and timed assessments.',
  applicationName: 'Amadeus Master',
  keywords: ['Amadeus', 'GDS', 'reservation system', 'aviation', 'travel', 'ticketing', 'PNR'],
}

export const viewport: Viewport = {
  themeColor: '#05090f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
