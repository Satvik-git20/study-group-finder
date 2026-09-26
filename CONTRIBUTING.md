# Contributing to StudySync

Thanks for looking at this. Contributions are welcome — see
[What I'd love help with](#what-id-love-help-with) for where help is most
useful.

## Getting set up

Requires **Node.js 20+** and **pnpm**.

```bash
git clone https://github.com/Satvik-git20/study-group-finder.git
cd study-group-finder
pnpm install
pnpm dev
```

The app is a single Vite workspace under `apps/web`. There is no backend to run
and no environment variables to set.

## Before you open a pull request

Run the full check. CI runs the same four gates, so this is exactly what will
happen on your PR:

```bash
pnpm check    # typecheck + lint + test
pnpm build    # typecheck + production build
```

| Gate | Command | What it catches |
| --- | --- | --- |
| Typecheck | `pnpm typecheck` | `tsc --noEmit` in strict mode |
| Lint | `pnpm lint` | ESLint, including the React hooks rules |
| Tests | `pnpm test` | Vitest unit tests for the store |
| Build | `pnpm build` | Anything the bundler rejects |

## Project conventions

- **TypeScript strict mode is on.** No `any` — widen the type instead. The
  `noUncheckedIndexedAccess` flag is also on, so `array[i]` is
  `T | undefined`; handle it or use a guard.
- **State lives in `src/app/store/`.** Please add new behaviour to `actions.ts`
  rather than reaching into `localStorage` from a component. Keeping storage
  access in one place is what makes the quota handling and cross-tab sync work.
- **Components read state through the hooks** in `core.ts` (`useGroups`,
  `useCurrentUser`, `useStatsFor`, and so on). Do not add new direct reads of
  `localStorage`.
- **Every hook must run before any early `return`.** ESLint catches this, but a
  conditional hook crashes at runtime rather than failing to compile.
- Styling is Tailwind utility classes. There is no CSS-in-JS and no component
  library — if you need a new pattern, reuse what is already in a sibling
  component.
- Match the existing formatting; there is no formatter configured, so keep diffs
  tight and avoid reformatting untouched lines.

## Adding tests

Tests live next to the code they cover (`src/app/store/store.test.ts`) and use
Vitest. The store is the part worth testing, because its logic is pure enough to
assert on precisely:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createGroup, getState, resetAll } from "./index";

beforeEach(() => {
  resetAll(); // clears localStorage and re-seeds
});

it("does something", () => {
  // arrange / act / assert
});
```

Call `resetAll()` in `beforeEach` — the store keeps its state in a module-level
object, so tests would otherwise leak into each other.

## Regenerating the README screenshots

The screenshots in `docs/screenshots/` are generated from the real app, not
mocked. If you change the UI, refresh them:

```bash
pnpm build
pnpm --filter studysync capture
```

This drives your locally installed Chrome, so it must be installed. It writes
1440×900 @2x PNGs.

## Reporting bugs

Use the **Bug report** issue template. The most useful things to include are
what you did, what you expected, and what happened — plus your browser and
whether you were running two tabs, since cross-tab behaviour is a common source
of confusion.

## Pull requests

- One focused change per PR, with a description of why.
- If you touch `src/app/store/`, include or update tests.
- If you change the UI, re-run `pnpm capture` and include the new screenshots.

## What I'd love help with

Genuinely useful, in rough priority order:

1. **Moving attachments to IndexedDB.** The current 256 KB per-file cap exists
   only to stay inside the `localStorage` quota. IndexedDB would remove it. This
   is the largest known limitation and a well-scoped first contribution.
2. **Light mode.** The app is dark-only by design decision, but the palette is
   centralised enough that a second theme is feasible.
3. **Real accessibility passes** — keyboard navigation through the tab panels
   and the chat composer, focus management in the modals, and screen-reader
   labels on the custom controls.
4. **A real backend.** Everything currently lives in `localStorage`. Migrating
   to Supabase or Firebase would make it genuinely multi-user. This is a large
   change and would need discussion before starting.
5. **Replacing the canned "AI Tutor" responses** with a real model behind a
   server-side proxy. Note that calling an API directly from the browser would
   expose the key.
6. **More test coverage** on the UI layer, which currently only has store tests.

## Code of conduct

Be decent to each other. Assume good faith, critique the code rather than the
person, and remember that most people here are learning.
