import { render, screen, waitFor } from "@testing-library/react";
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
