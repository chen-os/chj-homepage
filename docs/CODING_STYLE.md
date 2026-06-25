# Coding Style

This document defines implementation preferences for CHJ Homepage.

## TypeScript

- Use TypeScript for application code.
- Prefer explicit types at API boundaries.
- Keep domain types close to the module unless they are reused across modules.

## Next.js App Router

- Use the Next.js App Router structure under `app/`.
- Pages should stay focused on routing and composition.
- API routes should live under `app/api`.

## Server Components First

Use Server Components where appropriate. Add Client Components only when interactivity, browser APIs, or local state are required.

## Reusable Components

- Put reusable UI in `app/components`.
- Keep components focused and easy to scan.
- Prefer improving existing components over creating duplicates.

## Naming Convention

- Use clear, descriptive file names.
- Use kebab-case for route and component file names when practical.
- Use PascalCase for React component names.
- Use camelCase for variables and functions.

## Folder Structure

```text
app/                  App Router pages, layouts, APIs, components, and module data
app/api/              Server-side API routes
app/components/       Reusable components
data/                 Static or shared data
docs/                 Project documentation
public/               Static assets
types/                Shared types
```

## API Style

- Keep API keys server-side only.
- Validate request input before calling external services.
- Return stable JSON contracts.
- Keep frontend and backend field names aligned.
- Use clear error messages suitable for the UI.

## UI Consistency

- Keep the UI minimal, clean, and calm.
- Prefer simple layouts and obvious controls.
- Avoid duplicate UI patterns for the same workflow.
- Match the Japanese-inspired design direction described in [PROJECT.md](PROJECT.md).

## Error Handling

- Validate empty input.
- Handle missing environment variables.
- Handle failed external API requests.
- Show useful user-facing messages without exposing secrets.

## Performance

- Keep client-side bundles small.
- Avoid unnecessary client components.
- Avoid duplicated logic.
- Use server-side routes for external API calls.

## Build Rule

`npm run build` must pass before every commit.
