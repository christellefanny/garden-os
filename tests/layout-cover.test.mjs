import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validLayoutCover} from '../lib/layout-cover.ts';

test('layout covers accept only small embedded JPEGs, excluding external URLs and executable content',()=>{
 assert.ok(validLayoutCover('data:image/jpeg;base64,/9j/AA=='));
 for(const value of [undefined,null,{},'https://example.com/private.jpg','javascript:alert(1)','data:image/svg+xml;base64,AAAA','data:image/jpeg;base64,<script>',`data:image/jpeg;base64,${'A'.repeat(100000)}`])assert.equal(validLayoutCover(value),false);
});
