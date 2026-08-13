# Autodarts Tournament Assistant

Lokale Dartturniere direkt in [play.autodarts.com](https://play.autodarts.com) planen, spielen und auswerten.

Aktuelle Version: `0.14.1`

[![ATA Loader installieren](https://img.shields.io/badge/ATA%20Loader-installieren-1f6feb?style=for-the-badge)](https://raw.githubusercontent.com/thomasasen/autodarts_local_tournament/main/installer/Autodarts%20Tournament%20Assistant%20Loader.user.js)

Der Assistant ergänzt AutoDarts um die Bereiche `Turnier`, `Spiele`, `Turnierbaum`, `Sichern` und `Einstellungen`. Die manuelle Ergebnisführung funktioniert ohne API-Einrichtung. Lobby-Start und Ergebnisübernahme können später optional aktiviert werden.

![Turnieranlage des Autodarts Tournament Assistant](assets/ss_Turnier_anlage-neu.png)

_Die Turnieranlage führt links durch die Formatwahl; rechts fasst die Turnierübersicht Modus, Teilnehmer, Spiele und Zeitprognose zusammen._

## Schnell zum passenden Inhalt

| Ich möchte ... | Richtiger Einstieg |
|---|---|
| mein erstes lokales Turnier starten | [Erstes Turnier in fünf Minuten](docs/einstieg.md#erstes-turnier-in-fuenf-minuten) |
| Begriffe wie Leg, Best of oder Double Out verstehen | [Dart- und Turnierbegriffe](docs/begriffe.md) |
| einen geeigneten Turniermodus wählen | [Welcher Turniermodus passt?](docs/einstieg.md#welcher-turniermodus-passt) |
| Formate, Auslosung und Tie-Breaks festlegen | [Handbuch für Turnierleitungen](docs/veranstalter-handbuch.md) |
| eine Status- oder Fehlermeldung verstehen | [Statusmeldungen und Fehlerhilfe](docs/status-und-fehler.md) |
| Regelbezug und technische Durchsetzung prüfen | [DRA-Regeln in der GUI](docs/dra-regeln-gui.md) und [Compliance-Matrix](docs/dra-compliance-matrix.md) |
| am Projekt entwickeln | [Architektur](docs/architecture.md), [Codebase-Karte](docs/codebase-map.md) und [Refactor-Guide](docs/refactor-guide.md) |

## Installation

1. [Tampermonkey](https://www.tampermonkey.net/) installieren.
2. Auf `ATA Loader installieren` klicken und die Installation bestätigen.
3. [play.autodarts.com](https://play.autodarts.com) neu laden.
4. Links im Menü `xLokales Turnier` öffnen.

Der Loader lädt beim Seitenaufruf die aktuelle Version. Alternativ kann das [Runtime-Userscript](https://raw.githubusercontent.com/thomasasen/autodarts_local_tournament/main/dist/autodarts-tournament-assistant.user.js) direkt installiert werden. Falls Tampermonkey nicht in AutoDarts startet, hilft die [Tampermonkey-FAQ zur Skriptinjektion](https://www.tampermonkey.net/faq.php#Q209).

## Das erste Turnier in Kurzform

1. Im Tab `Turnier` einen Namen eingeben.
2. Für einen normalen Spieleabend die vorausgewählte Vorlage `Lokaler Spieleabend - 501 / Best of 5` beibehalten.
3. Pro Zeile einen Teilnehmernamen eintragen.
4. Boardanzahl und Spieltempo nur für die Zeitprognose prüfen.
5. `Turnier anlegen` wählen und im Tab `Spiele` die gewonnenen Legs eintragen.

`Best of 5` bedeutet: Wer zuerst drei Legs gewinnt, gewinnt das Match. Die Vorlage verwendet `501`, `Straight In` und `Double Out`. Eine ausführliche Erklärung steht im [Einsteigerleitfaden](docs/einstieg.md).

## Was der Assistant kann

- KO, Doppel-KO, Liga, Gruppenphase mit KO sowie Vorrunde mit Finalphase
- lokale Best-of-5-Einstiegsvorlage und klar abgegrenztes European-Tour-Profil für Runden 1 bis 4
- verständliche Live-Zusammenfassung und aufklappbare Fach-/Regelhilfe
- deterministische Paarungen, Freilose, Turnierfortschritt und Turnierbaum
- manuelle Leg-Erfassung als verlässlicher Standard
- optionaler AutoDarts-Lobbystart und API-Ergebnissync, einschließlich geführter Vorrundenmatches mit genau zwei Legs und möglichem `1:1`
- Zeitprognose anhand Matchplan, nutzbaren Boards und Spieltempo
- Sicherungsdatei mit Vorschau und Bestätigung vor dem Wiederherstellen
- DRA-bezogene Hinweise, Draw-Lock und dokumentierte Veranstalterentscheidungen

## Bewusste Grenzen

- Die Boardanzahl in der Turnieranlage ist nur ein Parameter der Zeitprognose. Sie weist keine Boards zu und startet keine parallelen Lobbys.
- Die Automatik unterstützt einen aktiven Board-/Lobby-Flow. Manuelle Ergebnisführung bleibt immer verfügbar.
- Zwei feste Vorrundenlegs laufen in einer Matchmodus-Off-Lobby. Der Assistant verlangt Klicks vor Leg 2 und vor dem Matchabschluss; dieser technische Übergang ist deshalb bewusst `assisted`.
- Die Anwendung kann organisatorische Regeln wie Anwurf, Practice, Board-Etikette oder lokale Sonderregeln nicht selbst durchsetzen.
- `PDC European Tour - Runden 1 bis 4` bildet nur die dort genannten Best-of-11-Runden ab. Halbfinale und Finale benötigen längere Distanzen.
- Das lokale Best-of-5-Profil ist eine Produktempfehlung, kein offizielles PDC-Eventformat.
- Teilnehmerlimits: KO `2–128`, Doppel-KO `2–32`, Liga `2–16`, Gruppen + KO `4–16`, Vorrunde + Finalphase `5–16`.

## Regel- und Projektdokumentation

- [DRA-Regelwerk 2026, lokale Projektkopie](docs/DRA-RULE_BOOK.pdf)
- [GUI-bezogene DRA-Erklärungen](docs/dra-regeln-gui.md)
- [PDC-/DRA-Compliance-Mapping](docs/pdc-dra-compliance.md)
- [Detaillierte Compliance-Matrix](docs/dra-compliance-matrix.md)
- [Berechnung der Turnierdauer](docs/tournament-duration.md)
- [AutoDarts-API-Fähigkeiten und Grenzen](docs/autodarts-api-capabilities.md)
- [Changelog](docs/changelog.md)

## Entwicklung

Quellcode wird ausschließlich in `src/*` geändert. `dist/*` entsteht reproduzierbar durch den Build.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build.ps1
powershell -ExecutionPolicy Bypass -File scripts/qa.ps1
```

Weitere technische Einstiege: [Codebase-Karte](docs/codebase-map.md), [Architektur](docs/architecture.md), [Refactor-Guide](docs/refactor-guide.md), [Release-Checkliste](docs/release-checklist.md).

## Quellen

- [Darts Regulation Authority – Rulebook](https://www.thedra.co.uk/dra-rulebook)
- [PDC Europe – European Darts Open 2026](https://www.pdc-europe.tv/tournaments/et-2026-en/european-darts-open-2026/)
- [Tampermonkey-Dokumentation](https://www.tampermonkey.net/documentation.php?locale=en)
- [brackets-viewer.js](https://github.com/Drarig29/brackets-viewer.js)
