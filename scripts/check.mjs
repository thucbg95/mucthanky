import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const files=[];
function walk(dir){
  for(const item of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,item.name);
    item.isDirectory()?walk(file):files.push(file);
  }
}
walk('dist');
const htmlFiles=files.filter(file=>file.endsWith('.html'));
let links=0;
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  assert(html.includes('<html lang="vi"'),file);
  assert(html.includes('data-theme-toggle'),`${file}: theme toggle`);
  assert(html.includes('href="/assets/favicon.png"')&&!html.includes('href="/assets/favicon.svg"'),`${file}: PNG favicon`);
  assert(html.includes('/assets/style.css?v=')&&html.includes('/assets/app.js?v='),`${file}: shared theme assets`);
  assert(html.includes('rel="canonical"'),file);
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,`${file} h1`);
  for(const match of html.matchAll(/(?:href|src)="(\/[^"?#]*)/g)){
    const target=match[1];
    if(target.startsWith('//')||target.startsWith('/api/'))continue;
    let local=path.join('dist',target);
    if(!path.extname(local))local=path.join(local,'index.html');
    assert(fs.existsSync(local),`${file}: broken ${target}`);
    links++;
  }
}

const css=fs.readFileSync('dist/assets/style.css','utf8');
assert(css.includes('html[data-theme="dark"] .profile-picture{background:#1b262c;color:#ecf0ed}'),'profile picture follows dark theme');
assert(css.includes('html[data-theme="dark"] .profile-picture figcaption{background:#1b262c;color:#bac3c2;'),'profile caption stays readable in dark theme');
assert(css.includes('html[data-theme="dark"] .facts dd{color:#ecf0ed}'),'profile facts stay readable in dark theme');
assert(css.includes('html[data-theme="dark"] .quickbar a:hover,html[data-theme="dark"] .quickbar a:focus-visible{background:#293a40;color:#f0d7a2}'),'quick links remain readable on dark hover and keyboard focus');
assert(css.includes('.schedule-toolbar #schedule-count{flex:0 0 100%;font-size:max(15px,calc(15px * var(--font-scale,1)))'),'mobile episode count gets its own row and readable size');
assert(css.includes('html:not([data-theme=dark]) .hero-shade{background:linear-gradient(180deg,transparent 34%,#f1ede3 58%,#f1ede3 100%)}'),'mobile light hero has a coordinated warm treatment');
assert(css.includes('@media(max-width:760px) and (hover:none)')&&css.includes('.font-floater:hover,.font-floater:focus-within{opacity:.8;transform:none}'),'touch controls clear sticky hover styling');
assert(css.includes('.gallery-lightbox')&&css.includes('.film-player'),'gallery and video player receive responsive styles');
assert(fs.readFileSync('dist/assets/app.js','utf8').includes('data-gallery-open'),'gallery opens local image viewer');
const film=fs.readFileSync('dist/phim/index.html','utf8');
assert(film.includes('id="video-trailer"')&&film.includes('player.bilibili.com/player.html'),'film page embeds the official trailer player');
assert(fs.readFileSync('dist/_headers','utf8').includes('frame-src https://challenges.cloudflare.com https://player.bilibili.com'),'CSP permits official Bilibili player');
const character=fs.readFileSync('dist/bach-khoa/tan-muc/index.html','utf8');
assert(character.includes('data-gallery-open')&&character.includes('/assets/film/'),'character gallery uses local image files and an in-site viewer');
assert(!character.includes('href="https://www.bilibili.com/bangumi/media/md21082961"'),'profile gallery does not send image clicks to an external page');
assert(fs.readFileSync('dist/assets/app.js','utf8').includes("setTheme(storage.get('mtk-theme-v2','dark'))"),'dark theme is the app fallback');
assert.equal([...css.matchAll(/@import\b/g)].length,1,'font stylesheet should be imported once');
assert(css.indexOf('@import')<css.indexOf('{'),'@import must precede style rules');
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'unbalanced CSS blocks');
const home=fs.readFileSync('dist/index.html','utf8');
assert(home.includes('class="cultivation-steps"'),'homepage cultivation component class');
assert(home.includes('<html lang="vi" data-theme="dark">'),'dark theme is the no-preference default');
assert(!home.includes('牧神记 · BÁCH KHOA PHIM & TIỂU THUYẾT')&&!home.includes('Tư liệu có nguồn · Biên soạn tiếng Việt'),'top info strip removed');
assert(home.includes('Chào mừng đến với mucthanky.com'),'homepage welcome copy uses sentence case');
const floatingStart=home.indexOf('<div class="font-floater"');
const floatingEnd=home.indexOf('</div>',floatingStart);
const floating=home.slice(floatingStart,floatingEnd);
assert(floating.indexOf('https://www.facebook.com/mucthanky.official')<floating.indexOf('https://www.facebook.com/groups/mucthanky'),'fanpage appears above Facebook group');
assert(floating.indexOf('data-font="larger"')<floating.indexOf('data-font="smaller"'),'A+ appears above A−');
assert(home.includes('Đã ẩn mục có spoiler')||fs.readFileSync('dist/assets/app.js','utf8').includes('Đã ẩn mục có spoiler'),'spoiler filter uses completed state label');
assert(!htmlFiles.some(file=>fs.readFileSync(file,'utf8').includes('realm-track')),'legacy colliding cultivation class');
assert(css.includes('html[data-theme=dark] .btn{background:#263840'),'dark mode button contrast');
assert(css.includes('html[data-theme=dark] .schedule-toolbar .text-link{color:#eaf0ed'),'dark mode episode links');
assert(css.includes('html:not([data-theme=dark]) .hero h1{color:#173d33;text-shadow:none}'),'light hero title uses the light-theme text color');
assert(css.includes('.nav>.theme-toggle>span{display:grid!important;place-items:center;width:22px;height:22px'),'theme symbol is centered in its fixed control box');
assert(css.includes('html[data-theme=dark] #search-results>a:is(:hover,:focus-visible){background:#2b3d43;color:#f4d89a'),'dark search hover uses the dark palette');
assert(css.includes('html:not([data-theme=dark]) .hero .actions .btn.primary{background:#174c41!important'),'light hero primary action has stronger contrast');
assert(css.includes('html:not([data-theme=dark]) .hero{background:var(--soft,#e7efec);color:var(--text,#172d33)'),'light hero uses the site sage palette');
assert(css.includes('html:not([data-theme=dark]) .hero-shade{background:linear-gradient(180deg,rgba(12,28,31,.02)'),'light hero overlay is coordinated across breakpoints');
assert(css.lastIndexOf('A single light-theme treatment')>css.lastIndexOf('@media(max-width:760px)'),'shared light hero rules override earlier mobile-specific palette');
assert(fs.readFileSync('dist/assets/app.js','utf8').includes("themeButton.innerHTML=theme==='dark'?'<span aria-hidden=\"true\">☼</span>':'<span aria-hidden=\"true\">◐</span>'"),'theme button restores its original symbols');
assert(fs.existsSync('dist/assets/favicon.png'),'PNG favicon asset is deployed');
assert(css.includes('#search-results{padding:0 12px}'),'search results horizontal padding');
assert(css.includes('html:not([data-theme=dark]) .episode-status-card{background:linear-gradient(120deg,#e5eee7,#f3eedf)'),'episode card uses light-theme palette');
assert(css.includes('html[data-theme=dark] .episode-status-card{background:linear-gradient(120deg,#1a3035,#203c40)'),'episode card uses dark-theme palette');
assert(css.includes('html:not([data-theme=dark]){color-scheme:light;--bg:#f2f6f5;--panel:#fff;--text:#172d33'),'light theme uses the refreshed high-contrast palette');
assert(css.includes('@media(max-width:760px){.font-floater{opacity:.6}.back-top{opacity:.8}footer .wrap{padding-right:68px}}'),'mobile floating control opacity and footer clearance');
assert(css.includes('.back-top{width:40px!important;height:40px!important;right:22px!important;bottom:22px!important}'),'back-to-top matches floating control size');
assert(css.includes('.font-floater button,.font-floater .float-social{box-sizing:border-box;display:grid;place-items:center;width:40px;height:40px;min-width:40px;min-height:40px'),'floating social and text controls share dimensions');
for(const [asset,attribute] of [['style.css','href'],['app.js','src']]){
  const html=fs.readFileSync('dist/phim/index.html','utf8');
  const match=html.match(new RegExp(`${attribute}="/assets/${asset}\\?v=([a-f0-9]{12})"`));
  assert(match,`${asset} content hash is linked in page HTML`);
  const hash=createHash('sha256').update(fs.readFileSync(path.join('dist','assets',asset))).digest('hex').slice(0,12);
  assert.equal(match[1],hash,`${asset} hash matches deployed bytes`);
}
const headers=fs.readFileSync('dist/_headers','utf8');
assert(headers.includes('/assets/style.css\n  Cache-Control: public, max-age=31536000, immutable'),'versioned CSS cache policy');
assert(headers.includes('Cache-Control: no-cache, must-revalidate'),'HTML revalidation policy');

const data=JSON.parse(fs.readFileSync('dist/search.json','utf8'));
for(const slug of ['bach-cu-nhi','hoa-thien-ton','so-to-nhan-hoang','chu-nhan-di-la-cung']){
  assert(data.some(entry=>entry.slug===slug),`new Thư Viện Anime profile indexed: ${slug}`);
  const profile=fs.readFileSync(`dist/bach-khoa/${slug}/index.html`,'utf8');
  assert(profile.includes('thuvienanime.net/'),`${slug} cites its child source page`);
}
const media=JSON.parse(fs.readFileSync('src/data/media.json','utf8'));
for(const image of [...Object.values(media.images),media.hero,...media.gallery]){
  const file=path.join('dist',image.src.replace(/^\//,''));
  assert(fs.existsSync(file),'missing media asset '+image.src);
  assert(new URL(image.sourceUrl).protocol==='https:','media source must use HTTPS '+image.src);
}
const slugs=new Set();
for(const entry of data){
  assert(!slugs.has(entry.slug),'duplicate '+entry.slug);
  slugs.add(entry.slug);
  assert(entry.sources.length>0,'missing source '+entry.slug);
  for(const source of entry.sources)assert(new URL(source.url).protocol==='https:');
  const profile=path.join('dist','bach-khoa',entry.slug,'index.html');
  assert(fs.existsSync(profile),'missing profile '+entry.slug);
  assert(fs.readFileSync(profile,'utf8').includes('class="profile-picture'),'profile illustration missing '+entry.slug);
}
const characters=fs.readFileSync('dist/nhan-vat/index.html','utf8');
assert.equal((characters.match(/class="card has-photo/g)||[]).length,data.filter(entry=>entry.category==='nhan-vat').length,'character cards missing artwork');
for(const file of ['public/assets/app.js','scripts/build.mjs','scripts/ui.mjs','scripts/backend-test.mjs','sync/worker.js','functions/api/[[path]].js']){
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
}
console.log(`PASS: ${htmlFiles.length} pages, ${links} internal links, ${data.length} sourced profiles with art, responsive CSS structure, JS syntax.`);
