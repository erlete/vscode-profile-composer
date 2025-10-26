"use client";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";

import React, { useEffect, useState } from "react";
import ComponentSearchBar from "@/components/ComponentSearchBar";

interface ProfileManifest {
  generated: string;
  version: string;
  totalProfiles: number;
  profiles: Array<{
    name: string;
    filename: string;
    displayName: string;
    size: number;
    created: string;
    modified: string;
    extensionCount: number;
    settingCount: number;
    components: {
      hasExtensions: boolean;
      hasSettings: boolean;
      hasKeybindings: boolean;
      hasTasks: boolean;
      hasSnippets: boolean;
    };
  }>;
}

interface ProfileItem {
  key: string;
  label: string;
}

export default function Page() {
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchManifest() {
      try {
        setIsLoading(true);
        const response = await fetch("/data/manifest.json");

        if (!response.ok) {
          throw new Error(`Failed to fetch manifest: ${response.statusText}`);
        }

        const rawManifest: ProfileManifest = await response.json();
        const manifest = {
          ...rawManifest,
          profiles: rawManifest.profiles.filter(
            (entry) => !entry.name.includes(",")
          ),
        };

        // Convert manifest profiles to ComponentSearchBar items
        const profileItems: ProfileItem[] = manifest.profiles.map(
          (profile) => ({
            key: profile.name,
            label: profile.name,
          })
        );

        setProfiles(profileItems);
        setError(null);
      } catch (err) {
        console.error("Error fetching manifest:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load profiles"
        );
        // Fallback to empty array if manifest fails to load
        setProfiles([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchManifest();
  }, []);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10 h-full">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>VSCode&nbsp;</span>
        <span className={title({ color: "violet" })}>Profile&nbsp;</span>
        <span className={title()}>Composer</span>
        <div
          className={subtitle({
            class: "mt-4 font-light text-sm",
          })}
        >
          {siteConfig.description}
        </div>
      </div>

      <div className="flex w-full flex-col">
        {error && (
          <div className="w-full text-center text-red-500 mb-4">
            Error loading profiles: {error}
          </div>
        )}
        {isLoading ? (
          <div className="w-full text-center text-gray-500">
            Loading available profiles...
          </div>
        ) : (
          <ComponentSearchBar
            items={profiles}
            initialChipCount={Math.min(6, profiles.length)}
            onChange={(keys) => {
              console.log("Selected profile combinations:", keys);
            }}
          />
        )}
      </div>
    </section>
  );
}
