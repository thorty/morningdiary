"use client";

import Link from "next/link";
import React from "react";

import { MorningCheckin } from "@/components/morning-checkin";
import { createHttpPersonalJournalApiClient, type PersonalJournalApiClient } from "@/lib/api/client";

const defaultClient = createHttpPersonalJournalApiClient();

export function MorningCheckinPage({
  apiClient = defaultClient,
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
