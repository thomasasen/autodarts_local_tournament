# Changelog

## 0.2.0
- API-Halbautomatik umgesetzt:
  - Matchstart per Button im Tab `Spiele` (`Match starten` / `Zum Match`).
  - Automatische Ergebnissynchronisierung ueber Autodarts-API fuer gestartete Matches.
  - Single-active-match-Regel (ein aktives gestartetes Match gleichzeitig).
- Persistenter Automationsstatus pro Match in `match.meta.auto` (abwaertskompatibel).
- Userscript-Metadaten erweitert um `GM_xmlhttpRequest` und `@connect api.autodarts.io`.
- Loader-Metadaten erweitert um `@connect api.autodarts.io` fuer API-Zugriffe im Loader-Kontext.
- Settings-Text aktualisiert: `Automatischer Lobby-Start + API-Sync` ist jetzt funktional.

## 0.1.2
- Alle Loader- und Script-Metadaten auf das korrekte Repo `thomasasen/autodarts_local_tournament` umgestellt (`namespace`, `downloadURL`, `updateURL`, RAW-Quelle).
- Menuebezeichnung auf `xLokale Turniere` geaendert.
- Menueposition verbessert: bevorzugt direkt unter `Boards/Meine Boards` (auch bei verschachtelter DOM-Struktur).
- Klick-Handling verhaertet: Toggle wird bei fruehem Klick ueber `ata:ready` nachgeholt, falls Runtime noch nicht geladen war.

## 0.1.1
- Loader-Menuepunkt `Turnier` auf robuste Sidebar-Erkennung umgestellt (analog zum `xConfig`-Muster mit Kandidaten-Scoring).
- Stabilere Einfuegeposition im Hauptmenue (bevorzugt hinter `Boards`, sonst vor Profilbereich).
- Responsives Label-Verhalten: blendet den Text bei schmaler Sidebar aus, Icon bleibt sichtbar.

## 0.1.0 (MVP)
- Neues Loader-Userscript mit RAW-Load + Cache-Fallback.
- Neues Haupt-Userscript mit:
  - Shadow-DOM Drawer UI.
  - Turniererstellung fuer KO, Liga, Gruppen + KO.
  - Match-Ergebnisfuehrung (auto + manuell).
  - Tabellenberechnung (Punkte > LegDiff > Legs+).
  - Bracket-Anzeige via `brackets-viewer` (iframe) + HTML-Fallback.
  - JSON Export/Import (Datei + Copy/Paste).
  - Storage-Versionierung (`ata:tournament:v1`) inkl. Migrations-Stub.
  - SPA-Routing-Stabilisierung und zentralem Cleanup.
