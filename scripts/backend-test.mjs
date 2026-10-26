import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import { onRequest } from '../functions/api/[[path]].js';

const db=new DatabaseSync(':memory:');
db.exec(await readFile(new URL('../db/schema.sql',import.meta.url),'utf8'));
const testSession='test-session-token';
const sessionHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(testSession))),b=>b.toString(16).padStart(2,'0')).join('');
db.prepare("INSERT INTO users(id,google_sub,email,name) VALUES('test-user','test-google-sub','reader@example.test','Reader')").run();
db.prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").run(sessionHash,'test-user',Math.floor(Date.now()/1000)+3600);
const DB={prepare(sql){return {args:[],bind(...args){this.args=args;return this;},async run(){return db.prepare(sql).run(...this.args);},async first(){return db.prepare(sql).get(...this.args)||null;},async all(){return {results:db.prepare(sql).all(...this.args)};}};}};
const env={DB,RATE_LIMIT_SALT:'test-only-salt',TURNSTILE_SECRET:'test-only-turnstile',ADMIN_TOKEN:'test-only-admin'};
const realFetch=globalThis.fetch;
globalThis.fetch=async (url,init)=>{
 assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');
 assert.equal(init.body.get('secret'),env.TURNSTILE_SECRET);
 return Response.json({success:init.body.get('response')==='valid-test-token',hostname:'example.test',action:'community'});
};
let n=0;
async function req(path,{method='GET',body,origin='https://example.test',token,ip='192.0.2.1',environment=env,authenticated=true}={}){
 const headers={'CF-Connecting-IP':ip};
 if(authenticated) headers.Cookie=`mtk_session=${testSession}`;
 if(method!=='GET') {headers.Origin=origin;headers['Content-Type']='application/json';}
 if(token) headers.Authorization=`Bearer ${token}`;
 const request=new Request(`https://example.test/api/${path}`,{method,headers,...(body===undefined?{}:{body:typeof body==='string'?body:JSON.stringify(body)})});
 const response=await onRequest({request,env:environment});
 return {status:response.status,data:await response.json()};
}
function check(actual,expected,label){assert.equal(actual,expected,label);console.log(`PASS ${++n}: ${label}`);}
const comment=(overrides={})=>({page:'/nhan-vat/tan-muc/',name:'Reader',body:'Nội dung trao đổi',turnstileToken:'valid-test-token',...overrides});
try {
 check((await req('comments?page=/',{environment:{}})).status,503,'missing DB returns 503');
 check((await req('comments',{method:'POST',body:comment(),origin:'https://evil.test'})).status,403,'foreign origin blocked');
 check((await req('admin/comments',{method:'POST',body:{}})).status,401,'admin requires bearer');
 check((await req('comments',{method:'POST',body:comment({turnstileToken:'invalid'}),ip:'192.0.2.2'})).status,403,'invalid Turnstile blocked');
 check((await req('comments',{method:'POST',body:'x'.repeat(12001)})).status,413,'streaming body cap enforced');
 const payload="Nice chapter! '); DROP TABLE comments; --";
 const sent=await req('comments',{method:'POST',body:comment({body:payload}),ip:'192.0.2.3'});
 check(sent.status,201,'valid comment accepted');
 check(sent.data.status,'pending','new comments await moderation');
 let list=await req('comments?page=/nhan-vat/tan-muc/');
 check(list.data.comments.length,0,'pending comment not public');
 check((await req('comments',{method:'POST',body:comment(),authenticated:false,ip:'192.0.2.21'})).status,401,'comment requires a verified account session');
 const queue=await req('admin/comments',{method:'POST',body:{},token:env.ADMIN_TOKEN});
 check(queue.data.comments[0].body,payload,'SQL-like content stored as literal text');
 check((await req('admin/moderate',{method:'POST',body:{id:sent.data.id,status:'approved'},token:env.ADMIN_TOKEN})).status,200,'admin can approve');
 list=await req('comments?page=/nhan-vat/tan-muc/');
 check(list.data.comments[0].body,payload,'approved comment public with literal body');
 check((await req('comments',{method:'POST',body:comment({page:'/phim/',parentId:sent.data.id}),ip:'192.0.2.4'})).status,201,'global discussion accepts a reply from another page');
 check((await req('comments',{method:'POST',body:comment({parentId:sent.data.id}),ip:'192.0.2.4'})).status,201,'reply to approved same-page parent accepted');
 check((await req('reports',{method:'POST',body:{commentId:sent.data.id,reason:'Kiểm tra báo cáo',turnstileToken:'valid-test-token'},ip:'192.0.2.5'})).status,201,'report accepted');
 check((await req('admin/reports',{method:'POST',body:{},token:env.ADMIN_TOKEN})).data.reports.length,1,'admin can read report');
 for(let i=0;i<12;i++) check((await req('comments',{method:'POST',body:comment(),ip:'192.0.2.99'})).status,201,`rate request ${i+1} allowed`);
 check((await req('comments',{method:'POST',body:comment(),ip:'192.0.2.99'})).status,429,'thirteenth request rate limited');
 check((await req('admin/moderate',{method:'POST',body:{id:sent.data.id,status:'rejected'},token:env.ADMIN_TOKEN})).status,200,'admin can reject');
 check((await req('comments?page=/nhan-vat/tan-muc/')).data.comments.length,0,'rejected comment absent from public results');
 console.log(`${n} backend assertions passed.`);
} finally {globalThis.fetch=realFetch;db.close();}
