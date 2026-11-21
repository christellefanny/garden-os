import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { destinations, navigationDestinations, sidebarDestination } from '../lib/navigation.ts';

const require = createRequire(import.meta.url);
const source = name => readFileSync(new URL('../components/' + name + '.tsx', import.meta.url), 'utf8');
const input = source('ConservatoryUI').split('export function ConservatoryTopbar')[0];
const js = ts.transpileModule(input, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
const exports = {};
vm.runInNewContext(js, { exports, require: id => id === 'next/image' ? ({ src, alt }) => React.createElement('img', { src, alt }) : id === '@/lib/navigation' ? { destinations, navigationDestinations, sidebarDestination } : id.startsWith('@/') ? {} : require(id) });

for (const guest of [false, true]) test(`inspiration belongs to My Gardens for ${guest ? 'guest' : 'account'}`, () => {
  const names = navigationDestinations(guest);
  assert.ok(destinations.includes('Garden Inspiration'));
  assert.ok(!names.includes('Garden Inspiration'));
  assert.ok(!names.includes('Vision Board'));
  assert.ok(!destinations.includes('Vision Board'));
  const html = renderToStaticMarkup(React.createElement(exports.ConservatoryNavigation, { guest, page: 'Garden Inspiration', navigate: () => {}, onSignOut: () => {} }));
  assert.doesNotMatch(html, />Vision Board</);
  assert.doesNotMatch(html, />Garden Inspiration</);
  assert.match(html, /aria-current="page"><svg[^>]*><path[^>]*><\/path><\/svg><span>My Gardens<\/span>/);
});

test('old board bookmarks render Inspiration Board without another page or data migration', () => {
  const workspace = source('GardenWorkspace');
  const fromUrl = workspace.match(/function readPageFromUrl\(guest = false\): Destination \{[\s\S]*?\n\}/)[0];
  const pageView = workspace.match(/function pageView\(page: Destination\) \{[\s\S]*?\n\}/)[0];
  const routeJs = ts.transpileModule(pageView + '\n' + fromUrl, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  for (const guest of [false, true]) for (const view of ['vision-board', 'garden-inspiration']) {
    const context = { destinations, guest, window: { location: { search: '?view=' + view } }, URLSearchParams };
    assert.equal(vm.runInNewContext(routeJs + '\nreadPageFromUrl(guest)', context), 'Garden Inspiration');
  }
  assert.doesNotMatch(workspace, /GardenVisionBoard|page === "Vision Board"/);
  assert.match(workspace, /page === "Garden Inspiration"[\s\S]*?navigateGardenSection\("My Gardens"\)[\s\S]*?Back to My Gardens[\s\S]*?<GardenPictures key="garden-inspiration" userId=\{userId\} collection="inspiration"/);
  assert.match(workspace, /onInspiration=\{\(\) => navigateGardenSection\("Garden Inspiration"\)\}/);
  assert.match(source('GardenCollection'), /!detail && <section[^>]*aria-labelledby="garden-inspiration-entry-title">[\s\S]*?onClick=\{onInspiration\}>Open Inspiration Board/);
  assert.match(source('GardenCollection'), /<path d="M3 3h8v10H3ZM15 3h6v6h-6ZM3 17h8v4H3ZM15 13h6v8h-6Z"/);
});
