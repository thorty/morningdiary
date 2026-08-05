import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { EntryListItem } from "@/components/EntryListItem";
import { MoodTrend } from "@/components/MoodTrend";
import { loadEntries, type JournalEntry } from "@/lib/journal";

export const Route = createFileRoute("/rueckblick")({
  head: () => ({
    meta: [
      { title: "Rückblick – Gratitude Morning Coach" },
      {
        name: "description",
        content:
          "Alle vergangenen Morgen-Einträge mit Stimmung, Fokus und der Zusammenfassung des Coaches.",
      },
      { property: "og:title", content: "Rückblick – Gratitude Morning Coach" },
      {
        property: "og:description",
        content: "Alle vergangenen Morgen-Einträge mit Stimmung und Fokus.",
      },
    ],
  }),
  component: RueckblickPage,
});

function RueckblickPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntries(loadEntries());
    setHydrated(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[40vh] bg-veil" />

      <div className="relative mx-auto w-full max-w-2xl px-5 pb-24 pt-8 sm:px-8">
        <Link
          to="/"
          className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          ← Start
        </Link>

        <header className="mt-8 animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Vergangene Einträge
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">
            Dein Rückblick
          </h1>
          <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
            Jeder Morgen als eigene Karte. Tippe auf einen Eintrag für alle Antworten.
          </p>
        </header>

        {hydrated && entries.length > 1 ? (
          <div className="mt-8">
            <MoodTrend entries={entries} />
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          {entries.map((e) => (
            <EntryListItem key={e.id} entry={e} />
          ))}
        </div>

        {hydrated && entries.length === 0 ? (
          <div className="mt-8 rounded-4xl border border-dashed border-border bg-card/60 p-10 text-center">
            <div className="mx-auto size-14 rounded-full bg-warm opacity-70 blur-[2px]" />
            <p className="mt-6 font-display text-xl text-foreground">Noch nichts hier</p>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Nach deiner ersten Morgen-Routine erscheint hier die Karte des Tages.
            </p>
            <Link
              to="/routine"
              className="mt-6 inline-block rounded-full bg-warm px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition-all duration-300 hover:brightness-105"
            >
              Routine starten
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
