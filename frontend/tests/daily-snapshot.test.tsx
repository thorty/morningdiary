import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { DailySnapshot } from "@/components/daily-snapshot";

const snapshot = {
  id: "snapshot-1",
  browser_date: "2026-08-04",
  status: "completed" as const,
  answers: [4, "Meine Familie", "Den Druck", "Ein Spaziergang", "Zeit ohne Termine", "Geduldig bleiben"],
  next_question_number: null,
  coach_summary: "Du findest heute einen ruhigen, klaren Fokus.",
};

test("renders a complete Daily Snapshot in its card hierarchy", () => {
  render(<DailySnapshot snapshot={snapshot} />);

  expect(screen.getByRole("article", { name: "Daily Snapshot vom 2026-08-04" })).toBeInTheDocument();
  expect(screen.getByText("Dienstag, 4. August 2026")).toBeInTheDocument();
  expect(screen.getByText("Stimmung: 4 von 5 - Gut")).toBeInTheDocument();
  expect(screen.getByText(snapshot.coach_summary)).toBeInTheDocument();
  expect(screen.getByRole("list", { name: "Deine Antworten" }).children).toHaveLength(6);
});

test("shows missing answers without dropping response rows", () => {
  render(<DailySnapshot snapshot={{ ...snapshot, answers: [null, "Eine Antwort", null, null, null, null] }} />);

  expect(screen.getByText("Stimmung: Nicht angegeben")).toBeInTheDocument();
  expect(screen.getAllByText("Keine Antwort")).toHaveLength(5);
  expect(screen.getByRole("list", { name: "Deine Antworten" }).children).toHaveLength(6);
});

test("keeps a long unbroken response inside its row", () => {
  const longAnswer = "Donaudampfschifffahrtsgesellschaftskapitän".repeat(12);
  render(<DailySnapshot snapshot={{ ...snapshot, answers: [4, longAnswer, null, null, null, null] }} />);

  expect(screen.getByText(longAnswer)).toHaveClass("snapshot-response-text");
});

test("shows that a blank snapshot is complete without a coach summary", () => {
  render(<DailySnapshot snapshot={{ ...snapshot, answers: [null, null, null, null, null, null], coach_summary: null }} />);

  expect(screen.getByText("Für heute gibt es keine Zusammenfassung. Dein Daily Snapshot bleibt vollständig.")).toBeInTheDocument();
  expect(screen.getAllByText("Keine Antwort")).toHaveLength(6);
});

test("shows a retryable coach-summary error without making the snapshot incomplete", () => {
  const onRetry = vi.fn();

  render(<DailySnapshot snapshot={{ ...snapshot, coach_summary: null }} summaryState="error" onRetry={onRetry} />);

  expect(screen.getByText("Die Coach Summary konnte gerade nicht erstellt werden. Dein Daily Snapshot bleibt vollständig gespeichert.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Coach Summary erneut versuchen" }));
  expect(onRetry).toHaveBeenCalledOnce();
});

test("shows that the coach summary is still being prepared", () => {
  render(<DailySnapshot snapshot={{ ...snapshot, coach_summary: null }} summaryState="loading" />);

  expect(screen.getByRole("status")).toHaveTextContent("Die Coach Summary wird erstellt. Dein Daily Snapshot ist bereits vollständig gespeichert.");
});
