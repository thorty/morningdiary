"use client";

import React, { useEffect, useState } from "react";

import type { PersonalJournalApiClient } from "@/lib/api/client";
import { loadCoachSummaryEnabled, saveCoachSummaryEnabled } from "@/lib/coach-summary-settings";

export function ConfigurationMenu({
  apiClient,
  onJournalDeleted,
}: {
  apiClient: PersonalJournalApiClient;
  onJournalDeleted: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coachSummaryEnabled, setCoachSummaryEnabled] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => setCoachSummaryEnabled(loadCoachSummaryEnabled()), []);

  function updateCoachSummaryEnabled(enabled: boolean): void {
    setCoachSummaryEnabled(enabled);
    saveCoachSummaryEnabled(enabled);
  }

  async function deleteJournal(): Promise<void> {
    if (!window.confirm("Wirklich alle Daily Snapshots und angefangenen Check-ins löschen?")) return;
    setIsDeleting(true);
    try {
      await apiClient.deletePersonalJournal();
      onJournalDeleted();
      setIsOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="configuration-menu">
      <button type="button" aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>
        Einstellungen
      </button>
      {isOpen ? (
        <div className="configuration-popover">
          <label className="configuration-toggle">
            <input
              checked={coachSummaryEnabled}
              onChange={(event) => updateCoachSummaryEnabled(event.target.checked)}
              type="checkbox"
            />
            Coach Summary mit OpenAI aktivieren
          </label>
          <button className="configuration-delete" disabled={isDeleting} onClick={() => void deleteJournal()} type="button">
            {isDeleting ? "Historie wird gelöscht..." : "Historie löschen"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
