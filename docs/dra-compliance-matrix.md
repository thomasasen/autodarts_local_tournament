# DRA Compliance Matrix

Stand: `schemaVersion 4` / KO-Engine `v3` mit vollständiger KO-Materialisierung.

Statuswerte:
- `enforced`: technisch erzwungen
- `assisted`: per Checkliste/Hinweis unterstützt, Entscheidung bleibt beim Veranstalter
- `not_applicable_to_software`: organisatorisch/physisch, nicht verlässlich automatisierbar

| DRA Rule | Thema | Status | Umsetzung im Code |
|---|---|---|---|
| 2 (Definition "Bye"), p.4 | Freilos-Definition | enforced | `src/domain/tournament-create.js` (`buildKoMatchesFromStructure`), `src/domain/ko-engine.js` (`synchronizeStructuralByeMatch`) |
| 6.8.1, p.17 | Straight Knockout als Grundprinzip | enforced | `src/domain/tournament-create.js` (KO-Struktur), `src/bracket/payload.js` (single elimination payload) |
| 6.8.2, p.17 | Round Robin zulässig | enforced | `src/domain/tournament-create.js` (`buildLeagueMatches`, Gruppenmatches), `src/domain/standings-dra.js` |
| 6.10.1 / 6.10.5.2, p.17-18 | Promoter-Discretion / organisatorische Limits | assisted | Projektlimits + Hinweise in `src/ui/render-settings.js`, `README.md` |
| 6.12.1, p.18 | Draw bleibt bestehen | enforced / assisted | `drawLocked` je Turnier in `src/domain/ko-engine.js`, Default in `settings.featureFlags.koDrawLockDefault`; manuell umschaltbar in `src/ui/render-settings.js` |
| 6.16.1, p.20 | Tie-Break im Ermessen des Promoters | enforced | Profilmodell `tieBreakProfile` in `src/data/normalization.js`, Ranking in `src/domain/standings-dra.js` |
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
- Storage ist auf `schemaVersion: 4`.
