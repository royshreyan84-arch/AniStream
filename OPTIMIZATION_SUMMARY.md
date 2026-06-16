# Codebase Optimization Summary

## Executive Summary
`anime-streaming` is a Next.js App Router demo built around a polished dark-themed anime streaming aesthetic. The current codebase has strong styling foundations and reusable building blocks, but it is held back by repeated inline layout logic, inconsistent use of shared components, and incomplete TypeScript typing. The highest-value optimization opportunity is to consolidate UI patterns and turn page-specific layouts into composable shared components.

## Tech Stack
- Next.js 16.2.9
- React 19.2.4
- TypeScript 5
- Tailwind CSS via `app/globals.css`
- ESLint with `eslint-config-next`
- Browser-based Jikan API integration for anime data

## Repository Organization
- `app/` — Next.js App Router pages and global layout
- `app/lib/` — shared components, hooks, theme constants, and type definitions
- `public/` — static assets
- `app/globals.css` — global CSS and Tailwind utility loading
- `next.config.ts` — Next.js runtime and build configuration
- `package.json` — dependency and script definitions

## Page-Level Review
### `app/page.tsx`
- Static landing page with hero content and feature highlights.
- Layout is simple and visually consistent, but it still relies on inline styles rather than shared utility classes.
- No dynamic data or state management, making it low risk and easy to keep stable.

### `app/home/page.tsx`
- Primary client-side dashboard and highest-impact page.
- Fetches top anime from Jikan and displays featured content.
- Search input is API-driven and updates results in real time.
- Includes a `Continue Watching` section backed by `localStorage` with fallback sample data.
- Manages many UI states locally, including mobile search, menu visibility, notifications, and profile dropdowns.
- Contains duplicated styling and manually managed card layouts.
- Recommended optimization: extract `Navbar`, card components, and search controls into reusable modules.

### `app/history/page.tsx`
- Displays watch history cards with remove actions.
- Insertion of shared `Navbar` shows progress toward reuse.
- Still uses inline styles for cards and layout structures.
- Opportunity: move history card rendering into a dedicated `HistoryCard` component.

### `app/watchlist/page.tsx`
- Watchlist filter UI with hardcoded anime items.
- Uses a list-style page layout that could cleanly reuse shared cards and input components.
- Recommended optimization: unify filtering, tabs, and card look with shared components.

### `app/notifications/page.tsx`
- Notification feed with tabbed filters.
- Style and layout are page-specific, despite being a good match for shared navigation components.
- Could benefit from a shared notification item component and centralized tab state.

### `app/profile/page.tsx`
- Profile settings page with localStorage-driven username logic.
- Currently duplicates navbar/menu behavior found on other pages.
- Highest-value change: adopt shared `Navbar` and form input components to reduce duplication.

### `app/settings/page.tsx`
- Best current example of reusable component use.
- Uses `Navbar`, `NavigationTabs`, `Toggle`, and `Button` from `app/lib`.
- Represents the direction the rest of the app should follow.
- Strong candidate to use as the template for page refactors.

## Shared Code Review
### `app/lib/constants.ts`
- Central theme tokens are well organized: color palette, spacing, radii, z-index, and navigation data.
- Provides a strong basis for consistent UI styling.
- Underused in some page-level inline styles.

### `app/lib/components.tsx`
- Contains reusable primitives: `Toggle`, `InputField`, and `Button`.
- These components are styled with global theme constants but are not fully adopted across the app.
- There is room to add higher-level shared components like `AnimeCard`, `DropdownMenu`, and `SearchInput`.

### `app/lib/Navbar.tsx`
- Reusable nav component with route-aware widget hiding.
- Supports search, mobile search toggles, notification dropdowns, and profile menu.
- Presently the navbar is used in some pages but not consistently across the app.
- Needs a final pass to unify search dropdown behavior and remove inline styling duplication.

### `app/lib/NavigationTabs.tsx`
- Clean reusable tabs component powered by shared navigation data.
- Currently used in a limited but appropriate set of pages.
- Good candidate for broader adoption on page sections such as history, watchlist, and settings.

### `app/lib/hooks.ts`
- Includes reusable state hooks: `useToggleState`, `useExclusiveToggle`.
- Helpful for dropdown and toggle interactions, but page code still often uses direct `useState`.
- Recommendation: replace manual dropdown state logic with these hooks where appropriate.

### `app/lib/types.ts`
- Defines shapes for anime items, watchlist items, history items, and notifications.
- Type definitions exist but are underutilized; many pages still rely on `any` for API and UI data.
- Strong optimization opportunity: gradually convert pages to typed models.

## Styling Assessment
- Tailwind is enabled globally, but many page styles are still defined inline.
- Shared theme constants reduce friction, but repeated styling patterns remain.
- The UI currently relies on manual spacing, custom card styles, and inline hover logic.
- Optimization strategy: migrate repeated page styles into shared CSS classes or component wrappers.

## Behaviors and UX Notes
- Home page search now fetches from Jikan, but dropdown UX needs refinement in the navbar.
- Continue Watching behavior is implemented with `localStorage`, which is a good progressive enhancement.
- Route-based hiding behavior for navbar widgets is consistent, but should be centralized for maintainability.
- Certain dropdowns and overlays are manually positioned and may be impacted by container overflow.

## Key Strengths
- Visually cohesive dark anime theme with strong contrast.
- Shared theme tokens are centralized in `app/lib/constants.ts`.
- A clear foundation for reusable navigation and components is present.
- Home search and featured content are already API-driven.
- Settings page serves as a strong reusable component blueprint.

## Key Weaknesses
- Excessive inline styling and duplicated layout code.
- Inconsistent reuse of shared components and hooks.
- Underutilized TypeScript types and `any` usage across pages.
- Shared utilities and data models are not fully leveraged.
- Dropdown and overlay behavior is fragile due to layout and stacking context issues.

## Optimization Roadmap
1. Standardize navigation and page layout by using `Navbar` on all major pages.
2. Build reusable UI components for recurring structures: cards, forms, search controls, and dropdowns.
3. Replace page-local state duplication with shared hooks where dropdowns, toggles, and modals are involved.
4. Replace inline styles with component-driven styling or Tailwind utility classes.
5. Enrich TypeScript usage by migrating page props and API responses to `app/lib/types.ts`.
6. Add image domain configuration if Next.js image optimization is later introduced.
7. Audit and fix overlay clipping by ensuring dropdown parents are `relative` and not `overflow-hidden`.

## Immediate Refactor Priorities
- Refactor `app/home/page.tsx` to use shared `Navbar`, `AnimeCard`, and search components.
- Refactor `app/history/page.tsx`, `app/watchlist/page.tsx`, and `app/notifications/page.tsx` to reuse shared page layout patterns.
- Convert inline search and dropdown handling in `Navbar.tsx` into a reusable search component.
- Replace `any` with concrete types for Jikan responses and local data structures.
- Consolidate repeated card styles into shared UI components in `app/lib/components.tsx`.

## Recent Improvements
- Added API-driven search integration on the home page.
- Added a `Continue Watching` section that persists via `localStorage`.
- Began moving dropdowns and nav behavior into shared components.
- Created a consistent theme palette with `constants.ts`.

## Summary
The codebase is a solid prototype with a strong visual identity and shared component foundation. The next optimization phase should focus on reducing duplication, improving type safety, and centralizing layout/behavior into composable shared modules. With those improvements, the app can move from prototype quality to maintainable production readiness.
