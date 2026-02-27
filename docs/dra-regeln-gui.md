# DRA-Regelerklaerungen fuer die GUI

Diese Datei ist die zentrale Regelhilfe fuer die Regel-Icons in der Oberflaeche.
Jeder Abschnitt enthaelt:
1. GUI-Stellen
2. DRA-Referenz (Kapitel/Punkt/Seite)
3. Deutsche Erklaerung
4. Warum das fuer Spieler/Turnierleitung wichtig ist
5. Nachpruefen im PDF

## Symbol-Legende in der GUI
| Symbol | Bedeutung | Typischer Link-Zweck |
|---|---|---|
| ![Info-Symbol](../assets/ss_info.png) | `Info-Icon` = technische Information | Bedienung, Workflow, Projektdoku |
| ![Regel-Symbol](../assets/ss_regeln.png) | `Regel-Icon` = Regelwerk | DRA-Bezug mit Kapitel/Punkt/Seite |

Screenshot-Kontext:

![Einstellungen mit Regel- und Info-Hilfelinks](../assets/ss_Einstellungen.png)

<a id="dra-gui-rule-mode-formats"></a>
## Modus und Format

### GUI-Stellen
- Turnier > Modus
- Turnier > Aktives Turnier > Format

### DRA-Referenz (Kapitel/Punkt/Seite)
- `6.8.1`, Seite `17`
- `6.8.2`, Seite `17`

### Deutsche Erklaerung
- `6.8.1`: Das Grundprinzip ist KO (Straight Knockout).
- `6.8.2`: Round Robin ist ebenfalls zulaessig.
- In der App bedeutet das:
  - `KO`, `Liga` und `Gruppenphase + KO` sind regelkonforme Turniermodelle.
  - Der Modus steuert automatisch Spielplan, Fortschrittslogik und Turnieransicht.

### Warum wichtig
- Spieler sehen frueh, wie sie weiterkommen (KO) oder wie gewertet wird (Liga).
- Turnierleitung kann den Ablauf vor Start klar festlegen und spaeter konsistent halten.

### Nachpruefen im PDF
- [DRA-RULE_BOOK.pdf#page=17](DRA-RULE_BOOK.pdf#page=17)

![Turnieranlage mit Moduswahl](../assets/ss_Turnier_anlage-neu.png)

<a id="dra-gui-rule-open-draw"></a>
## Open Draw

### GUI-Stellen
- Turnier > KO-Erstrunde zufaellig mischen
- Einstellungen > KO-Erstrunde zufaellig mischen (Standard)

### DRA-Referenz (Kapitel/Punkt/Seite)
- `6.12.1`, Seite `18`

### Deutsche Erklaerung
- Der Schalter bestimmt nur, **wie Runde 1 erzeugt wird**:
  - `open_draw`: zufaellige Reihenfolge fuer Runde 1.
  - `seeded`: feste Reihenfolge nach Eingabe.
- Nach Veroeffentlichung des Draws bleibt die Struktur bestehen (`6.12.1`).

### Warum wichtig
- Die Entscheidung zwischen Zufallsdraw und Setzlogik ist vor Start transparent.
- Nach Start gibt es keine "heimliche" Neuverteilung durch Bedienfehler.

### Nachpruefen im PDF
- [DRA-RULE_BOOK.pdf#page=18](DRA-RULE_BOOK.pdf#page=18)

<a id="dra-gui-rule-draw-lock"></a>
## Draw-Lock

### GUI-Stellen
- Einstellungen > KO-Draw sperren (Standard)
- Einstellungen > KO Draw-Lock (aktives Turnier)

### DRA-Referenz (Kapitel/Punkt/Seite)
- `6.12.1`, Seite `18`

### Deutsche Erklaerung
- Draw-Lock ist die technische Absicherung der Regel:
  - Aktiv: KO-Struktur bleibt unveraendert.
  - Inaktiv: Turnierleitung kann bewusst entsperren.

### Warum wichtig
- Verhindert unfaire Nachauslosungen im laufenden Turnier.
- Macht Entscheidungen der Turnierleitung nachvollziehbar und dokumentierbar.

### Nachpruefen im PDF
- [DRA-RULE_BOOK.pdf#page=18](DRA-RULE_BOOK.pdf#page=18)

<a id="dra-gui-rule-participant-limits"></a>
## Teilnehmerlimits

### GUI-Stellen
- Turnier > Modus-Limits
- Einstellungen > Regelbasis und Limits

### DRA-Referenz (Kapitel/Punkt/Seite)
- `6.10.1`, Seite `17`
- `6.10.5.2`, Seite `18`

### Deutsche Erklaerung
- Das DRA-Rulebook setzt kein fixes globales Software-Maximum.
- Es gibt Veranstalter-Ermessen fuer Organisation und Ablauf.
- Die App setzt daher bewusste Leitplanken:
  - `ko`: `2..128`
  - `league`: `2..16`
  - `groups_ko`: `4..16`

### Warum wichtig
- Schuetzt vor Formaten, die lokal organisatorisch kaum sauber zu spielen sind.
- Erhoeht Stabilitaet (Rendering, Browserlast, Bedienbarkeit).

### Nachpruefen im PDF
- [DRA-RULE_BOOK.pdf#page=17](DRA-RULE_BOOK.pdf#page=17)
- [DRA-RULE_BOOK.pdf#page=18](DRA-RULE_BOOK.pdf#page=18)

<a id="dra-gui-rule-bye"></a>
## Freilos (Bye)

### GUI-Stellen
- Turnierbaum > KO-Turnierbaum
- Spiele > Ergebnisfuehrung (Freilos-Markierungen)

### DRA-Referenz (Kapitel/Punkt/Seite)
- Abschnitt `2` (Definition `Bye`), Seite `4`
- `6.12.1`, Seite `18`

### Deutsche Erklaerung
- Ein `Bye` ist ein regulaeres Freilos fuer eine Runde.
- Spieler mit Bye ruecken ohne Match in die naechste Runde vor.
- Byes sind Teil des Draws und werden als `Freilos (Bye)` angezeigt.

### Warum wichtig
- Verhindert Missverstaendnis "Ghost-Spieler" vs. echtes Freilos.
- Sichert faire Bracket-Mathematik bei Teilnehmerzahlen ohne 2er-Potenz.

### Nachpruefen im PDF
- [DRA-RULE_BOOK.pdf#page=4](DRA-RULE_BOOK.pdf#page=4)
- [DRA-RULE_BOOK.pdf#page=18](DRA-RULE_BOOK.pdf#page=18)

![Turnierbaum mit Freilos-Markierung](../assets/ss_Turnierbaum_neu-gestartet.png)

<a id="dra-gui-rule-tie-break"></a>
## Tie-Break

### GUI-Stellen
- Einstellungen > Promoter Tie-Break-Profil
- Turnierbaum > Liga-Tabelle / Gruppentabellen
- Turnierbaum > Gruppenentscheidung offen

### DRA-Referenz (Kapitel/Punkt/Seite)
- `6.16.1`, Seite `20`

### Deutsche Erklaerung
- DRA erlaubt Tie-Breaks nach Ermessen des Veranstalters.
- Die App bildet dieses Ermessen als waehlbares Profil ab:
  - `Promoter H2H + Mini-Tabelle` (empfohlen)
  - `Promoter Punkte + LegDiff`
- Falls ein Gleichstand damit nicht aufloesbar ist:
  - Status `Playoff erforderlich`
  - KO-Qualifikation bleibt bis zur Entscheidung blockiert

### Warum wichtig
- Keine stillen, zufaelligen oder intransparenten Tabellenentscheidungen.
- Spieler und Turnierleitung sehen eindeutig, wann eine manuelle Entscheidung noetig ist.

### Nachpruefen im PDF
- [DRA-RULE_BOOK.pdf#page=20](DRA-RULE_BOOK.pdf#page=20)

<a id="dra-gui-rule-checklist"></a>
## DRA-Checkliste (manuelle Entscheidungen)

### GUI-Stellen
- Einstellungen > DRA Checkliste (nicht automatisierbar)

### DRA-Referenz (Kapitel/Punkt/Seite)
- `5.14`, Seite `15`
- `11.3`, Seite `26`
- `11.4`, Seite `26`
- `12.1`, Seite `27`
- `12.2`, Seite `27`

### Deutsche Erklaerung
- Einige Punkte sind absichtlich nicht automatisiert:
  - Start-/Wurfreihenfolge, Bull-Off-Entscheidungen
  - Disziplinarische und organisatorische Entscheidungen
  - Strittige Sonderfaelle
- Die Software dokumentiert und unterstuetzt, ersetzt aber keine offizielle Turnierentscheidung.

### Warum wichtig
- Klare Trennung zwischen Software-Automation und offizieller Turnierhoheit.
- Verhindert falsche Erwartung, dass jeder Regelfall algorithmisch "automatisch richtig" entschieden wird.

### Nachpruefen im PDF
- [DRA-RULE_BOOK.pdf#page=15](DRA-RULE_BOOK.pdf#page=15)
- [DRA-RULE_BOOK.pdf#page=26](DRA-RULE_BOOK.pdf#page=26)
- [DRA-RULE_BOOK.pdf#page=27](DRA-RULE_BOOK.pdf#page=27)
