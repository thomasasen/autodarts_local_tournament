# Statusmeldungen und Fehlerhilfe

Kurze Statusmeldungen in der Oberfläche sind anklickbar und führen direkt zum passenden Eintrag. Die manuelle Ergebnisführung funktioniert unabhängig von Auth-Token und erkanntem AutoDarts-Board.

## Zuerst unterscheiden: manuell oder automatisch?

<a id="statusmeldung-automatik-aus-manuelle-ergebnisfuehrung-aktiv"></a>
### `Automatik aus · manuelle Ergebnisführung aktiv`

Das ist ein neutraler Normalzustand. Trage im Tab `Spiele` die gewonnenen Legs ein und wähle `Ergebnis speichern`. API- und Boardstatus werden erst relevant, wenn die AutoDarts-Automatik in den Einstellungen aktiviert ist.

![Neutrale Statusleiste bei ausgeschalteter Automatik](../assets/gui-status-manuell.png)

_Neutraler Zustand: Es liegt kein Fehler vor; die manuelle Ergebnisführung ist einsatzbereit._

<a id="statusmeldung-auto-lobby-off"></a>
### `Auto-Lobby OFF` / `Auto-Lobby ist deaktiviert`

Die ältere oder ausführlichere Form derselben Information. Manuelle Ergebnisse bleiben möglich. Nur für Lobbystart und Ergebnissync die Automatik aktivieren.

## Runtime-Status bei aktiver Automatik

![Statusleiste mit fehlender API-Anmeldung, fehlendem Board und eingeschalteter Auto-Lobby](../assets/gui-status-automatik.png)

_Bei aktiver Automatik zeigen die einzelnen Statusfelder konkret, welche technische Voraussetzung noch fehlt. Im Beispiel fehlen Authentifizierung und Board._

<a id="statusmeldung-api-auth-fehlt"></a>
### `API Auth fehlt`

Die aktuelle Seite liefert keinen nutzbaren AutoDarts-Anmeldenachweis. Neu einloggen, `play.autodarts.com` vollständig neu laden und prüfen, ob Tampermonkey auf derselben Seite aktiv ist.

<a id="statusmeldung-api-auth-abgelaufen"></a>
### `API Auth abgelaufen`

AutoDarts weist die vorhandenen Anmeldedaten mit `401/403` zurück. Neu einloggen und die Seite neu laden.

<a id="statusmeldung-api-auth-bereit"></a>
### `API Auth bereit`

Der Anmeldenachweis ist vorhanden und nicht blockiert. Keine Aktion nötig.

<a id="statusmeldung-board-aktiv"></a>
### `Board aktiv (<id>)`

Eine plausible AutoDarts-Board-ID wurde erkannt. Dieses Board kann für den automatischen Lobbystart verwendet werden.

<a id="statusmeldung-board-id-ungueltig"></a>
### `Board-ID ungültig (<wert>)`

Ein gespeicherter Wert sieht nicht wie eine echte Board-ID aus. In AutoDarts einmal manuell eine Lobby öffnen, das richtige Board auswählen und neu laden.

<a id="statusmeldung-kein-aktives-board"></a>
### `Kein aktives Board`

Für den automatischen Lobbystart fehlt die Board-ID. Manuell eine AutoDarts-Lobby öffnen und ein Board auswählen. Für manuelle Ergebnisführung ist das nicht erforderlich.

<a id="statusmeldung-auto-lobby-on"></a>
### `Auto-Lobby ON`

Automatischer Lobbystart und API-Sync sind aktiv.

<a id="statusmeldung-runtime-hinweis-api-voraussetzungen"></a>
### `Hinweis: Für API-Halbautomatik werden Auth-Token und aktives Board benötigt.`

Mindestens eine der beiden Voraussetzungen fehlt. Die beiden Status-Pills daneben zeigen, welche.

## Matchkarten und Ergebnissync

<a id="statusmeldung-freilos-bye-kein-api-sync-erforderlich"></a>
### `Freilos (Bye): kein API-Sync erforderlich`

Das Freilos wird automatisch weitergeführt. Keine Lobby und kein Ergebnis nötig.

<a id="statusmeldung-api-sync-abgeschlossen"></a>
### `API-Sync: abgeschlossen`

Das Match wurde mit synchronisierten oder importierten Daten abgeschlossen.

<a id="statusmeldung-api-sync-aktiv"></a>
### `API-Sync: aktiv (Lobby <id>)`

Das Match ist mit einer laufenden Lobby verknüpft. Normal zu Ende spielen; das Tool prüft das Ergebnis weiter.

<a id="statusmeldung-api-sync-fehler"></a>
### `API-Sync: Fehler` / `Matchstart fehlgeschlagen`

Ein API-Schritt ist fehlgeschlagen. Zuerst Auth- und Boardstatus prüfen, dann Detailtext lesen. Bei unklarer Zuordnung nichts erzwingen, sondern das Ergebnis manuell speichern. Für technische Analyse kann das Fehlerprotokoll unter `Einstellungen > Erweitert` aktiviert werden.

<a id="statusmeldung-api-sync-nicht-gestartet"></a>
### `API-Sync: nicht gestartet`

Noch keine Lobby verknüpft. Entweder `Match starten` verwenden oder manuell erfassen.

<a id="statusmeldung-match-nicht-verfuegbar"></a>
### `Match nicht verfügbar`

Das Match fehlt im aktuellen Zustand oder ist nicht bearbeitbar. Seite neu laden und Turnierstand prüfen.

<a id="statusmeldung-match-bereits-abgeschlossen"></a>
### `Match ist bereits abgeschlossen`

Ein Ergebnis ist bereits gespeichert. Im Turnierbaum oder in der Matchkarte kontrollieren.

<a id="statusmeldung-paarung-steht-noch-nicht-fest"></a>
### `Paarung steht noch nicht fest`

Mindestens ein Teilnehmer ergibt sich erst aus einem vorherigen Match. Zuerst die vorgelagerten Paarungen abschließen.

<a id="statusmeldung-vorgaenger-match-muss-zuerst-abgeschlossen-werden"></a>
### `Vorgänger-Match ... muss zuerst abgeschlossen werden`

Die genannte Paarung blockiert den nächsten Knoten fachlich. Das Vorgänger-Match zuerst speichern.

<a id="statusmeldung-api-ergebnis-noch-nicht-final-verfuegbar"></a>
### `API-Ergebnis ist noch nicht final verfügbar`

Die Lobby existiert, liefert aber noch kein belastbares Endergebnis. Während eines laufenden Matches ist das normal; kurz warten.

<a id="statusmeldung-keine-lobby-id-erkannt"></a>
### `Keine Lobby-ID erkannt`

Für diese Aktion ist keine Lobby verknüpft. Match zuerst starten oder die passende History-Seite öffnen.

<a id="statusmeldung-mehrdeutige-zuordnung-lobby"></a>
### `Mehrdeutige Zuordnung: mehrere offene Turnier-Matches passen zur Lobby`

Mehr als eine Paarung wäre plausibel. Die Automatik stoppt absichtlich. Das korrekte Match manuell speichern.

<a id="statusmeldung-kein-offenes-turnier-match-fuer-diese-lobby-gefunden"></a>
### `Kein offenes Turnier-Match für diese Lobby gefunden`

Prüfen, ob das Ergebnis bereits gespeichert wurde, die Namen abweichen oder die Lobby zu einem anderen Turnier gehört.

<a id="statusmeldung-ergebnis-bereits-im-turnier-gespeichert"></a>
### `Ergebnis bereits im Turnier gespeichert`

Die Übernahme war schon erfolgreich. Keine erneute Aktion nötig.

<a id="statusmeldung-ergebnis-importiert"></a>
### `Ergebnis übernommen`

Das Ergebnis wurde erfolgreich ins lokale Turnier geschrieben.

## Geführte Zwei-Leg-Vorrunde

### `Fixed Legs: Leg 1 läuft`

Die Matchmodus-Off-Lobby ist eindeutig verknüpft. Leg 1 normal spielen; der Assistant wechselt nicht automatisch weiter.

### `Fixed Legs: Bestätigung für Leg 2 erforderlich`

Leg 1 ist abgeschlossen. Stand prüfen und auf der Matchseite `Leg 1 übernehmen & Leg 2 starten` wählen.

### `Fixed Legs: Leg 2 läuft`

Leg 1 wurde gespeichert und Leg 2 gestartet. Nach dem zweiten Checkout auf die Abschlussaktion warten.

### `Fixed Legs: Bestätigung zum Abschluss erforderlich`

Genau zwei Legs sind abgeschlossen. `Match abschließen & Ergebnis übernehmen` prüft `2:0`, `1:1` oder `0:2`, beendet das AutoDarts-Match und aktualisiert die Tabelle.

### `Fixed Legs: Prüfung erforderlich`

Der API-Zustand ist nicht sicher automatisch übernehmbar. Die konkrete Ursache steht im Detailtext:

| Reason Code | Bedeutung | Handlung |
|---|---|---|
| `fixed_legs_player_mapping_ambiguous` | Namen oder IDs ordnen die zwei Personen nicht eindeutig zu. | Namen und Lobby prüfen; anschließend kontrolliert manuell erfassen. |
| `fixed_legs_state_invalid` | Der gelesene Matchzustand enthält keinen plausiblen Zwei-Spieler-/Legstand. | Seite neu laden, Auth prüfen und Matchzustand in AutoDarts kontrollieren. |
| `fixed_legs_state_conflict` | Gespeicherter Stand und API-Stand laufen auseinander; eventuell wurde Leg 3 begonnen. | Bei begonnenem Leg 3 nur die angebotene bestätigte Wiederherstellung nutzen, sonst manuell prüfen. |
| `fixed_legs_overrun` | Mehr als zwei Legs sind abgeschlossen. | Nichts wird gekürzt. AutoDarts-Ergebnis prüfen und Vorrundenmatch manuell korrigieren. |
| `fixed_legs_next_failed` | `games/next` konnte Leg 2 nicht sicher starten. | Prüfen, ob Leg 2 nativ bereits läuft; dann neu laden. Andernfalls manuell fortfahren. |
| `fixed_legs_finish_failed` | `finish` konnte das Match nicht sicher beenden. | AutoDarts-Match prüfen, gegebenenfalls nativ beenden und neu laden. |
| `fixed_legs_result_not_ready` | Es sind noch nicht exakt zwei abgeschlossene Legs verfügbar. | Match weiterspielen oder kurz warten; keinen Endstand erzwingen. |

Bei manueller Speicherung mit verknüpfter Lobby bestätigt die Turnierleitung ausdrücklich, dass das AutoDarts-Match beendet wurde. Die Verknüpfung bleibt zur Nachvollziehbarkeit erhalten.

## History-Seite und Statistikimport

<a id="statusmeldung-kein-eindeutiger-statistik-host"></a>
### `Kein eindeutiger Statistik-Host ... gefunden`

Auf der geöffneten History-Seite wurde kein passender Statistikbereich erkannt. Vollständig laden und URL/Lobby prüfen.

<a id="statusmeldung-statistik-host-konnte-nicht-zugeordnet-werden"></a>
### `Statistik-Host konnte nicht auf einen Kartenbereich zugeordnet werden`

Ein Teil des History-Layouts wurde erkannt, aber nicht sicher eingeordnet. Neu laden; bei dauerhaft geändertem Layout kann ein Skriptupdate nötig sein.

<a id="statusmeldung-mehrdeutiger-statistik-host"></a>
### `Mehrdeutiger Statistik-Host` / `Statistik-Bereich ist nicht eindeutig`

Mehrere Bereiche sind plausibel. Der Import bleibt aus Sicherheitsgründen gesperrt; Ergebnis manuell speichern.

<a id="statusmeldung-keine-eindeutige-statistik-tabelle"></a>
### `Keine eindeutige Statistik-Tabelle gefunden`

Warten, bis die Statistik vollständig sichtbar ist, und neu laden.

<a id="statusmeldung-mehrere-statistik-tabellen"></a>
### `Mehrere Statistik-Tabellen gefunden`

Die Auswertung wäre nicht eindeutig. Nichts erzwingen; manuell speichern oder ein Update prüfen.

<a id="statusmeldung-leg-abweichung-bestaetigung-erforderlich"></a>
### `Leg-Abweichung erkannt` / `Explizite Bestätigung erforderlich`

Statistik und Turnierdistanz passen nicht exakt. Die Anwendung ändert nichts still. Nur bestätigen, wenn die Abweichung fachlich nachvollzogen wurde.

<a id="statusmeldung-bestaetigung-abgelaufen"></a>
### `Bestätigung ist abgelaufen`

Der Importstand ist zu alt. Import erneut starten und die aktuellen Daten prüfen.

<a id="statusmeldung-bestaetigung-ungueltig"></a>
### `Bestätigung ist ungültig`

Die Statistik hat sich geändert oder die Bestätigung gehört nicht zu diesem Stand. Neu starten.

<a id="statusmeldung-statistik-api-fallback"></a>
### `Statistik konnte nicht vollständig gelesen werden. Beim Klick wird API-Fallback genutzt.`

Die sichtbare Tabelle reicht nicht aus; die Aktion versucht stattdessen den API-Weg. Falls auch dieser unklar bleibt, manuell speichern.

<a id="statusmeldung-import-bereit-sieger-laut-statistik"></a>
### `Import bereit. Sieger laut Statistik: <Name>`

Die Daten sind plausibel. Vor dem Auslösen Name und Turnierkontext prüfen.

<a id="statusmeldung-match-verknuepft-ergebnis-kann-jetzt-gespeichert-werden"></a>
### `Match verknüpft. Ergebnis kann jetzt gespeichert werden.`

Lobby und offenes Turniermatch wurden eindeutig verbunden. Die Ergebnisübernahme kann fortgesetzt werden.

<a id="statusmeldung-kein-direkt-verknuepftes-match-gefunden"></a>
### `Kein direkt verknüpftes Match gefunden`

Die Zuordnung versucht ersatzweise Statistik und Teilnehmernamen. Nur bei eindeutigem Kontext fortsetzen.

<a id="statusmeldung-kein-offenes-turnier-match-aus-lobby-id-oder-statistik-spielern-gefunden"></a>
### `Kein offenes Turnier-Match aus Lobby-ID oder Statistik-Spielern gefunden`

Prüfen, ob das Match schon beendet ist und ob Teilnehmernamen mit dem Turnier übereinstimmen.

<a id="statusmeldung-mehrdeutige-zuordnung-statistik-spieler"></a>
### `Mehrdeutige Zuordnung: mehrere offene Turnier-Matches passen zu diesen Spielern`

Die Namen identifizieren kein einzelnes Match. Das korrekte Ergebnis manuell erfassen.

<a id="statusmeldung-sieger-konnte-aus-der-statistik-nicht-eindeutig-bestimmt-werden"></a>
### `Sieger konnte aus der Statistik nicht eindeutig bestimmt werden`

Die Tabelle liefert keinen belastbaren Sieger. Statistik prüfen und manuell speichern.

<a id="statusmeldung-ergebnis-konnte-nicht-aus-der-statistik-gespeichert-werden"></a>
### `Ergebnis konnte nicht aus der Statistik gespeichert werden`

Zuordnung oder Ergebnisvalidierung ist fehlgeschlagen. Detailmeldung prüfen; manuelle Eingabe verwenden.

## Wenn die Hilfe nicht reicht

1. Eine Sicherungsdatei im Tab `Sichern` herunterladen.
2. Bei API-Problemen `Einstellungen > Erweitert > Detailliertes Fehlerprotokoll` aktivieren.
3. Fehler einmal reproduzieren und das Protokoll kopieren.
4. Vor dem Weitergeben Namen, Board- und Lobby-IDs prüfen; Auth-Tokens werden nicht exportiert.

Siehe auch: [Einsteigerleitfaden](einstieg.md), [Einstellungen und Automatik](veranstalter-handbuch.md#einstellungen-und-automatik), [AutoDarts-API-Fähigkeiten](autodarts-api-capabilities.md).
