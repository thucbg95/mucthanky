import fs from 'node:fs';
import assert from 'node:assert/strict';
import {entryImage,entryGallery} from './media.mjs';
const media=JSON.parse(fs.readFileSync('src/data/media.json'));
const entries=JSON.parse(fs.readFileSync('dist/search.json'));
for(const entry of entries){
 const photo=entryImage(media,entry),gallery=entryGallery(media,entry);
 for(const image of gallery){assert(image.verified&&image.subjects.includes(entry.slug));assert(fs.existsSync('dist'+image.src));}
 const html=fs.readFileSync('dist/bach-khoa/'+entry.slug+'/index.html','utf8');
 if(!photo)assert(html.includes('Ảnh đang cập nhật'),entry.slug+': missing pending state');
 for(const match of html.matchAll(/data-gallery-src="([^"]+)"/g))assert(gallery.some(image=>image.src===match[1]),entry.slug+': unrelated gallery image');
}
assert(!entryImage(media,{slug:'unknown-character',category:'nhan-vat',image:'poster'}),'A generic poster must not become a character portrait');
assert(!entryGallery(media,{slug:'thon-truong',gallery:['tan-muc','poster','nguyet-luong-thu']}).some(image=>image.subjects.includes('tan-muc')),'Unrelated character images must not leak into galleries');
assert(fs.readFileSync('dist/phim/index.html','utf8').includes('/assets/verified/poster-2026.webp'),'film page needs official poster');
console.log('Media checks passed: '+entries.length+' profiles, subject filtering, galleries, local files and film poster.');
