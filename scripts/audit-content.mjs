import fs from 'node:fs';
import path from 'node:path';
import {entryImage,entryGallery,matchesSubject} from './media.mjs';

const read = name => JSON.parse(fs.readFileSync(`src/data/${name}`, 'utf8'));
const records = new Map(read('lore.json').map(entry => [entry.slug, entry]));
for (const name of ['character-details.json', 'world-details.json']) {
  for (const entry of read(name)) records.set(entry.slug, { ...records.get(entry.slug), ...entry });
}
const entries = [...records.values()];
const media = read('media.json');
const local = image => Boolean(image?.src && fs.existsSync(path.join('public', image.src.slice(1))));
const sourceHosts = {};
const issues = [];
const imageCoverage = [];

for (const entry of entries) {
  if (!entry.sources?.length) issues.push(`${entry.slug}: thiếu tham chiếu nội bộ`);
  for (const source of entry.sources || []) {
    try {
      const host = new URL(source.url).hostname;
      sourceHosts[host] = (sourceHosts[host] || 0) + 1;
    } catch {
      issues.push(`${entry.slug}: URL tham chiếu sai định dạng`);
    }
  }
  const exact = entryImage(media,entry);
  if(exact&&!local(exact))issues.push(entry.slug+': thiếu ảnh đã đối chiếu');
  for(const image of entryGallery(media,entry))if(!matchesSubject(image,entry.slug))issues.push(entry.slug+': kho ảnh sai chủ thể');
  imageCoverage.push({slug:entry.slug,title:entry.title,type:exact?(exact.kind==='concept'?'thiết kế nhân vật':exact.kind==='illustration'?'minh họa khái niệm':'ảnh đúng chủ thể'):'đang cập nhật',words:(entry.sections?.flatMap(s=>s.paragraphs)||entry.body||[]).join(' ').split(/\s+/).filter(Boolean).length});
}
for (const [key, image] of Object.entries(media.images)) if (!local(image)) issues.push(`${key}: thiếu tệp ảnh cục bộ`);
for (const image of media.gallery) if (!local(image)) issues.push(`${image.src}: thiếu tệp thư viện cục bộ`);

const result = {
  auditedAt: new Date().toISOString(),
  entryCount: entries.length,
  entriesWithReferences: entries.filter(entry => entry.sources?.length).length,
  sourceHostCounts: sourceHosts,
  mediaImages: Object.keys(media.images).length,
  galleryImages: media.gallery.length,
  entrySpecificImages: imageCoverage.filter(entry => entry.type !== 'đang cập nhật').length,
  pendingImages: imageCoverage.filter(entry => entry.type === 'đang cập nhật').length,
  thinProfiles:imageCoverage.filter(entry=>entry.words<150),
  blockedMedia:Object.entries(media.images).filter(([key,image])=>!image.verified).map(([key,image])=>({key,reason:image.reviewNote})),
  issues,
  imageCoverage,
};
fs.writeFileSync('src/data/content-audit.json', `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({
  entries: result.entryCount,
  references: `${result.entriesWithReferences}/${result.entryCount}`,
  mediaFiles: `${result.mediaImages}/${result.mediaImages}`,
  galleryImages: `${result.galleryImages}/${result.galleryImages}`,
  entrySpecificImages: result.entrySpecificImages,
  pendingImages: result.pendingImages,
  issues: result.issues.length,
}, null, 2));
if (issues.length) process.exitCode = 1;
