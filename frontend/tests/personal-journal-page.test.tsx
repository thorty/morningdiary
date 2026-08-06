import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { HomePage } from "@/components/home-page";
import { PersonalJournalPage } from "@/components/personal-journal-page";
import type { PersonalJournalApiClient } from "@/lib/api/client";
import type { MorningCheckinResponse } from "@/lib/api/types";

function snapshot(day: string, answer: string, mood = 4): MorningCheckinResponse {
  return {
    id: `snapshot-${day}`,
    browser_date: `2026-08-${day}`,
    status: "completed",
    answers: [mood, answer, null, null, null, null],
    next_question_number: null,
    coach_summary: null,
  };
}

function apiClient(snapshots: MorningCheckinResponse[] = []): PersonalJournalApiClient {
  return {
    getHealth: vi.fn(),
    getOrCreateMorningCheckin: vi.fn(),
    saveMorningCheckinAnswer: vi.fn(),
    restartMorningCheckin: vi.fn(),
    completeMorningCheckin: vi.fn(),
    listPersonalJournalSnapshots: vi.fn(async () => snapshots),
    exportPersonalJournal: vi.fn(async () => ({ snapshots })),
  };
}

test("the Personal Journal route shows Daily Snapshots newest first with their mood and preview", async () => {
  const client = apiClient([
    snapshot("02", "Aeltere Notiz", 2),
    snapshot("04", "Neueste Notiz", 5),
  ]);

  render(<PersonalJournalPage apiClient={client} />);

  await screen.findByRole("article", { name: "Daily Snapshot vom 2026-08-04" });
  const snapshots = screen.getAllByRole("article");
  expect(snapshots.map((entry) => entry.getAttribute("aria-label"))).toEqual([
    "Daily Snapshot vom 2026-08-04",
    "Daily Snapshot vom 2026-08-02",
  ]);
  expect(screen.getByText("Stimmung 5 von 5 - Sehr gut")).toBeInTheDocument();
  expect(screen.getByText("Neueste Notiz")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /Stimmungsverlauf/ })).toHaveAccessibleName(
    "Stimmungsverlauf: 2 von 5 am 2. August 2026; 5 von 5 am 4. August 2026",
  );
});

test("the Personal Journal route distinguishes loading and empty states and starts a Morning Check-in", async () => {
  let resolveSnapshots: (value: MorningCheckinResponse[]) => void;
  const client = apiClient();
  client.listPersonalJournalSnapshots = vi.fn(
    () => new Promise<MorningCheckinResponse[]>((resolve) => { resolveSnapshots = resolve; }),
  );

  render(<PersonalJournalPage apiClient={client} />);

  expect(screen.getByText("Journal wird geladen...")).toBeInTheDocument();
  expect(screen.queryByText("Noch keine Daily Snapshots vorhanden.")).not.toBeInTheDocument();

  resolveSnapshots!([]);

  expect(await screen.findByText("Noch keine Daily Snapshots vorhanden.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Morning Check-in starten" })).toHaveAttribute("href", "/check-in");
});

test("the Personal Journal route reports when snapshots cannot load", async () => {
  const client = apiClient();
  client.listPersonalJournalSnapshots = vi.fn(async () => { throw new Error("unavailable"); });

  render(<PersonalJournalPage apiClient={client} />);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Die Personal Journal Eintraege konnten nicht geladen werden.",
  );
});

test("the Personal Journal route downloads the export and reports a download failure", async () => {
  const client = apiClient();
  const createObjectURL = vi.fn(() => "blob:journal");
  const revokeObjectURL = vi.fn();
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

  const { rerender } = render(<PersonalJournalPage apiClient={client} />);
  await screen.findByText("Noch keine Daily Snapshots vorhanden.");
  fireEvent.click(screen.getByRole("button", { name: "Journal Export herunterladen" }));

  await waitFor(() => expect(createObjectURL).toHaveBeenCalledOnce());
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:journal");

  client.exportPersonalJournal = vi.fn(async () => { throw new Error("unavailable"); });
  rerender(<PersonalJournalPage apiClient={client} />);
  fireEvent.click(screen.getByRole("button", { name: "Journal Export herunterladen" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Der Journal Export konnte nicht heruntergeladen werden.");

  click.mockRestore();
  vi.unstubAllGlobals();
});

test("the Personal Journal route shows that the export is being prepared", async () => {
  let resolveExport: () => void;
  const client = apiClient();
  client.exportPersonalJournal = vi.fn(
    () => new Promise<{ snapshots: MorningCheckinResponse[] }>((resolve) => { resolveExport = () => resolve({ snapshots: [] }); }),
  );
  vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:journal"), revokeObjectURL: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

  render(<PersonalJournalPage apiClient={client} />);
  await screen.findByText("Noch keine Daily Snapshots vorhanden.");
  fireEvent.click(screen.getByRole("button", { name: "Journal Export herunterladen" }));

  expect(screen.getByRole("button", { name: "Journal Export wird vorbereitet..." })).toBeDisabled();

  resolveExport!();
  await screen.findByRole("button", { name: "Journal Export herunterladen" });
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("home and Personal Journal expose routes to each other", async () => {
  const client = apiClient();
  client.getOrCreateMorningCheckin = vi.fn(async () => snapshot("04", "Heute"));

  const { unmount } = render(<HomePage apiClient={client} />);
  expect(screen.getByRole("link", { name: "Personal Journal" })).toHaveAttribute("href", "/journal");
  unmount();

  render(<PersonalJournalPage apiClient={client} />);
  expect(screen.getByRole("link", { name: "Zur Startseite" })).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: "Morning Check-in" })).toHaveAttribute("href", "/check-in");
  await screen.findByText("Noch keine Daily Snapshots vorhanden.");
});
