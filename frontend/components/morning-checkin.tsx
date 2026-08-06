"use client";

import { useEffect, useState } from "react";
import React from "react";

import { DailySnapshot, MOOD_LABELS } from "@/components/daily-snapshot";
import type { PersonalJournalApiClient } from "@/lib/api/client";
import type {
  MorningCheckinAnswer,
  MorningCheckinResponse,
} from "@/lib/api/types";

const BREATHING_DURATION_SECONDS = 30;
const BREATHING_CYCLE_SECONDS = 10;
const QUESTION_COUNT = 6;
const ACTIVE_CHECKIN_DATE_KEY = "morning-coach.active-checkin-date";

const QUESTIONS = [
  "Wie fuehlst du dich heute Morgen auf einer Skala von 1 bis 5?",
  "Wofuer bist du heute dankbar?",
  "Was moechtest du heute bewusst loslassen?",
  "Was gibt dir heute Energie?",
  "Welche kleine Sache macht diesen Tag gut?",
  "Welche freundliche Absicht nimmst du in den Tag mit?",
];

type MorningCheckinProps = {
  apiClient: PersonalJournalApiClient;
  todayDateProvider: () => Date;
  breathingDurationSeconds?: number;
  onSnapshotCompleted: (snapshot: MorningCheckinResponse) => void;
  startCheckinRequest: number;
};

function toBrowserDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function breathingCue(secondsRemaining: number, totalDurationSeconds: number) {
  const cyclePosition =
    (totalDurationSeconds - secondsRemaining) % BREATHING_CYCLE_SECONDS;
  return cyclePosition < 4
    ? { label: "Einatmen", detail: "4 Sekunden einatmen" }
    : { label: "Ausatmen", detail: "6 Sekunden ausatmen" };
}

export function MorningCheckin({
  apiClient,
  todayDateProvider,
  breathingDurationSeconds = BREATHING_DURATION_SECONDS,
  onSnapshotCompleted,
  startCheckinRequest,
}: MorningCheckinProps) {
  const [viewState, setViewState] = useState<
    "start" | "breathing" | "questionnaire"
  >("start");
  const [secondsRemaining, setSecondsRemaining] = useState(
    breathingDurationSeconds,
  );
  const [activeCheckin, setActiveCheckin] =
    useState<MorningCheckinResponse | null>(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<
    number | null
  >(1);
  const [questionInput, setQuestionInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldResume, setShouldResume] = useState(false);

  const browserDate = toBrowserDate(todayDateProvider());

  function showCheckin(checkin: MorningCheckinResponse): void {
    setActiveCheckin(checkin);
    setCurrentQuestionNumber(checkin.next_question_number);
    setSecondsRemaining(breathingDurationSeconds);
    setViewState(
      checkin.status === "unfinished" && checkin.next_question_number === 1
        ? "breathing"
        : "questionnaire",
    );

    if (checkin.status === "unfinished") {
      window.localStorage.setItem(
        ACTIVE_CHECKIN_DATE_KEY,
        checkin.browser_date,
      );
    } else {
      window.localStorage.removeItem(ACTIVE_CHECKIN_DATE_KEY);
    }
  }

  async function startMorningCheckin(isResuming = false): Promise<void> {
    setIsStarting(true);
    setError(null);
    try {
      showCheckin(await apiClient.getOrCreateMorningCheckin(browserDate));
      setShouldResume(false);
    } catch {
      setShouldResume(isResuming);
      setError(
        isResuming
          ? "Der Morning Check-in konnte gerade nicht fortgesetzt werden."
          : "Der Morning Check-in konnte gerade nicht gestartet werden.",
      );
    } finally {
      setIsStarting(false);
    }
  }

  useEffect(() => {
    if (window.localStorage.getItem(ACTIVE_CHECKIN_DATE_KEY) === browserDate) {
      setShouldResume(true);
      void startMorningCheckin(true);
    }
    // The browser date determines whether a persisted routine may be resumed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiClient, browserDate]);

  useEffect(() => {
    if (startCheckinRequest > 0) void startMorningCheckin(shouldResume);
    // The parent issues an explicit request from another page section.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startCheckinRequest]);

  useEffect(() => {
    if (viewState !== "breathing") return;
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
    return () => window.clearInterval(intervalId);
  }, [viewState]);

  useEffect(() => {
    if (!activeCheckin || currentQuestionNumber === null) {
      setQuestionInput("");
      return;
    }
    const answer = activeCheckin.answers[currentQuestionNumber - 1];
    setQuestionInput(
      answer === null || answer === undefined ? "" : String(answer),
    );
  }, [activeCheckin, currentQuestionNumber]);

  async function completeCheckin(checkinId: string): Promise<void> {
    setIsCompleting(true);
    setError(null);
    try {
      const completed = await apiClient.completeMorningCheckin(checkinId);
      showCheckin(completed);
      onSnapshotCompleted(completed);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Der Daily Snapshot konnte nicht abgeschlossen werden.",
      );
    } finally {
      setIsCompleting(false);
    }
  }

  async function submitCurrentAnswer(): Promise<void> {
    if (!activeCheckin || currentQuestionNumber === null) return;
    let answer: MorningCheckinAnswer = questionInput.trim() || null;
    if (currentQuestionNumber === 1 && answer !== null) answer = Number(answer);
    setIsSaving(true);
    setError(null);
    try {
      const updated = await apiClient.saveMorningCheckinAnswer(
        activeCheckin.id,
        {
          question_number: currentQuestionNumber,
          answer,
        },
      );
      setActiveCheckin(updated);
      setCurrentQuestionNumber(updated.next_question_number);
      if (updated.next_question_number === null)
        await completeCheckin(updated.id);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Die Antwort konnte nicht gespeichert werden.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function restartCheckin(): Promise<void> {
    if (!activeCheckin) return;
    setIsRestarting(true);
    setError(null);
    try {
      const restarted = await apiClient.restartMorningCheckin(activeCheckin.id);
      setActiveCheckin(restarted);
      setCurrentQuestionNumber(restarted.next_question_number);
      setQuestionInput("");
      window.localStorage.setItem(
        ACTIVE_CHECKIN_DATE_KEY,
        restarted.browser_date,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Der Morning Check-in konnte nicht neu gestartet werden.",
      );
    } finally {
      setIsRestarting(false);
    }
  }

  const isCompletedSnapshot = activeCheckin?.status === "completed";
  const progressLabel =
    currentQuestionNumber === null
      ? "Fragen abgeschlossen"
      : `Frage ${currentQuestionNumber} von ${QUESTION_COUNT}`;
  const currentPrompt =
    currentQuestionNumber === null
      ? "Alle sechs Fragen wurden bereits eingereicht."
      : QUESTIONS[currentQuestionNumber - 1];
  const currentBreathingCue = breathingCue(
    secondsRemaining,
    breathingDurationSeconds,
  );

  return (
    <section className="section" aria-label="Morning Check-in">
      <div className="routine-card">
        <div className="routine-card-heading">
          <h2>Deine Routine fuer heute</h2>
          <p>Ein kurzer Moment fuer Dankbarkeit und Klarheit.</p>
        </div>
        {viewState === "start" ? (
          <>
            <button
              className="primary-action"
              type="button"
              onClick={() => void startMorningCheckin()}
              disabled={isStarting}
            >
              {isStarting
                ? "Morning Check-in startet..."
                : shouldResume
                  ? "Morning Check-in fortsetzen"
                  : "Morning Check-in starten"}
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
            <div
              className={`breath-orb ${currentBreathingCue.label === "Einatmen" ? "inhale" : "exhale"}`}
              aria-hidden="true"
            />
            <p className="breathing-cue">{currentBreathingCue.label}</p>
            <p className="breathing-detail">{currentBreathingCue.detail}</p>
            <p className="breathing-countdown">
              {secondsRemaining} Sekunden verbleibend
            </p>
            <progress
              aria-label="Fortschritt der Atemuebung"
              value={breathingDurationSeconds - secondsRemaining}
              max={breathingDurationSeconds}
            />
            <button
              type="button"
              onClick={() => {
                setViewState("questionnaire");
                setSecondsRemaining(0);
              }}
            >
              Atemuebung ueberspringen
            </button>
          </div>
        ) : null}
        {viewState === "questionnaire" ? (
          <div className="question-card">
            <h3>{progressLabel}</h3>
            {isCompletedSnapshot ? (
              <>
                <p>
                  Dein Daily Snapshot ist abgeschlossen und bleibt
                  unveraenderlich.
                </p>
                <DailySnapshot snapshot={activeCheckin} />
              </>
            ) : (
              <>
                <p className="question-prompt">{currentPrompt}</p>
                {currentQuestionNumber !== null ? (
                  <>
                    {currentQuestionNumber === 1 ? (
                      <fieldset className="mood-picker" disabled={isSaving}>
                        <legend>Optionale Stimmung</legend>
                        <div className="mood-options">
                          {Object.entries(MOOD_LABELS).map(
                            ([rating, label]) => (
                              <label className="mood-option" key={rating}>
                                <input
                                  checked={questionInput === rating}
                                  name="mood-rating"
                                  onChange={() => setQuestionInput(rating)}
                                  type="radio"
                                  value={rating}
                                />
                                <span>{rating}</span>
                                <small>{label}</small>
                              </label>
                            ),
                          )}
                        </div>
                      </fieldset>
                    ) : (
                      <>
                        <label htmlFor="question-input">
                          Optionale Freitext-Antwort
                        </label>
                        <textarea
                          id="question-input"
                          name="question-input"
                          onChange={(event) =>
                            setQuestionInput(event.target.value)
                          }
                          placeholder="Schreib auf, was gerade da ist."
                          rows={5}
                          value={questionInput}
                        />
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => void submitCurrentAnswer()}
                      disabled={isSaving}
                    >
                      {isSaving
                        ? "Antwort wird gespeichert..."
                        : "Antwort speichern und weiter"}
                    </button>
                  </>
                ) : activeCheckin ? (
                  <>
                    <>
                      {isCompleting ? (
                        <p className="completion-status" role="status">
                          Dein Daily Snapshot wird verarbeitet. Einen Moment
                          noch.
                        </p>
                      ) : null}
                    </>
                    <button
                      type="button"
                      onClick={() => void completeCheckin(activeCheckin.id)}
                      disabled={isCompleting}
                    >
                      {isCompleting
                        ? "Daily Snapshot wird abgeschlossen..."
                        : "Abschluss erneut versuchen"}
                    </button>
                  </>
                ) : null}
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => void restartCheckin()}
                  disabled={isSaving || isRestarting || isCompleting}
                >
                  {isRestarting
                    ? "Starte neu..."
                    : "Morning Check-in neu starten"}
                </button>
              </>
            )}
          </div>
        ) : null}
        {activeCheckin ? (
          <p className="status">
            Aktiver Morning Check-in: {activeCheckin.browser_date}
          </p>
        ) : null}
        {error ? (
          <p className="status" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
