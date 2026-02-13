import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ClientProviders } from '@/lib/client-providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Finto - AI-Powered GST Reconciliation',
  description: 'Cut GST reconciliation time by 60-70% for Indian CAs. Automated GSTR-2B matching with Purchase Register.',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ClientProviders>
          {children}
        </ClientProviders>
        <Analytics />
      </body>
    </html>
  )
}

