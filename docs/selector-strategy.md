# Selector Strategy (Auto-Ergebnis)

## Ziel
Robuste, defensive Erkennung beendeter Spiele in einer sich ändernden SPA ohne Backend-Reverse-Engineering.

## Vorgehen
1. **Winner-Kandidaten**
   - `[class*="winner"]`
   - `[data-testid*="winner"]`
   - `[aria-label*="winner"]`
2. **Spieler-Kandidaten**
   - `[data-testid*="player"]`
   - `[data-testid*="name"]`
   - `[class*="player"]`
   - `[class*="name"]`
   - `[class*="scoreboard"]`
3. **Leg-Score-Kandidaten**
   - `[class*="legs"]`
   - `[data-testid*="legs"]`
   - `[class*="score"]`
   - `[class*="result"]`

## Matching-Regeln
- Namen werden normalisiert (`trim`, lowercase, Diakritika entfernt).
- Auto-Abschluss nur bei **eindeutigem** offenem Match.
- Bei Mehrdeutigkeit: kein Abschluss, nur Debug-Log.
- Ein Fingerprint verhindert die Mehrfachübernahme desselben Ergebnisses.

## Fallback
- Jede Auto-Erkennung hat eine manuelle Übersteuerung im Tab `Spiele`.
- Ergebnisse können manuell gespeichert werden (Winner + Legs).
