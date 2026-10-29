import fs from 'node:fs';
import path from 'node:path';

const base = 'https://vivutruyen.com/truyen/muc-than-ky';
const headers = {
  'User-Agent': 'Mozilla/5.0 (compatible; MucThanKy licensed-content importer)',
  'Referer': base,
  'X-Requested-With': 'XMLHttpRequest',
};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPage(url, expectedPath = '') {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, { headers, redirect: 'follow', signal: AbortSignal.timeout(20000) });
      const html = await response.text();
      if (!response.ok || (expectedPath && !response.url.includes(expectedPath))) {
        throw new Error(`Unexpected response ${response.status}: ${response.url}`);
      }
      return html;
    } catch (error) {
      lastError = error;
      await sleep(500 * (attempt + 1));
    }
  }
  throw lastError;
}

function decodeHtml(value) {
  const named = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    hellip: '…', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’',
    ndash: '–', mdash: '—', bull: '•', copy: '©',
  };
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function chapterLinks(html) {
  const found = new Map();
  const pattern = /href=["']([^"']*\/truyen\/muc-than-ky\/chuong-(\d+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const number = Number(match[2]);
    found.set(number, {
      number,
      url: new URL(match[1], base).href,
      title: decodeHtml(match[3].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
        .replace(/^Chương\s+\d+\s*[:：-]?\s*/i, ''),
    });
  }
  return [...found.values()];
}

function chapterBody(html, expectedNumber) {
  const heading = html.match(/<span[^>]*class=["'][^"']*current-chapter[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] || '';
  const title = decodeHtml(heading.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
    .replace(/^Chương\s+\d+\s*[:：-]?\s*/i, '');
  const block = html.match(/<div\s+class=["']truyen["'][^>]*>([\s\S]*?)<\/div>/i)?.[1];
  if (!block) throw new Error(`Không tìm thấy nội dung chương ${expectedNumber}`);
  const plain = decodeHtml(block
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|blockquote|h[1-6])\s*>/gi, '\n\n')
    .replace(/<(?:script|style)[^>]*>[\s\S]*?<\/(?:script|style)\s*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\r/g, '')
    .replace(/[\t\f\v ]+\n/g, '\n')
    .replace(/\n[\t ]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim());
  const paragraphs = plain.split(/\n{2,}/).map(text => text.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
  const wordCount = plain.trim().split(/\s+/).length;
  if (wordCount < 100 || paragraphs.length < 2) throw new Error(`Nội dung chương ${expectedNumber} quá ngắn hoặc không parse được (${wordCount} từ)`);
  return { title, content: paragraphs, wordCount };
}

const firstPage = await fetchPage(base, '/truyen/muc-than-ky');
const pages = [...firstPage.matchAll(/href=["']https:\/\/vivutruyen\.com\/truyen\/muc-than-ky\/129\/(\d+)["']/g)]
  .map(match => Number(match[1]));
const lastPage = Math.max(1, ...pages);
const links = chapterLinks(firstPage);
for (let page = 2; page <= lastPage; page++) {
  const html = await fetchPage(`${base}/129/${page}`, '/truyen/muc-than-ky/129/');
  links.push(...chapterLinks(html));
  if (page % 5 === 0 || page === lastPage) console.log(`Đã lấy mục lục ${page}/${lastPage}`);
  await sleep(120);
}

const unique = [...new Map(links.map(link => [link.number, link])).values()]
  .sort((a, b) => a.number - b.number);
if (unique.length < 1000) throw new Error(`Mục lục không đầy đủ: chỉ tìm thấy ${unique.length} chương`);
console.log(`Tìm thấy ${unique.length} chương, từ ${unique[0].number} đến ${unique.at(-1).number}. Bắt đầu nhập nội dung…`);

const chapters = new Array(unique.length);
let cursor = 0;
let failed = [];
const workers = Array.from({ length: 5 }, async () => {
  while (true) {
    const index = cursor++;
    if (index >= unique.length) return;
    const item = unique[index];
    try {
      const html = await fetchPage(item.url, '/truyen/muc-than-ky/chuong-');
      const parsed = chapterBody(html, item.number);
      chapters[index] = {
        number: item.number,
        title: parsed.title || item.title || `Chương ${item.number}`,
        kind: 'full',
        summary: '',
        content: parsed.content,
        related: [],
        source: item.url,
        license: 'Được cấp phép nhập theo thỏa thuận của chủ website',
      };
    } catch (error) {
      failed.push({ number: item.number, url: item.url, error: error.message });
    }
    if ((index + 1) % 50 === 0 || index + 1 === unique.length) {
      console.log(`Đã xử lý ${index + 1}/${unique.length} chương · lỗi ${failed.length}`);
    }
    await sleep(100);
  }
});
await Promise.all(workers);
if (failed.length) {
  fs.writeFileSync('src/data/novel-import-errors.json', JSON.stringify(failed, null, 2));
  throw new Error(`${failed.length} chương chưa nhập được; xem src/data/novel-import-errors.json`);
}

const output = path.resolve('src/data/novel-chapters.json');
fs.writeFileSync(output, JSON.stringify(chapters, null, 2) + '\n');
console.log(`Đã lưu ${chapters.length} chương vào ${output}`);
