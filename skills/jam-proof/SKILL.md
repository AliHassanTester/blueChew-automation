---
name: jam-proof
description: Record work you can see on screen with `jam record` and publish it as a Jam link — proof that a change works, attached to a PR or ticket. Use when the user wants proof, evidence, a demo, sign-off, or a shareable Jam of something an agent or a person just did in any app, browser or not.
---

# jam-proof

The deliverable is a Jam link. Record the window while the verification
happens, then hand the link back. Every `jam` command needs a session: run
`jam auth status` first. If it reports that the session is missing, invalid, or
expired, run `jam auth login`, or `jam auth login --token` with a PAT on stdin
`jam-cli` skill covers the rest of the command surface.

Use it when a change is visible on screen and someone wants proof: a web
page, a desktop app, a terminal running a CLI. Skip it when there is nothing
to show on screen, and say so.

## Pick the target

- **A machine someone else is using** (a laptop, a shared desktop): record one
  window. Launch your own instance of the app, in a fresh profile or data dir
  when it has one, so nothing of theirs appears and the person keeps working.
  Select it with `--pid <pid>` of the process you launched: it waits up to five
  seconds for the window to open, so there is no need to list windows or race
  the app's startup. For a window you did not launch, pick its id from
  `jam record windows --json` and pass `--window-id`. On macOS launch the app
  with `open -g` so it never takes focus. Drive it through its own automation
  surface, not the OS mouse, so the cursor is never taken from the person. For
  a browser that is CDP or the DOM; Chromium 136 and later refuses
  `--remote-debugging-port` on its default profile, so pass `--user-data-dir`.
- **A box you own** (a CI runner, a container, a remote Linux desktop):
  `--display` is fine (`jam record displays --json` lists them). There is
  nothing else on the screen.

On macOS the window may sit behind other windows; on Linux a window grab is
a screen region, so keep it uncovered. It must not be minimized, and the
display must not sleep.

## Bound the recording

`jam record run` records until the wrapped command exits. Wrap the
verification:

```
jam record run --pid <pid> --url <page url> --title "<the claim>" --json -- <verify command>
```

`--url` is the page the window shows; the share page names it.

When you drive the app yourself and cannot be wrapped, run it in the
background and send SIGINT when done. It stops, uploads, and exits 0 with the
receipt on stdout.

```
jam record run --pid <pid> --url <page url> --title "<the claim>" --json > proof.json 2> proof.log &
REC=$!
# drive the steps that show the behavior
kill -INT $REC; wait $REC
```

## Make it readable

- Start from a known state: reload the page, restart the app, clear the
  terminal.
- Hold about a second on the state that matters.
- Keep it short. Thirty seconds that show the behavior beat five minutes.
- Title is the claim: "Deep link scrolls to comment 6", not "proof".
- Steps and expected result go in `--description`.

## Before and after

For a bug fix, make two Jams: the bug, then the fix. Revert, reload, record;
re-apply, reload, record. Skip the first when there is no meaningful before
(a new feature, a config change) and say why.

## After

1. Read the receipt: `id`, `url`, `durationMs`, `width`, `height`, and the
   recorded `target`. If the capture or upload failed, say so. Never claim
   proof you do not have.
2. Add one comment at the moment the result appears:
   `jam create comment <jamId> "<what to look at>" --at <ms>`. On a fix Jam,
   put the bug Jam's URL in that comment, and the fix Jam's URL in the bug
   Jam's comment.
3. Return the links: Bug | Fix, or one link with the claim it supports. Post
   the same on the PR when there is one.
