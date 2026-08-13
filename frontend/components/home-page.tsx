"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { DailySnapshot } from "@/components/daily-snapshot";
import { PersonalJournal } from "@/components/personal-journal";
import { MoodTrend } from "@/components/mood-trend";
import { ThemePicker } from "@/components/theme-picker";
import { ConfigurationMenu } from "@/components/configuration-menu";
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

const defaultTodayDateProvider = () => new Date();

export function HomePage({ apiClient = defaultPersonalJournalApiClient, todayDateProvider = defaultTodayDateProvider }: { apiClient?: PersonalJournalApiClient; todayDateProvider?: () => Date }) {
  const [today, setToday] = useState<Date | null>(null);
  const [checkin, setCheckin] = useState<MorningCheckinResponse | null>(null);
  const [snapshots, setSnapshots] = useState<MorningCheckinResponse[]>([]);
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const [journalError, setJournalError] = useState<string | null>(null);
  const [isJournalLoading, setIsJournalLoading] = useState(true);

  useEffect(() => {
    setToday(todayDateProvider());
  }, [todayDateProvider]);

  useEffect(() => {
    if (!today) return;
    const todayKey = browserDate(today);
    void apiClient.getOrCreateMorningCheckin(todayKey).then(
      setCheckin,
      () => setCheckinError("Der heutige Status konnte nicht geladen werden."),
    );
  }, [apiClient, today]);

  useEffect(() => {
    if (!today) return;
    void apiClient.listPersonalJournalSnapshots().then(
      setSnapshots,
      () => setJournalError("Die Personal Journal Einträge konnten nicht geladen werden."),
    ).finally(() => setIsJournalLoading(false));
  }, [apiClient, today]);

  const dateLabel = today ? new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long" }).format(today) : "";
  const action = checkin?.next_question_number && checkin.next_question_number > 1 ? "Morning Check-in fortsetzen" : "Check-in starten";

  async function retryCoachSummary(snapshot: MorningCheckinResponse) {
    setCheckin(await apiClient.completeMorningCheckin(snapshot.id));
  }

  function handleJournalDeleted() {
    setCheckin(null);
    setSnapshots([]);
  }

  return <main><div className="shell">
    <nav className="page-nav" aria-label="Seitennavigation"><div className="page-nav-links"><Link href="/check-in">Check-in</Link><Link href="/journal">Personal Journal</Link></div><div className="page-nav-settings"><ThemePicker automaticTheme={resolveAutomaticTheme(snapshots)} /><ConfigurationMenu apiClient={apiClient} onJournalDeleted={handleJournalDeleted} /></div></nav>
    <header className="hero"><p className="date-label">{dateLabel}</p><h1 className="title">{today ? greetingFor(today) : "Guten Morgen"}.<span>Nimm dir fünf Minuten.</span></h1></header>
    {checkinError ? <p className="status" role="alert">{checkinError}</p> : checkin?.status === "completed" ? <section className="section"><p className="completion-status" role="status">Dein Check-in für heute ist abgeschlossen.</p><DailySnapshot snapshot={checkin} summaryState={checkin.coach_summary_status === "unavailable" ? "error" : "ready"} onRetry={checkin.coach_summary_retry_available ? () => void retryCoachSummary(checkin) : undefined} /></section> : <section className="section routine-card"><div className="routine-card-heading"><h2>Deine Routine für heute</h2><p>{checkin ? "Dein heutiger Morning Check-in ist bereit." : "Heutiger Status wird geladen..."}</p></div><Link className="primary-action" href="/check-in">{action}</Link><div className="routine-facts"><span>30 Sekunden atmen</span><span>6 Fragen</span><span>Daily Snapshot</span></div></section>}
    <section className="section" aria-label="Letzte Daily Snapshots"><MoodTrend snapshots={snapshots} /><div className="journal-heading"><h2>Letzte Daily Snapshots</h2><Link href="/journal">Alle ansehen</Link></div><PersonalJournal snapshots={snapshots.slice(0, 3)} isLoading={isJournalLoading} error={journalError} onStartCheckin={() => { window.location.href = "/check-in"; }} /></section>
  </div></main>;
}
