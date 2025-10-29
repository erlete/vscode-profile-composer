import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
} from '@heroui/navbar'
import { Link } from '@heroui/link'
import NextLink from 'next/link'
import { Divider } from '@heroui/divider'
import Image from 'next/image'
import { RiBook2Fill, RiGithubFill } from '@remixicon/react'

import { applicationConfig } from '@/site.config'
import { ThemeSwitch } from '@/components/theme-switch'

/**
 * Navbar content for desktop views.
 *
 * @returns {JSX.Element} The desktop navbar content.
 */
const DesktopNavbar = (): JSX.Element => (
  <NavbarContent
    className="hidden sm:flex basis-1/5 sm:basis-full"
    justify="end"
  >
    <NavbarItem className="hidden sm:flex gap-2">
      <Link aria-label="Documentation" href="/documentation">
        <RiBook2Fill className="text-default-500" size={28} />
      </Link>
      <Link
        isExternal
        aria-label="Github"
        href={applicationConfig.links.github}
      >
        <RiGithubFill className="text-default-500" size={28} />
      </Link>
      <ThemeSwitch />
    </NavbarItem>
  </NavbarContent>
)

/**
 * Navbar content for mobile views.
 *
 * @returns {JSX.Element} The mobile navbar content.
 */
const MobileNavbar = (): JSX.Element => (
  <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
    <Link aria-label="Documentation" href="/documentation">
      <RiBook2Fill className="text-default-500" size={28} />
    </Link>
    <Link isExternal aria-label="Github" href={applicationConfig.links.github}>
      <RiGithubFill className="text-default-500" size={28} />
    </Link>
    <ThemeSwitch />
    <NavbarMenuToggle />
  </NavbarContent>
)

/**
 * Main Navbar component.
 *
 * @returns {JSX.Element} The Navbar element.
 */
export const Navbar = (): JSX.Element => {
  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      {/* Brand and title */}
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink
            className="flex justify-start items-center gap-2"
            href="https://erlete.dev"
            target="_blank"
          >
            <Image
              alt="Profile image"
              className="rounded-full mr-1 invert dark:filter-none"
              height={32}
              src="https://static.erlete.dev/media/images/logo.png"
              width={32}
            />
            <p className="font-bold text-inherit">erlete.dev</p>
          </NextLink>
          <Divider className="h-6" orientation="vertical" />
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <p className="font-light text-sm">VSCode Profile Composer</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      {/* Content: */}
      <DesktopNavbar />
      <MobileNavbar />
    </HeroUINavbar>
  )
}
