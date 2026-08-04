import { createHttpPersonalJournalApiClient } from "@/lib/api/client";

test("calls backend through typed boundary for morning check-in", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        id: "abc-1",
        browser_date: "2026-08-04",
        status: "unfinished",
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
  });
});
