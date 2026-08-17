import type { CoachSummaryApiClient, PersonalJournalApiClient } from "@/lib/api/client";
import type {
  CoachSummaryRequest,
  CompleteMorningCheckinRequest,
  SaveMorningCheckinAnswerRequest,
} from "@/lib/api/types";
import { createHttpCoachSummaryApiClient } from "@/lib/api/client";
import {
  coachSummaryUnavailableNote,
  createBrowserLocalPersonalJournalStore,
  type PersonalJournalStore,
} from "@/lib/personal-journal-store";

const COACH_SUMMARY_TIMEOUT_MS = 10_000;

function detectPredominantAnswerLanguage(answers: CoachSummaryRequest["answers"]): "de" | "en" {
  let germanScore = 0;
  let englishScore = 0;
  const germanMarkers = [" und ", " ich ", " heute ", " dank", " nicht ", " fuer ", " mit ", " loslassen"];
  const englishMarkers = [" and ", " i ", " today ", " grateful", " not ", " with ", " let go", " energy"];

  for (const answer of answers) {
    if (typeof answer !== "string") continue;
    const lower = ` ${answer.toLowerCase()} `;
    if (germanMarkers.some((marker) => lower.includes(marker))) germanScore += 1;
    if (englishMarkers.some((marker) => lower.includes(marker))) englishScore += 1;
    if (["ae", "oe", "ue", "ss"].some((marker) => answer.includes(marker))) germanScore += 1;
  }
  return englishScore > germanScore ? "en" : "de";
}

function hasCheckinAnswer(answers: CoachSummaryRequest["answers"]): boolean {
  return answers.some((answer) => answer !== null);
}

function summaryAnswers(answers: unknown[]): CoachSummaryRequest["answers"] {
  return answers as CoachSummaryRequest["answers"];
}

async function requestCoachSummary(
  client: CoachSummaryApiClient,
  payload: CoachSummaryRequest,
): Promise<Awaited<ReturnType<CoachSummaryApiClient["createCoachSummary"]>>> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      client.createCoachSummary(payload),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Coach Summary request timed out.")), COACH_SUMMARY_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

export function createLocalPersonalJournalApiClient(
  store: PersonalJournalStore = createBrowserLocalPersonalJournalStore(),
  coachSummaryClient: CoachSummaryApiClient = createHttpCoachSummaryApiClient(),
): PersonalJournalApiClient {
  return {
    async getHealth() {
      return { status: "ok" };
    },
    async getOrCreateMorningCheckin(browserDate) {
      return store.getOrCreateMorningCheckin(browserDate);
    },
    async saveMorningCheckinAnswer(checkinId: string, payload: SaveMorningCheckinAnswerRequest) {
      return store.saveMorningCheckinAnswer(checkinId, payload);
    },
    async restartMorningCheckin(checkinId: string) {
      return store.restartMorningCheckin(checkinId);
    },
    async completeMorningCheckin(checkinId: string, payload?: CompleteMorningCheckinRequest) {
      const existing = store.findPersonalJournalSnapshot(checkinId);
      const completed = store.completeMorningCheckin(checkinId);
      const shouldRequestSummary = payload?.generate_coach_summary !== false;

      if (existing) {
        if (
          existing.coach_summary_status !== "unavailable" ||
          !existing.coach_summary_retry_available
        ) {
          return completed;
        }
      }

      const answers = summaryAnswers(completed.answers);
      if (!shouldRequestSummary || !hasCheckinAnswer(answers)) {
        return store.saveCoachSummary(completed.id, {
          status: "not_requested",
          summary: null,
          retry_available: false,
        });
      }

      try {
        const result = await requestCoachSummary(coachSummaryClient, {
          answers,
          target_language: detectPredominantAnswerLanguage(answers),
        });
        if (result.status === "available" && result.summary?.trim()) {
          return store.saveCoachSummary(completed.id, {
            status: "available",
            summary: result.summary.trim(),
            retry_available: false,
          });
        }
      } catch {
        // The locally completed Daily Snapshot remains the source of truth.
      }

      return store.saveCoachSummary(completed.id, {
        status: "unavailable",
        summary: coachSummaryUnavailableNote,
        retry_available: true,
      });
    },
    async findPersonalJournalSnapshot(id: string) {
      return store.findPersonalJournalSnapshot(id);
    },
    async listPersonalJournalSnapshots() {
      return store.listPersonalJournalSnapshots();
    },
    async exportPersonalJournal() {
      return store.exportData();
    },
    async deletePersonalJournal() {
      store.deletePersonalJournal();
    },
  };
}

export const defaultPersonalJournalApiClient = createLocalPersonalJournalApiClient();
