export const THEMES = [
  { id: "peach", label: "Pfirsich", swatch: "oklch(0.71 0.135 48)" },
  { id: "blue", label: "Himmel", swatch: "oklch(0.62 0.13 245)" },
  { id: "purple", label: "Lavendel", swatch: "oklch(0.62 0.14 300)" },
  { id: "green", label: "Salbei", swatch: "oklch(0.6 0.11 155)" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

/** "auto" = Farbe folgt dem mood_score der Tagesansicht. */
export type ThemeMode = "auto" | ThemeId;

const KEY = "gmc.theme";

/** Stimmung (1–5) → Farbpalette. */
const MOOD_THEME: Record<number, ThemeId> = {
  1: "blue",
  2: "purple",
  3: "green",
  4: "peach",
  5: "peach",
};

export const DEFAULT_THEME: ThemeId = "peach";

export function themeForMood(score: number | null | undefined): ThemeId {
  if (score == null) return DEFAULT_THEME;
  const rounded = Math.min(5, Math.max(1, Math.round(score)));
  return MOOD_THEME[rounded] ?? DEFAULT_THEME;
}

export function isThemeId(v: string | null): v is ThemeId {
  return !!v && THEMES.some((t) => t.id === v);
}

export function isThemeMode(v: string | null): v is ThemeMode {
  return v === "auto" || isThemeId(v);
}

/** Gespeicherter Modus – Standard ist "auto". */
export function loadMode(): ThemeMode {
  if (typeof window === "undefined") return "auto";
  try {
    const v = window.localStorage.getItem(KEY);
    return isThemeMode(v) ? v : "auto";
  } catch {
    return "auto";
  }
}

export function loadTheme(): ThemeId {
  const mode = loadMode();
  return mode === "auto" ? DEFAULT_THEME : mode;
}

export function resolveTheme(mode: ThemeMode, moodScore: number | null | undefined): ThemeId {
  return mode === "auto" ? themeForMood(moodScore) : mode;
}

export function applyTheme(theme: ThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset["theme"] = theme;
}

export function saveMode(mode: ThemeMode) {
  try {
    window.localStorage.setItem(KEY, mode);
  } catch {
    /* ignore */
  }
}

export function saveTheme(theme: ThemeId) {
  saveMode(theme);
  applyTheme(theme);
}
