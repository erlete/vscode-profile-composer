import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Link } from "@heroui/link";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
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
                  href="https://github.com/erlete"
                  className="text-primary-500/80"
                  size="sm"
                >
                  erlete
                </Link>
                <p>&nbsp;2025</p>
              </span>
              <p className="font-light text-xs">
                Made with{" "}
                <Link
                  isExternal
                  href="https://nextjs.org/"
                  className="text-xs text-primary-500/80"
                >
                  Next.js
                </Link>{" "}
                and{" "}
                <Link
                  isExternal
                  href="https://www.heroui.com/"
                  className="text-xs text-primary-500/80"
                >
                  HeroUI
                </Link>
                . Icons from{" "}
                <Link
                  isExternal
                  href="https://www.svgrepo.com/"
                  className="text-xs text-primary-500/80"
                >
                  SVGRepo
                </Link>
                . Hosted in{" "}
                <Link
                  isExternal
                  href="https://docs.github.com/pages"
                  className="text-xs text-primary-500/80"
                >
                  GitHub Pages
                </Link>{" "}
              </p>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
