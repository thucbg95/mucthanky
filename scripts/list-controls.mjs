// Admin controls deliberately reuse the novel toolbar's visual components.
const searchIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>';
const addClass=(attrs,name)=>/class="/.test(attrs)?attrs.replace('class="','class="'+name+' '):attrs+' class="'+name+'"';
export function adminListControls(html){
 html=html.replace(/<label([^>]*)>([^<]*)(<input\b[^>]*id="admin-[^"]+-search"[^>]*>)<\/label>/g,(_,attrs,label,input)=>'<label'+addClass(attrs,'novel-search')+'><span class="sr-only">'+label+'</span>'+searchIcon+input.replace('<input','<input class="list-control-input"')+'</label>');
 return html.replace(/<label([^>]*)>([^<]*)(<select\b[^>]*id="(admin-[^"]+)"[^>]*>[\s\S]*?<\/select>)<\/label>/g,(whole,attrs,label,select,id)=>id==='admin-user-role'?whole:'<label'+addClass(attrs,'novel-page-size')+'><span>'+label+'</span>'+select.replace('<select','<select class="list-control-select"')+'</label>');
}
