# SKILL.md

## Name
ATA Userscript Migration and Packaging Safety Skill

## Use when
- Migrating install/distribution paths.
- Changing userscript build/packaging/versioning metadata.
- Touching `dist/*`, loader behavior, update URLs, or release verification.

## Do not change unless technically required
- Tournament logic in `src/domain/*`
- Runtime event order / side effects
- Storage keys and migration semantics
- DOM selectors/hooks for Autodarts integration
- Global/runtime guard names

## Standard build and packaging flow
1. Install dependencies:
```powershell
npm install
```
2. Build userscript artifacts:
```powershell
npm run build
```
3. Required artifacts in `dist/`:
- `autodarts-local-tournament.user.js`
- `autodarts-local-tournament.meta.js`
- `autodarts-tournament-assistant.user.js` (legacy alias)
- `autodarts-tournament-assistant.meta.js` (legacy alias)
4. Ensure version in header and runtime matches `package.json`.

## Metadata/header checks
- Header must include:
  - `@name`, `@namespace`, `@version`, `@description`, `@author`, `@license`
  - `@match`, `@run-at`
  - all required `@grant`
  - only required `@connect`
  - valid `@downloadURL`, `@updateURL`
- Canonical files must point URLs to `autodarts-local-tournament.*`.
- Legacy alias files must point URLs to `autodarts-tournament-assistant.*`.

## Syntax and automated checks
Run in this order:
```powershell
npm run check:syntax
npm test
powershell -ExecutionPolicy Bypass -File scripts/test-domain.ps1
powershell -ExecutionPolicy Bypass -File scripts/test-runtime-contract.ps1
powershell -ExecutionPolicy Bypass -File scripts/qa.ps1
```

## Smoke test (manual)
1. Fresh browser profile.
2. Tampermonkey installed.
3. Install `dist/autodarts-local-tournament.user.js`.
4. Open `https://play.autodarts.io/*`.
5. Verify single initialization and visible ATA UI.
6. Verify no duplicate handlers/injections.
7. Verify legacy loader can still be installed separately.
8. Verify standard path does not require GitHub runtime download at runtime.

## Upgrade test (manual)
1. Existing installation present.
2. Install newer dist version over it.
3. Verify persisted data remains.
4. Verify no double-install side effects.
5. Verify update/download URLs are sensible.

## Rollback test (manual)
1. Disable/remove new dist version.
2. Install previous dist version or legacy loader.
3. Reload `play.autodarts.io`.
4. Verify baseline UI and tournament actions still work.
5. Document exact rollback steps and known caveats.

## Regression warning signals
- More than one ATA bootstrap per page load.
- Missing `window.__ATA_RUNTIME` or missing runtime API keys.
- Broken sidebar entry insertion or duplicate menu entries.
- Any change to storage keys or reason codes without migration/docs.
- Dist header/version mismatch between `.user.js`, `.meta.js`, and `package.json`.
- Build/test commands dirtying tracked repo files unexpectedly.
