"use client";

import { useEffect, useRef, useState } from "react";
import React from "react";

import {
  DailySnapshot,
  MOOD_LABELS,
} from "@/components/daily-snapshot";
import type { PersonalJournalApiClient } from "@/lib/api/client";
import type {
  MorningCheckinAnswer,
  MorningCheckinResponse,
} from "@/lib/api/types";

const BREATHING_DURATION_SECONDS = 30;
const BREATHING_CYCLE_SECONDS = 10;

const QUESTION_CARDS = [
  { kicker: "Ankommen", prompt: "Wie fühlst du dich heute Morgen auf einer Skala von 1 bis 5?" },
  { kicker: "Dankbarkeit", prompt: "Wofür bist du heute dankbar?" },
  { kicker: "Loslassen", prompt: "Was möchtest du heute bewusst loslassen?" },
  { kicker: "Energie", prompt: "Was gibt dir heute Energie?" },
  { kicker: "Ein guter Tag", prompt: "Welche kleine Sache macht diesen Tag gut?" },
  { kicker: "Absicht", prompt: "Welche freundliche Absicht nimmst du in den Tag mit?" },
];
const QUESTION_COUNT = QUESTION_CARDS.length;

const MOOD_FACE_PATHS: Record<string, string> = {
  1: "M8 15c1.2-1.2 2.6-1.8 4-1.8s2.8.6 4 1.8",
  2: "M8 14.5h8",
  3: "M8 14h8",
  4: "M8 13.5c1.2 1.2 2.6 1.8 4 1.8s2.8-.6 4-1.8",
  5: "M7.5 13c1.4 1.8 2.9 2.7 4.5 2.7s3.1-.9 4.5-2.7",
};

type MorningCheckinProps = {
  apiClient: PersonalJournalApiClient;
  todayDateProvider: () => Date;
  breathingDurationSeconds?: number;
  onSnapshotCompleted: (snapshot: MorningCheckinResponse) => void;
  startCheckinRequest: number;
  autoStart?: boolean;
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
  autoStart = false,
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
  const breathingEndsAt = useRef<number | null>(null);
  const hasFinishedBreathing = useRef(false);

  const browserDate = toBrowserDate(todayDateProvider());

  function showCheckin(checkin: MorningCheckinResponse): void {
    setActiveCheckin(checkin);
    setCurrentQuestionNumber(checkin.next_question_number);
    setSecondsRemaining(breathingDurationSeconds);
    breathingEndsAt.current = Date.now() + breathingDurationSeconds * 1000;
    hasFinishedBreathing.current = false;
    setViewState(
      checkin.status === "unfinished" && checkin.next_question_number === 1
        ? "breathing"
        : "questionnaire",
    );

  }

  function finishBreathing(): void {
    if (hasFinishedBreathing.current) return;
    hasFinishedBreathing.current = true;
    setSecondsRemaining(0);
    setViewState("questionnaire");
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
    if (autoStart) void startMorningCheckin(true);
    // A direct route reconstructs its state from the API for the browser-local date.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, apiClient, browserDate]);

  useEffect(() => {
    if (startCheckinRequest > 0) void startMorningCheckin(shouldResume);
    // The parent issues an explicit request from another page section.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startCheckinRequest]);

  useEffect(() => {
    if (viewState !== "breathing") return;
    function updateBreathingProgress(): void {
      const endsAt = breathingEndsAt.current;
      if (endsAt === null) return;
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0) finishBreathing();
    }
    updateBreathingProgress();
    const intervalId = window.setInterval(updateBreathingProgress, 250);
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

  function goToPreviousQuestion(): void {
    if (currentQuestionNumber === null || currentQuestionNumber <= 1) return;
    setCurrentQuestionNumber(currentQuestionNumber - 1);
  }

  const isCompletedSnapshot = activeCheckin?.status === "completed";
  const progressLabel =
    currentQuestionNumber === null
      ? "Fragen abgeschlossen"
      : `Frage ${currentQuestionNumber} von ${QUESTION_COUNT}`;
  const currentPrompt =
    currentQuestionNumber === null
      ? "Alle sechs Fragen wurden bereits eingereicht."
      : QUESTION_CARDS[currentQuestionNumber - 1].prompt;
  const currentKicker =
    currentQuestionNumber === null
      ? null
      : QUESTION_CARDS[currentQuestionNumber - 1].kicker;
  const currentBreathingCue = breathingCue(
    secondsRemaining,
    breathingDurationSeconds,
  );

  return (
    <section className="section" aria-label="Morning Check-in">
      <div className={`routine-card ${viewState === "breathing" ? "routine-card-breathing" : ""}`}>
        <div className="routine-card-heading">
          <h2>Deine Routine für heute</h2>
          <p>Ein kurzer Moment für Dankbarkeit und Klarheit.</p>
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
            <h3>Breathing Exercise</h3>
            <div
              className={`breath-orb ${currentBreathingCue.label === "Einatmen" ? "inhale" : "exhale"}`}
              aria-hidden="true"
              style={{
                "--breathing-progress": `${((breathingDurationSeconds - secondsRemaining) / breathingDurationSeconds) * 100}%`,
              } as React.CSSProperties}
            />
            <p className="breathing-cue">{currentBreathingCue.label}</p>
            <p className="breathing-detail">{currentBreathingCue.detail}</p>
            <p className="breathing-countdown">
              {secondsRemaining} Sekunden verbleibend
            </p>
            <progress
              aria-label="Fortschritt der Breathing Exercise"
              value={breathingDurationSeconds - secondsRemaining}
              max={breathingDurationSeconds}
            />
            <button
              type="button"
              onClick={finishBreathing}
            >
              Breathing Exercise überspringen
            </button>
          </div>
        ) : null}
        {viewState === "questionnaire" ? (
          <div className="question-card">
            {currentKicker ? <p className="question-kicker">{currentKicker}</p> : null}
            <h3>{progressLabel}</h3>
            {isCompletedSnapshot ? (
              <>
                <p>
                  Dein Daily Snapshot ist abgeschlossen und bleibt
                  unveränderlich.
                </p>
                <DailySnapshot
                  snapshot={activeCheckin}
                  summaryState={
                    isCompleting
                      ? "loading"
                      : activeCheckin.coach_summary_status === "unavailable"
                        ? "error"
                        : "ready"
                  }
                  onRetry={activeCheckin.coach_summary_retry_available ? () => void completeCheckin(activeCheckin.id) : undefined}
                />
              </>
            ) : (
              <>
                <ol className="question-progress" aria-label="Fortschritt">
                  {QUESTION_CARDS.map((question, index) => (
                    <li
                      className={
                        index + 1 === currentQuestionNumber
                          ? "current"
                          : index + 1 < (currentQuestionNumber ?? QUESTION_COUNT + 1)
                            ? "completed"
                            : ""
                      }
                      key={question.prompt}
                    >
                      <span className="sr-only">Frage {index + 1}</span>
                    </li>
                  ))}
                </ol>
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
                                <span className="sr-only">{rating}</span>
                                <svg aria-hidden="true" viewBox="0 0 24 24">
                                  <circle cx="9" cy="10" fill="currentColor" r="1" />
                                  <circle cx="15" cy="10" fill="currentColor" r="1" />
                                  <path d={MOOD_FACE_PATHS[rating]} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
                                </svg>
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
                    {currentQuestionNumber > 1 ? (
                      <button
                        className="secondary-action"
                        type="button"
                        onClick={goToPreviousQuestion}
                        disabled={isSaving}
                      >
                        Zurück
                      </button>
                    ) : null}
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
