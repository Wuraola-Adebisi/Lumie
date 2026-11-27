import test from 'node:test'
import assert from 'node:assert/strict'
import { createS3CompatibleStorage } from './object-storage.mjs'
const cfg={endpoint:'http://minio:9000',publicEndpoint:'http://localhost:9001',bucket:'lumie-private',accessKeyId:'test-key',secretAccessKey:'test-secret',clock:()=>new Date('2026-11-27T12:00:00Z')}
test('private S3-compatible storage',async t=>{
 await t.test('presigns content-type-bound uploads',()=>{const u=new URL(createS3CompatibleStorage(cfg).presignPut('private/u/a','image/png'));assert.equal(u.origin,'http://localhost:9001');assert.equal(u.searchParams.get('X-Amz-SignedHeaders'),'content-type;host');assert.equal(u.searchParams.get('X-Amz-Signature').length,64)})
 await t.test('checks metadata through the internal endpoint',async()=>{let target,opts;const s=createS3CompatibleStorage({...cfg,fetchImpl:async(u,o)=>{target=u;opts=o;return new Response(null,{status:200,headers:{'content-length':'12','content-type':'image/png'}})}});assert.deepEqual(await s.headObject('private/u/a'),{contentLength:12,contentType:'image/png'});assert.equal(new URL(target).origin,'http://minio:9000');assert.match(opts.headers.authorization,/AWS4-HMAC-SHA256/)})
 await t.test('treats absent objects as missing and limits expiry',async()=>{const s=createS3CompatibleStorage({...cfg,fetchImpl:async()=>new Response(null,{status:404})});assert.equal(await s.headObject('private/u/a'),null);assert.throws(()=>s.presignGet('private/u/a',901),RangeError)})
})
