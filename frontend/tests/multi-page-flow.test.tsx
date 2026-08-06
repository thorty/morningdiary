import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { DailySnapshotPage } from "@/components/daily-snapshot-page";
import { HomePage } from "@/components/home-page";
import { MorningCheckinPage } from "@/components/morning-checkin-page";
import { PersonalJournalPage } from "@/components/personal-journal-page";
import type { PersonalJournalApiClient } from "@/lib/api/client";

function makeMockClient(
  overrides: Partial<PersonalJournalApiClient> = {},
): PersonalJournalApiClient {
  return {
    getHealth: async () => ({ status: "ok" }),
    getOrCreateMorningCheckin: async () => ({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [null, null, null, null, null, null],
      next_question_number: 1,
      coach_summary: null,
    }),
    saveMorningCheckinAnswer: async () => ({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [null, null, null, null, null, null],
      next_question_number: 2,
      coach_summary: null,
    }),
    restartMorningCheckin: async () => ({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [null, null, null, null, null, null],
      next_question_number: 1,
      coach_summary: null,
    }),
    completeMorningCheckin: async () => ({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "completed",
      answers: [null, null, null, null, null, null],
      next_question_number: null,
      coach_summary: null,
    }),
    listPersonalJournalSnapshots: async () => [],
    exportPersonalJournal: async () => ({ snapshots: [] }),
    ...overrides,
  };
}

test("direct Morning Check-in route resumes the unfinished check-in", async () => {
  const getOrCreateMorningCheckin = vi
    .fn<PersonalJournalApiClient["getOrCreateMorningCheckin"]>()
    .mockResolvedValue({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [3, "Schon notiert", null, null, null, null],
      next_question_number: 3,
      coach_summary: null,
    });

  render(
    <MorningCheckinPage
      apiClient={makeMockClient({ getOrCreateMorningCheckin })}
      todayDateProvider={() => new Date("2026-08-04T12:00:00")}
    />,
  );

  await waitFor(() => {
    expect(getOrCreateMorningCheckin).toHaveBeenCalledWith("2026-08-04");
  });
  expect(
    screen.getByRole("heading", { name: "Frage 3 von 6", level: 3 }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Zur Startseite" })).toHaveAttribute(
    "href",
    "/",
  );
});

test("question cards show progress and preserve saved answers while navigating back", async () => {
  const saveMorningCheckinAnswer = vi
    .fn<PersonalJournalApiClient["saveMorningCheckinAnswer"]>()
    .mockResolvedValue({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [3, "Schon notiert", null, null, null, null],
      next_question_number: 3,
      coach_summary: null,
    });

  render(
    <MorningCheckinPage
      apiClient={makeMockClient({
        saveMorningCheckinAnswer,
        getOrCreateMorningCheckin: async () => ({
          id: "checkin-1",
          browser_date: "2026-08-04",
          status: "unfinished",
          answers: [3, "Schon notiert", null, null, null, null],
          next_question_number: 3,
          coach_summary: null,
        }),
      })}
      todayDateProvider={() => new Date("2026-08-04T12:00:00")}
    />,
  );

  expect(await screen.findByText("Loslassen")).toBeInTheDocument();
  const progress = screen.getByRole("list", { name: "Fortschritt" });
  expect(progress.children).toHaveLength(6);
  expect(progress.children[0]).toHaveClass("completed");
  expect(progress.children[1]).toHaveClass("completed");
  expect(progress.children[2]).toHaveClass("current");
  fireEvent.click(screen.getByRole("button", { name: "Zurueck" }));

  expect(screen.getByRole("heading", { name: "Frage 2 von 6", level: 3 })).toBeInTheDocument();
  expect(progress.children[0]).toHaveClass("completed");
  expect(progress.children[1]).toHaveClass("current");
  expect(screen.getByLabelText("Optionale Freitext-Antwort")).toHaveValue("Schon notiert");
  fireEvent.click(screen.getByRole("button", { name: "Antwort speichern und weiter" }));

  await waitFor(() => {
    expect(saveMorningCheckinAnswer).toHaveBeenCalledWith("checkin-1", {
      question_number: 2,
      answer: "Schon notiert",
    });
  });
  expect(screen.getByRole("heading", { name: "Frage 3 von 6", level: 3 })).toBeInTheDocument();
});

test("mood question offers the five labelled face ratings", async () => {
  render(
    <MorningCheckinPage
      apiClient={makeMockClient()}
      todayDateProvider={() => new Date("2026-08-04T12:00:00")}
    />,
  );

  fireEvent.click(await screen.findByRole("button", { name: "Atemuebung ueberspringen" }));
  const ratings = await screen.findAllByRole("radio");

  expect(ratings).toHaveLength(5);
  expect(ratings.map((rating) => rating.getAttribute("value"))).toEqual([
    "1",
    "2",
    "3",
    "4",
    "5",
  ]);
  expect(screen.getByRole("radio", { name: "1 Sehr schwer" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "5 Sehr gut" })).toBeInTheDocument();
});

test("homepage shows a resume action and newest snapshots from the API", async () => {
  render(<HomePage apiClient={makeMockClient({
    getOrCreateMorningCheckin: async () => ({ id: "today", browser_date: "2026-08-04", status: "unfinished", answers: [3, "", null, null, null, null], next_question_number: 2, coach_summary: null }),
    listPersonalJournalSnapshots: async () => [{ id: "latest", browser_date: "2026-08-03", status: "completed", answers: [4, "Dankbar", null, null, null, null], next_question_number: null, coach_summary: null }],
  })} todayDateProvider={() => new Date("2026-08-04T12:00:00")} />);
  expect(await screen.findByRole("link", { name: "Morning Check-in fortsetzen" })).toHaveAttribute("href", "/check-in");
  expect(screen.getByRole("link", { name: "Personal Journal" })).toHaveAttribute("href", "/journal");
  expect(screen.getByRole("article", { name: "Daily Snapshot vom 2026-08-03" })).toBeInTheDocument();
});

test("homepage keeps the current check-in action when journal loading fails", async () => {
  render(<HomePage apiClient={makeMockClient({
    listPersonalJournalSnapshots: async () => { throw new Error("unavailable"); },
  })} />);
  expect(await screen.findByRole("link", { name: "Morning Check-in starten" })).toHaveAttribute("href", "/check-in");
  expect(screen.getByRole("alert")).toHaveTextContent("Die Personal Journal Eintraege konnten nicht geladen werden.");
});

test("personal journal links snapshots and supports its direct detail resolution", async () => {
  const snapshots = [{ id: "snapshot-1", browser_date: "2026-08-04", status: "completed" as const, answers: [4, "Dankbar", null, null, null, null], next_question_number: null, coach_summary: "Ein guter Start." }];
  const client = makeMockClient({ listPersonalJournalSnapshots: async () => snapshots });
  const { unmount } = render(<PersonalJournalPage apiClient={client} />);
  expect(await screen.findByRole("link", { name: "Daily Snapshot vom 2026-08-04" })).toHaveAttribute("href", "/journal/snapshot-1");
  unmount();
  render(<DailySnapshotPage id="snapshot-1" apiClient={client} />);
  expect(await screen.findByText("Ein guter Start.")).toBeInTheDocument();
});

test("unknown Daily Snapshot IDs show an understandable not-found state", async () => {
  render(<DailySnapshotPage id="missing" apiClient={makeMockClient()} />);
  expect(await screen.findByRole("heading", { name: "Daily Snapshot nicht gefunden" })).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: "Zum Personal Journal" })[0]).toHaveAttribute("href", "/journal");
});

test("direct Morning Check-in route renders a completed Daily Snapshot as immutable", async () => {
  render(<MorningCheckinPage apiClient={makeMockClient({
    getOrCreateMorningCheckin: async () => ({ id: "checkin-1", browser_date: "2026-08-04", status: "completed", answers: [4, "Dankbar", null, null, null, null], next_question_number: null, coach_summary: "Ein guter Tag." }),
  })} />);
  expect(await screen.findByText("Dein Daily Snapshot ist abgeschlossen und bleibt unveraenderlich.")).toBeInTheDocument();
  expect(screen.getByText("Ein guter Tag.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Morning Check-in neu starten" })).not.toBeInTheDocument();
});

test("direct Morning Check-in route completes the current check-in", async () => {
  const completeMorningCheckin = vi.fn<PersonalJournalApiClient["completeMorningCheckin"]>().mockResolvedValue({ id: "checkin-1", browser_date: "2026-08-04", status: "completed", answers: [null, null, null, null, null, null], next_question_number: null, coach_summary: null });
  render(<MorningCheckinPage apiClient={makeMockClient({
    getOrCreateMorningCheckin: async () => ({ id: "checkin-1", browser_date: "2026-08-04", status: "unfinished", answers: [null, null, null, null, null, null], next_question_number: 6, coach_summary: null }),
    saveMorningCheckinAnswer: async () => ({ id: "checkin-1", browser_date: "2026-08-04", status: "unfinished", answers: [null, null, null, null, null, null], next_question_number: null, coach_summary: null }),
    completeMorningCheckin,
  })} />);
  fireEvent.click(await screen.findByRole("button", { name: "Antwort speichern und weiter" }));
  await waitFor(() => expect(completeMorningCheckin).toHaveBeenCalledWith("checkin-1"));
  expect(screen.getByText("Dein Daily Snapshot ist abgeschlossen und bleibt unveraenderlich.")).toBeInTheDocument();
});

test("personal journal reports export failures", async () => {
  render(<PersonalJournalPage apiClient={makeMockClient({ exportPersonalJournal: async () => { throw new Error("unavailable"); } })} />);
  fireEvent.click(screen.getByRole("button", { name: "Journal Export herunterladen" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Der Journal Export konnte nicht heruntergeladen werden.");
});

test("detail route keeps loading failures separate from unknown IDs", async () => {
  render(<DailySnapshotPage id="snapshot-1" apiClient={makeMockClient({ listPersonalJournalSnapshots: async () => { throw new Error("unavailable"); } })} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Der Daily Snapshot konnte nicht geladen werden.");
  expect(screen.queryByText("Daily Snapshot nicht gefunden")).not.toBeInTheDocument();
});
