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
    coach_summary: null,
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
    coach_summary: null,
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
      coach_summary: null,
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
            coach_summary: null,
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
            coach_summary: null,
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
            coach_summary: null,
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
    coach_summary: null,
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
            coach_summary: null,
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

test("renders immutable completed daily snapshot when resumed as completed", async () => {
  render(
    <HomeScreen
      apiClient={
        makeMockClient({
          getOrCreateMorningCheckin: async () => ({
            id: "checkin-1",
            browser_date: "2026-08-04",
            status: "completed",
            answers: [3, "Dankbar", null, "Energie", null, null],
            next_question_number: null,
            coach_summary: "Bleib heute freundlich mit dir.",
          }),
        })
      }
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Morning Check-in starten" }));
  await waitFor(() => {
    expect(screen.getByText("Dein Daily Snapshot ist abgeschlossen und bleibt unveraenderlich.")).toBeInTheDocument();
  });

  expect(screen.getByText("Tagesdatum: 2026-08-04")).toBeInTheDocument();
  expect(screen.getByText("Stimmung: 3")).toBeInTheDocument();
  expect(screen.getByText("Bleib heute freundlich mit dir.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Morning Check-in neu starten" })).not.toBeInTheDocument();
});

test("shows fallback note when completed snapshot has no generated summary", async () => {
  render(
    <HomeScreen
      apiClient={
        makeMockClient({
          getOrCreateMorningCheckin: async () => ({
            id: "checkin-1",
            browser_date: "2026-08-04",
            status: "completed",
            answers: [null, "Only a short answer", null, null, null, null],
            next_question_number: null,
            coach_summary: "Deine Zusammenfassung konnte heute nicht erstellt werden.",
          }),
        })
      }
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Morning Check-in starten" }));
  await waitFor(() => {
    expect(screen.getByText("Deine Zusammenfassung konnte heute nicht erstellt werden.")).toBeInTheDocument();
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
  const completeMorningCheckin = vi.fn<PersonalJournalApiClient["completeMorningCheckin"]>().mockResolvedValue({
    id: "checkin-1",
    browser_date: "2026-08-04",
    status: "completed",
    answers: [null, null, null, null, null, null],
    next_question_number: null,
    coach_summary: null,
  });

  render(
    <HomeScreen
      apiClient={
        makeMockClient({
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
        })
      }
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Morning Check-in starten" }));
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Atemuebung ueberspringen" })).toBeInTheDocument();
  });
  fireEvent.click(screen.getByRole("button", { name: "Atemuebung ueberspringen" }));

  for (let index = 0; index < 6; index += 1) {
    fireEvent.click(screen.getByRole("button", { name: /Antwort speichern/ }));
    await waitFor(() => {
      expect(saveMorningCheckinAnswer).toHaveBeenCalledTimes(index + 1);
    });
  }

  await waitFor(() => {
    expect(completeMorningCheckin).toHaveBeenCalledWith("checkin-1");
  });
  expect(screen.getByText("Dein Daily Snapshot ist abgeschlossen und bleibt unveraenderlich.")).toBeInTheDocument();
  expect(screen.getByText("Stimmung: Nicht angegeben")).toBeInTheDocument();
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
      answers: [4, "Dankbar", "Loslassen", "Energie", "Kleinigkeit", "Freundlich"],
      next_question_number: null,
      coach_summary: null,
    });

  const completeMorningCheckin = vi.fn<PersonalJournalApiClient["completeMorningCheckin"]>().mockResolvedValue({
    id: "checkin-1",
    browser_date: "2026-08-04",
    status: "completed",
    answers: [4, "Dankbar", "Loslassen", "Energie", "Kleinigkeit", "Freundlich"],
    next_question_number: null,
    coach_summary: "Du startest klar und freundlich in den Tag.",
  });

  render(
    <HomeScreen
      apiClient={
        makeMockClient({
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
        })
      }
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Morning Check-in starten" }));
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Atemuebung ueberspringen" })).toBeInTheDocument();
  });
  fireEvent.click(screen.getByRole("button", { name: "Atemuebung ueberspringen" }));

  fireEvent.change(screen.getByLabelText("Optionale Stimmung (1 bis 5)"), { target: { value: "4" } });
  fireEvent.click(screen.getByRole("button", { name: /Antwort speichern/ }));
  for (let index = 0; index < 5; index += 1) {
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: `Frage ${index + 2} von 6`, level: 3 })).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText("Optionale Freitext-Antwort"), {
      target: { value: `Antwort ${index + 2}` },
    });
    fireEvent.click(screen.getByRole("button", { name: /Antwort speichern/ }));
  }

  await waitFor(() => {
    expect(completeMorningCheckin).toHaveBeenCalledWith("checkin-1");
  });
  expect(screen.getByText("Du startest klar und freundlich in den Tag.")).toBeInTheDocument();
});

test("renders personal journal snapshots newest first with and without summary", async () => {
  render(
    <HomeScreen
      apiClient={
        makeMockClient({
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
        })
      }
    />,
  );

  await waitFor(() => {
    expect(screen.getByText("Daily Snapshot vom 2026-08-05")).toBeInTheDocument();
  });
  expect(screen.getByText("Daily Snapshot vom 2026-08-04")).toBeInTheDocument();
  expect(screen.getByText("Stimmung: 4")).toBeInTheDocument();
  expect(screen.getByText("Stimmung: Nicht angegeben")).toBeInTheDocument();
  expect(screen.getByText("Only a short answer")).toBeInTheDocument();
  expect(screen.getByText("Du bleibst auf einem guten Weg.")).toBeInTheDocument();
  expect(screen.getByText("Keine Coach Summary vorhanden.")).toBeInTheDocument();

  const headings = screen.getAllByRole("heading", { level: 3 });
  const journalHeadings = headings.filter((heading) =>
    heading.textContent?.startsWith("Daily Snapshot vom "),
  );
  expect(journalHeadings.map((heading) => heading.textContent)).toEqual([
    "Daily Snapshot vom 2026-08-05",
    "Daily Snapshot vom 2026-08-04",
  ]);
});

test("downloads personal journal export through German action", async () => {
  const exportPersonalJournal = vi.fn<PersonalJournalApiClient["exportPersonalJournal"]>().mockResolvedValue({
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
  const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;

  const appendSpy = vi.spyOn(document.body, "appendChild");
  const removeSpy = vi.spyOn(document.body, "removeChild");

  try {
    render(<HomeScreen apiClient={makeMockClient({ exportPersonalJournal })} />);

    fireEvent.click(screen.getByRole("button", { name: "Journal Export herunterladen" }));

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
