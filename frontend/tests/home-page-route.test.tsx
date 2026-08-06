import { render, screen } from "@testing-library/react";
import React from "react";

import type { MorningCheckinResponse } from "@/lib/api/types";

const client = vi.hoisted(() => ({
  getHealth: vi.fn(async () => ({ status: "ok" as const })),
  getOrCreateMorningCheckin: vi.fn(async (): Promise<MorningCheckinResponse> => ({
    id: "today",
    browser_date: "2026-08-04",
    status: "unfinished" as const,
    answers: [null, null, null, null, null, null],
    next_question_number: 1,
    coach_summary: null,
  })),
  saveMorningCheckinAnswer: vi.fn(async (): Promise<MorningCheckinResponse> => ({
    id: "today",
    browser_date: "2026-08-04",
    status: "unfinished" as const,
    answers: [null, null, null, null, null, null],
    next_question_number: 1,
    coach_summary: null,
  })),
  restartMorningCheckin: vi.fn(async (): Promise<MorningCheckinResponse> => ({
    id: "today",
    browser_date: "2026-08-04",
    status: "unfinished" as const,
    answers: [null, null, null, null, null, null],
    next_question_number: 1,
    coach_summary: null,
  })),
  completeMorningCheckin: vi.fn(async (): Promise<MorningCheckinResponse> => ({
    id: "today",
    browser_date: "2026-08-04",
    status: "completed" as const,
    answers: [null, null, null, null, null, null],
    next_question_number: null,
    coach_summary: null,
  })),
  listPersonalJournalSnapshots: vi.fn(async (): Promise<MorningCheckinResponse[]> => []),
  exportPersonalJournal: vi.fn(async () => ({ snapshots: [] })),
}));

vi.mock("@/lib/api/default-client", () => ({
  defaultPersonalJournalApiClient: client,
}));

import Page from "@/app/page";

beforeEach(() => {
  client.getOrCreateMorningCheckin.mockResolvedValue({
    id: "today",
    browser_date: "2026-08-04",
    status: "unfinished",
    answers: [null, null, null, null, null, null],
    next_question_number: 1,
    coach_summary: null,
  });
  client.listPersonalJournalSnapshots.mockResolvedValue([]);
});

test("the home route presents the daytime greeting, introduction, and routine", async () => {
  render(<Page />);

  expect(
    screen.getByRole("heading", {
      name: /Guten (Morgen|Tag|Abend)\. Nimm dir fuenf Minuten\./,
      level: 1,
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Erst 30 Sekunden atmen, dann sechs ruhige Fragen/i),
  ).toBeInTheDocument();
  expect(
    await screen.findByRole("heading", {
      name: "Deine Routine fuer heute",
      level: 2,
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Morning Check-in starten" }),
  ).toHaveAttribute("href", "/check-in");
  expect(await screen.findByText("Noch keine Daily Snapshots vorhanden.")).toBeInTheDocument();
});

test("the home route resumes an unfinished Morning Check-in and limits the preview to three snapshots", async () => {
  client.getOrCreateMorningCheckin.mockResolvedValue({
    id: "today",
    browser_date: "2026-08-04",
    status: "unfinished",
    answers: [3, "Schon notiert", null, null, null, null],
    next_question_number: 3,
    coach_summary: null,
  });
  client.listPersonalJournalSnapshots.mockResolvedValue(
    ["04", "03", "02", "01"].map((day) => ({
      id: `snapshot-${day}`,
      browser_date: `2026-08-${day}`,
      status: "completed" as const,
      answers: [4, `Notiz ${day}`, null, null, null, null],
      next_question_number: null,
      coach_summary: null,
    })),
  );

  render(<Page />);

  expect(
    await screen.findByRole("link", { name: "Morning Check-in fortsetzen" }),
  ).toHaveAttribute("href", "/check-in");
  expect(screen.getAllByRole("article")).toHaveLength(3);
  expect(screen.getByRole("link", { name: "Alle ansehen" })).toHaveAttribute(
    "href",
    "/journal",
  );
});

test("the home route marks today's completed Morning Check-in without hiding journal failures", async () => {
  client.getOrCreateMorningCheckin.mockResolvedValue({
    id: "today",
    browser_date: "2026-08-04",
    status: "completed",
    answers: [4, "Dankbar", null, null, null, null],
    next_question_number: null,
    coach_summary: null,
  });
  client.listPersonalJournalSnapshots.mockRejectedValue(new Error("unavailable"));

  render(<Page />);

  expect(
    await screen.findByRole("status", {
      name: "",
    }),
  ).toHaveTextContent("Dein Morning Check-in fuer heute ist abgeschlossen.");
  expect(
    screen.getByRole("article", { name: "Daily Snapshot vom 2026-08-04" }),
  ).toBeInTheDocument();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Die Personal Journal Eintraege konnten nicht geladen werden.",
  );
});

test("the home route keeps the journal preview available when today's status cannot load", async () => {
  client.getOrCreateMorningCheckin.mockRejectedValue(new Error("unavailable"));
  client.listPersonalJournalSnapshots.mockResolvedValue([
    {
      id: "snapshot-1",
      browser_date: "2026-08-03",
      status: "completed",
      answers: [4, "Dankbar", null, null, null, null],
      next_question_number: null,
      coach_summary: null,
    },
  ]);

  render(<Page />);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Der heutige Status konnte nicht geladen werden.",
  );
  expect(
    screen.getByRole("article", { name: "Daily Snapshot vom 2026-08-03" }),
  ).toBeInTheDocument();
});

test("the home route distinguishes a loading journal preview from an empty one", async () => {
  let resolveSnapshots: (snapshots: MorningCheckinResponse[]) => void;
  client.listPersonalJournalSnapshots.mockImplementation(
    () => new Promise((resolve) => { resolveSnapshots = resolve; }),
  );

  render(<Page />);

  expect(screen.getByText("Journal wird geladen...")).toBeInTheDocument();
  expect(screen.queryByText("Noch keine Daily Snapshots vorhanden.")).not.toBeInTheDocument();

  resolveSnapshots!([]);

  expect(await screen.findByText("Noch keine Daily Snapshots vorhanden.")).toBeInTheDocument();
});
