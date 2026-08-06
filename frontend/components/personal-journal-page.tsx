"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { PersonalJournal } from "@/components/personal-journal";
import { createHttpPersonalJournalApiClient, type PersonalJournalApiClient } from "@/lib/api/client";
import type { MorningCheckinResponse } from "@/lib/api/types";

const defaultClient = createHttpPersonalJournalApiClient();

export function PersonalJournalPage({ apiClient = defaultClient }: { apiClient?: PersonalJournalApiClient }) {
  const [snapshots, setSnapshots] = useState<MorningCheckinResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    void apiClient.listPersonalJournalSnapshots().then(
      (response) => setSnapshots(response),
      () => setError("Die Personal Journal Eintraege konnten nicht geladen werden."),
    ).finally(() => setIsLoading(false));
  }, [apiClient]);

  async function downloadExport() {
    setIsExporting(true);
    try {
      const payload = await apiClient.exportPersonalJournal();
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "personal-journal-export.json";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main><div className="shell">
      <nav className="page-nav" aria-label="Seitennavigation"><Link href="/">Zur Startseite</Link><Link href="/check-in">Morning Check-in</Link></nav>
      <header className="hero"><p className="date-label">Dein Archiv</p><h1 className="title">Personal Journal</h1></header>
      <section className="section" aria-label="Personal Journal">
        <div className="journal-heading"><h2>Daily Snapshots</h2><button className="journal-export" type="button" onClick={() => void downloadExport()} disabled={isExporting}>{isExporting ? "Journal Export wird vorbereitet..." : "Journal Export herunterladen"}</button></div>
        <PersonalJournal snapshots={snapshots} isLoading={isLoading} error={error} onStartCheckin={() => { window.location.href = "/check-in"; }} />
      </section>
    </div></main>
  );
}
