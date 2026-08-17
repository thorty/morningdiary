import {
  browserLocalJournalStorageKey,
  createBrowserLocalPersonalJournalStore,
  PersonalJournalStoreError,
  type StorageLike,
} from "@/lib/personal-journal-store";
import { MemoryStorage } from "@/tests/support/memory-storage";

function makeStore(storage = new MemoryStorage()) {
  let nextId = 0;
  return {
    storage,
    store: createBrowserLocalPersonalJournalStore(storage, () => `checkin-${++nextId}`),
  };
}

test("creates and resumes one unfinished check-in with immediately persisted answers", () => {
  const { storage, store } = makeStore();

  const created = store.getOrCreateMorningCheckin("2026-08-04");
  expect(created).toMatchObject({
    id: "checkin-1",
    browser_date: "2026-08-04",
    status: "unfinished",
    next_question_number: 1,
    answers: [null, null, null, null, null, null],
  });

  const updated = store.saveMorningCheckinAnswer(created.id, {
    question_number: 1,
    answer: 4,
  });
  expect(updated.answers[0]).toBe(4);
  expect(store.getOrCreateMorningCheckin("2026-08-04")).toEqual(updated);
  expect(JSON.parse(storage.getItem(browserLocalJournalStorageKey)!)).toMatchObject({
    version: 1,
    unfinished_checkins: [updated],
  });
});

test("restarts unfinished check-ins but rejects completed ones as immutable", () => {
  const { storage, store } = makeStore();
  const created = store.getOrCreateMorningCheckin("2026-08-04");
  store.saveMorningCheckinAnswer(created.id, { question_number: 1, answer: 3 });

  const restarted = store.restartMorningCheckin(created.id);
  expect(restarted).toMatchObject({
    id: created.id,
    answers: [null, null, null, null, null, null],
    next_question_number: 1,
  });

  let current = restarted;
  for (let question = 1; question <= 6; question += 1) {
    current = store.saveMorningCheckinAnswer(current.id, {
      question_number: question,
      answer: question === 1 ? 5 : `Antwort ${question}`,
    });
  }
  const completed = store.completeMorningCheckin(current.id);
  expect(completed.status).toBe("completed");
  expect(store.getOrCreateMorningCheckin("2026-08-04")).toEqual(completed);
  expect(() => store.restartMorningCheckin(completed.id)).toThrow(
    PersonalJournalStoreError,
  );
  expect(() =>
    store.saveMorningCheckinAnswer(completed.id, {
      question_number: 1,
      answer: 1,
    }),
  ).toThrow(PersonalJournalStoreError);
});

test("completes a blank check-in and keeps at most one snapshot per browser day", () => {
  const { store } = makeStore();
  let checkin = store.getOrCreateMorningCheckin("2026-08-04");
  for (let question = 1; question <= 6; question += 1) {
    checkin = store.saveMorningCheckinAnswer(checkin.id, {
      question_number: question,
      answer: null,
    });
  }

  const completed = store.completeMorningCheckin(checkin.id);
  expect(completed).toMatchObject({
    status: "completed",
    coach_summary: null,
    coach_summary_status: "not_requested",
    coach_summary_retry_available: false,
  });
  expect(store.listPersonalJournalSnapshots()).toEqual([completed]);
  expect(store.getOrCreateMorningCheckin("2026-08-04")).toEqual(completed);
  expect(store.listPersonalJournalSnapshots()).toHaveLength(1);
});

test("finds snapshots newest first, exports completed data, and deletes only journal data", () => {
  const { storage, store } = makeStore();
  storage.setItem("morning-coach.user-profile", "profile");
  storage.setItem("morning-coach.theme", "blue");
  for (const date of ["2026-08-02", "2026-08-04", "2026-08-03"]) {
    let checkin = store.getOrCreateMorningCheckin(date);
    for (let question = 1; question <= 6; question += 1) {
      checkin = store.saveMorningCheckinAnswer(checkin.id, {
        question_number: question,
        answer: null,
      });
    }
    store.completeMorningCheckin(checkin.id);
  }

  const snapshots = store.listPersonalJournalSnapshots();
  expect(snapshots.map((snapshot) => snapshot.browser_date)).toEqual([
    "2026-08-04",
    "2026-08-03",
    "2026-08-02",
  ]);
  expect(store.findPersonalJournalSnapshot(snapshots[1]!.id)).toEqual(snapshots[1]);
  expect(store.exportData()).toEqual({ snapshots });

  store.deletePersonalJournal();
  expect(store.listPersonalJournalSnapshots()).toEqual([]);
  expect(storage.getItem("morning-coach.user-profile")).toBe("profile");
  expect(storage.getItem("morning-coach.theme")).toBe("blue");
  expect(store.getOrCreateMorningCheckin("2026-08-04").answers).toEqual([
    null,
    null,
    null,
    null,
    null,
    null,
  ]);
});

test.each([
  [1, 0],
  [1, 6],
  [2, 4],
])("rejects invalid answers for question %i", (question_number, answer) => {
  const { store } = makeStore();
  const checkin = store.getOrCreateMorningCheckin("2026-08-04");

  expect(() =>
    store.saveMorningCheckinAnswer(checkin.id, { question_number, answer }),
  ).toThrow(PersonalJournalStoreError);
});

test("does not crash on malformed storage at module boundaries", () => {
  const storage = new MemoryStorage();
  storage.setItem(browserLocalJournalStorageKey, "not json");
  const store = createBrowserLocalPersonalJournalStore(storage, () => "new-id");

  expect(() => store.listPersonalJournalSnapshots()).toThrow(PersonalJournalStoreError);
  expect(() => store.getOrCreateMorningCheckin("2026-08-04")).toThrow(
    "Browser-Speicher",
  );
});

test("defaults Coach Summary fields when reading an older local snapshot", () => {
  const storage = new MemoryStorage();
  const store = createBrowserLocalPersonalJournalStore(storage, () => "new-id");
  storage.setItem(
    browserLocalJournalStorageKey,
    JSON.stringify({
      version: 1,
      unfinished_checkins: [],
      snapshots: [{
        id: "legacy",
        browser_date: "2026-08-03",
        status: "completed",
        answers: [null, null, null, null, null, null],
        next_question_number: null,
        coach_summary: null,
      }],
    }),
  );

  expect(store.listPersonalJournalSnapshots()[0]).toMatchObject({
    id: "legacy",
    coach_summary_status: "not_requested",
    coach_summary_retry_available: false,
  });
});

test("surfaces browser storage failures as controlled store errors", () => {
  const failingStorage: StorageLike = {
    getItem: () => {
      throw new Error("quota");
    },
    setItem: () => {
      throw new Error("quota");
    },
    removeItem: () => {
      throw new Error("quota");
    },
  };
  const store = createBrowserLocalPersonalJournalStore(failingStorage, () => "id");

  expect(() => store.getOrCreateMorningCheckin("2026-08-04")).toThrow(
    PersonalJournalStoreError,
  );
});

test("rejects out-of-order answers and duplicate dates in stored data", () => {
  const { storage, store } = makeStore();
  const checkin = store.getOrCreateMorningCheckin("2026-08-04");

  expect(() =>
    store.saveMorningCheckinAnswer(checkin.id, { question_number: 6, answer: "zu früh" }),
  ).toThrow("Reihenfolge");

  const snapshot = {
    ...checkin,
    status: "completed" as const,
    next_question_number: null,
  };
  storage.setItem(
    browserLocalJournalStorageKey,
    JSON.stringify({
      version: 1,
      unfinished_checkins: [],
      snapshots: [snapshot, { ...snapshot, id: "duplicate" }],
    }),
  );
  expect(() => store.listPersonalJournalSnapshots()).toThrow(PersonalJournalStoreError);

  storage.setItem(
    browserLocalJournalStorageKey,
    JSON.stringify({
      version: 1,
      unfinished_checkins: [
        {
          id: "one",
          browser_date: "2026-08-04",
          status: "unfinished",
          answers: [null, null, null, null, null, null],
          next_question_number: 1,
          coach_summary: null,
          coach_summary_status: "not_requested",
          coach_summary_retry_available: false,
        },
        {
          id: "two",
          browser_date: "2026-08-04",
          status: "unfinished",
          answers: [null, null, null, null, null, null],
          next_question_number: 1,
          coach_summary: null,
          coach_summary_status: "not_requested",
          coach_summary_retry_available: false,
        },
      ],
      snapshots: [],
    }),
  );
  expect(() => store.listPersonalJournalSnapshots()).toThrow(PersonalJournalStoreError);
});

test("the browser-local adapter uses the store without journal HTTP calls", async () => {
  const { store } = makeStore();
  const { createLocalPersonalJournalApiClient } = await import("@/lib/api/default-client");
  const client = createLocalPersonalJournalApiClient(store);

  const checkin = await client.getOrCreateMorningCheckin("2026-08-04");
  expect(await client.getHealth()).toEqual({ status: "ok" });
  expect(checkin.browser_date).toBe("2026-08-04");
  expect(await client.listPersonalJournalSnapshots()).toEqual([]);
});

test("attaches a Coach Summary to the existing completed snapshot", () => {
  const { store } = makeStore();
  let checkin = store.getOrCreateMorningCheckin("2026-08-04");
  for (let question = 1; question <= 6; question += 1) {
    checkin = store.saveMorningCheckinAnswer(checkin.id, {
      question_number: question,
      answer: question === 1 ? 4 : `Antwort ${question}`,
    });
  }
  const completed = store.completeMorningCheckin(checkin.id);

  const updated = store.saveCoachSummary(completed.id, {
    status: "available",
    summary: "Ein guter, klarer Start.",
    retry_available: false,
  });

  expect(updated).toMatchObject({
    id: completed.id,
    coach_summary: "Ein guter, klarer Start.",
    coach_summary_status: "available",
    coach_summary_retry_available: false,
  });
  expect(store.listPersonalJournalSnapshots()).toHaveLength(1);
});
