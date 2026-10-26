# Interface: style and libraries

## Style

- **Base — Windows 98:** grey bevelled windows, gradient title bars, "pressed" buttons, a taskbar with a "Start" button.
- **"Clueless" accents:**
  - desktop — Cher's yellow plaid (CSS gradients, no image);
  - window title bar gradient — pink-purple instead of blue;
  - the outfit verdict in big pixel letters: "MATCH!" or a red "MIS-MATCH". How exactly to compute it is an open question ([README](README.md#open-questions)).
- **Comfort on a phone matters more than faithful reproduction:** bigger buttons, readable text. Leopard and other themes — later.
- **The UI language is Ukrainian.** The documentation is in English; UI strings live in the UI dictionary.

How it looks in the app: [overview.md](overview.md#what-it-looks-like).

## Recommendation: 98.css + Tailwind CSS

| What | Role |
|---|---|
| [98.css](https://jdan.github.io/98.css/) (v0.1.21, MIT) | The retro look. CSS only, no JS: styles plain elements (`button`, `input`, `select`, `fieldset`, `menu[role=tablist]` tabs, `ul.tree-view`) and window classes (`.window`, `.title-bar`, `.window-body`, `.status-bar`) |
| [Tailwind CSS](https://tailwindcss.com/) v4 | Layout: flex / grid, spacing, responsiveness (`md:`), safe area. Element colors and borders are 98.css's job; Tailwind doesn't touch them |
| Own components | `Window`, `Taskbar`, `StartMenu`, `Chips`, `Dialog` — small wrappers around 98.css classes |

**Why this way:**
- no JS, so no compatibility issues with the React version;
- the tag form looks retro right away — it's plain `input` and `select`;
- the components are small, and writing them is good React and accessibility practice;
- full control over the phone version.

### Alternatives

| Option | What it gives | Why it's not the main choice |
|---|---|---|
| [XP.css](https://botoxparty.github.io/XP.css/) | The same approach, Windows XP look (98 is the second theme in the package) | An equal replacement if you like XP more: one import changes. But "Clueless" is 1995, closer to 95/98; XP is already glossy Y2K. And XP is harder to recolor: title bars, buttons and the taskbar are multi-layer gradients and images, not two colors |
| [7.css](https://khang-nd.github.io/7.css/) | Windows 7 | No longer "90s retro" |
| [@react95/core](https://github.com/React95/React95) (9.8.4, September 2026) | Ready-made Windows 95 React components: draggable windows, taskbar, menus, icons | Its own styling system (vanilla-extract), so together with Tailwind you get two systems; less control over the phone version; less practice. An option if you want to go faster |
| [react95](https://github.com/react95-io/React95) | The same, Windows 95 | Last release — November 2022; styled-components at runtime |

## Combining 98.css and Tailwind

Tailwind v4 puts styles into cascade layers: `theme → base → components → utilities`. **Unlayered styles always beat layered styles, regardless of specificity.**

So 98.css has to go into the `components` layer, not a plain `import "98.css"` in `main.tsx`:

```css
/* apps/web/src/index.css */
@import "tailwindcss";
@import "98.css/dist/98.css" layer(components);
@import "./retro.css" layer(components); /* our additions */
```

- 98.css in `components` overrides the Tailwind reset (`base`), and utilities override 98.css: `className="px-4"` on a button works.
- If 98.css ends up unlayered, it overrides utilities, and `px-4` silently does nothing.
- `retro.css` holds our additions: the "Clueless" theme, touch sizes, fonts. It's in the same layer but after 98.css, so it wins at equal specificity.

## Font and Cyrillic

**Decided: 98, not XP.** For the font, the recommendation to confirm on the comparison page is a pair -
Pixelify Sans for body text and fields, because it is free of the 8 px grid and a phone needs a 16 px field font,
and Press Start 2P for accents such as "MATCH!" and headings, where 16 / 24 / 32 px is easy to keep to.

- **The pixel font of 98.css and XP.css has no Cyrillic letters at all** (checked: 116 glyphs, Latin only). Ukrainian text falls back to Arial, and you get a mix of fonts.
- **Solution:**
  - a pixel font with Cyrillic — for window titles, buttons and accents;
  - a regular readable font — for body text and fields: small pixel text reads poorly on a phone.
- **Google Fonts pixel fonts with Cyrillic** (checked):

  | Font | Grid | Notes |
  |---|---|---|
  | **Press Start 2P** | 8 px | Familiar letter shapes, very crisp, but very wide — for "MATCH!", headings, short labels |
  | **Tiny5** | 8 px | Narrow and compact — a candidate for buttons and window titles |
  | **Pixelify Sans** | none | Only pixel-styled: scales smoothly but is never perfectly crisp; the Cyrillic "д" is in a handwritten form that looks like "∂" |

- **A font on an 8 px grid is crisp only at 16, 24, 32 px.** At 12 or 20 px the pixels blur and letters start looking alike. So the theme's sizes are multiples of 8.
- Without Cyrillic: VT323, Silkscreen, Jersey 10.
- **Comparison page** (private): https://claude.ai/artifact/T4sE66Mi9oaWWaxnNZtr9Q — 98 / XP, four fonts, sketches of the "Outfit of the day" and "New item" screens. Open it on a phone too.
- **Loading — via [Fontsource](https://fontsource.org/)** (e.g. `@fontsource/pixelify-sans`): the font ships in your build, so it works offline in the PWA and doesn't depend on Google.

## Phone

- **Every screen is a full-screen window**, without an outer frame and shadow; ✕ in the title bar means "back".
- **The taskbar** at the bottom, padded with `env(safe-area-inset-bottom)`.
- **Touch sizes.** In 98.css a button is 23 px tall with an 11 px font — designed for a mouse. In `retro.css` for `@media (pointer: coarse)`:
  - buttons and fields — ≥ 44 px;
  - field font — ≥ 16 px, otherwise the iPhone zooms the page on focus ([mobile.md](mobile.md));
  - bigger checkboxes and radio buttons.
- **Don't rely on hover:** phones don't have it.

## Computer

- A desktop with shortcuts (Wardrobe, Outfit of the day, Diary…) and windows.
- **PoC:** one active window in the center.
- **Later:** several windows side by side (wardrobe + doll), dragging (e.g. `@neodrag/react`), "minimize" to the taskbar.
- **Routing is ordinary (React Router):** a "window" is just page chrome. So links, the back button and the phone version work without tricks.

## The "Clueless" theme

- 98.css has no CSS variables: colors are baked into the rules. So the theme works like this: `retro.css` declares our own variables in `:root` and overrides a few 98.css rules, e.g. the `.title-bar` background.
- The yellow plaid desktop — several layers of `repeating-linear-gradient`.
- **Dark theme:** Windows 98 didn't have one. Not in the PoC; later — a separate "night" theme through the same variables.

## Icons

- [@react95/icons](https://github.com/React95/React95) — Windows 95 icons as React components; they work without `@react95/core`. They reproduce Microsoft's original icons: fine for a personal PoC, for a public release better use your own.
- [pixelarticons](https://pixelarticons.com/) (MIT) — an open pixel icon set, safe for release.

## What happens at which step

| Step | What we do |
|---|---|
| 8 | Tailwind + 98.css in the `components` layer, a Cyrillic font, `Window`, `Taskbar`, the desktop and the theme |
| 9 | The tag form on standard 98.css elements + chips and the "All-season" button |
| 10 | The "Outfit of the day" screen: doll, scores, verdict |
| 11 | Phone check: touch sizes, safe area, [iPhone checklist](mobile.md#iphone-testing-checklist) |
| After the PoC | Several windows and dragging, retro sounds (Web Audio, off by default), more themes |
