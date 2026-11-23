/* global window, document */
// Icons drawn in the page, so they stay sharp at any size and need no extra files:
// Andrea's dice art (assets/dice/art: ankh for a success, bright ankh for a 10, skull for a
// Hunger 1, plain dot for a failure) and the trackers' icons (drop, heart, brain, face).
'use strict';

(() => {
  const SVG = 'http://www.w3.org/2000/svg';
  // The dice artwork, traced on a 180×180 box with its y axis upside down (potrace).
  const ART = {
    success: [
      'M776 1716 c-199 -84 -238 -316 -82 -482 l52 -54 -72 0 c-56 0 -77 4 -97 20 -34 27 -52 25 -75 -7 -26 -38 -32 -69 -20 -104 12 -34 18 -35 61 -12 24 13 58 17 135 18 l104 0 30 -34 c26 -29 29 -38 23 -70 -3 -20 -14 -42 -23 -48 -14 -12 -14 -18 -1 -65 11 -40 14 -120 14 -328 0 -273 0 -276 30 -387 39 -150 51 -150 90 0 30 111 30 113 30 392 0 203 4 292 13 323 11 38 11 46 -2 60 -8 10 -17 33 -21 53 -6 32 -3 41 23 70 l30 34 104 0 c78 0 111 -5 138 -18 33 -17 35 -17 47 0 7 9 13 24 13 32 0 20 -47 121 -56 121 -3 0 -19 -11 -36 -25 -26 -22 -39 -25 -106 -25 l-77 0 33 26 c107 84 152 255 98 369 -48 101 -138 156 -266 162 -63 3 -85 0 -134 -21z m213 -127 c20 -11 48 -36 61 -56 21 -31 25 -48 25 -109 -1 -61 -5 -78 -29 -115 -34 -52 -66 -89 -78 -89 -4 0 -8 22 -8 48 0 36 5 54 20 67 19 18 19 18 -27 61 -53 50 -65 53 -82 21 -6 -12 -26 -30 -43 -40 l-31 -18 22 -22 c15 -17 21 -36 21 -70 0 -26 -4 -47 -9 -47 -5 0 -23 17 -41 37 -107 122 -88 287 40 345 33 15 122 8 159 -13z',
    ],
    ten: [
      'M778 1724 c-64 -20 -139 -90 -168 -155 -45 -106 -11 -245 84 -344 25 -27 46 -51 46 -53 0 -2 -33 -2 -74 0 -60 3 -79 8 -99 26 -32 31 -52 28 -76 -12 -22 -35 -27 -91 -11 -116 8 -12 16 -12 62 5 54 20 169 27 218 13 67 -19 93 -96 50 -150 -19 -25 -19 -26 2 -99 16 -59 19 -89 14 -159 -22 -300 -18 -382 24 -530 10 -36 21 -77 24 -92 9 -38 32 -35 45 5 44 140 54 204 54 362 0 88 -1 207 -3 265 -2 74 2 123 13 164 15 57 15 60 -4 84 -50 64 -5 144 89 157 61 8 145 -1 186 -21 16 -8 35 -14 42 -14 23 0 28 48 10 95 -25 64 -38 71 -76 43 -25 -18 -47 -23 -108 -26 l-77 -4 41 44 c81 85 114 161 114 257 0 111 -86 224 -193 256 -62 18 -166 18 -229 -1z m187 -123 c123 -55 148 -204 55 -328 -22 -29 -47 -53 -55 -53 -23 0 -19 72 5 103 26 33 25 41 -5 57 -14 7 -32 24 -40 37 -20 30 -39 29 -59 -2 -10 -14 -28 -31 -42 -37 -28 -13 -31 -26 -8 -43 19 -13 33 -115 16 -115 -23 0 -100 100 -111 144 -14 55 -14 71 -1 118 14 50 55 97 105 119 51 23 89 23 140 0z',
      'M410 953 c0 -4 14 -21 31 -39 27 -28 32 -42 40 -112 11 -95 32 -194 55 -248 17 -41 60 -104 72 -104 4 0 7 44 8 98 1 141 29 296 65 355 16 26 29 49 29 52 0 3 -67 5 -150 5 -82 0 -150 -3 -150 -7z',
      'M1111 905 c36 -65 69 -241 69 -372 0 -46 4 -83 9 -83 14 0 56 70 78 130 11 30 26 96 32 145 7 50 15 105 17 123 3 18 18 48 34 66 17 19 30 36 30 40 0 3 -68 6 -150 6 l-150 0 31 -55z',
    ],
    one: [
      'M820 1484 c-225 -33 -324 -101 -371 -255 -17 -57 -20 -84 -15 -152 4 -45 7 -97 7 -114 0 -160 0 -172 -3 -223 l-3 -45 63 -21 c34 -12 69 -28 78 -35 26 -21 51 -81 65 -149 14 -75 40 -140 61 -158 14 -11 16 1 23 98 6 102 9 112 30 126 20 13 34 14 72 6 26 -5 86 -7 132 -5 109 7 111 5 111 -134 0 -57 4 -103 9 -103 21 0 50 61 76 159 15 58 34 116 43 129 9 14 43 37 77 52 82 37 100 59 87 102 -7 20 -9 79 -5 153 11 222 9 275 -15 346 -42 123 -125 187 -278 214 -73 13 -185 17 -244 9z m-103 -549 c15 -8 45 -17 66 -20 33 -5 37 -9 37 -36 0 -39 -42 -79 -82 -79 -16 0 -59 -8 -95 -17 l-65 -18 -19 24 c-24 29 -24 39 0 93 28 66 47 81 92 74 20 -3 50 -13 66 -21z m492 15 c21 -11 51 -78 51 -113 0 -12 -7 -33 -16 -46 -15 -20 -22 -23 -63 -18 -146 18 -196 43 -196 98 0 30 4 34 40 44 22 6 56 19 75 28 40 19 83 22 109 7z',
    ],
  };
  // Tracker icons on a 24×24 box, in the tracker's own colour (currentColor).
  const TRACKERS = {
    vitae: [
      ['path', { d: 'M12 1.8C12 1.8 4.6 10 4.6 15.1a7.4 7.4 0 0 0 14.8 0C19.4 10 12 1.8 12 1.8z' }],
      [
        'path',
        {
          class: 'shine',
          d: 'M8.6 14.6c0 2.1 1.2 3.8 3 4.4-.3.3-.9.4-1.4.3-1.6-.5-2.7-2.3-2.5-4.3.1-.9.4-1.8.9-2.6.1.7 0 1.5 0 2.2z',
        },
      ],
    ],
    health: [
      [
        'path',
        {
          d: 'M12 21.3s-8.3-5-10-10.3C.8 7 3.4 3.4 7 3.4c2.1 0 3.8 1.1 5 2.8 1.2-1.7 2.9-2.8 5-2.8 3.6 0 6.2 3.6 5 7.6-1.7 5.3-10 10.3-10 10.3z',
        },
      ],
    ],
    willpower: [
      ['circle', { cx: 8, cy: 8.5, r: 4.6 }],
      ['circle', { cx: 16, cy: 8.5, r: 4.6 }],
      ['circle', { cx: 5.4, cy: 13.4, r: 4 }],
      ['circle', { cx: 18.6, cy: 13.4, r: 4 }],
      ['circle', { cx: 9.4, cy: 16, r: 3.8 }],
      ['circle', { cx: 14.6, cy: 16, r: 3.8 }],
      [
        'path',
        {
          class: 'fold',
          d: 'M12 4.6v15M8.2 7.1c1.3.3 2 1.3 1.9 2.6M4.1 12.6c1.4-.6 2.9-.3 3.8.8M7.5 17.1c.4-1.3 1.6-2 2.9-1.9M15.8 7.1c-1.3.3-2 1.3-1.9 2.6M19.9 12.6c-1.4-.6-2.9-.3-3.8.8M16.5 17.1c-.4-1.3-1.6-2-2.9-1.9',
        },
      ],
    ],
    humanity: [
      [
        'path',
        {
          d: 'M9.4 22.4c.3-2 .2-3.4-.9-4.6C6.6 15.9 5.3 13.6 5.3 10.6 5.3 6 8.8 2.3 13.4 2.3c3.6 0 6.2 2.2 6.5 5.5l.1.9 1.7 3.2c.2.4 0 .8-.4.9l-1.2.3v1.7c0 .4-.2.6-.5.7l-.4.1.4.6c.2.3 0 .7-.3.8l-.3.1.2 1c.2 1-.5 1.9-1.6 2l-2.6.1.5 2.2z',
        },
      ],
    ],
  };

  function svg(viewBox, cls) {
    const s = document.createElementNS(SVG, 'svg');
    s.setAttribute('viewBox', viewBox);
    s.setAttribute('class', cls);
    s.setAttribute('aria-hidden', 'true');
    return s;
  }

  function shape(tag, attrs) {
    const node = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    return node;
  }

  /** The icon of a tracker: 'vitae', 'health', 'willpower' or 'humanity'. */
  function trackerIcon(kind) {
    const s = svg('0 0 24 24', `ico ico-${kind}`);
    for (const [tag, attrs] of TRACKERS[kind] || []) s.append(shape(tag, attrs));
    return s;
  }

  /** The artwork alone: 'success', 'ten' or 'one', coloured by CSS (fill: currentColor). */
  function art(name) {
    const s = svg('0 0 180 180', 'art');
    const g = shape('g', { transform: 'translate(0,180) scale(0.1,-0.1)' });
    for (const d of ART[name]) g.append(shape('path', { d }));
    s.append(g);
    return s;
  }

  /**
   * One die as the Discord emojis draw it: an ankh for 6–9, a bright ankh for 10, a skull
   * for a 1 on a Hunger die and a plain dot for the other failures, with its number.
   */
  function die(face, { hunger = false } = {}) {
    const kind = face === 10 ? 'ten' : face >= 6 ? 'success' : hunger && face === 1 ? 'one' : 'dot';
    const box = document.createElement('span');
    box.className = `die ${kind}${hunger ? ' hunger' : ''}`;
    if (kind === 'dot') box.append(document.createElement('i'));
    else box.append(art(kind));
    const n = document.createElement('b');
    n.textContent = String(face);
    box.append(n);
    return box;
  }

  Object.assign(window.ELDER, { trackerIcon, diceArt: art, die });
})();
