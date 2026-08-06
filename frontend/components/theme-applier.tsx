"use client";

import { useEffect } from "react";

import { defaultPersonalJournalApiClient } from "@/lib/api/default-client";
import { loadThemeMode, resolveAutomaticTheme } from "@/lib/theme";

export function ThemeApplier() {
  useEffect(() => {
    const mode = loadThemeMode();
    if (mode !== "auto") {
      document.documentElement.dataset.theme = mode;
      return;
    }

    void defaultPersonalJournalApiClient.listPersonalJournalSnapshots().then(
      (snapshots) => { document.documentElement.dataset.theme = resolveAutomaticTheme(snapshots); },
      () => { document.documentElement.dataset.theme = "orange"; },
    );
  }, []);

  return null;
}
