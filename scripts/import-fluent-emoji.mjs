import fs from 'node:fs';
const root='https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/';
const tree=await(await fetch('https://api.github.com/repos/microsoft/fluentui-emoji/git/trees/main')).json();
const assets=await(await fetch(tree.tree.find(x=>x.path==='assets').url)).json();
const folders=assets.tree.filter(x=>x.type==='tree').map(x=>x.path);
fs.mkdirSync('public/assets/fluent-emoji',{recursive:true});
const map=fs.existsSync('public/assets/fluent-emoji/map.json')?JSON.parse(fs.readFileSync('public/assets/fluent-emoji/map.json','utf8')):{};let next=0,done=0,missing=[];
async function get(path){const response=await fetch(root+path.split('/').map(encodeURIComponent).join('/'));return response.ok?response:null}
await Promise.all(Array.from({length:20},async()=>{while(next<folders.length){const folder=folders[next++];try{const r=await get('assets/'+folder+'/metadata.json');if(!r)continue;const meta=await r.json(),name=folder.toLowerCase().replaceAll(' ','_'),base='assets/'+folder+'/',variants=meta.unicodeSkintones?.length?[['Default','',meta.unicode],...['Light','Medium-Light','Medium','Medium-Dark','Dark'].map((tone,i)=>[tone,'_'+tone.toLowerCase().replaceAll('-','_')+'_skin_tone',meta.unicodeSkintones[i+1]])]:[['','',meta.unicode]];for(const [tone,suffix,unicode]of variants){if(!unicode)continue;const existing=String.fromCodePoint(...unicode.split(' ').map(c=>parseInt(c,16))).replaceAll('\ufe0f','');if(map[existing])continue;const file=await get(base+(tone?tone+'/':'')+'Color/'+name+'_color'+(tone?'_'+tone.toLowerCase():'')+'.svg');if(!file){missing.push(folder+suffix);continue}const key=unicode.toLowerCase().replaceAll(' ','-'),svg=await file.text();if(!svg.includes('<svg')||/<script|onload=/i.test(svg))throw Error('Unexpected SVG');fs.writeFileSync('public/assets/fluent-emoji/'+key+'.svg',svg);map[String.fromCodePoint(...key.split('-').map(c=>parseInt(c,16))).replaceAll('\ufe0f','')]=key}}catch(e){missing.push(folder+': '+e.message)}done++;if(done%300===0)console.log('Processed '+done+'/'+folders.length)}}));
fs.writeFileSync('public/assets/fluent-emoji/map.json',JSON.stringify(map));
fs.writeFileSync('public/assets/fluent-emoji/LICENSE.txt',await(await get('LICENSE')).text());
console.log(JSON.stringify({folders:folders.length,downloaded:Object.keys(map).length,missing:missing.length,examples:missing.slice(0,8)}));
