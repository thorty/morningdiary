import { render, screen } from "@testing-library/react";
import React from "react";

import { MoodTrend } from "@/components/mood-trend";
import type { MorningCheckinResponse } from "@/lib/api/types";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-17T12:00:00"));
});

afterEach(() => {
  vi.useRealTimers();
});

function snapshot(day: string, mood: number | null): MorningCheckinResponse {
  return {
    id: `snapshot-${day}`,
    browser_date: `2026-08-${day}`,
    status: "completed",
    answers: [mood, null, null, null, null, null],
    next_question_number: null,
    coach_summary: null,
  };
}

test("shows no trend until two snapshots have a valid mood", () => {
  const { rerender } = render(<MoodTrend snapshots={[snapshot("01", 4)]} />);

  expect(screen.queryByRole("img", { name: /Stimmungsverlauf/ })).not.toBeInTheDocument();

  rerender(<MoodTrend snapshots={[snapshot("01", 4), snapshot("02", null)]} />);

  expect(screen.queryByRole("img", { name: /Stimmungsverlauf/ })).not.toBeInTheDocument();
});

test("shows all five Mood Scale emojis on the y-axis", () => {
  render(<MoodTrend snapshots={[snapshot("10", 1), snapshot("11", 5)]} />);

  expect(screen.getByText("😞")).toBeInTheDocument();
  expect(screen.getByText("😐")).toBeInTheDocument();
  expect(screen.getByText("🙂")).toBeInTheDocument();
  expect(screen.getByText("😊")).toBeInTheDocument();
  expect(screen.getByText("😄")).toBeInTheDocument();
});

test("excludes snapshots older than the 14-day calendar window", () => {
  render(<MoodTrend snapshots={[snapshot("01", 1), snapshot("10", 2), snapshot("16", 4), snapshot("17", 5)]} />);

  expect(screen.getByRole("img", { name: /Stimmungsverlauf/ })).toBeInTheDocument();
  expect(screen.getAllByTestId("mood-trend-point")).toHaveLength(3);
  expect(screen.queryByText("1. Aug.")).not.toBeInTheDocument();
});

test("renders nothing when only one valid mood remains in the window", () => {
  render(<MoodTrend snapshots={[snapshot("01", 1), snapshot("17", 4)]} />);

  expect(screen.queryByRole("img", { name: /Stimmungsverlauf/ })).not.toBeInTheDocument();
});

test("plots multiple valid moods in chronological order with an accessible description", () => {
  const snapshots = [
    snapshot("17", 2),
    snapshot("10", 1),
    snapshot("12", 5),
    snapshot("13", null),
  ].reverse();

  render(<MoodTrend snapshots={snapshots} />);

  const chart = screen.getByRole("img", { name: /Stimmungsverlauf/ });
  expect(chart).toHaveAccessibleName(
    "Stimmungsverlauf: 1 von 5 am 10. August 2026; 5 von 5 am 12. August 2026; 2 von 5 am 17. August 2026",
  );
  expect(screen.getAllByTestId("mood-trend-point")).toHaveLength(3);
  expect(screen.getByText("10. Aug.")).toBeInTheDocument();
  expect(screen.getByText("17. Aug.")).toBeInTheDocument();
});
