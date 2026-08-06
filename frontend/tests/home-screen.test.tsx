import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import React from "react";

import { HomeScreen } from "@/components/home-screen";
import type { PersonalJournalApiClient } from "@/lib/api/client";

function makeMockClient(
  overrides: Partial<PersonalJournalApiClient> = {},
): PersonalJournalApiClient {
  return {
    getHealth: async () => ({ status: "ok" }),
    getOrCreateMorningCheckin: async () => ({
      id: "abc",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [null, null, null, null, null, null],
      next_question_number: 1,
      coach_summary: null,
    }),
    saveMorningCheckinAnswer: async () => ({
      id: "abc",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [1, null, null, null, null, null],
      next_question_number: 2,
      coach_summary: null,
    }),
    restartMorningCheckin: async () => ({
      id: "abc",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [null, null, null, null, null, null],
      next_question_number: 1,
      coach_summary: null,
    }),
    completeMorningCheckin: async () => ({
      id: "abc",
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

test("shows German base shell and privacy boundary", async () => {
  render(
    <HomeScreen
      apiClient={makeMockClient()}
      todayDateProvider={() => new Date("2026-08-04T12:00:00")}
    />,
  );

  expect(
    screen.getByRole("heading", {
      name: "Guten Tag. Nimm dir fuenf Minuten.",
      level: 1,
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      /Antworten aus dem aktuellen Morning Check-in an OpenAI gesendet/i,
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Deine Routine fuer heute", level: 2 }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Personal Journal", level: 2 }),
  ).toBeInTheDocument();
  expect(screen.getByText("Dienstag, 4. August")).toBeInTheDocument();
  expect(screen.getByText("Guten Tag.")).toBeInTheDocument();
  expect(
    screen.getByText(/Erst 30 Sekunden atmen, dann sechs ruhige Fragen/i),
  ).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent(
      "Journal-Service bereit.",
    );
  });
});

test("shows a retryable German error when starting the check-in fails", async () => {
  render(
    <HomeScreen
      apiClient={makeMockClient({
        getOrCreateMorningCheckin: async () => {
          throw new Error("backend down");
        },
      })}
    />,
  );

  const startButton = screen.getByRole("button", {
    name: "Morning Check-in starten",
  });
  fireEvent.click(startButton);

  await waitFor(() => {
    expect(
      screen.getByText(
        "Der Morning Check-in konnte gerade nicht gestartet werden.",
      ),
    ).toBeInTheDocument();
  });
  expect(startButton).toBeEnabled();
});

test("starts check-in with browser-local date and can skip breathing exercise", async () => {
  const getOrCreateMorningCheckin = vi
    .fn<PersonalJournalApiClient["getOrCreateMorningCheckin"]>()
    .mockResolvedValue({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [null, null, null, null, null, null],
      next_question_number: 1,
      coach_summary: null,
    });

  render(
    <HomeScreen
      apiClient={makeMockClient({ getOrCreateMorningCheckin })}
      todayDateProvider={() => new Date("2026-08-04T12:00:00")}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Morning Check-in starten" }),
  );

  await waitFor(() => {
    expect(getOrCreateMorningCheckin).toHaveBeenCalledWith("2026-08-04");
  });
  expect(
    screen.getByRole("heading", { name: "Atemuebung", level: 3 }),
  ).toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", { name: "Atemuebung ueberspringen" }),
  );

  expect(
    screen.getByRole("heading", { name: "Frage 1 von 6", level: 3 }),
  ).toBeInTheDocument();
});

test("finishes breathing exercise and reaches first question", async () => {
  const getOrCreateMorningCheckin = vi
    .fn<PersonalJournalApiClient["getOrCreateMorningCheckin"]>()
    .mockResolvedValue({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [null, null, null, null, null, null],
      next_question_number: 1,
      coach_summary: null,
    });

  render(
    <HomeScreen
      apiClient={makeMockClient({ getOrCreateMorningCheckin })}
      breathingDurationSeconds={1}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Morning Check-in starten" }),
  );

  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: "Atemuebung", level: 3 }),
    ).toBeInTheDocument();
  });

  await waitFor(
    () => {
      expect(
        screen.getByRole("heading", { name: "Frage 1 von 6", level: 3 }),
      ).toBeInTheDocument();
    },
    { timeout: 2_000 },
  );
});

test("shows the breathing rhythm, countdown, and progress before automatically opening question one", async () => {
  vi.useFakeTimers();

  try {
    render(
      <HomeScreen apiClient={makeMockClient()} breathingDurationSeconds={10} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Morning Check-in starten" }),
    );

    await act(async () => {});

    expect(screen.getByText("Einatmen")).toBeInTheDocument();
    expect(screen.getByText("10 Sekunden verbleibend")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Fortschritt der Atemuebung" }),
    ).toHaveValue(0);

    act(() => {
      vi.advanceTimersByTime(4_000);
    });

    expect(screen.getByText("Ausatmen")).toBeInTheDocument();
    expect(screen.getByText("6 Sekunden verbleibend")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Fortschritt der Atemuebung" }),
    ).toHaveValue(4);

    act(() => {
      vi.advanceTimersByTime(6_000);
    });

    expect(
      screen.getByRole("heading", { name: "Frage 1 von 6", level: 3 }),
    ).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});

test("uses real elapsed time when a delayed browser timer catches up", async () => {
  vi.useFakeTimers();

  try {
    render(<HomeScreen apiClient={makeMockClient()} breathingDurationSeconds={30} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Morning Check-in starten" }),
    );
    await act(async () => {});

    vi.setSystemTime(Date.now() + 30_000);
    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(
      screen.getByRole("heading", { name: "Frage 1 von 6", level: 3 }),
    ).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});

test("keeps question one visible when the breathing timer fires after skipping", async () => {
  vi.useFakeTimers();

  try {
    render(<HomeScreen apiClient={makeMockClient()} breathingDurationSeconds={30} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Morning Check-in starten" }),
    );
    await act(async () => {});
    fireEvent.click(
      screen.getByRole("button", { name: "Atemuebung ueberspringen" }),
    );

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(
      screen.getByRole("heading", { name: "Frage 1 von 6", level: 3 }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Atemuebung ueberspringen" }),
    ).not.toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});

test("disables the breathing orb animation when reduced motion is requested", () => {
  const stylesheet = readFileSync(
    resolve(process.cwd(), "app/globals.css"),
    "utf8",
  );

  expect(stylesheet).toMatch(
    /\.breath-orb\.inhale::before\s*\{\s*animation: inhale 4s/,
  );
  expect(stylesheet).toMatch(
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation-duration: 0\.01ms !important;/,
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
    expect(screen.getByRole("status")).toHaveTextContent(
      "Journal-Service momentan nicht erreichbar.",
    );
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
      coach_summary: null,
    });

  render(
    <HomeScreen
      apiClient={makeMockClient({
        saveMorningCheckinAnswer,
        getOrCreateMorningCheckin: async () => ({
          id: "checkin-1",
          browser_date: "2026-08-04",
          status: "unfinished",
          answers: [null, null, null, null, null, null],
          next_question_number: 1,
          coach_summary: null,
        }),
      })}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Morning Check-in starten" }),
  );
  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: "Atemuebung ueberspringen" }),
    ).toBeInTheDocument();
  });

  fireEvent.click(
    screen.getByRole("button", { name: "Atemuebung ueberspringen" }),
  );
  fireEvent.click(screen.getByRole("radio", { name: /4 Gut/ }));
  fireEvent.click(
    screen.getByRole("button", { name: "Antwort speichern und weiter" }),
  );

  await waitFor(() => {
    expect(saveMorningCheckinAnswer).toHaveBeenCalledWith("checkin-1", {
      question_number: 1,
      answer: 4,
    });
  });
  expect(
    screen.getByRole("heading", { name: "Frage 2 von 6", level: 3 }),
  ).toBeInTheDocument();
});

test("saves an optional free-text answer before advancing", async () => {
  const saveMorningCheckinAnswer = vi
    .fn<PersonalJournalApiClient["saveMorningCheckinAnswer"]>()
    .mockResolvedValue({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [4, "Ein ruhiger Kaffee", null, null, null, null],
      next_question_number: 3,
      coach_summary: null,
    });

  render(
    <HomeScreen
      apiClient={makeMockClient({
        saveMorningCheckinAnswer,
        getOrCreateMorningCheckin: async () => ({
          id: "checkin-1",
          browser_date: "2026-08-04",
          status: "unfinished",
          answers: [4, null, null, null, null, null],
          next_question_number: 2,
          coach_summary: null,
        }),
      })}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Morning Check-in starten" }),
  );
  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: "Frage 2 von 6", level: 3 }),
    ).toBeInTheDocument();
  });
  fireEvent.change(screen.getByLabelText("Optionale Freitext-Antwort"), {
    target: { value: "Ein ruhiger Kaffee" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Antwort speichern und weiter" }),
  );

  await waitFor(() => {
    expect(saveMorningCheckinAnswer).toHaveBeenCalledWith("checkin-1", {
      question_number: 2,
      answer: "Ein ruhiger Kaffee",
    });
  });
});

test("keeps the question visible and allows retry when saving fails", async () => {
  const saveMorningCheckinAnswer = vi
    .fn<PersonalJournalApiClient["saveMorningCheckinAnswer"]>()
    .mockRejectedValueOnce(new Error("Speichern fehlgeschlagen"))
    .mockResolvedValueOnce({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [4, null, null, null, null, null],
      next_question_number: 2,
      coach_summary: null,
    });

  render(
    <HomeScreen apiClient={makeMockClient({ saveMorningCheckinAnswer })} />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Morning Check-in starten" }),
  );
  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: "Atemuebung ueberspringen" }),
    ).toBeInTheDocument();
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Atemuebung ueberspringen" }),
  );
  fireEvent.click(screen.getByRole("radio", { name: /4 Gut/ }));
  fireEvent.click(
    screen.getByRole("button", { name: "Antwort speichern und weiter" }),
  );

  await waitFor(() => {
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Speichern fehlgeschlagen",
    );
  });
  expect(
    screen.getByRole("heading", { name: "Frage 1 von 6", level: 3 }),
  ).toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", { name: "Antwort speichern und weiter" }),
  );
  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: "Frage 2 von 6", level: 3 }),
    ).toBeInTheDocument();
  });
});

test("shows a saving state and prevents duplicate answer submissions", async () => {
  let resolveSave:
    | ((
        response: Awaited<
          ReturnType<PersonalJournalApiClient["saveMorningCheckinAnswer"]>
        >,
      ) => void)
    | undefined;
  const saveMorningCheckinAnswer = vi
    .fn<PersonalJournalApiClient["saveMorningCheckinAnswer"]>()
    .mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );

  render(
    <HomeScreen apiClient={makeMockClient({ saveMorningCheckinAnswer })} />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Morning Check-in starten" }),
  );
  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: "Atemuebung ueberspringen" }),
    ).toBeInTheDocument();
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Atemuebung ueberspringen" }),
  );
  fireEvent.click(screen.getByRole("radio", { name: /4 Gut/ }));
  fireEvent.click(
    screen.getByRole("button", { name: "Antwort speichern und weiter" }),
  );

  expect(
    screen.getByRole("button", { name: "Antwort wird gespeichert..." }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Morning Check-in neu starten" }),
  ).toBeDisabled();
  fireEvent.click(
    screen.getByRole("button", { name: "Antwort wird gespeichert..." }),
  );
  expect(saveMorningCheckinAnswer).toHaveBeenCalledTimes(1);

  resolveSave?.({
    id: "abc",
    browser_date: "2026-08-04",
    status: "unfinished",
    answers: [4, null, null, null, null, null],
    next_question_number: 2,
    coach_summary: null,
  });
  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: "Frage 2 von 6", level: 3 }),
    ).toBeInTheDocument();
  });
});

test("allows retry when completion fails after the sixth saved response", async () => {
  const saveMorningCheckinAnswer = vi
    .fn<PersonalJournalApiClient["saveMorningCheckinAnswer"]>()
    .mockResolvedValue({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [null, null, null, null, null, null],
      next_question_number: null,
      coach_summary: null,
    });
  const completeMorningCheckin = vi
    .fn<PersonalJournalApiClient["completeMorningCheckin"]>()
    .mockRejectedValueOnce(new Error("Abschluss fehlgeschlagen"))
    .mockResolvedValueOnce({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "completed",
      answers: [null, null, null, null, null, null],
      next_question_number: null,
      coach_summary: null,
    });

  render(
    <HomeScreen
      apiClient={makeMockClient({
        saveMorningCheckinAnswer,
        completeMorningCheckin,
        getOrCreateMorningCheckin: async () => ({
          id: "checkin-1",
          browser_date: "2026-08-04",
          status: "unfinished",
          answers: [null, null, null, null, null, null],
          next_question_number: 6,
          coach_summary: null,
        }),
      })}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Morning Check-in starten" }),
  );
  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: "Frage 6 von 6", level: 3 }),
    ).toBeInTheDocument();
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Antwort speichern und weiter" }),
  );

  await waitFor(() => {
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Abschluss fehlgeschlagen",
    );
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Abschluss erneut versuchen" }),
  );

  await waitFor(() => {
    expect(completeMorningCheckin).toHaveBeenCalledTimes(2);
    expect(
      screen.getByText(
        "Dein Daily Snapshot ist abgeschlossen und bleibt unveraenderlich.",
      ),
    ).toBeInTheDocument();
  });
});

test("marks the selected mood and saves its valid rating", async () => {
  const saveMorningCheckinAnswer = vi
    .fn<PersonalJournalApiClient["saveMorningCheckinAnswer"]>()
    .mockResolvedValue({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [5, null, null, null, null, null],
      next_question_number: 2,
      coach_summary: null,
    });

  render(
    <HomeScreen
      apiClient={makeMockClient({
        saveMorningCheckinAnswer,
        getOrCreateMorningCheckin: async () => ({
          id: "checkin-1",
          browser_date: "2026-08-04",
          status: "unfinished",
          answers: [null, null, null, null, null, null],
          next_question_number: 1,
          coach_summary: null,
        }),
      })}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Morning Check-in starten" }),
  );
  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: "Atemuebung ueberspringen" }),
    ).toBeInTheDocument();
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Atemuebung ueberspringen" }),
  );

  fireEvent.click(screen.getByRole("radio", { name: /5 Sehr gut/ }));
  expect(screen.getByRole("radio", { name: /5 Sehr gut/ })).toBeChecked();
  fireEvent.click(
    screen.getByRole("button", { name: "Antwort speichern und weiter" }),
  );

  await waitFor(() => {
    expect(saveMorningCheckinAnswer).toHaveBeenCalledWith("checkin-1", {
      question_number: 1,
      answer: 5,
    });
  });
});

test("resumes an unfinished check-in at the next question", async () => {
  render(
    <HomeScreen
      apiClient={makeMockClient({
        getOrCreateMorningCheckin: async () => ({
          id: "checkin-1",
          browser_date: "2026-08-04",
          status: "unfinished",
          answers: [3, "Schon notiert", null, null, null, null],
          next_question_number: 3,
          coach_summary: null,
        }),
      })}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Morning Check-in starten" }),
  );
  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: "Frage 3 von 6", level: 3 }),
    ).toBeInTheDocument();
  });
  expect(
    screen.queryByRole("button", { name: "Atemuebung ueberspringen" }),
  ).not.toBeInTheDocument();
});

test("restarts unfinished check-in and resets to question one", async () => {
  const restartMorningCheckin = vi
    .fn<PersonalJournalApiClient["restartMorningCheckin"]>()
    .mockResolvedValue({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [null, null, null, null, null, null],
      next_question_number: 1,
      coach_summary: null,
    });

  render(
    <HomeScreen
      apiClient={makeMockClient({
        restartMorningCheckin,
        getOrCreateMorningCheckin: async () => ({
          id: "checkin-1",
          browser_date: "2026-08-04",
          status: "unfinished",
          answers: [2, "Teilweise", null, null, null, null],
          next_question_number: 3,
          coach_summary: null,
        }),
      })}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Morning Check-in starten" }),
  );
  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: "Frage 3 von 6", level: 3 }),
    ).toBeInTheDocument();
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Morning Check-in neu starten" }),
  );

  await waitFor(() => {
    expect(restartMorningCheckin).toHaveBeenCalledWith("checkin-1");
  });
  expect(
    screen.getByRole("heading", { name: "Frage 1 von 6", level: 3 }),
  ).toBeInTheDocument();
});

test("renders immutable completed daily snapshot when resumed as completed", async () => {
  render(
    <HomeScreen
      apiClient={makeMockClient({
        getOrCreateMorningCheckin: async () => ({
          id: "checkin-1",
          browser_date: "2026-08-04",
          status: "completed",
          answers: [3, "Dankbar", null, "Energie", null, null],
          next_question_number: null,
          coach_summary: "Bleib heute freundlich mit dir.",
        }),
      })}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Morning Check-in starten" }),
  );
  await waitFor(() => {
    expect(
      screen.getByText(
        "Dein Daily Snapshot ist abgeschlossen und bleibt unveraenderlich.",
      ),
    ).toBeInTheDocument();
  });

  expect(
    screen.getByRole("article", { name: "Daily Snapshot vom 2026-08-04" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Dienstag, 4. August 2026")).toBeInTheDocument();
  expect(
    screen.getByText("Stimmung: 3 von 5 - Ausgeglichen"),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Bleib heute freundlich mit dir."),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Morning Check-in neu starten" }),
  ).not.toBeInTheDocument();
});

test("shows fallback note when completed snapshot has no generated summary", async () => {
  render(
    <HomeScreen
      apiClient={makeMockClient({
        getOrCreateMorningCheckin: async () => ({
          id: "checkin-1",
          browser_date: "2026-08-04",
          status: "completed",
          answers: [null, "Only a short answer", null, null, null, null],
          next_question_number: null,
          coach_summary:
            "Deine Zusammenfassung konnte heute nicht erstellt werden.",
          coach_summary_status: "unavailable",
        }),
      })}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Morning Check-in starten" }),
  );
  await waitFor(() => {
    expect(
      screen.getByText(
        "Die Coach Summary konnte gerade nicht erstellt werden. Dein Daily Snapshot bleibt vollständig gespeichert.",
      ),
    ).toBeInTheDocument();
  });
});

test("completes a blank check-in and renders completed daily snapshot", async () => {
  const saveMorningCheckinAnswer = vi
    .fn<PersonalJournalApiClient["saveMorningCheckinAnswer"]>()
    .mockResolvedValueOnce({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [null, null, null, null, null, null],
      next_question_number: 2,
      coach_summary: null,
    })
    .mockResolvedValueOnce({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [null, null, null, null, null, null],
      next_question_number: 3,
      coach_summary: null,
    })
    .mockResolvedValueOnce({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [null, null, null, null, null, null],
      next_question_number: 4,
      coach_summary: null,
    })
    .mockResolvedValueOnce({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [null, null, null, null, null, null],
      next_question_number: 5,
      coach_summary: null,
    })
    .mockResolvedValueOnce({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [null, null, null, null, null, null],
      next_question_number: 6,
      coach_summary: null,
    })
    .mockResolvedValueOnce({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [null, null, null, null, null, null],
      next_question_number: null,
      coach_summary: null,
    });
  const completeMorningCheckin = vi
    .fn<PersonalJournalApiClient["completeMorningCheckin"]>()
    .mockResolvedValue({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "completed",
      answers: [null, null, null, null, null, null],
      next_question_number: null,
      coach_summary: null,
    });

  render(
    <HomeScreen
      apiClient={makeMockClient({
        getOrCreateMorningCheckin: async () => ({
          id: "checkin-1",
          browser_date: "2026-08-04",
          status: "unfinished",
          answers: [null, null, null, null, null, null],
          next_question_number: 1,
          coach_summary: null,
        }),
        saveMorningCheckinAnswer,
        completeMorningCheckin,
      })}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Morning Check-in starten" }),
  );
  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: "Atemuebung ueberspringen" }),
    ).toBeInTheDocument();
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Atemuebung ueberspringen" }),
  );

  for (let index = 0; index < 6; index += 1) {
    fireEvent.click(screen.getByRole("button", { name: /Antwort speichern/ }));
    await waitFor(() => {
      expect(saveMorningCheckinAnswer).toHaveBeenCalledTimes(index + 1);
    });
  }

  await waitFor(() => {
    expect(completeMorningCheckin).toHaveBeenCalledWith("checkin-1");
  });
  expect(
    screen.getByText(
      "Dein Daily Snapshot ist abgeschlossen und bleibt unveraenderlich.",
    ),
  ).toBeInTheDocument();
  expect(screen.getByText("Stimmung: Nicht angegeben")).toBeInTheDocument();
  expect(
    screen.getByText(
      "Für heute gibt es keine Zusammenfassung. Dein Daily Snapshot bleibt vollständig.",
    ),
  ).toBeInTheDocument();
  expect(screen.getAllByText("Keine Antwort")).toHaveLength(6);
});

test("shows an understandable processing state while completing a snapshot", async () => {
  let resolveCompletion:
    | ((
        response: Awaited<
          ReturnType<PersonalJournalApiClient["completeMorningCheckin"]>
        >,
      ) => void)
    | undefined;

  render(
    <HomeScreen
      apiClient={makeMockClient({
        getOrCreateMorningCheckin: async () => ({
          id: "checkin-1",
          browser_date: "2026-08-04",
          status: "unfinished",
          answers: [null, null, null, null, null, null],
          next_question_number: 6,
          coach_summary: null,
        }),
        saveMorningCheckinAnswer: async () => ({
          id: "checkin-1",
          browser_date: "2026-08-04",
          status: "unfinished",
          answers: [null, null, null, null, null, null],
          next_question_number: null,
          coach_summary: null,
        }),
        completeMorningCheckin: () =>
          new Promise((resolve) => {
            resolveCompletion = resolve;
          }),
      })}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Morning Check-in starten" }),
  );
  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: "Antwort speichern und weiter" }),
    ).toBeInTheDocument();
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Antwort speichern und weiter" }),
  );

  await waitFor(() => {
    expect(
      screen.getByText(
        "Dein Daily Snapshot wird verarbeitet. Einen Moment noch.",
      ),
    ).toHaveAttribute("role", "status");
    expect(
      screen.getByRole("button", {
        name: "Daily Snapshot wird abgeschlossen...",
      }),
    ).toBeDisabled();
  });

  await act(async () => {
    resolveCompletion?.({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "completed",
      answers: [null, null, null, null, null, null],
      next_question_number: null,
      coach_summary: null,
    });
  });
});

test("renders generated coach summary after completing final answer", async () => {
  const saveMorningCheckinAnswer = vi
    .fn<PersonalJournalApiClient["saveMorningCheckinAnswer"]>()
    .mockResolvedValueOnce({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [4, null, null, null, null, null],
      next_question_number: 2,
      coach_summary: null,
    })
    .mockResolvedValueOnce({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [4, "Dankbar", null, null, null, null],
      next_question_number: 3,
      coach_summary: null,
    })
    .mockResolvedValueOnce({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [4, "Dankbar", "Loslassen", null, null, null],
      next_question_number: 4,
      coach_summary: null,
    })
    .mockResolvedValueOnce({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [4, "Dankbar", "Loslassen", "Energie", null, null],
      next_question_number: 5,
      coach_summary: null,
    })
    .mockResolvedValueOnce({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [4, "Dankbar", "Loslassen", "Energie", "Kleinigkeit", null],
      next_question_number: 6,
      coach_summary: null,
    })
    .mockResolvedValueOnce({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "unfinished",
      answers: [
        4,
        "Dankbar",
        "Loslassen",
        "Energie",
        "Kleinigkeit",
        "Freundlich",
      ],
      next_question_number: null,
      coach_summary: null,
    });

  const completeMorningCheckin = vi
    .fn<PersonalJournalApiClient["completeMorningCheckin"]>()
    .mockResolvedValue({
      id: "checkin-1",
      browser_date: "2026-08-04",
      status: "completed",
      answers: [
        4,
        "Dankbar",
        "Loslassen",
        "Energie",
        "Kleinigkeit",
        "Freundlich",
      ],
      next_question_number: null,
      coach_summary: "Du startest klar und freundlich in den Tag.",
    });

  render(
    <HomeScreen
      apiClient={makeMockClient({
        getOrCreateMorningCheckin: async () => ({
          id: "checkin-1",
          browser_date: "2026-08-04",
          status: "unfinished",
          answers: [null, null, null, null, null, null],
          next_question_number: 1,
          coach_summary: null,
        }),
        saveMorningCheckinAnswer,
        completeMorningCheckin,
      })}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Morning Check-in starten" }),
  );
  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: "Atemuebung ueberspringen" }),
    ).toBeInTheDocument();
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Atemuebung ueberspringen" }),
  );

  fireEvent.click(screen.getByRole("radio", { name: /4 Gut/ }));
  fireEvent.click(screen.getByRole("button", { name: /Antwort speichern/ }));
  for (let index = 0; index < 5; index += 1) {
    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: `Frage ${index + 2} von 6`,
          level: 3,
        }),
      ).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText("Optionale Freitext-Antwort"), {
      target: { value: `Antwort ${index + 2}` },
    });
    fireEvent.click(screen.getByRole("button", { name: /Antwort speichern/ }));
  }

  await waitFor(() => {
    expect(completeMorningCheckin).toHaveBeenCalledWith("checkin-1");
  });
  expect(
    screen.getAllByText("Du startest klar und freundlich in den Tag."),
  ).toHaveLength(2);
});

test("renders personal journal entries newest first with mood and previews", async () => {
  render(
    <HomeScreen
      apiClient={makeMockClient({
        listPersonalJournalSnapshots: async () => [
          {
            id: "snapshot-2",
            browser_date: "2026-08-05",
            status: "completed",
            answers: [4, "Dankbar", null, "Energie", null, null],
            next_question_number: null,
            coach_summary: "Du bleibst auf einem guten Weg.",
          },
          {
            id: "snapshot-1",
            browser_date: "2026-08-04",
            status: "completed",
            answers: [null, "Only a short answer", null, null, null, null],
            next_question_number: null,
            coach_summary: null,
          },
        ],
      })}
    />,
  );

  await waitFor(() => {
    expect(
      screen.getByRole("article", { name: "Daily Snapshot vom 2026-08-05" }),
    ).toBeInTheDocument();
  });
  expect(
    screen.getByRole("article", { name: "Daily Snapshot vom 2026-08-04" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Stimmung 4 von 5 - Gut")).toBeInTheDocument();
  expect(screen.getByText("Stimmung nicht angegeben")).toBeInTheDocument();
  expect(screen.getByText("Only a short answer")).toBeInTheDocument();
  expect(
    screen.getByText("Du bleibst auf einem guten Weg."),
  ).toBeInTheDocument();
  const snapshots = screen
    .getAllByRole("article")
    .filter((article) =>
      article.getAttribute("aria-label")?.startsWith("Daily Snapshot vom "),
    );
  expect(
    snapshots.map((snapshot) => snapshot.getAttribute("aria-label")),
  ).toEqual(["Daily Snapshot vom 2026-08-05", "Daily Snapshot vom 2026-08-04"]);
});

test("shows a compact mood history for at most the ten most recent valid moods", async () => {
  render(
    <HomeScreen
      apiClient={makeMockClient({
        listPersonalJournalSnapshots: async () => [
          {
            id: "latest",
            browser_date: "2026-08-06",
            status: "completed",
            answers: [5, null, null, null, null, null],
            next_question_number: null,
            coach_summary: null,
          },
          {
            id: "second",
            browser_date: "2026-08-05",
            status: "completed",
            answers: [2, null, null, null, null, null],
            next_question_number: null,
            coach_summary: null,
          },
          ...Array.from({ length: 10 }, (_, index) => ({
            id: `older-${index}`,
            browser_date: `2026-07-${String(30 - index).padStart(2, "0")}`,
            status: "completed" as const,
            answers: [3, null, null, null, null, null],
            next_question_number: null,
            coach_summary: null,
          })),
        ],
      })}
    />,
  );

  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: "Dein Stimmungsverlauf", level: 3 }),
    ).toBeInTheDocument();
  });
  expect(
    screen.getByRole("list", { name: "Stimmungswerte der letzten Tage" }),
  ).toHaveTextContent("5 / 5");
  expect(
    screen.getByRole("list", { name: "Stimmungswerte der letzten Tage" }).children,
  ).toHaveLength(10);
});

test("distinguishes an empty journal from a journal loading error", async () => {
  const { rerender } = render(
    <HomeScreen apiClient={makeMockClient()} />,
  );

  await waitFor(() => {
    expect(screen.getByText("Noch keine Daily Snapshots vorhanden.")).toBeInTheDocument();
  });
  expect(
    screen.getAllByRole("button", { name: "Morning Check-in starten" }),
  ).toHaveLength(2);

  rerender(
    <HomeScreen
      apiClient={makeMockClient({
        listPersonalJournalSnapshots: async () => {
          throw new Error("unavailable");
        },
      })}
    />,
  );

  await waitFor(() => {
    expect(
      screen.getByRole("alert", {
        name: "",
      }),
    ).toHaveTextContent("Die Personal Journal Eintraege konnten nicht geladen werden.");
  });
  expect(screen.queryByText("Noch keine Daily Snapshots vorhanden.")).not.toBeInTheDocument();
});

test("downloads personal journal export through German action", async () => {
  const exportPersonalJournal = vi
    .fn<PersonalJournalApiClient["exportPersonalJournal"]>()
    .mockResolvedValue({
      snapshots: [
        {
          id: "snapshot-1",
          browser_date: "2026-08-04",
          status: "completed",
          answers: [null, "Dankbar", null, null, null, null],
          next_question_number: null,
          coach_summary: null,
        },
      ],
    });

  const createObjectURL = vi.fn(() => "blob:test-url");
  const revokeObjectURL = vi.fn();
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const clickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;

  const appendSpy = vi.spyOn(document.body, "appendChild");
  const removeSpy = vi.spyOn(document.body, "removeChild");

  try {
    render(
      <HomeScreen apiClient={makeMockClient({ exportPersonalJournal })} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Journal Export herunterladen" }),
    );

    await waitFor(() => {
      expect(exportPersonalJournal).toHaveBeenCalledTimes(1);
      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:test-url");
    });

    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  } finally {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    clickSpy.mockRestore();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
  }
});

test("keeps the export action available and reports its failure", async () => {
  render(
    <HomeScreen
      apiClient={makeMockClient({
        exportPersonalJournal: async () => {
          throw new Error("unavailable");
        },
      })}
    />,
  );

  const exportButton = screen.getByRole("button", {
    name: "Journal Export herunterladen",
  });
  fireEvent.click(exportButton);

  await waitFor(() => {
    expect(
      screen.getByRole("alert", {
        name: "",
      }),
    ).toHaveTextContent("Der Journal Export konnte nicht heruntergeladen werden.");
  });
  expect(exportButton).toBeEnabled();
});

test("shows an export loading state until the download is ready", async () => {
  let resolveExport: (value: { snapshots: [] }) => void;
  const exportPersonalJournal = vi.fn<PersonalJournalApiClient["exportPersonalJournal"]>(
    () =>
      new Promise((resolve) => {
        resolveExport = resolve;
      }),
  );
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const clickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
  URL.createObjectURL = vi.fn(() => "blob:test-url");
  URL.revokeObjectURL = vi.fn();

  try {
    render(
      <HomeScreen apiClient={makeMockClient({ exportPersonalJournal })} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Journal Export herunterladen" }),
    );

    expect(
      screen.getByRole("button", { name: "Journal Export wird vorbereitet..." }),
    ).toBeDisabled();

    await act(async () => {
      resolveExport!({ snapshots: [] });
    });
  } finally {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    clickSpy.mockRestore();
  }
});
