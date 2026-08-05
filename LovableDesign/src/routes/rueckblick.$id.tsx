import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SnapshotCard } from "@/components/SnapshotCard";
import { useMoodTheme } from "@/hooks/useMoodTheme";
import { deleteEntry, getEntry, type JournalEntry } from "@/lib/journal";

export const Route = createFileRoute("/rueckblick/$id")({
  head: () => ({
    meta: [
      { title: "Eintrag – Gratitude Morning Coach" },
      {
        name: "description",
        content: "Ein vergangener Morgen im Detail: Stimmung, Dankbarkeit, Fokus und Coach-Text.",
      },
      { property: "og:title", content: "Eintrag – Gratitude Morning Coach" },
      {
        property: "og:description",
        content: "Ein vergangener Morgen im Detail.",
      },
    ],
  }),
  component: EntryDetailPage,
});

function EntryDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [hydrated, setHydrated] = useState(false);
  useMoodTheme(entry?.moodScore ?? null);

  useEffect(() => {
    setEntry(getEntry(id) ?? null);
    setHydrated(true);
  }, [id]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[40vh] bg-veil" />

      <div className="relative mx-auto w-full max-w-2xl px-5 pb-24 pt-8 sm:px-8">
        <Link
          to="/rueckblick"
          className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          ← Rückblick
        </Link>

        <div className="mt-8 flex flex-col items-center">
          {entry ? (
            <>
              <SnapshotCard entry={entry} state={entry.summary ? "ready" : "error"} />
              <button
                type="button"
                onClick={() => {
                  deleteEntry(entry.id);
                  void navigate({ to: "/rueckblick" });
                }}
                className="mt-8 rounded-full border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
              >
                Eintrag löschen
              </button>
            </>
          ) : hydrated ? (
            <div className="w-full rounded-4xl border border-dashed border-border bg-card/60 p-10 text-center">
              <p className="font-display text-xl text-foreground">Eintrag nicht gefunden</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Vielleicht wurde er gelöscht oder in einem anderen Browser gespeichert.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
