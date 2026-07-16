# Dart- und Turnierbegriffe

Kurze Erklärungen für die Begriffe, die in der Oberfläche verwendet werden.

## Spielbegriffe

| Begriff | Bedeutung | Beispiel |
|---|---|---|
| X01 | Spielform mit einem Startwert, der auf genau null heruntergespielt wird | 501, 301 oder 701 |
| Leg | ein einzelnes abgeschlossenes Spiel innerhalb eines Matches | Anna gewinnt ein Leg und führt 1:0 |
| Match | vollständige Begegnung zwischen zwei Personen | Best of 5 Legs |
| Best of N | höchstens N Legs; die Mehrheit gewinnt | Best of 5 entspricht First to 3 |
| First to N | wer zuerst N Legs erreicht, gewinnt | First to 3 erlaubt 3:0, 3:1 oder 3:2 |
| Straight In | Punkte zählen ab dem ersten Treffer | Standard bei vielen 501-Formaten |
| Double In | das Herunterspielen beginnt erst mit einem Doppelfeld | fortgeschrittene Variante |
| Master In | Einstieg mit Doppel oder Triple | besondere Veranstalterregel |
| Straight Out | jeder passende Treffer kann das Leg beenden | bei 32 reicht zum Beispiel Single 16 + Single 16 |
| Double Out | der letzte Treffer muss ein Doppelfeld sein | 32 kann mit Doppel 16 beendet werden |
| Master Out | letzter Treffer muss Doppel oder Triple sein | besondere Veranstalterregel |
| Bull | Bullseye in der Boardmitte | Modus 25/50 oder 50/50 |
| Bull-off | Ausspielen einer Start- oder Wurfreihenfolge über das Bull | technische AutoDarts-Einstellung; konkrete Turnierregel beachten |
| Max Runden | technisches AutoDarts-Limit für Aufnahmen/Runden | keine PDC-Matchdistanz |

## Turnierbegriffe

| Begriff | Bedeutung |
|---|---|
| KO / Straight Knockout | Nach einer Niederlage scheidet eine Person aus. |
| Doppel-KO / Double Elimination | Erst nach der zweiten Niederlage scheidet eine Person aus. |
| Liga / Round Robin | Alle Personen einer Liga oder Gruppe spielen gegeneinander. |
| Gruppenphase | Round-Robin-Spiele in getrennten Gruppen vor einer Finalphase. |
| Vorrunde | Planbare erste Phase, die eine Rangliste für die Finalphase erzeugt. |
| Finalphase | KO- oder Doppel-KO-Phase der Qualifizierten. |
| Auslosung / Draw | Zuordnung der Teilnehmer zu den ersten Paarungen. |
| Open Draw | Zufällige Auslosung ohne feste Setzreihenfolge. |
| gesetzter Draw | Die Reihenfolge der Teilnehmerliste bestimmt die Setzplätze. |
| Draw-Lock | Sperre, die den erzeugten Turnierbaum vor einer späteren Neuauslosung schützt. |
| Seed | Setzplatz einer Person im Turnierbaum. |
| Freilos / Bye | Eine Person kommt ohne gespieltes Match in die nächste Runde. |
| Tie-Break | Vorab festgelegte Kriterien zur Auflösung eines Tabellengleichstands. |
| Direktvergleich | Ergebnis des Spiels zwischen den punktgleichen Personen. |
| Minitabelle | Neuberechnung nur mit den Spielen einer punktgleichen Teilgruppe. |
| Leg-Differenz | Gewonnene minus verlorene Legs. |
| Grand Final | Entscheidendes Finale eines Doppel-KO-Turniers. |
| Reset Final | Zusätzliches Finale, wenn die aus dem Losers Bracket kommende Person das erste Grand Final gewinnt und die Turnierregel einen Reset vorsieht. |

## Software- und Statusbegriffe

| Begriff | Bedeutung |
|---|---|
| manuelle Ergebnisführung | Die Turnierleitung trägt gewonnene Legs selbst ein. Benötigt kein API-Setup. |
| AutoDarts-Automatik | Optionaler Lobbystart und Ergebnissync über die AutoDarts-API. |
| Auth-Token | Technischer Anmeldenachweis der aktuellen AutoDarts-Sitzung. Er wird nicht in Debugexporte geschrieben. |
| erkanntes Board | AutoDarts-Board-ID, die für den automatischen Lobbystart verwendet werden kann. |
| Boardanzahl für Zeitplanung | Reiner Kapazitätswert der Prognose; keine Boardzuweisung. |
| Preset / Formatvorlage | Zusammengehörige Voreinstellung für Modus, Matchdistanz und X01-Regeln. |
| Produktprofil | Vom Assistant empfohlenes lokales Profil ohne Behauptung eines offiziellen Eventformats. |
| assisted | Die Anwendung erklärt oder sichert einen Ablauf ab; die Entscheidung bleibt bei der Turnierleitung. |
| enforced | Die Anwendung erzwingt die beschriebene Regel technisch. |

Siehe auch: [Einsteigerleitfaden](einstieg.md), [Veranstalter-Handbuch](veranstalter-handbuch.md), [DRA-Regeln in der GUI](dra-regeln-gui.md).

