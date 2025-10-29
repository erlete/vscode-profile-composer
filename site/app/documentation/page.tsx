"use client";

import { title, subtitle } from "@/components/primitives";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Link } from "@heroui/link";
import { Divider } from "@heroui/divider";
import { motion } from "framer-motion";
import { applicationConfig } from "@/site.config";
import {
  RiGithubFill,
  RiLightbulbLine,
  RiSettings3Line,
  RiPuzzleLine,
  RiDownloadLine,
  RiCodeSLine,
  RiUserLine,
  RiRocketLine,
} from "@remixicon/react";

/**
 * Documentation page.
 *
 * @returns {JSX.Element} - The documentation page component.
 */
export default function Page(): JSX.Element {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4"
      >
        <div className="inline-block">
          <span className={title({ size: "lg" })}>Documentation</span>
        </div>
        <div className={subtitle({ class: "text-center mx-auto" })}>
          Learn how to use VSCode Profile Composer to create custom development
          environments
        </div>
      </motion.div>

      <div className="space-y-6">
        {/* What is VSCode Profile Composer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
          viewport={{ once: true }}
        >
          <Card className="p-6">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <RiLightbulbLine size={24} className="text-primary" />
                <h2 className="text-2xl font-semibold">
                  What is VSCode Profile Composer?
                </h2>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <p className="text-default-600 leading-relaxed mb-4">
                VSCode Profile Composer is a web-based tool that allows you to
                create customized Visual Studio Code profiles by combining
                different technology stacks, frameworks, and development
                environments. Instead of manually configuring extensions,
                settings, and keybindings for each project, you can generate
                ready-to-use profiles tailored to your needs.
              </p>
              <div className="flex flex-wrap gap-2">
                <Chip size="sm" variant="flat" color="primary">
                  Extensions
                </Chip>
                <Chip size="sm" variant="flat" color="secondary">
                  Settings
                </Chip>
                <Chip size="sm" variant="flat" color="success">
                  Keybindings
                </Chip>
                <Chip size="sm" variant="flat" color="warning">
                  Tasks
                </Chip>
                <Chip size="sm" variant="flat" color="danger">
                  Snippets
                </Chip>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* How to Use */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
          viewport={{ once: true }}
        >
          <Card className="p-6">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <RiRocketLine size={24} className="text-secondary" />
                <h2 className="text-2xl font-semibold">How to Use</h2>
              </div>
            </CardHeader>
            <CardBody className="pt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">
                      1
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">
                      Select Your Technologies
                    </h3>
                    <p className="text-default-600">
                      Use the search bar on the homepage to select the
                      technologies you work with. Choose from bundles (AI,
                      Docker, GitHub, UI), frameworks (Flask, NestJS, Next.js,
                      Node), and languages (Bash, Java, JavaScript, PowerShell,
                      Python, TypeScript).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                    <span className="text-secondary font-semibold text-sm">
                      2
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">
                      Generate Your Profile
                    </h3>
                    <p className="text-default-600">
                      Click the <b>"Copy Profile URL"</b> button to directly
                      copy the generated profile contents or click on{" "}
                      <b>"View Raw Profile"</b> to access the contents of the
                      URL mentioned before. There, you will see the final
                      profile composed from the segments you have selected.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                    <span className="text-success font-semibold text-sm">
                      3
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Import to VSCode</h3>
                    <p className="text-default-600 mb-4">
                      After copying the URL of the generated final profile,
                      import it to VSCode using:
                    </p>

                    <div className="w-full bg-default-100 border border-default-200 p-4 rounded-lg mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Chip size="sm" color="success" variant="flat">
                          Primary method
                        </Chip>
                      </div>
                      <p className="text-sm font-mono text-default-700">
                        <span className="font-semibold">
                          Open the Command Palette
                        </span>{" "}
                        →{" "}
                        <span className="text-primary">
                          Profiles: Import Profile...
                        </span>{" "}
                        → Paste the URL to the generated profile
                      </p>
                    </div>

                    <div className="w-full bg-default-100/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Chip size="sm" color="warning" variant="flat">
                          Alternative method
                        </Chip>
                      </div>
                      <p className="text-sm font-mono text-default-600">
                        <span className="font-semibold">
                          Open the Command Palette
                        </span>{" "}
                        →{" "}
                        <span className="text-primary">
                          Preferences: Open Profiles (UI)
                        </span>{" "}
                        → Next to the "New Profile" button, click on the
                        dropdown menu →{" "}
                        <span className="text-primary">Import Profile...</span>{" "}
                        → Paste the URL to the generated profile
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Available Components */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
          viewport={{ once: true }}
        >
          <Card className="p-6">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <RiPuzzleLine size={24} className="text-warning" />
                <h2 className="text-2xl font-semibold">
                  Available Profile Components
                </h2>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-primary">Bundles</h3>
                  <div className="space-y-1 text-sm text-default-600">
                    <div>
                      • <strong>AI:</strong> AI development tools and extensions
                    </div>
                    <div>
                      • <strong>Docker:</strong> Container development support
                    </div>
                    <div>
                      • <strong>GitHub:</strong> Git and GitHub integration
                    </div>
                    <div>
                      • <strong>UI:</strong> Frontend development tools
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-secondary">Frameworks</h3>
                  <div className="space-y-1 text-sm text-default-600">
                    <div>
                      • <strong>Flask:</strong> Python web framework
                    </div>
                    <div>
                      • <strong>NestJS:</strong> Node.js server framework
                    </div>
                    <div>
                      • <strong>Next.js:</strong> React framework
                    </div>
                    <div>
                      • <strong>Node:</strong> Node.js runtime
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-success">Languages</h3>
                  <div className="space-y-1 text-sm text-default-600">
                    <div>
                      • <strong>Bash:</strong> Shell scripting
                    </div>
                    <div>
                      • <strong>Java:</strong> Java development
                    </div>
                    <div>
                      • <strong>JavaScript:</strong> JS/ES6+ support
                    </div>
                    <div>
                      • <strong>PowerShell:</strong> Windows scripting
                    </div>
                    <div>
                      • <strong>Python:</strong> Python development
                    </div>
                    <div>
                      • <strong>TypeScript:</strong> TypeScript support
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
          viewport={{ once: true }}
        >
          <Card className="p-6 border-l-4 border-l-warning">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <RiUserLine size={24} className="text-warning" />
                <h2 className="text-2xl font-semibold text-warning">
                  Important Notice
                </h2>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-4">
                <p className="text-default-600 leading-relaxed">
                  The content of each profile fragment (extensions, settings,
                  keybindings, etc.) is <strong>opinionated</strong> and
                  reflects common configurations for the selected technologies.
                  These profiles are designed to provide a good starting point
                  for development, but you may need to customize them further
                  based on your specific preferences and requirements.
                </p>

                <Divider />

                <div className="bg-default-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <RiCodeSLine size={20} />
                    Want to customize the profiles?
                  </h3>
                  <p className="text-default-600 mb-3">
                    You can deploy your own version of VSCode Profile Composer
                    with custom profile fragments tailored to your team's needs
                    or personal preferences.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={applicationConfig.links.github}
                      isExternal
                      className="inline-flex items-center gap-2 text-sm"
                      color="primary"
                    >
                      <RiGithubFill size={16} />
                      View Repository
                    </Link>
                    <Link
                      href={`${applicationConfig.links.github}#readme`}
                      isExternal
                      className="inline-flex items-center gap-2 text-sm"
                      color="secondary"
                    >
                      <RiDownloadLine size={16} />
                      Setup Instructions
                    </Link>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Technical Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
          viewport={{ once: true }}
        >
          <Card className="p-6">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <RiSettings3Line size={24} className="text-danger" />
                <h2 className="text-2xl font-semibold">Technical Details</h2>
              </div>
            </CardHeader>
            <CardBody className="pt-0 space-y-4">
              <p className="text-default-600 leading-relaxed">
                VSCode Profile Composer uses a sophisticated merging system that
                combines individual profile fragments on-demand. This approach
                provides better performance and flexibility compared to
                pre-generating all possible combinations.
              </p>

              <div className="bg-default-100 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold">Profile Components Include:</h4>
                <ul className="text-sm text-default-600 space-y-1">
                  <li>
                    • <strong>Extensions:</strong> Automatically installed
                    VSCode extensions
                  </li>
                  <li>
                    • <strong>Settings:</strong> Editor and workspace
                    configurations
                  </li>
                  <li>
                    • <strong>Keybindings:</strong> Custom keyboard shortcuts
                  </li>
                  <li>
                    • <strong>Tasks:</strong> Build and automation tasks
                  </li>
                  <li>
                    • <strong>Snippets:</strong> Code templates and shortcuts
                  </li>
                </ul>
              </div>

              <p className="text-sm text-default-500 leading-relaxed">
                The profiles are generated in the standard VSCode profile format
                and can be imported directly into any VSCode installation. All
                configurations follow VSCode best practices and are regularly
                updated.
              </p>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
