import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import {onRequest} from '../functions/api/[[path]].js';
const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync('db/schema.sql','utf8'));
const DB={async batch(statements){db.exec("BEGIN");try{const result=statements.map(s=>({meta:db.prepare(s.sql).run(...s.args)}));db.exec("COMMIT");return result}catch(error){db.exec("ROLLBACK");throw error}},prepare(sql){return{sql,args:[],bind(...args){this.args=args;return this},async first(){return db.prepare(sql).get(...this.args)||null},async all(){return{results:db.prepare(sql).all(...this.args)}},async run(){return db.prepare(sql).run(...this.args)}}}};
const env={DB,ADMIN_TOKEN:'test-only-owner-key',RATE_LIMIT_SALT:'test-only-rate-key'};
const digest=async text=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))).toString('hex');
for(const [id,role,locked] of [['reader','member',0],['moderator','admin',0],['locked','member',1]]){db.prepare('INSERT INTO users(id,google_sub,email,name,role,chat_locked) VALUES(?,?,?,?,?,?)').run(id,id,id+'@example.test',id,role,locked);db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(await digest(id+'-session'),id,Math.floor(Date.now()/1000)+3600)}
for(const [id,user,status] of [['r1','reader','approved'],['r2','reader','pending'],['r3','reader','rejected'],['l1','locked','approved']])db.prepare("INSERT INTO comments(id,user_id,page,name,body,status) VALUES(?,?,'/cong-dong/',?,'Nội dung kiểm tra',?)").run(id,user,user,status);
for(const [type,id,user] of [['post','/phim/','reader'],['post','/truyen/','reader'],['comment','l1','reader'],['post','/phim/','locked'],['post','/truyen/','locked']])db.prepare('INSERT INTO likes(target_type,target_id,user_id) VALUES(?,?,?)').run(type,id,user);
const expires=Math.floor(Date.now()/1000)+3600,key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.ADMIN_TOKEN),{name:'HMAC',hash:'SHA-256'},false,['sign']),signature=Buffer.from(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('owner-session:'+expires))).toString('base64url'),ownerCookie='mtk_owner_session='+expires+'.'+signature;
async function req(path,user='reader',body,owner=false){const headers={Cookie:owner?ownerCookie:'mtk_session='+user+'-session',Origin:'https://example.test','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.10'},request=new Request('https://example.test/api/'+path,{method:body===undefined?'GET':'POST',headers,...(body===undefined?{}:{body:JSON.stringify(body)})});const response=await onRequest({request,env});return{status:response.status,data:await response.json()}}
db.exec('DROP TABLE supporter_accounts');
assert.equal((await req('admin/supporters','moderator',{action:'add',displayName:'Người thử',email:'reader@example.test'})).status,403);
assert.equal((await req('admin/supporters','reader',{action:'add',displayName:'Người thử',email:'not-an-email'},true)).status,400);
assert.equal((await req('admin/supporters','reader',{action:'add',displayName:'Người thử',email:' READER@Example.Test '},true)).status,201);
assert.equal((await req('auth/me')).data.user.isSupporter,true);
let result=await req('admin/supporters','reader',{action:'list',query:'reader@example.test'},true);assert.equal(result.data.total,1);const id=result.data.supporters[0].id;assert.equal(result.data.supporters[0].email,'reader@example.test');
const publicList=await req('supporters');assert(!JSON.stringify(publicList.data).includes('reader@example.test'));
const comments=await req('comments');assert.equal(comments.data.comments.find(c=>c.user_id==='reader').is_supporter,1);assert(!JSON.stringify(comments.data).includes('reader@example.test'));
assert.equal((await req('admin/supporters','reader',{action:'update',id,displayName:'Đổi tên',email:'locked@example.test'},true)).status,200);
assert.equal((await req('auth/me')).data.user.isSupporter,false);assert.equal((await req('auth/me','locked')).data.user.isSupporter,true);
assert.equal((await req('admin/supporters','reader',{action:'update',id,displayName:'Đổi tên',email:''},true)).status,200);assert.equal((await req('auth/me','locked')).data.user.isSupporter,false);
assert.equal((await req('admin/supporters','reader',{action:'update',id:'missing',displayName:'Đổi tên',email:'reader@example.test'},true)).status,404);
console.log('Supporter badges passed: owner-only edits, email normalization/validation/search, private email, public comment flag, reassignment and removal.');

await req('admin/supporters','reader',{action:'update',id,displayName:'Đổi tên',email:'reader@example.test'},true);assert.equal((await req('admin/supporters','reader',{action:'delete',id},true)).status,200);assert.equal((await req('auth/me')).data.user.isSupporter,false);assert.equal(db.prepare('SELECT COUNT(*) AS total FROM supporter_accounts').get().total,0);console.log('Deleting supporter clears linked private email and badge.');
