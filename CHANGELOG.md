# Changelog

All notable changes to CHJ Homepage are recorded here. This file summarizes product-level changes; detailed session state lives in [SESSION.md](SESSION.md).

## 2026-06-25 - Development Documentation System

### Added

- Initialized the project documentation system under `docs/`.
- Added project workflow, architecture, roadmap, coding style, AI rules, module documentation, and decision records.
- Updated the root README with project-specific setup, workflow, deployment, and documentation links.

## Completed Work To Date

### GitHub + Vercel Workflow

- GitHub is the single source of truth for source code.
- Vercel deploys from GitHub after pushes to `main`.
- Local development is synchronized through Git, not through file transfer.

### OpenAI API Integration

- OpenAI API integration exists on server-side API routes.
- `OPENAI_API_KEY` must remain server-only and be configured in Vercel environment variables.

### AI Translate Text Translation

- `/translate` provides text translation between Chinese and Japanese.
- `/api/translate` handles server-side OpenAI translation requests.
- Translation direction and scene selection are part of the Translate workflow.

### iMac / MacBook Development Workflow

- Both iMac and MacBook should work from `~/Projects/chj-homepage`.
- Both machines synchronize through GitHub.
- Development starts with `git pull origin main` and ends with `git push origin main`.

### GitHub CLI Authentication

- GitHub authentication should be configured on every development machine.
- Push failures should be solved by fixing GitHub authentication or repository conflicts, not by switching to patch-based workflows.
