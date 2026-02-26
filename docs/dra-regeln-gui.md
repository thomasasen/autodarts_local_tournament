# DRA-Regelerklärungen für die GUI

Diese Datei ist die zentrale Regelhilfe für die `§`-Buttons in der Oberfläche.
Jeder Abschnitt enthält:
1. GUI-Stellen
2. DRA-Referenz (Kapitel/Punkt/Seite)
3. Deutsche Erklärung
4. Nachprüfen im PDF

<a id="dra-gui-rule-mode-formats"></a>
## Modus und Format

### GUI-Stellen
- Turnier > Modus
- Turnier > Aktives Turnier > Format

### DRA-Referenz (Kapitel/Punkt/Seite)
- `6.8.1`, Seite `17`
- `6.8.2`, Seite `17`

### Deutsche Erklärung
- `6.8.1`: Das Grundprinzip ist das KO-Format.
- `6.8.2`: Round Robin ist ebenfalls zulässig.
- Einfach erklärt:
  - **KO (Knockout)**: Wer ein Match verliert, scheidet aus. Der Gewinner geht in die nächste Runde.
  - **Round Robin (Liga)**: Jeder spielt gegen jeden. Danach wird über die Tabelle entschieden.
- Für die GUI bedeutet das:
  - `KO`, `Liga` und `Gruppenphase + KO` sind regelkonforme Modi.
  - Der gewählte Modus steuert die komplette Turnierlogik (Spielplan, Tabelle, KO-Pfade).
- Beispiel:
  - KO mit 8 Spielern: Viertelfinale -> Halbfinale -> Finale.
  - Liga mit 4 Spielern: Jeder spielt gegen jeden, am Ende entscheidet die Tabelle.

### Nachprüfen im PDF
- [DRA-RULE_BOOK.pdf#page=17](DRA-RULE_BOOK.pdf#page=17)

<a id="dra-gui-rule-open-draw"></a>
## Open Draw

### GUI-Stellen
- Turnier > KO-Erstrunde zufällig mischen
- Einstellungen > KO-Erstrunde zufällig mischen (Standard)

### DRA-Referenz (Kapitel/Punkt/Seite)
- `6.12.1`, Seite `18`

### Deutsche Erklärung
- `6.12.1`: Ein veröffentlichter Draw bleibt bestehen.
- Einfach erklärt:
  - Der Schalter `KO-Erstrunde zufällig mischen` legt fest, **wie der erste Draw erzeugt wird**.
  - Danach darf die ausgeloste Struktur nicht beliebig neu gemischt werden.
- Für die GUI bedeutet das:
  - `open_draw`: zufällige Reihenfolge für Runde 1.
  - `seeded`: feste Reihenfolge nach Eingabe.
  - Beide Wege sind vor dem Start möglich, aber der veröffentlichte Draw bleibt danach stabil.
- Beispiel:
  - Du startest mit `open_draw` und erzeugst den KO-Baum.
  - Nach Veröffentlichung bleibt diese Paarung bestehen, auch wenn später Spieler ausfallen.

### Nachprüfen im PDF
- [DRA-RULE_BOOK.pdf#page=18](DRA-RULE_BOOK.pdf#page=18)

<a id="dra-gui-rule-draw-lock"></a>
## Draw-Lock

### GUI-Stellen
- Einstellungen > KO-Draw sperren (Standard)
- Einstellungen > KO Draw-Lock (aktives Turnier)

### DRA-Referenz (Kapitel/Punkt/Seite)
- `6.12.1`, Seite `18`

### Deutsche Erklärung
- `6.12.1`: Der veröffentlichte Draw soll unverändert bleiben.
- Einfach erklärt:
  - `Draw-Lock` ist die technische Sicherung genau dieser Regel.
  - Aktiv = keine automatische Neuverteilung der KO-Struktur.
- Für die GUI bedeutet das:
  - Standardmäßig ist `Draw-Lock` aktiv, damit die Turnierstruktur stabil bleibt.
  - Nur bei bewusster Veranstalterentscheidung sollte entsperrt werden.
- Beispiel:
  - Turnier ist gestartet, ein Spieler tritt nicht an.
  - Mit aktivem Draw-Lock wird nicht neu gelost, sondern der bestehende Baum bleibt erhalten.

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

### Deutsche Erklärung
- `6.10.1` und `6.10.5.2` geben dem Veranstalter organisatorischen Ermessensspielraum.
- Einfach erklärt:
  - Das DRA-Rulebook setzt kein fixes, allgemeines Teilnehmermaximum für jede Software.
  - Der Veranstalter entscheidet über Ablauf, Boards, Sessions und praktikable Turniergröße.
- Für die GUI bedeutet das:
  - Die angezeigten Limits (`ko`, `league`, `groups_ko`) sind bewusst gewählte Leitplanken für faire Dauer und stabile Bedienung.
  - Diese Grenzen sind organisatorisch/technisch motiviert und mit dem Veranstalter-Ermessen vereinbar.
- Beispiel:
  - Ein lokales Liga-Turnier mit sehr vielen Spielern wird organisatorisch schnell unübersichtlich.
  - Deshalb begrenzt die Software die Liga-Größe, obwohl die DRA-Regel hier kein starres Global-Limit vorgibt.

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

### Deutsche Erklärung
- Abschnitt `2`: Ein `Bye` ist ein Freilos für eine Runde.
- Einfach erklärt:
  - Ein Spieler mit Bye muss in dieser Runde nicht spielen und rückt regulär weiter.
  - Das ist kein Sondertrick, sondern ein normaler Bestandteil des Draws.
- Für die GUI bedeutet das:
  - Byes werden sichtbar als `Freilos (Bye)` angezeigt.
  - Byes sind Teil des veröffentlichten KO-Baums und bleiben damit stabil (`6.12.1`).
- Beispiel:
  - Es sind weniger Teilnehmer als Bracket-Plätze vorhanden.
  - Dann entstehen Freilose, damit der Baum mathematisch sauber funktioniert.

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

### Deutsche Erklärung
- `6.16.1`: Tie-Breaks dürfen nach Ermessen des Veranstalters eingesetzt werden.
- Einfach erklärt:
  - Wenn Spieler nach den normalen Wertungen gleich stehen, braucht es eine definierte Entscheidungskette.
  - Welche Kette verwendet wird, entscheidet der Veranstalter.
- Für die GUI bedeutet das:
  - Das `Promoter Tie-Break-Profil` bildet genau diese Veranstalterentscheidung ab.
  - Wenn danach immer noch Gleichstand besteht, zeigt die GUI korrekt `Playoff erforderlich`.
- Beispiel:
  - Nach Abschluss aller Gruppenspiele haben zwei Spieler dieselben Kernwerte.
  - Dann greift das gewählte Tie-Break-Profil Schritt für Schritt; bei weiterhin gleichem Stand wird ein Playoff nötig.

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

### Deutsche Erklärung
- Diese Punkte betreffen Entscheidungen, die vor Ort oder disziplinarisch getroffen werden.
- Einfach erklärt:
  - Software kann Ergebnisse und Status abbilden.
  - Offizielle Beschwerden, Reviews und Disziplinarmaßnahmen müssen trotzdem vom zuständigen Offiziellen/Veranstalter entschieden werden.
- Für die GUI bedeutet das:
  - Die Checkliste erinnert an diese Pflichtpunkte.
  - Das Tool unterstützt den Ablauf, ersetzt aber keine offiziellen Entscheidungen.
- Hinweis zu `5.14`:
  - Die Referenz ist auf Seite 15 hinterlegt.
  - In der Projektkopie ist dieser Punkt nicht als klarer Hauptabschnitt hervorgehoben, daher bitte direkt im PDF gegenprüfen.
- Beispiel:
  - Bei einem strittigen Vorfall im Match darf die Software den Fall dokumentieren.
  - Die verbindliche Entscheidung trifft die zuständige Turnierleitung nach Regelwerk.

### Nachprüfen im PDF
- [DRA-RULE_BOOK.pdf#page=15](DRA-RULE_BOOK.pdf#page=15)
- [DRA-RULE_BOOK.pdf#page=26](DRA-RULE_BOOK.pdf#page=26)
- [DRA-RULE_BOOK.pdf#page=27](DRA-RULE_BOOK.pdf#page=27)

