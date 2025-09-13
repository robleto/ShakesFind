This repository is distributed under a commercial model; external pull requests are not accepted.

Lightweight guidance for internal changes:

1. Open a short issue (or internal ticket) describing the change and user impact.
2. Update `CHANGELOG.md` (Unreleased section or new version) and bump `VERSION` + `package.json` when releasing.
3. Add or adjust tests under `tests/` for any new endpoint or behavior.
4. Keep documentation changes atomic with code (README, OpenAPI, ARCHITECTURE if structural).
5. Avoid introducing frameworks or heavy deps without explicit approval.

Security & Data:
- Never commit secrets or production connection strings.
- Migrations go in `neon/` with idempotent patterns; update architecture doc if schema meaningfully evolves.

Deprecations:
- Mark legacy modules with a clear comment and add them to the deprecation table in `ARCHITECTURE.md`.

External Requests:
- Direct customers or interested parties to the official support/contact channel; do not promise timelines in the repo.

Legacy full community CONTRIBUTING guide intentionally removed.
