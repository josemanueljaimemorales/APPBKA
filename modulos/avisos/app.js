/* BKA · Avisos generales. Cualquiera ve los avisos; agregar, editar o borrar pide usuario con permiso de avisos
   (control de acceso en cliente/acceso.js). */
const FB_CONFIG={apiKey:"AIzaSyBNRAkDXLlw5fyiT01-ZfUyB0A7ShsAxyg",authDomain:"akc-con-reporte.firebaseapp.com",projectId:"akc-con-reporte"};
const COLLECTION='avisosBKA', DOC='estado', LOCAL='avisosBKA_estado';
const root=document.getElementById('root');
let avisos=[], cloud=null, modo='ver', editId=null, borrar=null, verAnteriores=false, error='';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hoy=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);};
const fmt=d=>{try{return new Date(d+'T12:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});}catch(e){return d;}};
let editor=null; // usuario con permiso de avisos
const coord=()=>!!editor;
async function guardar(){try{localStorage.setItem(LOCAL,JSON.stringify({avisos}));}catch(e){}
  if(cloud){try{await cloud.set({avisos});}catch(e){console.error(e);alert('No se pudo guardar en la nube. Revisa la conexión.');}}}
const vigentes=()=>avisos.filter(a=>!a.hasta||a.hasta>=hoy());
const anteriores=()=>avisos.filter(a=>a.hasta&&a.hasta<hoy());
function tarjeta(a){
  return`<article class="aviso ${a.importante?'imp':''}"><h2>${a.importante?'<span class="tag">IMPORTANTE</span>':''}${esc(a.titulo)}</h2><div class="tx">${esc(a.texto)}</div>
  <div class="meta">${fmt(a.fecha)}${a.autor?' · '+esc(a.autor):''}${a.hasta?' · vigente hasta el '+fmt(a.hasta):''}</div>
  ${coord()&&modo==='ver'?`<div class="acc"><button class="btn ghost" data-act="editar" data-id="${a.id}">Editar</button><button class="btn rojo" data-act="borrar" data-id="${a.id}">${borrar===a.id?'Toca otra vez para borrar':'Borrar'}</button></div>`:''}</article>`;
}
function render(){
  if(modo==='form'){const a=avisos.find(x=>x.id===editId)||{};
    root.innerHTML=`<form class="caja" id="faviso"><label>Título<input type="text" id="ti" required value="${esc(a.titulo)}"></label>
      <label>Aviso<textarea id="tx" required>${esc(a.texto)}</textarea></label>
      <label>Quién lo publica<input type="text" id="au" value="${esc(a.autor||editor.nombre)}"></label>
      <label>Vigente hasta (opcional; después pasa a "avisos anteriores")<input type="date" id="ha" value="${esc(a.hasta||'')}"></label>
      <label class="ck"><input type="checkbox" id="im" ${a.importante?'checked':''}> Marcar como importante</label>
      <div class="barra"><button class="btn ghost" type="button" data-act="cancelar">Cancelar</button><button class="btn" type="submit">${editId?'Guardar cambios':'Publicar aviso'}</button></div></form>`;
    document.getElementById('ti').focus();return;}
  const v=vigentes(),ant=anteriores();
  let h=`<div class="barra"><span>${coord()?`<span class="ok">Editando: ${esc(editor.nombre)}</span> <button class="btn ghost" data-act="cuenta">Mi cuenta</button>`:''}</span><button class="btn" data-act="agregar">+ Agregar aviso</button></div>`;
  h+=v.length?v.map(tarjeta).join(''):`<div class="vacio">No hay avisos por ahora.</div>`;
  if(ant.length){h+=`<div class="barra" style="margin-top:14px"><button class="btn ghost" data-act="anteriores">${verAnteriores?'Ocultar':'Ver'} avisos anteriores (${ant.length})</button></div>`;
    if(verAnteriores)h+=ant.map(tarjeta).join('');}
  root.innerHTML=h;
}
root.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const act=b.dataset.act,id=b.dataset.id;
  if(act==='agregar'){editId=null;borrar=null;error='';
    if(coord()){modo='form';return render();}
    BKAAcceso.requiere('avisos',{modulo:'Avisos generales'}).then(p=>{editor=p;modo='form';render();}).catch(()=>{});return;}
  if(act==='cuenta')return BKAAcceso.cuenta();
  if(act==='cancelar'){modo='ver';error='';return render();}
  if(act==='anteriores'){verAnteriores=!verAnteriores;return render();}
  if(!coord())return;
  if(act==='editar'){editId=id;modo='form';return render();}
  if(act==='borrar'){if(borrar!==id){borrar=id;return render();}avisos=avisos.filter(a=>a.id!==id);borrar=null;guardar();return render();}
});
root.addEventListener('submit',async e=>{e.preventDefault();
  if(e.target.id==='faviso'&&coord()){const g=id=>document.getElementById(id);
    const datos={titulo:g('ti').value.trim(),texto:g('tx').value.trim(),autor:g('au').value.trim(),hasta:g('ha').value||'',importante:g('im').checked};
    if(!datos.titulo||!datos.texto)return;
    if(editId)Object.assign(avisos.find(x=>x.id===editId),datos);
    else avisos.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),fecha:hoy(),...datos,autorUid:editor.uid});
    avisos.sort((x,y)=>(y.importante-x.importante)||String(y.fecha).localeCompare(String(x.fecha)));
    modo='ver';editId=null;await guardar();render();}
});
(async function init(){
  try{if(window.firebase){if(!firebase.apps.length)firebase.initializeApp(FB_CONFIG);cloud=firebase.firestore().collection(COLLECTION).doc(DOC);
      const s=await cloud.get();if(s.exists)avisos=s.data().avisos||[];
      cloud.onSnapshot(s=>{if(!s.exists||s.metadata.hasPendingWrites||modo!=='ver')return;avisos=s.data().avisos||[];render();});}}
  catch(e){console.error(e);cloud=null;try{avisos=JSON.parse(localStorage.getItem(LOCAL)||'{}').avisos||[];}catch(_){}}
  render();
})();
