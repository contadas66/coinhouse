import type { Metadata } from 'next'
import '../styles/globals.css'
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: 'Coinhouse',
  description: 'Coinhouse - Cryptocurrency investment platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
