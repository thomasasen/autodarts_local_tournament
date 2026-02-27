# Autodarts Tournament Assistant

Lokales Turniermanagement direkt in `https://play.autodarts.io` als Userscript.

Der Assistent erweitert die Autodarts-Oberflaeche um einen eigenen Bereich fuer:
- Turnieranlage (KO, Liga, Gruppenphase + KO)
- Ergebnisfuehrung
- Turnieransicht (Tabelle + Bracket)
- Import/Export
- API-Halbautomatik (Start per Klick + Ergebnis-Sync)

## Inhalt
1. [Schnellstart (empfohlen)](#schnellstart-empfohlen)
2. [Erste Orientierung in Autodarts](#erste-orientierung-in-autodarts)
3. [Funktionen](#funktionen)
4. [Turniermodi](#turniermodi)
5. [Turnier anlegen](#turnier-anlegen)
6. [API-Halbautomatik](#api-halbautomatik)
7. [Turnierbaum](#turnierbaum)
8. [Import und Export](#import-und-export)
9. [Einstellungen](#einstellungen)
10. [Regelbasis und Limits](#regelbasis-und-limits)
11. [Troubleshooting](#troubleshooting)
12. [Entwicklung](#entwicklung)
13. [Limitationen](#limitationen)
14. [Quellen](#quellen)

## Schnellstart (empfohlen)
Installationsablauf im Stil von "Schnellstart (empfohlen)" aus den Theme-Skripten:

1. Tampermonkey im Browser installieren.
2. Loader installieren (empfohlen):
   - `https://github.com/thomasasen/autodarts_local_tournament/raw/refs/heads/main/installer/Autodarts%20Tournament%20Assistant%20Loader.user.js`
3. `https://play.autodarts.io` neu laden.
4. Im linken Menue auf **xLokales Turnier** klicken.

Falls Tampermonkey nicht in `play.autodarts.io` injiziert:
- Tampermonkey-FAQ: https://www.tampermonkey.net/faq.php#Q209

Alternative ohne Loader (direkt das Runtime-Skript):
- `https://github.com/thomasasen/autodarts_local_tournament/raw/refs/heads/main/dist/autodarts-tournament-assistant.user.js`

![Sidebar-Eintrag xLokales Turnier](assets/ss_autodarts-menu-xLokales-Turnier.png)

## Erste Orientierung in Autodarts
Nach Installation ist links im Hauptmenue der neue Eintrag sichtbar. Darueber oeffnest du den Assistant mit den Tabs:
- `Turnier`
- `Spiele`
- `Turnierbaum`
- `Import/Export`
- `Einstellungen`

![Assistant-Tabs und Runtime-Status](assets/ss_Turnier_anlage-neu.png)

## Funktionen
- Turniermodi:
  - `ko`
  - `league`
  - `groups_ko`
- Ergebnisfuehrung:
  - Manuelles Speichern pro Match
  - API-Matchstart per Klick
  - API-Sync fuer Ergebnisse
  - Inline-Button auf `/history/matches/{id}`:
    `Ergebnis aus Statistik uebernehmen & Turnier oeffnen`
- KO-Ansicht:
  - Bracket via `brackets-viewer` (primaer)
  - HTML-Fallback bei CDN-Fehler/Timeout
- Turnieranlage:
  - KO-Erstrunde als Hybrid-Draw (`seeded` oder `open_draw`)
  - X01-Preset-Button fuer Matchanlage (PDC-Defaults + Custom-Status)
  - Kompaktes Formular-Layout (Konfiguration + Teilnehmerbereich)
  - Teilnehmerliste kann per Button gemischt werden
  - Formularentwurf bleibt erhalten (z. B. beim Moduswechsel)
- Import/Export:
  - JSON-Datei exportieren
  - JSON in die Zwischenablage kopieren
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
  - `KO-Erstrunde zufaellig mischen = ON` -> `open_draw` (deterministisch gemischte Seed-Reihenfolge).
- Bye-Verteilung ist PDC/DRA-konform fuer gesetzte Draws:
  - Bei nicht voller 2er-Potenz erhalten Top-Seeds Freilose.
  - Beispiel mit 9 Spielern im 16er-Baum: Nur Seed 8 vs Seed 9 spielt in Runde 1.
- KO-Matches werden pro Turnierast freigeschaltet:
  - Ein Match ist spielbar, sobald beide Teilnehmer feststehen.
  - Bei Runde > 1 muessen die direkten Vorgaenger-Matches abgeschlossen sein.
- Nur Runde-1-Byes duerfen automatisch als abgeschlossen gesetzt werden.
- Freilose werden im Tab `Spiele` explizit als `Freilos (Bye)` markiert.

### Liga (`league`)
- Vollstaendiger Round-Robin-Spielplan.
- Tabelle basiert auf:
  - Punkte
  - Direktvergleich (bei 2 Punktgleichen, DRA strict)
  - Teilgruppen-Leg-Differenz (bei 3+ Punktgleichen, DRA strict)
  - Leg-Differenz gesamt
  - Legs For gesamt
  - Bei weiterem Gleichstand: `Playoff erforderlich`

### Gruppenphase + KO (`groups_ko`)
- Zwei Gruppen (`A`, `B`).
- Top-2 jeder Gruppe qualifizieren sich fuer KO.
- Kreuz-Halbfinale:
  - `A1 vs B2`
  - `B1 vs A2`
- Das Finale folgt nach den Halbfinals.

## Turnier anlegen
Tab: `Turnier`

![Neues Turnier erstellen](assets/ss_Turnier_anlage-neu.png)

### Pflichtfelder
- Turniername
- Modus
- Teilnehmer (eine Zeile pro Person)

### Feld- und Auswahlinhalte (inkl. Warum)
| Feld | Optionen / Eingaben | Was es steuert | Warum das wichtig ist |
|---|---|---|---|
| `Turniername` | Freitext | Name fuer aktive Sitzung/Export | Erleichtert Zuordnung bei mehreren lokalen Events |
| `Modus` | `KO`, `Liga`, `Gruppenphase + KO` | Spielplanlogik, Tabellenlogik, KO-Pfade | Falscher Modus fuehrt zu falscher Matchanzahl/Fortschrittslogik |
| `Best of Legs` | Ungerade `1..21` | Matchlaenge; intern `First to N` | Definiert Siegbedingung pro Match und Turnierdauer |
| `Startpunkte` | `121`, `170`, `301`, `501`, `701`, `901` | X01-Basis fuer jedes Match | Beeinflusst Matchdauer und Schwierigkeitsprofil |
| `In-Modus` | `Straight`, `Double`, `Master` | Wie ein Leg gestartet wird | Regelt Einstiegsanforderung je Spielstil/Regelwerk |
| `Out-Modus` | `Straight`, `Double`, `Master` | Wie ein Leg beendet wird | Zentrale Regel fuer Checkout-Strenge |
| `Bull-off` | `Off`, `Normal`, `Official` | Startreihenfolge-/Bull-off-Verhalten fuer Lobby | Legt fest, wie Anstoesse entschieden werden |
| `Bull-Modus` | `25/50`, `50/50` | Wertung der Bull-Segmente | Muss mit Hausregeln/Turnierkontext konsistent sein |
| `Max Runden` | `15`, `20`, `50`, `80` | Upper bound fuer Matchdauer in der Lobby | Verhindert haengende/zu lange Matches |
| `Spielmodus` | fix `Legs (First to N aus Best of)` | Nicht umstellbar in der UI | Verhindert inkonsistente Kombinationen im lokalen Flow |
| `Lobby` | fix `Privat` | Sichtbarkeit der API-Lobby | Lokales Turnier bleibt bewusst privat/sicher |
| `Preset` | Button `PDC-Preset anwenden` | Setzt PDC-konformes X01-Setup | Schnelles Setup ohne manuelle Einzelkonfiguration |
| `KO-Erstrunde zufaellig mischen` | Checkbox `ON/OFF` | `open_draw` oder `seeded` in Runde 1 | Transparente Entscheidung zwischen Zufall und Setzlogik |
| `Teilnehmer` | Je Spieler eine Zeile | Teilnehmerliste inkl. Reihenfolge | Reihenfolge ist bei `seeded` zugleich Seed-Reihenfolge |
| `Teilnehmer mischen` | Button | Mischt Teilnehmertextliste | Praktisch fuer spontane Auslosung vor Start |

### PDC-Standard-Preset
- Bei Neuanlage ist standardmaessig `PDC Standard` aktiv.
- Das Preset wird per Button auf die Felder angewendet (kein Dropdown-Select).
- Das Preset setzt:
  - Turniermodus `KO`
  - `Best of Legs` auf `5`
  - Matchart `X01`
  - X01 `501`
  - `Straight In`
  - `Double Out`
  - Bull mode `25/50`
  - Bull-off `Normal`
  - Max Runden `50`
  - Lobby `Privat` (fix)
- Der Spielmodus bleibt `Legs`; `Best-of Legs` ist fuehrend fuer die Matchlaenge und wird API-seitig als `First to N Legs` umgesetzt.
- `Best of 1` gilt nicht als PDC-Standardprofil im Tool.
- Das PDC-Logo-Badge erscheint, wenn das Setup vollstaendig passt:
  - KO
  - Best of mindestens 3 Legs
  - 501 Straight In, Double Out, Bull 25/50, Bull-off Normal, Max Runden 50

![PDC-Referenzlogo](assets/pdc_logo.png)

### Verhalten beim Formular
- Das Eingabeformular speichert einen Entwurf.
- Dadurch bleiben Eingaben erhalten, auch wenn:
  - der Modus gewechselt wird
  - die UI neu gerendert wird
- Wenn `Bull-off = Off`, wird `Bull mode` automatisch read-only deaktiviert.
- Bei manuellen Aenderungen an X01-Feldern springt der Preset-Status auf `Individuell`.

### Nach dem Anlegen
Im aktiven Turnier siehst du die wichtigsten Tags sofort:
- Format (`KO`, `Liga`, `Gruppenphase + KO`)
- `Best of`, `First to`, `Startpunkte`
- Bei KO: `Open Draw`/`Gesetzter Draw`, `Draw-Lock aktiv/aus`
- X01-Zusammenfassung und Teilnehmerchips

![Aktives Turnier nach Anlage](assets/ss_Turnier_angelegt.png)

## API-Halbautomatik
Tab: `Spiele`

### Voraussetzungen
- Gueltiger Autodarts-Login (Auth-Token)
- Aktives Board in Autodarts
- Feature-Flag `Automatischer Lobby-Start + API-Sync` aktiv

### Ablauf
1. Match in `Spiele` ueber `Match starten` ausloesen.
2. Eine Lobby wird mit den Turnier-Settings erstellt (X01-Felder + Legs aus `Best of Legs`), immer als private Lobby.
3. Spieler werden hinzugefuegt und das Match wird gestartet.
4. Ergebnis wird per API geholt und lokal gespeichert.
5. Auf der Statistikseite (`/history/matches/{id}`) steht zusaetzlich ein direkter Import-Button zur Verfuegung.

### Ergebnisfuehrung: Sortierung und Status verstehen
Sortiersegmente im Tab `Spiele`:
- `Spielbar zuerst`: priorisiert live/spielbare Paarungen fuer schnellen Ablauf.
- `Runde/Spiel`: strikte Reihenfolge nach Turnierstruktur.
- `Status`: gruppiert nach offen/abgeschlossen/Freilos.

Wichtige Markierungen:
- `Naechstes Match`: empfohlene naechste Paarung (PDC: Next Match).
- `Freilos (Bye)`: automatischer Weiterzug ohne Spiel.
- `Finale`: letzte KO-Paarung.
- `Champion`: finaler Gewinner inklusive Leg-Ergebnis.

![Spiele direkt nach Turnierstart](assets/ss_Spiele_Neu-gestartet.png)
![Spiele mit automatischer Matchdaten-Uebernahme](assets/ss_Spiele_automatische_uebernahme_der_matchdaten.png)
![Spiele nach Finale mit Champion-Markierung](assets/ss_Spiele_Finale.png)

### Statistik-Import auf der Match-Historie
Auf `/history/matches/{id}` kann das Tool ein Ergebnis direkt aus der Statistik uebernehmen:
- Button: `Ergebnis aus Statistik uebernehmen & Turnier oeffnen`
- Mit Statushinweis (`Import bereit`, letzter Sync-Status, Fehlerhinweis)
- Oeffnet danach direkt den Assistant-Tab `Spiele`

![Inline-Matchimport auf der Statistikseite](assets/ss_uebernahme-der-matchdaten_matchimport.png)

### Schutzmechanismen
- Nur ein aktives API-Match gleichzeitig (Single-Board-Flow).
- Duplikatnamen werden fuer API-Sync blockiert.
- Ungueltige Ergebnisse werden abgewiesen.
- Bei mehrdeutigen Zuordnungen wird absichtlich nicht automatisch uebernommen.

## Turnierbaum
Tab: `Turnierbaum`

- KO-Baum wird im iframe ueber `brackets-viewer` gerendert.
- Bei CDN-Problemen zeigt die App einen HTML-Fallback.
- Freilose, abgeschlossene Spiele und Finale sind visuell markiert.

![Turnierbaum direkt nach dem Start](assets/ss_Turnierbaum_neu-gestartet.png)
![Turnierbaum nach uebernommenen Matchdaten](assets/Turnierbaum_aktualisierter-turnierbaum-nach-uebernahme-der-matchdaten.png)
![Turnierbaum mit abgeschlossenem Finale](assets/ss_Turnierbaum_Finale.png)

## Import und Export
Tab: `Import/Export`

![Import-Export-Ansicht](assets/ss_Import-Export.png)

### Export
- `JSON herunterladen`
- `JSON in Zwischenablage`

### Import
- Dateiimport (`.json`)
- JSON-Text direkt einfuegen

### Daten- und Migrationshinweise
- Persistenzschema: `schemaVersion: 4`
- Beim Import werden Daten defensiv normalisiert.
- Legacy-KO-Turniere werden auf KO-Engine v3 migriert.
- Vor KO-Migration wird ein Backup unter `ata:tournament:ko-migration-backups:v2` abgelegt.
- Bestehende Turniere werden auf
  `tournament.rules.tieBreakProfile = promoter_h2h_minitable` normalisiert.

## Einstellungen
Tab: `Einstellungen`

![Einstellungen und Feature-Flags](assets/ss_Einstellungen.png)

### Info-Symbole
Legende fuer die eingeblendeten Hilfelinks:

| Symbol | Bedeutung | Typischer Inhalt |
|---|---|---|
| ![Info-Symbol](assets/ss_info.png) | `Info-Icon` = technische Information | Bedienung, Implementierung, README-Kontext |
| ![Regel-Symbol](assets/ss_regeln.png) | `Regel-Icon` = Regelwerk | DRA-Bezug, Kapitel/Punkt/Seite, Hintergruende |

- Das `Info-Icon` verweist auf Bedienung, Implementierung und interne Projektdokumentation.
- Das `Regel-Icon` verweist auf die zentrale Regelerklaerung in [docs/dra-regeln-gui.md](docs/dra-regeln-gui.md).

### Debug-Mode
- Aktiviert ausfuehrliche Logs in der Browser-Konsole.
- Prefix z. B. `[ATA][api]`, `[ATA][bracket]`, `[ATA][storage]`.
- Sinnvoll fuer Fehlersuche bei API oder Renderproblemen.

### Automatischer Lobby-Start + API-Sync
- Standard: `AUS`.
- Wenn aktiv:
  - `Match starten` erstellt Lobby, fuegt Spieler hinzu, startet Match.
  - Ergebnis wird automatisch aus der API uebernommen.
- Warum: weniger manuelle Schritte, geringeres Risiko fuer Uebertragungsfehler.

### KO-Erstrunde zufaellig mischen (Standard)
- Standard: `EIN`.
- Gilt fuer neu erstellte KO-Turniere.
- `EIN` -> `open_draw` (zufaellige Reihenfolge in Runde 1).
- `AUS` -> `seeded` (Eingabereihenfolge als Seed-Rang).
- Warum: Turnierleitung kann zwischen offener Auslosung und Setzlogik waehlen.

### KO Draw-Lock (Standard)
- Standard: `EIN`.
- Neue KO-Turniere uebernehmen den Initial-Draw unveraendert (`drawLocked = true`).
- Bezug: DRA `6.12.1` (veroeffentlichter Draw bleibt bestehen).
- Im Tab `Einstellungen` kann das aktive KO-Turnier bei Bedarf explizit entsperrt werden.
- Warum: Verhindert unfaire oder versehentliche Nachauslosung waehrend laufendem Turnier.

### Promoter Tie-Break-Profil
- `Promoter H2H + Mini-Tabelle` (empfohlen):
  - Punkte (`2` Sieg, `1` Unentschieden, `0` Niederlage)
  - Direktvergleich bei genau 2 Punktgleichen
  - Teilgruppen-Leg-Differenz bei 3+ Punktgleichen
  - danach Gesamt-Leg-Differenz und Legs gewonnen
  - bei weiterem Gleichstand: `Playoff erforderlich`
- `Promoter Punkte + LegDiff`:
  - vereinfachte, legacy-kompatible Sortierung
  - Reihenfolge: Punkte -> Gesamt-Leg-Differenz -> Legs gewonnen

Warum dieses Feld wichtig ist:
- DRA `6.16.1` erlaubt Tie-Breaks nach Ermessen des Veranstalters.
- Das Profil erzwingt eine klare, reproduzierbare Reihenfolge statt Ad-hoc-Entscheidung.

## Regelbasis und Limits
Priorisierung fuer Limits in diesem Projekt:
1. Offizielle Darts-Regeln
2. Mathematische Turnierlogik
3. Technische Machbarkeit im Userscript

### Offizielle Regelquellen
- DRA-Rulebook-Seite: https://www.thedra.co.uk/dra-rulebook
- DRA-Rulebook-PDF (Projektkopie): [docs/DRA-RULE_BOOK.pdf](docs/DRA-RULE_BOOK.pdf)
- DRA-Referenzen:
  - Definition Bye: Abschnitt `2` (Seite 4):
    [DRA-RULE_BOOK.pdf#page=4](docs/DRA-RULE_BOOK.pdf#page=4)
  - Turnierformat KO / Round Robin: `6.8.1`, `6.8.2` (Seite 17):
    [DRA-RULE_BOOK.pdf#page=17](docs/DRA-RULE_BOOK.pdf#page=17)
  - Teilnehmer und Veranstalter-Ermessen: `6.10.1`, `6.10.5.2` (Seiten 17-18):
    [DRA-RULE_BOOK.pdf#page=18](docs/DRA-RULE_BOOK.pdf#page=18)
  - Draw bleibt bestehen: `6.12.1` (Seite 18):
    [DRA-RULE_BOOK.pdf#page=18](docs/DRA-RULE_BOOK.pdf#page=18)
  - Tie-Break im Ermessen des Veranstalters: `6.16.1` (Seite 20):
    [DRA-RULE_BOOK.pdf#page=20](docs/DRA-RULE_BOOK.pdf#page=20)

### Umgesetzte Limits (mit Hintergrund)
| Modus | Limit | Warum |
|---|---|---|
| `ko` | `2..128` | Regelkonform ohne kleines Kunstlimit; 128 als technischer Stabilitaetsdeckel fuer Bracket/UI. |
| `league` | `2..16` | Round Robin waechst quadratisch (`n*(n-1)/2`); oberhalb 16 wird Dauer und Bedienung fuer lokale Events schnell unpraktisch. |
| `groups_ko` | `4..16` | Mindestens 4 fuer zwei Gruppen mit anschliessender KO-Phase; Obergrenze aus Spielanzahl/Bedienbarkeit. |

Hinweise:
- Zusaetzliches technisches Hard-Cap: `128` Teilnehmer.
- Die GUI verlinkt Regelhintergruende ueber das `Regel-Icon` auf [docs/dra-regeln-gui.md](docs/dra-regeln-gui.md).

### Warum diese Regeln fuer Spieler relevant sind
- **Transparenz:** Jeder sieht, warum ein Match gesperrt/freigeschaltet ist.
- **Fairness:** Draw-Lock und Bye-Handling verhindern spaetere Strukturmanipulation.
- **Nachvollziehbarkeit:** Tie-Break-Profil macht Tabellenentscheidungen reproduzierbar.
- **Planbarkeit:** Limits schuetzen vor Turnierformaten, die lokal kaum sauber durchfuehrbar sind.

## Troubleshooting
### "Match ist abgeschlossen", obwohl neu
- Ursache ist meist ein inkonsistenter Altzustand.
- Loesung:
  1. Seite neu laden.
  2. Falls noetig Turnier neu anlegen.
  3. Pruefen, ob `Freilos` in Runde 1 automatisch weitergeleitet wurde (das ist korrekt).

### "Board-ID ungueltig (manual)"
- Einmal in Autodarts manuell eine Lobby oeffnen und ein Board setzen.
- Danach Seite neu laden.

### API-Start/Sync funktioniert nicht
- Login pruefen (Token vorhanden?).
- Feature-Flag aktiv?
- Eindeutige Teilnehmernamen verwenden.
- Bei mehreren offenen Matches mit derselben Paarung wird absichtlich nicht automatisch uebernommen (`Mehrdeutige Zuordnung`), um falsche Ergebnisse zu vermeiden.

### Bracket wird nicht gerendert
- CDN kann temporaer nicht erreichbar sein.
- Der HTML-Fallback wird dann angezeigt.

## Entwicklung
### Repo-Struktur
```text
autodarts_local_tournament/
|- src/
|  |- core/
|  |- data/
|  |- domain/
|  |- infra/
|  |- ui/
|  |  |- styles/
|  |- bracket/
|  |- runtime/
|- build/
|  |- manifest.json
|- scripts/
|  |- build.ps1
|  |- qa.ps1
|  |- qa-encoding.ps1
|  |- qa-regelcheck.ps1
|- tests/
|  |- fixtures/
|  |- selftest-runtime.js
|- installer/
|  |- Autodarts Tournament Assistant Loader.user.js
|- dist/
|  |- autodarts-tournament-assistant.user.js
|- docs/
|  |- architecture.md
|  |- pdc-dra-compliance.md
|  |- refactor-guide.md
|  |- selector-strategy.md
|  |- changelog.md
|- assets/
|- README.md
|- LICENSE
```

### Hauptdateien
- Quellcode: `src/*`
- Build-Metadaten: `build/manifest.json`
- Build/QA: `scripts/*.ps1`
- Runtime-Script: `dist/autodarts-tournament-assistant.user.js`
- Loader-Script: `installer/Autodarts Tournament Assistant Loader.user.js`

### Build und QA
```powershell
powershell -ExecutionPolicy Bypass -File scripts/build.ps1
powershell -ExecutionPolicy Bypass -File scripts/qa.ps1
```

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
  - https://www.thedra.co.uk/dra-rulebook
  - [docs/DRA-RULE_BOOK.pdf](docs/DRA-RULE_BOOK.pdf)
- PDC (Open Draw Kontext, Eventregeln):
  - https://www.pdc.tv/news/2013/01/16/rules-challenge-youth-tours
- JS-Modularisierung:
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
- Tampermonkey Dokumentation:
  - https://www.tampermonkey.net/documentation.php?locale=en
- Tampermonkey FAQ (Injection):
  - https://www.tampermonkey.net/faq.php#Q209
- Referenz-Extension:
  - https://chromewebstore.google.com/detail/autodarts-local-tournamen/algfbicoennnolleogigbefngpkkmcng
- Bracket Viewer:
  - https://github.com/Drarig29/brackets-viewer.js
- Autodarts Themes/Pattern Inspiration:
  - https://github.com/thomasasen/autodarts-tampermonkey-themes
