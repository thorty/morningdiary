"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { PersonalJournal } from "@/components/personal-journal";
import { ThemePicker } from "@/components/theme-picker";
import type { PersonalJournalApiClient } from "@/lib/api/client";
import { defaultPersonalJournalApiClient } from "@/lib/api/default-client";
import { resolveAutomaticTheme } from "@/lib/theme";
import type { MorningCheckinResponse } from "@/lib/api/types";

export function PersonalJournalPage({ apiClient = defaultPersonalJournalApiClient }: { apiClient?: PersonalJournalApiClient }) {
  const [snapshots, setSnapshots] = useState<MorningCheckinResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    void apiClient.listPersonalJournalSnapshots().then(
      (response) => setSnapshots(response),
      () => setError("Die Personal Journal Eintraege konnten nicht geladen werden."),
    ).finally(() => setIsLoading(false));
  }, [apiClient]);

  async function downloadExport() {
    setIsExporting(true);
    setExportError(null);
    try {
      const payload = await apiClient.exportPersonalJournal();
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "personal-journal-export.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Der Journal Export konnte nicht heruntergeladen werden.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main><div className="shell">
      <nav className="page-nav" aria-label="Seitennavigation"><div className="page-nav-links"><Link href="/">Zur Startseite</Link><Link href="/check-in">Morning Check-in</Link></div><ThemePicker automaticTheme={resolveAutomaticTheme(snapshots)} /></nav>
      <header className="hero"><p className="date-label">Dein Archiv</p><h1 className="title">Personal Journal</h1></header>
      <section className="section" aria-label="Personal Journal">
        <div className="journal-heading"><h2>Daily Snapshots</h2><button className="journal-export" type="button" onClick={() => void downloadExport()} disabled={isExporting}>{isExporting ? "Journal Export wird vorbereitet..." : "Journal Export herunterladen"}</button></div>
        <PersonalJournal snapshots={snapshots} isLoading={isLoading} error={error} startCheckinHref="/check-in" />
        {exportError ? <p className="status" role="alert">{exportError}</p> : null}
      </section>
    </div></main>
  );
}
