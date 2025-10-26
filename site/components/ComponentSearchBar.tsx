"use client";

import React from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Chip } from "@heroui/chip";
import { useFilter } from "@react-aria/i18n";
import { Button } from "@heroui/button";
import { ClearIcon } from "./icons";
import { redirect, RedirectType } from "next/navigation";
import { addToast } from "@heroui/toast";
import { motion } from "framer-motion";
import { readSchema2 } from "@/app/lib";

type Item = { key: string; label: string };

export type ComponentSearchBarProps = {
  /** Full pool of selectable items */
  items: Item[];
  /** Number of chips to pre-show when input is empty */
  initialChipCount?: number; // default 5
  /** Optional controlled value */
  value?: string[];
  /** Callback whenever chips change */
  onChange?: (keys: string[]) => void;
  /** Placeholder for the input */
  placeholder?: string;
  /** Label for the field */
  label?: string;
  /** Disable already-selected items */
  disableSelectedOptions?: boolean; // default true
};

export default function ComponentSearchBar({
  items,
  initialChipCount = 5,
  value,
  onChange,
  placeholder = "Search components…",
  label = "Components",
  disableSelectedOptions = true,
}: ComponentSearchBarProps) {
  const [chips, setChips] = React.useState<string[]>(value ?? []);
  const [inputValue, setInputValue] = React.useState("");
  const { startsWith } = useFilter({ sensitivity: "base" });
  const [loading2, setLoading2] = React.useState(false);

  // keep internal state in sync if parent controls it
  React.useEffect(() => {
    if (value) setChips(value);
  }, [value]);

  const chipItems = React.useMemo(
    () => items.filter((i) => chips.includes(i.key)),
    [items, chips]
  );

  const availableItems = React.useMemo(
    () => items.filter((i) => !chips.includes(i.key)),
    [items, chips]
  );

  // Filtered items based on input
  const filteredItems = React.useMemo(() => {
    if (!inputValue.trim()) return availableItems;
    return availableItems.filter((item) =>
      startsWith(item.label, inputValue.trim())
    );
  }, [availableItems, inputValue, startsWith]);

  // First-match logic for Enter: pick first filtered item
  const firstMatch = React.useMemo(() => {
    return filteredItems[0];
  }, [filteredItems]);

  function addChip(key: string | React.Key | null | undefined) {
    if (!key) return;
    const k = String(key);
    if (chips.includes(k)) return;
    const updated = [...chips, k];
    if (!value) setChips(updated);
    onChange?.(updated);
    // reset field so next Enter adds the next match
    setInputValue("");
  }

  function removeChip(key: string) {
    const updated = chips.filter((k) => k !== key);
    if (!value) setChips(updated);
    onChange?.(updated);
  }

  function removeAllChips() {
    if (!value) setChips([]);
    onChange?.([]);
  }

  function onViewRaw() {
    redirect("/api/compose/" + chips.toSorted().join(","), RedirectType.push);
  }

  async function onCopyURL() {
    setLoading2(true);
    const url = `${window.location.origin}/api/compose/${chips.toSorted().join(",")}`;
    navigator.clipboard.writeText(url);

    // Wait for random between 0 and 1 seconds:
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));
    setLoading2(false);

    addToast({
      title: "Link copied!",
      description:
        'Paste this URL in the "Import Profile" dialog from VSCode and you\'re all set!',
      color: "primary",
      variant: "flat",
      timeout: 4000,
    });
  }

  return (
    <div className="flex flex-col gap-3 w-full items-center justify-center">
      {/* Selected chips */}
      {chipItems.length > 0 ? (
        <div className="flex flex-wrap gap-2 items-start w-full max-w-lg">
          {chipItems.map((item) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 10 }}
              animate={
                chips.length > 0 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
              }
              transition={{ duration: 0.5 }}
              aria-hidden={!(chips.length > 0)}
              style={{
                pointerEvents: chips.length > 0 ? "auto" : "none",
              }}
            >
              <Chip
                onClose={() => removeChip(item.key)}
                variant="flat"
                className="px-2"
              >
                {item.label}
              </Chip>
            </motion.div>
          ))}
        </div>
      ) : (
        // Initial suggestions as chips when nothing selected yet
        <div className="flex flex-wrap gap-2 h-8">
          {items.slice(0, initialChipCount).map((item) => (
            <motion.div
              key={`suggest-${item.key}`}
              initial={{ opacity: 0, y: -10 }}
              animate={
                chips.length === 0
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: -10 }
              }
              transition={{ duration: 0.5 }}
              aria-hidden={!(chips.length === 0)}
              style={{
                pointerEvents: chips.length === 0 ? "auto" : "none",
              }}
            >
              <Chip
                className="opacity-70 cursor-pointer"
                variant="faded"
                onClick={() => addChip(item.key)}
              >
                {item.label}
              </Chip>
            </motion.div>
          ))}
        </div>
      )}

      {/* Autocomplete input + listbox */}
      <Autocomplete
        isClearable
        endContent={
          chipItems.length > 0 && (
            <Button
              isIconOnly
              variant="light"
              aria-label="Clear"
              size="lg"
              onPress={removeAllChips}
            >
              <ClearIcon
                size={32}
                className="w-full stroke-default-400"
                height={24}
              />
            </Button>
          )
        }
        label={label}
        placeholder={placeholder}
        inputValue={inputValue}
        onInputChange={setInputValue}
        fullWidth
        items={filteredItems}
        // Prevent selecting already chosen items from the popup
        disabledKeys={disableSelectedOptions ? new Set(chips) : undefined}
        allowsCustomValue={false}
        // When user clicks an item or presses Enter on a highlighted item
        onSelectionChange={(key) => {
          if (key) {
            addChip(key);
          }
        }}
        listboxProps={{
          emptyContent: "No matches found",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && firstMatch) {
            // If there's a first match, add it
            e.preventDefault();
            addChip(firstMatch.key);
          }
        }}
        className="w-full max-w-lg"
        menuTrigger="input"
      >
        {(item) => (
          <AutocompleteItem key={item.key} textValue={item.label}>
            {item.label}
          </AutocompleteItem>
        )}
      </Autocomplete>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={
          chips.length > 0 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
        }
        transition={{ duration: 0.75 }}
        className="w-full max-w-lg flex items-center justify-center gap-2"
        aria-hidden={!(chips.length > 0)}
        style={{
          // keep it in the layout but make it non-interactive when "hidden"
          pointerEvents: chips.length > 0 ? "auto" : "none",
        }}
      >
        <Button
          fullWidth
          isLoading={loading2}
          variant="solid"
          color="primary"
          isDisabled={chips.length === 0 || loading2}
          onPress={onCopyURL}
        >
          Copy Profile URL
        </Button>
        <Button
          fullWidth
          variant="bordered"
          color="primary"
          isDisabled={chips.length === 0 || loading2}
          onPress={onViewRaw}
        >
          View Raw Profile
        </Button>
      </motion.div>
    </div>
  );
}
