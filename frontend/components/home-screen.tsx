"use client";

import { useEffect, useState } from "react";
import React from "react";

import {
  createHttpPersonalJournalApiClient,
  type PersonalJournalApiClient,
} from "@/lib/api/client";

type HomeScreenProps = {
  apiClient?: PersonalJournalApiClient;
  todayDateProvider?: () => Date;
  breathingDurationSeconds?: number;
};

const defaultClient = createHttpPersonalJournalApiClient();
const BREATHING_DURATION_SECONDS = 30;
const BREATHING_CYCLE_SECONDS = 10;

function toBrowserDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function breathingCue(secondsRemaining: number, totalDurationSeconds: number): string {
  const elapsed = totalDurationSeconds - secondsRemaining;
  const cyclePosition = elapsed % BREATHING_CYCLE_SECONDS;
  if (cyclePosition < 4) {
    return "4 Sekunden einatmen";
  }
  return "6 Sekunden ausatmen";
}

export function HomeScreen({
  apiClient = defaultClient,
  todayDateProvider = () => new Date(),
  breathingDurationSeconds = BREATHING_DURATION_SECONDS,
}: HomeScreenProps) {
  const [serviceStatus, setServiceStatus] = useState("Verbinde mit dem Journal-Service...");
  const [viewState, setViewState] = useState<"start" | "breathing" | "question-one">("start");
  const [secondsRemaining, setSecondsRemaining] = useState(breathingDurationSeconds);
  const [activeCheckinId, setActiveCheckinId] = useState<string | null>(null);
  const [activeCheckinDate, setActiveCheckinDate] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    void apiClient
      .getHealth()
      .then(() => {
        if (isMounted) {
          setServiceStatus("Journal-Service bereit.");
        }
      })
      .catch(() => {
        if (isMounted) {
          setServiceStatus("Journal-Service momentan nicht erreichbar.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [apiClient]);

  useEffect(() => {
    if (viewState !== "breathing") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSecondsRemaining((previous) => {
        if (previous <= 1) {
          window.clearInterval(intervalId);
          setViewState("question-one");
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [viewState]);

  async function startMorningCheckin(): Promise<void> {
    setIsStarting(true);
    setStartError(null);
    const browserDate = toBrowserDate(todayDateProvider());

    try {
      const checkin = await apiClient.getOrCreateMorningCheckin(browserDate);
      setActiveCheckinId(checkin.id);
      setActiveCheckinDate(checkin.browser_date);
      setSecondsRemaining(breathingDurationSeconds);
      setViewState("breathing");
    } catch {
      setStartError("Der Morning Check-in konnte gerade nicht gestartet werden.");
    } finally {
      setIsStarting(false);
    }
  }

  function skipBreathingExercise(): void {
    setViewState("question-one");
    setSecondsRemaining(0);
  }

  return (
    <main>
      <div className="shell">
        <h1 className="title">Morning Coach</h1>
        <p className="lead">
          Dein privates Personal Journal fuer einen klaren Morning Check-in am heutigen Tag.
        </p>

        <p className="privacy-note">
          Hinweis: Fuer die optionale Coach Summary werden nur die Antworten deines aktuellen Morning
          Check-ins an OpenAI gesendet. Dein API-Key bleibt ausschliesslich im Backend.
        </p>

        <section className="section" aria-label="Morning Check-in">
          <h2>Morning Check-in</h2>

          {viewState === "start" ? (
            <>
              <p>Bereit fuer deine sechs Fragen mit Atemuebung als Einstieg.</p>
              <button type="button" onClick={() => void startMorningCheckin()} disabled={isStarting}>
                {isStarting ? "Morning Check-in startet..." : "Morning Check-in starten"}
              </button>
            </>
          ) : null}

          {viewState === "breathing" ? (
            <div className="breathing-card">
              <h3>Atemuebung</h3>
              <p>{breathingCue(secondsRemaining, breathingDurationSeconds)}</p>
              <p>{secondsRemaining} Sekunden verbleibend</p>
              <progress value={breathingDurationSeconds - secondsRemaining} max={breathingDurationSeconds} />
              <button type="button" onClick={skipBreathingExercise}>
                Atemuebung ueberspringen
              </button>
            </div>
          ) : null}

          {viewState === "question-one" ? (
            <div className="question-card">
              <h3>Frage 1 von 6</h3>
              <p>Wie fuehlst du dich heute Morgen auf einer Skala von 1 bis 5?</p>
            </div>
          ) : null}

          {activeCheckinDate && activeCheckinId ? (
            <p className="status">Aktiver Morning Check-in: {activeCheckinDate}</p>
          ) : null}
          {startError ? <p className="status">{startError}</p> : null}
        </section>

        <section className="section" aria-label="Personal Journal">
          <h2>Personal Journal</h2>
          <p>Hier siehst du spaeter deine Daily Snapshots in neuer Reihenfolge zuerst.</p>
        </section>

        <p className="status" role="status">
          {serviceStatus}
        </p>
      </div>
    </main>
  );
}
