import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const source = read('components/GardenApp.tsx');
const css = read('app/globals.css');

test('welcome has one decorative image behind the complete preserved hero copy', () => {
  const tree = ts.createSourceFile('GardenApp.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let hero;
  const visit = node => {
    if (ts.isJsxElement(node) && node.openingElement.attributes.properties.some(attr =>
      ts.isJsxAttribute(attr) && attr.name.getText(tree) === 'className' && attr.initializer?.text === 'landing-garden-hero')) hero = node;
    ts.forEachChild(node, visit);
  };
  visit(tree);
  assert.ok(hero, 'hero wrapper exists');
  const markup = hero.getText(tree);
  assert.match(markup, /className="landing-garden-art" aria-hidden="true"/);
  for (const copy of ['A garden worth remembering', 'More growing.', 'Less guessing.',
    'A thoughtful home for your beds, plants, and little discoveries.',
    'Plan with confidence. Keep a record. Enjoy what grows.', 'Made for every season',
    'Your garden changes.', 'Your companion grows with it.', 'Plan your spaces', 'Remember the season']) {
    assert.ok(markup.includes(copy), `preserves ${copy}`);
  }
  assert.doesNotMatch(markup, /seasonal-hero|text-white|<form|<input/);
  assert.match(source, /onClick=\{onGuest\}/);
  assert.match(source, /<form onSubmit=\{submit\}/);
  assert.match(source, /autoComplete="email"/);
  assert.match(source, /"new-password" : "current-password"/);
});

test('landing art is crisp, seasonal, edge-blended, and independently responsive', () => {
  const styles = css.slice(css.indexOf('/* Public welcome:'));
  assert.match(styles, /background: var\(--hero-photo\)/);
  assert.match(styles, /mask-image: linear-gradient/);
  assert.match(styles, /mask-composite: intersect/);
  assert.match(styles, /pointer-events: none/);
  assert.match(styles, /min-width: 0/);
  assert.match(styles, /overflow: hidden/);
  assert.match(styles, /@media \(max-width: 639px\)/);
  assert.doesNotMatch(styles, /filter:|\.seasonal-hero\s*\{/);
  assert.match(read('components/seasonal/SeasonalDashboard.tsx'), /className="seasonal-hero /);
});

test('landing no longer repeats the public Flower Corner shortcut above its banner', () => {
  assert.doesNotMatch(source, /Explore Flower Corner — no account needed/);
  assert.ok(read('app/flower-corner/page.tsx').length > 0, 'public Flower Corner route stays available');
});
