# Security Policy

## Scope

StudySync is a **client-only demo application**. It has no server, no database
and no real authentication. All data — accounts, groups, messages, quizzes and
notifications — is stored in your browser's `localStorage`.

That has direct security consequences, and they are worth stating plainly
rather than burying.

## Known limitations, by design

### 1. Passwords are stored in plain text

Passwords are saved to `localStorage` under a key derived from the user id and
compared with a string equality check. This keeps separate demo accounts apart.
It provides **no real protection**.

**Never enter a password you actually use anywhere else.** The sign-in screen
says this too.

### 2. "Sign in as demo" is not an identity provider

The demo button signs you in as a pre-seeded local account. It does not contact
any third party, and it is not connected to Google or any other provider,
despite what a "Continue with Google" button would imply.

### 3. Data is readable by anything running on the origin

`localStorage` is readable by any JavaScript executing on
`https://<your-host>`. If this app were ever served from a shared origin
alongside other applications, those applications could read every account and
message stored here.

Do not deploy this to an origin that hosts anything sensitive, and do not enter
real personal data.

### 4. There is no network layer

Nothing is transmitted anywhere. There is no server to breach, and equally
nothing is backed up — clearing site data permanently and irrecoverably deletes
every account and group.

## What is *not* currently vulnerable

To be fair to the code rather than just cautious about it:

- **Message and group text is not an XSS vector.** All user-supplied text is
  rendered as React children, which are escaped. There is no
  `dangerouslySetInnerHTML` anywhere in the codebase.
- **Attachments cannot inject script.** Attachments are read with `FileReader`
  and stored as `data:` URLs, which are rendered in `img`/`a` elements with a
  `download` attribute. A `FileReader` data URL cannot be a `javascript:` URL.
- **Authorisation is enforced in the store, not the UI.** Every privileged
  action re-checks the current session against the resource owner, and hides
  the controls as well. The UI is not the only gate.

## Reporting a vulnerability

If you believe you have found a genuine security issue — for example a way to
read another user's data, bypass the ownership checks in `src/app/store/`, or
inject script into the app — please report it privately rather than opening a
public issue.

Use GitHub's private vulnerability reporting: go to
**Security → Report a vulnerability** on this repository. If that option is not
available, open a regular issue describing the problem **without** a working
proof of concept, and ask for a private channel.

Please include:

- what you found and which file or action is involved
- steps to reproduce
- the impact you believe it has

I aim to acknowledge reports within a few days. There is no formal SLA for a
project of this size, and I would rather be honest about that than promise
something I will miss.

## Supported versions

Only the latest commit on `main` is maintained. There are no backported security
fixes for older commits.
