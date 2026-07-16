# Codex-Umsetzungsplan: UX-Redesign der Turniererstellung mit kontextbezogener Regelhilfe

## Umsetzungsstatus

- Aktueller Release: Release 4 – Kontextbezogene Regelhilfe als Grundsystem
- Zielversion: `0.9.0`
- Status: `ABGESCHLOSSEN`
- Begonnen: 2026-07-16 09:35 CEST
- Zuletzt aktualisiert: 2026-07-16 10:29 CEST

### Fortschritt Release 4

- [x] Ausgangsstand und Abschluss von Release 3 geprüft
- [x] Bestehende Hilfe-Links und relevante Dokumentationsquellen analysiert
- [x] Datengetriebenes Help-Topic-Modell umgesetzt
- [x] Flüchtigen Hilfezustand umgesetzt
- [x] Einheitliche zugängliche Hilfe-Buttons umgesetzt
- [x] Rechtes nicht modales Hilfe-Panel umgesetzt
- [x] Turnierübersicht und Hilfe-Panel sauber umgeschaltet
- [x] Öffnen und expliziter Themenwechsel umgesetzt
- [x] Inhalt aktualisiert sich ohne automatischen Themenwechsel
- [x] Schließen per Button umgesetzt
- [x] Schließen per Escape umgesetzt
- [x] Fokus auf Panel-Überschrift und Fokus-Rückgabe umgesetzt
- [x] Ungültiges Thema bei Moduswechsel sicher behandelt
- [x] Pflicht-Themen vollständig umgesetzt
- [x] Quellenlinks geprüft und themenspezifisch eingebunden
- [x] Alte formularnahe Hilfe-Links ohne Doppelung migriert
- [x] Release-3-Funktionen regressionsfrei
- [x] Responsive Verhalten geprüft
- [x] Tastatur- und Fokusbedienung geprüft
- [x] Automatisierte Tests ergänzt oder angepasst
- [x] Domain-Tests erfolgreich
- [x] Runtime-Contract-Tests erfolgreich
- [x] Gesamtes QA-Skript erfolgreich
- [x] Build erfolgreich erzeugt
- [x] Dokumentation und Changelog aktualisiert
- [x] Screenshot aktualisiert
- [x] Manuelle Abnahmeszenarien geprüft
- [x] Abschlussprüfung des Diffs durchgeführt

### Arbeitsprotokoll Release 4

| Zeitpunkt | Status | Arbeitsergebnis | Prüfung |
|---|---|---|---|
| 2026-07-16 09:35 CEST | IN ARBEIT | Verbindlichen Ausgangscommit `9660e10ba682d82942931485b60e601f70ac9f33`, sauberen Release-3-Abschluss, Repository-Anweisungen, Startprompt, UX-Plan, Formulararchitektur und DRA-/Projektdokumentation geprüft; Release 4 mit Zielversion `0.9.0` gestartet. | Unveränderte Baseline erfolgreich: 129 Domain-Tests und Runtime-Contract mit 53 Selftests; Storage-Schema 5 bleibt unverändert. |
| 2026-07-16 10:15 CEST | IN ARBEIT | Datengetriebenen Katalog mit elf Pflicht-Themen, flüchtigen Zustand, echte Fragezeichen-Buttons, nicht-modales rechtes Hilfe-Panel, Übersichtsaustausch, Live-Aktualisierung, expliziten Themenwechsel sowie Fokus-, Escape- und Modusinvalidierungslogik umgesetzt; alte formularnahe Linkgruppen entfernt. | Zwischenstand erfolgreich: 133 Domain-Tests und Runtime-Contract mit 58 Selftests; ergänzte Tests prüfen Katalog, Inhalte, sichere Links, Öffnen, Themenwechsel, Live-Update, Schließen, Fokus-Rückgabe und ungültige Modusthemen. |
| 2026-07-16 10:29 CEST | ABGESCHLOSSEN | Release 4 auf `0.9.0` finalisiert, Dokumentation, stabile Quellenanker und Screenshot aktualisiert und den Gesamtdiff gegen den verbindlichen Ausgangscommit auf Release-4-Scope, tote formularnahe Hilfe-Links und unbeabsichtigte Release-5-Inhalte geprüft; Release 5 nicht begonnen. | Gesamtes QA erfolgreich: Build, Architektur-, Encoding- und Regelcheck, 134 Domain-Tests, Runtime-Contract mit 61 Selftests und Build-Disziplin; Quellen-Basisziele HTTP 200, Responsive-Messung ohne horizontalen Overflow und `git diff --check` ohne Fehler. |

### Prüfgrenze Release 4

- Automatisiert geprüft: Katalogvollständigkeit und sichere Quellen, alle elf Inhalte, unbekannte IDs, optionale Abschnitte, Trigger-/ARIA-Verträge, explizites Öffnen und Wechseln, Preset-, Draw-, Spielregel-, Board- und Zeitprofil-Liveupdates, drei Modusinvalidierungen, Schließen, Escape, Fokus-Rückgabe und Fallback sowie sämtliche Regressionstests der Releases 1 bis 3.
- Im lokalen Microsoft-Edge-Headless-Browser geprüft: rechte Spalte bei `1920 × 1080` und `1366 × 768`, normaler Dokumentfluss bei `1024 × 768`, `768 × 1024` und emulierten echten `360 × 800`, Fokus-Scroll zum Panel, `44px`-Touchziel bei Touch-Emulation und kein horizontaler Dokument-, Drawer-, Content-, Formular- oder Panel-Overflow; der aktualisierte Screenshot wurde visuell kontrolliert.
- Die vier verwendeten GitHub-Dokumentziele antworteten mit HTTP 200; stabile Themenanker wurden gegen die lokalen Dokumente geprüft. Nicht gegen einen authentifizierten Live-Account auf `play.autodarts.io` ausgeführt wurden echter Lobby-/Board-/API-Start und eine physische Tastatur-/Screenreader-Abnahme. Native Button-/Aside-Semantik, Tab-Erreichbarkeit, sichtbarer Fokus, Enter-/Leertastenaktivierung, Escape und Fokus-Rückgabe sind automatisiert abgesichert; ein Installations-Smoke bleibt nutzerseitig sinnvoll.

### Fortschritt Release 1

- [x] Repository-Anweisungen und betroffene Architektur analysiert
- [x] Ausgangszustand und bestehende Tests geprüft
- [x] Neue Informationshierarchie umgesetzt
- [x] Unveränderbare Fake-Eingabefelder ersetzt
- [x] Grundlage für modusabhängige Bereiche geschaffen
- [x] Nicht interaktive Hover-Zustände bereinigt
- [x] Responsive Layout umgesetzt
- [x] Automatisierte Tests ergänzt oder angepasst
- [x] Domain-Tests erfolgreich
- [x] Runtime-Contract-Tests erfolgreich
- [x] Gesamtes QA-Skript erfolgreich
- [x] Build erfolgreich erzeugt
- [x] Dokumentation und Changelog aktualisiert
- [x] Manuelle Abnahmeszenarien geprüft
- [x] Abschlussprüfung des Diffs durchgeführt

### Arbeitsprotokoll Release 1

| Zeitpunkt | Status | Arbeitsergebnis | Prüfung |
|---|---|---|---|
| 2026-07-15 18:07 CEST | IN ARBEIT | Repository-Anweisungen, vollständiger UX-Plan, betroffene Schichten sowie Build- und Versionskonventionen analysiert; Zielversion `0.6.0` festgelegt. | Nur top-level `AGENTS.md` vorhanden; Ausgangs-Worktree enthält ausschließlich den neuen, unversionierten Ordner `plan/`. |
| 2026-07-15 18:07 CEST | IN ARBEIT | Unveränderten Ausgangszustand geprüft. | Domain-Tests: 120 bestanden; Runtime-Contract: erfolgreich. |
| 2026-07-15 18:25 CEST | IN ARBEIT | Turnieranlage in fünf klar benannte Bereiche gegliedert, feste Werte kompakt zusammengefasst, modusbezogene Rendergruppen markiert, Card-Hover entfernt und Responsive-Breakpoints gehärtet. | Zwischenbuild erfolgreich; erweiterter Runtime-Contract einschließlich UI-Struktur- und Shuffle-Selftests erfolgreich. |
| 2026-07-15 18:36 CEST | IN ARBEIT | Release-Stand auf `0.6.0` gesetzt, Dokumentation und Screenshot aktualisiert sowie die tatsächliche Darstellung im Headless-Browser geprüft. | Kein horizontaler Formular-Overflow bei 1342, 1000, 744 und exakt 360 CSS-Pixeln; Desktop-Zweispalten- und schmale Einspalten-Darstellung visuell geprüft. |
| 2026-07-15 18:38 CEST | IN ARBEIT | Funktions-Smokes über das gebaute Userscript ausgeführt. | Drawer öffnet/schließt; `ko`, `double_ko`, `league`, `groups_ko` und `preliminary_final` wurden jeweils über das Formular angelegt; Turnier-, Spiele-, Turnierbaum-, Import/Export- und Einstellungs-Tab blieben erreichbar. |
| 2026-07-15 18:40 CEST | ABGESCHLOSSEN | Release 1 vollständig gebaut, getestet, dokumentiert und gegen Scope-Creep auditiert; Release 2 nicht begonnen. | Build, Architektur-QA, Encoding-QA, Regelcheck, 120 Domain-Tests, Runtime-Contract und Build-Disziplin erfolgreich; `git diff --check` ohne Fehler; keine veralteten Fake-Felder oder nicht interaktiven Card-Hover-Regeln im Quellcode. |

### Prüfgrenze Release 1

- Automatisiert geprüft: Domain-/Szenariologik, Runtime-Selftests, stabiler Create-UI-DOM-Contract, Preset-Anwendung, Draft-/Shuffle-Verhalten sowie alle Repository-QA-Gates.
- Im lokalen Microsoft-Edge-Headless-Browser geprüft: Öffnen/Schließen, Anlage aller fünf vorhandenen Modi, Erreichbarkeit aller Tabs, responsive Anordnung und horizontale Formularbreite.
- Nicht gegen einen authentifizierten Live-Account auf `play.autodarts.io` ausgeführt: echter Lobby-/Board-/API-Start. Diese Integration wurde in Release 1 nicht geändert und bleibt ein sinnvoller Installations-Smoke für den Nutzer.

### Fortschritt Release 2

- [x] Ausgangsstand und Abschluss von Release 1 geprüft
- [x] Bestehende Preset-Definitionen und Migrationen analysiert
- [x] Preset-Auswahl in den Bereich Turnierformat verschoben
- [x] Zugängliche Preset-Auswahlkarten umgesetzt
- [x] Direkte Preset-Anwendung umgesetzt
- [x] Apply-Button und veraltete Handler entfernt
- [x] Custom-Verhalten bei manuellen Änderungen umgesetzt
- [x] Nicht preset-relevante Draft-Werte bleiben erhalten
- [x] Legacy-Preset-Migration geprüft
- [x] Responsive Verhalten geprüft
- [x] Tastatur- und Fokusbedienung geprüft
- [x] Automatisierte Tests ergänzt oder angepasst
- [x] Domain-Tests erfolgreich
- [x] Runtime-Contract-Tests erfolgreich
- [x] Gesamtes QA-Skript erfolgreich
- [x] Build erfolgreich erzeugt
- [x] Dokumentation und Changelog aktualisiert
- [x] Screenshot aktualisiert
- [x] Manuelle Abnahmeszenarien geprüft
- [x] Abschlussprüfung des Diffs durchgeführt

### Arbeitsprotokoll Release 2

| Zeitpunkt | Status | Arbeitsergebnis | Prüfung |
|---|---|---|---|
| 2026-07-15 18:45 CEST | IN ARBEIT | Ausgangscommit `b61f13fabd58ad03dbaf2954befe1ee8a5a934a1`, Release-1-Abschluss, Preset-Katalog, Draft-Normalisierung, Legacy-Alias, Render- und Handlerfluss analysiert; Storage-Schema bleibt unverändert. | Arbeitsbaum war sauber und exakt auf dem verbindlichen Ausgangscommit; nur top-level `AGENTS.md` vorhanden. |
| 2026-07-15 19:02 CEST | IN ARBEIT | Eine native Radio-Gruppe mit drei zugänglichen Preset-Karten als einzige `x01Preset`-Formularquelle umgesetzt; direkte Anwendung, Custom-Umschaltung und Erhalt nicht preset-relevanter Werte abgesichert; alte Select-/Apply-/Pill-Struktur entfernt. | Zwischenbuild erfolgreich; 123 Domain-Tests bestanden; Runtime-Contract einschließlich 50 Runtime-Selftests erfolgreich. |
| 2026-07-15 19:14 CEST | ABGESCHLOSSEN | Release 2 auf `0.7.0` finalisiert, Dokumentation und Screenshot aktualisiert sowie Diff gegen den Ausgangscommit auf Release-2-Scope, tote Preset-Selektoren und Storage-Kompatibilität geprüft; Release 3 nicht begonnen. | Gesamtes QA erfolgreich: Build, Architektur, Encoding, Regelcheck, 123 Domain-Tests, Runtime-Contract, 50 Runtime-Selftests und Build-Disziplin; `git diff --check` ohne Fehler. |

### Prüfgrenze Release 2

- Automatisiert geprüft: vollständige Anwendung beider fachlichen Presets, idempotente Wiederanwendung, Custom-Auswahl ohne Sachwertänderung, Custom-Umschaltung für alle preset-relevanten Felder, Draft-/Rerender-Erhalt, Zeitprognose, nicht preset-relevante Werte, Legacy-Draft und Legacy-Turnier sowie Markup-/Accessibility-Verträge.
- Im lokalen Microsoft-Edge-Headless-Browser visuell geprüft: Kartenlayout bei `1920 × 1080`, `1366 × 768`, `1024 × 768` und `768 × 1024`; Drei- und Zweispaltenlayout, ausgewählter Zustand und Textumbruch sind sichtbar korrekt. Das Einspaltenlayout ist über den `600px`-Breakpoint und einen schmalen Headless-Render geprüft; der Headless-Browser stellt jedoch keinen verlässlichen physischen Tastaturtest bereit.
- Vom Nutzer noch manuell sinnvoll zu prüfen: Pfeiltasten und Leertaste mit realer Tastatur, exakte schmale Gerätebreite sowie ein Installations-Smoke auf dem authentifizierten `play.autodarts.io`-Account. Native Radio-Semantik, zugeordnete Labels/Beschreibungen und sichtbarer `:focus-visible`-Stil sind automatisiert abgesichert.

### Fortschritt Release 3

- [x] Ausgangsstand und Abschluss von Release 2 geprüft
- [x] Modus-, Draft-, Config- und Domainpfade analysiert
- [x] Zentrale Zuordnung modusspezifischer Regeln umgesetzt
- [x] KO zeigt nur relevante Zusatzregeln
- [x] Doppel-KO zeigt nur relevante Zusatzregeln
- [x] Liga zeigt keine irrelevanten Zusatzregeln
- [x] Gruppenphase + KO zeigt nur unterstützte Gruppenregeln
- [x] Vorrunde + Finalphase bleibt vollständig funktionsfähig
- [x] Irrelevante Felder beeinflussen Config und Validierung nicht
- [x] Modusspezifische Draft-Werte bleiben beim Moduswechsel erhalten
- [x] Kompakte Live-Spielregel-Zusammenfassung umgesetzt
- [x] Preset-Herkunft korrekt dargestellt
- [x] Zugänglicher Inline-Bearbeitungsbereich umgesetzt
- [x] Bull-off-/Bull-Modus-Abhängigkeit korrekt dargestellt
- [x] Release-2-Preset-Verhalten regressionsfrei
- [x] Responsive Verhalten geprüft
- [x] Tastatur- und Fokusbedienung geprüft
- [x] Automatisierte Tests ergänzt oder angepasst
- [x] Domain-Tests erfolgreich
- [x] Runtime-Contract-Tests erfolgreich
- [x] Gesamtes QA-Skript erfolgreich
- [x] Build erfolgreich erzeugt
- [x] Dokumentation und Changelog aktualisiert
- [x] Screenshot aktualisiert
- [x] Manuelle Abnahmeszenarien geprüft
- [x] Abschlussprüfung des Diffs durchgeführt

### Arbeitsprotokoll Release 3

| Zeitpunkt | Status | Arbeitsergebnis | Prüfung |
|---|---|---|---|
| 2026-07-15 21:21 CEST | IN ARBEIT | Verbindlichen Ausgangscommit `bae6a74923b7832505bd1156056c380448e3435e`, sauberen Arbeitsbaum, Repository-Anweisungen sowie die vollständigen Abschlussstände von Release 1 und 2 geprüft; Release 3 gestartet. | Exakter Ausgangscommit bestätigt; nur top-level `AGENTS.md` vorhanden; Zielversion `0.8.0`, Storage- und Implementierungsbedarf werden im nächsten Analyseschritt geprüft. |
| 2026-07-15 21:21 CEST | IN ARBEIT | Render-, Handler-, Draft-, Normalisierungs-, Config-, Domain-, Import-/Export-, Persistenz-, Dauerprognose-, Modus- und Testpfade analysiert. Zentrale Risiken sind der Verlust deaktivierter/ungerenderter Felder über `FormData` und eine zu breite Create-Config; Storage-Schema 5 kann unverändert bleiben. | Unveränderte Baseline erfolgreich: 123 Domain-Tests; Runtime-Contract erfolgreich. |
| 2026-07-15 21:45 CEST | IN ARBEIT | Zentrale Moduszuordnung, DOM-Deaktivierung, Draft-Erhalt, Domain-Config-Projektion, kompakte Live-Zusammenfassung und zugänglichen Inline-Editor umgesetzt; Dokumentation, Version `0.8.0` und Screenshot aktualisiert. | 129 Domain-Tests und Runtime-Contract erfolgreich; reale Headless-Viewport-Messung bei `1920×1080`, `1366×768`, `1024×768`, `768×1024` und `360×800` ohne horizontalen Dokument-, Drawer-, Content- oder Formular-Overflow; alle fünf Modusgruppen im Browser geprüft. |
| 2026-07-15 21:50 CEST | ABGESCHLOSSEN | Release 3 auf `0.8.0` finalisiert, generierte Artefakte aktualisiert und den Gesamtdiff gegen den verbindlichen Ausgangscommit auf Release-3-Scope, tote Selektoren und unbeabsichtigte Regelhilfe aus Release 4 geprüft. | Build, Architektur-QA, Encoding-QA, Regelcheck, 129 Domain-Tests, Runtime-Contract mit 53 Selftests und Build-Disziplin erfolgreich; `git diff --check` ohne Fehler. |

### Prüfgrenze Release 3

- Automatisiert geprüft: zentrale Moduszuordnung, Sichtbarkeit und Deaktivierung irrelevanter Felder, Ausschluss aus `FormData`, Draft-Erhalt beim Moduswechsel, Domain-Config-Projektion, Zusammenfassung und Preset-Herkunft, Disclosure-/Fokusvertrag, Preset-Regressionen sowie alle Repository-QA-Gates.
- Im lokalen Microsoft-Edge-Headless-Browser geprüft: alle fünf Modusgruppen, geschlossener und geöffneter Spielregel-Editor, Responsive-Verhalten und horizontaler Overflow bei `1920×1080`, `1366×768`, `1024×768`, `768×1024` und `360×800`; der neue Screenshot wurde visuell kontrolliert.
- Nicht gegen einen authentifizierten Live-Account auf `play.autodarts.io` ausgeführt: echter Lobby-/Board-/API-Start und physische Tastaturbedienung. Die betroffenen Tastatur-, Fokus- und Create-Verträge sind automatisiert abgesichert; ein Installations-Smoke bleibt als nutzerseitige Abnahme sinnvoll.

## 1. Auftrag und Ziel

Dieser Plan beschreibt die schrittweise Umsetzung des UX-Redesigns für den **Autodarts Tournament Assistant**.

Repository:

```text
https://github.com/thomasasen/autodarts_local_tournament
```

Das bestehende System ist fachlich leistungsfähig, aber die Turniererstellung ist durch viele gleichzeitig sichtbare Felder, technische Begriffe, Sonderregeln und Hilfetexte zu komplex geworden.

Das Ziel ist eine klar gegliederte, moderne und leicht verständliche Turniererstellung, die:

- neue und unerfahrene Nutzer sicher führt,
- erfahrene Turnierleiter nicht ausbremst,
- nur kontextrelevante Optionen zeigt,
- Presets verständlich priorisiert,
- Regeln und Abhängigkeiten über eine kontextbezogene Hilfe erklärt,
- bestehende Turnierlogik, Persistenz, Imports und Regelkonformität schützt,
- keine unbelegten PDC- oder DRA-Aussagen erzeugt.

Die Umsetzung erfolgt in mehreren Releases. **Jeder Schritt muss eine eigenständig lauffähige, getestete und veröffentlichungsfähige Version ergeben.**

---

## 2. Verbindliche Leitplanken

### 2.1 Repository-Regeln

`AGENTS.md` und weitere Repository-Anweisungen sind bindend.

Besonders wichtig:

- Nur Dateien unter `src/*` als Source of Truth bearbeiten.
- `dist/*` niemals manuell ändern.
- Build ausschließlich über die vorhandenen Build-Skripte erzeugen.
- Domain-Logik bleibt rein.
- Die UI trifft keine neuen fachlichen Entscheidungen.
- Persistierte Daten bleiben soweit möglich rückwärtskompatibel.
- Ambige oder verlustbehaftete Migrationen dürfen nicht still erfolgen.
- Dokumentation muss zum tatsächlichen Verhalten passen.
- Assistiertes Verhalten muss als assistiert bezeichnet werden.

### 2.2 Regelquellen

Für alle Aussagen zu PDC, DRA, Draw, Formaten, Teilnehmerlimits, Bye-Verhalten und Veranstalterregeln sind mindestens diese Quellen zu prüfen:

```text
docs/DRA-RULE_BOOK.pdf
docs/dra-regeln-gui.md
docs/dra-compliance-matrix.md
README.md
```

Keine Regelbehauptung darf allein aus der Designstudie, bisherigen UI-Beschriftungen oder Vermutungen abgeleitet werden.

### 2.3 Designentscheidung

Die neue Oberfläche bleibt eine **progressive Einzelseite**. Kein mehrstufiger Wizard.

Zielstruktur:

1. Turnierformat
2. Teilnehmer
3. Modusabhängige Zusatzregeln
4. Kompakte Spielregel-Zusammenfassung
5. Rechte Turnierübersicht
6. Primäre Aktion „Turnier anlegen“

### 2.4 Verbindliche Entscheidung zur Regelhilfe

Die Regelhilfe wird so umgesetzt:

- Hilfe-Symbole nur an fachlich erklärungsbedürftigen Stellen.
- Das Symbol muss eindeutig als Hilfe erkennbar sein.
- Bevorzugt: Fragezeichen in einem Kreis.
- Kein Glühlampen-Symbol.
- Kein globaler Regelhilfe-Ein/Aus-Modus.
- Keine permanenten langen Erklärungsboxen im Formular.
- Keine Legende mit Regelarten.
- Keine Boxen wie „Wozu dienen die Regelarten?“, „Wozu dienen die Glühlampen?“ oder „Wann wird die Regelhilfe aktualisiert?“
- Klick auf ein Hilfe-Symbol öffnet rechts ein kontextbezogenes Hilfe-Panel.
- Das Hilfe-Panel zeigt nur Informationen zum bewusst ausgewählten Thema.
- Feldänderungen dürfen den Inhalt des geöffneten Themas aktualisieren.
- Feldänderungen dürfen niemals selbstständig auf ein anderes Thema wechseln.

---

## 3. Zielbild der finalen Oberfläche

### 3.1 Linker Hauptbereich

#### Bereich 1: Turnierformat

Enthält:

- Turniername
- Turniermodus
- Preset- beziehungsweise Formatauswahl
- Hilfe-Symbole für Turniermodus und Preset/Format

Preset-Auswahl steht vor den technischen Einzelregeln.

#### Bereich 2: Teilnehmer

Enthält:

- großes Teilnehmerfeld
- Live-Teilnehmerzahl
- Mindest- und Höchstgrenze des aktuellen Modus
- Erkennung doppelter Namen
- verständliche Inline-Validierung
- Aktion „Zufällig mischen“
- Hilfe-Symbole für Teilnehmerliste und Setzreihenfolge, falls fachlich relevant

#### Bereich 3: Zusätzliche Turnierregeln

Nur Optionen anzeigen, die für den gewählten Modus gelten.

| Modus | Sichtbare Optionen |
|---|---|
| KO | Auslosung der ersten Runde, Spiel um Platz 3 |
| Doppel-KO | Auslosung der ersten Runde, Grand-Final-Regel |
| Liga | keine KO-spezifischen Optionen |
| Gruppenphase + KO | Gruppenverteilung, Regel für ungerade Teilnehmerzahl und nur fachlich passende KO-Optionen |

Jede fachlich relevante Regel erhält ein eigenes Hilfe-Symbol.

#### Bereich 4: Spielregeln

Standarddarstellung kompakt:

```text
501 · First to 6 Legs · Straight In · Double Out · Bull-off Normal · Bull 25/50 · Max Runden 50
```

Dazu:

- Aktion „Bearbeiten“
- Hilfe-Symbol „Hilfe zu den Spielregeln öffnen“

Die Einzelwerte werden nicht dauerhaft als gleichrangige Felder gezeigt, sondern in einem klaren Bearbeitungsbereich geöffnet.

### 3.2 Rechte Turnierübersicht

Enthält:

- Modus
- Preset
- Teilnehmerzahl
- geschätzte Spielanzahl
- Board-Anzahl
- geschätzte Dauer
- Validierungsstatus
- Button „Turnier anlegen“

Wenn die Regelhilfe geöffnet ist, erscheint rechts das Hilfe-Panel. Entscheide anhand des realen Layouts, ob die Turnierübersicht ersetzt oder darüber eingeblendet wird. Die Standardansicht darf nicht überladen wirken.

---

## 4. Architektur der Regelhilfe

### 4.1 Datengetriebenes Modell

Hilfetexte dürfen nicht als lange, verteilte HTML-Blöcke in `render-tournament.js` eingebaut werden.

Plane und implementiere eine zentrale Struktur, zum Beispiel:

```js
const TOURNAMENT_HELP_TOPICS = {
  tournamentMode: {
    id: "tournamentMode",
    title: "Turniermodus",
    shortDescription: "...",
    currentSelection: ({ draft, settings }) => "...",
    effects: ({ draft, settings }) => [],
    examples: ({ draft, settings }) => [],
    tips: ({ draft, settings }) => [],
    dependencies: ({ draft, settings }) => [],
    compliance: ({ draft, settings }) => ({
      label: "...",
      description: "...",
    }),
    sources: [
      {
        label: "README: Turniermodi",
        href: README_TOURNAMENT_MODES_URL,
      },
    ],
  },
};
```

Die konkrete Form darf an das Repository angepasst werden. Das Ziel bleibt:

- zentrale Pflege,
- keine Textduplikation,
- dynamische Ableitung aus dem aktuellen Draft,
- saubere Trennung von Daten, Ableitung, Rendering und Event-Handling.

### 4.2 Inhalt eines Hilfe-Themas

Je nach Thema kann das Panel enthalten:

1. Titel
2. Kurz erklärt
3. Aktuelle Auswahl
4. Auswirkungen auf das Turnier
5. Beispiele
6. Tipps und typische Einsatzfälle
7. Abhängigkeiten zu anderen Einstellungen
8. Einschränkungen
9. Regeltyp und Konformität
10. Quellen als echte Links
11. Datum oder Stand der fachlichen Prüfung, falls sinnvoll

Nicht jeder Abschnitt muss bei jedem Thema erscheinen.

### 4.3 Einordnung von Regeln

Die Einordnung darf nur im jeweiligen Hilfe-Panel erscheinen.

Mögliche Kategorien:

- Offizielle Regel
- Bestandteil eines offiziellen Formats
- AutoDarts-technische Vorgabe
- Produktstandard der Anwendung
- Veranstalterentscheidung
- Hausregel
- Assistiertes, nicht vollständig erzwungenes Verhalten

Die Einordnung muss textlich erklärt werden. Farbe darf nie die einzige Informationsquelle sein.

### 4.4 Quellen

Quellen müssen:

- anklickbar sein,
- eine verständliche Beschriftung besitzen,
- möglichst auf eine konkrete Stelle oder einen konkreten Abschnitt verweisen,
- interne README- und Dokumentationslinks bevorzugen, wenn sie die Aussage bereits sauber belegen,
- externe Regelwerke nur dann verlinken, wenn die Fundstelle belastbar ist.

Keine generischen Quellenlisten ohne Bezug zum konkreten Hilfethema.

---

## 5. Zustands- und Triggerlogik der Regelhilfe

### 5.1 Flüchtiger Zustand

Der geöffnete Hilfezustand soll grundsätzlich nicht dauerhaft persistiert werden.

Empfohlen:

```js
state.activeTournamentHelpTopic = null;
state.lastTournamentHelpTrigger = null;
```

Oder eine äquivalente Struktur, die zur vorhandenen Architektur passt.

### 5.2 Auslöser

Verbindliche Logik:

1. Klick auf ein Hilfe-Symbol setzt das zugehörige Thema.
2. Das Hilfe-Panel wird geöffnet oder aktualisiert.
3. Klick auf ein anderes Hilfe-Symbol wechselt das Thema.
4. Änderung der aktuell erklärten Einstellung aktualisiert aktuelle Auswahl, Auswirkungen, Abhängigkeiten, Beispiele oder Tipps, falls nötig.
5. Änderung einer abhängigen Einstellung darf den Inhalt aktualisieren.
6. Keine Feldänderung darf das Thema selbstständig wechseln.
7. Fokuswechsel allein darf die Hilfe nicht umschalten.
8. Escape schließt das Hilfe-Panel.
9. Sichtbare Schließen-Aktion schließt das Hilfe-Panel.
10. Nach dem Schließen kehrt der Fokus zum auslösenden Hilfe-Button zurück.
11. Beim Schließen des gesamten Assistant wird der Hilfezustand zurückgesetzt.

---

## 6. Release-Plan

# Release 1: Strukturelle Grundlage und sichere UI-Aufteilung

## Ziel

Die Turniererstellung wird in die neue Informationshierarchie überführt, ohne die fachliche Logik oder Preset-Bedienung grundlegend zu ändern.

Diese Version muss bereits vollständig nutzbar und veröffentlichungsfähig sein.

## Umsetzung

1. Betroffene Architektur analysieren, mindestens:

```text
src/ui/render-tournament.js
src/ui/render-shell.js
src/ui/handlers.js
src/ui/styles/main.css
src/core/constants.js
src/domain/*
src/app/*
tests/*
```

2. Formular sichtbar in diese Bereiche aufteilen:

- Turnierformat
- Teilnehmer
- Zusätzliche Turnierregeln
- Spielregeln
- Turnierübersicht

3. Die bisherigen schreibgeschützten Fake-Felder „Spielmodus“ und „Lobby“ nicht länger wie Eingabefelder darstellen. Stattdessen kompakt zusammenfassen, zum Beispiel:

```text
X01 · Legs · Private Lobby
```

4. UI-Struktur so vorbereiten, dass Optionen pro Modus separat gerendert werden können.
5. Hover-Effekte von nicht interaktiven Karten entfernen.
6. Responsive Grundlage für Desktop, 1366 × 768, Tablet und schmale Ansicht schaffen.

## Abnahmekriterien

- Alle fünf vorhandenen Turniermodi lassen sich weiterhin anlegen.
- Bestehende Drafts werden geladen.
- Presets funktionieren unverändert.
- Zeitprognose funktioniert.
- Teilnehmer-Mischen funktioniert.
- Keine Einstellung ist verloren gegangen.
- Keine fachliche Regel wurde verändert.
- Die neue visuelle Struktur ist klar erkennbar.
- Keine unbedienbare horizontale Überbreite bei typischen Viewports.

## Tests

```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-domain.ps1
powershell -ExecutionPolicy Bypass -File scripts/test-runtime-contract.ps1
powershell -ExecutionPolicy Bypass -File scripts/qa.ps1
```

Zusätzlich vorhandene UI- oder Snapshot-Tests ausführen beziehungsweise ergänzen.

## Versionsqualität

Release 1 darf keine halbfertigen Hilfe-Buttons, leeren Panels oder deaktivierten Platzhalter enthalten.

---

# Release 2: Preset-first und direkte Preset-Anwendung

## Ziel

Presets werden zur primären, verständlichen Einstiegsmöglichkeit. Der separate Button „Preset anwenden“ entfällt.

## Umsetzung

1. Preset-Auswahl in den Bereich „Turnierformat“ verschieben.
2. Eine bewusste Preset-Auswahl sofort anwenden.
3. Den bisherigen Button „Preset anwenden“ entfernen.
4. Bestehendes Verhalten beibehalten:
   - Änderung eines preset-relevanten Feldes setzt den Status auf „Individuell / Manuell“.
   - Legacy-Preset-IDs werden weiterhin korrekt migriert.
   - Gespeicherte Drafts behalten ihre Werte.
5. Prüfen, ob kompakte Auswahlkarten sinnvoll sind. Anforderungen:
   - Tastaturbedienung
   - Radio-Semantik oder äquivalente zugängliche Auswahl
   - klarer ausgewählter Zustand
   - Zustand nicht nur über Farbe
   - sauberer Umbruch bei kleiner Breite
6. Keine fachlichen Presets erfinden.

## Abnahmekriterien

- Alle vorhandenen Presets lassen sich direkt anwenden.
- Kein separater Apply-Button mehr.
- Manuelle Änderung führt zuverlässig zu „Individuell / Manuell“.
- Legacy-Drafts bleiben kompatibel.
- PDC European Tour bleibt fachlich korrekt definiert.
- Bedienung funktioniert per Tastatur und Maus.

## Tests

- Preset-Wechsel
- direkte Feldübernahme
- Wechsel auf Custom nach manueller Änderung
- Legacy-Preset-Migration
- Draft-Erhalt nach Reload
- alle Repository-Quality-Gates

---

# Release 3: Modusabhängige Zusatzregeln und kompakte Spielregeln

## Ziel

Die Oberfläche zeigt nur fachlich relevante Zusatzoptionen. Die technischen X01-Einstellungen werden kompakt zusammengefasst und gezielt bearbeitbar.

## Umsetzung

1. Modusabhängige Regelbereiche umsetzen:

### KO

- Auslosung der ersten Runde
- Spiel um Platz 3

### Doppel-KO

- Auslosung der ersten Runde
- Grand-Final-Regel

### Liga

- keine KO-spezifischen Einstellungen

### Gruppenphase + KO

- Gruppenregel für gerade/ungerade Teilnehmer
- Gruppenauswirkungen
- nur weitere Optionen, die durch vorhandene Logik wirklich unterstützt werden

2. Nicht relevante Werte dürfen im Draft erhalten bleiben, falls dies für Moduswechsel nötig ist. Sie dürfen aber nicht versehentlich in eine neue Turniererstellung einfließen.
3. Im Standardzustand nur eine verständliche Spielregel-Zusammenfassung anzeigen.
4. „Bearbeiten“ öffnet einen klar abgegrenzten, zugänglichen Bearbeitungsbereich.
5. Der Nutzer muss erkennen, welche Werte aktiv sind, welche vom Preset stammen und wann Custom aktiv wird.

## Abnahmekriterien

- Liga zeigt keine KO-Regeln.
- Doppel-KO zeigt kein Spiel um Platz 3.
- KO zeigt keine Grand-Final-Regel.
- Gruppenphase zeigt nur unterstützte Gruppenregeln.
- Moduswechsel beschädigt den Draft nicht.
- Turnieranlage verwendet nur fachlich relevante Werte.
- Spielregeln sind kompakt, aber vollständig bearbeitbar.
- Alle bisherigen Turniermodi funktionieren unverändert.

## Tests

- Sichtbarkeit je Modus
- Config-Erstellung je Modus
- Wechsel zwischen Modi
- Draft-Erhalt
- Grand-Final-Regel nur bei Doppel-KO
- Platz-3-Regel nur bei KO
- Gruppenregel bei gerader und ungerader Teilnehmerzahl
- alle Quality-Gates

---

# Release 4: Kontextbezogene Regelhilfe als Grundsystem

## Ziel

Ein vollständig funktionsfähiges, zugängliches Hilfesystem wird eingeführt. Diese Version muss bereits echte Hilfe für die wichtigsten Themen enthalten.

## Umsetzung

1. Zentrales Help-Topic-Modell erstellen. Sinnvolle neue Module sind erlaubt, etwa:

```text
src/ui/tournament-help-topics.js
src/ui/render-tournament-help.js
src/ui/tournament-help-state.js
```

Dateinamen an die vorhandene Architektur anpassen.

2. Erste verpflichtende Hilfe-Themen:

- Turniermodus
- Preset/Format
- Teilnehmerliste
- Auslosung der ersten Runde
- Spiel um Platz 3
- Grand-Final-Regel
- Gruppenregel bei ungerader Teilnehmerzahl
- Spielregeln/X01
- Board-Anzahl für Zeitprognose
- Zeitprofil

3. Hilfe-Symbole:

- Fragezeichen im Kreis
- sichtbarer Fokus
- ausreichend großes Klickziel
- konkretes `aria-label`
- `aria-expanded`
- `aria-controls`, sofern passend

4. Hilfe-Panel mit mindestens:

- Titel
- Kurz erklärt
- aktuelle Auswahl
- Auswirkungen
- Quellen

5. Triggerlogik genau wie in Abschnitt 5 umsetzen.
6. Semantik des Panels fachlich begründet wählen: ergänzende Region, nicht modaler Dialog oder anderes passendes Muster.

## Abnahmekriterien

- Hilfe-Symbole sind eindeutig als Hilfe erkennbar.
- Kein Glühlampen-Symbol.
- Kein globaler Hilfe-Schalter.
- Keine unteren Erklärungsboxen oder Regelarten-Legende.
- Klick öffnet das richtige Thema.
- Klick auf anderes Symbol wechselt das Thema.
- Fokuswechsel allein ändert nichts.
- Escape schließt.
- Fokus kehrt zurück.
- Links sind anklickbar und beschriftet.
- Keine unbelegten Regelbehauptungen.
- Panel ist responsive nutzbar.

## Tests

- Öffnen
- Themenwechsel
- Schließen per Button
- Schließen per Escape
- Fokus-Rückgabe
- unbekannte Topic-ID
- fehlende optionale Abschnitte
- Link-Rendering
- relevante Runtime-Tests
- alle Quality-Gates

---

# Release 5: Dynamische Hilfe, Abhängigkeiten, Beispiele und Compliance

## Ziel

Das Hilfe-Panel reagiert fachlich korrekt auf aktuelle Einstellungen und erklärt Zusammenhänge.

## Umsetzung

1. Dynamische aktuelle Auswahl ergänzen, zum Beispiel:
   - „Best of 11 bedeutet First to 6.“
   - „Die Eingabereihenfolge wird aktuell als Setzliste verwendet.“
   - „Bull-Modus ist deaktiviert, weil Bull-off auf Off steht.“
2. Mindestens diese Abhängigkeiten erklären:
   - Bull-off ↔ Bull-Modus
   - Preset ↔ X01-Werte
   - Modus ↔ Zusatzregeln
   - Teilnehmerzahl ↔ Modus-Limits
   - Teilnehmerzahl ↔ Gruppenverteilung
   - Board-Anzahl ↔ Zeitprognose
   - Grand-Final-Modus ↔ Doppel-KO
   - Draw-Modus ↔ Eingabereihenfolge und Seed-Wirkung
3. Kurze, konkrete Beispiele ergänzen.
4. Tipps klar von Regeln trennen.
5. Compliance und Herkunft pro Thema belastbar einordnen.
6. Konkrete Quellen pro Thema pflegen. Keine toten Links.

## Abnahmekriterien

- Geöffnetes Thema aktualisiert sich bei relevanten Feldänderungen.
- Thema wechselt nicht selbstständig.
- Abhängigkeiten sind korrekt.
- Tipps sind klar von Regeln getrennt.
- Compliance-Aussagen sind belegt.
- Quellen passen zum jeweiligen Inhalt.
- Keine Widersprüche zwischen README, Help-Panel und Compliance-Dokumenten.

## Tests

- dynamische Auswahltexte
- abhängige Aktualisierung
- Bull-off/Bull-Modus
- Moduswechsel bei geöffnetem Thema
- Presetwechsel bei geöffnetem Thema
- Teilnehmerzahl und Gruppenanalyse
- Quellenstruktur
- alle Quality-Gates

---

# Release 6: Live-Validierung und Turnierübersicht

## Ziel

Der Nutzer erkennt vor dem Absenden, ob das Turnier gültig ist und welche Auswirkungen die Konfiguration hat.

## Umsetzung

1. Live anzeigen:
   - erkannte Teilnehmerzahl
   - Mindestgrenze
   - Höchstgrenze
   - doppelte Namen
   - leere oder ungültige Einträge
   - gruppenspezifische Probleme
2. Fehler unmittelbar am betroffenen Bereich anzeigen.
3. „Turnier anlegen“ deaktivieren, solange bekannte Pflichtbedingungen nicht erfüllt sind. Der Nutzer muss erkennen, was fehlt.
4. Bei fehlgeschlagenem Absenden:
   - verständliche Fehlermeldung
   - Fokus auf erstes relevantes Problem
   - Domain-Reason-Code nutzen, falls vorhanden
5. Turnierübersicht live aktualisieren:
   - Modus
   - Preset
   - Teilnehmerzahl
   - Spielanzahl
   - Board-Anzahl
   - Dauerprognose
   - Validierungsstatus
6. Geeignete Status- und Alert-Semantik verwenden.

## Abnahmekriterien

- Nutzer sieht vor dem Absenden, was fehlt.
- Doppelte Namen werden erkannt.
- Grenzen ändern sich mit dem Modus.
- Primärbutton entspricht dem Validierungszustand.
- Turnierübersicht aktualisiert sich live.
- Zeitprognose bleibt korrekt.
- Erfolgreiche Anlage funktioniert in allen Modi.

## Tests

- Teilnehmerzahl
- Duplikate
- Min/Max je Modus
- Button-Zustand
- Fokus nach Fehler
- Status-/Alert-Semantik
- Turnieranlage in allen Modi
- alle Quality-Gates

---

# Release 7: Accessibility, Responsive-Finish und vollständige Dokumentation

## Ziel

Die neue Oberfläche wird für die Veröffentlichung final gehärtet.

## Umsetzung

1. Vollständige Tastaturprüfung.
2. Fokus prüfen:
   - sichtbare Fokuszustände
   - logische Reihenfolge
   - Fokus-Rückgabe
   - kein Fokusverlust nach Rerender
   - kein unnötiger Fokus-Sprung bei Live-Updates
3. Responsive manuell prüfen:

```text
1920 × 1080
1366 × 768
1024 × 768
768 × 1024
schmale mobile Breite
```

4. `prefers-reduced-motion` berücksichtigen.
5. Touch-Ziele ausreichend groß gestalten.
6. Dokumentation aktualisieren:

```text
README.md
docs/changelog.md
docs/dra-regeln-gui.md
docs/dra-compliance-matrix.md
```

7. Neue Screenshots erstellen.
8. Alte UI-Reste entfernen:
   - nicht mehr verwendete CSS-Klassen
   - alter Preset-Apply-Code
   - veraltete Hilfe-Links
   - doppelte Erklärtexte
   - tote Event-Handler
   - ungenutzte Zustände

## Abnahmekriterien

- keine bekannten Accessibility-Blocker
- keine UI-Regression in anderen Tabs
- kein toter Code aus der alten Turniererstellung
- Dokumentation entspricht dem realen Verhalten
- Screenshots entsprechen der aktuellen Version
- alle Quality-Gates grün
- manuelle Smoke-Tests erfolgreich

---

## 7. Globale Quality-Gates für jeden Release

### 7.1 Build und Tests

Mindestens:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-domain.ps1
powershell -ExecutionPolicy Bypass -File scripts/test-runtime-contract.ps1
powershell -ExecutionPolicy Bypass -File scripts/qa.ps1
```

Zusätzlich alle weiteren im Repository vorhandenen relevanten Tests ausführen.

### 7.2 Funktionsprüfung

Für jeden Release manuell prüfen:

- Assistant öffnet und schließt.
- Draft bleibt erhalten.
- KO lässt sich anlegen.
- Doppel-KO lässt sich anlegen.
- Liga lässt sich anlegen.
- Gruppenphase + KO lässt sich anlegen.
- Import und Export funktionieren weiterhin.
- Spiele-Tab funktioniert.
- Turnierbaum funktioniert.
- Einstellungen funktionieren.
- API-bezogene Funktionen werden nicht beschädigt.

### 7.3 Rückwärtskompatibilität

Prüfen:

- bestehende gespeicherte Drafts
- bestehende aktive Turniere
- Legacy-Preset-ID
- Import alter Exporte
- Storage-Schema

Storage-Schema nur erhöhen, wenn dies tatsächlich nötig ist.

### 7.4 Regelkonformität

Vor Abschluss jedes Releases prüfen:

- Wurde eine fachliche Aussage geändert?
- Wurde eine neue PDC-/DRA-Aussage ergänzt?
- Ist sie belegt?
- Muss die Compliance-Matrix angepasst werden?
- Ist Verhalten nur assistiert?
- Wird dies klar gesagt?

### 7.5 Codequalität

- keine unnötige Duplikation
- keine riesigen neuen HTML-Blöcke in einer einzelnen Renderfunktion
- keine Domain-Entscheidungen im UI
- explizite Zustände
- nachvollziehbare Benennung
- kein manuelles Editieren von `dist/*`
- keine neue Dependency ohne zwingenden Grund

---

## 8. Verbindliche Abnahmeszenarien

### Szenario A: Einfaches KO-Freizeitturnier

- 8 Teilnehmer
- zufällige Auslosung
- Best of 5
- ein Board
- Hilfe zur Auslosung öffnen
- Auswirkungen und Quellen prüfen
- Turnier erfolgreich anlegen

### Szenario B: Gesetztes KO-Turnier

- 9 Teilnehmer
- Eingabereihenfolge als Setzliste
- Bye-Verteilung
- Hilfe zum Draw öffnen
- Setzwirkung korrekt erklärt
- Turnierbaum korrekt

### Szenario C: Doppel-KO

- 8 Teilnehmer
- Reset-Finale
- Hilfe zur Grand-Final-Regel
- Abhängigkeit zum Modus korrekt
- Turnier erfolgreich anlegen

### Szenario D: Liga

- 6 Teilnehmer
- keine KO-Regeln sichtbar
- Hilfe zu Teilnehmerzahl und Tie-Break-Hintergrund erreichbar
- Turnier erfolgreich anlegen

### Szenario E: Gruppenphase + KO

- gerade Teilnehmerzahl
- ungerade Teilnehmerzahl
- Produktstandard versus Veranstalterregel korrekt erklärt
- erforderliche Bestätigung funktioniert
- keine falsche allgemeine DRA-Konformitätsbehauptung

### Szenario F: Presets

- European-Tour-Preset auswählen
- Werte werden direkt angewendet
- manuellen Wert ändern
- Status wird Custom
- anderes Preset auswählen
- Werte werden konsistent überschrieben

### Szenario G: Accessibility

- nur Tastatur
- Hilfe öffnen
- Thema wechseln
- Escape schließen
- Fokus-Rückgabe
- Formular absenden
- Fehlerfokus

---

## 9. Arbeitsweise für Codex

Für jeden Release:

1. Repository und betroffene Module analysieren.
2. Nur den aktuellen Release-Scope umsetzen.
3. Keine Teile späterer Releases halb sichtbar einbauen.
4. Tests ergänzen.
5. Quality-Gates ausführen.
6. Fehler beheben.
7. Dokumentation für den aktuellen Stand aktualisieren.
8. Ergebnis als vollständig funktionsfähige Version abschließen.
9. Kurzen Abschlussbericht liefern:
   - geänderte Dateien,
   - umgesetzte Funktionen,
   - Tests,
   - bekannte Einschränkungen,
   - manuelle Prüfschritte.

Codex darf den nächsten Release erst beginnen, wenn der aktuelle Release vollständig implementiert, getestet, dokumentiert und ohne bekannte Blocker ist.

---

## 10. Definition of Done für das Gesamtprojekt

Das Projekt ist abgeschlossen, wenn:

- die Turniererstellung klar in vier fachliche Bereiche gegliedert ist,
- Presets direkt und verständlich angewendet werden,
- nur relevante Regeln sichtbar sind,
- Spielregeln kompakt dargestellt werden,
- Hilfe-Symbole klar als Hilfe erkennbar sind,
- das rechte Hilfe-Panel kontextbezogen arbeitet,
- Erklärungen, Beispiele, Tipps, Abhängigkeiten, Konformität und Quellen verfügbar sind,
- keine permanenten Hilfe-Erklärboxen die Oberfläche überladen,
- Regelhilfe nicht unaufgefordert das Thema wechselt,
- Validierung und Übersicht live reagieren,
- alle Modi und Bestandsdaten weiterhin funktionieren,
- Accessibility und Responsive-Verhalten geprüft sind,
- Dokumentation und Regelbezüge aktuell sind,
- alle Tests und `scripts/qa.ps1` erfolgreich durchlaufen.
