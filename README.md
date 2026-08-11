# Pose Match

Upload a photo of a pose you want to copy. It floats over your live camera as a translucent
"ghost" so you can line yourself up, then you shoot. Phone-first, single self-contained HTML
file, no dependencies, no build step. Nothing is ever uploaded — everything stays on device.

## Use it on your phone

Camera access requires **https**, so the easiest route is GitHub Pages:

1. Push this repo to GitHub.
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `root`.
3. Open the `https://<user>.github.io/posematch/` URL on your phone and allow the camera.

Add it to your home screen for a fullscreen, app-like version.

**Locally** (`http://localhost` also counts as secure):

    python3 -m http.server 8000

`file://` will not work — browsers block the camera on it. The app says so if you try.

## Use

1. Tap **+** to pick the pose you want to copy.
2. Drag the ghost to position it, pinch to resize, **Flip ghost** to mirror it.
3. Set the ghost opacity (45% is a good default).
4. Pick an output shape — **9:16**, **4:5**, **1:1**, or **Full** (the camera's own).
5. Pick a timer, prop the phone up, get into the pose.
6. Shoot, compare against the inspo, download.

On desktop the same page becomes a two-column layout with a sidebar; extra controls are behind
**More** on phones and always visible on desktop.

### Shortcuts (desktop)

`space` shoot · `m` mirror · `g` grid · `[` `]` opacity · `r` reset ghost · `esc` close compare

## Design notes

- **The saved photo is the clean camera frame.** The ghost is guidance only and is never burned
  in — the goal is your own photo in that pose.
- **The stage box IS the crop.** The video covers a box sized to the chosen aspect, and capture
  reproduces that exact crop from the source frame, so what you framed is what you get.
  Verified across 42 source-size/aspect combinations.
- **Mirroring is WYSIWYG.** If the preview is mirrored, the saved frame is too. Un-mirroring on
  save would flip the pose relative to the ghost you just matched yourself against.
- **Portrait is requested from the camera** when the screen is portrait, so a phone hands back a
  tall stream instead of a wide one that would be mostly cropped away.
- Output lands on native sizes: 1080×1920 (9:16), 1080×1350 (4:5), 1080×1080 (1:1).
- Rear camera un-mirrors automatically, since mirroring is a selfie convention.

## Known limits

- Needs https or localhost. Browser security rule, no way around it.
- Shots live in memory for the session only — download the ones you want to keep.
- The ghost can be moved, scaled and flipped, but not rotated.
