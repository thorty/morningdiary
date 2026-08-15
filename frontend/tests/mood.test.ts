import { emojiForMood } from "@/lib/mood";

test.each([
  [1, "😞"],
  [2, "😐"],
  [3, "🙂"],
  [4, "😊"],
  [5, "😄"],
])("returns the canonical emoji for mood %i", (mood, emoji) => {
  expect(emojiForMood(mood)).toBe(emoji);
});
