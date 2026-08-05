import { Link } from "@tanstack/react-router";
import { formatDateShort, moodLabels, type JournalEntry } from "@/lib/journal";

export function EntryListItem({ entry }: { entry: JournalEntry }) {
  const todos = entry.answers.todos.filter((t) => t.trim());

  return (
    <Link
      to="/rueckblick/$id"
      params={{ id: entry.id }}
      className="group block rounded-3xl border border-border/70 bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {formatDateShort(entry.date)}
          </p>
          <p className="mt-1 truncate font-display text-lg text-foreground">
            {entry.summary?.theme
              ? `${entry.summary.theme} · ${moodLabels[entry.moodScore]}`
              : moodLabels[entry.moodScore]}
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {entry.summary?.recommendation ?? todos.join(" · ") ?? ""}
          </p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-warm font-display text-base text-primary-foreground shadow-soft">
          {entry.moodScore}
        </span>
      </div>
    </Link>
  );
}
