import { createHttpPersonalJournalApiClient } from "@/lib/api/client";

test("calls backend through typed boundary for morning check-in", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        id: "abc-1",
        browser_date: "2026-08-04",
        status: "unfinished",
        answers: [null, null, null, null, null, null],
        next_question_number: 1,
      }),
      { status: 200 },
    ),
  );

  const client = createHttpPersonalJournalApiClient({
    baseUrl: "http://localhost:8000",
    fetchImpl: fetchMock,
  });

  const response = await client.getOrCreateMorningCheckin("2026-08-04");

  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:8000/api/morning-checkin?browser_date=2026-08-04",
    { method: "PUT" },
  );
  expect(response).toEqual({
    id: "abc-1",
    browser_date: "2026-08-04",
    status: "unfinished",
    answers: [null, null, null, null, null, null],
    next_question_number: 1,
  });
});

test("saves a single answer through backend boundary", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        id: "abc-1",
        browser_date: "2026-08-04",
        status: "unfinished",
        answers: [4, null, null, null, null, null],
        next_question_number: 2,
      }),
      { status: 200 },
    ),
  );

  const client = createHttpPersonalJournalApiClient({
    baseUrl: "http://localhost:8000",
    fetchImpl: fetchMock,
  });

  const response = await client.saveMorningCheckinAnswer("abc-1", {
    question_number: 1,
    answer: 4,
  });

  expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/morning-checkin/abc-1/answers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question_number: 1, answer: 4 }),
  });
  expect(response.next_question_number).toBe(2);
});

test("exposes API error detail messages for client-visible failures", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify({ detail: "Morning Check-in wurde nicht gefunden." }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    }),
  );
  const client = createHttpPersonalJournalApiClient({
    baseUrl: "http://localhost:8000",
    fetchImpl: fetchMock,
  });

  await expect(
    client.saveMorningCheckinAnswer("missing-id", {
      question_number: 1,
      answer: 3,
    }),
  ).rejects.toThrow("Morning Check-in wurde nicht gefunden.");
});

test("surfaces first FastAPI validation detail when error detail is an array", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        detail: [
          {
            msg: "Mood rating must be an integer between 1 and 5.",
          },
        ],
      }),
      {
        status: 422,
        headers: {
          "Content-Type": "application/json",
        },
      },
    ),
  );

  const client = createHttpPersonalJournalApiClient({
    baseUrl: "http://localhost:8000",
    fetchImpl: fetchMock,
  });

  await expect(
    client.saveMorningCheckinAnswer("abc-1", {
      question_number: 1,
      answer: "bad",
    }),
  ).rejects.toThrow("Mood rating must be an integer between 1 and 5.");
});

test("completes a check-in through backend boundary", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        id: "abc-1",
        browser_date: "2026-08-04",
        status: "completed",
        answers: [4, "Dankbar", null, null, null, null],
        next_question_number: null,
      }),
      { status: 200 },
    ),
  );

  const client = createHttpPersonalJournalApiClient({
    baseUrl: "http://localhost:8000",
    fetchImpl: fetchMock,
  });

  const response = await client.completeMorningCheckin("abc-1");

  expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/morning-checkin/abc-1/complete", {
    method: "POST",
  });
  expect(response.status).toBe("completed");
  expect(response.next_question_number).toBeNull();
});
