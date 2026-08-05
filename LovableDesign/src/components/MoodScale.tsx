import { moodLabels } from "@/lib/journal";

const FACES: Record<number, string> = {
  1: "M8 15c1.2-1.2 2.6-1.8 4-1.8s2.8.6 4 1.8",
  2: "M8 14.5h8",
  3: "M8 14h8",
  4: "M8 13.5c1.2 1.2 2.6 1.8 4 1.8s2.8-.6 4-1.8",
  5: "M7.5 13c1.4 1.8 2.9 2.7 4.5 2.7s3.1-.9 4.5-2.7",
};

export function MoodScale({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-pressed={active}
              aria-label={`${n} – ${moodLabels[n]}`}
              className={[
                "group flex flex-col items-center gap-2 rounded-3xl border px-1 py-4 transition-all duration-300",
                active
                  ? "border-transparent bg-warm text-primary-foreground shadow-lift"
                  : "border-border bg-card text-muted-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground",
              ].join(" ")}
            >
              <svg viewBox="0 0 24 24" className="size-7" fill="none" strokeWidth="1.6">
                <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
                <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
                <path
                  d={FACES[n]}
                  stroke="currentColor"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <span className="font-display text-lg leading-none">{n}</span>
              <span className="text-[11px] leading-none">{moodLabels[n]}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        1 = schwer, 5 = strahlend. Es gibt keine falsche Antwort.
      </p>
    </div>
  );
}
