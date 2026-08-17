import type {
  HealthResponse,
  CoachSummaryRequest,
  CoachSummaryResponse,
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
  findPersonalJournalSnapshot?(id: string): Promise<MorningCheckinResponse | null>;
  listPersonalJournalSnapshots(): Promise<MorningCheckinResponse[]>;
  exportPersonalJournal(): Promise<PersonalJournalExportResponse>;
  deletePersonalJournal(): Promise<void>;
}

export interface CoachSummaryApiClient {
  createCoachSummary(payload: CoachSummaryRequest): Promise<CoachSummaryResponse>;
}

type HttpClientOptions = {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

function resolveHttpClientOptions(options: HttpClientOptions): { baseUrl: string; fetchImpl: typeof fetch } {
  return {
    baseUrl: options.baseUrl ?? process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://localhost:8000",
    fetchImpl: options.fetchImpl ?? fetch,
  };
}

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

export function createHttpCoachSummaryApiClient(
  options: HttpClientOptions = {},
): CoachSummaryApiClient {
  const { baseUrl, fetchImpl } = resolveHttpClientOptions(options);

  return {
    async createCoachSummary(payload) {
      const response = await fetchImpl(`${baseUrl}/api/coach-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: payload.answers,
          target_language: payload.target_language,
        }),
      });
      return parseJson<CoachSummaryResponse>(response);
    },
  };
}
