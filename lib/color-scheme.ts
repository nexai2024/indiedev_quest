export const COLOR_SCHEME_STORAGE_KEY = "indiedev-color-scheme";
export const COLOR_SCHEME_COOKIE = "indiedev-color-scheme";

export const COLOR_SCHEMES = [
  {
    id: "ember",
    label: "Ember",
    description: "Gold on charcoal",
    swatch: "#facc15",
  },
  {
    id: "aurora",
    label: "Aurora",
    description: "Cyan night",
    swatch: "#22d3ee",
  },
  {
    id: "arcane",
    label: "Arcane",
    description: "Violet mage",
    swatch: "#c084fc",
  },
  {
    id: "crimson",
    label: "Crimson",
    description: "Rose raid",
    swatch: "#fb7185",
  },
  {
    id: "verdant",
    label: "Verdant",
    description: "Forest lime",
    swatch: "#a3e635",
  },
] as const;

export type ColorSchemeId = (typeof COLOR_SCHEMES)[number]["id"];

export const DEFAULT_COLOR_SCHEME: ColorSchemeId = "ember";

export function isColorSchemeId(value: string | null | undefined): value is ColorSchemeId {
  return COLOR_SCHEMES.some((scheme) => scheme.id === value);
}

export function parseColorScheme(value: string | null | undefined): ColorSchemeId {
  return isColorSchemeId(value) ? value : DEFAULT_COLOR_SCHEME;
}

export function applyColorScheme(scheme: ColorSchemeId) {
  document.documentElement.setAttribute("data-scheme", scheme);
  try {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme);
  } catch {
    // Ignore storage errors in private browsing.
  }
  document.cookie = `${COLOR_SCHEME_COOKIE}=${scheme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
