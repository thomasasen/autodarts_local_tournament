# Selector Strategy (Auto-Ergebnis)

## Ziel
Robuste, defensive Erkennung beendeter Spiele in einer sich aendernden SPA ohne Backend-Reverse-Engineering.

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
- Namen werden normalisiert (`trim`, lowercase, diacritics entfernt).
- Auto-Abschluss nur bei **eindeutigem** offenen Match.
- Bei Mehrdeutigkeit: kein Abschluss, nur Debug-Log.
- Fingerprint verhindert Mehrfachuebernahme desselben Ergebnisses.

## Fallback
- Jede Auto-Erkennung hat manuelle Uebersteuerung in Tab `Spiele`.
- Ergebnis kann manuell gespeichert werden (Winner + Legs).
