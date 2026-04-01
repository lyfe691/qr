# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
QR is a QR code creator app built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, and shadcn/ui (radix-luma style, mauve base). Package manager is pnpm.

## Commands
- `npm run dev` — dev server with Turbopack
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run format` — Prettier (with Tailwind plugin)
- `npm run typecheck` — TypeScript type checking (`tsc --noEmit`)

## Architecture
- **App Router** (`app/`): Next.js App Router with RSC support. Root layout wraps children in `ThemeProvider` and `TooltipProvider`.
- **Components** (`components/ui/`): Pre-installed shadcn/ui components (radix-luma style). Add new ones with `npx shadcn@latest add <component>`.
- **Theme**: Dark mode via `next-themes`. Toggle with `d` key (implemented in `components/theme-provider.tsx`).
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss` (no `tailwind.config` file). Theme variables in `app/globals.css` using OKLCh color space.
- **Utilities** (`lib/utils.ts`): `cn()` helper merging `clsx` + `tailwind-merge`.
- **Hooks** (`hooks/`): Custom hooks (e.g. `use-mobile.ts` for 768px breakpoint).
- **Icons**: `lucide-react`.

## Path Aliases
`@/*` maps to the project root (configured in `tsconfig.json` and `components.json`).

## Code Rules
- Run `npm run format` after making changes. Prettier handles all formatting.
- Use `cn()` or `cva()` for conditional/variant Tailwind classes.
- Prefer Server Components by default. Only add `"use client"` when the component needs browser APIs, hooks, or event handlers — and keep those boundaries as narrow as possible.
- Keep components small and single-purpose. Split when a component exceeds ~100 lines or has distinct responsibilities.
- Co-locate feature-specific code near the route that uses it. Shared code goes in `components/`, `hooks/`, `lib/`.
- Always use existing shadcn/ui components before building custom ones. Compose primitives together rather than reimplementing.
- Use `next/dynamic` with `{ ssr: false }` to code-split heavy client-only libraries (e.g. QR rendering, canvas/SVG).
- Follow `next-best-practices` skill for Next.js patterns and conventions.
- Follow `vercel-react-best-practices` skill for performance and React patterns.
- Use the `simplify` skill after making changes to review and clean up modified code.

## Design Rules
This app must have a super clean, polished, distinctive design. Not generic AI-generated aesthetics.

- Fonts: Outfit (sans), Geist Mono (mono). Use the theme CSS variables from `globals.css` (mauve palette, OKLCh). Support light and dark modes.
- Clean, generous whitespace. Subtle meaningful animations. Mobile-first and responsive.
- Use the `frontend-design` skill before building any new UI.
- Use the `ui-ux-pro-max` skill for interaction design and UX decisions.
- Use the `web-design-guidelines` skill to validate UI before shipping.
- Use the `shadcn` skill when working with shadcn/ui components.

## SEO
- Use the `seo-audit` skill when adding or modifying pages, metadata, or public-facing routes.
