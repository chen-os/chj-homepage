# CHJ Homepage

CHJ Homepage (`chj.jp`) is a long-term personal AI platform built with Next.js and deployed on Vercel. The project is designed as a clean, minimal, Japanese-inspired home for practical daily-life tools, learning workflows, personal dashboards, and AI-assisted modules.

## Project Overview

The current stable focus is **AI Translate**, a Chinese-Japanese text translation tool for everyday communication. The broader project will grow into a modular personal platform that includes Japanese learning, Pony records, dashboards, finance, World Cup tools, and admin utilities.

See [docs/PROJECT.md](docs/PROJECT.md) for the full vision.

## Technology Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Vercel deployment
- GitHub as the single source of truth
- OpenAI API for AI-powered features

## Quick Start

```bash
git clone https://github.com/chen-os/chj-homepage.git
cd chj-homepage
npm install
npm run dev
```

Open `http://localhost:3000` in the browser.

## Development

Daily development should happen in the fixed local directory:

```text
~/Projects/chj-homepage
```

Standard workflow:

```bash
git pull origin main
npm run build
# make changes
npm run build
git add .
git commit -m "..."
git push origin main
```

Read [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) before making changes.

## Deployment

Vercel deploys automatically from GitHub `main` after a successful push. GitHub is the only source of truth for source code. Do not move code by patch files, AirDrop, or Google Drive.

Deployment notes are in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Directory Structure

```text
app/                  Next.js App Router pages, layouts, APIs, and components
data/                 Static project data
docs/                 Project documentation system
public/               Static assets
types/                Shared TypeScript types
README.md             Project entrypoint
CHANGELOG.md          Human-readable change history
SESSION.md            Current session and project status
DEV_REPORT.md         Development collaboration report
```

## Main Documentation

- [Project Vision](docs/PROJECT.md)
- [Development Workflow](docs/DEVELOPMENT.md)
- [Roadmap](docs/ROADMAP.md)
- [Coding Style](docs/CODING_STYLE.md)
- [AI Developer Rules](docs/AI_RULES.md)
- [Translate Module](docs/modules/translate.md)
- [Development Workflow Decision](docs/decisions/2026-06-25-development-workflow.md)
- [Current Session](SESSION.md)
- [Changelog](CHANGELOG.md)

## Contributing Rules

- Modify existing code before creating new implementations.
- Do not create duplicate pages, APIs, or components.
- Build must pass before commit.
- Push to GitHub after a successful build.
- Keep the UI simple, clean, and consistent.
- Record meaningful workflow or product decisions in `docs/decisions/`.
