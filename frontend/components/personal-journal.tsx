import React from "react";
import Link from "next/link";

import { MOOD_LABELS } from "@/components/daily-snapshot";
import type { MorningCheckinResponse } from "@/lib/api/types";
import { moodFor } from "@/lib/mood";

function formatDate(browserDate: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${browserDate}T12:00:00`));
}

function previewFor(snapshot: MorningCheckinResponse): string {
  if (snapshot.coach_summary) {
    return snapshot.coach_summary;
  }

  const response = snapshot.answers.slice(1).find(
    (answer) => typeof answer === "string" && answer.trim().length > 0,
  );
  return typeof response === "string" ? response : "Keine Notiz fuer diesen Tag.";
}

export function PersonalJournal({
  snapshots,
  isLoading,
  error,
  onStartCheckin,
  startCheckinHref,
}: {
  snapshots: MorningCheckinResponse[];
  isLoading: boolean;
  error: string | null;
  onStartCheckin?: () => void;
  startCheckinHref?: string;
}) {
  const sortedSnapshots = [...snapshots].sort((first, second) =>
    second.browser_date.localeCompare(first.browser_date),
  );

  return (
    <>
      {isLoading ? <p className="status">Journal wird geladen...</p> : null}
      {error ? <p className="status" role="alert">{error}</p> : null}
      {!isLoading && !error && snapshots.length === 0 ? (
        <div className="journal-empty-state">
          <p>Noch keine Daily Snapshots vorhanden.</p>
          {startCheckinHref ? (
            <Link href={startCheckinHref}>Morning Check-in starten</Link>
          ) : onStartCheckin ? (
            <button type="button" onClick={onStartCheckin}>
              Morning Check-in starten
            </button>
          ) : null}
        </div>
      ) : null}
      {snapshots.length > 0 ? (
        <ol className="journal-entry-list" aria-label="Daily Snapshots">
          {sortedSnapshots.map((snapshot) => {
            const mood = moodFor(snapshot);
            return (
              <li key={snapshot.id}>
                <Link href={`/journal/${snapshot.id}`} className="snapshot-link">
                  <article aria-label={`Daily Snapshot vom ${snapshot.browser_date}`}>
                    <p>{formatDate(snapshot.browser_date)}</p>
                    <div>
                      <span className="journal-mood">
                        {mood === null
                          ? "Stimmung nicht angegeben"
                          : `Stimmung ${mood} von 5 - ${MOOD_LABELS[mood]}`}
                      </span>
                      <p>{previewFor(snapshot)}</p>
                    </div>
                  </article>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : null}
    </>
  );
}
