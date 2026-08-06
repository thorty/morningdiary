import type { MorningCheckinResponse } from "@/lib/api/types";

export const themes = [
  { id: "orange", label: "Orange" },
  { id: "blue", label: "Blau" },
  { id: "purple", label: "Lila" },
  { id: "green", label: "Grün" },
] as const;

export type ThemeId = (typeof themes)[number]["id"];
export type ThemeMode = "auto" | ThemeId;

export const defaultTheme: ThemeId = "orange";
export const themeStorageKey = "morning-coach.theme";

function themeForMood(mood: number): ThemeId {
  if (mood <= 1) return "blue";
  if (mood === 2) return "purple";
  if (mood === 3) return "green";
  return "orange";
}

export function resolveAutomaticTheme(snapshots: Pick<MorningCheckinResponse, "browser_date" | "answers">[]): ThemeId {
  const newestMood = snapshots
    .slice()
    .sort((left, right) => right.browser_date.localeCompare(left.browser_date))
    .map((snapshot) => snapshot.answers[0])
    .find((answer): answer is number => typeof answer === "number" && answer >= 1 && answer <= 5);

  return newestMood === undefined ? defaultTheme : themeForMood(newestMood);
}

export function isThemeMode(value: string | null): value is ThemeMode {
  return value === "auto" || themes.some((theme) => theme.id === value);
}

export function loadThemeMode(): ThemeMode {
  try {
    const value = window.localStorage.getItem(themeStorageKey);
    return isThemeMode(value) ? value : "auto";
  } catch {
    return "auto";
  }
}

export function saveThemeMode(mode: ThemeMode) {
  try {
    window.localStorage.setItem(themeStorageKey, mode);
  } catch {
    // Theme selection remains usable when browser storage is unavailable.
  }
}
