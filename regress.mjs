// Drives the real page script through the capture -> gallery -> frame -> strip
// flow in a stubbed DOM.
// Exists because the strip path is unreachable without a camera and a browser,
// and it silently did nothing for weeks: stripW/stripH/stripView were assigned
// but never declared, which under 'use strict' is a ReferenceError that killed
// openStripEditor on its first line.
//   node regress.mjs
// actual strip path under 'use strict', which is where the bug lived.
import fs from 'fs';
import vm from 'vm';

const html = fs.readFileSync(process.env.PAGE || '/Users/nicolesin/posematch/index.html', 'utf8');
const js   = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const ids  = [...html.split('<body>')[1].split('<script>')[0].matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);

const painted = [];                       // every drawImage the strip canvas sees
let blobSeq = 0;

const mkCtx = owner => new Proxy({}, { get: (_, k) => {
  if (k === 'drawImage') return (...a) => { if (owner.id === 'strip-canvas') painted.push(a.length); };
  if (k === 'canvas') return owner;
  return () => {};
}});

function mkEl(tag = 'div', id = '') {
  const el = {
    tagName: tag.toUpperCase(), id, nodeType: 1, children: [], style: {}, dataset: {},
    hidden: false, disabled: false, _text: '', src: '', alt: '', title: '',
    width: 0, height: 0, naturalWidth: 800, naturalHeight: 1200, complete: true,
    value: '', checked: false, _cls: new Set(), _ev: {},
    classList: {
      add: (...c) => c.forEach(x => el._cls.add(x)), remove: (...c) => c.forEach(x => el._cls.delete(x)),
      toggle: (c, f) => f ? el._cls.add(c) : el._cls.delete(c), contains: c => el._cls.has(c),
    },
    setAttribute(){}, removeAttribute(){}, getAttribute: () => null, focus(){}, blur(){}, remove(){},
    append: (...n) => el.children.push(...n), appendChild: n => (el.children.push(n), n),
    addEventListener: (t, f) => (el._ev[t] ||= []).push(f),
    removeEventListener(){}, dispatchEvent(){},
    click: () => (el._ev.click || []).forEach(f => f({ preventDefault(){}, stopPropagation(){}, pointerType: 'mouse' })),
    getBoundingClientRect: () => ({ x:0, y:0, left:0, top:0, right:100, bottom:100, width:100, height:100 }),
    getContext: () => mkCtx(el),
    toBlob(cb) { cb({ size: 4096, type: 'image/png', _n: ++blobSeq }); },
    closest: () => null, contains: () => false, scrollIntoView(){},
    querySelector: s => reg[s.replace(/^[.#]/, '')] || mkEl(),
    querySelectorAll: () => [],
    get textContent(){ return el._text; },
    set textContent(v){ el._text = v; if (v === '') el.children = []; },  // as the DOM does
    get firstChild(){ return el.children[0] || null; },
    set innerHTML(_) { el.children = []; }, get innerHTML(){ return ''; },
  };
  return el;
}

const reg = {};
ids.forEach(i => reg[i] = mkEl('div', i));
// the frame-group sections the picker walks
const groups = ['digicam', 'polaroid', 'strip'].map(fam => {
  const g = mkEl('div'); g.dataset.fam = fam;
  const box = mkEl('div'); g.querySelector = () => box; g._box = box;
  return g;
});

const doc = {
  getElementById: i => reg[i] || null,
  createElement: t => mkEl(t),
  querySelector: s => reg[s.replace(/^[.#]/, '')] || mkEl(),
  querySelectorAll: s => s.includes('frame-group') ? groups : [],
  addEventListener(){}, removeEventListener(){},
  body: mkEl('body'), documentElement: mkEl('html'),
  createDocumentFragment: () => mkEl(), hidden: false, visibilityState: 'visible',
  fonts: { ready: Promise.resolve() },
};

class FakeImage {
  constructor() { this.naturalWidth = 800; this.naturalHeight = 1200; this.complete = true; this._ev = {}; }
  addEventListener(t, f) { (this._ev[t] ||= []).push(f); if (t === 'load') queueMicrotask(() => f()); }
  removeEventListener(){}
  set src(v) { this._src = v; queueMicrotask(() => { this.onload && this.onload(); (this._ev.load||[]).forEach(f=>f()); }); }
  get src() { return this._src; }
}

const win = {
  addEventListener(){}, removeEventListener(){}, scrollTo(){},
  innerWidth: 1440, innerHeight: 900, devicePixelRatio: 2,
  matchMedia: () => ({ matches: false, addEventListener(){}, addListener(){} }),
  requestAnimationFrame: f => setTimeout(f, 0), cancelAnimationFrame(){},
  location: { protocol: 'http:', hostname: 'localhost', href: 'http://localhost/' },
};

const sandbox = {
  document: doc, window: win, Image: FakeImage, console,
  setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask,
  requestAnimationFrame: win.requestAnimationFrame, cancelAnimationFrame(){},
  addEventListener(){}, removeEventListener(){}, scrollTo(){},
  innerWidth: win.innerWidth, innerHeight: win.innerHeight, devicePixelRatio: 2,
  matchMedia: win.matchMedia, location: win.location,
  navigator: { mediaDevices: { getUserMedia: () => Promise.reject(new Error('no camera in harness')),
                               enumerateDevices: () => Promise.resolve([]) },
               userAgent: 'harness', maxTouchPoints: 0, clipboard: { write: () => Promise.resolve() } },
  URL: { createObjectURL: b => 'blob:shot-' + (b._n ?? ++blobSeq), revokeObjectURL(){} },
  Blob: class { constructor(){ this.size = 1; } },
  performance: { now: () => 0 },
  Math, JSON, Date, Promise, Array, Object, String, Number, Boolean, Set, Map,
  isNaN, parseInt, parseFloat, Error, TypeError, RangeError, encodeURIComponent,
  MouseEvent: class {}, PointerEvent: class {}, Event: class {},
};
sandbox.__painted = painted;
sandbox.globalThis = sandbox; sandbox.self = sandbox; sandbox.top = sandbox;
const declaredish = new Set(Object.keys(sandbox));
const seen = new Set();
const guard = new Proxy(sandbox, {
  has: () => true,
  get: (t,k) => t[k],
  set: (t,k,v) => { if (typeof k === 'string' && !declaredish.has(k) && !k.startsWith('__')) seen.add(k); t[k]=v; return true; },
});
globalThis.__seen = seen;
const ctx = vm.createContext(guard);


const ART_DIMS = { dg1: [842, 474], dg2: [782, 501], dg3: [952, 652], po1: [817, 1121], po2: [456, 695], po3: [412, 628], st1: [777, 1509], st2: [392, 1090], st3: [532, 1463] };
const DRIVER = `
const ART_DIMS = ${JSON.stringify(ART_DIMS)};
const WIN_ORIENT = {};
for (const fam of Object.keys(FRAMES)) for (const d of FRAMES[fam]) {
  const a = artCache[d.id], dims = ART_DIMS[d.id];
  if (dims) { a.naturalWidth = dims[0]; a.naturalHeight = dims[1]; }
  if (d.win) WIN_ORIENT[d.id] =
    (d.win.x1 - d.win.x0) * a.naturalWidth > (d.win.y1 - d.win.y0) * a.naturalHeight
      ? 'landscape' : 'portrait';
}
;(async () => {
  const out = globalThis.__out = { steps: [] };
  const step = (k, v) => out.steps.push([k, v]);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const inGallery = () => !$('view-gallery').hidden && $('view-camera').hidden;
  try {
    // ---- scenario 1: taking a photo drops you in the gallery ----
    step('--- after a shot ---', '');
    shots.length = 0; sel = [];
    ghostURL = 'blob:inspo';                       // an inspo photo is loaded
    finishGrab(document.createElement('canvas'), 'jpg', 'photo');
    await sleep(40);
    step('view is gallery', inGallery());
    step('latest shown', !$('latest').hidden);
    step('  ref pane shown', !$('lp-ref').hidden);
    step('  ref src', $('lat-ref').src);
    step('  shot src', $('lat-shot').src);
    step('  caption', $('lat-cap').textContent);
    step('new shot auto-selected', JSON.stringify(sel) + ' of ' + shots.length);
    step('frame is one tap away', selFramable(1));
    step('roll sits below', !$('shots-group').hidden);

    // ---- no inspo loaded: the ref pane collapses ----
    step('--- no inspo loaded ---', '');
    ghostURL = null; renderLatest();
    step('ref pane hidden', $('lp-ref').hidden);
    step('latest still shown', !$('latest').hidden);
    ghostURL = 'blob:inspo';

    // ---- scenario 2: two more shots, then a strip ----
    step('--- strip from three shots ---', '');
    finishGrab(document.createElement('canvas'), 'jpg', 'photo'); await sleep(20);
    finishGrab(document.createElement('canvas'), 'jpg', 'photo'); await sleep(20);
    step('shots taken', shots.length);
    sel = [0, 1, 2];
    step('selFramable(3)', selFramable(3));

    for (const st of FRAMES.strip) {
      globalThis.__painted.length = 0;
      let e1 = null;
      try { openStripEditor(st); } catch (e) { e1 = e.constructor.name + ': ' + e.message; }
      await sleep(50);
      step(st.id, (e1 || 'ok') + ' - canvas ' + stripW + 'x' + stripH +
                  ', ' + stripView.length + ' slots, ' +
                  globalThis.__painted.length + ' draws, editor ' +
                  ($('strip-edit').classList.contains('on') ? 'open' : 'CLOSED'));
    }
    openStripEditor(FRAMES.strip[0]);
    await sleep(50);

    let e2 = null;
    try { saveStrip(); } catch (e) { e2 = e.constructor.name + ': ' + e.message; }
    await sleep(50);
    step('saveStrip', e2 || 'ok');
    step('  shots now', shots.length + ' (was 3)');
    const n = shots[shots.length - 1];
    step('  newest shot', n ? n.name + ' / ' + n.kind : 'NONE');
    step('  editor closed', !$('strip-edit').classList.contains('on'));
    step('  selection cleared', sel.length === 0);
    step('  strip is the hero', $('lat-cap').textContent === (n && n.name));
    step('  back in gallery', inGallery());

    // ---- the frame follows the photo's shape, with nothing to set ----
    step('--- frame orientation ---', '');
    const dim = c => (c.width > c.height ? 'horizontal' : c.width < c.height ? 'vertical' : 'square')
                     + ' ' + c.width + 'x' + c.height;
    for (const d of [...FRAMES.digicam, ...FRAMES.polaroid]) {
      step(d.id + ' (' + (WIN_ORIENT[d.id] || '?') + ' screen)', '');
      step('  portrait  photo ->', dim(composeFrame({}, 1200, 1600, false, 0, d)));
      step('  landscape photo ->', dim(composeFrame({}, 1600, 1200, false, 0, d)));
      step('  square    photo ->', dim(composeFrame({}, 1200, 1200, false, 0, d)));
    }

    // ---- the preview lands over the photo, not in a floating chip ----
    step('--- hover preview ---', '');
    sel = [0]; renderFramePickers();
    showPreview('digicam', FRAMES.digicam[0]);
    await sleep(40);
    step('preview visible', !$('lp-pv').hidden);
    step('  painted into the hero pane', $('lp-pv').children.length + ' canvas');
    const pc = $('lp-pv').children[0];
    step('  preview size', pc ? dim(pc) : 'NONE');
    hidePreview(); await sleep(200);
    step('preview hidden on leave', $('lp-pv').hidden);

    // ---- every registered frame shows up as an option ----
    step('--- pickers ---', '');
    renderFramePickers();
    for (const g of document.querySelectorAll('.frame-group')) {
      const opts = g._box.children.filter(c => c.tagName === 'BUTTON');
      step(g.dataset.fam, opts.length + ' option(s), ' +
           opts.filter(b => !b.disabled).length + ' enabled');
    }

    // ---- framing an existing shot keeps you in the gallery ----
    step('--- framing a shot ---', '');
    sel = [0];
    finishGrab(document.createElement('canvas'), 'png', 'framed');
    await sleep(40);
    step('framed shot is the hero', $('lat-cap').textContent);
    step('cannot be framed twice', selFramable(1) === false);
    step('still in gallery', inGallery());
  } catch (e) { out.fatal = e.constructor.name + ': ' + e.message + '\\n' + e.stack; }
  out.done = true;
})();
`;


let loadErr = null;
try { vm.runInContext(js.replace(/\}\)\(\);\s*$/, DRIVER + '\n})();'), ctx, { filename: 'index.html<script>' }); }
catch (e) { loadErr = e; }
console.log('load:', loadErr ? `THREW ${loadErr.constructor.name}: ${loadErr.message}` : 'ok');

for (let i = 0; i < 60 && !sandbox.__out?.done; i++) await new Promise(r => setTimeout(r, 25));
const out = sandbox.__out;
if (!out) { console.log('driver never ran'); process.exit(1); }
if (out.fatal) console.log('FATAL:', out.fatal);
for (const [k, v] of out.steps) console.log(String(k).padEnd(28), v);
console.log('undeclared writes that escaped to the global object:', [...globalThis.__seen].filter(k=>!['out'].includes(k)).join(', ') || 'none');
process.exit(out.fatal || loadErr ? 1 : 0);
