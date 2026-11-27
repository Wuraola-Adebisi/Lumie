import { createHash, createHmac } from 'node:crypto'
const alg='AWS4-HMAC-SHA256', unsigned='UNSIGNED-PAYLOAD'
const hash=v=>createHash('sha256').update(v).digest('hex')
const mac=(k,v,e)=>createHmac('sha256',k).update(v).digest(e)
const enc=v=>encodeURIComponent(v).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase())
const pathEnc=v=>v.split('/').map(enc).join('/')
const date=d=>d.toISOString().replace(/[:-]|\.\d{3}/g,'')
const key=(s,d,r)=>mac(mac(mac(mac('AWS4'+s,d),r),'s3'),'aws4_request')
const query=p=>[...p.entries()].map(([k,v])=>[enc(k),enc(v)]).sort(([a,x],[b,y])=>a.localeCompare(b)||x.localeCompare(y)).map(([k,v])=>k+'='+v).join('&')
export function createS3CompatibleStorage({endpoint,publicEndpoint=endpoint,bucket,region='us-east-1',accessKeyId,secretAccessKey,fetchImpl=fetch,clock=()=>new Date()}){
 if(!endpoint||!publicEndpoint||!bucket||!accessKeyId||!secretAccessKey)throw new TypeError('Storage configuration is incomplete.')
 const url=(base,k)=>{const u=new URL(base);u.pathname=u.pathname.replace(/\/$/,'')+'/'+enc(bucket)+'/'+pathEnc(k);return u}
 const sign=(method,k,expires,type)=>{if(expires<1||expires>900)throw new RangeError('URL expiry must be 1–900 seconds.');const u=url(publicEndpoint,k),d=date(clock()),day=d.slice(0,8),scope=day+'/'+region+'/s3/aws4_request',p=new URLSearchParams({'X-Amz-Algorithm':alg,'X-Amz-Credential':accessKeyId+'/'+scope,'X-Amz-Date':d,'X-Amz-Expires':String(expires),'X-Amz-SignedHeaders':type?'content-type;host':'host'}),headers=type?'content-type:'+type+'\nhost:'+u.host+'\n':'host:'+u.host+'\n',signed=type?'content-type;host':'host',canonical=[method,u.pathname,query(p),headers,signed,unsigned].join('\n'),toSign=[alg,d,scope,hash(canonical)].join('\n');p.set('X-Amz-Signature',mac(key(secretAccessKey,day,region),toSign,'hex'));u.search=query(p);return u.toString()}
 const request=async(method,k)=>{const u=url(endpoint,k),d=date(clock()),day=d.slice(0,8),scope=day+'/'+region+'/s3/aws4_request',h={host:u.host,'x-amz-content-sha256':unsigned,'x-amz-date':d},names=Object.keys(h).sort(),signed=names.join(';'),canonical=[method,u.pathname,'',names.map(n=>n+':'+h[n]+'\n').join(''),signed,unsigned].join('\n'),toSign=[alg,d,scope,hash(canonical)].join('\n'),sig=mac(key(secretAccessKey,day,region),toSign,'hex');return fetchImpl(u,{method,headers:{...h,authorization:alg+' Credential='+accessKeyId+'/'+scope+', SignedHeaders='+signed+', Signature='+sig}})}
 return {presignPut:(k,t,e=300)=>sign('PUT',k,e,t),presignGet:(k,e=300)=>sign('GET',k,e),async headObject(k){const r=await request('HEAD',k);if(r.status===404||r.status===403)return null;if(!r.ok)throw new Error('Object metadata check failed.');return {contentLength:Number(r.headers.get('content-length')),contentType:r.headers.get('content-type')||''}},async deleteObject(k){const r=await request('DELETE',k);if(!r.ok&&r.status!==404)throw new Error('Object cleanup failed.')}}
}
