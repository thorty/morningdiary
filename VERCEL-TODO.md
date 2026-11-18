# Vercel-Deployment: Todo-Liste

## Ziel und Rahmen

Die App bleibt ohne Login für alle erreichbar. Geplant ist ein Vercel-Projekt
mit zwei Services: einem öffentlichen Next.js-Frontend und einem privaten
FastAPI-Backend.

```text
Browser → Next.js-Route → privater FastAPI-Service → OpenAI
```

Das Frontend ruft das Backend serverseitig über ein Service Binding auf. Die
öffentliche Next.js-Route kann auch direkt außerhalb der App aufgerufen werden.
Rate-Limits reduzieren Missbrauch, verhindern ihn aber nicht vollständig.
Journal und Profil bleiben im Browser; eine Datenbank ist für das aktuelle
Produkt nicht erforderlich.

**Status:** Die Vercel-Konfiguration und die lokale Weiterleitungsroute sind im
Repository angelegt. Ein Vercel-Deployment und die Dashboard-Konfiguration sind
noch nicht verifiziert.
[Vercel Services](https://vercel.com/docs/services) und Service Bindings sind
laut Vercel Beta. Ihre Verfügbarkeit, Grenzen und Kosten vor dem Deployment
prüfen.

**Statusprüfung:** Haken sind nur bei Aufgaben gesetzt, die sich aus dem
Repository oder ausgeführten lokalen Prüfungen bestätigen lassen. Schritte
im Vercel-Dashboard, DNS, Backups und öffentliche Preview-/Produktions-Tests
sind von hier aus nicht verifizierbar.

## 1. Vorbereitung

- [ ] Vercel-Konto anlegen und GitHub-Zugriff für dieses Repository einrichten. (Dashboard-Schritt, hier nicht verifizierbar.)
- [ ] Ein Vercel-Team auswählen und den passenden Tarif prüfen. Der [Hobby-Tarif](https://vercel.com/docs/plans/hobby) ist kostenlos; Nutzungsbedingungen und enthaltene Kontingente für das Vorhaben prüfen. Falls gewünscht oder erforderlich, Pro und Zahlungsmethode einrichten.
- [ ] Kosten für [Services und Service Requests](https://vercel.com/docs/services/pricing), Functions, Datenverkehr, WAF und OpenAI prüfen. Auch ein kostenloses Vercel-Kontingent verhindert keine OpenAI-Kosten.
- [ ] Function-Region festlegen und Verfügbarkeit sowie Kosten prüfen, z. B. Frankfurt. Neue Projekte verwenden laut Vercel standardmäßig `iad1` in den USA; eine EU-Region allein garantiert keine vollständige EU-Datenverarbeitung.
- [ ] Entscheiden, ob `diary.thorstenweiskopf.de` übernommen wird. Bei gleicher HTTPS-Origin (Schema, Host und Port) bleibt das browserlokale Journal normalerweise verfügbar; bei einer anderen Origin ist es nicht automatisch sichtbar.
- [ ] Vor der Umstellung ein Journal-Export-Backup erstellen und Freunde dazu auffordern. Export nicht mit automatischer Synchronisierung oder einem bereits vorhandenen Import gleichsetzen.
- [ ] Aktuelle DNS-Einträge und Router-Portweiterleitungen dokumentieren, damit die Umstellung bei Bedarf rückgängig gemacht werden kann.

## 2. Anwendung anpassen

### Frontend und Weiterleitung

- [x] Eine serverseitige Next.js-Route für `POST /api/coach-summary` erstellen. Sie leitet nur an den fest konfigurierten Backend-Endpunkt weiter; keine frei wählbare Ziel-URL oder allgemeine Proxy-Funktion anbieten.
- [x] Den Coach-API-Client auf den relativen Pfad `/api/coach-summary` umstellen, sodass der Browser dieselbe Origin wie für das Frontend verwendet.
- [x] Das Service Binding im serverseitigen Route Handler verwenden, z. B. über `BACKEND_URL`. Vercel stellt die URL zur Laufzeit bereit; sie darf nicht mit `NEXT_PUBLIC_` im Browser veröffentlicht werden. (Code und `vercel.json` sind konfiguriert; Live-Verbindung noch testen.)
- [x] Lokalen Betrieb mit Docker Compose berücksichtigen: Der Next.js-Container muss das Backend über den Compose-Servicenamen und dessen internen Port erreichen können, nicht über `localhost`. Auch den lokalen Betrieb ohne Docker dokumentieren.
- [x] Timeouts und Fehler behandeln: Wenn das Backend nicht erreichbar ist oder zu lange braucht, muss der Check-in lokal abgeschlossen bleiben und die Zusammenfassung als nicht verfügbar angezeigt werden. Das bestehende Frontend-Timeout von zehn Sekunden und die Vercel-Function-Limits berücksichtigen.
- [x] Die bestehende Schnittstelle und das Antwortformat der Coach-Zusammenfassung beibehalten; keine Tagebucheinträge serverseitig speichern.

### Schutz und Datenschutz

- [ ] Für die öffentliche Coach-Route ein Rate-Limit festlegen. Vercels [WAF Rate Limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) und dessen Tarifgrenzen prüfen; bei Überschreitung HTTP `429` verwenden. Die Zähler gelten laut Vercel pro Region, nicht als globale Kostengrenze.
- [x] Grenzen für Anfragegröße und Eingaben festlegen und durchsetzen; nur das benötigte JSON-Format und die erwartete HTTP-Methode akzeptieren. (Route begrenzt den Body auf 16 KiB, prüft JSON/Content-Type; FastAPI validiert das Schema.)
- [ ] Falls ein eigenes Rate-Limit statt der WAF eingesetzt wird: vertrauenswürdige Client-IP-Ermittlung hinter Vercel prüfen und clientseitig gesetzte Header nicht blind vertrauen. Ein In-Memory-Zähler ist über Neustarts und mehrere Function-Instanzen nicht zuverlässig; Kosten eines gemeinsamen Speichers berücksichtigen.
- [ ] OpenAI-Ausgaben und Nutzung überwachen und die verfügbaren Budget- und Limit-Einstellungen prüfen. Warnungen nicht als garantierte harte Kostengrenze behandeln.
- [x] Keine API-Keys, Journalantworten oder vollständigen Request-Bodys in Anwendungslogs schreiben. (Im aktuellen Anwendungscode werden keine solchen Inhalte geloggt.)
- [x] Datenschutzinformationen ergänzen: Journal im Browser, freiwillige Übermittlung aktueller Antworten an Backend und KI-Anbieter, keine automatische Synchronisierung oder serverseitiges Backup. (Onboarding und Dokumentation enthalten diese Hinweise.)

## 3. Vercel-Konfiguration erstellen

- [x] `vercel.json` im Repository-Root für [Vercel Services](https://vercel.com/docs/services) anlegen; `compose.yaml` bleibt für den lokalen Betrieb erhalten und wird nicht automatisch als Vercel-Konfiguration verwendet.
- [x] `frontend/` als Next.js-Service und `backend/` als FastAPI-Service definieren. Den vorhandenen Python-Einstiegspunkt `app.main:app` und die Abhängigkeiten über `backend/pyproject.toml` konfigurieren.
- [x] Am Frontend ein Service Binding zum Backend deklarieren, das die Laufzeitvariable `BACKEND_URL` bereitstellt. Keine statische interne Adresse oder manuell gesetzte Binding-URL verwenden.
- [x] Öffentliches Routing ausschließlich auf das Frontend konfigurieren. **Keine** öffentliche Rewrite-Regel auf das Backend anlegen; ein Binding allein macht das Backend nicht öffentlich.
- [ ] Python-Version und Function-Region mit den Projektanforderungen abgleichen. Vercel baut die beiden Services separat und führt FastAPI als Function aus; bestehende Dockerfiles und Compose-Ports sind nicht automatisch die Vercel-Runtime.
- [x] Der Backend-Code liest `OPENAI_API_KEY` serverseitig; der Key wird nicht im Frontend-Code oder in `NEXT_PUBLIC_*`-Variablen verwendet. Das Vercel-Secret selbst muss im Dashboard gesetzt werden (siehe Abschnitt 4).
- [x] Änderungen lokal prüfen: Frontend-Typecheck, Coach-Client-Tests, Frontend-Build und `docker compose config` waren erfolgreich.
- [ ] Änderungen committen und auf den für Vercel vorgesehenen GitHub-Branch pushen.

## 4. In Vercel einrichten und deployen

- [ ] Im [Vercel-Dashboard](https://vercel.com/dashboard) **Add New → Project** wählen und das GitHub-Repository importieren.
- [ ] Als Root Directory das Repository-Root verwenden, damit die `vercel.json` beide Service-Verzeichnisse findet. Projektname, Team und Produktions-Branch prüfen.
- [ ] Unter **Settings → Environment Variables** `OPENAI_API_KEY` als Secret für die benötigten Umgebungen setzen. Preview und Production bewusst konfigurieren; auf Previews kann sonst ebenfalls OpenAI-Nutzung entstehen.
- [ ] In den Function-Einstellungen die gewünschte Region konfigurieren beziehungsweise die Service-Konfiguration prüfen. Änderungen an Umgebungsvariablen oder Region gegebenenfalls durch ein neues Deployment übernehmen.
- [ ] Deploy starten und Build- sowie Runtime-Logs beider Services auf Fehler prüfen. Prüfen, dass `BACKEND_URL` durch das Binding zur Laufzeit bereitgestellt wird.
- [ ] Im Projekt unter **Firewall → Configure → New Rule** eine Regel für die öffentliche Coach-Route anlegen: passenden Pfad, Zeitfenster und Anzahl pro Quelle wählen; Aktion `429`, Änderungen prüfen und veröffentlichen. Die Einstellungen und Kosten des gewählten Tarifs prüfen.
- [ ] Git-Deployments und Preview-Schutz prüfen. Produktion soll öffentlich nutzbar sein; Preview-Zugriff und Preview-Secrets bewusst festlegen.

## 5. Vor der Domain-Umstellung testen

- [ ] Frontend zunächst über die Vercel-Testdomain öffnen; beachten, dass deren `localStorage` von der bisherigen Domain getrennt ist.
- [ ] Check-in durchführen, Journal öffnen, Export prüfen und eine Coach-Zusammenfassung anfordern.
- [ ] Ohne konfigurierten Key bzw. bei unerreichbarem Backend prüfen, dass der Check-in gespeichert bleibt und die Zusammenfassung als nicht verfügbar erscheint.
- [ ] Öffentliche Routing-Regeln prüfen und testen, dass das Backend nicht direkt über eine öffentliche Route erreichbar ist, der Frontend-Route-Handler es aber über das Binding erreicht. Die öffentliche Coach-Route selbst bleibt absichtlich erreichbar.
- [ ] Ungültige und zu große Anfragen sowie das Rate-Limit testen; prüfen, dass bei Überschreitung keine weiteren KI-Aufrufe erfolgen.
- [ ] Prüfen, dass weder OpenAI-Key noch interne Backend-Adresse im Browser-Bundle oder in Logs preisgegeben werden.
- [ ] Vercel-Nutzung und OpenAI-Ausgaben nach den Tests kontrollieren; verfügbare Benachrichtigungen einrichten.

## 6. Eigene Domain umstellen

- [ ] Im Vercel-Projekt unter **Settings → Domains → Add Existing** `diary.thorstenweiskopf.de` hinzufügen.
- [ ] Beim DNS-Anbieter die im Dashboard angezeigten Einträge für diese Subdomain setzen und alte, widersprechende Einträge gemäß [Vercel-Domainanleitung](https://vercel.com/docs/domains/working-with-domains/add-a-domain) prüfen.
- [ ] Den bisherigen DynDNS-Updater für genau diese Subdomain deaktivieren, damit er den neuen DNS-Eintrag nicht überschreibt.
- [ ] Im Vercel-Dashboard Domain- und Zertifikatsstatus prüfen und warten, bis HTTPS aktiv ist.
- [ ] Die App über `https://diary.thorstenweiskopf.de` testen: Zertifikat, Journal, Check-in und Coach-Funktion. Die bestehende Origin und ihre lokalen Daten im selben Browser prüfen.
- [ ] Während der DNS-Umstellung mögliche Verzögerungen und kurzzeitige Ausfälle einplanen; bei Problemen anhand der dokumentierten alten DNS-Einträge zurückrollen.
- [ ] Erst nach erfolgreicher Umstellung und soweit für keine anderen Dienste benötigt die bisherigen Router-Portweiterleitungen schließen; alte Heimserver-Konfiguration nicht vorschnell löschen.

## Referenzen

- [Vercel Services](https://vercel.com/docs/services)
- [Next.js und Python mit Vercel Services](https://vercel.com/kb/guide/python-backend-on-vercel)
- [Service Bindings](https://vercel.com/docs/services/bindings)
- [Services: Kosten und Limits](https://vercel.com/docs/services/pricing)
- [WAF Rate Limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)
- [Custom Domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
