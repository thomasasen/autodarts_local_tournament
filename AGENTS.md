# AGENTS.md

Repository guide for humans and coding agents.

## Project goal
- Local tournament assistant for `play.autodarts.io`.
- Keep tournament logic deterministic, testable, and aligned with DRA/PDC terminology.

## Source of truth
- Logic and runtime behavior: `src/*`
- Build/distribution tooling: `scripts/*`, `package.json`
- Built artifacts: `dist/*`
- Legacy fallback loader: `installer/Autodarts Tournament Assistant Loader.user.js`
- Do not edit `dist/*` manually. Always build via `npm run build` or `powershell -ExecutionPolicy Bypass -File scripts/build.ps1`.

## Mandatory change boundaries
- Packaging/build/versioning/distribution changes are allowed and expected.
- Tournament Fachlogik, API-Halbautomatik flow, UI behavior and runtime order must stay unchanged unless technically required.
- No silent changes to:
  - storage keys
  - DOM selectors/hooks
  - event names
  - initialization order or side effects
  - runtime guards (`__ATA_RUNTIME_BOOTSTRAPPED`, `__ATA_RUNTIME`, loader/runtime bridge keys)
- Keep legacy loader in repo until explicitly removed by maintainers.

## Required workflow for changes
1. Identify affected layer(s): `core`, `data`, `domain`, `app`, `infra`, `ui`, `runtime`.
2. Implement in small, reviewable steps.
3. Prefer adapter/wrapper changes over deep refactors for migration tasks.
4. Add/update tests in `tests/*` and/or `scripts/*` when behavior or build mechanics change.
5. Run at minimum:
   - `npm run build`
   - `npm run check:syntax`
   - `npm test`
   - `powershell -ExecutionPolicy Bypass -File scripts/test-domain.ps1`
   - `powershell -ExecutionPolicy Bypass -File scripts/test-runtime-contract.ps1`
6. Before finalize, run:
   - `powershell -ExecutionPolicy Bypass -File scripts/qa.ps1`

## Architecture rules
- Domain layer must stay pure (no `window`, `document`, storage, rendering).
- UI should not own domain decisions; call app/domain functions.
- Infra is best-effort integration and must fail safely.
- Runtime bootstrap remains idempotent and single-init.

## Userscript packaging rules
- Version source is `package.json`.
- Build must produce:
  - `dist/autodarts-local-tournament.user.js`
  - `dist/autodarts-local-tournament.meta.js`
  - legacy aliases under `dist/autodarts-tournament-assistant.*`
- Metadata header must include complete userscript fields and correct `@downloadURL` / `@updateURL`.
- Keep only technically required grants/connect entries.
- New standard install path must work without dynamic GitHub runtime download.

## Rule compliance expectations
- Reference documents:
  - `docs/DRA-RULE_BOOK.pdf`
  - `docs/dra-regeln-gui.md`
  - `docs/dra-compliance-matrix.md`
- If behavior is "assisted" (not fully enforceable), document that explicitly.
- Prefer deterministic behavior over hidden randomness.

## Quality gates
- No silent data rewrites for ambiguous or lossy imports.
- Return explicit `reasonCode` for blocked/failed flows.
- Keep backward compatibility for persisted storage where possible.
- Keep docs in sync with code behavior.
- For risky migrations, document risks and rollback path in PR/release notes.

## Test strategy minimum
- Unit tests for pure domain logic.
- Scenario tests for full mode flows (`ko`, `league`, `groups_ko`).
- Runtime selftests for integration-sensitive behavior.
- Build verification for dist/meta/header/version consistency.

## Documentation hygiene
- Update when behavior changes:
  - `README.md`
  - `docs/changelog.md`
  - Compliance docs if rule behavior changes.
- For packaging/distribution changes, include upgrade and rollback notes.
