---
name: jam-cli
description: Use when composing the `jam` CLI to inspect, debug, or operate on Jam recordings — picking among read commands, filtering events, paginating, or interpreting exit codes.
---

# Jam CLI — Skill Manifest

This file is bundled with the `jam` binary. Install it for your AI assistant
via `jam skills install`, or read it ad-hoc with `cat $(jam skills source)`.
It teaches shell-using agents how to compose CLI commands into useful
workflows for inspecting, debugging, and operating on Jam recordings.

Read `jam agent-context` for the machine-readable command surface
(arguments, flags, output shapes). This document is the human-readable
"when to use what" companion — the two are kept in sync at build time.

## Authentication

Every read/write command needs an authenticated session. Authenticate with:

- `jam auth login` — interactive browser OAuth flow.
- `jam auth login --token` — read a PAT from stdin (headless / CI).
- `jam auth status` — show current user, team, and environment.
- `jam auth logout` — clear credentials.

Without auth, commands that talk to Jam exit with code 3 (`auth`) before doing
any work. Each command's `auth` field in `jam agent-context` says whether it
needs a login (`required`) or runs without one (`none`).

## Picking the right read

A Jam id is a UUID (e.g. `f7b3a9c1-2d8e-4a5b-9e6c-1a2b3c4d5e6f`). Every
read command takes the id as a positional argument.

Three commands return *different views of the same Jam*:

- `jam get jam <id>` — top-level Jam record: title, author, URL, dates,
  folder, and kind-specific data (dimensions, duration, media). Start
  here when you have a fresh Jam id and don't yet know what's interesting.
- `jam get metadata <id>` — structured metadata events emitted by the
  page via the `jam.metadata()` SDK call. Returns an empty page when
  the recorded app doesn't instrument it.
- `jam get intents <id>` — structured summary of the Jam: what the user
  was trying to do, observed issues, and impact. Returns
  `{ status: "not_requested", value: null }` when no summary is
  available — that's absence, not an error.

Three commands return *slices of the captured event stream*:

- `jam get console <id> [--level error|warn|info|debug|log]` — console
  log events. Defaults to all levels.
- `jam get network <id> [--status <code|Nxx>] [--method <verb>] [--host <h>] [--content-type <ct>]` —
  network requests. Filters compose with AND semantics; `--status`
  accepts an exact code (`500`) or a range (`5xx`).
- `jam get events <id>` — the unfiltered event stream. Reach for this
  when console and network don't cover the event type you need
  (e.g. user input events).

All three accept `--limit` and `--after` for pagination.

Four media reads:

- `jam get transcript <id>` — WebVTT transcript for video Jams. Returns
  `{ status, vtt }`; `vtt` is null while generation is pending.
- `jam get chapters <id>` — AI-generated chapter markers for video Jams. Returns
  `{ status, chapters, language }`; `chapters` is null unless `status` is `ready`;
  `status` is `not_requested` when generation was never queued for the jam.
  Chapters are text only — to see what one looked like on screen, run `jam get
  frames <id> --at <ms>` at a timestamp inside its span; the midpoint reads
  best, because chapter starts are usually transition frames.
- `jam get screenshots <id> --out <dir>` — downloads the Jam's image
  media into `<dir>`. For screenshot Jams that's the primary and
  secondary screenshots; for video and replay Jams it's the poster
  image. Returns a receipt; see `jam agent-context` for the exact shape.
- `jam get frames <id>` — extracts still frames from a video Jam as
  jpgs. Pick frames with `--at <ms>` (single or comma-separated, e.g.
  `--at 4000,7000`), an evenly spaced window with `--from <ms> --to
  <ms> --count <n>`, or `--overview` for one labeled grid spanning the
  whole video (saved as `overview.jpg`) — a good first call to orient
  before drilling into specific times. `--size small|medium|large` sets
  the height (default medium); `--out <dir>` overrides the default
  `./jam-frames/<id>`. Returns a receipt; non-video or out-of-range
  requests print the reason to stderr and exit non-zero.

## Pagination idioms

Paginated commands emit:

```json
{
  "items": [...],
  "next_cursor": "<opaque>" | null,
  "truncated": true | false,
  "hint": "Use --after=<cursor> to fetch the next page."
}
```

Walk all pages by looping until `next_cursor` is null:

```bash
cursor=""
while :; do
  page=$(jam get console "$ID" --limit 500 ${cursor:+--after "$cursor"})
  echo "$page" | jq -c '.items[]'
  cursor=$(echo "$page" | jq -r '.next_cursor // empty')
  [ -z "$cursor" ] && break
done
```

`--limit` caps each page at 500. Defaults: 50 for `get.*`, 20 for `list.*`.

## Listing collections

- `jam list jams [--query] [--type] [--folder] [--author] [--url] [--created-at] [--order-by]` —
  Jams visible to the authenticated team. `--type` accepts
  `screenshot|video|replay|unknown`; `--order-by` accepts
  `createdAt|updatedAt`.
- `jam list folders [--query] [--order-by]` — folders in the team.
- `jam list members [--query]` — team members.

All three paginate identically to the event reads.

## Recording

`jam record` captures a window or the whole desktop and uploads it as a
video Jam. macOS captures through the embedded ScreenCaptureKit helper;
Linux captures through ffmpeg, wmctrl, and xrandr, so it needs an X11
display (Wayland is not supported) and `ffmpeg wmctrl x11-xserver-utils`
installed. The CLI names the exact apt install line when any is missing,
and `jam doctor` reports recording readiness before anything is
attempted. Window
capture on Linux is a screen-region grab: an overlapping window bleeds
into the recording. On macOS a window is captured on its own, so it can
sit behind other windows or be unfocused and still record cleanly, and
the CLI draws a red outline around the recorded window or display on
the user's screen for the length of the recording. The outline is not in
the video, and `--no-outline` hides it. Linux draws no outline.
On Windows, `jam record` exits with a message that it is unsupported.

Both platforms refuse to start on a minimized window (it is not
offered). On macOS the window records whole wherever it sits, including
partly off a display edge; on Linux a window off every display cannot be
grabbed. Both fix the capture area at start, so a window moved or
resized mid-recording leaves the video showing its original spot. During
a recording the platforms differ. On macOS a window that gets minimized
or a display that goes to sleep stops delivering frames, and a recording with no frames fails at stop
with `no frames were captured` instead of uploading an empty Jam; keep
the display awake with `caffeinate -d` for long unattended runs. On
Linux the grab keeps recording the same screen region whatever is on
it, so a minimized or covered window records what replaced it.

- `jam record windows` — list the windows you can record. Each entry has
  a `windowId`, `title`, `app`, `bundleId`, and the owning `pid`. Run
  this first; window IDs change every time a window is reopened, so
  never cache one.
- `jam record displays` — list the displays you can record, with their
  `displayId`s and which one is `primary`.
- `jam record run [command...]` — record until the wrapped command
  exits, or until SIGINT when no command is given: Ctrl-C at a
  terminal, or `kill -INT <pid>` from a script that started it in the
  background. Both forms upload and return `{ id, url,
  durationMs, width, height, target }`, where `target` is `{ windowId,
  app }` or `{ displayId }`, so the recording can be described without
  a second call. The no-command form exits 0; the wrapped form exits
  with the command's code, so a command killed by SIGINT exits 130
  after the upload.

With no selector flag, `run` records the whole screen (the primary
display). Name a window instead with exactly one of `--window-id <id>`,
`--app <name>`, `--bundle-id <id>`, or `--pid <pid>`; name a display
with `--display <id>`. `--app` and `--bundle-id` match
case-insensitively but exactly, and every window selector **fails when
more than one window matches**, listing the candidate IDs — recording
the wrong window is only discovered after the Jam is already uploaded,
so it refuses to guess. Prefer `--window-id` from a fresh `jam record
windows` whenever an app may have several windows open. `--pid` is for
a process you launched yourself: it waits up to five seconds for that
process to open a window, so there is no need to list windows or race
the app's startup. On macOS it also finds a window on another Space; on
Linux the window must be on the current desktop.

`--url <url>` sets the page URL the Jam shows, so the share page and any
integration name the page under test. Without it the Jam shows no URL.
Pass the URL the recorded window is on.

Wrapping a command is the form to reach for in automation, because
nothing has to guess how long the work takes or deliver a signal:

    jam record run --app "Google Chrome" -- bun run e2e/checkout.ts
    jam record run --pid $BROWSER_PID --url https://app.example.com/checkout

Put the command after `--` so its own flags reach it instead of `jam`.
Its output goes to stderr; stdout carries only the Jam receipt. The exit
code is the command's when it fails and the upload's otherwise, so a
failing test run still produces a Jam and still fails the pipeline. If
the upload fails, the mp4 is kept and its path is printed to stderr.

`--title`, `--description`, and `--folder` set those fields at creation
time. You can also leave them off and set them once you have watched the
recording back, with `jam update jam <id> --title ... --description ...`.

Add `--speedup` to compress spans where nothing on screen changes at 64x.
It is off by default and reads only the video's pixels, so a blinking caret
or a spinner keeps its span at normal speed.

## Writes

- `jam create jam '<json>'` — create a Jam from a JSON payload (poster,
  video, replay). Returns `{ id, url, kind }`. Inspect the accepted
  payload shape via `jam agent-context`. Instead of inline JSON you can
  pass `@<path>` to read the payload from a file, or omit the argument
  and pipe it via stdin (`cat jam.json | jam create jam`).
  `--folder <folder>` files the new Jam, taking a folder name, its
  short ID, or its UUID. Pass it or the payload's `folderId`, not both.
  For a video Jam, `"playwrightTracePath"` points at a Playwright `trace.zip`; its
  console, network and user-action events are parsed, redacted, and
  attached to the Jam synced to the video timeline. A trace that can't be
  read is reported on stderr and the Jam is still created, without events.
  Typed text is kept, except on password, one-time-code, credit-card
  and sensitively named fields, and on text that resolved to no field
  at all, where it reads `***`.
  `--speedup` edits the video using that same trace, so it needs
  `"playwrightTracePath"` set. Record the trace with screenshots and
  snapshots enabled, the browser context using `recordVideo`, and tracing
  started before the recorded page is created. The trace's events are
  re-timed to match a sped-up video.

  Run `jam create jam @jam.json --speedup`.
- `jam create comment <jamId> <body> [--at <ms>]` — add a comment.
  `<body>` is Markdown. `--at` pins the comment to a video timestamp
  in milliseconds. Returns the comment `id` — keep it if you might
  revise the comment later.
- `jam update comment <commentId> <body>` — rewrite a comment you
  authored. The new `<body>` replaces the old one entirely, so correct a
  note instead of stacking a follow-up comment. You can only edit your
  own comments. `<commentId>` also accepts the share URL the create call
  printed.
- `jam create reaction <commentId> <emoji>` — react to a comment, e.g. to
  ack one you've already acted on. Works on anyone's comment.
- `jam delete reaction <commentId> <emoji>` — take back your reaction.
  Only yours; other people's reactions with that emoji stay.
  Both take one of 🐛 💜 ✅ 👀 ❓ 👏 🔥 👍 and are idempotent.
- `jam update jam <id> [--title <title>] [--description <text>]
  [--folder <folder>]` — rename a Jam, rewrite its description, or move
  it to a folder. Pass at least one flag; only the fields you pass change.
  `--folder` takes a folder name, its short ID, or its UUID; pass
  `--folder ""` to remove it from its current folder. `--description`
  is Markdown, and an `@mention` of a teammate's email notifies them.
  Editing the title or description needs an Admin or Creator role.
- `jam create folder <name>` — create a folder. Returns
  `{ id, shortId, name }`, so you can file a Jam into it right away with
  `jam update jam <id> --folder <folder>`. Names are not unique — run
  `jam list folders` first if you meant to reuse an existing folder.
- `jam update folder <folder> --name <name>` — rename a folder.
  `<folder>` is a name, short ID, or UUID. The short ID does not change.

## Deletes

Every `jam delete ...` command asks for confirmation first. There is no TTY
to ask on when output is piped, so an agent must pass `--yes` — without it
the command refuses and exits non-zero rather than guessing.

- `jam delete jam <id> --yes` — delete a Jam: it leaves the team's lists and
  search, and nobody on the team can bring it back. Never tell the human the
  Jam can be restored afterwards — the dashboard has no trash or archive view.
  The receipt says `archived: true`; that is the field name the CLI has always
  returned, not a claim that the Jam is recoverable.
- `jam delete comment <commentUid> --yes` — delete a comment. Only the
  comment's own author can, and it takes the attachments with it. The id is
  the `id` field `jam create comment` returns; there is no command that lists
  comments you didn't write.
- `jam delete folder <id> --yes` — delete a folder and every Jam inside it,
  none of them restorable. The receipt reports `archivedJamCount` so you can
  see how many went with it. Find ids with `jam list folders`.

Confirm with the human before passing `--yes` on their behalf.

## Recording links

A recording link is a shareable URL that collects Jams: anyone who opens it
records and submits a Jam back to the team. A link captures console/network
logs only when it records from a *connected domain* (a "recording URL"), so
create links against a connected domain when you want logs. Every command
addresses a link by its `publicId`.

Reads:

- `jam recording-links list [--limit] [--after]` — the team's recording
  links, newest first.
- `jam recording-links get <id>` — a single link by public ID.
- `jam recording-links jams <id> [--limit] [--after]` — the Jams recorded
  through a link.
- `jam recording-links urls` — the team's connected recording domains.

Writes:

- `jam recording-links create --name <name> [--recording-url-id <id>] [--folder <f>] [--jam-title <t>] [--reference <r>] [--expires-at <iso8601>] [--metadata <json>]` —
  create a link. Pass `--recording-url-id` (from `urls`) so recorded Jams
  capture logs.
- `jam recording-links update <id> [--name] [--folder] [--reference] [--jam-title] [--expires-at] [--metadata]` —
  edit a link's settings.
- `jam recording-links delete <id>` — soft-delete: the link stops accepting
  recordings, already-collected Jams stay.
- `jam recording-links verify <url> [--wait]` — verify a connected domain
  (assisted; a human opens the returned link). `--wait` polls until verified.

`list`, `jams`, and `urls` paginate with the same `--after` / `next_cursor`
idiom as the event reads.

Workflow: run an intake link end to end.

1. `jam recording-links urls` — find the connected domain to record from.
2. `jam recording-links create --name "Support intake" --recording-url-id <url-id> --folder "Bug reports"` —
   create the link, then share the returned URL.
3. `jam recording-links jams <id>` — later, list the Jams collected through it.
4. `jam recording-links delete <id>` — stop accepting new recordings when done.

## Output mode

`jam` auto-detects output: pretty-prints when stdout is a TTY, emits
compact JSON when piped. Force JSON in all contexts with the top-level
`--json` flag. Machine consumers (agents, scripts) should pass `--json`
so output stays parseable regardless of where it runs.

## Exit codes

| Code | Name        | When                                                   |
| ---- | ----------- | ------------------------------------------------------ |
| 0    | success     | command completed                                      |
| 1    | generic     | unclassified error                                     |
| 2    | usage       | invalid flag or argument shape (Commander-level)       |
| 3    | auth        | not authenticated or token rejected (HTTP 401/403)     |
| 4    | not_found   | resource missing (HTTP 404)                            |
| 5    | validation  | enum/int validation failed                             |
| 6    | server      | upstream returned 5xx                                  |
| 7    | rate_limited| the API refused the call; wait a minute, then retry    |

In JSON mode, errors print to stderr as
`{"error":{"code":"...","message":"..."}}`. `valid_values` is included
on validation errors when applicable. The exit code is authoritative —
branch on it, not on stderr parsing.

## Workflow: triaging a bug report

A common composition when handed a jam.dev link:

1. `jam get jam <id>` — confirm the recording exists, see what kind it is.
2. `jam get intents <id>` — structured summary if one is available.
3. `jam get console <id> --level error` — surface JS errors first.
4. `jam get network <id> --status 5xx` — find failing backend calls.
5. `jam get transcript <id>` — if a video, read what the reporter said.
6. `jam get metadata <id>` — pull any SDK-emitted reproduction context.
7. `jam create comment <id> "..." --at <ms>` — leave findings on the recording.

Stop as soon as you have what you need — don't fetch everything by reflex.

## Workflow: finding a Jam to act on

When you don't have a specific id but know the user or URL:

1. `jam list jams --query "<term>" --limit 20` — search by title/URL.
2. `jam list jams --url "<u>" --order-by createdAt` — filter by recorded URL.
3. `jam list jams --author "<id>" --order-by updatedAt` — recent work
   by a specific teammate (find ids with `jam list members --query`).

## Common mistakes

- **Branching on stderr text instead of exit codes.** Error messages
  are for humans; the exit code is the contract. Compare against the
  table above (3 = auth, 4 = not_found, 5 = validation, 6 = server,
  7 = rate_limited).
- **Treating `intents.status == "not_requested"` as an error.** It
  means no summary is available for this Jam — handle it the same as
  "intents not available," not as a failure.
- **Assuming `get metadata` returns browser/OS/viewport.** It returns
  only the structured key/value events the recorded app emits via the
  `jam.metadata()` SDK call. Many Jams have none.

## Discovery

- `jam --help` — top-level command list.
- `jam <subcommand> --help` — flags and arguments for a specific command.
- `jam agent-context` — machine-readable surface (preferred for tools).
- `jam doctor` — CLI channel, API/update URLs, version, and auth status.
  Reach for this first when reads fail unexpectedly (wrong channel, stale
  binary, or expired credentials).
- `jam skills list` — bundled skills available to install.
- `jam skills source` — absolute path to this file.
- `jam skills path [--target <agent>] [--project]` — where skills would be
  installed for the target agent (`claude`, `cursor`, `codex`, `opencode`).
- `jam skills install [name] [--target <agent>] [--project] [--dir <path>]` —
  drop the skill into the target AI assistant's directory. Detection uses
  agent env vars (`CLAUDECODE`, `CURSOR_AGENT`, `CODEX`, `OPENCODE`), then
  marker dirs, then defaults to `claude`. Default scope is user-global;
  pass `--project` for repo-local install.
