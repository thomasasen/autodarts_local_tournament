# Autodarts Tournament Assistant

Lokales Turniermanagement direkt in `https://play.autodarts.io` als Userscript.

Der Assistent erweitert die Autodarts-Oberflaeche um einen eigenen Bereich fuer:
- Turnieranlage (KO, Liga, Gruppenphase + KO)
- Ergebnisfuehrung
- Turnieransicht (Tabelle + Bracket)
- Import/Export
- API-Halbautomatik (Start per Klick + Ergebnis-Sync)

## Inhalt
1. [Schnellstart](#schnellstart)
2. [Funktionen](#funktionen)
3. [Turniermodi](#turniermodi)
4. [Regelbasis und Limits](#regelbasis-und-limits)
5. [Einstellungen](#einstellungen)
6. [Turnier anlegen](#turnier-anlegen)
7. [API-Halbautomatik](#api-halbautomatik)
8. [Import und Export](#import-und-export)
9. [Troubleshooting](#troubleshooting)
10. [Entwicklung](#entwicklung)
11. [Limitationen](#limitationen)

## Schnellstart
1. Tampermonkey im Browser installieren.
2. Loader installieren:
   - `https://github.com/thomasasen/autodarts_local_tournament/raw/refs/heads/main/installer/Autodarts%20Tournament%20Assistant%20Loader.user.js`
3. `https://play.autodarts.io` neu laden.
4. Im linken Menue auf **xLokale Turniere** klicken.

## Funktionen
- Turniermodi:
  - KO
  - Liga (Round Robin)
  - Gruppenphase + KO
- Ergebnisfuehrung:
  - manuelles Speichern pro Match
  - API-Matchstart per Klick
  - API-Sync fuer Ergebnisse
  - Match-Seiten-Shortcut: `Ergebnis uebernehmen & Turnier oeffnen`
- KO-Ansicht:
  - Bracket via `brackets-viewer` (primar)
  - HTML-Fallback bei CDN-Fehler/Timeout
- Turnieranlage:
  - KO-Erstrunde als Hybrid-Draw (`seeded` oder `open_draw`)
  - X01-Presets fuer Matchanlage (`PDC Standard` oder `Custom`)
  - Teilnehmerliste kann per Button gemischt werden
  - Formularentwurf bleibt erhalten (z. B. beim Moduswechsel)
- Import/Export:
  - JSON-Datei exportieren
  - JSON in Zwischenablage kopieren
  - JSON per Datei oder Text importieren

## Turniermodi
| Modus | Beschreibung | Typischer Einsatz |
|---|---|---|
| `ko` | Klassischer Single-Elimination-Baum | Schnelles Turnier mit Finalrunde |
| `league` | Jeder gegen jeden (Round Robin) | Kleine Gruppe mit kompletter Tabelle |
| `groups_ko` | 2 Gruppen, danach KO-Phase | Kombination aus Gruppenphase und Finalrunde |

### KO (`ko`)
- Hybrid-Draw:
  - `KO-Erstrunde zufaellig mischen = OFF` -> `seeded` (Eingabereihenfolge als Seed 1..n).
  - `KO-Erstrunde zufaellig mischen = ON` -> `open_draw` (zufaellige Seed-Reihenfolge).
- Bye-Verteilung ist PDC/DRA-konform fuer gesetzte Draws:
  - Bei nicht voller 2er-Potenz erhalten Top-Seeds Freilose.
  - Beispiel 9 Spieler im 16er-Baum: nur Seed 8 vs Seed 9 spielt in Runde 1.
- KO-Matches werden pro Turnierast freigeschaltet:
  - Match ist spielbar, sobald beide Teilnehmer feststehen.
  - Bei Runde > 1 muessen die direkten Vorgaenger-Matches abgeschlossen sein.
- Nur Runde-1-Byes duerfen automatisch als abgeschlossen gesetzt werden.
- Freilose werden im Spiele-Tab explizit als `Freilos` markiert.

### Liga (`league`)
- Vollstaendiger Round-Robin-Spielplan.
- Tabelle basiert auf:
  - Punkte
  - Leg-Differenz
  - Legs For
  - Name (als letzter Tiebreak)

### Gruppenphase + KO (`groups_ko`)
- Zwei Gruppen (`A`, `B`).
- Top-2 jeder Gruppe qualifizieren sich fuer KO.
- Kreuz-Halbfinale:
  - `A1 vs B2`
  - `B1 vs A2`
- Finale folgt nach den Halbfinals.

## Regelbasis und Limits
Priorisierung fuer Limits in diesem Projekt:
1. Offizielle Darts-Regeln
2. Mathematische Turnierlogik
3. Technische Machbarkeit im Userscript

### Was sagen die offiziellen Regeln?
- DRA 6.6.7 / 6.6.8: In gesetzten Draws werden Byes den gesetzten Spielern zugeordnet.
- DRA 6.8.1: KO (straight knockout) ist der Standardmodus.
- DRA 6.8.2: Round-Robin ist zulaessig, wenn vorab bekanntgegeben.
- DRA 6.10.1 / 6.10.5.2: Kein fixes globales Teilnehmermaximum, Einlass/Cap liegt beim Veranstalter.

### Umgesetzte Limits (begruendet)
| Modus | Limit | Begruendung |
|---|---|---|
| `ko` | `2..128` | Regelkonform ohne kleines Kunstlimit; technisch auf 128 gedeckelt, damit Bracket/Rendering stabil bleiben. |
| `league` | `2..16` | Round-Robin waechst quadratisch (`n*(n-1)/2` Matches); ab groesseren Feldern wird es fuer lokale Turniere unpraktisch. |
| `groups_ko` | `4..16` | Mindestens 4 fuer zwei Gruppen mit anschliessender KO-Phase (A1/B2, B1/A2); Obergrenze aus Spielanzahl/Bedienbarkeit. |

Hinweis:
- Es gibt zusaetzlich ein technisches Hard-Cap bei `128` Teilnehmern, um Browser-Last und UI-Stabilitaet zu schuetzen.
- Die GUI verweist direkt auf diesen Abschnitt.

## Einstellungen
Tab: `Einstellungen`

### Debug-Mode
- Aktiviert ausfuehrliche Logs in der Browser-Konsole.
- Prefix z. B. `[ATA][api]`, `[ATA][bracket]`, `[ATA][storage]`.

### Automatischer Lobby-Start + API-Sync
- Wenn aktiv:
  - `Match starten` erstellt Lobby, fuegt Spieler hinzu und startet.
  - Ergebnis wird per API synchronisiert.

### KO-Erstrunde zufaellig mischen (Standard)
- Gilt fuer neu erstellte KO-Turniere.
- Bei aktivem Schalter wird ein `open_draw` erzeugt (zufaellige Seed-Reihenfolge).
- Bei deaktiviertem Schalter wird `seeded` verwendet (Eingabereihenfolge als Seed-Rang).
- Zusaetzlich gibt es im Turnier-Formular den Button `Teilnehmer mischen`.

## Turnier anlegen
Tab: `Turnier`

Pflichtfelder:
- Turniername
- Modus
- Teilnehmer (eine Zeile pro Person)

Weitere Felder:
- Best-of Legs
- Startscore
- X01 Preset (`PDC Standard` oder `Custom`)
- In mode / Out mode
- Bull mode / Bull-off
- Max Runden
- Lobby (`Privat`/`Oeffentlich`)
- KO-Erstrunde zufaellig mischen
- Limits je Modus siehe: [Regelbasis und Limits](#regelbasis-und-limits)

### PDC-Standard-Preset
- Bei Neuanlage ist standardmaessig `PDC Standard` aktiv.
- Solange `PDC Standard` aktiv ist, sind die X01-Detailfelder im Formular gesperrt.
- Das Preset setzt:
  - Matchart `X01`
  - X01 501
  - Straight In
  - Double Out
  - Bull mode `25/50`
  - Bull-off `Normal`
  - Max Runden `50`
  - Lobby `Privat`
- Spielmodus bleibt `Legs`; `Best-of Legs` ist fuehrend fuer die Matchlaenge und wird API-seitig als `First to N Legs` umgesetzt.

### Verhalten beim Formular
- Das Eingabeformular speichert einen Entwurf.
- Dadurch bleiben Eingaben erhalten, auch wenn:
  - der Modus gewechselt wird
  - die UI neu gerendert wird

## API-Halbautomatik
Tab: `Spiele`

### Voraussetzungen
- Gueltiger Autodarts-Login (Auth-Token)
- Aktives Board in Autodarts
- Feature-Flag `Automatischer Lobby-Start + API-Sync` aktiv

### Ablauf
1. Match per `Match starten` ausloesen.
2. Lobby wird mit den Turnier-Settings erstellt (X01-Preset/Felder + Legs aus `Best-of Legs`), Spieler werden hinzugefuegt und das Match wird gestartet.
3. Match-Ergebnis wird per API geholt und gespeichert.

### Schutzmechanismen
- Nur ein aktives API-Match gleichzeitig (Single-Board-Flow).
- Duplikatnamen werden fuer API-Sync blockiert.
- Ungueltige Ergebnisse werden abgewiesen.

## Import und Export
Tab: `Import/Export`

### Export
- JSON als Datei herunterladen
- JSON in die Zwischenablage kopieren

### Import
- JSON-Datei auswaehlen
- JSON direkt in Textfeld einfuegen

### Hinweise
- Das Persistenzschema ist `schemaVersion: 2`.
- Beim Import werden Daten defensiv normalisiert.
- Legacy-KO-Turniere werden auf KO-Engine v2 migriert.
- Vor KO-Migration wird ein Backup unter `ata:tournament:ko-migration-backups:v2` abgelegt.

## Troubleshooting
### "Match ist abgeschlossen", obwohl neu
- Ursache ist meist ein inkonsistenter Altzustand.
- Loesung:
  1. Seite neu laden.
  2. Falls noetig Turnier neu anlegen.
  3. Pruefen, ob `Freilos` in Runde 1 automatisch weitergeleitet wurde (das ist korrekt).

### "Board-ID ungueltig (manual)"
- Einmal in Autodarts manuell eine Lobby oeffnen und Board setzen.
- Danach Seite neu laden.

### API-Start/Sync funktioniert nicht
- Login pruefen (Token vorhanden?).
- Feature-Flag aktiv?
- Eindeutige Teilnehmernamen verwenden.

### Bracket wird nicht gerendert
- CDN kann temporaer nicht erreichbar sein.
- Der HTML-Fallback wird dann angezeigt.

## Entwicklung
### Repo-Struktur
```text
autodarts_local_tournament/
|- installer/
|  |- Autodarts Tournament Assistant Loader.user.js
|- dist/
|  |- autodarts-tournament-assistant.user.js
|- docs/
|  |- architecture.md
|  |- selector-strategy.md
|  |- changelog.md
|- README.md
|- LICENSE
```

### Hauptdateien
- Runtime-Script: `dist/autodarts-tournament-assistant.user.js`
- Loader-Script: `installer/Autodarts Tournament Assistant Loader.user.js`

### Architektur
- Shadow DOM fuer gekapselte UI
- SPA-Routing-Hooks fuer stabile Einbindung in Autodarts
- Defensive Persistenz-Normalisierung
- Bracket-Rendering in sandboxed iframe

## Limitationen
- Modus-Limits:
  - `ko`: `2..128`
  - `league`: `2..16`
  - `groups_ko`: `4..16`
- Technisches Hard-Cap: `128` Teilnehmer
- API-Halbautomatik basiert auf in der Praxis verwendeten Endpunkten (Inference)
- DOM-Autodetect bleibt best-effort

## Quellen
- DRA (offizielle Regelbasis):
  - https://www.thedra.co.uk/rules
  - https://www.thedra.co.uk/_files/ugd/298855_5df36f5f7b5449f8af7f1606f153b8f2.pdf
- PDC (Open Draw Kontext, Eventregeln):
  - https://www.pdc.tv/news/2013/01/16/rules-challenge-youth-tours
- Referenz-Extension:
  - https://chromewebstore.google.com/detail/autodarts-local-tournamen/algfbicoennnolleogigbefngpkkmcng
- Bracket Viewer:
  - https://github.com/Drarig29/brackets-viewer.js
- Autodarts Themes/Pattern Inspiration:
  - https://github.com/thomasasen/autodarts-tampermonkey-themes
