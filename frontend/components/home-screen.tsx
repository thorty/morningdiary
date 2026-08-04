"use client";

import { useEffect, useState } from "react";
import React from "react";

import {
  createHttpPersonalJournalApiClient,
  type PersonalJournalApiClient,
} from "@/lib/api/client";

type HomeScreenProps = {
  apiClient?: PersonalJournalApiClient;
};

const defaultClient = createHttpPersonalJournalApiClient();

export function HomeScreen({ apiClient = defaultClient }: HomeScreenProps) {
  const [serviceStatus, setServiceStatus] = useState("Verbinde mit dem Journal-Service...");

  useEffect(() => {
    let isMounted = true;
    void apiClient
      .getHealth()
      .then(() => {
        if (isMounted) {
          setServiceStatus("Journal-Service bereit.");
        }
      })
      .catch(() => {
        if (isMounted) {
          setServiceStatus("Journal-Service momentan nicht erreichbar.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [apiClient]);

  return (
    <main>
      <div className="shell">
        <h1 className="title">Morning Coach</h1>
        <p className="lead">
          Dein privates Personal Journal fuer einen klaren Morning Check-in am heutigen Tag.
        </p>

        <p className="privacy-note">
          Hinweis: Fuer die optionale Coach Summary werden nur die Antworten deines aktuellen Morning
          Check-ins an OpenAI gesendet. Dein API-Key bleibt ausschliesslich im Backend.
        </p>

        <section className="section" aria-label="Morning Check-in">
          <h2>Morning Check-in</h2>
          <p>Bereit fuer deine sechs Fragen mit Atemuebung als Einstieg.</p>
          <button type="button">Morning Check-in starten</button>
        </section>

        <section className="section" aria-label="Personal Journal">
          <h2>Personal Journal</h2>
          <p>Hier siehst du spaeter deine Daily Snapshots in neuer Reihenfolge zuerst.</p>
        </section>

        <p className="status" role="status">
          {serviceStatus}
        </p>
      </div>
    </main>
  );
}
