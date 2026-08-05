/**
 * Journal-Speicherung (leichtes NoSQL im Browser).
 *
 * Framework-unabhängig: reines TypeScript + localStorage.
 * In Next.js identisch nutzbar, nur aus Client-Komponenten aufrufen.
 */

export type CoachSummary = {
  moodText: string;
  theme: string;
  recommendation: string;
};

export type JournalAnswers = {
  moodWhy: string;
  gratitude: [string, string, string];
  todos: [string, string, string];
  happyHour: string;
  goal: string;
  control: string;
};

export type JournalEntry = {
  id: string;
  /** ISO-Datum, z.B. "2026-08-05" */
  date: string;
  moodScore: number;
  answers: JournalAnswers;
  summary: CoachSummary | null;
  createdAt: string;
};

const STORAGE_KEY = "gmc.journal.v1";

export const emptyAnswers = (): JournalAnswers => ({
  moodWhy: "",
  gratitude: ["", "", ""],
  todos: ["", "", ""],
  happyHour: "",
  goal: "",
  control: "",
});

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

/** Beispieldaten, damit Rückblick und Stimmungsverlauf sofort erlebbar sind. */
export const demoEntries: JournalEntry[] = [
  {
    id: "demo-1",
    date: todayKey(daysAgo(1)),
    moodScore: 4,
    answers: {
      moodWhy: "Gut geschlafen und der Morgen ist ruhig.",
      gratitude: ["Kaffee auf dem Balkon", "Nachricht von Lena", "Mein Rücken hält"],
      todos: ["Angebot fertig schreiben", "30 Minuten laufen", "Küche aufräumen"],
      happyHour: "Abends eine Stunde Klavier, ohne Handy",
      goal: "Das Angebot rausschicken",
      control: "Wie oft ich heute aufs Handy schaue",
    },
    summary: {
      moodText: "Ausgeruht und zuversichtlich",
      theme: "Fokus",
      recommendation:
        "Nutze die klare Energie am Morgen für das Angebot. Alles andere darf danach kommen.",
    },
    createdAt: daysAgo(1).toISOString(),
  },
  {
    id: "demo-2",
    date: todayKey(daysAgo(2)),
    moodScore: 3,
    answers: {
      moodWhy: "Etwas müde, viele offene Punkte im Kopf.",
      gratitude: ["Warme Dusche", "Der Hund", "Frisches Brot"],
      todos: ["Rechnungen sortieren", "Anruf mit Tim", "Spülmaschine"],
      happyHour: "Spaziergang am Wasser bei Sonnenuntergang",
      goal: "Den Kopf leer bekommen",
      control: "Eine Sache nach der anderen machen",
    },
    summary: {
      moodText: "Wach, aber ein wenig überladen",
      theme: "Erholung",
      recommendation:
        "Nimm dir heute nur eine wirklich wichtige Aufgabe vor. Der Spaziergang ist kein Extra, sondern Teil des Plans.",
    },
    createdAt: daysAgo(2).toISOString(),
  },
  {
    id: "demo-3",
    date: todayKey(daysAgo(4)),
    moodScore: 5,
    answers: {
      moodWhy: "Freier Tag, keine Termine.",
      gratitude: ["Sonne", "Zeit", "Ein gutes Buch"],
      todos: ["Markt", "Kochen", "Nichts tun"],
      happyHour: "Zwei Stunden lesen im Park",
      goal: "Wirklich abschalten",
      control: "Mein Tempo",
    },
    summary: {
      moodText: "Leicht und offen",
      theme: "Leichtigkeit",
      recommendation:
        "Halte den Tag bewusst leer. Die beste Entscheidung heute ist, nichts dazwischen zu schieben.",
    },
    createdAt: daysAgo(4).toISOString(),
  },
];

const isBrowser = () => typeof window !== "undefined";

export function loadEntries(): JournalEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return demoEntries;
    const parsed = JSON.parse(raw) as JournalEntry[];
    if (!Array.isArray(parsed)) return demoEntries;
    return parsed.sort((a, b) => (a.date < b.date ? 1 : -1));
  } catch {
    return demoEntries;
  }
}

function persist(entries: JournalEntry[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Speicher voll oder blockiert: Anzeige funktioniert weiterhin.
  }
}

/** Ein Eintrag pro Tag: heutiger Eintrag wird fortgeschrieben, nicht doppelt angelegt. */
export function saveTodayEntry(input: {
  moodScore: number;
  answers: JournalAnswers;
  summary: CoachSummary | null;
}): JournalEntry {
  const entries = loadEntries();
  const date = todayKey();
  const existing = entries.find((e) => e.date === date);
  const entry: JournalEntry = {
    id: existing?.id ?? `${date}-${Math.random().toString(36).slice(2, 8)}`,
    date,
    moodScore: input.moodScore,
    answers: input.answers,
    summary: input.summary,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  const next = [entry, ...entries.filter((e) => e.date !== date)].sort((a, b) =>
    a.date < b.date ? 1 : -1,
  );
  persist(next);
  return entry;
}

export function deleteEntry(id: string): JournalEntry[] {
  const next = loadEntries().filter((e) => e.id !== id);
  persist(next);
  return next;
}

export function getEntry(id: string): JournalEntry | undefined {
  return loadEntries().find((e) => e.id === id);
}

export const moodLabels: Record<number, string> = {
  1: "Schwer",
  2: "Gedämpft",
  3: "Okay",
  4: "Gut",
  5: "Strahlend",
};

export function formatDateLong(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 11) return "Guten Morgen";
  if (h < 17) return "Schön, dass du da bist";
  return "Guten Abend";
}
