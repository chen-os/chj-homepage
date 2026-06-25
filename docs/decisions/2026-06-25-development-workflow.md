# Decision: Development Workflow

Date: 2026-06-25

## Status

Accepted.

## Context

CHJ Homepage is developed across multiple Macs and deployed through Vercel. The project needs a reliable, repeatable workflow that avoids manual file transfer and keeps production deployment predictable.

## Decision

The project will use:

- ChatGPT + Codex as the primary development interface.
- GitHub as the only source of truth for source code.
- Vercel automatic deployment from GitHub.
- `~/Projects/chj-homepage` as the fixed local development directory.
- iMac and MacBook synchronized through GitHub.

The project will stop using:

- Cursor as the primary development tool.
- Patch files for normal development transfer.
- AirDrop for source code transfer.
- Google Drive for source code storage or synchronization.

## Rationale

This workflow reduces confusion between machines, makes deployment traceable, and creates a clean path from local development to production.

## Consequences

- Every development machine must have GitHub authentication configured.
- Push failures must be solved directly, not bypassed through patches.
- Vercel deployment state should be understood as a result of GitHub state.
- Documentation should be updated when workflow changes.

## Related Documents

- [Development Workflow](../DEVELOPMENT.md)
- [AI Rules](../AI_RULES.md)
- [Current Session](../../SESSION.md)
