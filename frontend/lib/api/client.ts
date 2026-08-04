import type { HealthResponse, MorningCheckinResponse } from "@/lib/api/types";

export interface PersonalJournalApiClient {
  getHealth(): Promise<HealthResponse>;
  getOrCreateMorningCheckin(browserDate: string): Promise<MorningCheckinResponse>;
}

type HttpClientOptions = {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function createHttpPersonalJournalApiClient(
  options: HttpClientOptions = {},
): PersonalJournalApiClient {
  const baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://localhost:8000";
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async getHealth() {
      const response = await fetchImpl(`${baseUrl}/health`, { method: "GET" });
      return parseJson<HealthResponse>(response);
    },
    async getOrCreateMorningCheckin(browserDate: string) {
      const params = new URLSearchParams({ browser_date: browserDate });
      const response = await fetchImpl(`${baseUrl}/api/morning-checkin?${params.toString()}`, {
        method: "PUT",
      });
      return parseJson<MorningCheckinResponse>(response);
    },
  };
}
