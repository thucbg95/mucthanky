(()=>{
 const form=document.getElementById('admin-form'),status=document.getElementById('admin-status'),comments=document.getElementById('admin-comments'),reports=document.getElementById('admin-reports');
 let token='';
 const make=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n};
 async function call(route,body={}){const r=await fetch('/api/admin/'+route,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(d.error||'Không thể truy cập quản trị.');return d}
 async function remove(id){if(!confirm('Xóa bình luận này? Nếu đây là bình luận gốc, các câu trả lời bên dưới cũng sẽ bị xóa.'))return;try{await call('delete',{id});status.textContent='Đã xóa bình luận.';await load()}catch(e){status.textContent=e.message}}
 async function load(){status.textContent='Đang tải…';const c=await call('comments'),r=await call('reports');comments.replaceChildren();reports.replaceChildren();
  for(const item of c.comments){const row=make('article','');row.className='comment';const date=new Date(item.created_at).toLocaleString('vi-VN',{dateStyle:'short',timeStyle:'short'});row.append(make('strong',item.name),make('small',` · ${item.status==='pending'?'Bình luận cũ':'Đã đăng'} · ${item.parent_id?'Trả lời':'Bình luận gốc'} · ${item.page} · ${date}`),make('p',item.body));const del=make('button','Xóa bình luận');del.className='btn';del.addEventListener('click',()=>remove(item.id));row.append(del);comments.append(row)}
  if(!c.comments.length)comments.append(make('p','Chưa có bình luận nào được đăng.'));
  for(const item of r.reports){const row=make('article','');row.className='comment';row.append(make('strong','Báo cáo bình luận: '+item.comment_id),make('p',item.reason));const del=make('button','Xóa bình luận được báo cáo');del.className='btn';del.addEventListener('click',()=>remove(item.comment_id));row.append(del);reports.append(row)}
  if(!r.reports.length)reports.append(make('p','Chưa có báo cáo.'));status.textContent=`${c.comments.length} bình luận đang hiển thị · ${r.reports.length} báo cáo.`
 }
 form.addEventListener('submit',async e=>{e.preventDefault();token=document.getElementById('admin-token').value.trim();document.getElementById('admin-token').value='';try{await load()}catch(e){status.textContent=e.message;token=''}});
 document.getElementById('admin-lock').addEventListener('click',()=>{token='';form.reset();comments.replaceChildren();reports.replaceChildren();status.textContent='Đã khóa phiên quản trị.'});
 window.addEventListener('pagehide',()=>{token=''});
})();
