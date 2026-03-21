# SKILL.md

## Name
ATA Build & Packaging

## Purpose
Standardize reproducible dist generation with canonical + legacy userscript artifacts.

## Commands
```powershell
npm install
npm run build
npm run check:syntax
```

## Expected outputs
- `dist/autodarts-local-tournament.user.js`
- `dist/autodarts-local-tournament.meta.js`
- `dist/autodarts-tournament-assistant.user.js`
- `dist/autodarts-tournament-assistant.meta.js`

## Safety rules
- Version source is only `package.json`.
- Keep manifest order deterministic (`build/manifest.json`).
- Never hand-edit dist outputs.
- Do not change runtime logic while only fixing packaging.
