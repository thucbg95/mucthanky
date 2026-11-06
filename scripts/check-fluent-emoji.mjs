import fs from 'node:fs';
import assert from 'node:assert/strict';
const map=JSON.parse(fs.readFileSync('public/assets/fluent-emoji/map.json','utf8'));
for(const glyph of ['😀','😄','😂','🙂','😊','😍','🤔','😮','😢','🙏','👍','👏','❤️','🔥','✨','🌟','🎉','💪','👍🏽'])assert(map[glyph.replaceAll('\ufe0f','')],glyph+' missing');
for(const key of Object.values(map)){assert(/^[\da-f]+(?:-[\da-f]+)*$/.test(key));const svg=fs.readFileSync('public/assets/fluent-emoji/'+key+'.svg','utf8');assert(svg.includes('<svg'));assert(!/<script|onload=/i.test(svg))}
assert(fs.readFileSync('public/assets/fluent-emoji/LICENSE.txt','utf8').includes('Microsoft'));
console.log(Object.keys(map).length+' local Fluent emoji verified; picker coverage and skin tones passed.');
