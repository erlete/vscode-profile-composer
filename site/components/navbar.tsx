import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";
import { Link } from "@heroui/link";
import NextLink from "next/link";
import { ThemeSwitch } from "@/components/theme-switch";
import { Divider } from "@heroui/divider";
import Image from "next/image";
import { applicationConfig } from "@/site.config";
import { RiBook2Fill, RiGithubFill } from "@remixicon/react";

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
        <RiBook2Fill size={28} className="text-default-500" />
      </Link>
      <Link
        isExternal
        aria-label="Github"
        href={applicationConfig.links.github}
      >
        <RiGithubFill size={28} className="text-default-500" />
      </Link>
      <ThemeSwitch />
    </NavbarItem>
  </NavbarContent>
);

/**
 * Navbar content for mobile views.
 *
 * @returns {JSX.Element} The mobile navbar content.
 */
const MobileNavbar = (): JSX.Element => (
  <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
    <Link aria-label="Documentation" href="/documentation">
      <RiBook2Fill size={28} className="text-default-500" />
    </Link>
    <Link isExternal aria-label="Github" href={applicationConfig.links.github}>
      <RiGithubFill size={28} className="text-default-500" />
    </Link>
    <ThemeSwitch />
    <NavbarMenuToggle />
  </NavbarContent>
);

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
              src="https://static.erlete.dev/media/images/logo.png"
              alt="Profile image"
              className="rounded-full mr-1 invert dark:filter-none"
              width={32}
              height={32}
            />
            <p className="font-bold text-inherit">erlete.dev</p>
          </NextLink>
          <Divider orientation="vertical" className="h-6" />
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <p className="font-light text-sm">VSCode Profile Composer</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      {/* Content: */}
      <DesktopNavbar />
      <MobileNavbar />
    </HeroUINavbar>
  );
};
