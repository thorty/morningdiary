import { createHttpCoachSummaryApiClient } from "@/lib/api/client";

test("sends only current answers and target language to the stateless Coach Summary API", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify({ status: "available", summary: "Du bist auf einem guten Weg." }), { status: 200 }),
  );
  const client = createHttpCoachSummaryApiClient({
    baseUrl: "http://localhost:8000",
    fetchImpl: fetchMock,
  });

  const response = await client.createCoachSummary({
    answers: [4, "Dankbar fuer den ruhigen Morgen", null, null, null, "Den naechsten Schritt"],
    target_language: "de",
  });

  expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/coach-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      answers: [4, "Dankbar fuer den ruhigen Morgen", null, null, null, "Den naechsten Schritt"],
      target_language: "de",
    }),
  });
  expect(response).toEqual({ status: "available", summary: "Du bist auf einem guten Weg." });
  expect(JSON.stringify(fetchMock.mock.calls[0])).not.toContain("OPENAI_API_KEY");
});

test("returns a controlled unavailable response from the Coach Summary API", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify({ status: "unavailable", summary: null }), { status: 200 }),
  );
  const client = createHttpCoachSummaryApiClient({ fetchImpl: fetchMock });

  await expect(
    client.createCoachSummary({
      answers: [null, null, null, null, null, null],
      target_language: "de",
    }),
  ).resolves.toEqual({ status: "unavailable", summary: null });
});

test("does not serialize runtime fields outside the Coach Summary contract", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify({ status: "unavailable", summary: null }), { status: 200 }),
  );
  const client = createHttpCoachSummaryApiClient({ fetchImpl: fetchMock });
  const payload = {
    answers: [null, null, null, null, null, "Current answer"] as [null, null, null, null, null, string],
    target_language: "de" as const,
    user_id: "must-not-be-sent",
    history: ["old journal data"],
  };

  await client.createCoachSummary(payload);

  expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
    answers: [null, null, null, null, null, "Current answer"],
    target_language: "de",
  });
});
