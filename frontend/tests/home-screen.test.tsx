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
      answers: [null, null, null, null, null, null],
      next_question_number: 1,
    }),
    saveMorningCheckinAnswer: async () => ({
      id: "abc",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [1, null, null, null, null, null],
      next_question_number: 2,
    }),
    restartMorningCheckin: async () => ({
      id: "abc",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [null, null, null, null, null, null],
      next_question_number: 1,
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
    answers: [null, null, null, null, null, null],
    next_question_number: 1,
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
    answers: [null, null, null, null, null, null],
    next_question_number: 1,
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

test("saves mood answer and advances to next question", async () => {
  const saveMorningCheckinAnswer = vi
    .fn<PersonalJournalApiClient["saveMorningCheckinAnswer"]>()
    .mockResolvedValue({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [4, null, null, null, null, null],
      next_question_number: 2,
    });

  render(
    <HomeScreen
      apiClient={
        makeMockClient({
          saveMorningCheckinAnswer,
          getOrCreateMorningCheckin: async () => ({
            id: "checkin-1",
            browser_date: "2026-08-04",
            status: "unfinished",
            answers: [null, null, null, null, null, null],
            next_question_number: 1,
          }),
        })
      }
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Morning Check-in starten" }));
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Atemuebung ueberspringen" })).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole("button", { name: "Atemuebung ueberspringen" }));
  fireEvent.change(screen.getByLabelText("Optionale Stimmung (1 bis 5)"), {
    target: { value: "4" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Antwort speichern und weiter" }));

  await waitFor(() => {
    expect(saveMorningCheckinAnswer).toHaveBeenCalledWith("checkin-1", {
      question_number: 1,
      answer: 4,
    });
  });
  expect(screen.getByRole("heading", { name: "Frage 2 von 6", level: 3 })).toBeInTheDocument();
});

test("shows validation message for invalid mood input", async () => {
  const saveMorningCheckinAnswer = vi.fn<PersonalJournalApiClient["saveMorningCheckinAnswer"]>();

  render(
    <HomeScreen
      apiClient={
        makeMockClient({
          saveMorningCheckinAnswer,
          getOrCreateMorningCheckin: async () => ({
            id: "checkin-1",
            browser_date: "2026-08-04",
            status: "unfinished",
            answers: [null, null, null, null, null, null],
            next_question_number: 1,
          }),
        })
      }
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Morning Check-in starten" }));
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Atemuebung ueberspringen" })).toBeInTheDocument();
  });
  fireEvent.click(screen.getByRole("button", { name: "Atemuebung ueberspringen" }));

  fireEvent.change(screen.getByLabelText("Optionale Stimmung (1 bis 5)"), {
    target: { value: "9" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Antwort speichern und weiter" }));

  expect(saveMorningCheckinAnswer).not.toHaveBeenCalled();
  expect(screen.getByText("Bitte gib fuer die Stimmung eine Zahl zwischen 1 und 5 ein.")).toBeInTheDocument();
});

test("resumes an unfinished check-in at the next question", async () => {
  render(
    <HomeScreen
      apiClient={
        makeMockClient({
          getOrCreateMorningCheckin: async () => ({
            id: "checkin-1",
            browser_date: "2026-08-04",
            status: "unfinished",
            answers: [3, "Schon notiert", null, null, null, null],
            next_question_number: 3,
          }),
        })
      }
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Morning Check-in starten" }));
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Atemuebung ueberspringen" })).toBeInTheDocument();
  });
  fireEvent.click(screen.getByRole("button", { name: "Atemuebung ueberspringen" }));

  expect(screen.getByRole("heading", { name: "Frage 3 von 6", level: 3 })).toBeInTheDocument();
});

test("restarts unfinished check-in and resets to question one", async () => {
  const restartMorningCheckin = vi.fn<PersonalJournalApiClient["restartMorningCheckin"]>().mockResolvedValue({
    id: "checkin-1",
    browser_date: "2026-08-04",
    status: "unfinished",
    answers: [null, null, null, null, null, null],
    next_question_number: 1,
  });

  render(
    <HomeScreen
      apiClient={
        makeMockClient({
          restartMorningCheckin,
          getOrCreateMorningCheckin: async () => ({
            id: "checkin-1",
            browser_date: "2026-08-04",
            status: "unfinished",
            answers: [2, "Teilweise", null, null, null, null],
            next_question_number: 3,
          }),
        })
      }
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Morning Check-in starten" }));
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Atemuebung ueberspringen" })).toBeInTheDocument();
  });
  fireEvent.click(screen.getByRole("button", { name: "Atemuebung ueberspringen" }));
  fireEvent.click(screen.getByRole("button", { name: "Morning Check-in neu starten" }));

  await waitFor(() => {
    expect(restartMorningCheckin).toHaveBeenCalledWith("checkin-1");
  });
  expect(screen.getByRole("heading", { name: "Frage 1 von 6", level: 3 })).toBeInTheDocument();
});
