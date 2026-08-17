import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { AppAccessProvider } from "@/components/app-entry";
import { HomePage } from "@/components/home-page";
import { MorningCheckinPage } from "@/components/morning-checkin-page";
import { PersonalJournalPage } from "@/components/personal-journal-page";
import type { PersonalJournalApiClient } from "@/lib/api/client";
import type { MorningCheckinAnswer, MorningCheckinResponse } from "@/lib/api/types";
import type { UserProfile, UserProfileStore } from "@/lib/user-profile-store";
import { createLocalPersonalJournalApiClient } from "@/lib/api/default-client";
import { createBrowserLocalPersonalJournalStore } from "@/lib/personal-journal-store";
import { MemoryStorage } from "@/tests/support/memory-storage";

const date = "2026-08-04";
const profile: UserProfile = {
  name: "Mara",
  pin: "1234",
  securityChallengeQuestion: "Wie heißt mein Hund?",
  securityChallengeAnswer: "Flocke",
};
const initialCheckin: MorningCheckinResponse = {
  id: "today",
  browser_date: date,
  status: "unfinished",
  answers: [null, null, null, null, null, null],
  next_question_number: 1,
  coach_summary: null,
};
let checkin: MorningCheckinResponse;

beforeEach(() => {
  checkin = { ...initialCheckin, answers: [...initialCheckin.answers] };
  delete document.documentElement.dataset.theme;
});

function client(): PersonalJournalApiClient {
  return {
    getHealth: async () => ({ status: "ok" }),
    getOrCreateMorningCheckin: async () => checkin,
    saveMorningCheckinAnswer: async (_, { question_number, answer }) => {
      const answers = [...checkin.answers] as MorningCheckinAnswer[];
      answers[question_number - 1] = answer;
      checkin = {
        ...checkin,
        answers,
        next_question_number: question_number === 6 ? null : question_number + 1,
      };
      return checkin;
    },
    restartMorningCheckin: async () => checkin,
    completeMorningCheckin: async () => {
      checkin = { ...checkin, status: "completed", next_question_number: null };
      return checkin;
    },
    listPersonalJournalSnapshots: async () =>
      checkin.status === "completed" ? [checkin] : [],
    exportPersonalJournal: async () => ({ snapshots: [] }),
    deletePersonalJournal: async () => undefined,
  };
}

function profileStore(): UserProfileStore {
  return {
    load: () => profile,
    save: () => undefined,
    clear: () => undefined,
  };
}

test("takes a person from the start page through a Morning Check-in into their Personal Journal", async () => {
  const apiClient = client();
  const todayDateProvider = () => new Date("2026-08-04T12:00:00");
  const { unmount } = render(<HomePage apiClient={apiClient} todayDateProvider={todayDateProvider} />);

  expect(await screen.findByRole("link", { name: "Check-in starten" })).toHaveAttribute("href", "/check-in");
  unmount();

  const checkinPage = render(<MorningCheckinPage apiClient={apiClient} todayDateProvider={todayDateProvider} />);
  fireEvent.click(await screen.findByRole("button", { name: "Breathing Exercise überspringen" }));

  for (let question = 1; question <= 6; question += 1) {
    if (question === 1) fireEvent.click(screen.getByRole("radio", { name: "4 Gut" }));
    else fireEvent.change(screen.getByLabelText("Freitext-Antwort"), { target: { value: `Antwort ${question}` } });
    fireEvent.click(screen.getByRole("button", { name: "Antwort speichern und weiter" }));
    if (question < 6) await screen.findByRole("heading", { name: `Frage ${question + 1} von 6`, level: 3 });
  }

  expect(await screen.findByText("Dein Daily Snapshot ist abgeschlossen und bleibt unveränderlich.")).toBeInTheDocument();
  checkinPage.unmount();

  render(<PersonalJournalPage apiClient={apiClient} />);
  await waitFor(() => expect(screen.getByRole("article", { name: "Daily Snapshot vom 2026-08-04" })).toBeInTheDocument());
  expect(screen.getByRole("link", { name: "Zur Startseite" })).toHaveAttribute("href", "/");
});

test("returns through the lock screen after logging out and unlocking again", async () => {
  const apiClient = client();
  render(
    <AppAccessProvider profileStore={profileStore()}>
      <HomePage apiClient={apiClient} todayDateProvider={() => new Date("2026-08-04T12:00:00")} />
    </AppAccessProvider>,
  );

  fireEvent.change(await screen.findByLabelText("PIN"), { target: { value: profile.pin } });
  fireEvent.click(screen.getByRole("button", { name: "Entsperren" }));
  fireEvent.click(await screen.findByRole("button", { name: "Einstellungen" }));
  fireEvent.click(screen.getByRole("button", { name: "Abmelden" }));

  expect(await screen.findByRole("heading", { name: "Willkommen zurück, Mara" })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("PIN"), { target: { value: profile.pin } });
  fireEvent.click(screen.getByRole("button", { name: "Entsperren" }));
  expect(await screen.findByRole("heading", { name: /Guten (Morgen|Tag|Abend)\./ })).toBeInTheDocument();
});

test("shows the interactive p5.js breathing animation", async () => {
  render(<MorningCheckinPage apiClient={client()} todayDateProvider={() => new Date("2026-08-04T12:00:00")} />);

  expect(await screen.findByRole("img", { name: "Interaktive Atemanimation" })).toBeInTheDocument();
});

test("restores an autosaved response after the Morning Check-in remounts", async () => {
  const storage = new MemoryStorage();
  const apiClient = createLocalPersonalJournalApiClient(
    createBrowserLocalPersonalJournalStore(storage, () => "local-checkin"),
  );
  const todayDateProvider = () => new Date("2026-08-04T12:00:00");

  const firstPage = render(
    <MorningCheckinPage apiClient={apiClient} todayDateProvider={todayDateProvider} />,
  );
  fireEvent.click(await screen.findByRole("button", { name: "Breathing Exercise überspringen" }));
  fireEvent.click(screen.getByRole("radio", { name: "4 Gut" }));
  fireEvent.click(screen.getByRole("button", { name: "Antwort speichern und weiter" }));
  expect(await screen.findByRole("heading", { name: "Frage 2 von 6", level: 3 })).toBeInTheDocument();

  firstPage.unmount();
  render(<MorningCheckinPage apiClient={apiClient} todayDateProvider={todayDateProvider} />);

  expect(await screen.findByRole("heading", { name: "Frage 2 von 6", level: 3 })).toBeInTheDocument();
  expect(screen.getByText("Aktiver Morning Check-in: 2026-08-04")).toBeInTheDocument();
});
