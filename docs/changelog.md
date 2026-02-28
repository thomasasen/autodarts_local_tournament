# Changelog

## Unreleased
- Turnierzeit-Prognose ergänzt:
  - neue pure Domain-Datei `src/domain/tournament-duration.js`
  - Live-Schätzung in der Turnieranlage unter `Teilnehmer`
  - Berechnung berücksichtigt Modus, Teilnehmerzahl, `Best of`, `Startpunkte`, `In`, `Out`, `Bull-off`, `Bull-Modus` und `Max Runden`
  - Ausgabe als Hauptwert plus realistische Spannweite
- Neue globale Einstellung:
  - `settings.tournamentTimeProfile` mit `fast | normal | slow`
  - Select im Tab `Einstellungen` zur Kalibrierung lokaler Spielgeschwindigkeit
- Tests und Doku erweitert:
  - neue Domain-Unit-Tests für Matchanzahl und Zeitlogik
  - README, Architektur- und Codebase-Dokumentation aktualisiert

## 0.3.4
- DRA-Compliance-Hardening umgesetzt:
  - Storage auf `schemaVersion: 4` angehoben.
  - Regelmodell auf `tournament.rules.tieBreakProfile` umgestellt:
    - `promoter_h2h_minitable`
    - `promoter_points_legdiff`
  - Legacy-Mapping ergänzt:
    - `dra_strict -> promoter_h2h_minitable`
    - `legacy -> promoter_points_legdiff`
- KO-Engine verfeinert:
  - vollständige Match-Materialisierung über alle KO-Runden
  - Freilose als explizite Bye-Matches (`meta.resultKind = bye`)
  - zukünftige KO-Slots bleiben als nicht editierbare offene Paarungen sichtbar
- Draw-Lock eingeführt:
  - neues Feature-Flag `settings.featureFlags.koDrawLockDefault` (Standard `true`)
  - neues Turnierfeld `tournament.ko.drawLocked`
  - neues Turnierfeld `tournament.ko.placement`
  - UI-Toggle für aktives KO-Turnier in den Einstellungen
- Bracket-Payload korrigiert:
  - Vollbaum-Darstellung auch bei frühem Turnierstand
  - Bye-/Completion-Kennzeichnung konsistent
- QA erweitert:
  - neue Regelcheck-Marker für KO-Materialisierung, Bye-Handling, Draw-Lock und Promoter-Tie-Break-Profile
  - Selftests um KO-Struktur-, Draw-Lock- und Profilszenarien erweitert
- Neue Compliance-Dokumentation:
  - `docs/dra-compliance-matrix.md`

## 0.3.3
- History-Import gehärtet:
  - Ergebnis wird bevorzugt in das bereits per `lobbyId` verknüpfte offene Turnier-Match geschrieben.
  - Namenszuordnung robust erweitert (Teilnamen/Varianten), falls Tabellenanzeige vom Turniernamen abweicht.
  - Legs werden bei abweichenden Match-Settings sicher auf den Turniermodus normalisiert, damit das Ergebnis in `Ergebnisführung` gespeichert wird.
  - Zusätzliche Selftests für History-Import ergänzt.

## 0.3.2
- Match-Statistik-Import überarbeitet:
  - Floating-Shortcut unten rechts entfernt.
  - Inline-Import auf `/history/matches/{id}` visuell präsenter gestaltet.
  - Klick übernimmt Ergebnis primär direkt aus der Statistik-Tabelle (Spieler, Gewinner, Legs).
  - API-Sync wird nur noch als Fallback genutzt, wenn die Tabelle nicht parsbar ist.
  - Import priorisiert jetzt ein bereits verknüpftes Lobby-Match, um die Ergebnisführung sicher im richtigen Spiel zu aktualisieren.
  - Namenszuordnung wurde toleranter gemacht (Teilename/Varianten).
  - Legs werden bei abweichenden Match-Einstellungen kontrolliert auf den Turniermodus normalisiert.

## 0.3.1
- Ergebnisübernahme erweitert:
  - neuer Inline-Button auf `/history/matches/{id}`: `Ergebnis übernehmen & Turnier öffnen`
  - bestehender Floating-Shortcut bleibt als Fallback aktiv.
- API-Sync robuster gemacht:
  - Recovery kann offene Turnier-Matches auch ohne gespeicherte `lobbyId` über API-Stats/Spielernamen wiederfinden
  - bei mehrdeutiger Zuordnung wird mit klarer Meldung abgebrochen (kein unsicheres Auto-Write).
- Sync-Transparenz erhöht:
  - `syncResultForLobbyId` unterstützt `trigger` (`inline-history`, `floating-shortcut`, `background`)
  - Rückgaben enthalten `reasonCode` (`not_found`, `ambiguous`, `pending`, `completed`, `auth`, `error`)
  - zusätzliche `[ATA][api]`-Logs für Trigger, Recovery-Kandidaten und Sync-Ausgang.
- Persistenz gehärtet:
  - Recovery-Verknüpfung speichert sofort (mit Fallback auf Debounce), damit F5 die Zuordnung nicht verliert.

## 0.3.0
- Codebasis in Schichten aufgeteilt (`src/core`, `src/data`, `src/domain`, `src/infra`, `src/ui`, `src/bracket`, `src/runtime`).
- Build-Pipeline ohne npm/Node eingeführt:
  - deterministischer Build via `scripts/build.ps1`
  - Reihenfolge über `build/manifest.json`
  - CSS aus `src/ui/styles/main.css` wird in das Bundle eingebettet.
- Storage auf `schemaVersion: 3` angehoben.
- Neues Turnier-Regelfeld:
  - `tournament.rules.tieBreakMode` (`dra_strict | legacy`)
  - Bestandsdaten werden auf `dra_strict` migriert.
- DRA-strikte Tie-Break-Logik umgesetzt:
  - Punkte
  - Direktvergleich (2 Punktgleiche)
  - Teilgruppen-LegDiff (3+ Punktgleiche)
  - Gesamt-LegDiff
  - Gesamt-Legs+
  - danach `playoff_required`.
- Gruppen-zu-KO-Auflösung blockiert bei `playoff_required`.
- PDC-konforme Terminologie in der UI ergänzt:
  - `Freilos (Bye)`
  - `KO (Straight Knockout)`
  - `Liga (Round Robin)`
  - `Nächstes Match (Next Match)`.
- Diagnose-API ergänzt:
  - `window.__ATA_RUNTIME.runSelfTests()`.
- Mehrstufige QA-Skripte ergänzt:
  - `scripts/qa.ps1`
  - `scripts/qa-encoding.ps1`
  - `scripts/qa-regelcheck.ps1`.

## 0.2.17
- Turnierformular (`Neues Turnier erstellen`) visuell und strukturell optimiert:
  - kompakte Zwei-Zonen-Ansicht (Konfiguration links, Teilnehmer + Aktionen rechts), damit die Inhalte auf Desktop besser auf eine Bildschirmansicht passen
  - Preset-Button verkleinert (`PDC Preset anwenden`) und besser in die Formularlogik integriert
  - Feldreihenfolge angepasst (`Bull-off` vor `Bull mode`).
- Lokale Lobby-Härtung:
  - Lobby ist nicht mehr wählbar im Formular
  - API-Create setzt `isPrivate` nun fest auf `true`
  - interne Normalisierung erzwingt `lobbyVisibility = private`.

## 0.2.16
- Turnierformular im Tab `Turnier` auf 3-Spalten-Layout umgestellt, damit die X01-Einstellungen auf normalen Monitoren kompakter sichtbar sind.
- X01-Preset-Handling umgebaut:
  - Preset-Auswahlfeld entfernt
  - neuer Button `PDC Preset anwenden` setzt die PDC-Defaults direkt in die Formularfelder
  - manuelle X01-Änderungen markieren den Preset-Status automatisch als `Custom`.
- Formularabhängigkeiten erweitert:
  - bei `Bull-off = Off` wird `Bull mode` read-only deaktiviert
  - Persistenz bleibt stabil durch Hidden-Fallback für deaktivierte Felder.
- Match-Create-Payload verfeinert:
  - `bullOffMode` wird beim Lobby-Create auf Top-Level übertragen (wie in `play.autodarts.io`).
  - `bullMode` bleibt gesetzt (mit Fallback), damit Matchstart nicht an Backend-Validierungen scheitert.
- Legacy-Startscores (`101`, `201`) aus der X01-Auswahl und Sanitization entfernt.

## 0.2.15
- X01-Matchanlage für API-Start erweitert:
  - Turnier-Neuanlage enthält jetzt X01-Parameter aus der Autodarts-Lobbyoberfläche:
    - Startscore, In mode, Out mode, Bull mode, Bull-off, Max Runden, Lobby-Sichtbarkeit
  - Spielmodus bleibt bewusst `Legs` und wird aus `Best-of Legs` als `First to N` abgeleitet
  - `Match starten` übernimmt diese Werte konsistent in den Lobby-Create-Payload.
- PDC-Preset für Neuanlage eingeführt:
  - Standard ist `PDC Standard` (501, Straight In, Double Out, 25/50, Bull-off Normal, Max Rounds 50, Lobby privat)
  - optionaler `Custom`-Modus für abweichende X01-Einstellungen.
- Startscore-Optionen um die X01-Lobbywerte erweitert (`121, 170, 301, 501, 701, 901`; Legacy `101, 201` bleibt import-/kompatibel).
- UI-Transparenz verbessert:
  - aktives Turnier zeigt die hinterlegten X01-Settings kompakt an.

## 0.2.14
- Match-Seiten-Shortcut hinzugefügt:
  - auf `/lobbies/{id}` und `/matches/{id}` erscheint ein Button für `Ergebnis übernehmen & Turnier öffnen`
  - Shortcut öffnet direkt den Tab `Spiele` im Turnierassistenten.
- Gezielte manuelle Ergebnisübernahme pro Lobby-ID:
  - Sync kann für genau ein Lobby-Match aktiv ausgelöst werden (statt nur passiv im Background-Polling).
- API-Sync robuster gemacht:
  - Pending-Matches mit `auto.status=error` werden nun ebenfalls erneut versucht
  - dadurch können temporäre Fehler ohne manuelles Zurücksetzen wieder in `started/completed` übergehen.
- Fehler-/Hinweislogik beim Sync entprellt:
  - weniger wiederholte Fehlermeldungen bei gleicher Ursache.

## 0.2.13
- KO-Engine v2 eingeführt:
  - Hybrid-Draw für neue KO-Turniere:
    - `randomize ON` -> `open_draw`
    - `randomize OFF` -> `seeded`
  - PDC/DRA-konforme Bye-Verteilung über Standard-Seed-Placement
  - Fehlerfall bei 9 Teilnehmern behoben (kein `Seed 1 vs Seed 2` in Runde 1 mehr).
- Legacy-KO-Turniere werden beim Laden auf Engine v2 migriert:
  - vor Migration wird automatisch ein Backup geschrieben (`ata:tournament:ko-migration-backups:v2`).
- Match-Metadaten erweitert um `match.meta.resultKind`:
  - `bye` kennzeichnet automatisch weitergeleitete Freilose.
- Tab `Spiele` verbessert:
  - Freilose werden als eigener Status `Freilos` angezeigt
  - Legs-Spalte zeigt bei Freilos nicht mehr ein reguläres `0:0`.
- Persistenzschema auf `schemaVersion: 2` angehoben (Storage-Key bleibt kompatibel: `ata:tournament:v1`).
- Interne Struktur klarer getrennt in Datenhaltung, Turnierlogik und Präsentation (inkrementell in `dist`).

## 0.2.12
- Teilnehmer-Limits auf regelbasierte, modusabhängige Grenzen umgestellt:
  - `ko`: `2..128`
  - `league`: `2..16`
  - `groups_ko`: `4..16`
- Validierung für Turniererstellung und Import auf die neuen Modus-Limits umgestellt.
- GUI-Hinweise im Tab `Turnier` und `Einstellungen` erweitert, inklusive Link auf `README.md#regelbasis-und-limits`.
- Dokumentation aktualisiert (`README.md`, `docs/architecture.md`) mit Regelbasis und Begründung.

## 0.2.7
- Bracket-Renderer auf `brackets-viewer@1.9.0` vereinheitlicht; GoJS-Anteil entfernt.
- Bracket-iframe visuell auf Autodarts-Look angepasst (größere Schrift, bessere Proportionen, volle Breiten-/Scrollnutzung).
- Doppelte/unerwünschte interne Bracket-Überschrift ausgeblendet.
- KO-Payload defensiv gehärtet: Unbekannte Teilnehmer-IDs werden nicht mehr als valide Opponents übernommen.
- HTML-Fallback im Tab `View` jetzt standardmäßig verborgen und nur bei Renderfehler/Timeout sichtbar.
- Diverse UI-Texte korrigiert (u. a. Umlaute bei Fehlermeldungen).

## 0.2.0
- API-Halbautomatik umgesetzt:
  - Matchstart per Button im Tab `Spiele` (`Match starten` / `Zum Match`)
  - automatische Ergebnissynchronisierung über Autodarts-API für gestartete Matches
  - Single-active-match-Regel (ein aktives gestartetes Match gleichzeitig).
- Persistenter Automationsstatus pro Match in `match.meta.auto` (abwärtskompatibel).
- Userscript-Metadaten erweitert um `GM_xmlhttpRequest` und `@connect api.autodarts.io`.
- Loader-Metadaten erweitert um `@connect api.autodarts.io` für API-Zugriffe im Loader-Kontext.
- Settings-Text aktualisiert: `Automatischer Lobby-Start + API-Sync` ist jetzt funktional.

## 0.1.2
- Alle Loader- und Script-Metadaten auf das korrekte Repo `thomasasen/autodarts_local_tournament` umgestellt (`namespace`, `downloadURL`, `updateURL`, RAW-Quelle).
- Menübezeichnung auf `xLokale Turniere` geändert.
- Menüposition verbessert: bevorzugt direkt unter `Boards/Meine Boards` (auch bei verschachtelter DOM-Struktur).
- Klick-Handling gehärtet: Toggle wird bei frühem Klick über `ata:ready` nachgeholt, falls die Runtime noch nicht geladen war.

## 0.1.1
- Loader-Menüpunkt `Turnier` auf robuste Sidebar-Erkennung umgestellt (analog zum `xConfig`-Muster mit Kandidaten-Scoring).
- Stabilere Einfügeposition im Hauptmenü (bevorzugt hinter `Boards`, sonst vor Profilbereich).
- Responsives Label-Verhalten: blendet den Text bei schmaler Sidebar aus, Icon bleibt sichtbar.

## 0.1.0 (MVP)
- Neues Loader-Userscript mit RAW-Load + Cache-Fallback.
- Neues Haupt-Userscript mit:
  - Shadow-DOM Drawer UI
  - Turniererstellung für KO, Liga, Gruppen + KO
  - Match-Ergebnisführung (auto + manuell)
  - Tabellenberechnung (Punkte > LegDiff > Legs+)
  - Bracket-Anzeige via `brackets-viewer` (iframe) + HTML-Fallback
  - JSON Export/Import (Datei + Copy/Paste)
  - Storage-Versionierung (`ata:tournament:v1`) inklusive Migrations-Stub
  - SPA-Routing-Stabilisierung und zentralem Cleanup.
