import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const component = await readFile(new URL("../components/WeeklyEmail.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
test("empty first name retains its label, helpful description and no sample name", () => {
  const field = component.match(/<input\s+className="seasonal-input weekly-name-input"[\s\S]*?\/>/)?.[0];
  assert.ok(field);
  assert.match(field, /name="given-name"/);
  assert.match(field, /autoComplete="given-name"/);
  assert.match(field, /aria-describedby="email-first-name-help"/);
  assert.match(field, /required=\{enabled\}/);
  assert.match(field, /value=\{firstName\}/);
  assert.doesNotMatch(field, /placeholder|defaultValue/);
});
test("name field shares button season variables and remains an obvious keyboard target", () => {
  const field = css.match(/\.weekly-settings \.weekly-name-input \{([^}]+)\}/)?.[1];
  assert.ok(field);
  assert.match(field, /min-height: 48px/);
  assert.match(field, /width: 100%/);
  assert.match(field, /border: 1px solid color-mix\(in srgb, var\(--sidebar-start\)/);
  assert.match(field, /background: color-mix\(in srgb, var\(--sidebar-start\) 9%, transparent\)/);
  assert.match(css, /\.weekly-settings \.weekly-name-input:focus-visible \{[^}]*outline: 3px solid var\(--sidebar-start\)/);
  for (const season of ["spring", "summer", "fall", "winter"]) assert.ok(css.includes(`html[data-season="${season}"]`));
});
