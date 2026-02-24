# PDC/DRA Compliance-Mapping

## Quellen
- DRA Rulebook (offiziell): https://www.thedra.co.uk/dra-rulebook
- DRA PDF (Projektkopie): [DRA-RULE_BOOK.pdf](DRA-RULE_BOOK.pdf)

## Umgesetzte Punkte

1. **Round Robin Tie-Break (DRA 6.16.1, im Round-Robin-Kontext)**
- Implementiert in `standingsForMatches`.
- Reihenfolge:
  - Punkte
  - Direktvergleich (bei genau 2 Punktgleichen)
  - Teilgruppen-Leg-Differenz (bei 3+ Punktgleichen)
  - Gesamt-Leg-Differenz
  - Gesamt-Legs gewonnen
  - danach `playoff_required`
- Referenz: DRA Rulebook `6.16.1` (Seite 20), PDF-Link: [DRA-RULE_BOOK.pdf#page=20](DRA-RULE_BOOK.pdf#page=20)

2. **Gruppenauflösung**
- `groupResolution.status` wird auf `playoff_required` gesetzt, wenn Gleichstände nicht auflösbar sind.
- KO-Qualifikation wird bis zur manuellen Klärung blockiert.

3. **KO / Straight Knockout**
- KO-Bracket bleibt Single Elimination.
- Seeded/Open Draw bleiben verfügbar.
- Freilose (Bye) werden nur in Runde 1 automatisch abgeschlossen.
- Referenz: DRA Rulebook `6.8.1` (Seite 17), `6.12.1` (Seite 18), PDF-Link: [DRA-RULE_BOOK.pdf#page=18](DRA-RULE_BOOK.pdf#page=18)

4. **Terminologie (PDC-konform)**
- Die UI nutzt deutsche Begriffe mit PDC-Bezug, z. B.:
  - `Freilos (Bye)`
  - `KO (Straight Knockout)`
  - `Liga (Round Robin)`
  - `Nächstes Match (Next Match)`

## Bewusste Nicht-Automatisierung
- Bei vollständigem Deadlock wird keine automatische Entscheidung getroffen.
- Der Systemstatus ist `playoff_required` und erfordert eine manuelle Turnierentscheidung.
