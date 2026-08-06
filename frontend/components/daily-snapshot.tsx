import React from "react";

import type {
  MorningCheckinAnswer,
  MorningCheckinResponse,
} from "@/lib/api/types";

const RESPONSE_LABELS = [
  "Stimmung am Morgen",
  "Wofür du dankbar bist",
  "Was du loslassen möchtest",
  "Was dir Energie gibt",
  "Was diesen Tag gut macht",
  "Deine freundliche Absicht",
];

export const MOOD_LABELS: Record<number, string> = {
  1: "Sehr schwer",
  2: "Schwer",
  3: "Ausgeglichen",
  4: "Gut",
  5: "Sehr gut",
};

function responseText(answer: MorningCheckinAnswer, index: number): string {
  if (answer === null || answer === undefined || answer === "") {
    return "Keine Antwort";
  }

  if (index === 0 && typeof answer === "number") {
    return `${answer} von 5 - ${MOOD_LABELS[answer] ?? "Nicht angegeben"}`;
  }

  return String(answer);
}

export function DailySnapshot({
  snapshot,
}: {
  snapshot: MorningCheckinResponse;
}) {
  return (
    <article
      className="daily-snapshot"
      aria-label={`Daily Snapshot vom ${snapshot.browser_date}`}
    >
      <header className="daily-snapshot-header">
        <p className="snapshot-kicker">Daily Snapshot</p>
        <h3>
          {new Intl.DateTimeFormat("de-DE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(new Date(`${snapshot.browser_date}T12:00:00`))}
        </h3>
        {snapshot.answers[0] !== null && snapshot.answers[0] !== undefined ? (
          <p className="snapshot-mood">
            Stimmung: {responseText(snapshot.answers[0], 0)}
          </p>
        ) : (
          <p className="snapshot-mood">Stimmung: Nicht angegeben</p>
        )}
      </header>

      <section
        className="snapshot-summary"
        aria-labelledby={`coach-summary-${snapshot.id}`}
      >
        <p id={`coach-summary-${snapshot.id}`} className="snapshot-kicker">
          Dein Coach
        </p>
        {snapshot.coach_summary ? (
          <p>{snapshot.coach_summary}</p>
        ) : (
          <p>
            Für heute gibt es keine Zusammenfassung. Dein Daily Snapshot bleibt
            vollständig.
          </p>
        )}
      </section>

      <section
        className="snapshot-responses"
        aria-labelledby={`responses-${snapshot.id}`}
      >
        <p id={`responses-${snapshot.id}`} className="snapshot-kicker">
          Deine Antworten
        </p>
        <ol>
          {RESPONSE_LABELS.map((label, index) => (
            <li key={label}>
              <span>{label}</span>
              <p>{responseText(snapshot.answers[index] ?? null, index)}</p>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
