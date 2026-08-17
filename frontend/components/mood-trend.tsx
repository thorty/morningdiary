import React, { useLayoutEffect, useRef, useState } from "react";

import type { MorningCheckinResponse } from "@/lib/api/types";
import { emojiForMood, moodFor } from "@/lib/mood";

const WIDTH = 640;
const HEIGHT = 260;
const PADDING = { top: 20, right: 20, bottom: 48, left: 54 };
const TICK_GAP = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

type MoodSnapshot = MorningCheckinResponse & { mood: number; date: Date };

function calendarDate(date: string): Date | null {
  const [year, month, day] = date.split("-").map(Number);
  if (![year, month, day].every(Number.isFinite)) return null;

  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day ? parsed : null;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("de-DE", options).format(date);
}

function datesBetween(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(new Date(date));
  }
  return dates;
}

function labelFits(ticks: Date[], step: number, xFor: (date: Date) => number, measure: (label: string) => number): boolean {
  const labels = ticks.filter((_, index) => index % step === 0 || index === ticks.length - 1);
  return labels.every((date, index) => {
    if (index === 0) return true;
    const previous = labels[index - 1];
    const previousLabel = formatDate(previous, { day: "numeric", month: "short" });
    const label = formatDate(date, { day: "numeric", month: "short" });
    const availableWidth = xFor(date) - xFor(previous);
    return availableWidth >= (measure(previousLabel) + measure(label)) / 2 + TICK_GAP;
  });
}

export function MoodTrend({ snapshots }: { snapshots: MorningCheckinResponse[] }) {
  const today = new Date();
  const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const firstVisibleDate = new Date(todayAtMidnight);
  firstVisibleDate.setDate(firstVisibleDate.getDate() - 13);
  const moods = snapshots
    .map((snapshot): MoodSnapshot | null => {
      const mood = moodFor(snapshot);
      const date = calendarDate(snapshot.browser_date);
      return mood === null || date === null ? null : { ...snapshot, mood, date };
    })
    .filter((snapshot): snapshot is MoodSnapshot => snapshot !== null && snapshot.date >= firstVisibleDate && snapshot.date <= todayAtMidnight)
    .sort((first, second) => first.date.getTime() - second.date.getTime());

  if (moods.length < 2) return null;

  return <MoodTrendChart moods={moods} />;
}

function MoodTrendChart({ moods }: { moods: MoodSnapshot[] }) {
  const chartLeft = PADDING.left;
  const chartRight = WIDTH - PADDING.right;
  const chartTop = PADDING.top;
  const chartBottom = HEIGHT - PADDING.bottom;
  const firstDate = moods[0].date;
  const lastDate = moods[moods.length - 1].date;
  const dateRange = Math.max(lastDate.getTime() - firstDate.getTime(), DAY_MS);
  const xFor = (date: Date) => chartLeft + ((date.getTime() - firstDate.getTime()) / dateRange) * (chartRight - chartLeft);
  const yFor = (mood: number) => chartTop + ((5 - mood) / 4) * (chartBottom - chartTop);
  const points = moods.map((snapshot) => ({ ...snapshot, x: xFor(snapshot.date), y: yFor(snapshot.mood) }));
  const line = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const description = moods.map((snapshot) => `${snapshot.mood} von 5 am ${formatDate(snapshot.date, { day: "numeric", month: "long", year: "numeric" })}`).join("; ");
  const axisDates = datesBetween(firstDate, lastDate);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tickStep, setTickStep] = useState<number | null>(null);

  useLayoutEffect(() => {
    const labels = [...(svgRef.current?.querySelectorAll<SVGTextElement>("[data-mood-date-measure]") ?? [])];
    const measure = (label: string) => labels.find((element) => element.textContent === label)?.getComputedTextLength?.() ?? label.length * 7;
    const nextStep = Array.from({ length: axisDates.length }, (_, index) => index + 1).find((step) => labelFits(axisDates, step, xFor, measure)) ?? axisDates.length;
    setTickStep(nextStep);
  }, [axisDates.length, firstDate.getTime(), lastDate.getTime()]);

  const visibleAxisDates = tickStep === null ? [] : axisDates.filter((_, index) => index % tickStep === 0 || index === axisDates.length - 1);

  return (
    <section className="mood-history" aria-labelledby="mood-history-title">
      <div>
        <p className="snapshot-kicker">Die letzten Einträge</p>
        <h3 id="mood-history-title">Dein Stimmungsverlauf</h3>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Stimmungsverlauf: ${description}`}>
        <g className="mood-trend-y-axis" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((mood) => <text key={mood} x={chartLeft - 12} y={yFor(mood)} textAnchor="end" dominantBaseline="middle">{emojiForMood(mood)}</text>)}
        </g>
        <g className="mood-trend-grid" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((mood) => <line key={mood} x1={chartLeft} x2={chartRight} y1={yFor(mood)} y2={yFor(mood)} />)}
        </g>
        {tickStep === null ? (
          <g visibility="hidden" aria-hidden="true">
            {axisDates.map((date) => <text data-mood-date-measure key={dateKey(date)}>{formatDate(date, { day: "numeric", month: "short" })}</text>)}
          </g>
        ) : null}
        <polyline points={line} fill="none" stroke="var(--primary)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {points.map(({ id, x, y }) => <circle data-testid="mood-trend-point" key={id} cx={x} cy={y} fill="var(--surface)" r="4" stroke="var(--primary)" strokeWidth="3" />)}
        <g className="mood-trend-x-axis" aria-hidden="true">
          {visibleAxisDates.map((date) => <text key={dateKey(date)} x={xFor(date)} y={HEIGHT - 14} textAnchor="middle">{formatDate(date, { day: "numeric", month: "short" })}</text>)}
        </g>
      </svg>
    </section>
  );
}
