import { useEffect, useState } from "react";
import {
  applyTheme,
  loadMode,
  resolveTheme,
  saveMode,
  type ThemeMode,
} from "@/lib/theme";

/**
 * Hält die Farbpalette synchron mit dem Modus und – im Auto-Modus –
 * mit dem mood_score der aktuellen Tagesansicht.
 */
export function useMoodTheme(moodScore: number | null | undefined) {
  const [mode, setModeState] = useState<ThemeMode>("auto");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setModeState(loadMode());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyTheme(resolveTheme(mode, moodScore));
  }, [hydrated, mode, moodScore]);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    saveMode(next);
    applyTheme(resolveTheme(next, moodScore));
  };

  return { mode, setMode, hydrated, theme: resolveTheme(mode, moodScore) };
}
