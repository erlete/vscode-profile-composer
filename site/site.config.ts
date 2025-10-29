import { Metadata, Viewport } from "next";
import { Fira_Code, Nunito } from "next/font/google";

/**
 * Application configuration object.
 *
 * This object contains all metadata related to the application, such as the
 * title and description.
 */
export const applicationConfig = {
  title: "VSCode Profile Composer",
  description: "Create VSCode profiles tailored to your needs, with ease",
  links: {
    github: "https://github.com/erlete/vscode-profile-composer",
  },
};

/**
 * Metadata configuration for the application.
 *
 * It is preferred to edit the `applicationConfig` object instead of this object.
 *
 * @see {@link https://nextjs.org/docs/app/building-your-application/optimizing/metadata} for more information.
 */
export const metadata: Metadata = {
  title: {
    default: `${applicationConfig.title} | ${applicationConfig.description}`,
    template: `%s - ${applicationConfig.title}`,
  },
  description: applicationConfig.description,
};

/**
 * Viewport configuration for the application.
 *
 * @see {@link https://nextjs.org/docs/app/api-reference/functions/generate-viewport} for more information.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/**
 * Sans font used all across the platform.
 *
 * @see {@link https://fonts.google.com/specimen/Nunito}
 */
export const fontSans = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
});

/**
 * Mono font used all across the platform.
 *
 * @see {@link https://fonts.google.com/specimen/Fira+Code}
 */
export const fontMono = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
});
