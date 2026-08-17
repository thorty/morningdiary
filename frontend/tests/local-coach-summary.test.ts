import { createLocalPersonalJournalApiClient } from "@/lib/api/default-client";
import type { CoachSummaryApiClient } from "@/lib/api/client";
import { createBrowserLocalPersonalJournalStore } from "@/lib/personal-journal-store";
import { MemoryStorage } from "@/tests/support/memory-storage";

function makeCheckin(store: ReturnType<typeof createBrowserLocalPersonalJournalStore>, answers: (number | string | null)[]) {
  let checkin = store.getOrCreateMorningCheckin("2026-08-04");
  for (let question = 1; question <= 6; question += 1) {
    checkin = store.saveMorningCheckinAnswer(checkin.id, {
      question_number: question,
      answer: answers[question - 1] ?? null,
    });
  }
  return checkin;
}

function clientWithSummary(summaryClient: CoachSummaryApiClient) {
  const store = createBrowserLocalPersonalJournalStore(new MemoryStorage(), () => "snapshot-1");
  return { client: createLocalPersonalJournalApiClient(store, summaryClient), store };
}

test("persists a successful summary after local completion and sends only current answers", async () => {
  const storage = new MemoryStorage();
  const store = createBrowserLocalPersonalJournalStore(storage, () => "snapshot-1");
  const createCoachSummary = vi.fn<CoachSummaryApiClient["createCoachSummary"]>().mockImplementation(async () => {
    expect(store.listPersonalJournalSnapshots()).toHaveLength(1);
    expect(store.listPersonalJournalSnapshots()[0]?.status).toBe("completed");
    return { status: "available", summary: "  Ein ruhiger Start.  " };
  });
  const client = createLocalPersonalJournalApiClient(store, { createCoachSummary });
  const checkin = makeCheckin(store, [4, "Ich bin dankbar", null, "Zeit fuer mich", null, "Ruhig bleiben"]);

  const snapshot = await client.completeMorningCheckin(checkin.id);

  expect(snapshot.coach_summary).toBe("Ein ruhiger Start.");
  expect(snapshot.coach_summary_status).toBe("available");
  expect(createCoachSummary).toHaveBeenCalledWith({
    answers: [4, "Ich bin dankbar", null, "Zeit fuer mich", null, "Ruhig bleiben"],
    target_language: "de",
  });
  expect(JSON.stringify(createCoachSummary.mock.calls[0])).not.toContain("snapshot-1");
  expect(store.listPersonalJournalSnapshots()).toHaveLength(1);
});

test("stores opt-out locally without calling the summary backend", async () => {
  const createCoachSummary = vi.fn<CoachSummaryApiClient["createCoachSummary"]>();
  const { client, store } = clientWithSummary({ createCoachSummary });
  const checkin = makeCheckin(store, [4, "Eine Antwort", null, null, null, null]);

  const snapshot = await client.completeMorningCheckin(checkin.id, { generate_coach_summary: false });

  expect(snapshot).toMatchObject({ coach_summary: null, coach_summary_status: "not_requested", coach_summary_retry_available: false });
  expect(createCoachSummary).not.toHaveBeenCalled();
});

test("completes a blank check-in locally without calling the summary backend", async () => {
  const createCoachSummary = vi.fn<CoachSummaryApiClient["createCoachSummary"]>();
  const { client, store } = clientWithSummary({ createCoachSummary });
  const checkin = makeCheckin(store, [null, null, null, null, null, null]);

  const snapshot = await client.completeMorningCheckin(checkin.id);

  expect(snapshot.coach_summary_status).toBe("not_requested");
  expect(createCoachSummary).not.toHaveBeenCalled();
});

test.each([
  { result: { status: "unavailable" as const, summary: null }, name: "unavailable response" },
  { result: null, name: "exception" },
  { result: { status: "available" as const, summary: "   " }, name: "empty text" },
])("keeps completion and marks a $name retryable", async ({ result }) => {
  const createCoachSummary = vi.fn<CoachSummaryApiClient["createCoachSummary"]>();
  if (result === null) createCoachSummary.mockRejectedValue(new Error("timeout"));
  else createCoachSummary.mockResolvedValue(result);
  const { client, store } = clientWithSummary({ createCoachSummary });
  const checkin = makeCheckin(store, [4, "Eine Antwort", null, null, null, null]);

  const snapshot = await client.completeMorningCheckin(checkin.id);

  expect(snapshot.status).toBe("completed");
  expect(snapshot.answers).toEqual([4, "Eine Antwort", null, null, null, null]);
  expect(snapshot.coach_summary).toBe("Deine Zusammenfassung konnte heute nicht erstellt werden.");
  expect(snapshot.coach_summary_status).toBe("unavailable");
  expect(snapshot.coach_summary_retry_available).toBe(true);
});

test("retry updates the existing snapshot instead of creating another one", async () => {
  const createCoachSummary = vi.fn<CoachSummaryApiClient["createCoachSummary"]>()
    .mockResolvedValueOnce({ status: "unavailable", summary: null })
    .mockResolvedValueOnce({ status: "available", summary: "Jetzt ist es klarer." });
  const { client, store } = clientWithSummary({ createCoachSummary });
  const checkin = makeCheckin(store, [4, "I feel grateful today", null, "I have energy", null, null]);

  const failed = await client.completeMorningCheckin(checkin.id);
  const retried = await client.completeMorningCheckin(failed.id);

  expect(retried.coach_summary).toBe("Jetzt ist es klarer.");
  expect(retried.coach_summary_status).toBe("available");
  expect(retried.coach_summary_retry_available).toBe(false);
  expect(createCoachSummary).toHaveBeenCalledTimes(2);
  expect(store.listPersonalJournalSnapshots()).toHaveLength(1);
  expect(createCoachSummary.mock.calls[1]?.[0]).toEqual({
    answers: [4, "I feel grateful today", null, "I have energy", null, null],
    target_language: "en",
  });
});

test("stores not_requested when an unavailable retry is opted out", async () => {
  const createCoachSummary = vi.fn<CoachSummaryApiClient["createCoachSummary"]>()
    .mockResolvedValue({ status: "unavailable", summary: null });
  const { client, store } = clientWithSummary({ createCoachSummary });
  const checkin = makeCheckin(store, [4, "Eine Antwort", null, null, null, null]);

  const failed = await client.completeMorningCheckin(checkin.id);
  const optedOut = await client.completeMorningCheckin(failed.id, { generate_coach_summary: false });

  expect(optedOut).toMatchObject({
    coach_summary: null,
    coach_summary_status: "not_requested",
    coach_summary_retry_available: false,
  });
  expect(createCoachSummary).toHaveBeenCalledOnce();
});

test("treats a timed-out summary request as unavailable without losing the snapshot", async () => {
  vi.useFakeTimers();
  try {
    const createCoachSummary = vi.fn<CoachSummaryApiClient["createCoachSummary"]>()
      .mockReturnValue(new Promise(() => undefined));
    const { client, store } = clientWithSummary({ createCoachSummary });
    const checkin = makeCheckin(store, [4, "Eine Antwort", null, null, null, null]);

    const completion = client.completeMorningCheckin(checkin.id);
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(completion).resolves.toMatchObject({
      status: "completed",
      coach_summary_status: "unavailable",
      coach_summary_retry_available: true,
    });
  } finally {
    vi.useRealTimers();
  }
});
