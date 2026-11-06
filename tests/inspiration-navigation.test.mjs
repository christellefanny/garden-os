import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { destinations, navigationDestinations } from '../lib/navigation.ts';

const require = createRequire(import.meta.url);
const source = name => readFileSync(new URL('../components/' + name + '.tsx', import.meta.url), 'utf8');
const input = source('ConservatoryUI').split('export function ConservatoryTopbar')[0];
const js = ts.transpileModule(input, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
const exports = {};
vm.runInNewContext(js, { exports, require: id => id === 'next/image' ? ({ src, alt }) => React.createElement('img', { src, alt }) : id === '@/lib/navigation' ? { destinations, navigationDestinations } : id.startsWith('@/') ? {} : require(id) });

for (const guest of [false, true]) test(`one inspiration destination with the existing board icon for ${guest ? 'guest' : 'account'}`, () => {
  const names = navigationDestinations(guest);
  assert.equal(names.filter(name => name === 'Garden Inspiration').length, 1);
  assert.ok(!names.includes('Vision Board'));
  assert.ok(!destinations.includes('Vision Board'));
  const html = renderToStaticMarkup(React.createElement(exports.ConservatoryNavigation, { guest, page: 'Garden Inspiration', navigate: () => {}, onSignOut: () => {} }));
  assert.doesNotMatch(html, />Vision Board</);
  assert.match(html, /aria-current="page"><svg[^>]*><path d="M3 3h8v10H3ZM15 3h6v6h-6ZM3 17h8v4H3ZM15 13h6v8h-6Z"[^>]*><\/path><\/svg><span>Garden Inspiration<\/span>/);
});

test('old board bookmarks render Garden Inspiration without another page or data migration', () => {
  const workspace = source('GardenWorkspace');
  const fromUrl = workspace.match(/function readPageFromUrl\(guest = false\): Destination \{[\s\S]*?\n\}/)[0];
  const pageView = workspace.match(/function pageView\(page: Destination\) \{[\s\S]*?\n\}/)[0];
  const routeJs = ts.transpileModule(pageView + '\n' + fromUrl, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  for (const guest of [false, true]) {
    const context = { destinations, guest, window: { location: { search: '?view=vision-board' } }, URLSearchParams };
    assert.equal(vm.runInNewContext(routeJs + '\nreadPageFromUrl(guest)', context), 'Garden Inspiration');
  }
  assert.doesNotMatch(workspace, /GardenVisionBoard|page === "Vision Board"/);
  assert.match(workspace, /page === "Garden Inspiration" && <section className="interior-page"><GardenPictures key="garden-inspiration" userId=\{userId\} collection="inspiration" gardenName="Garden Inspiration" gardens=\{gardens.map\(g => \(\{ id: g.id, name: g.name \}\)\)\} \/><\/section>/);
});
