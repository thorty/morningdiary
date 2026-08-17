import type {
  CoachSummaryStatus,
  CoachSummaryResponse,
  MorningCheckinAnswer,
  MorningCheckinResponse,
  PersonalJournalExportResponse,
  SaveMorningCheckinAnswerRequest,
} from "@/lib/api/types";

export const browserLocalJournalStorageKey = "morning-coach.personal-journal";
export const coachSummaryUnavailableNote = "Deine Zusammenfassung konnte heute nicht erstellt werden.";
const CURRENT_SCHEMA_VERSION = 1;
const QUESTION_COUNT = 6;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class PersonalJournalStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersonalJournalStoreError";
  }
}

export interface PersonalJournalStore {
  getOrCreateMorningCheckin(browserDate: string): MorningCheckinResponse;
  saveMorningCheckinAnswer(
    checkinId: string,
    payload: SaveMorningCheckinAnswerRequest,
  ): MorningCheckinResponse;
  restartMorningCheckin(checkinId: string): MorningCheckinResponse;
  completeMorningCheckin(checkinId: string): MorningCheckinResponse;
  saveCoachSummary(
    checkinId: string,
    result: {
      status: CoachSummaryStatus;
      summary: CoachSummaryResponse["summary"];
      retry_available: boolean;
    },
  ): MorningCheckinResponse;
  findPersonalJournalSnapshot(id: string): MorningCheckinResponse | null;
  listPersonalJournalSnapshots(): MorningCheckinResponse[];
  deletePersonalJournal(): void;
  exportData(): PersonalJournalExportResponse;
}

type JournalDocument = {
  version: typeof CURRENT_SCHEMA_VERSION;
  unfinished_checkins: MorningCheckinResponse[];
  snapshots: MorningCheckinResponse[];
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function emptyDocument(): JournalDocument {
  return { version: CURRENT_SCHEMA_VERSION, unfinished_checkins: [], snapshots: [] };
}

function isAnswer(value: unknown, questionNumber: number): value is MorningCheckinAnswer {
  if (value === null) return true;
  if (questionNumber === 1) return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
  return typeof value === "string";
}

function isCheckin(value: unknown): value is MorningCheckinResponse {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.browser_date !== "string" ||
    (candidate.status !== "unfinished" && candidate.status !== "completed") ||
    !Array.isArray(candidate.answers) ||
    candidate.answers.length !== QUESTION_COUNT ||
    !(candidate.next_question_number === null || (typeof candidate.next_question_number === "number" && Number.isInteger(candidate.next_question_number) && candidate.next_question_number >= 1 && candidate.next_question_number <= QUESTION_COUNT)) ||
    !(candidate.coach_summary === null || typeof candidate.coach_summary === "string")
    || !(candidate.coach_summary_status === undefined || candidate.coach_summary_status === "available" || candidate.coach_summary_status === "unavailable" || candidate.coach_summary_status === "not_requested")
    || !(candidate.coach_summary_retry_available === undefined || typeof candidate.coach_summary_retry_available === "boolean")
  ) {
    return false;
  }
  return candidate.answers.every((answer, index) => isAnswer(answer, index + 1));
}

function readDocument(storage: StorageLike): JournalDocument {
  let raw: string | null;
  try {
    raw = storage.getItem(browserLocalJournalStorageKey);
  } catch {
    throw new PersonalJournalStoreError("Der Browser-Speicher konnte nicht gelesen werden.");
  }
  if (raw === null) return emptyDocument();

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) throw new Error();
    const candidate = parsed as Record<string, unknown>;
    const unfinishedCheckins = candidate.unfinished_checkins;
    const snapshots = candidate.snapshots;
    if (
      candidate.version !== CURRENT_SCHEMA_VERSION ||
      !Array.isArray(unfinishedCheckins) ||
      !Array.isArray(snapshots) ||
      !unfinishedCheckins.every(isCheckin) ||
      !snapshots.every(isCheckin) ||
      unfinishedCheckins.some((checkin) => checkin.status !== "unfinished") ||
      snapshots.some((snapshot) => snapshot.status !== "completed") ||
      new Set(unfinishedCheckins.map((checkin) => checkin.browser_date)).size !== unfinishedCheckins.length ||
      new Set(snapshots.map((snapshot) => snapshot.browser_date)).size !== snapshots.length ||
      unfinishedCheckins.some((checkin) => snapshots.some((snapshot) => snapshot.browser_date === checkin.browser_date))
    ) {
      throw new Error();
    }
    return {
      version: CURRENT_SCHEMA_VERSION,
      unfinished_checkins: unfinishedCheckins.map(defaultSummaryFields),
      snapshots: snapshots.map(defaultSummaryFields),
    };
  } catch {
    throw new PersonalJournalStoreError("Der Browser-Speicher enthält ein ungültiges Personal Journal.");
  }
}

function writeDocument(storage: StorageLike, document: JournalDocument): void {
  try {
    storage.setItem(browserLocalJournalStorageKey, JSON.stringify(document));
  } catch {
    throw new PersonalJournalStoreError("Das Personal Journal konnte nicht im Browser-Speicher gespeichert werden.");
  }
}

function requireCheckin(document: JournalDocument, checkinId: string): MorningCheckinResponse {
  const checkin = [...document.unfinished_checkins, ...document.snapshots].find((item) => item.id === checkinId);
  if (!checkin) throw new PersonalJournalStoreError("Der Morning Check-in wurde nicht gefunden.");
  return checkin;
}

function normalizeAnswer(questionNumber: number, answer: MorningCheckinAnswer): MorningCheckinAnswer {
  if (questionNumber === 1) {
    if (answer !== null && (typeof answer !== "number" || !Number.isInteger(answer) || answer < 1 || answer > 5)) {
      throw new PersonalJournalStoreError("Die Stimmung muss eine ganze Zahl zwischen 1 und 5 sein.");
    }
    return answer;
  }
  if (answer !== null && typeof answer !== "string") {
    throw new PersonalJournalStoreError("Diese Antwort muss Freitext sein.");
  }
  return answer === null || answer.trim() === "" ? null : answer;
}

function defaultSummaryFields(
  checkin: MorningCheckinResponse,
): MorningCheckinResponse {
  return {
    ...checkin,
    coach_summary: checkin.coach_summary ?? null,
    coach_summary_status: checkin.coach_summary_status ?? "not_requested",
    coach_summary_retry_available: checkin.coach_summary_retry_available ?? false,
  };
}

export function createBrowserLocalPersonalJournalStore(
  storage?: StorageLike,
  idGenerator: () => string = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `checkin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  },
): PersonalJournalStore {
  function getStorage(): StorageLike {
    if (storage) return storage;
    if (typeof window !== "undefined") {
      try {
        return window.localStorage;
      } catch {
        throw new PersonalJournalStoreError("Der Browser-Speicher ist nicht verfügbar.");
      }
    }
    throw new PersonalJournalStoreError("Der Browser-Speicher ist nicht verfügbar.");
  }

  return {
    getOrCreateMorningCheckin(browserDate) {
      const targetStorage = getStorage();
      const document = readDocument(targetStorage);
      const completed = document.snapshots.find((snapshot) => snapshot.browser_date === browserDate);
      if (completed) return clone(completed);
      const unfinished = document.unfinished_checkins.find((checkin) => checkin.browser_date === browserDate);
      if (unfinished) return clone(unfinished);

      const created: MorningCheckinResponse = {
        id: idGenerator(),
        browser_date: browserDate,
        status: "unfinished",
        answers: Array.from({ length: QUESTION_COUNT }, () => null),
        next_question_number: 1,
        coach_summary: null,
        coach_summary_status: "not_requested",
        coach_summary_retry_available: false,
      };
      document.unfinished_checkins.push(created);
      writeDocument(targetStorage, document);
      return clone(created);
    },

    saveMorningCheckinAnswer(checkinId, payload) {
      const targetStorage = getStorage();
      const document = readDocument(targetStorage);
      const checkin = requireCheckin(document, checkinId);
      if (checkin.status === "completed") {
        throw new PersonalJournalStoreError("Ein abgeschlossener Daily Snapshot bleibt unveränderlich.");
      }
      if (!Number.isInteger(payload.question_number) || payload.question_number < 1 || payload.question_number > QUESTION_COUNT) {
        throw new PersonalJournalStoreError("Die Frage wurde nicht erkannt.");
      }
      if (checkin.next_question_number === null || payload.question_number > checkin.next_question_number) {
        throw new PersonalJournalStoreError("Bitte beantworte die Fragen in ihrer Reihenfolge.");
      }
      const answer = normalizeAnswer(payload.question_number, payload.answer);
      const updated = { ...checkin, answers: [...checkin.answers] };
      updated.answers[payload.question_number - 1] = answer;
      updated.next_question_number = payload.question_number === checkin.next_question_number
        ? payload.question_number === QUESTION_COUNT ? null : payload.question_number + 1
        : checkin.next_question_number;
      document.unfinished_checkins = document.unfinished_checkins.map((item) => item.id === checkinId ? updated : item);
      writeDocument(targetStorage, document);
      return clone(updated);
    },

    restartMorningCheckin(checkinId) {
      const targetStorage = getStorage();
      const document = readDocument(targetStorage);
      const checkin = requireCheckin(document, checkinId);
      if (checkin.status === "completed") {
        throw new PersonalJournalStoreError("Ein abgeschlossener Daily Snapshot kann nicht neu gestartet werden.");
      }
      const restarted: MorningCheckinResponse = {
        ...checkin,
        answers: Array.from({ length: QUESTION_COUNT }, () => null),
        next_question_number: 1,
        coach_summary: null,
        coach_summary_status: "not_requested",
        coach_summary_retry_available: false,
      };
      document.unfinished_checkins = document.unfinished_checkins.map((item) => item.id === checkinId ? restarted : item);
      writeDocument(targetStorage, document);
      return clone(restarted);
    },

    completeMorningCheckin(checkinId) {
      const targetStorage = getStorage();
      const document = readDocument(targetStorage);
      const checkin = requireCheckin(document, checkinId);
      if (checkin.status === "completed") return clone(checkin);
      if (checkin.next_question_number !== null) {
        throw new PersonalJournalStoreError("Der Morning Check-in ist noch nicht vollständig.");
      }
      const existing = document.snapshots.find((snapshot) => snapshot.browser_date === checkin.browser_date);
      if (existing) return clone(existing);
      const completed = defaultSummaryFields({ ...checkin, status: "completed", next_question_number: null });
      document.unfinished_checkins = document.unfinished_checkins.filter((item) => item.id !== checkinId);
      document.snapshots.push(completed);
      writeDocument(targetStorage, document);
      return clone(completed);
    },

    saveCoachSummary(checkinId, result) {
      const targetStorage = getStorage();
      const document = readDocument(targetStorage);
      const snapshot = document.snapshots.find((item) => item.id === checkinId);
      if (!snapshot) throw new PersonalJournalStoreError("Der Daily Snapshot wurde nicht gefunden.");

      const updated = {
        ...snapshot,
        coach_summary: result.summary,
        coach_summary_status: result.status,
        coach_summary_retry_available: result.retry_available,
      };
      document.snapshots = document.snapshots.map((item) => item.id === checkinId ? updated : item);
      writeDocument(targetStorage, document);
      return clone(updated);
    },

    findPersonalJournalSnapshot(id) {
      const document = readDocument(getStorage());
      const snapshot = document.snapshots.find((item) => item.id === id);
      return snapshot ? clone(snapshot) : null;
    },

    listPersonalJournalSnapshots() {
      const document = readDocument(getStorage());
      return clone(document.snapshots).sort((first, second) => second.browser_date.localeCompare(first.browser_date));
    },

    deletePersonalJournal() {
      try {
        getStorage().removeItem(browserLocalJournalStorageKey);
      } catch {
        throw new PersonalJournalStoreError("Das Personal Journal konnte nicht gelöscht werden.");
      }
    },

    exportData() {
      return { snapshots: this.listPersonalJournalSnapshots() };
    },
  };
}
