#!/usr/bin/env node
// scripts/gen-dark-css.mjs — generates app/dark.css.
//
// The UI uses a small fixed palette as Tailwind arbitrary classes (text-[#242424], bg-[#f2f2f2],
// hover:border-[#242424], …). Instead of threading dark: variants through every component, this
// scans the code for those classes and emits `.dark` overrides from one mapping table.
// Run `npm run gen:dark` after adding a new colour class.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = process.cwd();
const DIRS = ['app', 'components'];

// light colour → dark colour, per CSS property family ('*' = any property).
const MAP = {
  '#242424': { text: '#e6e6e6', bg: '#ececec', border: '#d4d4d4', ring: '#d4d4d4', decoration: '#d4d4d4', fill: '#e6e6e6' },
  '#181717': { text: '#e6e6e6', bg: '#e6e6e6' },
  '#5b5b5b': { bg: '#8a8a8a' },
  '#6b6b6b': { text: '#a8a8a8', bg: '#a8a8a8' },
  '#4d5156': { text: '#b0b0b0' },
  '#9b9b9b': { text: '#8c8c8c', bg: '#8c8c8c' },
  '#b3b3b1': { text: '#6e6e6e' },
  '#b3b3b3': { text: '#6e6e6e' },
  '#c4c4c4': { text: '#5f5f5f', bg: '#5f5f5f', border: '#5f5f5f' },
  '#d4d4d4': { text: '#4a4a4a', bg: '#4a4a4a', border: '#4a4a4a', decoration: '#4a4a4a', ring: '#4a4a4a' },
  '#e6e6e6': { '*': '#333333' },
  '#ececec': { '*': '#2e2e2e' },
  '#f0f0f0': { bg: '#262626', border: '#2a2a2a', '*': '#2a2a2a' },
  '#f2f2f2': { bg: '#262626', border: '#2a2a2a', '*': '#2a2a2a' },
  '#f4f4f4': { '*': '#232323' },
  '#f6f6f6': { bg: '#1f1f1f', border: '#262626', '*': '#1f1f1f' },
  '#f9f9f9': { '*': '#1c1c1c' },
  '#fafafa': { '*': '#181818' },
  '#fcfcfc': { '*': '#161616' },
  '#1a6b17': { text: '#6fd36a' },
  '#1a6b2a': { text: '#6fd36a' },
  '#eef7ee': { bg: '#16301a' },
  '#f3faf3': { bg: '#142a17' },
  '#f6fbf6': { bg: '#142a17' },
  '#def4dd': { bg: '#1e4422' },
  '#dcefdc': { bg: '#1e4422' },
  '#2467ac': { text: '#7fb3ea', border: '#7fb3ea', ring: '#7fb3ea', outline: '#7fb3ea', bg: '#3d7fc4' },
  '#d3e3fd': { bg: '#1f3a5f' },
  '#eef4fb': { bg: '#15253a' },
  '#1a0dab': { text: '#8ab4f8' },
  '#7a5a00': { text: '#e3b341' },
  '#fdf6e7': { bg: '#33290f' },
  '#c94a4a': { text: '#f08a8a', border: '#f08a8a' },
  '#a33': { text: '#f08a8a' },
  '#fdf1f1': { bg: '#3a1818' },
  '#fdf6f6': { bg: '#2a1616' },
  '#f3d4d4': { border: '#5a2a2a' },
  '#ecd4d4': { border: '#5a2a2a' },
  white: { bg: '#121212' },
  black: { bg: '#fafafa' },
};

const PROPS = {
  text: v => `color:${v}`,
  bg: v => `background-color:${v}`,
  border: v => `border-color:${v}`,
  ring: v => `--tw-ring-color:${v}`,
  decoration: v => `text-decoration-color:${v}`,
  outline: v => `outline-color:${v}`,
  accent: v => `accent-color:${v}`,
  fill: v => `fill:${v}`,
  stroke: v => `stroke:${v}`,
  divide: v => `border-color:${v}`,
};
const PSEUDO = { hover: ':hover', focus: ':focus', 'focus-within': ':focus-within', 'focus-visible': ':focus-visible', active: ':active', disabled: ':disabled', placeholder: '::placeholder' };
const MEDIA = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 };

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (['.tsx', '.ts'].includes(extname(p))) out.push(p);
  }
  return out;
}

const esc = s => s.replace(/[^a-zA-Z0-9_-]/g, c => `\\${c}`);
const hexToRgb = h => { const n = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16)).join(','); };

const RE = /(?<![\w-])((?:[a-z0-9-]+:)*)(text|bg|border|ring|decoration|outline|accent|fill|stroke|divide)-(\[#[0-9a-fA-F]{3,8}\]|white|black)(?:\/(\d{1,3}))?(?![\w\]-])/g;
const classes = new Set();
for (const dir of DIRS) for (const file of walk(join(ROOT, dir))) for (const m of readFileSync(file, 'utf8').matchAll(RE)) classes.add(m[0]);

const rules = [];
for (const cls of [...classes].sort()) {
  const m = /^((?:[a-z0-9-]+:)*)([a-z]+)-(\[#[0-9a-fA-F]{3,8}\]|white|black)(?:\/(\d{1,3}))?$/.exec(cls);
  if (!m) continue;
  const [, variantStr, prop, rawColor, alpha] = m;
  const key = rawColor.startsWith('[') ? rawColor.slice(1, -1).toLowerCase() : rawColor;
  const entry = MAP[key];
  let value = entry && (entry[prop] ?? entry['*']);
  if (!value || !PROPS[prop]) continue;
  if (alpha) value = `rgba(${hexToRgb(value)},${Number(alpha) / 100})`;

  const variants = variantStr ? variantStr.slice(0, -1).split(':') : [];
  let pseudo = '';
  let groupHover = false;
  let media = null;
  let ok = true;
  for (const v of variants) {
    if (PSEUDO[v]) pseudo += PSEUDO[v];
    else if (v === 'group-hover') groupHover = true;
    else if (MEDIA[v]) media = MEDIA[v];
    else { ok = false; break; } // unknown variant: leave it alone
  }
  if (!ok) continue;
  let selector = `${groupHover ? '.dark .group:hover ' : '.dark '}.${esc(cls)}${pseudo}`;
  if (prop === 'divide') selector += ' > :not([hidden]) ~ :not([hidden])';
  let rule = `${selector}{${PROPS[prop](value)}}`;
  if (media) rule = `@media (min-width:${media}px){${rule}}`;
  rules.push(rule);
}

// Dark filled buttons/tooltips (bg #242424 → light) need dark text on top.
rules.push('.dark .bg-\\[\\#242424\\], .dark .bg-\\[\\#242424\\] [class*="text-white"], .dark .bg-\\[\\#242424\\][class*="text-white"]{color:#121212}');
rules.push('.dark .hover\\:bg-black:hover{background-color:#ffffff;color:#121212}');

writeFileSync(join(ROOT, 'app', 'dark.css'),
  `/* GENERATED by scripts/gen-dark-css.mjs — do not edit by hand (npm run gen:dark). */\n${rules.join('\n')}\n`);
console.log(`dark.css: ${rules.length} rules from ${classes.size} colour classes`);
