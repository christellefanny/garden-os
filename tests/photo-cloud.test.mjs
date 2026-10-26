import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ownedPhotoId, ownedPhotoPath, photoStateKey, validCloudPhoto, PHOTO_LIMIT } from '../lib/photo-cloud.ts';
const user='11111111-1111-4111-8111-111111111111',id=user+':22222222-2222-4222-8222-222222222222';
const value={id,kind:'entry',date:'2026-05-15',category:'My Garden',caption:'Spring seedlings',plant:'',bed:'',cloudPaths:[user+'/22222222-2222-4222-8222-222222222222/batch/0']};
test('cloud photo identifiers and paths cannot cross accounts or escape their private prefix',()=>{
 assert.ok(ownedPhotoId(id,user));assert.ok(ownedPhotoPath(value.cloudPaths[0],user));
 assert.equal(ownedPhotoId(id,'another-user'),false);assert.equal(ownedPhotoPath(user+'/../other/0',user),false);
 assert.equal(ownedPhotoPath('another-user/photo',user),false);assert.equal(ownedPhotoPath(user+'/photo?redirect=elsewhere',user),false);
 assert.equal(photoStateKey(user,'entry',id),'garden-os-photo-entry-'+user+'-22222222-2222-4222-8222-222222222222');
});
test('photo manifests validate metadata, private paths and folder references while supporting recovery tombstones',()=>{
 assert.ok(validCloudPhoto(value,user));assert.ok(validCloudPhoto({id,kind:'entry',deleted:true},user));assert.ok(validCloudPhoto({id,kind:'folder',name:'Seedlings'},user));
 for(const invalid of [{...value,cloudPaths:['other-user/photo']},{...value,cloudPaths:[]},{...value,caption:'x'.repeat(5001)},{...value,photoDetails:{0:{name:'A',description:'',date:'2026-05-15',category:'Flowers',folderId:'other-user:folder'}}},{id,kind:'folder',name:''}])assert.equal(validCloudPhoto(invalid,user),false);
 assert.equal(PHOTO_LIMIT,20971520);
});
