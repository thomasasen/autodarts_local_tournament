# PDC/DRA Compliance-Mapping

## Quellen
- DRA Rules: https://www.thedra.co.uk/rules
- DRA PDF: https://static.wixstatic.com/ugd/298855_0050acb8726842f7b7ca13ec829f5ebf.pdf

## Umgesetzte Punkte

1. **Round Robin Tie-Break (DRA 6.8.2 Kontext)**
- Implementiert in `standingsForMatches`.
- Reihenfolge:
  - Punkte
  - Direktvergleich (bei genau 2 Punktgleichen)
  - Teilgruppen-Leg-Differenz (bei 3+ Punktgleichen)
  - Gesamt-Leg-Differenz
  - Gesamt-Legs gewonnen
  - danach `playoff_required`

2. **Gruppenauflösung**
- `groupResolution.status` wird auf `playoff_required` gesetzt, wenn Gleichstände nicht auflösbar sind.
- KO-Qualifikation wird bis zur manuellen Klärung blockiert.

3. **KO / Straight Knockout**
- KO-Bracket bleibt Single Elimination.
- Seeded/Open Draw bleiben verfügbar.
- Freilose (Bye) werden nur in Runde 1 automatisch abgeschlossen.

4. **Terminologie (PDC-konform)**
- Die UI nutzt deutsche Begriffe mit PDC-Bezug, z. B.:
  - `Freilos (Bye)`
  - `KO (Straight Knockout)`
  - `Liga (Round Robin)`
  - `Nächstes Match (Next Match)`

## Bewusste Nicht-Automatisierung
- Bei vollständigem Deadlock wird keine automatische Entscheidung getroffen.
- Der Systemstatus ist `playoff_required` und erfordert eine manuelle Turnierentscheidung.
