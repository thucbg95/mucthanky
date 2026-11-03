import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {onRequest} from '../functions/api/[[path]].js';
const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync('db/schema.sql','utf8'));
const names=['An','Ân','Bình','Chi','Dũng','Đạt','Giang','Hà','Khánh','Lan','Minh','Vân'];
for(let i=names.length-1;i>=0;i--)db.prepare('INSERT INTO supporter_registry(id,display_name,created_at) VALUES(?,?,?)').run('sample-'+i,names[i],`2026-10-${String(i+1).padStart(2,'0')}T00:00:00Z`);
const DB={prepare(sql){return{
 args:[],
 bind(...args){this.args=args;return this},
 async first(){return db.prepare(sql).get(...this.args)||null},
 async all(){return{results:db.prepare(sql).all(...this.args)}}
};}};
async function list(params){const response=await onRequest({request:new Request('https://example.test/api/supporters?'+new URLSearchParams(params)),env:{DB}});assert.equal(response.status,200);return response.json();}
try{
 const asc=await list({sort:'name_asc',limit:10}),tail=await list({sort:'name_asc',limit:10,offset:10});
 assert.deepEqual(asc.supporters.map(s=>s.display_name),names.slice(0,10),'Vietnamese A/Â/D/Đ order must apply before slicing the first page');
 assert.deepEqual(tail.supporters.map(s=>s.display_name),names.slice(10),'The second page must continue global name ordering');
 const desc=await list({sort:'name_desc',limit:10});assert.deepEqual(desc.supporters.map(s=>s.display_name),[...names].reverse().slice(0,10));
 const filtered=await list({sort:'name_asc',query:'bình',limit:10});assert.equal(filtered.total,1);assert.equal(filtered.overallTotal,12);assert.equal(filtered.supporters[0].display_name,'Bình');
 for(const mode of ['newest','oldest']){const result=await list({sort:mode,limit:10});assert.equal(result.supporters[0].display_name,mode==='newest'?'Vân':'An');}
 assert.equal((await list({sort:'invalid'})).sort,'newest');
 console.log('Supporter sorting passed: Vietnamese alphabetical order, both directions, pagination, search and existing date modes.');
}finally{db.close();}
