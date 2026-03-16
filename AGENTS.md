# AGENTS.md

Repository guide for humans and coding agents.

## Project goal
- Local tournament assistant for `play.autodarts.io`.
- Keep tournament logic deterministic, testable, and aligned with DRA/PDC terminology.

## Source of truth
- Logic: `src/*`
- Built artifact: `dist/autodarts-tournament-assistant.user.js`
- Do not edit `dist/*` manually. Use `scripts/build.ps1`.

## Required workflow for changes
1. Understand affected layer(s): `core`, `data`, `domain`, `app`, `infra`, `ui`, `runtime`.
2. Implement in `src/*` only.
3. Add or update tests in `tests/*`.
4. Run at minimum:
   - `powershell -ExecutionPolicy Bypass -File scripts/test-domain.ps1`
   - `powershell -ExecutionPolicy Bypass -File scripts/test-runtime-contract.ps1`
5. Before finalize, run:
   - `powershell -ExecutionPolicy Bypass -File scripts/qa.ps1`

## Architecture rules
- Domain layer must stay pure (no `window`, `document`, storage, rendering).
- UI should not own domain decisions; call app/domain functions.
- Infra is best-effort integration and must fail safely.

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

## Test strategy minimum
- Unit tests for pure domain logic.
- Scenario tests for full mode flows (`ko`, `league`, `groups_ko`).
- Runtime selftests for integration-sensitive behavior.

## Documentation hygiene
- Update when behavior changes:
  - `README.md`
  - `docs/changelog.md`
  - Compliance docs if rule behavior changes.
