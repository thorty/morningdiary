"use client";

import { useEffect, useState } from "react";
import React from "react";

import {
  createHttpPersonalJournalApiClient,
  type PersonalJournalApiClient,
} from "@/lib/api/client";
import type { MorningCheckinAnswer, MorningCheckinResponse } from "@/lib/api/types";

type HomeScreenProps = {
  apiClient?: PersonalJournalApiClient;
  todayDateProvider?: () => Date;
  breathingDurationSeconds?: number;
};

const defaultClient = createHttpPersonalJournalApiClient();
const BREATHING_DURATION_SECONDS = 30;
const BREATHING_CYCLE_SECONDS = 10;
const QUESTION_COUNT = 6;

const QUESTIONS = [
  "Wie fuehlst du dich heute Morgen auf einer Skala von 1 bis 5?",
  "Wofuer bist du heute dankbar?",
  "Was moechtest du heute bewusst loslassen?",
  "Was gibt dir heute Energie?",
  "Welche kleine Sache macht diesen Tag gut?",
  "Welche freundliche Absicht nimmst du in den Tag mit?",
];

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
  const [viewState, setViewState] = useState<"start" | "breathing" | "questionnaire">("start");
  const [secondsRemaining, setSecondsRemaining] = useState(breathingDurationSeconds);
  const [activeCheckin, setActiveCheckin] = useState<MorningCheckinResponse | null>(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number | null>(1);
  const [questionInput, setQuestionInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);

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
          setViewState("questionnaire");
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
      setActiveCheckin(checkin);
      setCurrentQuestionNumber(checkin.next_question_number);
      setSecondsRemaining(breathingDurationSeconds);
      setQuestionError(null);
      setViewState("breathing");
    } catch {
      setStartError("Der Morning Check-in konnte gerade nicht gestartet werden.");
    } finally {
      setIsStarting(false);
    }
  }

  function skipBreathingExercise(): void {
    setViewState("questionnaire");
    setSecondsRemaining(0);
  }

  useEffect(() => {
    if (!activeCheckin || currentQuestionNumber === null) {
      setQuestionInput("");
      return;
    }

    const answer = activeCheckin.answers[currentQuestionNumber - 1];
    if (answer === null || answer === undefined) {
      setQuestionInput("");
      return;
    }

    setQuestionInput(String(answer));
  }, [activeCheckin, currentQuestionNumber]);

  async function submitCurrentAnswer(): Promise<void> {
    if (!activeCheckin || currentQuestionNumber === null) {
      return;
    }

    let answerPayload: MorningCheckinAnswer = questionInput.trim();
    if (answerPayload === "") {
      answerPayload = null;
    }

    if (currentQuestionNumber === 1 && answerPayload !== null) {
      const parsedValue = Number(answerPayload);
      if (!Number.isInteger(parsedValue) || parsedValue < 1 || parsedValue > 5) {
        setQuestionError("Bitte gib fuer die Stimmung eine Zahl zwischen 1 und 5 ein.");
        return;
      }
      answerPayload = parsedValue;
    }

    setIsSaving(true);
    setQuestionError(null);

    try {
      const updatedCheckin = await apiClient.saveMorningCheckinAnswer(activeCheckin.id, {
        question_number: currentQuestionNumber,
        answer: answerPayload,
      });
      setActiveCheckin(updatedCheckin);
      setCurrentQuestionNumber(updatedCheckin.next_question_number);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Die Antwort konnte nicht gespeichert werden.";
      setQuestionError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function restartCheckin(): Promise<void> {
    if (!activeCheckin) {
      return;
    }

    setIsRestarting(true);
    setQuestionError(null);

    try {
      const restarted = await apiClient.restartMorningCheckin(activeCheckin.id);
      setActiveCheckin(restarted);
      setCurrentQuestionNumber(restarted.next_question_number);
      setQuestionInput("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Der Morning Check-in konnte nicht neu gestartet werden.";
      setQuestionError(message);
    } finally {
      setIsRestarting(false);
    }
  }

  const activeCheckinId = activeCheckin?.id;
  const activeCheckinDate = activeCheckin?.browser_date;
  const progressLabel = currentQuestionNumber === null ? "Fragen abgeschlossen" : `Frage ${currentQuestionNumber} von ${QUESTION_COUNT}`;
  const currentPrompt =
    currentQuestionNumber === null ? "Alle sechs Fragen wurden bereits eingereicht." : QUESTIONS[currentQuestionNumber - 1];

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

          {viewState === "questionnaire" ? (
            <div className="question-card">
              <h3>{progressLabel}</h3>
              <p>{currentPrompt}</p>

              {currentQuestionNumber !== null ? (
                <>
                  <label htmlFor="question-input">
                    {currentQuestionNumber === 1
                      ? "Optionale Stimmung (1 bis 5)"
                      : "Optionale Freitext-Antwort"}
                  </label>
                  <input
                    id="question-input"
                    name="question-input"
                    type={currentQuestionNumber === 1 ? "number" : "text"}
                    min={currentQuestionNumber === 1 ? 1 : undefined}
                    max={currentQuestionNumber === 1 ? 5 : undefined}
                    value={questionInput}
                    onChange={(event) => setQuestionInput(event.target.value)}
                  />
                  <button type="button" onClick={() => void submitCurrentAnswer()} disabled={isSaving}>
                    {isSaving ? "Antwort wird gespeichert..." : "Antwort speichern und weiter"}
                  </button>
                </>
              ) : null}

              <button type="button" onClick={() => void restartCheckin()} disabled={isRestarting}>
                {isRestarting ? "Starte neu..." : "Morning Check-in neu starten"}
              </button>
              {questionError ? <p className="status">{questionError}</p> : null}
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
