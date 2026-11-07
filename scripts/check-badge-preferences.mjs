import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import {onRequest} from '../functions/api/[[path]].js';
const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync('db/schema.sql','utf8'));
const DB={async batch(statements){db.exec("BEGIN");try{const result=statements.map(s=>db.prepare(s.sql).run(...s.args));db.exec("COMMIT");return result}catch(error){db.exec("ROLLBACK");throw error}},prepare(sql){return{sql,args:[],bind(...args){this.args=args;return this},async first(){return db.prepare(sql).get(...this.args)||null},async all(){return{results:db.prepare(sql).all(...this.args)}},async run(){return db.prepare(sql).run(...this.args)}}}};
const env={DB,ADMIN_TOKEN:'test-only-owner-key',RATE_LIMIT_SALT:'test-only-rate-key'};
const digest=async text=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))).toString('hex');
for(const [id,role,locked] of [['reader','member',0],['moderator','admin',0],['locked','member',1]]){db.prepare('INSERT INTO users(id,google_sub,email,name,role,chat_locked) VALUES(?,?,?,?,?,?)').run(id,id,id+'@example.test',id,role,locked);db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(await digest(id+'-session'),id,Math.floor(Date.now()/1000)+3600)}
for(const [id,user,status] of [['r1','reader','approved'],['r2','reader','pending'],['r3','reader','rejected'],['l1','locked','approved']])db.prepare("INSERT INTO comments(id,user_id,page,name,body,status) VALUES(?,?,'/cong-dong/',?,'Nội dung kiểm tra',?)").run(id,user,user,status);
for(const [type,id,user] of [['post','/phim/','reader'],['post','/truyen/','reader'],['comment','l1','reader'],['post','/phim/','locked'],['post','/truyen/','locked']])db.prepare('INSERT INTO likes(target_type,target_id,user_id) VALUES(?,?,?)').run(type,id,user);
const expires=Math.floor(Date.now()/1000)+3600,key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.ADMIN_TOKEN),{name:'HMAC',hash:'SHA-256'},false,['sign']),signature=Buffer.from(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('owner-session:'+expires))).toString('base64url'),ownerCookie='mtk_owner_session='+expires+'.'+signature;
async function req(path,user='reader',body,owner=false){const headers={Cookie:owner?ownerCookie:'mtk_session='+user+'-session',Origin:'https://example.test','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.10'},request=new Request('https://example.test/api/'+path,{method:body===undefined?'GET':'POST',headers,...(body===undefined?{}:{body:JSON.stringify(body)})});const response=await onRequest({request,env});return{status:response.status,data:await response.json()}}
db.exec('DROP TABLE user_badge_preferences');
assert.deepEqual((await req('auth/me')).data.user.badgeVisibility,{});
assert.equal((await req('badge-preferences','unknown',{visibility:{new:false}})).status,401);
assert.equal((await req('badge-preferences','reader',{visibility:{admin:false}})).status,400);
assert.equal((await req('badge-preferences','reader',{visibility:{fan:'no'}})).status,400);
assert.equal((await req('badge-preferences','reader',{visibility:{new:false,'heart-fan':false,supporter:false}})).status,200);
let r=await req('auth/me');assert.equal(r.data.user.badgeVisibility.new,false);assert.equal(r.data.user.commentCount,1);assert.equal(r.data.user.likeCount,3);
assert.deepEqual((await req('auth/me','locked')).data.user.badgeVisibility,{});
let comments=await req('comments');assert.equal(comments.data.canSeeHiddenBadges,false);assert.equal(comments.data.comments.find(c=>c.user_id==='reader').badge_visibility.new,false);
comments=await req('comments','moderator');assert.equal(comments.data.canSeeHiddenBadges,true);
r=await req('admin/comments','moderator',{});assert.equal(r.status,200);assert.equal(JSON.parse(r.data.comments.find(c=>c.user_id==='reader').badge_preferences).new,false);
await req('badge-preferences','reader',{visibility:{new:true}});r=await req('auth/me');assert.equal(r.data.user.badgeVisibility.new,true);assert.equal(r.data.user.badgeVisibility.supporter,false);
console.log('Badge settings passed: login, strict booleans, admin badge protected, per-user persistence, partial updates, unchanged achievements and admin visibility.');
