import { formatDateLong, moodLabels, type JournalEntry } from "@/lib/journal";

function MoodBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
      <span className="grid size-5 place-items-center rounded-full bg-warm font-display text-[11px] text-primary-foreground">
        {score}
      </span>
      {moodLabels[score]}
    </span>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border/70 pt-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 text-[15px] leading-relaxed text-foreground">{children}</div>
    </div>
  );
}

export function SnapshotCard({
  entry,
  state = "ready",
  onRetry,
}: {
  entry: JournalEntry;
  /** Zustand der Coach-Zusammenfassung */
  state?: "loading" | "ready" | "error";
  onRetry?: () => void;
}) {
  const todos = entry.answers.todos.filter((t) => t.trim());
  const gratitude = entry.answers.gratitude.filter((t) => t.trim());

  return (
    <article className="w-full max-w-xl overflow-hidden rounded-4xl border border-border/70 bg-card shadow-lift animate-bloom">
      <header className="bg-sunrise px-6 py-7 sm:px-9">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/70">
          Karte des Tages
        </p>
        <h2 className="mt-2 font-display text-2xl text-foreground sm:text-3xl">
          {formatDateLong(entry.date)}
        </h2>
        <div className="mt-4">
          <MoodBadge score={entry.moodScore} />
        </div>
      </header>

      <div className="space-y-5 px-6 py-7 sm:px-9">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Der Coach fasst zusammen
          </p>
          {state === "loading" ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-muted-foreground">Der Coach liest deine Antworten …</p>
              <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-4/5 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
            </div>
          ) : state === "error" || !entry.summary ? (
            <div className="mt-3 rounded-2xl border border-border bg-muted/60 p-4">
              <p className="text-sm text-foreground">
                Die Zusammenfassung konnte gerade nicht erstellt werden. Dein Eintrag ist
                trotzdem gespeichert.
              </p>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-3 rounded-full border border-primary/40 px-4 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  Erneut versuchen
                </button>
              ) : null}
            </div>
          ) : (
            <div className="mt-3 rounded-3xl bg-secondary/70 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-foreground">
                  Stimmung: {entry.summary.moodText}
                </span>
                <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-sage-foreground">
                  Thema: {entry.summary.theme}
                </span>
              </div>
              <p className="mt-3 font-display text-lg leading-relaxed text-foreground">
                {entry.summary.recommendation}
              </p>
            </div>
          )}
        </div>

        {gratitude.length > 0 ? (
          <Row label="Dankbar für">
            <ul className="flex flex-wrap gap-2">
              {gratitude.map((g, i) => (
                <li
                  key={i}
                  className="rounded-full bg-rose/60 px-3 py-1 text-sm text-rose-foreground"
                >
                  {g}
                </li>
              ))}
            </ul>
          </Row>
        ) : null}

        {todos.length > 0 ? (
          <Row label="Die drei wichtigsten Dinge">
            <ol className="space-y-2">
              {todos.map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary font-display text-xs text-secondary-foreground">
                    {i + 1}
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </Row>
        ) : null}

        {entry.answers.happyHour.trim() ? (
          <Row label="Happy Hour">{entry.answers.happyHour}</Row>
        ) : null}
        {entry.answers.goal.trim() ? (
          <Row label="Wichtigstes Ziel">{entry.answers.goal}</Row>
        ) : null}
        {entry.answers.control.trim() ? (
          <Row label="Das kann ich beeinflussen">{entry.answers.control}</Row>
        ) : null}
        {entry.answers.moodWhy.trim() ? (
          <Row label="Warum diese Stimmung">{entry.answers.moodWhy}</Row>
        ) : null}
      </div>
    </article>
  );
}
