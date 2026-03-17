# API Documentation Playbook (State of the Art, 2026)

Purpose: define how we build and maintain API documentation so it stays reliable, machine-readable, and maintainable.

This playbook is the process standard.  
The observed endpoint inventory remains in:
- [docs/autodarts-api-capabilities.md](./autodarts-api-capabilities.md)

## Core Principles
1. Spec-first: machine-readable description is the source of truth.
2. Human-readable docs are generated/synchronized from the spec, not hand-diverged.
3. Governance in CI: linting and consistency checks are mandatory.
4. Security by default: no secrets/tokens in examples, logs, or docs.
5. Explicit confidence/provenance where endpoints are reverse-engineered.

## Current Industry Baseline (Primary Sources)
- OpenAPI as HTTP API description standard:
  - OpenAPI index and versions: https://spec.openapis.org/oas/
  - Latest published OAS 3.2.0: https://spec.openapis.org/oas/latest.html
- AsyncAPI for event-driven contracts:
  - AsyncAPI 3.0.0 reference: https://www.asyncapi.com/docs/reference/specification/v3.0.0
- Problem Details as standard HTTP error envelope:
  - RFC 9457: https://www.rfc-editor.org/rfc/rfc9457
- Proven governance references:
  - Microsoft REST API Guidelines: https://github.com/microsoft/api-guidelines
  - Zalando RESTful API and Event Guidelines: https://opensource.zalando.com/restful-api-guidelines/
  - Google AIP (resource-oriented API design): https://google.aip.dev/general

## Documentation Target Model
### 1) Contract Layer (machine-readable)
- Primary contract file(s): `OpenAPI 3.2.x` (YAML/JSON).
- Include at least:
  - `info`, `servers`, `tags`, `securitySchemes`
  - full `paths` with methods
  - request/response schemas
  - examples
  - error schemas (`application/problem+json`)
- For event channels/websocket workflows: companion `AsyncAPI`.

### 2) Narrative Layer (human-readable)
- Overview of auth, versioning, environments, and rate limits.
- Endpoint usage guides and common flows.
- Troubleshooting section with known non-blocking errors.
- Changelog with behavioral impact.

### 3) Governance Layer
- Lint and style rules (CI gate).
- Broken refs/schema drift fail the pipeline.
- Review checklist for every endpoint change.

## Required Endpoint Documentation Fields
For every endpoint, document:
1. Method + path template.
2. Purpose and side effects.
3. Auth requirements (token type, required role/scope if known).
4. Path/query/header parameters.
5. Request body schema + example.
6. Response schemas + examples by status code.
7. Error mapping (Problem Details type/title/status/detail extensions).
8. Idempotency and retry guidance (if mutating).
9. Observability notes (correlation/request id headers if available).
10. Source confidence (`A/B/C/P`) when reverse-engineered.

## Error Model Standard
- Use RFC 9457 `application/problem+json` consistently.
- Minimum fields:
  - `type`
  - `title`
  - `status`
  - `detail`
  - `instance` (if available)
- Keep stable internal error codes in extension fields if needed.

## Versioning and Lifecycle Policy
- Document:
  - supported API version(s),
  - deprecation date,
  - sunset date,
  - migration path.
- Avoid silent behavior changes; always record in changelog.

## Security Rules for Docs and Samples
- Never store real tokens/credentials/API keys in repo.
- Redact sensitive query values (`code`, `state`, `session_state`, tokens).
- Use synthetic UUIDs and placeholder identifiers in examples.
- Keep probe/export tooling structurally informative but value-safe.

## Suggested Repository Layout
- `docs/openapi/` -> OpenAPI source files
- `docs/asyncapi/` -> AsyncAPI source files (if needed)
- `docs/autodarts-api-capabilities.md` -> observed inventory with confidence
- `docs/api-documentation-playbook.md` -> this process standard

## Practical Next Step for This Repo
1. Keep `autodarts-api-capabilities.md` as discovery ledger.
2. Add `docs/openapi/autodarts-observed.openapi.yaml` as machine-readable contract draft.
3. Move endpoint-by-endpoint from ledger into OpenAPI with schema/examples.
4. Add lint in CI (e.g. Redocly CLI or Spectral) before merge.

## Minimal Review Checklist (PR)
- New/changed endpoint added to contract file.
- Narrative docs updated if behavior changed.
- Confidence/provenance updated for reverse-engineered findings.
- No sensitive data in docs/examples.
- Changelog entry present.
