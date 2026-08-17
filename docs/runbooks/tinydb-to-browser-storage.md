# TinyDB to Browser Storage Migration

This is a one-time developer runbook for an existing deployment that still has a
TinyDB JSON file. It is not a product feature. There is no import UI and there
is no public migration endpoint.

The migration must be completed before the application is upgraded to the
browser-local Personal Journal Store described by Ticket 02. After the
upgrade, `localStorage` in the current browser profile is the source of truth;
the stateless backend does not read the old file.

## 1. Back Up the Legacy File

Stop the old application and copy the TinyDB file before opening or editing
it. Use the actual path configured by the old deployment. The repository's
sample file is `personal-journal.json`.

```sh
cp personal-journal.json "personal-journal.json.backup-$(date +%Y%m%d-%H%M%S)"
```

Keep the backup until the migrated Journal Export has been downloaded and
checked. Do not delete or overwrite the legacy file as part of this procedure.

## 2. Start the New Application

Install and start the frontend and stateless backend after Ticket 02 and its
dependent tickets are implemented. The backend needs `OPENAI_API_KEY` only if
Coach Summary generation is enabled; it does not need a journal volume or the
TinyDB file.

```sh
# frontend/
npm install
npm run dev

# backend/ in a second terminal
uv sync --dev
uv run uvicorn app.main:app --reload
```

Open the frontend in the **same browser profile** that should own the migrated
Personal Journal. Do not run the migration in a private window or a different
browser profile.

## 3. Identify the Final Storage Key and Schema

Do not guess the key. Ticket 02 owns the final namespaced storage contract and
may choose a different key before implementation is complete.

1. Inspect the production `PersonalJournalStore` implementation and copy its
   exported storage key and schema version. The UI components must not be used
   as the source of this information.
2. In browser developer tools, open **Application** (or **Storage**) >
   **Local Storage** for the frontend origin.
3. Confirm the key is the Personal Journal Store key, not the separate User
   Profile, Coach Summary setting, or theme keys. The migration must write one
   versioned document with the store's exact field names.
4. If the key or schema is not available, stop. Do not write a guessed payload.

The console snippet below uses `STORAGE_KEY` and `SCHEMA_VERSION` placeholders
deliberately. Replace them with the values from Ticket 02. The expected record
fields are the fields used by the browser-local contract:

- `id`
- `browser_date`
- `status`
- `answers`
- `answered_questions`
- `next_question_number`
- `coach_summary`
- `coach_summary_status`
- `coach_summary_retry_available`

## 4. Prepare the Legacy JSON

Read the backed-up JSON file locally and paste its parsed object into the
`legacy` assignment in the next step. Pasting into the developer console is
intentional: this migration is developer-only and is not shipped in the app.

The legacy TinyDB shape is:

```json
{
  "morning_checkins": {
    "1": {
      "id": "stable-checkin-id",
      "browser_date": "2026-08-10",
      "status": "completed",
      "answers": [3, "...", null, "...", null, "..."],
      "answered_questions": [1, 2, 4, 6],
      "next_question_number": null,
      "coach_summary": "...",
      "coach_summary_status": "available",
      "coach_summary_retry_available": false
    }
  }
}
```

The numeric keys (`"1"` in this example) are TinyDB-internal row keys. They
must not become application identifiers. The nested record's `id` is the
stable identifier to preserve.

## 5. Validate and Write Once

Close every other frontend tab and window for this browser profile before
running the script. Run it in exactly one developer-console tab; this
single-writer safeguard prevents another application tab from changing the
target key during the migration. After replacing the schema placeholders,
paste the backed-up JSON into the prompt when the script asks for it. The
script parses and validates every record before calling `setItem`. A malformed
JSON value, invalid record, duplicate ID, or duplicate date aborts the
migration without changing the target key.

```js
const STORAGE_KEY = "REPLACE_WITH_TICKET_02_STORAGE_KEY";
const SCHEMA_VERSION = 1; // Replace with the final store schema version.
const legacyJson = window.prompt("Paste the backed-up TinyDB JSON");

if (legacyJson === null) {
  throw new Error("Migration aborted: no legacy JSON was provided");
}

let legacy;
try {
  legacy = JSON.parse(legacyJson);
} catch (error) {
  throw new Error(`Migration aborted: legacy JSON is invalid (${error.message})`);
}

function fail(message) {
  throw new Error(`Migration aborted: ${message}`);
}

if (!legacy || typeof legacy !== "object" || Array.isArray(legacy)) {
  fail("the backup root is not a JSON object");
}

const legacyRows = legacy.morning_checkins;
if (!legacyRows || typeof legacyRows !== "object" || Array.isArray(legacyRows)) {
  fail("missing object: morning_checkins");
}

const allowedStatuses = new Set(["unfinished", "completed"]);
const allowedSummaryStatuses = new Set(["available", "unavailable", "not_requested"]);
const ids = new Set();
const dates = new Set();

const records = Object.values(legacyRows).map((record, index) => {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    fail(`record ${index + 1} is not an object`);
  }

  const answers = record.answers;
  if (
    typeof record.id !== "string" ||
    record.id.length === 0 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(record.browser_date) ||
    !allowedStatuses.has(record.status) ||
    !Array.isArray(answers) ||
    answers.length !== 6 ||
    !answers.every((answer, answerIndex) =>
      answer === null ||
      (answerIndex === 0 && Number.isInteger(answer) && answer >= 1 && answer <= 5) ||
      (answerIndex > 0 && typeof answer === "string")
    ) ||
    !Array.isArray(record.answered_questions) ||
    !record.answered_questions.every(
      (question) => Number.isInteger(question) && question >= 1 && question <= 6,
    ) ||
    !(
      record.next_question_number === null ||
      (Number.isInteger(record.next_question_number) &&
        record.next_question_number >= 1 &&
        record.next_question_number <= 6)
    ) ||
    !allowedSummaryStatuses.has(record.coach_summary_status) ||
    typeof record.coach_summary_retry_available !== "boolean" ||
    !(record.coach_summary === undefined || record.coach_summary === null || typeof record.coach_summary === "string")
  ) {
    fail(`record ${index + 1} has an incompatible shape`);
  }

  if (ids.has(record.id)) fail(`duplicate stable id: ${record.id}`);
  if (dates.has(record.browser_date)) fail(`duplicate browser date: ${record.browser_date}`);
  ids.add(record.id);
  dates.add(record.browser_date);

  return {
    id: record.id,
    browser_date: record.browser_date,
    status: record.status,
    answers: [...record.answers],
    answered_questions: [...record.answered_questions],
    next_question_number: record.next_question_number,
    coach_summary: record.coach_summary ?? null,
    coach_summary_status: record.coach_summary_status,
    coach_summary_retry_available: record.coach_summary_retry_available,
  };
});

const existing = window.localStorage.getItem(STORAGE_KEY);
if (existing !== null) {
  fail("the target storage key already exists; inspect it and do not overwrite it");
}

const payload = {
  schema_version: SCHEMA_VERSION,
  morning_checkins: records,
};

// The write happens only after all legacy records have passed validation.
try {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  const written = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
  if (
    written.schema_version !== SCHEMA_VERSION ||
    JSON.stringify(written.morning_checkins) !== JSON.stringify(records)
  ) {
    fail("the written browser-storage document did not preserve every field");
  }
} catch (error) {
  window.localStorage.removeItem(STORAGE_KEY);
  if (error instanceof Error && error.message.startsWith("Migration aborted:")) {
    throw error;
  }
  fail("the written browser-storage document could not be verified");
}

console.info(`Migrated ${records.length} TinyDB records to ${STORAGE_KEY}.`);
```

If parsing the prompted `legacyJson` throws, stop immediately. Do not replace
it with a partially edited object and do not run the write step. If
`localStorage.setItem` throws because storage is unavailable or full, the
migration has not completed; resolve the browser-storage problem and rerun the
complete procedure from the backup.

## 6. Validate the Result

After the script succeeds:

1. Reload the application and open the Personal Journal. Every legacy record
   with `status: "completed"` should appear once, newest first.
2. Open representative Daily Snapshots and compare their dates, IDs, answers,
   completion state, `next_question_number`, Coach Summary text, Summary
   status, and retry availability with the backup.
3. Confirm unfinished records resume as Morning Check-ins and do not appear as
   completed Daily Snapshots.
4. Download a Journal Export and compare all completed records with the
   migrated backup.
5. Confirm the application still has the same User Profile, Coach Summary
   preference, and theme settings. The migration must not modify their
   separate local-storage keys.

If any validation fails, stop using the migrated data, retain the legacy
backup, and restore only through the documented store tooling or by repeating
the migration after correcting the input. Never overwrite the backup while
investigating.

This procedure is required only for developers upgrading an existing TinyDB
deployment. End users do not import files, and the product does not expose an
import UI or a public migration endpoint.
