# StudySync — Study Group Finder

A web app for students to find and join study groups by subject, skill level and
preferred timing, then actually collaborate inside them: group chat, shared notes,
scheduled sessions, quizzes, and a points/badges system to keep people engaged.

Built with React 18, TypeScript, Vite and Tailwind CSS v4.

---

## Important: this is a frontend-only app

**There is no server and no database.** All data — users, groups, messages,
quizzes, notifications — lives in your browser's `localStorage`.

This has two consequences you should understand before using it:

1. **Your data is per-browser.** Clearing site data, or opening the app in a
   different browser or a private window, gives you a completely separate,
   empty instance. Nothing syncs to a server.
2. **Authentication is a simulation, not security.** There is no real auth
   provider. Passwords are stored locally in plaintext and compared with a
   string equality check. The "Continue with Google" button does not contact
   Google — it signs you in as a seeded demo account. Never enter a password you
   care about.

If you need real multi-user behaviour, see
[Multi-user via multiple tabs](#multi-user-via-multiple-tabs) below.

## Features

| Area | What it does |
| --- | --- |
| **Discovery** | Browse groups with filters for level, mode (online/offline) and time slot. Search with debounced history. |
| **Recommendations** | Keyword-scored "recommended for you" based on your profile subjects, the groups you have joined, and your recent searches. |
| **Groups** | Create groups, join open ones instantly, or request to join approval-gated groups. Hosts can approve, reject, add and remove members. |
| **Chat** | Per-group messaging with emoji reactions, file/image attachments, host-only announcements, and read receipts. |
| **Sessions** | Schedule study sessions with date, time and duration. All members get notified. |
| **Quizzes** | Members can author quizzes; attempts are scored and tracked per user. |
| **Notes** | Every attachment shared in chat is surfaced in one browsable, downloadable library. |
| **Gamification** | Points for joining, posting, scheduling and answering quizzes correctly. Six badges unlock automatically. |
| **Analytics** | Per-user activity breakdown and a leaderboard across all users. |
| **Notifications** | In-app notification centre for messages, join requests, approvals, sessions, announcements and badges. |

## Getting started

Requires Node.js 20+ and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev
```

Then open the URL Vite prints (default <http://localhost:5173>).

### Scripts

Run from the repo root:

| Command | Does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm typecheck` | `tsc --noEmit` under strict mode |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest |
| `pnpm build` | Typecheck, then build to `apps/web/dist` |
| `pnpm preview` | Serve the production build |
| `pnpm check` | typecheck + lint + test |

CI runs all of these on every push.

## Multi-user via multiple tabs

Because everything is in `localStorage`, the app has no network layer — but
`localStorage` is shared between tabs of the same origin, and changes are
broadcast between them over a `BroadcastChannel`. That means you can run a
genuine two-user session with no server:

1. Open the app in two tabs.
2. Sign up as a different user in each.
3. Create a group in tab A, request to join it from tab B.

Messages, join requests, approvals and notifications propagate live between the
tabs, and a green dot marks members who are online in another tab. This is the
intended way to exercise the collaborative features.

Note that presence only reports *other tabs of this app*, not other people on
the internet.

## Project layout

```
apps/web/
  src/app/
    App.tsx            route table
    types.ts           domain types
    useSearchQuery.ts  ?q= search-param hook
    components/        screens and panels
    store/
      core.ts          cached state + useSyncExternalStore subscription
      actions.ts       all mutations (auth, groups, messages, quizzes, points)
      channel.ts       BroadcastChannel sync + tab presence
      storage.ts       localStorage adapter with quota handling
      seed.ts          sample groups
      store.test.ts    31 unit tests
  src/styles/index.css Tailwind entry point
```

State lives in a single module-level object exposed through
`useSyncExternalStore`, so there is one subscription for the whole app rather
than one per component, and nothing is re-parsed from `localStorage` on render.

## Deployment

`pnpm build` emits a static bundle to `apps/web/dist`, hostable anywhere.

Because this app uses client-side routing, the host must rewrite all unmatched
paths to `/index.html`, otherwise deep links like `/groups/g1` will 404 on a hard
refresh. `apps/web/public/_redirects` covers Netlify and Cloudflare Pages; for
nginx use `try_files $uri /index.html;`.

## Known limitations

- Attachments are stored inline as base64 and capped at 256 KB per file, which
  is a deliberate trade-off to stay inside the ~5 MB `localStorage` quota.
  Moving to IndexedDB would remove the cap.
- There is no server, so there is no real authentication, and clearing site data
  permanently deletes all accounts and groups.
- The "AI Tutor" tab is a keyword-matched canned-response demo, clearly labelled
  as such in the UI. It is not a language model.
- The app is dark-mode only.

## License

MIT — see [LICENSE](./LICENSE).
