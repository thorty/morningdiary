import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { EntryListItem } from "@/components/EntryListItem";
import { MoodTrend } from "@/components/MoodTrend";
import { ThemePicker } from "@/components/ThemePicker";
import { greeting, loadEntries, todayKey, type JournalEntry } from "@/lib/journal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gratitude Morning Coach – Deine Morgen-Routine" },
      {
        name: "description",
        content:
          "Starte den Tag mit 30 Sekunden Atmen, drei Dankbarkeiten und Klarheit über deinen Fokus.",
      },
      { property: "og:title", content: "Gratitude Morning Coach – Deine Morgen-Routine" },
      {
        property: "og:description",
        content:
          "Starte den Tag mit 30 Sekunden Atmen, drei Dankbarkeiten und Klarheit über deinen Fokus.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntries(loadEntries());
    setHydrated(true);
  }, []);

  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const todayEntry = entries.find((e) => e.date === todayKey());
  const doneToday = !!todayEntry;
  const recent = entries.slice(0, 3);
  // Tagesansicht: heutige Stimmung, sonst der letzte Eintrag.
  const moodScore = todayEntry?.moodScore ?? entries[0]?.moodScore ?? null;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-veil" />
      <div className="pointer-events-none absolute -left-24 top-24 size-72 rounded-full bg-warm opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-72 size-64 rounded-full bg-rose opacity-40 blur-3xl" />

      <div className="relative mx-auto w-full max-w-2xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
        <div className="flex justify-end">
          <ThemePicker moodScore={moodScore} />
        </div>

        <header className="mt-6 animate-rise">
          <p className="min-h-4 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {today
              ? today.toLocaleDateString("de-DE", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              : ""}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-[1.1] text-foreground sm:text-5xl">
            {today ? greeting(today) : "Schön, dass du da bist"}.
            <br />
            <span className="text-primary">Nimm dir fünf Minuten.</span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            Erst 30 Sekunden atmen, dann sechs ruhige Fragen. Am Ende steht deine Karte des
            Tages – Stimmung, Fokus und ein Satz vom Coach.
          </p>
        </header>

        <section className="mt-9 overflow-hidden rounded-4xl border border-border/70 bg-card shadow-lift animate-bloom">
          <div className="bg-sunrise px-6 py-8 sm:px-9">
            <p className="font-display text-xl text-foreground">
              {doneToday ? "Heute schon erledigt" : "Deine Routine für heute"}
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-foreground/75">
              {doneToday
                ? "Du kannst deine Antworten jederzeit ergänzen oder die Karte des Tages nochmal ansehen."
                : "Atemübung, Dankbarkeit, drei Vorhaben, deine Happy Hour und dein Tagesziel."}
            </p>
          </div>
          <div className="px-6 py-6 sm:px-9">
            <Link
              to="/routine"
              className="flex w-full items-center justify-center gap-3 rounded-full bg-warm px-8 py-4 font-semibold text-primary-foreground shadow-lift transition-all duration-300 hover:brightness-105"
            >
              {doneToday ? "Routine noch einmal starten" : "Morgen-Routine starten"}
              <span aria-hidden="true">→</span>
            </Link>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>30 s atmen</span>
              <span>6 Fragen</span>
              <span>1 Karte</span>
            </div>
          </div>
        </section>

        {hydrated && entries.length > 0 ? (
          <section className="mt-10 space-y-4">
            <MoodTrend entries={entries} />

            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 pt-2">
              <h2 className="min-w-0 truncate font-display text-xl text-foreground">
                Letzte Einträge
              </h2>
              <Link
                to="/rueckblick"
                className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
              >
                Alle ansehen
              </Link>
            </div>

            <div className="space-y-3">
              {recent.map((e) => (
                <EntryListItem key={e.id} entry={e} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
