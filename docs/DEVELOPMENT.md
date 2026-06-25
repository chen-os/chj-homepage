# Development Workflow

This document defines the standard development workflow for CHJ Homepage. It is the operational source of truth for how work moves from local development to production.

## Source of Truth

GitHub is the only source of truth for source code.

Do not use:

- Patch files for normal development transfer.
- AirDrop to transfer code.
- Google Drive to store or synchronize source code.
- Cursor as the primary development tool.

Use:

- ChatGPT for planning and product thinking.
- Codex for implementation.
- GitHub for source control.
- Vercel for deployment.

## Local Development Directory

All development machines should use the same path:

```text
~/Projects/chj-homepage
```

This keeps commands, notes, and debugging instructions consistent across iMac and MacBook.

## Development on Multiple Macs

For both iMac and MacBook:

1. Open `~/Projects/chj-homepage`.
2. Pull latest changes from GitHub.
3. Develop locally.
4. Build locally.
5. Commit locally.
6. Push to GitHub.
7. Let Vercel deploy from GitHub.

Never manually copy source code between Macs.

## Daily Git Workflow

Before development:

```bash
cd ~/Projects/chj-homepage
git pull origin main
```

After development:

```bash
npm run build
git status
git add .
git commit -m "clear commit message"
git push origin main
```

If push fails, fix GitHub authentication, remote configuration, or merge conflicts. Do not switch to patch files as the primary workflow.

## Build Workflow

Run a production build before every commit:

```bash
npm run build
```

A commit is not complete until the build passes.

## Commit Workflow

Commits should be small, descriptive, and aligned with the actual change.

Examples:

```bash
git commit -m "docs: initialize development documentation"
git commit -m "translate: add direction controls"
git commit -m "api: fix translate response parsing"
```

## Deployment Workflow

Vercel deploys automatically after changes are pushed to GitHub `main`.

Deployment flow:

```text
Local change
  -> npm run build
  -> git commit
  -> git push origin main
  -> Vercel automatic deployment
```

## Vercel Deployment

Vercel should be connected to the GitHub repository. Production deployment should come from `main`.

Environment variables, such as `OPENAI_API_KEY`, must be configured in Vercel and must not be exposed to client-side code.

## Debug Workflow

1. Reproduce the issue locally when possible.
2. Identify the real route, component, and API endpoint involved.
3. Inspect the existing code before changing it.
4. Add temporary debug output only when needed.
5. Remove temporary debug output after the issue is resolved.
6. Run `npm run build` before committing.

## Documentation Workflow

Update documentation when workflows, architecture, product direction, or module status changes.

Relevant files:

- [Project Vision](PROJECT.md)
- [Roadmap](ROADMAP.md)
- [Coding Style](CODING_STYLE.md)
- [AI Rules](AI_RULES.md)
- [Current Session](../SESSION.md)
- [Changelog](../CHANGELOG.md)
