"use client";

import Link from "next/link";
import React from "react";

import { MorningCheckin } from "@/components/morning-checkin";
import { ConfigurationMenu } from "@/components/configuration-menu";
import type { PersonalJournalApiClient } from "@/lib/api/client";
import { defaultPersonalJournalApiClient } from "@/lib/api/default-client";

export function MorningCheckinPage({
  apiClient = defaultPersonalJournalApiClient,
  todayDateProvider = () => new Date(),
}: {
  apiClient?: PersonalJournalApiClient;
  todayDateProvider?: () => Date;
}) {
  return (
    <main>
      <div className="shell">
        <nav className="page-nav" aria-label="Seitennavigation">
          <Link href="/">Zur Startseite</Link>
          <Link href="/journal">Personal Journal</Link>
          <ConfigurationMenu apiClient={apiClient} onJournalDeleted={() => window.location.reload()} />
        </nav>
        <MorningCheckin
          apiClient={apiClient}
          todayDateProvider={todayDateProvider}
          startCheckinRequest={0}
          autoStart
          onSnapshotCompleted={() => undefined}
        />
      </div>
    </main>
  );
}
