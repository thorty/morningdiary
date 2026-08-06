"use client";

import React, { useEffect, useState } from "react";

import { loadThemeMode, saveThemeMode, themes, type ThemeId, type ThemeMode } from "@/lib/theme";

type ThemePickerProps = {
  automaticTheme: ThemeId;
};

export function ThemePicker({ automaticTheme }: ThemePickerProps) {
  const [mode, setMode] = useState<ThemeMode>("auto");
  const [isHydrated, setIsHydrated] = useState(false);
  const activeTheme = mode === "auto" ? automaticTheme : mode;

  useEffect(() => {
    setMode(loadThemeMode());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) document.documentElement.dataset.theme = activeTheme;
  }, [activeTheme, isHydrated]);

  function selectTheme(nextMode: ThemeMode) {
    setMode(nextMode);
    saveThemeMode(nextMode);
  }

  return (
    <fieldset className="theme-picker">
      <legend>Farbstimmung</legend>
      <div className="theme-options">
        <button type="button" aria-pressed={isHydrated && mode === "auto"} onClick={() => selectTheme("auto")}>Automatisch</button>
        {themes.map((theme) => (
          <button key={theme.id} type="button" className={`theme-option theme-option-${theme.id}`} aria-label={`Farbstimmung ${theme.label}`} aria-pressed={isHydrated && mode === theme.id} onClick={() => selectTheme(theme.id)}>
            <span aria-hidden="true" />{theme.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
