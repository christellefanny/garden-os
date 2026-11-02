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

test('inspiration manifests remain private, separate and backwards compatible with existing photos',()=>{
 assert.ok(validCloudPhoto({...value,collection:'inspiration'},user));
 assert.ok(validCloudPhoto({id,kind:'folder',name:'Dream patio',collection:'inspiration'},user));
 assert.equal(validCloudPhoto({...value,collection:'unknown'},user),false);
 assert.equal(validCloudPhoto({...value,collection:'inspiration',gardenId:'real-garden'},user),false);
});
test('vision collections never appear in progress albums, or cross account boundaries',async()=>{
 const {inPhotoCollection}=await import('../lib/photo-cloud.ts');
 const progress={id,gardenId:'garden-1'},vision={id,collection:'inspiration'};
 assert.equal(inPhotoCollection(progress,user),true);assert.equal(inPhotoCollection(progress,user,undefined,'garden-1'),true);
 assert.equal(inPhotoCollection(vision,user),false);assert.equal(inPhotoCollection(vision,user,undefined,'garden-1'),false);
 assert.equal(inPhotoCollection(vision,user,'inspiration'),true);assert.equal(inPhotoCollection(progress,user,'inspiration'),false);
 assert.equal(inPhotoCollection(vision,'other-user','inspiration'),false);
});

test('task and bouquet albums are isolated from progress, inspiration, other tasks and accounts', async()=>{
 const {inPhotoCollection}=await import('../lib/photo-cloud.ts');
 const task={...value,collection:'tasks',contextId:'task:dahlia-2026'};
 const bouquet={...value,collection:'bouquets'};
 assert.ok(validCloudPhoto(task,user));assert.ok(validCloudPhoto(bouquet,user));
 assert.ok(inPhotoCollection(task,user,'tasks'));
 assert.ok(inPhotoCollection(task,user,'tasks',undefined,'task:dahlia-2026'));
 assert.equal(inPhotoCollection(task,user,'tasks',undefined,'task:other'),false);
 for(const collection of [undefined,'inspiration','bouquets'])assert.equal(inPhotoCollection(task,user,collection),false);
 assert.equal(inPhotoCollection(bouquet,user,'tasks'),false);
 assert.equal(inPhotoCollection(task,'other-user','tasks'),false);
 for(const invalid of [{...bouquet,contextId:'task-1'},{...value,contextId:'task-1'},{...task,contextId:''},{...task,contextId:'x'.repeat(301)},{...task,gardenId:'garden-1'}])assert.equal(validCloudPhoto(invalid,user),false);
 assert.ok(validCloudPhoto({id,kind:'entry',collection:'tasks',contextId:task.contextId,deleted:true},user));
});
