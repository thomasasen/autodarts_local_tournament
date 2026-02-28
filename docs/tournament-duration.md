# Turnierzeit-Prognose

Diese Dokumentation beschreibt die Berechnungsgrundlage der Live-Prognose in `src/domain/tournament-duration.js`.

## Ziel und Geltungsbereich
- Die Schätzung ist eine deterministische Planungsprognose für lokale Turniere auf genau einem Board.
- Sie ist bewusst nicht normativ: DRA/PDC definieren kein allgemeines Minutenmodell für lokale Turnierdauer.
- Ziel ist eine belastbare Vorab-Planung, keine sekundengenaue Laufzeitvorhersage.

## Verwendete Turnier-Parameter
| Parameter | Wird genutzt | Warum |
|---|---|---|
| `mode` | Ja | Steuert Matchanzahl und Phasenlogik (`ko`, `league`, `groups_ko`). |
| `participants.length` | Ja | Steuert Matchanzahl direkt. |
| `bestOfLegs` | Ja | Daraus werden `legsToWin` und die erwartete Leg-Anzahl je Match berechnet. |
| `startScore` | Ja | Modelliert den X01-Abstand (`121` bis `901`). |
| `x01InMode` | Ja | Erhöht oder reduziert die Schwierigkeit des Leg-Starts. |
| `x01OutMode` | Ja | Erhöht oder reduziert die Schwierigkeit des Checkouts. |
| `x01BullOffMode` | Ja | Fügt Bull-off-Zeit pro Match hinzu. |
| `x01BullMode` | Ja, wenn `Bull-off != Off` | In der App ist `Bull-Modus` dann fachlich relevant und wird mit einem kleinen Faktor bewertet. |
| `x01MaxRounds` | Ja | Wirkt vor allem auf die obere Spannweite, nicht auf den Normalfall. |
| `tournamentTimeProfile` | Ja | Kalibriert Wurfgeschwindigkeit und Verzögerung zwischen Matches/Phasen. |

## Absichtlich nicht genutzte Parameter
| Parameter | Warum nicht |
|---|---|
| `name` | Hat keinen Einfluss auf Ablaufdauer. |
| `x01Preset` | Ist nur ein Alias für die konkreten X01-Felder. |
| `randomizeKoRound1`, `koDrawLocked` | Ändern die Strukturtransparenz, aber nicht die Matchanzahl. |
| `lobbyVisibility` | Ist organisatorisch relevant, aber kein deterministischer Zeitfaktor. |
| Teilnehmer-Reihenfolge | Beeinflusst Seeding, aber nicht die Zahl der Matches oder Legs. |
| `rules.tieBreakProfile` | Kann nur in Sonderfällen zu Playoffs führen; das ist vor Turnierstart nicht deterministisch planbar. |
| Mehrere Boards | Das Produkt modelliert bewusst nur `singleBoard = true`. |
| Individuelle Spieler-Stats | Vor Turnierstart nicht verlässlich verfügbar; dafür existiert das globale Zeitprofil. |

## Formel
1. `legsToWin = ceil(bestOfLegs / 2)`
2. Erwartete Legs pro Match:
   - Es wird die binomiale Verteilung für ein symmetrisches Match (`p = 0.5`) verwendet.
   - Dadurch wird nicht stumpf die halbe Distanz angenommen, sondern die mathematisch erwartete Matchlänge.
3. Minuten pro Leg:

```text
legMinutes =
  3.75
  * profile.legPaceMultiplier
  * scoreFactor(startScore)
  * inFactor(inMode)
  * outFactor(outMode)
  * bullFactor(bullMode)
```

4. Overhead pro Match:

```text
matchOverheadMinutes =
  0.80
  + profile.matchTransitionMinutes
  + bullOffOverhead(bullOffMode)
```

5. Minuten pro Match:

```text
matchMinutes = expectedLegs * legMinutes + matchOverheadMinutes
```

6. Matchanzahl:
- `ko`: `participants - 1`
- `league`: `n * (n - 1) / 2`
- `groups_ko`: Round Robin in zwei Gruppen plus festes KO mit zwei Halbfinals und einem Finale

7. Phasen-Overhead:
- `ko`: kleine Zusatzzeit je Rundenwechsel
- `groups_ko`: fixer Zusatzblock für Gruppenabschluss und Start des KO-Teils
- `league`: kein eigener Phasenblock, weil alle Paarungen direkt planbar sind

8. Gesamtzeit:

```text
likelyMinutes = matchCount * matchMinutes + phaseOverheadMinutes
lowMinutes = likelyMinutes * 0.90
highMinutes = likelyMinutes * (1 + highPadding)
```

## Kalibrierung der Faktoren

### Startscore-Faktoren
| Startscore | Faktor |
|---|---|
| `121` | `0.50` |
| `170` | `0.58` |
| `301` | `0.74` |
| `501` | `1.00` |
| `701` | `1.24` |
| `901` | `1.42` |

Die Staffelung ist bewusst stärker als zuvor. Hintergrund: externe Timing-Guides zeigen, dass längere X01-Distanzen den Matchfluss deutlicher strecken als eine zu flache Skalierung abbildet. Gleichzeitig bleibt die Kurve unter einer rein linearen Score-Proportionalität, weil Start-/Checkout-Aufwand bei kurzen Distanzen nicht proportional gegen null fällt.

### In-/Out-Faktoren
| Feld | Straight | Double | Master |
|---|---|---|---|
| `In` | `1.00` | `1.06` | `1.10` |
| `Out` | `0.93` | `1.00` | `1.05` |

### Bull-off und Bull-Modus
| Feld | Wert | Faktor / Minuten |
|---|---|---|
| `Bull-Modus` | `25/50` | `1.00` |
| `Bull-Modus` | `50/50` | `0.98` |
| `Bull-off` | `Off` | `+0.00 min` |
| `Bull-off` | `Normal` | `+0.40 min` |
| `Bull-off` | `Official` | `+0.65 min` |

### Zeitprofile
| Profil | Leg-Pace | Match-Übergang | Phasen-Multiplikator | Zweck |
|---|---|---|---|---|
| `fast` | `0.88` | `0.55 min` | `0.90` | zügige Felder, wenig Leerlauf |
| `normal` | `1.00` | `0.80 min` | `1.00` | Standard für lokale Turniere |
| `slow` | `1.15` | `1.15 min` | `1.15` | gemischte Felder, langsamere Wechsel |

Wichtig: Das Profil wirkt absichtlich auf zwei getrennte Dinge:
- auf die eigentliche Leg-Geschwindigkeit
- auf die Zeit zwischen Matches bzw. zwischen Turnierphasen

Das folgt direkt aus Organisatoren-Praxis: nicht nur die Wurfstärke, sondern auch Aufmerksamkeit, Board-Wechsel und Ergebniserfassung beeinflussen die Gesamtdauer.

## Externe Vergleichswerte und warum sie genutzt werden

### DRA/PDC
- Das DRA-Regelwerk definiert Turnierformate, Draw- und Tie-Break-Regeln, aber keine allgemeine Minutenformel für lokale Turnierplanung.
- Deshalb ist die Zeitprognose eine kalibrierte Inferenz auf Basis externer Organizer-Benchmarks.

### Organizer-Rechner: About The Darts
- Quelle: https://www.aboutthedarts.com/how-to/calculate-the-time-required-for-your-darts-tournament/
- Der Rechner trennt explizit zwischen:
  - Anzahl Boards
  - durchschnittlicher Dauer eines Legs
  - Zeit zwischen Matches
- Das bestätigt zwei Kernannahmen dieser App:
  - `singleBoard = true` muss explizit in die Formel eingebaut sein
  - ein globales Profil muss sowohl Wurfpace als auch Übergangszeiten abbilden

### Vereins-Richtwert: Bognor Regis Darts Association
- Quelle: https://www.bognorregis.com/darts/
- Der dort referenzierte Rough Guide nennt für drei Legs ungefähr:
  - `301 -> 9 min`
  - `501 -> 15 min`
  - `701 -> 21 min`
- Diese Richtwerte sprechen für eine deutlich sichtbare Staffelung nach Startscore. Genau deshalb wurden die Score-Faktoren gegenüber der früheren, flacheren Skalierung angehoben.

### Allgemeiner Praxiswert: Game and Entertain
- Quelle: https://gameandentertain.com/how-long-does-a-game-of-darts-last/
- Dort werden grob genannt:
  - etwa `10-15 min` pro Leg bei Gelegenheitsspielern
  - etwa `5-7 min` pro Leg bei geübteren Spielern
  - etwa `15-20 min` für ein Best-of-5-Match
- Das dient als Plausibilitätscheck für die `501`-Normal-Kalibrierung im lokalen Ein-Board-Setup.

## Ergebnis der aktuellen Justierung
- `501`, `Best of 5`, `Straight In`, `Double Out`, `Bull-off Normal`, Profil `normal` bleibt bei rund `17.5 min` pro Match.
- `301` fällt spürbar kürzer aus, `701` und `901` spürbar länger.
- Das Zeitprofil beeinflusst jetzt nicht nur Legs, sondern auch Wechselzeiten. Das passt besser zur UI-Beschreibung und zu den externen Benchmarks.

## Grenzen der Prognose
- Keine Playoff-Sonderfälle aus Tie-Break-Stillständen.
- Keine Einplanung von Einwurf-/Practice-Fenstern je Match.
- Keine Parallelisierung auf mehreren Boards.
- Keine individuelle Spielerform oder Average-basierte Dynamik.

Für diese Fälle bleibt die Prognose absichtlich konservativ und zeigt zusätzlich eine Spannweite statt nur eines Einzelwerts.
