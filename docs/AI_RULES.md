# AI Developer Rules

These rules apply to AI assistants working on CHJ Homepage.

## Core Rules

- Always inspect existing code before making changes.
- Always modify existing code first.
- Never bypass bugs by creating duplicate implementations.
- Never create duplicate pages.
- Never create duplicate APIs.
- Never create duplicate components.
- Prefer simple solutions.
- Think long-term.

## Workflow Rules

- Work in `~/Projects/chj-homepage`.
- Run `git pull origin main` before development when possible.
- Run `npm run build` before commit.
- Commit after a successful build.
- Push after a successful commit.
- If push fails, solve GitHub authentication, remote configuration, or merge conflicts.
- Do not generate patch files for normal development transfer.

## Debugging Rules

- Trace the actual page, component, fetch call, and API route before changing code.
- Confirm the JSON contract between frontend and backend.
- Add temporary debug output only when needed.
- Remove temporary debug output after verification.

## Documentation Rules

- Update [SESSION.md](../SESSION.md) when project status changes.
- Update [CHANGELOG.md](../CHANGELOG.md) for meaningful completed work.
- Record major workflow decisions in `docs/decisions/`.
- Keep module documentation up to date.

## Completion Report

At the end of a development task, report:

- Modified files.
- Build result.
- Commit hash.
- Push status.
- Known remaining issues.
