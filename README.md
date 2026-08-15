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

## Layout

The first screen is a viewfinder laid out like the iOS Camera app: the preview spans the **full
screen width** so a body renders at the same scale the system camera shows it, with a shutter
band at the bottom in the same place iOS puts it. Grid / Diff / Timer sit as chips over the top
of the preview. Everything else — frame, ghost fade, ghost zoom, mirror, session shots — is one
scroll down.

## Use

1. Tap **+** to pick the pose you want to copy.
2. Drag the ghost to position it. Use the **Zoom** slider (or pinch, or scroll) to size it to
   your framing, and **Flip ghost** to mirror it.
3. Set the ghost opacity (45% is a good default).
4. Pick a frame — **9:16 fit** (default), **Full**, **4:5**, **1:1** or plain **9:16**.
   Only plain 9:16 is narrower than the sensor, so it is the only one that trims width and the
   only one that looks zoomed; **9:16 fit** gives the same story-shaped file by padding with
   black bars instead. The settings panel reports the live sensor size and exactly how much
   field of view the current frame keeps.
5. Pick a timer, prop the phone up, get into the pose.
6. Shoot, compare against the inspo, download.

On desktop the same page becomes a two-column layout with a sidebar; extra controls are behind
**More** on phones and always visible on desktop.

### Shortcuts (desktop)

`space` shoot · `m` mirror · `g` grid · `[` `]` opacity · `-` `+` zoom · `r` reset ghost ·
`esc` close compare

## Design notes

- **The saved photo is the clean camera frame.** The ghost is guidance only and is never burned
  in — the goal is your own photo in that pose.
- **The stage box IS the crop.** The video covers a box sized to the chosen aspect, and capture
  reproduces that exact crop from the source frame, so what you framed is what you get.
  Verified across 42 source-size/aspect combinations.
- **Mirroring is WYSIWYG.** If the preview is mirrored, the saved frame is too. Un-mirroring on
  save would flip the pose relative to the ghost you just matched yourself against.
- **Only the long axis is constrained** when requesting the camera. Asking for `1080x1920` pins a
  9:16 shape, and the browser satisfies that by cropping the sensor before the frame ever reaches
  the page — field of view lost for the whole session, which no later change of frame can undo.
  Leaving the aspect free hands us the native frame to crop from ourselves.
- Output lands on native sizes: 1080×1920 (9:16), 1080×1350 (4:5), 1080×1080 (1:1).
- Rear camera un-mirrors automatically, since mirroring is a selfie convention.
- **Ghost zoom is log-mapped** (20%–500%). On a linear track 100% would sit at 17% along the
  bar; log-mapped it lands dead centre and zooming in and out are mirror images. The slider,
  pinch and scroll all drive one value and stay in sync.

## Known limits

- Needs https or localhost. Browser security rule, no way around it.
- Shots live in memory for the session only — download the ones you want to keep.
- The ghost can be moved, scaled and flipped, but not rotated.
