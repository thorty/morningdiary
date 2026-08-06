import React from "react";

import type { MorningCheckinResponse } from "@/lib/api/types";
import { moodFor } from "@/lib/mood";

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = { top: 20, right: 20, bottom: 40, left: 20 };

function formatDate(date: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("de-DE", options).format(new Date(`${date}T12:00:00`));
}

export function MoodTrend({ snapshots }: { snapshots: MorningCheckinResponse[] }) {
  const moods = snapshots
    .filter((snapshot): snapshot is MorningCheckinResponse & { answers: [number, ...MorningCheckinResponse["answers"]] } => moodFor(snapshot) !== null)
    .sort((first, second) => first.browser_date.localeCompare(second.browser_date))
    .slice(-10);

  if (moods.length < 2) return null;

  const chartWidth = WIDTH - PADDING.left - PADDING.right;
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const points = moods.map((snapshot, index) => {
    const x = PADDING.left + (index * chartWidth) / (moods.length - 1);
    const y = PADDING.top + ((5 - moodFor(snapshot)!) * chartHeight) / 4;
    return { x, y };
  });
  const line = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const area = `${PADDING.left},${HEIGHT - PADDING.bottom} ${line} ${WIDTH - PADDING.right},${HEIGHT - PADDING.bottom}`;
  const description = moods.map((snapshot) => `${moodFor(snapshot)} von 5 am ${formatDate(snapshot.browser_date, { day: "numeric", month: "long", year: "numeric" })}`).join("; ");

  return (
    <section className="mood-history" aria-labelledby="mood-history-title">
      <div>
        <p className="snapshot-kicker">Die letzten Eintraege</p>
        <h3 id="mood-history-title">Dein Stimmungsverlauf</h3>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Stimmungsverlauf: ${description}`}>
        <defs>
          <linearGradient id="mood-trend-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#mood-trend-area)" />
        <polyline points={line} fill="none" stroke="var(--primary)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {points.map(({ x, y }, index) => <circle key={moods[index].id} cx={x} cy={y} fill="var(--surface)" r="4" stroke="var(--primary)" strokeWidth="3" />)}
      </svg>
      <div className="mood-trend-dates" aria-hidden="true">
        <span>{formatDate(moods[0].browser_date, { day: "numeric", month: "short" })}</span>
        <span>{formatDate(moods[moods.length - 1].browser_date, { day: "numeric", month: "short" })}</span>
      </div>
    </section>
  );
}
