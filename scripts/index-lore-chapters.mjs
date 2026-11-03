import fs from 'node:fs';
const read=name=>JSON.parse(fs.readFileSync('src/data/'+name+'.json','utf8'));
const records=new Map(read('lore').map(e=>[e.slug,e]));
for(const name of ['character-details','world-details','novel-details'])if(fs.existsSync('src/data/'+name+'.json'))for(const entry of read(name))records.set(entry.slug,{...records.get(entry.slug),...entry});
const fold=s=>' '+String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()+' ';
const chapters=read('novel-chapters').filter(c=>c.kind==='full'&&c.content?.length).map(c=>({...c,text:fold(c.content.join(' '))}));
const variants={'dien-khang':['Duyên Khang'],'dien-khang-quoc-su':['Duyên Khang quốc sư'],'dien-phong-de':['Duyên Phong Đế'],'ngoc-boi-tan-muc':['ngọc bội'],'long-ke':['Long kê'],'gio-kim-tu-ba-ba':['giỏ kim chỉ'],'y-phuc-hanh-trinh-tan-muc':[]};
const result={};
for(const entry of records.values()){
 const names=[entry.title.split(' / ')[0].split(' · ')[0],...(entry.aliases||[]).filter(s=>/[À-ỹĐđ]/.test(s)),...(variants[entry.slug]||[])].filter(s=>s.length>=5&&!/^(Celestial|Tales of)/i.test(s));
 const terms=[...new Set(names.map(fold))];
 const hits=chapters.filter(c=>terms.some(term=>c.text.includes(term)));
 const explicit=(entry.sources||[]).map(source=>Number(source.url.match(/mucthanky\.com\/truyen\/chuong-(\d+)\//)?.[1])).filter(number=>number&&hits.some(c=>c.number===number));
 const preferred=[...new Set(explicit)].slice(0,4);
 const spread=hits.length?[hits[0].number,hits.at(-1).number,hits[Math.floor((hits.length-1)/2)].number,hits[1]?.number,...hits.map(c=>c.number)]:[];
 const selected=new Set([...new Set([...preferred,...spread])].filter(Boolean).slice(0,6));
 result[entry.slug]={count:hits.length,terms:names,chapters:hits.filter(c=>selected.has(c.number)).map(c=>({number:c.number,title:c.title,url:'/truyen/chuong-'+c.number+'/',kind:/hỏi đáp|giải đáp|ngoại truyện/i.test(c.title)?'tu-lieu-bo-sung':'chuong-truyen'}))};
}
fs.writeFileSync('src/data/lore-chapter-references.json',JSON.stringify(result,null,2)+'\n');
console.log('Indexed '+chapters.length+' full chapters for '+records.size+' entries; '+Object.values(result).filter(e=>e.count).length+' entries have literal name mentions.');
