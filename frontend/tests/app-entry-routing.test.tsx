import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { AppAccessProvider, RootPage } from "@/components/app-entry";
import type { UserProfile, UserProfileStore } from "@/lib/user-profile-store";

const client = vi.hoisted(() => ({
  getOrCreateMorningCheckin: vi.fn(async () => ({
    id: "today",
    browser_date: "2026-08-15",
    status: "unfinished" as const,
    answers: [null, null, null, null, null, null],
    next_question_number: 1,
    coach_summary: null,
  })),
  listPersonalJournalSnapshots: vi.fn(async () => []),
}));

vi.mock("@/lib/api/default-client", () => ({
  defaultPersonalJournalApiClient: client,
}));

const profile: UserProfile = {
  name: "Mara",
  pin: "1234",
  securityChallengeQuestion: "Wie heißt mein Hund?",
  securityChallengeAnswer: "Flocke",
};

function makeStore(storedProfile: UserProfile | null): UserProfileStore {
  let currentProfile = storedProfile;
  return {
    load: vi.fn(() => currentProfile),
    save: vi.fn((nextProfile: UserProfile) => { currentProfile = nextProfile; }),
    clear: vi.fn(),
  };
}

test("a new user completes onboarding and reaches Home with an active session", async () => {
  const store = makeStore(null);

  render(<RootPage profileStore={store} />);

  expect(await screen.findByRole("heading", { name: "Willkommen bei Morning Coach." })).toBeInTheDocument();
  expect(screen.getByText(/App-Daten werden lokal/i)).toBeInTheDocument();
  expect(screen.getByText(/anonym an OpenAI gesendet/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Mara" } });
  fireEvent.change(screen.getByLabelText("PIN"), { target: { value: "1234" } });
  fireEvent.click(screen.getByRole("button", { name: "Weiter zur Sicherheitsfrage" }));

  fireEvent.change(screen.getByLabelText("Security Challenge"), {
    target: { value: profile.securityChallengeQuestion },
  });
  fireEvent.change(screen.getByLabelText("Antwort"), {
    target: { value: profile.securityChallengeAnswer },
  });
  fireEvent.click(screen.getByRole("button", { name: "Morning Coach starten" }));

  expect(store.save).toHaveBeenCalledWith(profile);
  expect(await screen.findByRole("heading", { name: /Guten (Morgen|Tag|Abend)\./ })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Dein Profil ist gesperrt" })).not.toBeInTheDocument();
});

test("a stored profile without an active session shows the lock screen", async () => {
  render(<RootPage profileStore={makeStore(profile)} />);

  expect(await screen.findByRole("heading", { name: "Dein Profil ist gesperrt." })).toBeInTheDocument();
  expect(screen.getByText(/Bitte entsperre dein Profil/i)).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Willkommen bei Morning Coach" })).not.toBeInTheDocument();
});

test("the shared access gate hides protected route content until a profile is active", async () => {
  render(
    <AppAccessProvider profileStore={makeStore(profile)}>
      <p>Geschützter Inhalt</p>
    </AppAccessProvider>,
  );

  expect(await screen.findByRole("heading", { name: "Dein Profil ist gesperrt." })).toBeInTheDocument();
  expect(screen.queryByText("Geschützter Inhalt")).not.toBeInTheDocument();
});

test("the active session remains available to nested route content", async () => {
  const store = makeStore(null);

  render(
    <AppAccessProvider profileStore={store}>
      <p>Geschützter Inhalt</p>
    </AppAccessProvider>,
  );

  fireEvent.click(await screen.findByRole("button", { name: "Weiter" }));
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Mara" } });
  fireEvent.change(screen.getByLabelText("PIN"), { target: { value: "1234" } });
  fireEvent.click(screen.getByRole("button", { name: "Weiter zur Sicherheitsfrage" }));
  fireEvent.change(screen.getByLabelText("Security Challenge"), { target: { value: "Frage?" } });
  fireEvent.change(screen.getByLabelText("Antwort"), { target: { value: "Antwort" } });
  fireEvent.click(screen.getByRole("button", { name: "Morning Coach starten" }));

  expect(await screen.findByText("Geschützter Inhalt")).toBeInTheDocument();
});

test("refreshing the app resets the active session to the lock screen", async () => {
  const store = makeStore(profile);
  const { unmount } = render(
    <AppAccessProvider profileStore={store}>
      <p>Geschützter Inhalt</p>
    </AppAccessProvider>,
  );

  expect(await screen.findByRole("heading", { name: "Dein Profil ist gesperrt." })).toBeInTheDocument();
  unmount();

  render(
    <AppAccessProvider profileStore={store}>
      <p>Geschützter Inhalt</p>
    </AppAccessProvider>,
  );

  expect(await screen.findByRole("heading", { name: "Dein Profil ist gesperrt." })).toBeInTheDocument();
  expect(screen.queryByText("Geschützter Inhalt")).not.toBeInTheDocument();
});
