import fs from 'node:fs';
import path from 'node:path';

const read = name => JSON.parse(fs.readFileSync(`src/data/${name}`, 'utf8'));
const records = new Map(read('lore.json').map(entry => [entry.slug, entry]));
for (const name of ['character-details.json', 'world-details.json']) {
  for (const entry of read(name)) records.set(entry.slug, { ...records.get(entry.slug), ...entry });
}
const entries = [...records.values()];
const media = read('media.json');
const artByCategory = {
  'tong-quan': 'poster', 'nhan-vat': 'poster', 'dia-danh': 'tan-lao-thon-concept',
  'the-luc': 'dien-khang-quoc-su', 'canh-gioi': 'canh-gioi', 'thuat-ngu': 'ky-ngo',
  'cong-phap': 'tap-45', 'than-thong': 'ky-ngo', 'bach-khoa': 'poster',
  'bao-vat': 'ngoc-boi-tan-muc', 'vu-khi': 'kiem-hoan', 'chung-toc': 'viem-tinh-tinh',
  'phuong-tien': 'thuyen-mat-troi', 'trang-phuc': 'ao-tan-muc',
};
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
  const exact = media.images?.[entry.image || entry.slug];
  const fallback = media.images?.[artByCategory[entry.category]];
  const exactImage = local(exact);
  if (!exactImage && !local(fallback)) issues.push(`${entry.slug}: không có ảnh cục bộ`);
  imageCoverage.push({ slug: entry.slug, type: exactImage ? 'ảnh riêng' : 'minh họa chuyên mục' });
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
  entrySpecificImages: imageCoverage.filter(entry => entry.type === 'ảnh riêng').length,
  categoryIllustrations: imageCoverage.filter(entry => entry.type === 'minh họa chuyên mục').length,
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
  categoryIllustrations: result.categoryIllustrations,
  issues: result.issues.length,
}, null, 2));
if (issues.length) process.exitCode = 1;
