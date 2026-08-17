"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { DailySnapshot } from "@/components/daily-snapshot";
import { ConfigurationMenu } from "@/components/configuration-menu";
import type { PersonalJournalApiClient } from "@/lib/api/client";
import { defaultPersonalJournalApiClient } from "@/lib/api/default-client";
import type { MorningCheckinResponse } from "@/lib/api/types";
import { PersonalJournalStoreError } from "@/lib/personal-journal-store";

export function DailySnapshotPage({ id, apiClient = defaultPersonalJournalApiClient }: { id: string; apiClient?: PersonalJournalApiClient }) {
  const [snapshot, setSnapshot] = useState<MorningCheckinResponse | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const loadSnapshot = apiClient.findPersonalJournalSnapshot
      ? apiClient.findPersonalJournalSnapshot(id)
      : apiClient.listPersonalJournalSnapshots().then((items) => items.find((item) => item.id === id) ?? null);
    void loadSnapshot.then(
      setSnapshot,
      (caughtError) => setError(caughtError instanceof PersonalJournalStoreError ? caughtError.message : "Der Daily Snapshot konnte nicht geladen werden."),
    );
  }, [apiClient, id]);
  return <main><div className="shell"><nav className="page-nav" aria-label="Seitennavigation"><div className="page-nav-links"><Link href="/">Zur Startseite</Link><Link href="/journal">Zum Personal Journal</Link><Link href="/check-in">Morning Check-in</Link></div><ConfigurationMenu apiClient={apiClient} onJournalDeleted={() => setSnapshot(null)} /></nav><section className="section">{snapshot ? <DailySnapshot snapshot={snapshot} summaryState={snapshot.coach_summary_status === "unavailable" ? "error" : "ready"} /> : error ? <p className="status" role="alert">{error}</p> : snapshot === null ? <div className="journal-empty-state"><h1>Daily Snapshot nicht gefunden</h1><p>Dieser Daily Snapshot ist nicht in deinem Personal Journal vorhanden.</p><Link href="/journal">Zum Personal Journal</Link></div> : <p className="status">Daily Snapshot wird geladen...</p>}</section></div></main>;
}
