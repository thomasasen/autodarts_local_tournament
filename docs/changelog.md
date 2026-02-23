# Changelog

## 0.2.16
- Turnierformular im Tab `Turnier` auf 3-Spalten-Layout umgestellt, damit die X01-Einstellungen auf normalen Monitoren kompakter sichtbar sind.
- X01-Preset-Handling umgebaut:
  - Preset-Auswahlfeld entfernt.
  - Neuer Button `PDC Preset anwenden` setzt die PDC-Defaults direkt in die Formularfelder.
  - Manuelle X01-Aenderungen markieren den Preset-Status automatisch als `Custom`.
- Formularabhaengigkeiten erweitert:
  - Bei `Bull-off = Off` wird `Bull mode` read-only deaktiviert.
  - Persistenz bleibt stabil durch Hidden-Fallback fuer deaktivierte Felder.
- Match-Create-Payload verfeinert:
  - Wenn `Bull-off = Off`, wird `bullMode` nicht mehr in den API-Settings gesendet.
- Legacy-Startscores (`101`, `201`) aus der X01-Auswahl und Sanitization entfernt.

## 0.2.15
- X01-Matchanlage fuer API-Start erweitert:
  - Turnier-Neuanlage hat jetzt X01-Parameter aus der Autodarts-Lobbyoberflaeche:
    - Startscore, In mode, Out mode, Bull mode, Bull-off, Max Runden, Lobby-Sichtbarkeit.
  - Spielmodus bleibt bewusst `Legs` und wird aus `Best-of Legs` als `First to N` abgeleitet.
  - `Match starten` uebernimmt diese Werte kongruent in den Lobby-Create-Payload.
- PDC-Preset fuer Neuanlage eingefuehrt:
  - Standard ist `PDC Standard` (501, Straight In, Double Out, 25/50, Bull-off Normal, Max Rounds 50, Lobby privat).
  - Optionaler `Custom`-Modus fuer abweichende X01-Einstellungen.
- Startscore-Optionen um die X01-Lobbywerte erweitert (`121, 170, 301, 501, 701, 901`; Legacy `101, 201` bleibt import-/kompatibel).
- UI-Transparenz verbessert:
  - Aktives Turnier zeigt die hinterlegten X01-Settings kompakt an.

## 0.2.14
- Match-Seiten-Shortcut hinzugefuegt:
  - Auf `/lobbies/{id}` und `/matches/{id}` erscheint ein Button fuer `Ergebnis uebernehmen & Turnier oeffnen`.
  - Shortcut oeffnet direkt den Tab `Spiele` im Turnierassistenten.
- Gezielte manuelle Ergebnisuebernahme pro Lobby-ID:
  - Sync kann fuer genau ein Lobby-Match aktiv ausgelost werden (statt nur passiv im Background-Polling).
- API-Sync robuster gemacht:
  - Pending-Matches mit `auto.status=error` werden nun ebenfalls erneut versucht.
  - Dadurch koennen temporaere Fehler ohne manuelles Zuruecksetzen wieder in `started/completed` uebergehen.
- Fehler-/Hinweislogik beim Sync entprellt:
  - Weniger wiederholte Fehlermeldungen bei gleicher Ursache.

## 0.2.13
- KO-Engine v2 eingefuehrt:
  - Hybrid-Draw fuer neue KO-Turniere:
    - `randomize ON` -> `open_draw`
    - `randomize OFF` -> `seeded`
  - PDC/DRA-konforme Bye-Verteilung ueber Standard-Seed-Placement.
  - Fehlerfall bei 9 Teilnehmern behoben (kein `Seed 1 vs Seed 2` in Runde 1 mehr).
- Legacy-KO-Turniere werden beim Laden auf Engine v2 migriert.
  - Vor Migration wird automatisch ein Backup geschrieben (`ata:tournament:ko-migration-backups:v2`).
- Match-Metadaten erweitert um `match.meta.resultKind`:
  - `bye` kennzeichnet automatisch weitergeleitete Freilose.
- Spiele-Tab verbessert:
  - Freilose werden als eigener Status `Freilos` angezeigt.
  - Legs-Spalte zeigt bei Freilos nicht mehr ein regulaeres `0:0`.
- Persistenzschema auf `schemaVersion: 2` angehoben (Storage-Key bleibt kompatibel: `ata:tournament:v1`).
- Interne Struktur klarer getrennt in Datenhaltung, Turnierlogik und Praesentation (inkrementell in `dist`).

## 0.2.12
- Teilnehmer-Limits auf regelbasierte, modusabhaengige Grenzen umgestellt:
  - `ko`: `2..128`
  - `league`: `2..16`
  - `groups_ko`: `4..16`
- Validierung fuer Turniererstellung und Import auf die neuen Modus-Limits umgestellt.
- GUI-Hinweise im Tab `Turnier` und `Einstellungen` erweitert, inkl. Link auf `README.md#regelbasis-und-limits`.
- Dokumentation aktualisiert (`README.md`, `docs/architecture.md`) mit Regelbasis und Begruendung.

## 0.2.7
- Bracket-Renderer auf `brackets-viewer@1.9.0` vereinheitlicht; GoJS-Anteil entfernt.
- Bracket-iframe visuell auf Autodarts-Look angepasst (groessere Schrift, bessere Proportionen, volle Breiten-/Scrollnutzung).
- Doppelte/unerwuenschte interne Bracket-Ueberschrift ausgeblendet.
- KO-Payload defensiv gehaertet: unbekannte Teilnehmer-IDs werden nicht mehr als valide Opponents uebernommen.
- HTML-Fallback im View-Tab jetzt standardmaessig verborgen und nur bei Renderfehler/Timeout sichtbar.
- Diverse UI-Texte korrigiert (u. a. Umlaute bei Fehlermeldungen).

## 0.2.0
- API-Halbautomatik umgesetzt:
  - Matchstart per Button im Tab `Spiele` (`Match starten` / `Zum Match`).
  - Automatische Ergebnissynchronisierung ueber Autodarts-API fuer gestartete Matches.
  - Single-active-match-Regel (ein aktives gestartetes Match gleichzeitig).
- Persistenter Automationsstatus pro Match in `match.meta.auto` (abwaertskompatibel).
- Userscript-Metadaten erweitert um `GM_xmlhttpRequest` und `@connect api.autodarts.io`.
- Loader-Metadaten erweitert um `@connect api.autodarts.io` fuer API-Zugriffe im Loader-Kontext.
- Settings-Text aktualisiert: `Automatischer Lobby-Start + API-Sync` ist jetzt funktional.

## 0.1.2
- Alle Loader- und Script-Metadaten auf das korrekte Repo `thomasasen/autodarts_local_tournament` umgestellt (`namespace`, `downloadURL`, `updateURL`, RAW-Quelle).
- Menuebezeichnung auf `xLokale Turniere` geaendert.
- Menueposition verbessert: bevorzugt direkt unter `Boards/Meine Boards` (auch bei verschachtelter DOM-Struktur).
- Klick-Handling verhaertet: Toggle wird bei fruehem Klick ueber `ata:ready` nachgeholt, falls Runtime noch nicht geladen war.

## 0.1.1
- Loader-Menuepunkt `Turnier` auf robuste Sidebar-Erkennung umgestellt (analog zum `xConfig`-Muster mit Kandidaten-Scoring).
- Stabilere Einfuegeposition im Hauptmenue (bevorzugt hinter `Boards`, sonst vor Profilbereich).
- Responsives Label-Verhalten: blendet den Text bei schmaler Sidebar aus, Icon bleibt sichtbar.

## 0.1.0 (MVP)
- Neues Loader-Userscript mit RAW-Load + Cache-Fallback.
- Neues Haupt-Userscript mit:
  - Shadow-DOM Drawer UI.
  - Turniererstellung fuer KO, Liga, Gruppen + KO.
  - Match-Ergebnisfuehrung (auto + manuell).
  - Tabellenberechnung (Punkte > LegDiff > Legs+).
  - Bracket-Anzeige via `brackets-viewer` (iframe) + HTML-Fallback.
  - JSON Export/Import (Datei + Copy/Paste).
  - Storage-Versionierung (`ata:tournament:v1`) inkl. Migrations-Stub.
  - SPA-Routing-Stabilisierung und zentralem Cleanup.
