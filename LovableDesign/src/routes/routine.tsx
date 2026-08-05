import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { BreathTimer } from "@/components/BreathTimer";
import { useMoodTheme } from "@/hooks/useMoodTheme";
import { MoodScale } from "@/components/MoodScale";
import {
  QuestionCard,
  TextAreaField,
  TextField,
  TripleFields,
} from "@/components/QuestionCard";
import { SnapshotCard } from "@/components/SnapshotCard";
import {
  emptyAnswers,
  saveTodayEntry,
  todayKey,
  type CoachSummary,
  type JournalAnswers,
  type JournalEntry,
} from "@/lib/journal";
import { generateSummary } from "@/lib/summary";

export const Route = createFileRoute("/routine")({
  head: () => ({
    meta: [
      { title: "Morgen-Routine – Gratitude Morning Coach" },
      {
        name: "description",
        content:
          "Atemübung, sechs Fragen und deine Karte des Tages – eine Frage pro Schritt, ganz ruhig.",
      },
      { property: "og:title", content: "Morgen-Routine – Gratitude Morning Coach" },
      {
        property: "og:description",
        content: "Atemübung, sechs Fragen und deine Karte des Tages.",
      },
    ],
  }),
  component: RoutinePage,
});

const TOTAL_STEPS = 6;

type Stage = "breath" | "questions" | "snapshot";

function RoutinePage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("breath");
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState<number | null>(null);
  const [answers, setAnswers] = useState<JournalAnswers>(emptyAnswers());
  const [summary, setSummary] = useState<CoachSummary | null>(null);
  const [summaryState, setSummaryState] = useState<"loading" | "ready" | "error">("loading");
  // Farbpalette folgt live der gewählten Stimmung (Auto-Modus).
  useMoodTheme(mood);

  const set = <K extends keyof JournalAnswers>(key: K, value: JournalAnswers[K]) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const setTriple = (key: "gratitude" | "todos", index: number, value: string) =>
    setAnswers((prev) => {
      const next = [...prev[key]] as [string, string, string];
      next[index] = value;
      return { ...prev, [key]: next };
    });

  const runSummary = useCallback(
    async (moodScore: number, currentAnswers: JournalAnswers) => {
      setSummaryState("loading");
      try {
        const result = await generateSummary({ moodScore, answers: currentAnswers });
        setSummary(result);
        setSummaryState("ready");
        saveTodayEntry({ moodScore, answers: currentAnswers, summary: result });
      } catch {
        setSummary(null);
        setSummaryState("error");
      }
    },
    [],
  );

  const finish = () => {
    const moodScore = mood ?? 3;
    // Eintrag zuerst ohne Zusammenfassung sichern, damit nichts verloren geht.
    saveTodayEntry({ moodScore, answers, summary: null });
    setStage("snapshot");
    void runSummary(moodScore, answers);
  };

  const back = () => {
    if (step === 0) {
      setStage("breath");
      return;
    }
    setStep((s) => s - 1);
  };

  const next = () => {
    if (step === TOTAL_STEPS - 1) {
      finish();
      return;
    }
    setStep((s) => s + 1);
  };

  const entry: JournalEntry = {
    id: "current",
    date: todayKey(),
    moodScore: mood ?? 3,
    answers,
    summary,
    createdAt: new Date().toISOString(),
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-veil" />
      <div className="pointer-events-none absolute -right-24 top-40 size-72 rounded-full bg-warm opacity-20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 pb-16 pt-8 sm:px-8">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ← Start
          </Link>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {stage === "breath"
              ? "Atmen"
              : stage === "questions"
                ? "Interview"
                : "Karte des Tages"}
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-10">
          {stage === "breath" ? (
            <BreathTimer
              onDone={() => setStage("questions")}
              onSkip={() => setStage("questions")}
            />
          ) : null}

          {stage === "questions" ? (
            <>
              {step === 0 ? (
                <QuestionCard
                  step={0}
                  total={TOTAL_STEPS}
                  kicker="Ankommen"
                  question="Wie geht es dir gerade auf einer Skala von 1 bis 5 – und warum?"
                  onBack={back}
                  onNext={next}
                  nextDisabled={mood === null}
                >
                  <div className="space-y-5">
                    <MoodScale value={mood} onChange={setMood} />
                    <TextAreaField
                      value={answers.moodWhy}
                      onChange={(v) => set("moodWhy", v)}
                      placeholder="Was trägt gerade dazu bei?"
                    />
                  </div>
                </QuestionCard>
              ) : null}

              {step === 1 ? (
                <QuestionCard
                  step={1}
                  total={TOTAL_STEPS}
                  kicker="Dankbarkeit"
                  question="Wofür bist du heute dankbar?"
                  hint="Drei Dinge – gerne ganz kleine."
                  onBack={back}
                  onNext={next}
                >
                  <TripleFields
                    values={answers.gratitude}
                    onChange={(i, v) => setTriple("gratitude", i, v)}
                    placeholders={["Zum Beispiel: Ruhe am Morgen", "Ein Mensch", "Etwas an dir"]}
                  />
                </QuestionCard>
              ) : null}

              {step === 2 ? (
                <QuestionCard
                  step={2}
                  total={TOTAL_STEPS}
                  kicker="Vorhaben"
                  question="Welche drei Dinge möchtest du heute unbedingt tun?"
                  onBack={back}
                  onNext={next}
                >
                  <TripleFields
                    values={answers.todos}
                    onChange={(i, v) => setTriple("todos", i, v)}
                    placeholders={["Das Wichtigste", "Das Zweite", "Das Dritte"]}
                  />
                </QuestionCard>
              ) : null}

              {step === 3 ? (
                <QuestionCard
                  step={3}
                  total={TOTAL_STEPS}
                  kicker="Happy Hour"
                  question="Was wird heute deine Happy Hour – ein besonderer Moment nur für dich?"
                  onBack={back}
                  onNext={next}
                >
                  <TextField
                    autoFocus
                    value={answers.happyHour}
                    onChange={(v) => set("happyHour", v)}
                    placeholder="Zum Beispiel: eine Stunde lesen, ohne Handy"
                  />
                </QuestionCard>
              ) : null}

              {step === 4 ? (
                <QuestionCard
                  step={4}
                  total={TOTAL_STEPS}
                  kicker="Fokus"
                  question="Was ist dein wichtigstes Ziel für diesen Tag?"
                  onBack={back}
                  onNext={next}
                >
                  <TextField
                    autoFocus
                    value={answers.goal}
                    onChange={(v) => set("goal", v)}
                    placeholder="Ein Satz reicht"
                  />
                </QuestionCard>
              ) : null}

              {step === 5 ? (
                <QuestionCard
                  step={5}
                  total={TOTAL_STEPS}
                  kicker="Einfluss"
                  question="Was ist eine Sache, die du heute wirklich beeinflussen kannst?"
                  onBack={back}
                  onNext={next}
                  nextLabel="Karte des Tages ansehen"
                >
                  <TextAreaField
                    value={answers.control}
                    onChange={(v) => set("control", v)}
                    placeholder="Etwas, das ganz in deiner Hand liegt"
                  />
                </QuestionCard>
              ) : null}
            </>
          ) : null}

          {stage === "snapshot" ? (
            <div className="flex w-full flex-col items-center">
              <SnapshotCard
                entry={entry}
                state={summaryState}
                onRetry={() => void runSummary(mood ?? 3, answers)}
              />
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/rueckblick"
                  onClick={() => router.invalidate()}
                  className="rounded-full bg-warm px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition-all duration-300 hover:brightness-105"
                >
                  Zum Rückblick
                </Link>
                <Link
                  to="/"
                  className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Fertig
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
