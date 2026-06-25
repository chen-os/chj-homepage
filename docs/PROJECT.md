# Project

## Project Vision

`chj.jp` is a long-term personal AI platform. It should become a calm, reliable, and useful home for daily tools, learning workflows, family records, personal dashboards, and AI-powered assistance.

## Mission

Build a personal platform that reduces friction in daily life, supports Japanese-language living, and keeps important personal systems accessible from one clean interface.

## Core Modules

- AI Translate
- Japanese Learning
- Pony
- Dashboard
- World Cup
- Finance
- Admin

## Target Users

Primary users:

- The project owner.
- Family members who need simple, reliable access to daily tools.
- Future collaborators or AI agents working inside the repository.

## Design Language

The product should feel:

- Minimal.
- Clean.
- Japanese.
- Calm.
- Spacious.
- Practical.
- Apple / MUJI / ACTUS inspired.

The UI should prefer white space, restrained typography, clear hierarchy, and simple controls over decorative complexity.

## Long-Term Goals

- A stable personal AI homepage.
- A reliable Chinese-Japanese translation assistant.
- A Japanese learning companion.
- Family and pet records that are easy to maintain.
- Personal finance and dashboard modules.
- Admin tools for operating the platform.
- A development system that works smoothly across iMac and MacBook.

## Architecture Overview

CHJ Homepage uses Next.js App Router.

High-level structure:

```text
app/          Pages, layouts, API routes, and app-level components
data/         Static data used by modules
docs/         Project documentation
types/        Shared TypeScript types
public/       Static assets
```

Server-side API routes live under `app/api`. Client UI modules are implemented as reusable components under `app/components` where appropriate.

## Technology Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Vercel
- GitHub
- OpenAI API

## Related Documents

- [Development Workflow](DEVELOPMENT.md)
- [Roadmap](ROADMAP.md)
- [Translate Module](modules/translate.md)
- [AI Rules](AI_RULES.md)
