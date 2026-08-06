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

function breathingCue(secondsRemaining: number, totalDurationSeconds: number): { label: string; detail: string } {
  const elapsed = totalDurationSeconds - secondsRemaining;
  const cyclePosition = elapsed % BREATHING_CYCLE_SECONDS;
  if (cyclePosition < 4) {
    return { label: "Einatmen", detail: "4 Sekunden einatmen" };
  }
  return { label: "Ausatmen", detail: "6 Sekunden ausatmen" };
}

function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 11) {
    return "Guten Morgen";
  }
  if (hour < 18) {
    return "Guten Tag";
  }
  return "Guten Abend";
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
  const [isCompleting, setIsCompleting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [journalSnapshots, setJournalSnapshots] = useState<MorningCheckinResponse[]>([]);
  const [journalLoadError, setJournalLoadError] = useState<string | null>(null);
  const [journalExportError, setJournalExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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
    let isMounted = true;
    void apiClient
      .listPersonalJournalSnapshots()
      .then((snapshots) => {
        if (isMounted) {
          setJournalSnapshots(snapshots);
        }
      })
      .catch(() => {
        if (isMounted) {
          setJournalLoadError("Die Personal Journal Eintraege konnten nicht geladen werden.");
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
      setViewState(checkin.status === "unfinished" && checkin.next_question_number === 1 ? "breathing" : "questionnaire");
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

      if (updatedCheckin.next_question_number === null) {
        setIsCompleting(true);
        try {
          const completedCheckin = await apiClient.completeMorningCheckin(updatedCheckin.id);
          setActiveCheckin(completedCheckin);
          setCurrentQuestionNumber(completedCheckin.next_question_number);
        } finally {
          setIsCompleting(false);
        }
      }
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

  async function downloadJournalExport(): Promise<void> {
    setIsExporting(true);
    setJournalExportError(null);

    try {
      const exportPayload = await apiClient.exportPersonalJournal();
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "personal-journal-export.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setJournalExportError("Der Journal Export konnte nicht heruntergeladen werden.");
    } finally {
      setIsExporting(false);
    }
  }

  const activeCheckinId = activeCheckin?.id;
  const activeCheckinDate = activeCheckin?.browser_date;
  const today = todayDateProvider();
  const formattedDate = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(today);
  const progressLabel = currentQuestionNumber === null ? "Fragen abgeschlossen" : `Frage ${currentQuestionNumber} von ${QUESTION_COUNT}`;
  const currentPrompt =
    currentQuestionNumber === null ? "Alle sechs Fragen wurden bereits eingereicht." : QUESTIONS[currentQuestionNumber - 1];
  const isCompletedSnapshot = activeCheckin?.status === "completed";
  const currentBreathingCue = breathingCue(secondsRemaining, breathingDurationSeconds);

  return (
    <main>
      <div className="shell">
        <header className="hero">
          <p className="date-label">{formattedDate}</p>
          <h1 className="title">
            {greetingFor(today)}.
            <span>Nimm dir fuenf Minuten.</span>
          </h1>
          <p className="lead">
            Erst 30 Sekunden atmen, dann sechs ruhige Fragen. Am Ende steht dein Daily Snapshot mit
            Stimmung, Fokus und einer optionalen Coach Summary.
          </p>
        </header>

        <section className="section" aria-label="Morning Check-in">
          <div className="routine-card">
            <div className="routine-card-heading">
              <h2>Deine Routine fuer heute</h2>
              <p>Ein kurzer Moment fuer Dankbarkeit und Klarheit.</p>
            </div>

            {viewState === "start" ? (
              <>
                <button className="primary-action" type="button" onClick={() => void startMorningCheckin()} disabled={isStarting}>
                  {isStarting ? "Morning Check-in startet..." : "Morning Check-in starten"}
                  <span aria-hidden="true">→</span>
                </button>
                <div className="routine-facts" aria-label="Ablauf der Routine">
                  <span>30 s atmen</span>
                  <span>6 Fragen</span>
                  <span>1 Daily Snapshot</span>
                </div>
              </>
            ) : null}

            {viewState === "breathing" ? (
            <div className="breathing-card" aria-live="polite">
              <h3>Atemuebung</h3>
              <div className={`breath-orb ${currentBreathingCue.label === "Einatmen" ? "inhale" : "exhale"}`} aria-hidden="true" />
              <p className="breathing-cue">{currentBreathingCue.label}</p>
              <p className="breathing-detail">{currentBreathingCue.detail}</p>
              <p className="breathing-countdown">{secondsRemaining} Sekunden verbleibend</p>
              <progress
                aria-label="Fortschritt der Atemuebung"
                value={breathingDurationSeconds - secondsRemaining}
                max={breathingDurationSeconds}
              />
              <button type="button" onClick={skipBreathingExercise}>
                Atemuebung ueberspringen
              </button>
            </div>
          ) : null}

          {viewState === "questionnaire" ? (
            <div className="question-card">
              <h3>{progressLabel}</h3>
              {isCompletedSnapshot ? (
                <p>Dein Daily Snapshot ist abgeschlossen und bleibt unveraenderlich.</p>
              ) : (
                <p>{currentPrompt}</p>
              )}

              {isCompletedSnapshot ? (
                <div>
                  <p>Tagesdatum: {activeCheckin.browser_date}</p>
                  <p>Stimmung: {activeCheckin.answers[0] ?? "Nicht angegeben"}</p>
                  {activeCheckin.coach_summary ? <p>{activeCheckin.coach_summary}</p> : null}
                  <p>Antworten:</p>
                  <ol>
                    {activeCheckin.answers.map((answer, index) => (
                      <li key={index + 1}>{answer ?? "(leer)"}</li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {currentQuestionNumber !== null && !isCompletedSnapshot ? (
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

              {!isCompletedSnapshot ? (
                <button type="button" onClick={() => void restartCheckin()} disabled={isRestarting || isCompleting}>
                  {isRestarting ? "Starte neu..." : "Morning Check-in neu starten"}
                </button>
              ) : null}
              {isCompleting ? <p className="status">Daily Snapshot wird abgeschlossen...</p> : null}
              {questionError ? <p className="status">{questionError}</p> : null}
            </div>
          ) : null}

            {activeCheckinDate && activeCheckinId ? (
              <p className="status">Aktiver Morning Check-in: {activeCheckinDate}</p>
            ) : null}
            {startError ? <p className="status" role="alert">{startError}</p> : null}
          </div>
        </section>

        <section className="section" aria-label="Personal Journal">
          <h2>Personal Journal</h2>
          <button type="button" onClick={() => void downloadJournalExport()} disabled={isExporting}>
            {isExporting ? "Journal Export wird vorbereitet..." : "Journal Export herunterladen"}
          </button>
          {journalSnapshots.length === 0 && !journalLoadError ? <p>Noch keine Daily Snapshots vorhanden.</p> : null}
          {journalLoadError ? <p className="status">{journalLoadError}</p> : null}
          {journalExportError ? <p className="status">{journalExportError}</p> : null}
          {journalSnapshots.map((snapshot) => (
            <article key={snapshot.id} className="question-card">
              <h3>Daily Snapshot vom {snapshot.browser_date}</h3>
              <p>
                Stimmung: {snapshot.answers[0] === null || snapshot.answers[0] === undefined ? "Nicht angegeben" : snapshot.answers[0]}
              </p>
              <p>{snapshot.coach_summary ?? "Keine Coach Summary vorhanden."}</p>
              <p>Antworten:</p>
              <ol>
                {snapshot.answers.map((answer, index) => (
                  <li key={`${snapshot.id}-${index + 1}`}>{answer ?? "(leer)"}</li>
                ))}
              </ol>
            </article>
          ))}
        </section>

        <p className="status" role="status">
          {serviceStatus}
        </p>
        <p className="privacy-note">
          Fuer die optionale Coach Summary werden nur Antworten aus dem aktuellen Morning Check-in an
          OpenAI gesendet. Dein API-Key bleibt ausschliesslich im Backend.
        </p>
      </div>
    </main>
  );
}
