# DRA-Regelerklärungen für die GUI

Diese Datei ist die zentrale Regelhilfe für die `§`-Buttons in der Oberfläche.
Jeder Abschnitt enthält:
1. GUI-Stellen
2. DRA-Referenz (Kapitel/Punkt/Seite)
3. Deutsche Erklärung (didaktisch, präzise)
4. Nachprüfen im PDF

<a id="dra-gui-rule-mode-formats"></a>
## Modus und Format

### GUI-Stellen
- Turnier > Modus
- Turnier > Aktives Turnier > Format

### DRA-Referenz (Kapitel/Punkt/Seite)
- `6.8.1`, Seite `17`
- `6.8.2`, Seite `17`

### Deutsche Erklärung (didaktisch, präzise)
- `6.8.1`: Das Grundprinzip von Darts-Turnieren ist das KO-Format.
- `6.8.2`: Round Robin ist ebenfalls zulässig, wenn der Veranstalter dieses Format festlegt.
- Für die GUI heißt das: `KO`, `Liga` (Round Robin) und `Gruppenphase + KO` sind regelkonforme Formatvarianten; der Modus entscheidet die gesamte Turnierlogik.

### Nachprüfen im PDF
- [DRA-RULE_BOOK.pdf#page=17](DRA-RULE_BOOK.pdf#page=17)

<a id="dra-gui-rule-open-draw"></a>
## Open Draw

### GUI-Stellen
- Turnier > KO-Erstrunde zufällig mischen
- Einstellungen > KO-Erstrunde zufällig mischen (Standard)

### DRA-Referenz (Kapitel/Punkt/Seite)
- `6.12.1`, Seite `18`

### Deutsche Erklärung (didaktisch, präzise)
- `6.12.1`: Sobald der Draw feststeht und veröffentlicht ist, bleibt er bestehen.
- Für die GUI heißt das: Der Schalter bestimmt nur, wie der initiale KO-Draw erzeugt wird (`open_draw` vs. `seeded`). Danach soll die Paarungsstruktur stabil bleiben.

### Nachprüfen im PDF
- [DRA-RULE_BOOK.pdf#page=18](DRA-RULE_BOOK.pdf#page=18)

<a id="dra-gui-rule-draw-lock"></a>
## Draw-Lock

### GUI-Stellen
- Einstellungen > KO-Draw sperren (Standard)
- Einstellungen > KO Draw-Lock (aktives Turnier)

### DRA-Referenz (Kapitel/Punkt/Seite)
- `6.12.1`, Seite `18`

### Deutsche Erklärung (didaktisch, präzise)
- `6.12.1`: Ein veröffentlichter Draw darf nicht nachträglich umgestellt werden.
- Für die GUI ist `Draw-Lock` die direkte technische Umsetzung dieser Vorgabe: Aktiv bedeutet, dass die einmal erzeugte KO-Struktur unverändert bleibt.

### Nachprüfen im PDF
- [DRA-RULE_BOOK.pdf#page=18](DRA-RULE_BOOK.pdf#page=18)

<a id="dra-gui-rule-participant-limits"></a>
## Teilnehmerlimits

### GUI-Stellen
- Turnier > Modus-Limits
- Einstellungen > Regelbasis und Limits

### DRA-Referenz (Kapitel/Punkt/Seite)
- `6.10.1`, Seite `17`
- `6.10.5.2`, Seite `18`

### Deutsche Erklärung (didaktisch, präzise)
- `6.10.1`: Der Veranstalter legt grundsätzlich fest, wie die Spieler auf Boards und Sessions verteilt werden.
- `6.10.5.2`: Die Detailausführung liegt im Ermessen des Veranstalters.
- Für die GUI heißt das: Es gibt kein starres globales DRA-Teilnehmermaximum. Die Software-Limits (`ko`, `league`, `groups_ko`) sind organisatorische/technische Leitplanken für faire Dauer und stabile Bedienung.

### Nachprüfen im PDF
- [DRA-RULE_BOOK.pdf#page=17](DRA-RULE_BOOK.pdf#page=17)
- [DRA-RULE_BOOK.pdf#page=18](DRA-RULE_BOOK.pdf#page=18)

<a id="dra-gui-rule-bye"></a>
## Freilos (Bye)

### GUI-Stellen
- Turnierbaum > KO-Turnierbaum

### DRA-Referenz (Kapitel/Punkt/Seite)
- Abschnitt `2` (Definition `Bye`), Seite `4`
- `6.12.1`, Seite `18`

### Deutsche Erklärung (didaktisch, präzise)
- Abschnitt `2`: Ein `Bye` ist ein Freilos für eine Runde.
- Für die GUI heißt das: Freilose werden sichtbar als `Freilos (Bye)` geführt und im KO-Baum korrekt weitergegeben.
- Mit `6.12.1` zusammen bedeutet das außerdem: Diese Freilos-Struktur ist Teil des veröffentlichten Draws und bleibt stabil.

### Nachprüfen im PDF
- [DRA-RULE_BOOK.pdf#page=4](DRA-RULE_BOOK.pdf#page=4)
- [DRA-RULE_BOOK.pdf#page=18](DRA-RULE_BOOK.pdf#page=18)

<a id="dra-gui-rule-tie-break"></a>
## Tie-Break

### GUI-Stellen
- Einstellungen > Promoter Tie-Break-Profil
- Spiele > Ergebnisführung
- Turnierbaum > Liga-Tabelle
- Turnierbaum > Gruppentabellen
- Turnierbaum > Gruppenentscheidung offen

### DRA-Referenz (Kapitel/Punkt/Seite)
- `6.16.1`, Seite `20`

### Deutsche Erklärung (didaktisch, präzise)
- `6.16.1`: Tie-Break-Regeln dürfen im Ermessen des Veranstalters eingesetzt werden.
- Für die GUI heißt das: Das Tie-Break-Profil ist eine bewusste Veranstalterentscheidung. Die Software macht den gewählten Ablauf transparent und meldet bei verbleibendem Gleichstand konsequent `Playoff erforderlich`.

### Nachprüfen im PDF
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

### Deutsche Erklärung (didaktisch, präzise)
- Die Checkliste deckt Regeln ab, die organisatorisch vor Ort entschieden oder disziplinarisch bewertet werden und daher nicht vollständig automatisiert werden können.
- `11.3` und `11.4` beschreiben den Ablauf bei Beschwerden sowie die Rolle von Chair/Board und möglichen Review-Verfahren.
- `12.1` und `12.2` regeln, dass Verstöße disziplinarisch sanktioniert werden können und die DRA in eigener Zuständigkeit Verfahren einleitet.
- Für die GUI heißt das: Das Tool unterstützt mit Status und Transparenz, ersetzt aber keine offiziellen Vor-Ort- oder Disziplinarentscheidungen.
- Hinweis zur Nachprüfung: Der Punkt `5.14` ist in der Projektkopie des Rulebooks nicht als klarer Hauptregel-Abschnitt sichtbar markiert; die Seitenreferenz bleibt zur manuellen Verifikation erhalten.

### Nachprüfen im PDF
- [DRA-RULE_BOOK.pdf#page=15](DRA-RULE_BOOK.pdf#page=15)
- [DRA-RULE_BOOK.pdf#page=26](DRA-RULE_BOOK.pdf#page=26)
- [DRA-RULE_BOOK.pdf#page=27](DRA-RULE_BOOK.pdf#page=27)

