import type { MorningCheckinResponse } from "@/lib/api/types";

const MOOD_EMOJIS = ["😞", "😐", "🙂", "😊", "😄"];

export function moodFor(snapshot: MorningCheckinResponse): number | null {
  const mood = snapshot.answers[0];
  return typeof mood === "number" && mood >= 1 && mood <= 5 ? mood : null;
}

export function emojiForMood(mood: number): string {
  return MOOD_EMOJIS[mood - 1];
}
