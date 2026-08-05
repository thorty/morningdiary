import { useMoodTheme } from "@/hooks/useMoodTheme";
import { THEMES, type ThemeMode } from "@/lib/theme";

export function ThemePicker({
  className = "",
  moodScore = null,
}: {
  className?: string;
  moodScore?: number | null;
}) {
  const { mode, setMode, hydrated, theme } = useMoodTheme(moodScore);

  const options: { id: ThemeMode; label: string; swatch: string }[] = [
    { id: "auto", label: "Automatisch nach Stimmung", swatch: "" },
    ...THEMES.map((t) => ({ id: t.id as ThemeMode, label: t.label, swatch: t.swatch })),
  ];

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-2 shadow-soft backdrop-blur ${className}`}
    >
      <span className="pr-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Stimmung
      </span>
      {options.map((o) => {
        const active = hydrated && mode === o.id;
        const isAuto = o.id === "auto";
        return (
          <button
            key={o.id}
            type="button"
            aria-label={`Farbstimmung ${o.label}`}
            aria-pressed={active}
            title={o.label}
            onClick={() => setMode(o.id)}
            className={[
              "grid size-6 place-items-center rounded-full transition-all duration-300",
              isAuto ? "border border-border/80 bg-card" : "",
              active
                ? "ring-2 ring-foreground/40 ring-offset-2 ring-offset-card"
                : "opacity-70 hover:scale-110 hover:opacity-100",
            ].join(" ")}
            style={isAuto ? undefined : { background: o.swatch }}
          >
            {isAuto ? (
              <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground">
                A
              </span>
            ) : null}
          </button>
        );
      })}
      {hydrated && mode === "auto" ? (
        <span className="pl-1 text-[10px] font-medium text-muted-foreground">
          {THEMES.find((t) => t.id === theme)?.label}
        </span>
      ) : null}
    </div>
  );
}
