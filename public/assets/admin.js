(()=>{
 const form=document.getElementById('admin-form');
 if(!form)return;
 const status=document.getElementById('admin-status');
 const comments=document.getElementById('admin-comments');
 const reports=document.getElementById('admin-reports');
 const users=document.getElementById('admin-users');
 const controls=document.getElementById('admin-controls');
 const tokenInput=document.getElementById('admin-token');
 let token='';
 const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
 async function call(route,body={}){
  const headers={'Content-Type':'application/json'};
  if(token)headers.Authorization='Bearer '+token;
  const r=await fetch('/api/admin/'+route,{method:'POST',headers,body:JSON.stringify(body)});
  let d;try{d=await r.json()}catch{throw Error('API quản trị chỉ hoạt động trên Cloudflare Pages có bật Functions. Bản xem trước tĩnh không có kết nối D1.')}
  if(!r.ok)throw Error(d.error||'Không thể truy cập quản trị.');
  return d;
 }
 async function remove(id){
  if(!confirm('Xóa bình luận này? Nếu đây là bình luận gốc, các câu trả lời bên dưới cũng sẽ bị xóa.'))return;
  try{await call('delete',{id});status.textContent='Đã xóa bình luận.';await load()}
  catch(e){status.textContent=e.message}
 }
 function renderUsers(items){
  users.replaceChildren();
  if(!items.length){users.append(make('p','Chưa có tài khoản nào đăng nhập.'));return}
  const table=make('div');table.className='admin-user-list';
  for(const item of items){
   const row=make('div');row.className='admin-user-row';
   const info=make('span');info.append(make('strong',item.name),make('small',item.email+' · '+item.comment_count+' bình luận'));
   const role=make('span',item.role==='admin'?'Quản trị viên':'Thành viên');role.className='comment-badge '+(item.role==='admin'?'admin':'member');
   const choose=make('button','Chọn');choose.type='button';choose.className='btn small';choose.addEventListener('click',()=>{document.getElementById('admin-user-email').value=item.email;document.getElementById('admin-user-role').value=item.role||'member';document.getElementById('admin-user-email').focus()});
   row.append(info,role,choose);table.append(row);
  }
  users.append(table);
 }
 async function load(){
  status.textContent='Đang tải công cụ quản trị…';
  const [c,r,u]=await Promise.all([call('comments'),call('reports'),call('users')]);
  comments.replaceChildren();reports.replaceChildren();renderUsers(u.users||[]);
  for(const item of c.comments){
   const row=make('article');row.className='comment';
   const date=new Date(item.created_at).toLocaleString('vi-VN',{dateStyle:'short',timeStyle:'short'});
   row.append(make('strong',item.name),make('small',` · ${item.status==='pending'?'Bình luận cũ':'Đã đăng'} · ${item.parent_id?'Trả lời':'Bình luận gốc'} · ${item.page} · ${date}`),make('p',item.body));
   const del=make('button','Xóa bình luận');del.className='btn';del.addEventListener('click',()=>remove(item.id));row.append(del);comments.append(row);
  }
  if(!c.comments.length)comments.append(make('p','Chưa có bình luận nào được đăng.'));
  for(const item of r.reports){
   const row=make('article');row.className='comment';row.append(make('strong','Báo cáo bình luận: '+item.comment_id),make('p',item.reason));
   const del=make('button','Xóa bình luận được báo cáo');del.className='btn';del.addEventListener('click',()=>remove(item.comment_id));row.append(del);reports.append(row);
  }
  if(!r.reports.length)reports.append(make('p','Chưa có báo cáo.'));
  controls.hidden=false;status.textContent=`${u.users.length} tài khoản · ${c.comments.length} bình luận · ${r.reports.length} báo cáo.`;
 }
 async function trySession(){try{await load()}catch(e){status.textContent=e.message;controls.hidden=true}}
 form.addEventListener('submit',async e=>{
  e.preventDefault();token=tokenInput.value.trim();tokenInput.value='';
  try{await load()}catch(e){status.textContent=e.message;token=''}
 });
 document.getElementById('admin-role-form').addEventListener('submit',async e=>{
  e.preventDefault();const roleForm=e.currentTarget;const email=document.getElementById('admin-user-email').value.trim();const role=document.getElementById('admin-user-role').value;
  try{const result=await call('set-role',{email,role});roleForm.reset();await load();status.textContent=result.role==='admin'?'Đã cấp quyền quản trị. Tài khoản cần đăng xuất rồi đăng nhập lại để thấy huy hiệu mới.':'Đã gỡ quyền quản trị.'}
  catch(error){status.textContent=error.message}
 });
 document.getElementById('admin-lock').addEventListener('click',()=>{token='';form.reset();controls.hidden=true;comments.replaceChildren();reports.replaceChildren();users.replaceChildren();status.textContent='Đã khóa phiên quản trị.'});
 document.getElementById('admin-google-signin').addEventListener('click',async()=>{try{const d=await fetch('/api/auth/google',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({returnTo:'/quan-tri/'})}).then(async r=>{const body=await r.json();if(!r.ok)throw Error(body.error||'Không thể bắt đầu đăng nhập.');return body});location.href=d.url}catch(e){status.textContent=e.message}});
 window.addEventListener('pagehide',()=>{token=''});
 trySession();
})();
