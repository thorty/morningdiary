"use client";

import { useEffect, useState } from "react";
import React from "react";

import { MorningCheckin } from "@/components/morning-checkin";
import { PersonalJournal } from "@/components/personal-journal";
import {
  createHttpPersonalJournalApiClient,
  type PersonalJournalApiClient,
} from "@/lib/api/client";
import type { MorningCheckinResponse } from "@/lib/api/types";

type HomeScreenProps = {
  apiClient?: PersonalJournalApiClient;
  todayDateProvider?: () => Date;
  breathingDurationSeconds?: number;
};

const defaultClient = createHttpPersonalJournalApiClient();

function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 11) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

export function HomeScreen({
  apiClient = defaultClient,
  todayDateProvider = () => new Date(),
  breathingDurationSeconds,
}: HomeScreenProps) {
  const [serviceStatus, setServiceStatus] = useState(
    "Verbinde mit dem Journal-Service...",
  );
  const [journalSnapshots, setJournalSnapshots] = useState<
    MorningCheckinResponse[]
  >([]);
  const [journalLoadError, setJournalLoadError] = useState<string | null>(null);
  const [isJournalLoading, setIsJournalLoading] = useState(true);
  const [journalExportError, setJournalExportError] = useState<string | null>(
    null,
  );
  const [isExporting, setIsExporting] = useState(false);
  const [startCheckinRequest, setStartCheckinRequest] = useState(0);

  useEffect(() => {
    let isMounted = true;
    void apiClient.getHealth().then(
      () => isMounted && setServiceStatus("Journal-Service bereit."),
      () =>
        isMounted &&
        setServiceStatus("Journal-Service momentan nicht erreichbar."),
    );
    return () => {
      isMounted = false;
    };
  }, [apiClient]);

  useEffect(() => {
    let isMounted = true;
    void apiClient
      .listPersonalJournalSnapshots()
      .then(
        (snapshots) => {
          if (!isMounted) return;
          setJournalSnapshots((currentSnapshots) => {
            const missingSnapshots = currentSnapshots.filter(
              (current) => !snapshots.some(({ id }) => id === current.id),
            );
            return [...missingSnapshots, ...snapshots];
          });
          setJournalLoadError(null);
        },
        () =>
          isMounted &&
          setJournalLoadError(
            "Die Personal Journal Eintraege konnten nicht geladen werden.",
          ),
      )
      .finally(() => isMounted && setIsJournalLoading(false));
    return () => {
      isMounted = false;
    };
  }, [apiClient]);

  async function downloadJournalExport(): Promise<void> {
    setIsExporting(true);
    setJournalExportError(null);
    try {
      const exportPayload = await apiClient.exportPersonalJournal();
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "personal-journal-export.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setJournalExportError(
        "Der Journal Export konnte nicht heruntergeladen werden.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  function addCompletedSnapshot(snapshot: MorningCheckinResponse): void {
    setJournalSnapshots((snapshots) => {
      const existingIndex = snapshots.findIndex(({ id }) => id === snapshot.id);
      return existingIndex === -1
        ? [snapshot, ...snapshots]
        : snapshots.map((existing) =>
            existing.id === snapshot.id ? snapshot : existing,
          );
    });
  }

  const today = todayDateProvider();
  const formattedDate = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(today);

  return (
    <main>
      <div className="shell">
        <header className="hero">
          <p className="date-label">{formattedDate}</p>
          <h1 className="title">
            {greetingFor(today)}.<span>Nimm dir fuenf Minuten.</span>
          </h1>
          <p className="lead">
            Erst 30 Sekunden atmen, dann sechs ruhige Fragen. Am Ende steht dein
            Daily Snapshot mit Stimmung, Fokus und einer optionalen Coach
            Summary.
          </p>
        </header>
        <MorningCheckin
          apiClient={apiClient}
          todayDateProvider={todayDateProvider}
          breathingDurationSeconds={breathingDurationSeconds}
          onSnapshotCompleted={addCompletedSnapshot}
          startCheckinRequest={startCheckinRequest}
        />
        <section className="section" aria-label="Personal Journal">
          <div className="journal-heading">
            <div>
              <p className="date-label">Dein Archiv</p>
              <h2>Personal Journal</h2>
            </div>
            <button
              className="journal-export"
              type="button"
              onClick={() => void downloadJournalExport()}
              disabled={isExporting}
            >
              {isExporting
                ? "Journal Export wird vorbereitet..."
                : "Journal Export herunterladen"}
            </button>
          </div>
          <PersonalJournal
            snapshots={journalSnapshots}
            isLoading={isJournalLoading}
            error={journalLoadError}
            onStartCheckin={() =>
              setStartCheckinRequest((request) => request + 1)
            }
          />
          {journalExportError ? (
            <p className="status" role="alert">
              {journalExportError}
            </p>
          ) : null}
        </section>
        <p className="status" role="status">
          {serviceStatus}
        </p>
        <p className="privacy-note">
          Fuer die optionale Coach Summary werden nur Antworten aus dem
          aktuellen Morning Check-in an OpenAI gesendet. Dein API-Key bleibt
          ausschliesslich im Backend.
        </p>
      </div>
    </main>
  );
}
