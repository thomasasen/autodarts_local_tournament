# autodarts_local_tournament

MVP-Userscript fuer lokale Turniere direkt in `https://play.autodarts.io`.

## Features (MVP)
- Ein-Klick Installation ueber Loader:
  - `installer/Autodarts Tournament Assistant Loader.user.js`
- Turniermodi:
  - KO
  - Liga (Round Robin)
  - Gruppenphase + KO (2 Gruppen, Top2, Kreuz-Halbfinale)
- Ergebnisfuehrung:
  - API-Halbautomatik (Start per Klick + Ergebnis-Sync) bei aktivem Feature-Flag
  - Auto-Erkennung aus DOM (striktes Matching)
  - Manuelle Winner-/Leg-Eingabe
- Ansicht:
  - Liga-/Gruppentabellen
  - KO-Bracket via `brackets-viewer` (iframe) + HTML-Fallback
- JSON:
  - Export als Datei
  - Export in Zwischenablage
  - Import via Datei oder Copy/Paste
- Stabilitaet:
  - Shadow DOM
  - SPA-Routing Hooks
  - MutationObserver + Cleanup
- Storage-Versionierung:
  - `ata:tournament:v1` (schemaVersion `1`)

## Repo-Struktur
```text
autodarts_local_tournament/
├─ installer/
│  └─ Autodarts Tournament Assistant Loader.user.js
├─ dist/
│  └─ autodarts-tournament-assistant.user.js
├─ docs/
│  ├─ architecture.md
│  ├─ selector-strategy.md
│  └─ changelog.md
├─ README.md
└─ LICENSE
```

## Installation
1. Tampermonkey im Browser installieren.
2. Loader installieren:
   - `https://github.com/thomasasen/autodarts_local_tournament/raw/refs/heads/main/installer/Autodarts%20Tournament%20Assistant%20Loader.user.js`
3. `https://play.autodarts.io` neu laden.
4. Im Hauptmenue auf **xLokale Turniere** klicken.

## Nutzung
1. Tab `Turnier`: neues Turnier anlegen (Name, Modus, Teilnehmer, Best-of, Startscore).
2. Tab `Spiele`: Match per `Match starten` starten oder manuell pflegen; API/DOM-Auto-Uebernahme aktualisiert Ergebnisse.
3. Tab `Ansicht`: Tabellen und Bracket pruefen.
4. Tab `Import/Export`: JSON sichern oder wieder einspielen.
5. Tab `Einstellungen`: Debug und Feature-Flags.

## Debug
- Debug aktivieren in Tab `Einstellungen`.
- Konsole-Logs erscheinen mit Prefix:
  - `[ATA][storage]`
  - `[ATA][route]`
  - `[ATA][autodetect]`
  - `[ATA][api]`
  - `[ATA][bracket]`
  - `[ATA][runtime]`

## Testen (manuell)
1. Loader mit Internet:
   - Seite laden, Script wird remote gezogen und im Cache gespeichert.
2. Loader ohne Internet:
   - Seite laden, Cache-Fallback pruefen.
3. Mehrfaches SPA-Navigieren:
   - Button **Turnier** bleibt einmalig.
4. KO mit 5/6/7 Spielern:
   - BYEs werden automatisch gesetzt.
5. Liga mit 4 Spielern:
   - kompletter Round-Robin Spielplan.
6. Gruppen + KO mit 8 Spielern:
   - Gruppen A/B + Top2 -> Halbfinale Kreuzpaarung.
7. Import/Export:
   - Datei + Copy/Paste roundtrip.

## Bekannte Risiken und Gegenmassnahmen
1. DOM-Aenderungen in Autodarts:
   - Gegenmassnahme: Selektor-Kaskade + defensive Parser + manueller Fallback.
2. SPA-Routing bricht UI:
   - Gegenmassnahme: `pushState/replaceState` Hook + `popstate/hashchange` + Polling.
3. Doppelte Injektion:
   - Gegenmassnahme: harte IDs + Runtime-Guards + idempotente `ensure*`-Funktionen.
4. Memory-Leaks:
   - Gegenmassnahme: zentrale Cleanup-Registry fuer Observer/Listener/Intervalle.
5. Falsche Auto-Erkennung:
   - Gegenmassnahme: striktes eindeutiges Match-Matching, sonst kein Auto-Abschluss.
6. CDN-Bracket faellt aus:
   - Gegenmassnahme: Timeout + statischer HTML-Bracket-Fallback.
7. 8-Spieler-Limit:
   - Gegenmassnahme: harte Validierung beim Erstellen und Import.
8. Cache-Korruption im Loader:
   - Gegenmassnahme: Marker-Validierung vor Ausfuehrung.

## Limitationen
- Teilnehmerlimit im MVP: `2..8`.
- Gruppenphase + KO im MVP: mindestens `5` Teilnehmer.
- Auto-Lobby + API-Sync bleibt experimentell und basiert auf nicht offiziell dokumentierten API-Endpunkten (Inference).
- Auto-Erkennung ist selektorabhaengig und daher best-effort.

## Quellen / Orientierung
- Chrome Web Store Feature-Referenz:
  - https://chromewebstore.google.com/detail/autodarts-local-tournamen/algfbicoennnolleogigbefngpkkmcng
- Autodarts Plus (Exclusive Tournaments, 8-Spieler-Limit):
  - https://autodarts.diy/Autodarts-Plus/Exclusive-tournaments/
- Turnier-Regelbegriffe:
  - https://www.pdc-europe.tv/wiki/rules/
  - https://www.darts-theworld.com/en/rules-wsda.html
- Loader/SPA-Muster nur als Inspiration (kein Import):
  - https://github.com/thomasasen/autodarts-tampermonkey-themes
