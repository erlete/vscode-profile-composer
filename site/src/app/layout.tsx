import '@/styles/globals.css'
import { Link } from '@heroui/link'
import clsx from 'clsx'

import { Providers } from './providers'

import { Navbar } from '@/components/navbar'
import { fontSans } from '@/site.config'
export { metadata, viewport } from '@/site.config'

export const dynamic = 'force-static'

/**
 * Root layout component.
 *
 * @param {Object} props - The component props.
 * @returns {JSX.Element} - The rendered layout component.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          'min-h-screen text-foreground bg-background font-sans antialiased',
          fontSans.variable
        )}
      >
        <Providers themeProps={{ attribute: 'class', defaultTheme: 'system' }}>
          <div className="relative flex flex-col h-screen">
            <Navbar />
            <main className="container mx-auto max-w-7xl px-6 flex-grow">
              {children}
            </main>
            <footer className="w-full py-3 text-sm flex flex-col gap-1 items-center justify-center">
              <span className="flex items-center justify-center">
                <p>&copy;&nbsp;</p>
                <Link
                  isExternal
                  className="text-primary-500/80"
                  href="https://github.com/erlete"
                  size="sm"
                >
                  erlete
                </Link>
                <p>&nbsp;2025</p>
              </span>
              <p className="font-light text-xs">
                Made with{' '}
                <Link
                  isExternal
                  className="text-xs text-primary-500/80"
                  href="https://nextjs.org/"
                >
                  Next.js
                </Link>{' '}
                and{' '}
                <Link
                  isExternal
                  className="text-xs text-primary-500/80"
                  href="https://www.heroui.com/"
                >
                  HeroUI
                </Link>
                , icons from{' '}
                <Link
                  isExternal
                  className="text-xs text-primary-500/80"
                  href="https://remixicon.com/"
                >
                  Remix Icon
                </Link>
              </p>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}
