"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { DailySnapshot } from "@/components/daily-snapshot";
import { PersonalJournal } from "@/components/personal-journal";
import { createHttpPersonalJournalApiClient, type PersonalJournalApiClient } from "@/lib/api/client";
import type { MorningCheckinResponse } from "@/lib/api/types";

const defaultClient = createHttpPersonalJournalApiClient();

function browserDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function HomePage({ apiClient = defaultClient, todayDateProvider = () => new Date() }: { apiClient?: PersonalJournalApiClient; todayDateProvider?: () => Date }) {
  const today = todayDateProvider();
  const todayKey = browserDate(today);
  const [checkin, setCheckin] = useState<MorningCheckinResponse | null>(null);
  const [snapshots, setSnapshots] = useState<MorningCheckinResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([apiClient.getOrCreateMorningCheckin(todayKey), apiClient.listPersonalJournalSnapshots()]).then(
      ([todayCheckin, journal]) => { setCheckin(todayCheckin); setSnapshots(journal); },
      () => setError("Der heutige Status konnte nicht geladen werden."),
    );
  }, [apiClient, todayKey]);

  const dateLabel = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long" }).format(today);
  const action = checkin?.status === "completed" ? "Daily Snapshot ansehen" : checkin?.next_question_number && checkin.next_question_number > 1 ? "Morning Check-in fortsetzen" : "Morning Check-in starten";

  return <main><div className="shell">
    <nav className="page-nav" aria-label="Seitennavigation"><Link href="/journal">Personal Journal</Link></nav>
    <header className="hero"><p className="date-label">{dateLabel}</p><h1 className="title">Guten Morgen.<span>Nimm dir fuenf Minuten.</span></h1></header>
    {error ? <p className="status" role="alert">{error}</p> : checkin?.status === "completed" ? <section className="section"><DailySnapshot snapshot={checkin} /></section> : <section className="section routine-card"><div className="routine-card-heading"><h2>Deine Routine fuer heute</h2><p>{checkin ? "Dein heutiger Morning Check-in ist bereit." : "Heutiger Status wird geladen..."}</p></div><Link className="primary-action" href="/check-in">{action}<span aria-hidden="true">→</span></Link></section>}
    <section className="section" aria-label="Letzte Daily Snapshots"><div className="journal-heading"><h2>Letzte Daily Snapshots</h2><Link href="/journal">Alle ansehen</Link></div><PersonalJournal snapshots={snapshots.slice(0, 3)} isLoading={!checkin && !error} error={null} onStartCheckin={() => { window.location.href = "/check-in"; }} /></section>
  </div></main>;
}
