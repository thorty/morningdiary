"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { DailySnapshot } from "@/components/daily-snapshot";
import { createHttpPersonalJournalApiClient, type PersonalJournalApiClient } from "@/lib/api/client";
import type { MorningCheckinResponse } from "@/lib/api/types";

const defaultClient = createHttpPersonalJournalApiClient();

export function DailySnapshotPage({ id, apiClient = defaultClient }: { id: string; apiClient?: PersonalJournalApiClient }) {
  const [snapshot, setSnapshot] = useState<MorningCheckinResponse | null | undefined>(undefined);
  useEffect(() => { void apiClient.listPersonalJournalSnapshots().then((items) => setSnapshot(items.find((item) => item.id === id) ?? null), () => setSnapshot(null)); }, [apiClient, id]);
  return <main><div className="shell"><nav className="page-nav" aria-label="Seitennavigation"><Link href="/journal">Zum Personal Journal</Link><Link href="/check-in">Morning Check-in</Link></nav><section className="section">{snapshot ? <DailySnapshot snapshot={snapshot} /> : snapshot === null ? <div className="journal-empty-state"><h1>Daily Snapshot nicht gefunden</h1><p>Dieser Daily Snapshot ist nicht in deinem Personal Journal vorhanden.</p><Link href="/journal">Zum Personal Journal</Link></div> : <p className="status">Daily Snapshot wird geladen...</p>}</section></div></main>;
}
