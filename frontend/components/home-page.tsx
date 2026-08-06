"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { DailySnapshot } from "@/components/daily-snapshot";
import { PersonalJournal } from "@/components/personal-journal";
import { ThemePicker } from "@/components/theme-picker";
import type { PersonalJournalApiClient } from "@/lib/api/client";
import { defaultPersonalJournalApiClient } from "@/lib/api/default-client";
import { resolveAutomaticTheme } from "@/lib/theme";
import type { MorningCheckinResponse } from "@/lib/api/types";

function browserDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function greetingFor(date: Date) {
  if (date.getHours() < 11) return "Guten Morgen";
  if (date.getHours() < 18) return "Guten Tag";
  return "Guten Abend";
}

export function HomePage({ apiClient = defaultPersonalJournalApiClient, todayDateProvider = () => new Date() }: { apiClient?: PersonalJournalApiClient; todayDateProvider?: () => Date }) {
  const today = todayDateProvider();
  const todayKey = browserDate(today);
  const [checkin, setCheckin] = useState<MorningCheckinResponse | null>(null);
  const [snapshots, setSnapshots] = useState<MorningCheckinResponse[]>([]);
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const [journalError, setJournalError] = useState<string | null>(null);
  const [isJournalLoading, setIsJournalLoading] = useState(true);

  useEffect(() => {
    void apiClient.getOrCreateMorningCheckin(todayKey).then(
      setCheckin,
      () => setCheckinError("Der heutige Status konnte nicht geladen werden."),
    );
  }, [apiClient, todayKey]);

  useEffect(() => {
    void apiClient.listPersonalJournalSnapshots().then(
      setSnapshots,
      () => setJournalError("Die Personal Journal Eintraege konnten nicht geladen werden."),
    ).finally(() => setIsJournalLoading(false));
  }, [apiClient, todayKey]);

  const dateLabel = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long" }).format(today);
  const action = checkin?.next_question_number && checkin.next_question_number > 1 ? "Morning Check-in fortsetzen" : "Morning Check-in starten";

  async function retryCoachSummary(snapshot: MorningCheckinResponse) {
    setCheckin(await apiClient.completeMorningCheckin(snapshot.id));
  }

  return <main><div className="shell">
    <nav className="page-nav" aria-label="Seitennavigation"><div className="page-nav-links"><Link href="/check-in">Morning Check-in</Link><Link href="/journal">Personal Journal</Link></div><ThemePicker automaticTheme={resolveAutomaticTheme(snapshots)} /></nav>
    <header className="hero"><p className="date-label">{dateLabel}</p><h1 className="title">{greetingFor(today)}.<span>Nimm dir fuenf Minuten.</span></h1><p className="lead">Erst 30 Sekunden atmen, dann sechs ruhige Fragen. Am Ende steht dein Daily Snapshot mit Stimmung, Fokus und einer optionalen Coach Summary.</p></header>
    {checkinError ? <p className="status" role="alert">{checkinError}</p> : checkin?.status === "completed" ? <section className="section"><p className="completion-status" role="status">Dein Morning Check-in fuer heute ist abgeschlossen.</p><DailySnapshot snapshot={checkin} summaryState={checkin.coach_summary_status === "unavailable" ? "error" : "ready"} onRetry={checkin.coach_summary_retry_available ? () => void retryCoachSummary(checkin) : undefined} /></section> : <section className="section routine-card"><div className="routine-card-heading"><h2>Deine Routine fuer heute</h2><p>{checkin ? "Dein heutiger Morning Check-in ist bereit." : "Heutiger Status wird geladen..."}</p></div><Link className="primary-action" href="/check-in">{action}<span aria-hidden="true">→</span></Link><div className="routine-facts"><span>30 Sekunden atmen</span><span>6 Fragen</span><span>Daily Snapshot</span></div></section>}
    <section className="section" aria-label="Letzte Daily Snapshots"><div className="journal-heading"><h2>Letzte Daily Snapshots</h2><Link href="/journal">Alle ansehen</Link></div><PersonalJournal snapshots={snapshots.slice(0, 3)} isLoading={isJournalLoading} error={journalError} onStartCheckin={() => { window.location.href = "/check-in"; }} /></section>
  </div></main>;
}
