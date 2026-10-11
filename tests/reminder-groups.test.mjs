import {test} from 'node:test';
import assert from 'node:assert/strict';
import {groupReminders} from '../lib/reminder-groups.ts';
test('task categories group plants while preserving dates, instructions and completion',()=>{
 const tasks=[{title:'Plan harvest and frost protection',plant:'Tomato',date:'2026-10-01',detail:'Harvest tender fruit'}, {title:'Plan harvest and frost protection',plant:'Pepper',date:'2026-10-03',detail:'Cover plants',status:'done'}, {title:'Plant spring-flowering bulbs',plant:'Tulips',date:'2026-10-15'}];
 const groups=groupReminders(tasks);assert.equal(groups.length,2);assert.deepEqual(groups[0].tasks,tasks.slice(0,2));assert.equal(groups[1].tasks[0].plant,'Tulips');assert.deepEqual(groupReminders([]),[]);
});
