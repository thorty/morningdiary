import type {
  HealthResponse,
  PersonalJournalExportResponse,
  CompleteMorningCheckinRequest,
  MorningCheckinResponse,
  SaveMorningCheckinAnswerRequest,
} from "@/lib/api/types";

export interface PersonalJournalApiClient {
  getHealth(): Promise<HealthResponse>;
  getOrCreateMorningCheckin(browserDate: string): Promise<MorningCheckinResponse>;
  saveMorningCheckinAnswer(checkinId: string, payload: SaveMorningCheckinAnswerRequest): Promise<MorningCheckinResponse>;
  restartMorningCheckin(checkinId: string): Promise<MorningCheckinResponse>;
  completeMorningCheckin(checkinId: string, payload?: CompleteMorningCheckinRequest): Promise<MorningCheckinResponse>;
  listPersonalJournalSnapshots(): Promise<MorningCheckinResponse[]>;
  exportPersonalJournal(): Promise<PersonalJournalExportResponse>;
  deletePersonalJournal(): Promise<void>;
}

type HttpClientOptions = {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: unknown };
      if (typeof payload.detail === "string" && payload.detail.length > 0) {
        message = payload.detail;
      } else if (Array.isArray(payload.detail) && payload.detail.length > 0) {
        const first = payload.detail[0];
        if (first && typeof first === "object" && "msg" in first) {
          const firstMessage = (first as { msg?: unknown }).msg;
          if (typeof firstMessage === "string" && firstMessage.length > 0) {
            message = firstMessage;
          }
        }
      }
    } catch {
      // Keep default status-based message when error payload is not JSON.
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
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
    async saveMorningCheckinAnswer(checkinId: string, payload: SaveMorningCheckinAnswerRequest) {
      const response = await fetchImpl(`${baseUrl}/api/morning-checkin/${checkinId}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      return parseJson<MorningCheckinResponse>(response);
    },
    async restartMorningCheckin(checkinId: string) {
      const response = await fetchImpl(`${baseUrl}/api/morning-checkin/${checkinId}/restart`, {
        method: "POST",
      });
      return parseJson<MorningCheckinResponse>(response);
    },
    async completeMorningCheckin(checkinId: string, payload?: CompleteMorningCheckinRequest) {
      const response = await fetchImpl(`${baseUrl}/api/morning-checkin/${checkinId}/complete`, {
        method: "POST",
        headers: payload ? { "Content-Type": "application/json" } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      return parseJson<MorningCheckinResponse>(response);
    },
    async listPersonalJournalSnapshots() {
      const response = await fetchImpl(`${baseUrl}/api/personal-journal/snapshots`, {
        method: "GET",
      });
      return parseJson<MorningCheckinResponse[]>(response);
    },
    async exportPersonalJournal() {
      const response = await fetchImpl(`${baseUrl}/api/personal-journal/export`, {
        method: "GET",
      });
      return parseJson<PersonalJournalExportResponse>(response);
    },
    async deletePersonalJournal() {
      const response = await fetchImpl(`${baseUrl}/api/personal-journal`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
    },
  };
}
