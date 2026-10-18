const MODULES={
  basicos:'modulos/basicos/index.html',
  sistemas:'modulos/sistemas/index.html',
  fuerza:'modulos/fuerza/index.html',
  rutinas:'modulos/rutinas/index.html',
  cargas:'modulos/cargas/index.html',
  'gav-training':'modulos/gav-training/index.html',
  normativos:'modulos/normativos/index.html',
  'plan-anual':'modulos/plan-anual/index.html',
  femenil:'modulos/femenil/index.html',
  avisos:'modulos/avisos/index.html'
};
const viewer=document.getElementById('viewer');
const frame=document.getElementById('frame');
const backBtn=document.getElementById('back');
// Inicio: GAV, GAF y Avisos. GAV abre la pantalla con los módulos de varonil; GAF y Avisos abren su módulo.
let screen='home';
function showScreen(id){
  screen=id;
  document.getElementById('home').classList.toggle('hidden',id!=='home');
  document.getElementById('gav').classList.toggle('hidden',id!=='gav');
  window.scrollTo(0,0);
}
document.querySelectorAll('[data-screen]').forEach(btn=>btn.addEventListener('click',()=>showScreen(btn.dataset.screen)));
document.querySelectorAll('[data-module]').forEach(btn=>btn.addEventListener('click',()=>{
  const url=MODULES[btn.dataset.module];
  if(!url)return;
  backBtn.textContent=screen==='gav'?'← GAV':'← INICIO';
  frame.src=url;
  viewer.classList.remove('hidden');
}));
backBtn.onclick=()=>{frame.src='';viewer.classList.add('hidden')};


const archivosBtn=document.getElementById('archivos-planificacion');
archivosBtn.addEventListener('click',()=>{
  const url=(window.CLIENTE&&window.CLIENTE.onedrive||'').trim();
  if(!url){
    alert('Configura el enlace de OneDrive en cliente/config.js');
    return;
  }
  window.open(url,'_blank','noopener,noreferrer');
});
