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
   black bars instead.
5. Pick a timer, prop the phone up, get into the pose.
6. Shoot. The gallery opens with your shot beside the inspo; frame it or download it.

On desktop the same page becomes a two-column layout with a sidebar; extra controls are behind
**More** on phones and always visible on desktop.

### Shortcuts (desktop)

`space` shoot, or return to the camera from the gallery · `m` mirror · `g` grid ·
`[` `]` opacity · `-` `+` zoom · `r` reset ghost

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

## Comparing

There is no separate compare screen. The shot sits at the top of the gallery, above the frame rail
and the roll, in one of three states:

| compare | superimpose | what you see |
|---|---|---|
| off | off | your photo on its own |
| **on** | off | the inspo and your photo side by side |
| either | **on** | the inspo laid over your photo at 50% |

The two buttons are toggles, so pressing the lit one drops back to the photo alone. They are
mutually exclusive in effect — superimposing means showing both, so it supersedes side by side
rather than combining with it.

Taking a shot with an inspo loaded lands in **compare**, with that button lit. Download is
deliberately not the lit button: the thing worth doing next is looking at how close you got.

Both are laid out in the same box, so the reference and the shot are letterboxed identically and
the poses line up when stacked. With no inspo loaded there is nothing to compare against, so both
buttons grey out.

Tapping any shot in the roll brings it up top, so an older frame can be compared too, not just
the newest.

## Frames

Nine of them: three digicams (a pink Canon, a silver Canon with a lucky-star charm, a pink Sony
with Hello Kitty), three polaroids (strawberries on cream, blue gingham, lilac gingham) and three
photostrips.

They all sit on **one rail** in the gallery, grouped by family and set at a single thumbnail
height so a wide digicam and a tall photostrip read as the same kind of thing. The rail breaks out
of the settings column's 620px and scrolls sideways on a narrow screen; the track is
`width: max-content` with auto margins, which centres the set when it fits and still scrolls from
the start when it does not — something `justify-content: center` cannot do.

Hovering a frame previews it over your photo before you commit.

A **frame as you shoot** toggle also composites the shot into the first frame at capture time. The
live preview stays full size either way, because shrinking it to the frame's window would undo the
whole point of matching your outline at real scale.

The photo goes BEHIND the artwork and shows through a transparent window punched in the PNG, so
the hole's own shape decides the output and the frame-shape chips do not apply.

### Orientation

The frame turns itself. All three cameras have landscape screens, so a landscape photo drops
straight in, and a portrait photo turns the camera 90 degrees — which is what you physically do
with a digicam to shoot portrait. A square photo leaves the frame upright.

Which way it turns is per frame. Clockwise suits a digicam, putting its controls at the bottom;
the polaroids carry `turn: 'ccw'` so their wide border lands on the right rather than the left. The
two directions map the window differently — `(x, y) -> (1 - y, x)` clockwise, `(x, y) -> (y, 1 - x)`
counter-clockwise — so this is not just a sign flip on the artwork.

There is nothing to set. `composeFrame` compares the frame's own window to the photo:

```js
const winHoriz = (WIN.x1 - WIN.x0) * upW > (WIN.y1 - WIN.y0) * upH;
const frameHoriz = sw !== sh && (sw > sh) !== winHoriz;
```

This has to compare the two rather than just asking "is the photo landscape". `digicam1.png` was
originally stored on its side, giving it a portrait window while the others were landscape; a rule
written around one of those shapes silently mis-rotates the other.

The long side is capped at 1920 rather than the width, or a turned frame would come out smaller
than an upright one and lose window resolution. The artwork is 782-952px natively and softens past
about 2.3x, which is what sets that cap.

### How the artwork was cut

Backgrounds come off by flood-filling **inward from the border**, never by keying a colour
globally: the artwork contains enclosed regions the same colour as the background — the window
itself, the I-HEART-YOU sticker, metal highlights — that a global key would punch holes through.

Two frames needed opposite handling, and connectivity is what reconciles them:

- The silver Canon's screen is the same 247 grey as its background, so no brightness test can find
  it. Being unreachable from the edge is what identifies it.
- Two polaroids arrived with their windows already punched; the strawberry one was a JPEG whose
  window is the same pure white as its background. Same test either way: the largest enclosed
  blob, transparent or white.
- The pink Sony's bow is `(123,112,115)` against a `128` grey. A tolerance loose enough to clear
  the anti-aliased rim ate the bow, Hello Kitty and the charm — so the core fill is tight and a
  two-pixel feather under a looser rule cleans the rim afterwards.

The window is then the largest enclosed blob, picking between colour rules by **rectangularity**,
since a screen is a rectangle and that is the reliable discriminator. Alpha is eroded 1px to kill
the halo left by JPEG edge blending, and the compositor draws the photo 2px oversized so it tucks
under that edge instead of leaving a gap.

### After the fact

Every frame can also be applied to a shot you have already taken — the rail sits in the gallery
that opens after each capture, so you do not have to decide before shooting.

One wrinkle worth knowing: the window is 0.747, not exactly 3:4, so re-framing a letterboxed
9:16 shot would catch a ~4px sliver of its own black bar at each end. Post-capture framing nudges
the crop inward 1.5% to clear it.

## Photostrips (three shots)

Three designs: a red card with Snoopy and a MEMORIES plate, a white strip with black bows, and a
clipboard. Take some shots, then in the gallery tap three photos in the order you want them
top-to-bottom and pick a strip. An editor opens where each photo can be **dragged within its slot**
and scrolled/pinched to zoom. **Save to gallery** adds the finished strip as a downloadable item.

The dragging is not a nicety. The slots are close to square (0.95-1.29) and your shots are
portrait, so a centred crop throws away a lot of height — enough to lose your head or your legs.
Repositioning is how you choose what survives.

Output is 2048px on the long side, PNG, transparent.

### How the artwork was cut

Backgrounds come off the same way as the frames, but a strip needs **three rotated quads** rather
than one window, and the three designs disagree about almost everything:

| | background | slots | tilt |
|---|---|---|---|
| 01 | flat grey, opaque | solid white | 0.6 deg |
| 02 | already transparent | already punched | +7.1 deg |
| 03 | already transparent | solid **black** | -7.5 deg |

So the cutter tries each tone — punched, white, black — and keeps whichever rule yields **three
regions of matching size**. That last part is the real test: a strip has exactly three slots and
they are the same size as each other, which no stray highlight or shadow will imitate. Sizes came
out within 1.08x, 1.01x and 1.00x across the three designs.

Each slot is then fitted with a **min-area rectangle**, searching a quarter-degree at a time for
the angle whose bounding box is smallest, and reported in the same convention the canvas uses:

```js
ctx.translate(q.cx * stripW, q.cy * stripH);
ctx.rotate(q.deg * Math.PI / 180);
```

The holes themselves are an **exact pixel mask** baked into the PNG. The quads only decide each
photo's framing and tilt, so small errors there are invisible — the artwork masks the edges either
way.

## Opening it

The page loads to a single camera, centred on black. It grows on hover; clicking it flashes and
reveals the app. That is not only decoration — the webcam now starts from a real click rather
than on page load, which some browsers require and all of them handle more gracefully.

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
- Frame resolution is limited by the source artwork (407-952px natively).
- All nine frame PNGs (~2.4MB together) load on every visit, used or not.
- Strip slots are 230-440px in the source art, so they cap how sharp each photo can be.
