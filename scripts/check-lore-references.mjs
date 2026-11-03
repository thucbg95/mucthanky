import fs from 'node:fs';
import assert from 'node:assert/strict';
const index=JSON.parse(fs.readFileSync('src/data/lore-chapter-references.json'));
let profiles=0,links=0;
for(const [slug,ref]of Object.entries(index)){
 const html=fs.readFileSync('dist/bach-khoa/'+slug+'/index.html','utf8');
 if(!ref.chapters.length)continue;
 profiles++;assert(html.includes('id="doi-chieu-nguyen-tac"'),slug+': chapter index not rendered');
 for(const chapter of ref.chapters){assert(fs.existsSync('dist'+chapter.url+'index.html'),slug+': missing chapter '+chapter.number);assert(html.includes('href="'+chapter.url+'"'),slug+': missing chapter link');links++;}
}
for(const slug of ['lang-thien-ton','ngu-thien-ton','thai-dich','di-la-cung']){
 const html=fs.readFileSync('dist/bach-khoa/'+slug+'/index.html','utf8');
 assert(html.includes('spoiler-notice'),slug+': missing spoiler warning');assert(html.includes('spoiler-section'),slug+': missing collapsible spoiler content');
 assert(!/<details class="article-section spoiler-section"[^>]*\sopen[\s>]/.test(html),slug+': spoilers must be collapsed initially');
}
const editorial=JSON.parse(fs.readFileSync('src/data/novel-details.json'));
assert(!editorial.find(e=>e.slug==='thai-dich').aliases.includes('Chủ nhân Di La Cung'),'Thái Dịch must remain distinct from master of Miluo Palace');
assert(editorial.find(e=>e.slug==='lam-ngu-dien').related.includes('ngu-thien-ton'),'Lam Ngự Điền needs the Ngự Thiên Tôn relationship');
console.log('Novel reference checks passed: '+profiles+' profiles, '+links+' chapter links, spoiler controls and identity corrections.');
