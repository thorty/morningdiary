import type { MorningCheckinResponse } from "@/lib/api/types";

export function moodFor(snapshot: MorningCheckinResponse): number | null {
  const mood = snapshot.answers[0];
  return typeof mood === "number" && mood >= 1 && mood <= 5 ? mood : null;
}
