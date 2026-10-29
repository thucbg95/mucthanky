import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const base = 'https://truyenfull.live/muc-than-ky/';
const output = path.resolve('src/data/novel-chapters.json');
const headers = { 'user-agent': 'MucThanKy-content-sync/1.0 (licensed text import)' };

function decode(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp|ndash|mdash|hellip|ldquo|rdquo|lsquo|rsquo);/gi, (whole, entity) => {
    const key = entity.toLowerCase();
    if (key[0] === '#') {
      const number = key[1] === 'x' ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
      return Number.isFinite(number) ? String.fromCodePoint(number) : whole;
    }
    return ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’' })[key] ?? whole;
  });
}

function textOnly(value) {
  return decode(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')).trim();
}

async function fetchHtml(url, attempt = 0) {
  try {
    const response = await fetch(url, { headers, redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch (error) {
    if (attempt >= 3) throw new Error(`${url}: ${error.message}`);
    await delay(700 * (attempt + 1));
    return fetchHtml(url, attempt + 1);
  }
}

function chapterLinks(html) {
  const found = new Map();
  const pattern = /<a\b[^>]*href=["']([^"']*\/chuong-(\d+)\/?)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const number = Number(match[2]);
    const title = textOnly(match[3]).replace(new RegExp(`^Chương\\s*${number}\\s*[:：·-]?\\s*`, 'i'), '').trim();
    if (title && title !== String(number)) found.set(number, title);
  }
  return found;
}

function extractParagraphs(html) {
  const block = html.match(/<div\s+id=["']chapter-c["'][^>]*>([\s\S]*?)<\/div>\s*<div\s+id=["']ads-chapter-bottom["']/i)?.[1];
  if (!block) throw new Error('Không tìm thấy vùng nội dung chương');
  const paragraphs = [];
  const matches = [...block.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi)];
  for (const match of matches) {
    if (/display\s*:\s*none|visibility\s*:\s*hidden/i.test(match[1])) continue;
    const pieces = decode(match[2].replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, ''))
      .split(/\n+/).map(part => part.replace(/\s+/g, ' ').trim()).filter(Boolean);
    for (const paragraph of pieces) {
      if (/^(truyen\s*full|truyenfull|truyenfullvn|truyenfulllive)\b/i.test(paragraph)) continue;
      paragraphs.push(paragraph);
    }
  }
  if (!paragraphs.length) {
    const plain = decode(block
      .replace(/<div\b[^>]*id=["']ads-[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<br\s*\/?\s*>\s*<br\s*\/?\s*>/gi, '\n\n')
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<[^>]*>/g, ''));
    for (const part of plain.split(/\n+/)) {
      const paragraph = part.replace(/\s+/g, ' ').trim();
      if (paragraph && !/^(truyen\s*full|truyenfull|truyenfullvn|truyenfulllive)\b/i.test(paragraph)) paragraphs.push(paragraph);
    }
  }
  if (!paragraphs.length) throw new Error('Chương không có đoạn văn đọc được');
  return paragraphs;
}

async function parallel(items, concurrency, task) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      await task(items[index], index);
    }
  }));
}

const existing = JSON.parse(fs.readFileSync(output, 'utf8'));
const existingByNumber = new Map(existing.map(chapter => [Number(chapter.number), chapter]));
const firstPage = await fetchHtml(base);
const numbers = [...firstPage.matchAll(/\/chuong-(\d+)\//g)].map(match => Number(match[1]));
const latest = Math.max(...numbers);
if (!Number.isFinite(latest) || latest < 1) throw new Error('Không đọc được số chương mới nhất từ trang truyện.');

const missing = Array.from({ length: latest }, (_, index) => index + 1).filter(number => !existingByNumber.has(number));
if (!missing.length) {
  console.log(`Đã có đủ ${latest} chương; không cần nhập thêm.`);
  process.exit(0);
}

const firstMissing = Math.min(...missing);
const startPage = Math.floor((firstMissing - 1) / 50) + 1;
const endPage = Math.ceil(latest / 50);
const titles = chapterLinks(firstPage);
const listPages = Array.from({ length: Math.max(0, endPage - startPage) }, (_, index) => startPage + index + 1);
await parallel(listPages, 4, async page => {
  const html = await fetchHtml(`${base}trang-${page}/`);
  for (const [number, title] of chapterLinks(html)) titles.set(number, title);
});

console.log(`Nguồn có ${latest} chương; đang nhập ${missing.length} chương còn thiếu (bắt đầu từ ${firstMissing}).`);
const imported = new Map();
let completed = 0;
const failures = [];
await parallel(missing, 8, async number => {
  try {
    const html = await fetchHtml(`${base}chuong-${number}/`);
    const content = extractParagraphs(html);
    imported.set(number, { number, title: titles.get(number) || `Chương ${number}`, kind: 'full', content, summary: '', source: 'Truyenfull.live', sourceUrl: `${base}chuong-${number}/` });
  } catch (error) {
    failures.push({ number, message: error.message });
  }
  completed++;
  if (completed % 25 === 0 || completed === missing.length) console.log(`Đã xử lý ${completed}/${missing.length}; lấy được ${imported.size}.`);
});

for (const [number, chapter] of imported) existingByNumber.set(number, chapter);
const merged = [...existingByNumber.values()].sort((a, b) => Number(a.number) - Number(b.number));
const temporary = `${output}.tmp`;
fs.writeFileSync(temporary, JSON.stringify(merged), 'utf8');
fs.renameSync(temporary, output);
fs.writeFileSync(path.resolve('src/data/novel-import-truyenfull-errors.json'), JSON.stringify(failures, null, 2), 'utf8');

if (failures.length) {
  console.error(`Đã lưu ${imported.size} chương. Còn ${failures.length} chương lỗi; chạy lại lệnh để thử nhập tiếp.`);
  process.exitCode = 1;
} else {
  console.log(`Hoàn tất: dữ liệu hiện có ${merged.length} chương, đến chương ${latest}.`);
}
