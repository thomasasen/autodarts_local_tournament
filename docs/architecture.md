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

## Schichtenmodell (inkrementell)
- Datenhaltungsschicht:
  - Storage-Zugriff (`GM_*`, `localStorage`), Normalisierung, Migrationen, Backup-Write.
- Logikschicht:
  - KO-/Liga-/Gruppen-Berechnung, Freilos-Autoverarbeitung, Gewinner-Propagation.
- Praesentationsschicht:
  - Rendering im Shadow DOM, Tab-Inhalte, Event-Binding.

## Datenmodell
- Storage-Key: `ata:tournament:v1` (`schemaVersion: 2`).
- KO-Migrations-Backups: `ata:tournament:ko-migration-backups:v2` (Ringpuffer, max. 5 Eintraege).
- Einstellungen:
  - `settings.debug`
  - `settings.featureFlags.autoLobbyStart` (default `false`)
- Turnier:
  - `mode`: `ko | league | groups_ko`
  - fuer `ko` zusaetzlich `tournament.ko`:
    - `drawMode`: `seeded | open_draw`
    - `engineVersion`: `2`
  - `participants` (modusabhaengig):
    - `ko`: `2..128`
    - `league`: `2..16`
    - `groups_ko`: `4..16`
  - `matches` mit `status`, `winnerId`, `legs`, `source`.
  - pro Match optionale Ergebnis-Semantik unter `match.meta.resultKind`:
    - `bye` fuer automatisch weitergeleitete Freilose.
  - pro Match optionale API-Automationsmetadaten unter `match.meta.auto`:
    - `provider`, `lobbyId`, `status`, `startedAt`, `finishedAt`, `lastSyncAt`, `lastError`.

## Turnierlogik
- KO:
  - KO-Engine v2 mit Hybrid-Draw:
    - `seeded`: Eingabereihenfolge = Seed 1..n.
    - `open_draw`: zufaellige Seed-Reihenfolge.
  - Standard-Seed-Placement fuer 2er-Potenz-Baeume.
  - Bei unvollstaendigem Feld werden BYEs als fehlende Seeds verteilt (Top-Seeds erhalten Freilose).
  - Gewinner-Propagation in naechste Runde.
  - Nur Runde-1-Freilose werden automatisch abgeschlossen (`resultKind = bye`).
  - Legacy-KO-Turniere werden beim Laden auf Engine v2 migriert; davor wird Backup geschrieben.
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
- Spiele-Tab:
  - Freilose werden als eigener Status `Freilos` angezeigt (nicht als regulaeres `0:0` Match).
- Accessibility:
  - ESC schliesst Drawer.
  - Fokusfalle im offenen Drawer.

## Bracket Rendering
- Primaer: `brackets-viewer@1.9.0` in `iframe srcdoc` mit:
  - `i18next@23.16.8`
  - `brackets-viewer.min.js/.css`
- GoJS wird bewusst nicht verwendet (Lizenz-/Evaluierungsartefakt-Risiko).
- Message-Contract:
  - Parent -> iframe: `ata:render-bracket`
  - iframe -> Parent: `ata:bracket-frame-ready | ata:bracket-rendered | ata:bracket-error`
- Fallback: statischer KO-HTML-Renderer im Shadow DOM, nur bei Renderfehler/Timeout sichtbar.

## Stabilitaet
- SPA-Routing:
  - Hook auf `history.pushState` + `history.replaceState`.
  - `popstate` + `hashchange`.
  - Polling-Fallback (1s).
- Lifecycle:
  - zentrale Cleanup-Registry fuer Listener/Observer/Intervalle.

## API-Halbautomatik
- Aktiviert ueber `settings.featureFlags.autoLobbyStart`.
- Matchstart per UI-Button im Tab `Spiele`:
  - erstellt Lobby (`/gs/v0/lobbies`)
  - fuegt Spieler hinzu (`/gs/v0/lobbies/{id}/players`)
  - startet Lobby (`/gs/v0/lobbies/{id}/start`)
- Ergebnis-Sync im Intervall:
  - liest Match-Stats (`/as/v0/matches/{id}/stats`)
  - uebernimmt Winner/Legs automatisch in das lokale Turnier.
- Single-active-match-Regel:
  - nur ein aktives gestartetes Match gleichzeitig.
