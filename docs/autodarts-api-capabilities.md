# Autodarts API Capabilities (Observed)

Status: observed on March 17, 2026 on `https://play.autodarts.io/` with production traffic.

This document is an inference from runtime traces and project code. It is not an official OpenAPI specification.

## Scope
- Host: `https://api.autodarts.io`
- Auth: `Authorization: Bearer <token>` on API calls
- Capture sources:
  - ATA runtime behavior in this repository (`src/infra/api-client.js`, `src/infra/api-automation.js`)
  - Browser probe capture in real play sessions

## Capability Classes
- `read`: non-mutating reads
- `write-safe`: mutating, but usually reversible or low-impact
- `write-critical`: mutating match progression/state
- `observed-not-used`: seen in traffic, currently not used by ATA automation flow

## Endpoint Matrix
| Method | Path Template | Observed Status | Class | Used by ATA | Notes |
|---|---|---|---|---|---|
| `POST` | `/auth/v1/refresh` | `200`, auth errors possible | `write-safe` | Yes | Refresh token flow when cookie token is missing |
| `POST` | `/gs/v0/lobbies` | `200` | `write-safe` | Yes | Creates lobby for match start |
| `POST` | `/gs/v0/lobbies/{lobbyId}/players` | `200` | `write-safe` | Yes | Adds players to lobby |
| `POST` | `/gs/v0/lobbies/{lobbyId}/start` | `200` | `write-critical` | Yes | Starts lobby/match session |
| `DELETE` | `/gs/v0/lobbies/{lobbyId}` | `200` | `write-safe` | Yes | Cleanup for failed start before actual start |
| `GET` | `/as/v0/matches/{matchId}/stats` | `200`, `404` while pending | `read` | Yes | Result sync for ATA |
| `GET` | `/gs/v0/lobbies/{lobbyId}` | `200` | `read` | No | Seen in runtime traffic |
| `GET` | `/gs/v0/matches/{matchId}` | `200` | `read` | No | Seen in runtime traffic |
| `GET` | `/gs/v0/matches/{matchId}/state` | `200` | `read` | No | Seen in runtime traffic |
| `GET` | `/gs/v0/matches/{matchId}/challenge` | `404` in observed sessions | `observed-not-used` | No | Autodarts app call; does not block ATA flow |
| `POST` | `/gs/v0/matches/{matchId}/throws` | `200` | `write-critical` | No | In-game scoring action (Autodarts app) |
| `POST` | `/gs/v0/matches/{matchId}/players/next` | `200` | `write-critical` | No | Turn progression |
| `POST` | `/gs/v0/matches/{matchId}/games/next` | `200` | `write-critical` | No | Leg/game progression |
| `DELETE` | `/gs/v0/matches/{matchId}` | `200` | `write-critical` | No | Match termination/deletion path seen in traffic |
| `GET` | `/bs/v0/boards/{boardId}` | `200` | `read` | No | Board details |
| `GET` | `/bs/v0/boards/{boardId}/state` | `200` | `read` | No | Board state |
| `GET` | `/bs/v0/boards/{boardId}/stream` | `200` | `read` | No | Board stream endpoint |
| `GET` | `/as/v0/friends` | `200` | `read` | No | Friend list |
| `GET` | `/us/v0/users/{userId}/dart` | `200` | `read` | No | User dart profile/state |

## Preflight/Meta Endpoints Seen (mostly `OPTIONS`)
These were seen in HAR traces mainly as CORS preflight and should not be interpreted as confirmed business calls by ATA:
- `/consent/v0`
- `/auth/v0/permissions`
- `/us/v0/profile/settings`
- `/us/v0/discovery-id`
- `/us/v0/match-id`
- `/status/v0`

## Probe v2
Use the versioned console probe to discover additional endpoints and payload key shapes:

- Script: [docs/ata-api-probe-v2.js](./ata-api-probe-v2.js)
- Copy script into browser console on `https://play.autodarts.io/`
- Safety model:
  - No bearer token values are persisted (only `authSeen`, scheme and token length).
  - URL query values are never stored; sensitive query keys are redacted.
  - Request body values are not stored; only structural key paths are collected.

Minimal flow:
1. Run the script once.
2. Run `__ATA_PROBE_V2.clear()`.
3. Execute target actions in Autodarts (create/start/play/end match).
4. Run `__ATA_PROBE_V2.printCapabilities()`.
5. Run `await __ATA_PROBE_V2.copyReport()`.
6. Save/attach report for documentation update.

## Change Procedure
When new endpoints are observed:
1. Add endpoint to matrix with status and class.
2. Mark whether ATA currently uses it directly.
3. Add sample request body keys (from probe report) if available.
4. Update `docs/changelog.md` with date and scope of changes.
