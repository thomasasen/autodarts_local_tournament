# DRA Compliance Matrix

Stand: `schemaVersion 5` / KO-Engine `v3` mit vollständiger KO-Materialisierung.

Statuswerte:
- `enforced`: technisch erzwungen
- `assisted`: per Checkliste/Hinweis unterstützt, Entscheidung bleibt beim Veranstalter
- `not_applicable_to_software`: organisatorisch/physisch, nicht verlässlich automatisierbar

| DRA Rule | Thema | Status | Umsetzung im Code |
|---|---|---|---|
| 2 (Definition "Bye"), p.4 | Freilos-Definition | enforced | `src/domain/tournament-create.js` (`buildKoMatchesFromStructure`), `src/domain/ko-engine.js` (`synchronizeStructuralByeMatch`) |
| 6.8.1, p.17 | Straight Knockout als Grundprinzip | enforced | `src/domain/tournament-create.js` (KO-Default mit genau einem Finale), `src/bracket/payload.js` (single elimination payload) |
| 1.2 / 6.8.4 | Separate Tournament-/Promoter-Rules möglich | enforced / assisted | Optionales `enableThirdPlaceMatch` fuer `ko` und eigenstaendiges `double_ko` mit Grand-Final-Regel in `src/domain/tournament-create.js` und `src/domain/ko-engine.js`; Standards bleiben unveraendert, Zusatzformate nur explizit aktiviert |
| 6.8.2, p.18 | Round Robin zulässig | enforced | `src/domain/tournament-create.js` (`buildLeagueMatches`, Gruppenmatches), `src/domain/standings-dra.js` |
| 1.2 / 6.8.4 / Veranstalterregeln | Ungerade Teilnehmerzahl im bestehenden `groups_ko` | assisted / enforced | `require_even` ist sicherer Produktstandard; `allow_unequal` erfordert bei ungerader Anzahl eine ausdrückliche Bestätigung. Die Anwendung analysiert nur zwei Round-Robin-Gruppen mit Top 2 und behauptet keine universelle DRA-Regel oder Unterstützung anderer offizieller Formate. |
| 1.2 / 6.8.2 / 6.8.4 / Veranstalterregeln | `preliminary_final`: verkürzte Vorrunde und Finalphase | enforced / assisted | `src/domain/preliminary-schedule.js` erzwingt gleiche reale Matchanzahl und eindeutige Gegner; `src/domain/preliminary-standings.js` wertet das gespeicherte Veranstalterprofil; `src/domain/preliminary-final-stage.js` blockiert ungeklärte Qualifikation und erzeugt KO/Doppel-KO aus Tabellen-Seeds. Keine universelle Verbandskonformitätsaussage. |
| Veranstalterregel / technische Integrationsgrenze | Zwei feste Legs mit möglichem `1:1` | enforced | Nur `2:0`, `1:1`, `0:2` sind zulässig. Mangels belegbarer exakter Zwei-Lobby-/Anwurfabbildung ist der AutoDarts-API-Start mit `fixed_legs_api_unsupported` gesperrt; manuelle Leg-Erfassung statt Approximation. |
| 6.10.1, p.18 | Zulassung liegt beim Promoter; kein globales DRA-Softwarelimit | assisted | Projektlimits sind technische/organisatorische Produktleitplanken in `src/domain/tournament-create.js`, `src/ui/render-settings.js`, `README.md` |
| 6.12.1, p.19 | Draw bleibt bestehen | enforced / assisted | `drawLocked` je Turnier in `src/domain/ko-engine.js`, Entsperren nur als expliziter Promoter-Override in `src/domain/rules-config.js` + `src/app/tournament-actions.js`; Platz-3-Option ist als Anlage/Import-Regel ausgelegt (kein Live-Toggle im laufenden Turnier) |
| 6.16.1, p.21 | Tie-Break im Ermessen des Promoters | enforced | Profilmodell `tieBreakProfile` in `src/data/normalization.js`, Ranking in `src/domain/standings-dra.js`, Profilsperre nach erstem relevanten Ergebnis in `src/domain/rules-config.js` |
| Allgemeine Board-/Ablaufregeln (Practice, Wurfreihenfolge, Offiziellenentscheid) | Vor-Ort-Abläufe | assisted / not_applicable_to_software | DRA-Checkliste in `src/ui/render-settings.js` |

## Mapping der Tie-Break-Profile

- `promoter_h2h_minitable`  
  Punkte -> H2H (2er-Tie) -> Mini-LegDiff (3+) -> Gesamt-LegDiff -> Legs+ -> `playoff_required`.
- `promoter_points_legdiff`  
  Punkte -> Gesamt-LegDiff -> Legs+.

## Migrationshinweise

- Legacy `tournament.rules.tieBreakMode` wird auf `tieBreakProfile` gemappt:
  - `dra_strict -> promoter_h2h_minitable`
  - `legacy -> promoter_points_legdiff`
- Legacy-`groups_ko` ohne neue Policy werden bei ungerader oder gespeicherter ungleicher Gruppenverteilung als bestehendes `allow_unequal`-Verhalten normalisiert. Gruppen und Matches bleiben unverändert; eine Bestätigung wird nicht abgeleitet.
- Storage ist auf `schemaVersion: 5`; bestehende Modi und Turniere werden ohne strukturelle Neuauslosung weiter normalisiert.
