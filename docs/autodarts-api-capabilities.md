# Autodarts API Capabilities (Known Set)

Stand: **17.03.2026** für `https://play.autodarts.io/`.

Diese Datei ist die aktuell vollständigste bekannte Liste aus:
- ATA-Runtime-Code und produktiven Laufzeittraces (HAR/Probe/Logs).
- öffentlichem Community-Code aus dem Internet (GitHub/Greasyfork).

Wichtig: Es gibt aktuell keine öffentliche, offizielle OpenAPI/Swagger-Spezifikation für `api.autodarts.io`.  
Die Liste ist daher **"known complete"**, nicht offiziell garantiert.

## Scope
- Host: `https://api.autodarts.io`
- Auth: i. d. R. `Authorization: Bearer <token>`
- Services (aus Pfadpräfix):
  - `auth` (`/auth/v1/*`)
  - `gs` Game Service (`/gs/v0/*`)
  - `as` Account/Stats (`/as/v0/*`)
  - `bs` Board Service (`/bs/v0/*`)
  - `us` User Service (`/us/v0/*`)
  - `ms` Message/WebSocket (`/ms/v0/*`)

## Confidence Levels
- `A` = in ATA-Code/Laufzeit direkt genutzt und verifiziert
- `B` = in produktiven App-Traces gesehen (inkl. HAR), aber nicht zwingend von ATA genutzt
- `C` = nur in öffentlichem Community-Code gesehen (Internet), fachlich plausibel
- `P` = nur als Preflight/Meta (`OPTIONS`) gesehen

## Endpoint Catalog (Business Calls)
| Method | Path Template | Class | Confidence | Used by ATA | Beschreibung |
|---|---|---|---|---|---|
| `POST` | `/auth/v1/refresh` | `write-safe` | `A` | Yes | Tauscht Refresh-Token gegen Access-Token (Fallback, wenn Cookie-Auth fehlt). |
| `POST` | `/gs/v0/lobbies` | `write-safe` | `A` | Yes | Erstellt Lobby/Matchcontainer (ATA-Matchstart). |
| `GET` | `/gs/v0/lobbies/{lobbyId}` | `read` | `B` | No | Liest Lobbystatus/-details. |
| `DELETE` | `/gs/v0/lobbies/{lobbyId}` | `write-safe` | `A` | Yes | Löscht ungestartete/fehlgeschlagene Lobby (Cleanup). |
| `POST` | `/gs/v0/lobbies/{lobbyId}/players` | `write-safe` | `A` | Yes | Fügt Spieler zur Lobby hinzu. |
| `DELETE` | `/gs/v0/lobbies/{lobbyId}/players/by-index/{playerIndex}` | `write-safe` | `C` | No | Entfernt Spieler in Lobby über Positionsindex (Community-Script). |
| `POST` | `/gs/v0/lobbies/{lobbyId}/start` | `write-critical` | `A` | Yes | Startet Lobby und erzeugt aktives Match. |
| `GET` | `/gs/v0/matches/{matchId}` | `read` | `B` | No | Match-Metadaten und Stand. |
| `GET` | `/gs/v0/matches/{matchId}/state` | `read` | `B` | No | Detaillierter Match-State (Turn, Legs, Würfe etc. je nach Matchphase). |
| `GET` | `/gs/v0/matches/{matchId}/challenge` | `observed-not-used` | `B` | No | App-Call, oft `404`; blockiert ATA-Flow nicht. |
| `DELETE` | `/gs/v0/matches/{matchId}` | `write-critical` | `B` | No | Matchabbruch/-löschung (in Traffic beobachtet). |
| `POST` | `/gs/v0/matches/{matchId}/players/next` | `write-critical` | `B` | No | Erzwingt Wechsel zum nächsten Spieler (Turn-Fortschritt). |
| `POST` | `/gs/v0/matches/{matchId}/games/next` | `write-critical` | `B` | No | Erzwingt Wechsel zum nächsten Leg/Game. |
| `POST` | `/gs/v0/matches/{matchId}/undo` | `write-critical` | `C` | No | Undo-Operation im laufenden Match (Community-Client). |
| `POST` | `/gs/v0/matches/{matchId}/corrections` | `write-critical` | `C` | No | Aktiviert/Korrigiert einzelne Würfe im Korrektur-Flow. |
| `PATCH` | `/gs/v0/matches/{matchId}/throws` | `write-critical` | `C` | No | Patcht Wurfdaten (z. B. `normal`, `bouncer`, Koordinaten). |
| `GET` | `/as/v0/matches/{matchId}/stats` | `read` | `A` | Yes | Matchstatistik für Ergebnis-Sync. Kann `404` liefern, solange Stats noch nicht bereit. |
| `GET` | `/as/v0/friends` | `read` | `B` | No | Freundesliste (ohne Slash). |
| `GET` | `/as/v0/friends/` | `read` | `B` | No | Freundesliste (Slash-Variante). |
| `GET` | `/as/v0/notifications` | `read` | `B` | No | Notifications des Nutzers. |
| `GET` | `/as/v0/users/{userId}/stats/{variant}?limit={n}` | `read` | `C` | No | User-Statistiken nach Variante (Community-Client). |
| `GET` | `/bs/v0/boards` | `read` | `B` | No | Board-Liste/Board-Übersicht. |
| `GET` | `/bs/v0/boards/{boardId}` | `read` | `B` | No | Boarddetails. |
| `GET` | `/bs/v0/boards/{boardId}/state` | `read` | `B` | No | Aktueller Board-State. |
| `GET` | `/bs/v0/boards/{boardId}/stream` | `read` | `B` | No | Board-Stream-Endpunkt. |
| `GET` | `/us/v0/users/{userId}/dart` | `read` | `B` | No | Darts-bezogene Userdaten/Profilteil. |
| `WS` | `/ms/v0/subscribe` | `read-stream` | `C` | No | WebSocket-Subscribe-Kanal für Live-Events. |

## Preflight / Meta (nicht als Business-Call bestätigen)
Diese Pfade wurden in HAR-Dateien vor allem als `OPTIONS` gesehen:
- `/consent/v0`
- `/auth/v0/permissions`
- `/us/v0/profile/settings`
- `/us/v0/discovery-id`
- `/us/v0/match-id`
- `/status/v0`

## Request Payload Shapes (known)
### `POST /auth/v1/refresh`
```json
{
  "refreshToken": "<token>"
}
```

### `POST /gs/v0/lobbies` (ATA-Flow)
```json
{
  "variant": "X01",
  "isPrivate": true,
  "bullOffMode": "normal",
  "legs": 3,
  "settings": {
    "baseScore": 501,
    "inMode": "straight",
    "outMode": "double",
    "maxRounds": 50,
    "bullMode": "25/50"
  }
}
```

### `POST /gs/v0/lobbies/{lobbyId}/players`
- ATA minimal:
```json
{
  "name": "Player Name",
  "boardId": "<board-id>"
}
```
- Community zusätzlich beobachtet: `userId`, `cpuPPR` (Bot/Account-Varianten).

### `POST /gs/v0/matches/{matchId}/corrections`
- Aktivieren eines Wurfs:
```json
{
  "activated": 4
}
```
- Korrektur mit Segment + Koordinaten:
```json
{
  "activated": 4,
  "changes": {
    "4": {
      "coords": { "x": 0.12, "y": -0.34 },
      "segment": { "name": "T20", "number": 20, "bed": "Triple", "multiplier": 3 },
      "type": "normal"
    }
  }
}
```

### `PATCH /gs/v0/matches/{matchId}/throws`
```json
{
  "changes": {
    "4": {
      "coords": { "x": 0.12, "y": -0.34 },
      "type": "normal"
    }
  }
}
```
Für Miss/Bouncer wurde in Community-Code auch `type: "bouncer"` gesehen.

## Probe v2 (für weitere Erweiterung)
- Script: [docs/ata-api-probe-v2.js](./ata-api-probe-v2.js)
- Sicherheitsmodell:
  - Keine Tokenwerte im Report.
  - Keine Query-Parameterwerte.
  - Nur strukturelle Body-Key-Pfade.

Ablauf:
1. Script in der Browser-Konsole laden.
2. `__ATA_PROBE_V2.clear()`.
3. Relevante Aktionen ausführen (Lobby erstellen, starten, spielen, korrigieren, beenden).
4. `__ATA_PROBE_V2.printCapabilities()`.
5. `await __ATA_PROBE_V2.copyReport()`.

## Internet Sources (verwendet)
- Offiziell:
  - `autodarts/docs` (kein öffentliches Cloud-OpenAPI gefunden): https://github.com/autodarts/docs
- Community:
  - `tools-for-autodarts`:
    - https://github.com/creazy231/tools-for-autodarts/blob/main/entrypoints/match.content/QuickCorrection.vue
    - https://github.com/creazy231/tools-for-autodarts/blob/main/entrypoints/match.content/index.ts
    - https://github.com/creazy231/tools-for-autodarts/blob/main/entrypoints/lobby.content/index.ts
  - Greasyfork Rematch-Script:
    - https://greasyfork.org/en/scripts/502077-autodarts-rematch-button-for-local-matches/code
  - `darts-caller`:
    - https://github.com/lbormann/darts-caller/blob/master/darts-caller.py

## Pflege-Regel
Bei neuen Beobachtungen:
1. Endpoint + Methode in den Katalog aufnehmen.
2. Confidence-Level setzen (`A/B/C/P`).
3. Payload-Shape ergänzen (nur Struktur, keine sensitiven Werte).
4. `docs/changelog.md` aktualisieren.
