# SKILL.md

## Name
ATA Release Verification

## Purpose
Provide a repeatable release gate for build correctness and regression resistance.

## Verification chain
```powershell
npm run build
npm run check:syntax
npm test
powershell -ExecutionPolicy Bypass -File scripts/qa.ps1
```

## Manual checks
1. Install canonical dist script in Tampermonkey.
2. Validate single bootstrap and stable UI behavior.
3. Validate update check path and metadata URLs.
4. Validate legacy loader remains installable and shows migration hint.

## Rollback readiness
- Keep previous dist artifact accessible.
- Keep legacy loader available until explicit removal decision.
- Document rollback steps in release notes.
