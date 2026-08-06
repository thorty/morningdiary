import React from "react";

import { MOOD_LABELS } from "@/components/daily-snapshot";
import type { MorningCheckinResponse } from "@/lib/api/types";

function formatDate(browserDate: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${browserDate}T12:00:00`));
}

function moodFor(snapshot: MorningCheckinResponse): number | null {
  const mood = snapshot.answers[0];
  return typeof mood === "number" && mood >= 1 && mood <= 5 ? mood : null;
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
}: {
  snapshots: MorningCheckinResponse[];
  isLoading: boolean;
  error: string | null;
  onStartCheckin: () => void;
}) {
  const moodSnapshots = snapshots
    .filter((snapshot) => moodFor(snapshot) !== null)
    .slice(0, 10);

  return (
    <>
      {isLoading ? <p className="status">Journal wird geladen...</p> : null}
      {error ? <p className="status" role="alert">{error}</p> : null}
      {!isLoading && !error && snapshots.length === 0 ? (
        <div className="journal-empty-state">
          <p>Noch keine Daily Snapshots vorhanden.</p>
          <button type="button" onClick={onStartCheckin}>
            Morning Check-in starten
          </button>
        </div>
      ) : null}
      {moodSnapshots.length >= 2 ? (
        <section className="mood-history" aria-labelledby="mood-history-title">
          <div>
            <p className="snapshot-kicker">Die letzten Eintraege</p>
            <h3 id="mood-history-title">Dein Stimmungsverlauf</h3>
          </div>
          <ol aria-label="Stimmungswerte der letzten Tage">
            {moodSnapshots.map((snapshot) => {
              const mood = moodFor(snapshot);
              return (
                <li key={snapshot.id}>
                  <span>{formatDate(snapshot.browser_date)}</span>
                  <strong>{mood} / 5</strong>
                  <i style={{ height: `${(mood ?? 0) * 20}%` }} aria-hidden="true" />
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}
      {snapshots.length > 0 ? (
        <ol className="journal-entry-list" aria-label="Daily Snapshots">
          {snapshots.map((snapshot) => {
            const mood = moodFor(snapshot);
            return (
              <li key={snapshot.id}>
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
              </li>
            );
          })}
        </ol>
      ) : null}
    </>
  );
}
