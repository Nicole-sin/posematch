# Pose Match

Upload a photo of a pose you want to copy. It floats over your live camera as a translucent
"ghost" so you can line yourself up, then you shoot. Single self-contained HTML file.

## Run

Camera access requires a **secure context**, so opening the file directly from disk
(`file://`) will not work — the browser blocks the camera before it even asks. Serve it:

    cd posematch
    python3 -m http.server 8000

Then open <http://localhost:8000>.

## Use

1. Drop, paste, or pick your inspo photo.
2. Drag the ghost to position it; scroll or pinch to resize; **Reset fit** to start over.
3. Set opacity to taste (45% is a good default).
4. Pick a timer — you can't hold a pose and press a button at the same time.
5. Shoot, then compare against the inspo and download.

### Shortcuts

`space` shoot · `m` mirror · `g` grid · `[` `]` opacity · `r` reset ghost · `esc` close compare

## Design notes

- **The saved photo is the clean camera frame.** The ghost is guidance only and is never burned
  in — the goal is your own photo in that pose.
- **Mirroring is WYSIWYG.** If the preview is mirrored, the saved frame is too. Un-mirroring on
  save would flip the pose relative to the ghost you just matched yourself against.
- **The stage is sized from the true frame aspect**, so nothing is cropped between preview and
  output and the capture is pixel-for-pixel what was on screen.
- **Difference blend** is the best alignment aid: areas that match turn black.
- Rear camera un-mirrors automatically, since mirroring is a selfie convention.

## Known limits

- Needs `localhost` or https. No way around it — that's a browser security rule.
- Shots live in memory for the session only; download the ones you want to keep.
- The ghost cannot be rotated, only moved, scaled and flipped.
