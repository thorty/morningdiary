export type HealthResponse = {
  status: "ok";
};

export type MorningCheckinStatus = "unfinished" | "completed";

export type MorningCheckinResponse = {
  id: string;
  browser_date: string;
  status: MorningCheckinStatus;
};
