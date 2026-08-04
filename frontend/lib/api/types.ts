export type HealthResponse = {
  status: "ok";
};

export type MorningCheckinStatus = "unfinished" | "completed";

export type MorningCheckinAnswer = number | string | null;

export type MorningCheckinResponse = {
  id: string;
  browser_date: string;
  status: MorningCheckinStatus;
  answers: MorningCheckinAnswer[];
  next_question_number: number | null;
  coach_summary: string | null;
};

export type SaveMorningCheckinAnswerRequest = {
  question_number: number;
  answer: MorningCheckinAnswer;
};
