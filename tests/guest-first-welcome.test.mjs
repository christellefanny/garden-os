import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import jsx from 'react/jsx-runtime';
import ts from 'typescript';
const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const source = read('components/GardenApp.tsx');
const output = ts.transpileModule(`${source}\nexport { Welcome };`, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const compiled = { exports: {} };
vm.runInNewContext(output, {
  exports: compiled.exports,
  require: name => name === 'react' ? React : name === 'react/jsx-runtime' ? jsx : name === '@/lib/supabase' ? { supabase: {} } : { __esModule: true, default: () => null },
});
const render = props => renderToStaticMarkup(React.createElement(compiled.exports.Welcome, { authError: '', onGuest() {}, savingGuest: false, initialMode: 'signin', ...props }));

test('first-time welcome leads with a filled guest button and collapsed sign-in fields', () => {
  const html = render();
  assert.match(html, /class="landing-guest-button seasonal-button[^>]+>Try it as a guest<\/button>/);
  assert.match(html, /aria-expanded="false" aria-controls="welcome-account-form"/);
  assert.match(html, /Already have an account\?/);
  assert.match(html, /id="welcome-account-form" hidden=""/);
  assert.ok(html.indexOf('Try it as a guest') < html.indexOf('Already have an account?'));
  assert.ok(html.indexOf('Already have an account?') < html.indexOf('name="email"'));
  assert.match(html, /Prefer an account\? Create one/);
  assert.match(html, /autoComplete="current-password"/);
});

test('account signup from a guest opens directly and preserves transfer guidance', () => {
  const html = render({ savingGuest: true, initialMode: 'signup' });
  assert.match(html, /aria-expanded="true"/);
  assert.doesNotMatch(html, /id="welcome-account-form" hidden/);
  assert.match(html, /Back to my guest garden/);
  assert.match(html, /Create your account/);
  assert.match(html, /minLength="8"/);
  assert.match(html, /autoComplete="new-password"/);
  assert.match(html, /Keep this browser’s data until the transfer finishes/);
});

test('free wording is present-tense and guest storage risks stay visible', () => {
  const html = render();
  assert.match(html, /Garden Atelier is currently free, including accounts\./);
  assert.doesNotMatch(html, /free forever|always free|free trial/i);
  assert.match(html, /Guest work is saved only in this browser/);
  assert.match(html, /Clearing browser data or switching devices can mean losing access to it/);
  assert.match(render({ authError: 'Storage unavailable' }), /role="alert"[^>]*>Storage unavailable/);
  assert.match(source, /using private browsing, or changing devices could mean losing access/);
  assert.match(source, /Forgot password\?/);
});

test('canonical tagline is consistent in header, page description, and emails', () => {
  for (const file of ['components/GardenHeader.tsx', 'app/layout.tsx', 'lib/weekly-email.ts']) {
    const content = read(file);
    assert.ok(content.includes('Plan · Grow · Harvest · Enjoy'), file);
    assert.ok(!content.includes('Plan · Grow · Record · Be Inspired'), file);
  }
  assert.match(read('components/ConservatoryUI.tsx'), /Plan <b>·<\/b> Grow <b>·<\/b> Harvest <b>·<\/b> Enjoy/);
  assert.match(read('app/globals.css'), /@media \(max-width: 1023px\)\s*\{\s*\.landing-welcome-card \{ order: -1; \}/);
});
