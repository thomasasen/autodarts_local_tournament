# SKILL.md

## Name
ATA Quality and Compliance Skill

## Use when
- Implementing or reviewing tournament logic.
- Changing DRA/PDC-related behavior.
- Touching import/sync/autodetect flows.
- Preparing releases with high confidence.

## Primary objectives
- Preserve deterministic tournament behavior.
- Keep DRA/PDC mapping explicit and auditable.
- Prevent regressions via domain + runtime tests.

## Operating procedure
1. Map the change to affected layer(s).
2. Identify impacted rule(s) and docs:
   - `docs/DRA-RULE_BOOK.pdf`
   - `docs/dra-regeln-gui.md`
   - `docs/dra-compliance-matrix.md`
3. Implement in `src/*` only.
4. Add tests:
   - Pure unit tests for functions.
   - Scenario tests that run complete tournament paths.
5. Rebuild and run checks:
   - `powershell -ExecutionPolicy Bypass -File scripts/build.ps1`
   - `powershell -ExecutionPolicy Bypass -File scripts/test-domain.ps1`
   - `powershell -ExecutionPolicy Bypass -File scripts/test-runtime-contract.ps1`
   - `powershell -ExecutionPolicy Bypass -File scripts/qa.ps1`
6. Update docs/changelog if behavior changed.

## Quality checklist
- No hidden side effects in domain logic.
- Explicit failure modes (`reasonCode`, message).
- No ambiguous auto-writes when mapping is unclear.
- Migration/backward compatibility considered.
- Docs match real behavior and wording is consistent.

## Scenario-test expectations
- `ko`: seeded/byes, open_draw determinism, advancement, champion/result index.
- `league`: standings, tie-break ordering, playoff-required deadlocks.
- `groups_ko`: group resolution, cross-semis, final assignment, deadlock blocking.

## Done criteria
- All QA scripts green.
- New behavior covered by automated tests.
- Compliance text and changelog updated where relevant.
