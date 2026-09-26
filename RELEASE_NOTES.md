# v0.1.0

First tagged release. This is a substantial rework of what was previously a
Figma Make export with a broken build.

## Highlights

**It actually has a state layer now.** The old version had a single 21 KB
`useStore()` hook that every component called separately, re-parsing every
`localStorage` blob on every render — one message send cost roughly eight
storage round-trips, including a full re-serialisation of all groups per
reaction tap. It's now one module-level store behind `useSyncExternalStore`,
with one subscription for the whole app.

**Cross-tab sync.** A `BroadcastChannel` bridge means two browser tabs are two
real users: messages, join requests, approvals, notifications and points
propagate live, and presence dots show who is online. This replaces a fake
"X is typing" indicator that was cycling through random names on a timer.

**Real routing.** `react-router` was already a dependency but was never
imported; navigation was a string in `localStorage`. Now there are real URLs,
working deep links like `/groups/g1`, shareable links, and a back button.

**The build is trustworthy.** There was no `tsconfig.json` at all, so `vite
build` stripped types through esbuild and never typechecked anything. There's
now strict TypeScript, ESLint with the React hooks rules, Vitest, and CI
running all of it.

## Fixed

- **Storage quota crash.** `write()` had no error handling, so exceeding the
  ~5 MB `localStorage` quota threw an uncaught `QuotaExceededError` and lost
  message history. Attachments are now capped at 256 KB per file.
- **Groups could be orphaned permanently.** If a host left their own group they
  were removed from `members` while `ownerId` still pointed at them. Since every
  admin action gates on `ownerId`, the group became unmanageable — no approvals,
  no member removal, ever. Ownership now transfers to the next admin.
- **Quiz points were farmable.** Re-answering a quiz paid out again each time.
  The award is now sticky per (user, quiz).
- **Membership wasn't enforced.** Non-members could post messages, schedule
  sessions, react, and answer quizzes for points by calling the store directly,
  even though the UI hid those controls. Hiding a button is not authorisation.
- **A latent crash in Analytics**, where `useMemo` was called after an early
  return. Caught by the new ESLint config rather than by inspection.
- **The demo account could be hijacked.** "Continue with Google" was not Google
  — it signed you in as a hardcoded account, and would take over anyone who had
  registered with that email. It's now labelled honestly, and the email is
  reserved.
- **Input validation** was absent: a one-character password was accepted.
- Chat auto-scrolled to the bottom even while you were reading history.

## Removed

- ~45 unused shadcn components and 45 provably-unused dependencies. Runtime
  dependencies went from 50 to 13; installed packages from roughly 600 to 185.
- The Figma Make scaffolding (`figmaAssetResolver`, `@figma/my-make-file`).
- A theme system that could not work: `dark` was hardcoded on `<html>` over a
  `bg-black` root, so light mode was structurally impossible. The app is
  dark-only by design decision now.

## Honesty changes

The old README described features that were partly simulated. Now:

- The sign-in screen states plainly that there's no server and passwords are
  stored in plain text.
- Pre-seeded group members are labelled `demo` in the member list.
- The "AI Tutor" tab is marked as canned responses in the UI.
- [`SECURITY.md`](SECURITY.md) documents the actual threat model, including
  what is *not* vulnerable and why.

## Known limitations at this release

No backend, plaintext local credentials, a 256 KB attachment cap, a canned AI
tutor, and dark mode only. All are listed in the README with workarounds where
they exist.
