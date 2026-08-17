export type HealthResponse = {
  status: "ok";
};

export type CoachSummaryRequest = {
  answers: [
    MorningCheckinAnswer,
    MorningCheckinAnswer,
    MorningCheckinAnswer,
    MorningCheckinAnswer,
    MorningCheckinAnswer,
    MorningCheckinAnswer,
  ];
  target_language: "de" | "en";
};

export type CoachSummaryResponse = {
  status: "available" | "unavailable";
  summary: string | null;
};

export type MorningCheckinStatus = "unfinished" | "completed";

export type MorningCheckinAnswer = number | string | null;
export type CoachSummaryStatus = "available" | "unavailable" | "not_requested";

export type MorningCheckinResponse = {
  id: string;
  browser_date: string;
  status: MorningCheckinStatus;
  answers: MorningCheckinAnswer[];
  next_question_number: number | null;
  coach_summary: string | null;
  coach_summary_status?: CoachSummaryStatus;
  coach_summary_retry_available?: boolean;
};

export type SaveMorningCheckinAnswerRequest = {
  question_number: number;
  answer: MorningCheckinAnswer;
};

export type CompleteMorningCheckinRequest = {
  generate_coach_summary: boolean;
};

export type PersonalJournalExportResponse = {
  snapshots: MorningCheckinResponse[];
};
