"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { DailySnapshot } from "@/components/daily-snapshot";
import type { PersonalJournalApiClient } from "@/lib/api/client";
import { defaultPersonalJournalApiClient } from "@/lib/api/default-client";
import type { MorningCheckinResponse } from "@/lib/api/types";

export function DailySnapshotPage({ id, apiClient = defaultPersonalJournalApiClient }: { id: string; apiClient?: PersonalJournalApiClient }) {
  const [snapshot, setSnapshot] = useState<MorningCheckinResponse | null | undefined>(undefined);
  const [error, setError] = useState(false);
  useEffect(() => { void apiClient.listPersonalJournalSnapshots().then((items) => setSnapshot(items.find((item) => item.id === id) ?? null), () => setError(true)); }, [apiClient, id]);
  return <main><div className="shell"><nav className="page-nav" aria-label="Seitennavigation"><Link href="/">Zur Startseite</Link><Link href="/journal">Zum Personal Journal</Link><Link href="/check-in">Morning Check-in</Link></nav><section className="section">{snapshot ? <DailySnapshot snapshot={snapshot} /> : error ? <p className="status" role="alert">Der Daily Snapshot konnte nicht geladen werden.</p> : snapshot === null ? <div className="journal-empty-state"><h1>Daily Snapshot nicht gefunden</h1><p>Dieser Daily Snapshot ist nicht in deinem Personal Journal vorhanden.</p><Link href="/journal">Zum Personal Journal</Link></div> : <p className="status">Daily Snapshot wird geladen...</p>}</section></div></main>;
}
