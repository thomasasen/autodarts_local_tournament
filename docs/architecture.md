# Architektur (MVP)

## Runtime
- `installer/Autodarts Tournament Assistant Loader.user.js`:
  - Laedt `dist/autodarts-tournament-assistant.user.js` von GitHub RAW.
  - Validiert Marker, cached Last-Known-Good in `ata:loader:cache:*:v1`.
  - Fuegt idempotent den Sidebar-Button **Turnier** ein.
- `dist/autodarts-tournament-assistant.user.js`:
  - Runtime-Guard: `window.__ATA_RUNTIME_BOOTSTRAPPED`.
  - Public API: `window.__ATA_RUNTIME` (`openDrawer`, `closeDrawer`, `toggleDrawer`, `isReady`, `version`).
  - Event-Bruecke: `ata:toggle-request`, `ata:ready`.

## Datenmodell
- Storage-Key: `ata:tournament:v1` (`schemaVersion: 1`).
- Einstellungen:
  - `settings.debug`
  - `settings.featureFlags.autoLobbyStart` (default `false`)
- Turnier:
  - `mode`: `ko | league | groups_ko`
  - `participants` (2..8)
  - `matches` mit `status`, `winnerId`, `legs`, `source`.

## Turnierlogik
- KO:
  - Baum auf naechste 2er-Potenz, automatische BYEs.
  - Gewinner-Propagation in naechste Runde.
- Liga:
  - Round-Robin via Circle-Method.
  - Tabelle: Punkte > LegDiff > Legs+.
- Gruppen + KO:
  - 2 Gruppen (A/B), Top2 je Gruppe.
  - Kreuz-Halbfinale: A1-B2, B1-A2.

## UI
- Vollstaendig in Shadow DOM (`#ata-ui-host`).
- Drawer-Rechtslayout mit Tabs:
  - `Turnier`, `Spiele`, `Ansicht`, `Import/Export`, `Einstellungen`.
- Accessibility:
  - ESC schliesst Drawer.
  - Fokusfalle im offenen Drawer.

## Bracket Rendering
- Primaer: `brackets-viewer@1.9.0` in `iframe srcdoc` mit:
  - `i18next@23.16.8`
  - `brackets-viewer.min.js/.css`
- Message-Contract:
  - Parent -> iframe: `ata:render-bracket`
  - iframe -> Parent: `ata:bracket-frame-ready | ata:bracket-rendered | ata:bracket-error`
- Fallback: statischer KO-HTML-Renderer im Shadow DOM.

## Stabilitaet
- SPA-Routing:
  - Hook auf `history.pushState` + `history.replaceState`.
  - `popstate` + `hashchange`.
  - Polling-Fallback (1s).
- Lifecycle:
  - zentrale Cleanup-Registry fuer Listener/Observer/Intervalle.
