import { formatDateShort, type JournalEntry } from "@/lib/journal";

/**
 * Stimmungsverlauf als weiche Fläche – bewusst reduziert, kein Chart-Framework.
 */
export function MoodTrend({ entries }: { entries: JournalEntry[] }) {
  const data = [...entries].reverse().slice(-10);
  if (data.length < 2) return null;

  const w = 100;
  const h = 34;
  const step = w / (data.length - 1);
  const y = (score: number) => h - ((score - 1) / 4) * (h - 6) - 3;

  const points = data.map((e, i) => `${i * step},${y(e.moodScore)}`);
  const line = `M${points.join(" L")}`;
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <p className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Stimmungsverlauf
        </p>
        <p className="shrink-0 text-xs text-muted-foreground">
          letzte {data.length} Einträge
        </p>
      </div>

      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="mt-4 h-24 w-full"
        role="img"
        aria-label="Verlauf der Stimmungswerte"
      >
        <defs>
          <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1" className="text-primary">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>

        </defs>
        <path d={area} fill="url(#moodFill)" className="text-primary" />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="mt-2 grid grid-cols-2 text-[11px] text-muted-foreground">
        <span>{formatDateShort(data[0]!.date)}</span>
        <span className="text-right">{formatDateShort(data[data.length - 1]!.date)}</span>
      </div>
    </div>
  );
}
