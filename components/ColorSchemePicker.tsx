"use client";

import { useEffect, useState } from "react";
import {
  applyColorScheme,
  COLOR_SCHEME_STORAGE_KEY,
  COLOR_SCHEMES,
  DEFAULT_COLOR_SCHEME,
  parseColorScheme,
  type ColorSchemeId,
} from "@/lib/color-scheme";

function ColorSchemePicker() {
  const [scheme, setScheme] = useState<ColorSchemeId>(DEFAULT_COLOR_SCHEME);

  useEffect(() => {
    const fromDom = document.documentElement.getAttribute("data-scheme");
    let fromStore: string | null = null;
    try {
      fromStore = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
    } catch {
      // Ignore storage errors in private browsing.
    }
    const next = parseColorScheme(fromStore && fromStore.length > 0 ? fromStore : fromDom);
    setScheme(next);
    applyColorScheme(next);
  }, []);

  const selectScheme = (next: ColorSchemeId) => {
    setScheme(next);
    applyColorScheme(next);
  };

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-yellow-500/20 bg-neutral-900/80 px-1.5 py-1"
      role="group"
      aria-label="Color scheme"
    >
      {COLOR_SCHEMES.map((item) => {
        const isActive = scheme === item.id;
        return (
          <button
            key={item.id}
            type="button"
            title={`${item.label} — ${item.description}`}
            aria-label={item.label}
            aria-pressed={isActive}
            onClick={() => selectScheme(item.id)}
            className={`h-4 w-4 rounded-full border-2 transition-transform ${
              isActive
                ? "scale-110 border-white shadow-[0_0_0_2px_rgba(255,255,255,0.25)]"
                : "border-black/40 hover:scale-105"
            }`}
            style={{ backgroundColor: item.swatch }}
          />
        );
      })}
    </div>
  );
}

export default ColorSchemePicker;
