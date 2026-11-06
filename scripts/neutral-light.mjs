import fs from 'node:fs';
export function neutralLightOverrides(css){
 const scope='html:not([data-theme="dark"])';
 const gray=(r,g,b)=>Math.round(.2126*r+.7152*g+.0722*b);
 function recolor(value){
  const urls=[];value=value.replace(/url\((?:[^()"']|"[^"]*"|'[^']*')*\)/gi,url=>`__MEDIA_${urls.push(url)-1}__`);
  value=value.replace(/#([\da-f]{3,8})\b/gi,(all,h)=>{if(![3,4,6,8].includes(h.length))return all;if(h.length<5)h=[...h].map(c=>c+c).join('');const n=gray(...[0,2,4].map(i=>parseInt(h.slice(i,i+2),16))).toString(16).padStart(2,'0');return '#'+n.repeat(3)+h.slice(6)});
  value=value.replace(/rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(\s*,\s*[\d.]+)?\s*\)/gi,(_,r,g,b,a)=>{const n=gray(+r,+g,+b);return a?`rgba(${n},${n},${n}${a})`:`rgb(${n},${n},${n})`});
  return value.replace(/__MEDIA_(\d+)__/g,(_,i)=>urls[+i]);
 }
 function split(text,delimiter){let depth=0,quote='',start=0,result=[];for(let i=0;i<text.length;i++){const c=text[i];if(quote){if(c===quote&&text[i-1]!=='\\')quote='';continue}if(c==='"'||c==="'"){quote=c;continue}if(c==='('||c==='[')depth++;if(c===')'||c===']')depth--;if(c===delimiter&&!depth){result.push(text.slice(start,i));start=i+1}}result.push(text.slice(start));return result}
 function walk(text){let result='',start=0,quote='',depth=0,opening=-1;for(let i=0;i<text.length;i++){const c=text[i];if(quote){if(c===quote&&text[i-1]!=='\\')quote='';continue}if(c==='"'||c==="'"){quote=c;continue}if(c==='{'){if(!depth)opening=i;depth++}else if(c==='}'&&--depth===0){const head=text.slice(start,opening).trim(),body=text.slice(opening+1,i);start=i+1;if(head.startsWith('@')){if(/^@(media|supports|layer|container)\b/.test(head)){const inner=walk(body);if(inner)result+=head+'{'+inner+'}\n'}continue}const selectors=split(head,',').map(x=>x.trim()).filter(x=>x&&!/data-theme\s*=\s*["']?dark/.test(x.replace(/:not\([^)]*\)/g,''))).map(x=>x.startsWith(':root')?x.replace(':root',scope):/^html\b/.test(x)?x.replace(/^html\b/,scope):scope+' '+x);if(!selectors.length)continue;const declarations=split(body,';').filter(d=>/^\s*(?:--[\w-]+|color|background(?:-[\w-]+)?|border(?:-[\w-]+)?|outline(?:-[\w-]+)?|box-shadow|text-shadow|fill|stroke|accent-color|caret-color|text-decoration-color)\s*:/.test(d)).map(d=>[d,recolor(d)]).map(([,b])=>b.trim());if(declarations.length)result+=selectors.join(',')+'{'+declarations.join(';')+'}\n'}}return result}
 return '/* Neutralize legacy UI colors in light mode, including hover/focus states. */\n'+walk(css.replace(/\/\*[\s\S]*?\*\//g,''));
}
