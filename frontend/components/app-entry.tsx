"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

import { HomePage } from "@/components/home-page";
import type { UserProfile, UserProfileStore } from "@/lib/user-profile-store";
import { localStorageUserProfileStore } from "@/lib/user-profile-store";

type AppEntryProps = {
  profileStore?: UserProfileStore;
  children: React.ReactNode;
};

type AppAccess = {
  logout(): void;
};

const accessContext = createContext<AppAccess | null>(null);

export function AppAccessProvider({ profileStore = localStorageUserProfileStore, children }: AppEntryProps) {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  useEffect(() => {
    setProfile(profileStore.load());
  }, [profileStore]);

  if (profile === undefined) {
    return <main><div className="shell"><p className="status">Morning Coach wird geladen...</p></div></main>;
  }

  if (profile === null) {
    return <Onboarding onComplete={(savedProfile) => {
      profileStore.save(savedProfile);
      setProfile(savedProfile);
      setHasActiveSession(true);
    }} />;
  }

  if (!hasActiveSession) {
    return (
      <LockScreen
        profile={profile}
        onUnlock={() => setHasActiveSession(true)}
        onPinReset={(updatedProfile) => {
          profileStore.save(updatedProfile);
          setProfile(updatedProfile);
          setHasActiveSession(true);
        }}
      />
    );
  }

  return <accessContext.Provider value={{ logout: () => setHasActiveSession(false) }}>{children}</accessContext.Provider>;
}

export function RootPage({ profileStore }: { profileStore?: UserProfileStore }) {
  const isInsideAccessProvider = useContext(accessContext);
  if (profileStore) return <AppAccessProvider profileStore={profileStore}><HomePage /></AppAccessProvider>;
  if (isInsideAccessProvider) return <HomePage />;
  return <AppAccessProvider><HomePage /></AppAccessProvider>;
}

export function useAppAccess(): AppAccess {
  const access = useContext(accessContext);
  return access ?? { logout: () => undefined };
}

function LockScreen({
  profile,
  onUnlock,
  onPinReset,
}: {
  profile: UserProfile;
  onUnlock: () => void;
  onPinReset: (profile: UserProfile) => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isResettingPin, setIsResettingPin] = useState(false);

  function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pin === profile.pin) {
      onUnlock();
      return;
    }
    setPin("");
    setError("Die PIN ist nicht korrekt. Bitte versuche es erneut.");
  }

  if (isResettingPin) {
    return <PinReset profile={profile} onComplete={onPinReset} onCancel={() => setIsResettingPin(false)} />;
  }

  return (
    <main>
      <div className="shell entry-shell">
        <section className="entry-card" aria-labelledby="lock-screen-title">
          <p className="date-label">Morning Coach</p>
          <h1 className="title" id="lock-screen-title">Willkommen zurück, {profile.name}</h1>
          <p className="lead">Bitte entsperre dein Profil, um deinen Morning Coach zu öffnen.</p>
          <form onSubmit={unlock}>
            <label className="entry-label" htmlFor="unlock-pin">PIN</label>
            <input autoFocus className="entry-input" id="unlock-pin" inputMode="numeric" onChange={(event) => setPin(event.target.value)} type="password" value={pin} />
            {error ? <p className="status" role="alert">{error}</p> : null}
            <button className="primary-action entry-action" type="submit">Entsperren</button>
          </form>
          <a className="entry-link" href="#pin-reset" onClick={(event) => { event.preventDefault(); setError(null); setIsResettingPin(true); }}>PIN zurücksetzen</a>
        </section>
      </div>
    </main>
  );
}

function PinReset({
  profile,
  onComplete,
  onCancel,
}: {
  profile: UserProfile;
  onComplete: (profile: UserProfile) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<"challenge" | "new-pin">("challenge");
  const [answer, setAnswer] = useState("");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function verifyAnswer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (answer.trim().toLocaleLowerCase() !== profile.securityChallengeAnswer.trim().toLocaleLowerCase()) {
      setAnswer("");
      setError("Die Antwort ist nicht korrekt. Bitte versuche es erneut.");
      return;
    }
    setError(null);
    setStep("new-pin");
  }

  function saveNewPin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const updatedProfile = { ...profile, pin: newPin.trim() };
    onComplete(updatedProfile);
  }

  return (
    <main>
      <div className="shell entry-shell">
        <section className="entry-card" aria-labelledby="pin-reset-title">
          {step === "challenge" ? (
            <form onSubmit={verifyAnswer}>
              <h1 className="entry-heading" id="pin-reset-title">PIN zurücksetzen</h1>
              <p className="lead">{profile.securityChallengeQuestion}</p>
              <label className="entry-label" htmlFor="reset-answer">Antwort</label>
              <input autoFocus className="entry-input" id="reset-answer" onChange={(event) => setAnswer(event.target.value)} value={answer} />
              {error ? <p className="status" role="alert">{error}</p> : null}
              <button className="primary-action entry-action" type="submit">Antwort prüfen</button>
            </form>
          ) : (
            <form onSubmit={saveNewPin}>
              <h1 className="entry-heading" id="pin-reset-title">Neue PIN festlegen</h1>
              <label className="entry-label" htmlFor="new-pin">Neue PIN</label>
              <input autoFocus className="entry-input" id="new-pin" inputMode="numeric" onChange={(event) => setNewPin(event.target.value)} type="password" value={newPin} />
              <button className="primary-action entry-action" type="submit">PIN speichern</button>
            </form>
          )}
          <a className="entry-link" href="#lock-screen" onClick={(event) => { event.preventDefault(); onCancel(); }}>Zurück zur PIN-Eingabe</a>
        </section>
      </div>
    </main>
  );
}

function Onboarding({ onComplete }: { onComplete: (profile: UserProfile) => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);

  function showProfileSetup() {
    setError(null);
    setStep(2);
  }

  function moveToSecurityChallenge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !pin.trim()) {
      setError("Bitte gib deinen Namen und eine PIN ein.");
      return;
    }
    setError(null);
    setStep(3);
  }

  function finishOnboarding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setError("Bitte fülle deine Security Challenge und Antwort aus.");
      return;
    }
    onComplete({
      name: name.trim(),
      pin: pin.trim(),
      securityChallengeQuestion: question.trim(),
      securityChallengeAnswer: answer.trim(),
    });
  }

  return (
    <main>
      <div className="shell entry-shell">
        <section className="entry-card onboarding-card" aria-labelledby="onboarding-title">
          <p className="date-label">Schritt {step} von 3</p>
          {step === 1 ? (
            <>
              <h1 className="title" id="onboarding-title">Willkommen beim Morning Diary.</h1>
              <p className="lead">Ein ruhiger, persönlicher Moment für deinen Start in den Tag. Deine Antworten bleiben in deinem persönlichen Journal.</p>
              <p className="privacy-note">Deine App-Daten werden lokal in diesem Browser-Profil gespeichert und nicht automatisch zwischen Browsern oder Geräten synchronisiert. Für die Coach Summary werden Antworten anonym an OpenAI gesendet. Du kannst diese Funktion jederzeit in den Einstellungen deaktivieren.</p>
              <button className="primary-action entry-action" onClick={showProfileSetup} type="button">Weiter</button>
            </>
          ) : step === 2 ? (
            <form onSubmit={moveToSecurityChallenge}>
              <h1 className="entry-heading" id="onboarding-title">Richte dein Profil ein.</h1>
              <p className="lead">Dein Name und deine PIN werden lokal auf diesem Gerät gespeichert.</p>
              <label className="entry-label" htmlFor="profile-name">Name</label>
              <input className="entry-input" id="profile-name" onChange={(event) => setName(event.target.value)} value={name} />
              <label className="entry-label" htmlFor="profile-pin">PIN</label>
              <input className="entry-input" id="profile-pin" inputMode="numeric" onChange={(event) => setPin(event.target.value)} type="password" value={pin} />
              {error ? <p className="status" role="alert">{error}</p> : null}
              <button className="primary-action entry-action" type="submit">Weiter zur Sicherheitsfrage</button>
            </form>
          ) : (
            <form onSubmit={finishOnboarding}>
              <h1 className="entry-heading" id="onboarding-title">Deine Security Challenge.</h1>
              <p className="lead">Wähle eine Frage, deren Antwort nur du kennst.</p>
              <label className="entry-label" htmlFor="security-question">Security Challenge</label>
              <input className="entry-input" id="security-question" onChange={(event) => setQuestion(event.target.value)} value={question} />
              <label className="entry-label" htmlFor="security-answer">Antwort</label>
              <input className="entry-input" id="security-answer" onChange={(event) => setAnswer(event.target.value)} value={answer} />
              {error ? <p className="status" role="alert">{error}</p> : null}
              <button className="primary-action entry-action" type="submit">Morning Coach starten</button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
