import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Container from '@/ui/Container/Container'
import { ThemeProvider } from 'next-themes'
import { IndexedDBProvider } from '@/components/providers/indexedDB'
import { AppHeader } from '@/components/Layout/AppHeader'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Time Tracker',
  description: 'Track your time effectively',
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/icons/favicon-196.png',
        type: 'image/png',
        sizes: '196x196',
      },
    ],
    apple: [
      {
        url: '/icons/apple-icon-180.png',
        type: 'image/png',
        sizes: '180x180',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: 'Time Tracker',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <IndexedDBProvider>
            <AppHeader />
            <Container>{children}</Container>
          </IndexedDBProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
