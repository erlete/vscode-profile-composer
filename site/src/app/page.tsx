'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

import { title, subtitle } from '@/components/primitives'
import ComponentSearchBar from '@/components/ComponentSearchBar'
import { applicationConfig } from '@/site.config'

interface ProfileManifest {
  generated: string
  version: string
  totalProfiles: number
  profiles: Array<{
    name: string
    filename: string
    displayName: string
    size: number
    created: string
    modified: string
    extensionCount: number
    settingCount: number
    components: {
      hasExtensions: boolean
      hasSettings: boolean
      hasKeybindings: boolean
      hasTasks: boolean
      hasSnippets: boolean
    }
  }>
}

interface ProfileItem {
  key: string
  label: string
}

export default function Page() {
  const [profiles, setProfiles] = useState<ProfileItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchManifest() {
      try {
        const response = await fetch('/fragments/manifest.json')

        if (!response.ok) {
          throw new Error(`Failed to fetch manifest: ${response.statusText}`)
        }

        const rawManifest: ProfileManifest = await response.json()
        const manifest = {
          ...rawManifest,
          profiles: rawManifest.profiles.filter(
            (entry) => !entry.name.includes(',')
          ),
        }

        // Convert manifest profiles to ComponentSearchBar items
        const profileItems: ProfileItem[] = manifest.profiles.map(
          (profile) => ({
            key: profile.name,
            label: profile.name,
          })
        )

        setProfiles(profileItems)
        setError(null)
      } catch (err) {
        console.error('Error fetching manifest:', err)
        setError(err instanceof Error ? err.message : 'Failed to load profiles')
        // Fallback to empty array if manifest fails to load
        setProfiles([])
      }
    }

    fetchManifest()
  }, [])

  return (
    <section className="grid grid-rows-2 h-full items-center justify-center gap-4 py-8 md:py-10 h-full">
      <motion.div
        className="inline-block max-w-xl text-center items-center place-self-end"
        initial={{ opacity: 0 }}
        whileInView={{
          opacity: 1,
          transition: {
            duration: 0.5,
            ease: 'easeOut',
          },
        }}
      >
        <span className={title()}>VSCode&nbsp;</span>
        <span className={title({ color: 'violet' })}>Profile&nbsp;</span>
        <span className={title()}>Composer</span>
        <div
          className={subtitle({
            class: 'mt-4 font-light text-sm',
          })}
        >
          {applicationConfig.description}
        </div>
      </motion.div>

      <div className="flex w-full flex-col h-full place-content-start">
        {error && (
          <div className="w-full text-center text-red-500 mb-4">
            Error loading profiles
          </div>
        )}

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="h-full"
          initial={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.75 }}
        >
          <ComponentSearchBar
            initialChipCount={Math.min(6, profiles.length)}
            items={profiles}
          />
        </motion.div>
      </div>
    </section>
  )
}
