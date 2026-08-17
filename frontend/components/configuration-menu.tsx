"use client";

import React, { useEffect, useState } from "react";

import { useAppAccess } from "@/components/app-entry";
import type { PersonalJournalApiClient } from "@/lib/api/client";
import { loadCoachSummaryEnabled, saveCoachSummaryEnabled } from "@/lib/coach-summary-settings";

export function ConfigurationMenu({
  apiClient,
  onJournalDeleted,
}: {
  apiClient: PersonalJournalApiClient;
  onJournalDeleted: () => void;
}) {
  const { logout } = useAppAccess();
  const [isOpen, setIsOpen] = useState(false);
  const [coachSummaryEnabled, setCoachSummaryEnabled] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => setCoachSummaryEnabled(loadCoachSummaryEnabled()), []);

  function updateCoachSummaryEnabled(enabled: boolean): void {
    setCoachSummaryEnabled(enabled);
    saveCoachSummaryEnabled(enabled);
  }

  async function deleteJournal(): Promise<void> {
    if (!window.confirm("Wirklich alle Daily Snapshots und angefangenen Check-ins löschen?")) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.deletePersonalJournal();
      onJournalDeleted();
      setIsOpen(false);
    } catch (caughtError) {
      setDeleteError(caughtError instanceof Error ? caughtError.message : "Das Personal Journal konnte nicht gelöscht werden.");
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
          {deleteError ? <p className="status" role="alert">{deleteError}</p> : null}
          <button className="configuration-logout" onClick={logout} type="button">Abmelden</button>
        </div>
      ) : null}
    </div>
  );
}
