/* BKA · Panel del administrador: códigos de acceso, usuarios y bitácora de quién entró a editar. */
const root=document.getElementById('root');
const {ROLES}=BKAAcceso;
let yo=null, db=null, tab='nuevo', nuevo=null, usuarios=[], invit=[], bit=[], msg='';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fecha=t=>{const d=t&&t.toDate?t.toDate():null;return d?d.toLocaleString('es-MX',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—';};
const dur=(a,b)=>{const x=a&&a.toDate?a.toDate():null,y=b&&b.toDate?b.toDate():null;if(!x||!y)return'';const m=Math.max(0,Math.round((y-x)/60000));return m<60?m+' min':Math.floor(m/60)+' h '+(m%60)+' min';};
const rolesTxt=r=>Object.keys(ROLES).filter(k=>r&&r[k]).map(k=>ROLES[k]).join(', ')||'sin permisos';
function genCodigo(){const A='ABCDEFGHJKMNPQRSTUVWXYZ23456789',v=crypto.getRandomValues(new Uint32Array(8));let s='';for(let i=0;i<8;i++)s+=A[v[i]%A.length];return'BKA-'+s.slice(0,4)+'-'+s.slice(4);}

async function cargar(){
  const [u,i,b]=await Promise.all([db.collection('bkaUsuarios').get(),db.collection('bkaInvitaciones').where('usada','==',false).get(),
    db.collection('bkaAccesos').orderBy('entrada','desc').limit(150).get()]);
  usuarios=u.docs.map(d=>({uid:d.id,...d.data()})).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  invit=i.docs.map(d=>({id:d.id,...d.data()}));bit=b.docs.map(d=>({id:d.id,...d.data()}));
}
function render(){
  let h=`<div class="barra"><span class="ok">Administrador: ${esc(yo.nombre)}</span><button class="btn ghost" data-act="cuenta">Mi cuenta</button></div>`;
  h+=`<div class="tabs">${[['nuevo','Dar acceso'],['pend','Códigos pendientes ('+invit.length+')'],['usuarios','Usuarios ('+usuarios.length+')'],['bit','Quién entró']].map(([k,l])=>`<button class="${tab===k?'on':''}" data-act="tab" data-v="${k}">${l}</button>`).join('')}</div>`;
  if(msg)h+=`<div class="msg">${esc(msg)}</div>`;
  if(tab==='nuevo'){
    if(nuevo){const url=location.href.replace(/modulos\/admin\/.*$/,'');
      const txt=`Hola ${nuevo.nombre}, tu código de acceso para editar en la app de BKA es: ${nuevo.codigo}\nEntra a ${url} , abre la parte que vas a editar y toca "Es mi primera vez: tengo un código". Ahí creas tu contraseña. El código sirve una sola vez.`;
      h+=`<div class="item"><b>Código para ${esc(nuevo.nombre)}</b><small>${esc(rolesTxt(nuevo.roles))} · sirve una sola vez. Cópialo ahora: por seguridad no se vuelve a mostrar.</small>
        <div class="codigo">${esc(nuevo.codigo)}</div>
        <div class="acc"><a class="btn" href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">Enviar por WhatsApp</a><button class="btn ghost" data-act="copiar">Copiar mensaje</button><button class="btn ghost" data-act="otro">Dar otro acceso</button></div></div>`;
      root.innerHTML=h;root.dataset.txt=txt;return;}
    h+=`<form class="caja" id="fnuevo"><label>Nombre completo de la persona<input type="text" id="nn" required placeholder="Ej. Laura Gómez Pérez"></label>
      <div class="roles">${Object.entries(ROLES).map(([k,l])=>`<label class="ck"><input type="checkbox" name="rol" value="${k}" ${k==='rutinas'?'checked':''}> ${l}</label>`).join('')}</div>
      <div class="barra"><span></span><button class="btn" type="submit">Generar código</button></div></form>`;
  }
  if(tab==='pend'){
    h+=invit.length?invit.map(v=>`<div class="item"><b>${esc(v.nombre)}</b><small>${esc(rolesTxt(v.roles))} · creado ${fecha(v.creada)}</small>
      <div class="acc"><button class="btn rojo" data-act="cancelinv" data-id="${v.id}">Cancelar código</button></div></div>`).join(''):`<div class="vacio">No hay códigos sin usar.</div>`;
  }
  if(tab==='usuarios'){
    h+=usuarios.length?usuarios.map(u=>`<div class="item ${u.activo?'':'bloq'}"><b>${esc(u.nombre)}</b><small>${u.activo?'Activo':'Bloqueado'} · alta ${fecha(u.creado)}</small>
      <div class="roles">${Object.entries(ROLES).map(([k,l])=>`<label><input type="checkbox" data-act="rol" data-uid="${u.uid}" data-rol="${k}" ${u.roles&&u.roles[k]?'checked':''} ${u.uid===yo.uid&&k==='admin'?'disabled':''}> ${l}</label>`).join('')}</div>
      ${u.uid===yo.uid?'':`<div class="acc"><button class="btn ${u.activo?'rojo':''}" data-act="activo" data-uid="${u.uid}">${u.activo?'Bloquear':'Activar'}</button></div>`}</div>`).join(''):`<div class="vacio">Sin usuarios.</div>`;
    h+=`<small style="color:rgba(235,241,250,.6)">Si alguien olvida su contraseña: bloquea su usuario y dale un código nuevo.</small>`;
  }
  if(tab==='bit'){
    h+=bit.length?`<table class="bit"><tr><th>Quién</th><th>Qué abrió</th><th>Entró</th><th>Salió / última actividad</th><th class="disp">Tiempo</th></tr>${bit.map(b=>`<tr><td>${esc(b.nombre)}</td><td>${esc(b.modulo)}</td><td>${fecha(b.entrada)}</td><td>${fecha(b.salida||b.ultima)}${b.salida?'':' (activo o sin cerrar)'}</td><td class="disp">${dur(b.entrada,b.salida||b.ultima)}</td></tr>`).join('')}</table>`:`<div class="vacio">Todavía no hay registros.</div>`;
  }
  root.innerHTML=h;
}
root.addEventListener('click',async e=>{const b=e.target.closest('[data-act]');if(!b)return;const act=b.dataset.act;msg='';
  if(act==='tab'){tab=b.dataset.v;nuevo=null;return render();}
  if(act==='cuenta')return BKAAcceso.cuenta();
  if(act==='otro'){nuevo=null;return render();}
  if(act==='copiar'){try{await navigator.clipboard.writeText(root.dataset.txt);b.textContent='Copiado';}catch(_){b.textContent='No se pudo copiar';}return;}
  try{
    if(act==='cancelinv'){await db.collection('bkaInvitaciones').doc(b.dataset.id).delete();invit=invit.filter(x=>x.id!==b.dataset.id);}
    if(act==='activo'){const u=usuarios.find(x=>x.uid===b.dataset.uid);await db.collection('bkaUsuarios').doc(u.uid).update({activo:!u.activo});u.activo=!u.activo;}
  }catch(err){msg='No se pudo guardar: '+(err.message||err);}
  render();
});
root.addEventListener('change',async e=>{const b=e.target;if(b.dataset.act!=='rol')return;const u=usuarios.find(x=>x.uid===b.dataset.uid);
  const roles={...(u.roles||{}),[b.dataset.rol]:b.checked};
  try{await db.collection('bkaUsuarios').doc(u.uid).update({roles});u.roles=roles;msg='';}catch(err){msg='No se pudo guardar: '+(err.message||err);}render();});
root.addEventListener('submit',async e=>{e.preventDefault();if(e.target.id!=='fnuevo')return;
  const nombre=document.getElementById('nn').value.trim().replace(/\s+/g,' ');if(!nombre)return;
  const roles={};document.querySelectorAll('input[name=rol]').forEach(x=>{if(x.checked)roles[x.value]=true;});
  if(!Object.keys(roles).length){msg='Elige al menos un permiso.';return render();}
  const codigo=genCodigo(),id=await BKAAcceso.sha256(BKAAcceso.limpiaCodigo(codigo));
  try{await db.collection('bkaInvitaciones').doc(id).set({nombre,roles,usada:false,creada:firebase.firestore.FieldValue.serverTimestamp(),creadaPor:yo.uid});
    nuevo={nombre,roles,codigo};invit.unshift({id,nombre,roles,creada:null});}
  catch(err){msg='No se pudo crear el código: '+(err.message||err);}
  render();});

BKAAcceso.requiere('admin',{modulo:'Panel de administración'}).then(async p=>{yo=p;db=BKAAcceso._fb().db;
  try{await cargar();}catch(err){msg='No se pudieron leer los datos: '+(err.message||err);}render();})
  .catch(()=>{root.innerHTML='<div class="vacio">Este panel es solo para el administrador.</div>';});
