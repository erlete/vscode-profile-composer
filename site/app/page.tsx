"use client";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";

import React from "react";
import ComponentSearchBar from "@/components/ComponentSearchBar";

const ALL_COMPONENTS = [
  { key: "autocomplete", label: "Autocomplete" },
  { key: "select", label: "Select" },
  { key: "chip", label: "Chip" },
  { key: "listbox", label: "Listbox" },
  { key: "dropdown", label: "Dropdown" },
  { key: "input", label: "Input" },
  { key: "2213", label: "really long name for this crappppp" },
];

export default function Page() {
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

      <div className="flex w-full">
        <ComponentSearchBar
          items={ALL_COMPONENTS}
          initialChipCount={6}
          onChange={(keys) => {
            console.log(keys);
          }}
        />
      </div>
    </section>
  );
}
