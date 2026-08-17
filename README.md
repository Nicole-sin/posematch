# Pose Match

Upload a photo of a pose you want to copy. It floats over your live camera as a translucent
"ghost" so you can line yourself up, then you shoot. Phone-first, no dependencies, no build
step — just `index.html` plus one image asset. Nothing is ever uploaded; everything stays on
device.

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
4. Pick a frame. The default depends on the device: **phones start on 9:16 fit** (tall, story
   shaped) and **laptops start on Full** (the webcam's own shape, which is landscape and would be
   badly cropped by a tall window). The other options are **4:5**, **1:1** and plain **9:16**.
   Only plain 9:16 is narrower than the sensor, so it is the only one that trims width and the
   only one that looks zoomed; **9:16 fit** gives the same story-shaped file by padding with
   black bars instead. The settings panel explains what the current frame
   costs you in field of view.
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

## Digicam frame

A **Digicam frame** toggle in the settings panel, on phone and desktop alike. It composites the
shot into the pink Canon artwork at capture time only — the live preview stays full size, because
shrinking it to the frame's window would undo the whole point of matching your outline at real
scale.

The artwork is 9:16 overall with a **3:4 window**, which happens to be exactly the front camera's
shape, so the photo drops in with **no crop and no zoom** — the frame supplies the story shape
that a 9:16 crop would otherwise have to carve out of your field of view. Because of that, the
framed capture ignores the frame-shape chips and always uses the window's own 3:4.

**Vertical / Horizontal** turns the digicam 90 degrees. The window turns with it, so the shape
of the hole follows the shape of the photo:

| | output | window | keeps of a 16:9 webcam |
|---|---|---|---|
| Vertical | 1081x1920 | 458x613 (3:4) | 42% |
| Horizontal | 1920x1081 | 613x458 (4:3) | 75% |

A phone's 3:4 front camera fills either window with no loss of width — vertical is an exact
match for it, horizontal simply trims top and bottom.

Horizontal suits a laptop, whose webcam is landscape — an upright window has to discard well over
half its width to fill a 3:4 hole. It also reads more naturally, since the artwork is a landscape
camera that was photographed turned upright; rotating it back puts the Canon branding the right
way up. The photo inside stays upright either way.

The long side is capped at 1920 rather than the width, or the rotated frame would come out
smaller than the upright one and lose window resolution. The artwork is only 474px natively and
softens past ~2.3x, which is what sets that cap.

`frame.png` was cut from a JPEG by flood-filling white **inward from the border** rather than
keying all white — the artwork contains 104 enclosed white regions (the window, the I-HEART-YOU
sticker, metal highlights) that a global key would have punched holes through. The alpha is
eroded 1px to kill the halo left by JPEG edge blending, and the compositor draws the photo 2px
oversized so it tucks under that edge instead of leaving a gap.

## Photostrip (three shots)

Take some shots, then **Make photostrip** in the session gallery. Tap three in the order you
want them top-to-bottom, hit **Make strip**, and an editor opens where each photo can be
**dragged within its slot** and scrolled/pinched to zoom. **Save to gallery** adds the finished
strip as a downloadable item.

The dragging is not a nicety. The slots are landscape (~1.44) and your shots are portrait, so a
centred crop keeps only ~52% of the height — enough to lose your head or your legs. Repositioning
is how you choose what survives.

Output is 1640x2048 PNG, transparent, with slots around 368x248.

### How the artwork was cut

Same border-flood-fill idea as the digicam, with two differences:

- The background is **cream**, not white, and the ticket stub is cream too — connectivity is what
  keeps the stub while removing the surround.
- There is a **drop shadow**, which the fill will not remove because it is darker than the
  background. It is matted instead: shadow pixels are stored as **black with alpha set by how much
  they darken the cream**, so they darken whatever is behind them rather than pasting a grey smear
  onto a non-cream background.

The three slot holes are punched as an **exact pixel mask**, not rectangles. The rotated quads
(measured at about -7 degrees by a min-area-rect fit) only decide each photo's framing and tilt,
so small errors there are invisible — the artwork masks the edges regardless.

## Look

2000s compact-camera photobooth. Black, white and silver, with colour used only where a camera
uses it: **red** for the record dot, **amber** for the burned-in date stamp, **green** for focus
lock. Nothing else on the page is saturated.

Camera furniture rather than retro filters — focus brackets in the viewfinder corners, a live
date stamp, frame counter, battery, exposure readout, and sequential filenames (`IMG_0043.JPG`)
that follow each shot through the contact sheet, the compare view and the download. The whole
interface is set in monospace — not just the camera metadata — which pushes it further toward a
camera menu and away from a website.

Capture is a mirror slap (a black beat, which is what actually reads as a shutter) then the
flash, with the focus brackets snapping green. Frames arrive over-exposed and blurred and settle
over ~0.8s, the way a photo develops. The session gallery is a contact sheet: frames sit slightly
off-square the way prints do in a sleeve, straighten on hover, and draw a focus box when you
point at one. Grain sits over everything at 5%.

## Controls

Three kinds of control, three appearances — the panel used to render all three identically,
which is what made it read as generic:

- **Segmented** (`.seg`) for mutually exclusive choices — frame shape, digicam orientation. A
  camera menu strip: square, divided, with the active item **inverted** rather than tinted.
- **Toggle** (`.toggle`) for independent on/off — mirror, screen flash, digicam frame,
  superimpose. A bevelled key: light top edge, dark bottom edge, lit silver when on.
- **Action** (`.act`) for things that do something. Flat plate, no fill until pressed. Exactly
  one `.primary` is lit at a time.

All of them are uppercase monospace with wide tracking, 3px corners, and a real 1px travel on
press that collapses the shadow — compact-camera menu furniture rather than web buttons.

Note for anyone editing the CSS: `font: 600 13px/1 inherit` is **invalid**. A CSS-wide keyword is
not a legal family name inside the `font` shorthand, so the whole declaration is dropped and the
element silently falls back to the UA font. Every button in the app was doing this. Use
`var(--mono)` explicitly.

## Known limits

- Needs https or localhost. Browser security rule, no way around it.
- Shots live in memory for the session only — download the ones you want to keep.
- The ghost can be moved, scaled and flipped, but not rotated.
- The digicam frame's resolution is limited by the source artwork (474px natively).
- `frame.png` (228KB) and `photostrip.png` (220KB) both load on every visit, used or not.
- The photostrip slots are ~184x124 in the source art, so they cap how sharp each photo can be.
