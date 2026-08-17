import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { ThemePicker } from "@/components/theme-picker";
import { ThemeApplier } from "@/components/theme-applier";
import type { PersonalJournalApiClient } from "@/lib/api/client";
import type { MorningCheckinResponse } from "@/lib/api/types";
import { resolveAutomaticTheme } from "@/lib/theme";

test("automatic theme follows the newest Daily Snapshot with a mood", () => {
  expect(resolveAutomaticTheme([
    { browser_date: "2026-08-03", answers: [5] },
    { browser_date: "2026-08-05", answers: [2] },
    { browser_date: "2026-08-06", answers: [9] },
  ])).toBe("purple");
});

test("theme picker persists a selected color across mounts", () => {
  const { unmount } = render(<ThemePicker automaticTheme="orange" />);

  fireEvent.click(screen.getByRole("button", { name: "Farbstimmung Blau" }));
  expect(document.documentElement.dataset.theme).toBe("blue");
  expect(window.localStorage.getItem("morning-coach.theme")).toBe("blue");

  unmount();
  render(<ThemePicker automaticTheme="orange" />);
  expect(screen.getByRole("button", { name: "Farbstimmung Blau" })).toHaveAttribute("aria-pressed", "true");

  fireEvent.click(screen.getByRole("button", { name: "Automatisch" }));
  expect(document.documentElement.dataset.theme).toBe("orange");
  expect(window.localStorage.getItem("morning-coach.theme")).toBe("auto");
});

test("automatic theme reads snapshots through the injected local journal client", async () => {
  window.localStorage.removeItem("morning-coach.theme");
  const apiClient: PersonalJournalApiClient = {
    getHealth: vi.fn(),
    getOrCreateMorningCheckin: vi.fn(),
    saveMorningCheckinAnswer: vi.fn(),
    restartMorningCheckin: vi.fn(),
    completeMorningCheckin: vi.fn(),
    findPersonalJournalSnapshot: vi.fn(),
    listPersonalJournalSnapshots: vi.fn(async (): Promise<MorningCheckinResponse[]> => [
      {
        id: "snapshot-local",
        browser_date: "2026-08-17",
        status: "completed" as const,
        answers: [2, null, null, null, null, null],
        next_question_number: null,
        coach_summary: null,
      },
    ]),
    exportPersonalJournal: vi.fn(),
    deletePersonalJournal: vi.fn(),
  };

  render(<ThemeApplier apiClient={apiClient} />);

  await waitFor(() => expect(document.documentElement.dataset.theme).toBe("purple"));
  expect(apiClient.listPersonalJournalSnapshots).toHaveBeenCalledOnce();
});

test("automatic theme reports local snapshot read failures", async () => {
  window.localStorage.removeItem("morning-coach.theme");
  const apiClient: PersonalJournalApiClient = {
    getHealth: vi.fn(),
    getOrCreateMorningCheckin: vi.fn(),
    saveMorningCheckinAnswer: vi.fn(),
    restartMorningCheckin: vi.fn(),
    completeMorningCheckin: vi.fn(),
    findPersonalJournalSnapshot: vi.fn(),
    listPersonalJournalSnapshots: vi.fn(async (): Promise<MorningCheckinResponse[]> => { throw new Error("storage unavailable"); }),
    exportPersonalJournal: vi.fn(),
    deletePersonalJournal: vi.fn(),
  };

  render(<ThemeApplier apiClient={apiClient} />);

  expect(await screen.findByRole("alert")).toHaveTextContent("Die automatische Farbstimmung konnte nicht aus dem Browser-Speicher geladen werden.");
  expect(document.documentElement.dataset.theme).toBe("orange");
});

test("theme picker reports browser-storage write failures", () => {
  const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
  render(<ThemePicker automaticTheme="orange" />);

  fireEvent.click(screen.getByRole("button", { name: "Farbstimmung Blau" }));

  expect(screen.getByRole("alert")).toHaveTextContent("Die Farbstimmung konnte nicht im Browser-Speicher gespeichert werden.");
  setItem.mockRestore();
});
