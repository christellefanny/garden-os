import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
test('calendar empty states offer usable task and garden actions, never an inaccessible vault', () => {
  const calendar = read('components/GrowingCalendar.tsx');
  assert.doesNotMatch(calendar, /Add (?:a plant to your|plants in) Plant Vault/);
  assert.match(calendar, /No plant is needed/);
  assert.match(calendar, /<AddTaskButton userId=\{userId\}/);
  assert.match(calendar, /onClick=\{onAddPlant\}/);
});
test('first-garden guidance keeps zone optional and links every required step', () => {
  const steps = read('components/FirstGardenSteps.tsx');
  for (const title of ['Your zone', 'Your garden', 'Your first plant', 'Your first task']) assert.ok(steps.includes(title));
  assert.match(steps, /Location and zone are optional/);
  assert.match(steps, /if \(garden && hasPlants && hasTask\) return null/);
  for (const action of ['onGarden', 'onPlant', 'onCalendar']) assert.ok(steps.includes(action));
});
test('new-space continuation opens the saved plant editor without fabricating a plant', () => {
  const workspace = read('components/GardenWorkspace.tsx');
  assert.match(workspace, /addingFirstPlant \? \(id\) => \{\s*setPlannerCrop\(""\); setPlantSpacing\(12\); setOpenId\(id\)/);
  assert.match(workspace, /onClose=\{\(\) => \{ setEditor\(null\); setAddingFirstPlant\(false\); \}\}/);
  assert.match(workspace, /<Dialog title=\{gardenForm === "edit"/);
});
