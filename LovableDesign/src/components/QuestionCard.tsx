import type { ReactNode } from "react";

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={[
            "h-1.5 rounded-full transition-all duration-500",
            i < current ? "w-8 bg-primary" : i === current ? "w-8 bg-primary/50" : "w-1.5 bg-border",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

export function QuestionCard({
  step,
  total,
  kicker,
  question,
  hint,
  children,
  onBack,
  onNext,
  nextLabel = "Weiter",
  nextDisabled,
}: {
  step: number;
  total: number;
  kicker: string;
  question: string;
  hint?: string;
  children: ReactNode;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="w-full max-w-xl">
      <div className="flex items-center justify-between gap-4">
        <ProgressDots total={total} current={step} />
        <span className="shrink-0 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {step + 1} / {total}
        </span>
      </div>

      <div
        key={step}
        className="mt-6 rounded-4xl border border-border/70 bg-card p-6 shadow-lift animate-rise sm:p-9"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {kicker}
        </p>
        <h2 className="mt-3 font-display text-2xl leading-snug text-foreground sm:text-3xl">
          {question}
        </h2>
        {hint ? <p className="mt-2 text-sm text-muted-foreground">{hint}</p> : null}

        <div className="mt-7">{children}</div>

        <div className="mt-9 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Zurück
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className="rounded-full bg-warm px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition-all duration-300 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const fieldClasses =
  "w-full rounded-2xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/70 outline-none transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/15";

export function TextField({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={fieldClasses}
    />
  );
}

export function TextAreaField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      rows={3}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${fieldClasses} resize-none`}
    />
  );
}

export function TripleFields({
  values,
  onChange,
  placeholders,
}: {
  values: [string, string, string];
  onChange: (index: number, v: string) => void;
  placeholders: [string, string, string];
}) {
  return (
    <div className="space-y-3">
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary font-display text-sm text-secondary-foreground">
            {i + 1}
          </span>
          <input
            type="text"
            value={v}
            autoFocus={i === 0}
            onChange={(e) => onChange(i, e.target.value)}
            placeholder={placeholders[i]}
            className={fieldClasses}
          />
        </div>
      ))}
    </div>
  );
}
