import { useEffect, useRef, useState } from "react";

type Phase = { label: string; seconds: number };

const PHASES: Phase[] = [
  { label: "Atme ein – 4 Sekunden", seconds: 4 },
  { label: "Atme aus – 6 Sekunden", seconds: 6 },
  { label: "Atme ein – 4 Sekunden", seconds: 4 },
  { label: "Atme aus – 6 Sekunden", seconds: 6 },
  { label: "Atme ein – 4 Sekunden", seconds: 4 },
  { label: "Atme aus – 6 Sekunden", seconds: 6 },
];

const TOTAL = 30;

export function BreathTimer({
  onDone,
  onSkip,
}: {
  onDone: () => void;
  onSkip: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const next = Math.min(TOTAL, (Date.now() - start) / 1000);
      setElapsed(next);
      if (next >= TOTAL && !doneRef.current) {
        doneRef.current = true;
        window.clearInterval(id);
        onDone();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [onDone]);

  const remaining = Math.max(0, Math.ceil(TOTAL - elapsed));
  const progress = Math.min(1, elapsed / TOTAL);

  // Aktuelle Phase anhand der verstrichenen Sekunden
  let acc = 0;
  let phase = PHASES[0]!;
  for (const p of PHASES) {
    acc += p.seconds;
    if (elapsed < acc) {
      phase = p;
      break;
    }
    phase = p;
  }

  const r = 88;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
        30 Sekunden ankommen
      </p>

      <div className="relative mt-10 grid size-64 place-items-center sm:size-72">
        <div className="absolute inset-4 rounded-full bg-warm opacity-25 blur-2xl animate-breathe" />
        <div className="absolute inset-8 rounded-full bg-card shadow-glow" />

        <svg viewBox="0 0 200 200" className="absolute inset-0 size-full -rotate-90">
          <circle
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-border"
          />
          <circle
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-primary transition-[stroke-dashoffset] duration-100 ease-linear"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>

        <div className="relative z-10 flex flex-col items-center">
          <span className="font-display text-6xl leading-none text-foreground">
            {remaining}
          </span>
          <span className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Sekunden
          </span>
        </div>
      </div>

      <p
        key={phase.label}
        className="mt-10 min-h-7 font-display text-xl text-foreground animate-rise"
      >
        {phase.label}
      </p>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Schultern locker lassen. Danach geht es automatisch zur ersten Frage.
      </p>

      <button
        type="button"
        onClick={onSkip}
        className="mt-8 rounded-full px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        Überspringen
      </button>
    </div>
  );
}
