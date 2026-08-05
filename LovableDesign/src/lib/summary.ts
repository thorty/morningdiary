/**
 * Platzhalter für die Coach-Zusammenfassung.
 *
 * In deinem Next.js-Projekt diese Funktion gegen den eigenen LLM-Aufruf
 * tauschen (Server Action / Route Handler). Rückgabeform bleibt gleich:
 * { moodText, theme, recommendation }.
 */
import { moodLabels, type CoachSummary, type JournalAnswers } from "./journal";

const themeFor = (score: number) => {
  if (score <= 2) return "Erholung";
  if (score === 3) return "Klarheit";
  if (score === 4) return "Fokus";
  return "Leichtigkeit";
};

export async function generateSummary(input: {
  moodScore: number;
  answers: JournalAnswers;
}): Promise<CoachSummary> {
  // Simuliert die Antwortzeit eines Modells, damit der Ladezustand sichtbar ist.
  await new Promise((r) => setTimeout(r, 1400));

  const { moodScore, answers } = input;
  const goal = answers.goal.trim();
  const control = answers.control.trim();
  const happyHour = answers.happyHour.trim();
  const firstTodo = answers.todos.find((t) => t.trim())?.trim();

  const recommendationParts = [
    goal
      ? `Konzentriere dich heute auf „${goal}“ – das ist dein Anker.`
      : firstTodo
        ? `Beginne mit „${firstTodo}“, bevor der Tag Tempo aufnimmt.`
        : "Wähle eine Sache, die heute wirklich zählt, und beginne damit.",
    control ? `Was du steuern kannst: ${control}.` : null,
    happyHour ? `Halte dir „${happyHour}“ frei – das ist kein Extra.` : null,
  ].filter(Boolean);

  return {
    moodText: `${moodLabels[moodScore] ?? "Okay"} – ${
      moodScore >= 4
        ? "du startest mit Rückenwind"
        : moodScore === 3
          ? "solide Basis, ohne Druck"
          : "sei heute besonders freundlich mit dir"
    }`,
    theme: themeFor(moodScore),
    recommendation: recommendationParts.join(" "),
  };
}
