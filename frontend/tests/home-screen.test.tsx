import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { HomeScreen } from "@/components/home-screen";
import type { PersonalJournalApiClient } from "@/lib/api/client";

function makeMockClient(overrides: Partial<PersonalJournalApiClient> = {}): PersonalJournalApiClient {
  return {
    getHealth: async () => ({ status: "ok" }),
    getOrCreateMorningCheckin: async () => ({
      id: "abc",
      browser_date: "2026-08-04",
      status: "unfinished",
    }),
    ...overrides,
  };
}

test("shows German base shell and privacy boundary", async () => {
  render(<HomeScreen apiClient={makeMockClient()} />);

  expect(
    screen.getByRole("heading", {
      name: "Morning Coach",
      level: 1,
    }),
  ).toBeInTheDocument();
  expect(screen.getByText(/nur die Antworten deines aktuellen Morning Check-ins an OpenAI gesendet/i)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Morning Check-in", level: 2 })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Personal Journal", level: 2 })).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent("Journal-Service bereit.");
  });
});

test("starts check-in with browser-local date and can skip breathing exercise", async () => {
  const getOrCreateMorningCheckin = vi.fn<PersonalJournalApiClient["getOrCreateMorningCheckin"]>().mockResolvedValue({
    id: "checkin-1",
    browser_date: "2026-08-04",
    status: "unfinished",
  });

  render(
    <HomeScreen
      apiClient={makeMockClient({ getOrCreateMorningCheckin })}
      todayDateProvider={() => new Date("2026-08-04T12:00:00")}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Morning Check-in starten" }));

  await waitFor(() => {
    expect(getOrCreateMorningCheckin).toHaveBeenCalledWith("2026-08-04");
  });
  expect(screen.getByRole("heading", { name: "Atemuebung", level: 3 })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Atemuebung ueberspringen" }));

  expect(screen.getByRole("heading", { name: "Frage 1 von 6", level: 3 })).toBeInTheDocument();
});

test("finishes breathing exercise and reaches first question", async () => {
  const getOrCreateMorningCheckin = vi.fn<PersonalJournalApiClient["getOrCreateMorningCheckin"]>().mockResolvedValue({
    id: "checkin-1",
    browser_date: "2026-08-04",
    status: "unfinished",
  });

  render(
    <HomeScreen
      apiClient={makeMockClient({ getOrCreateMorningCheckin })}
      breathingDurationSeconds={1}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Morning Check-in starten" }));

  await waitFor(() => {
    expect(screen.getByRole("heading", { name: "Atemuebung", level: 3 })).toBeInTheDocument();
  });

  await waitFor(
    () => {
      expect(screen.getByRole("heading", { name: "Frage 1 von 6", level: 3 })).toBeInTheDocument();
    },
    { timeout: 2_000 },
  );
});

test("shows degraded status when backend health request fails", async () => {
  render(
    <HomeScreen
      apiClient={makeMockClient({
        getHealth: async () => {
          throw new Error("backend down");
        },
      })}
    />,
  );

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent("Journal-Service momentan nicht erreichbar.");
  });
});
