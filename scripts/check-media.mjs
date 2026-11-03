import fs from 'node:fs';
import assert from 'node:assert/strict';
import {entryImage,entryGallery,entryVideos,matchesEntryImage} from './media.mjs';
const media=JSON.parse(fs.readFileSync('src/data/media.json'));
const entries=JSON.parse(fs.readFileSync('dist/search.json'));
for(const entry of entries){
 const photo=entryImage(media,entry),gallery=entryGallery(media,entry);
 for(const image of gallery){assert(matchesEntryImage(image,entry.slug));
  if(image.kind==='related'){assert(media.relatedImages[entry.slug]?.sourceSlug===image.relatedSubject);assert(image.alt.includes('minh họa liên quan'));}assert(fs.existsSync('dist'+image.src));}
 assert(gallery.length<=6,entry.slug+': album exceeds six images');
 for(const video of entryVideos(media,entry)){
  if(video.src){assert(video.src.startsWith('/assets/profile-videos/'));const data=fs.readFileSync('dist'+video.src);assert(data.length>10000);assert.equal(data.toString('ascii',4,8),'ftyp',entry.slug+': invalid MP4 container');let moov=-1,mdat=-1;for(let offset=0;offset+8<data.length;){let size=data.readUInt32BE(offset),type=data.toString('ascii',offset+4,offset+8);if(type==='moov')moov=offset;if(type==='mdat')mdat=offset;if(size<8)break;offset+=size;}assert(moov>=0&&mdat>moov,entry.slug+': video must support fast start');}
  if(video.embedUrl)assert(new URL(video.embedUrl).protocol==='https:');
 }
 const html=fs.readFileSync('dist/bach-khoa/'+entry.slug+'/index.html','utf8');
 if(!photo)assert(html.includes('Ảnh đang cập nhật'),entry.slug+': missing pending state');
 for(const match of html.matchAll(/data-gallery-src="([^"]+)"/g))assert(gallery.some(image=>image.src===match[1]),entry.slug+': unrelated gallery image');
}
assert(!entryImage(media,{slug:'unknown-character',category:'nhan-vat',image:'poster'}),'A generic poster must not become a character portrait');
assert(!entryGallery(media,{slug:'thon-truong',gallery:['tan-muc','poster','nguyet-luong-thu']}).some(image=>image.subjects.includes('tan-muc')),'Unrelated character images must not leak into galleries');
assert(fs.readFileSync('dist/phim/index.html','utf8').includes('/assets/verified/poster-2026.webp'),'film page needs official poster');
assert.equal(entryVideos(media,{slug:'hu-sinh-hoa',videos:[{embedUrl:'https://player.bilibili.com/player.html?bvid=BV1Fvnh6VEcD'}]}).filter(v=>v.bvid==='BV1Fvnh6VEcD'||v.embedUrl?.includes('BV1Fvnh6VEcD')).length,1,'Prefer the local PV over duplicate embeds');
assert(!entryGallery(media,{slug:'nguoi-cam'}).some(image=>image.sourceEpisode===2&&image.sourceTime===650),'The butcher must not appear in the blacksmith album');
console.log('Media checks passed: '+entries.length+' profiles, subject filtering, galleries, local files and film poster.');
