"use client";

import { useEffect, useState } from "react";
import React from "react";

import type { PersonalJournalApiClient } from "@/lib/api/client";
import { defaultPersonalJournalApiClient } from "@/lib/api/default-client";
import { loadThemeMode, resolveAutomaticTheme } from "@/lib/theme";

export function ThemeApplier({ apiClient = defaultPersonalJournalApiClient }: { apiClient?: PersonalJournalApiClient }) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const mode = loadThemeMode(() => setError("Die Farbstimmung konnte nicht aus dem Browser-Speicher geladen werden."));
    if (mode !== "auto") {
      document.documentElement.dataset.theme = mode;
      return;
    }

    void apiClient.listPersonalJournalSnapshots().then(
      (snapshots) => { document.documentElement.dataset.theme = resolveAutomaticTheme(snapshots); },
      () => {
        document.documentElement.dataset.theme = "orange";
        setError("Die automatische Farbstimmung konnte nicht aus dem Browser-Speicher geladen werden.");
      },
    );
  }, [apiClient]);

  return error ? <p className="status" role="alert">{error}</p> : null;
}
