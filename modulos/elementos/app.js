// Elementos rojos y en proyección o nuevos (traído de la app de AKC; en BKA, dentro de Herramientas del entrenador).
// Por atleta y aparato: hasta 5 elementos rojos y hasta 3 en proyección o nuevos, en elementosBKA/elementos:
//   {atletas: {<nombre normalizado>: {nombre, piso: {rojos: [...], proy: [...]}, arzon: {...}, ...}}}
// Quien edita la App GAV (coach) entra a cualquier atleta, agrega, quita, ordena (arrastrando) e imprime la hoja de todos (3 páginas, carta vertical).
// Atletas y tutores solo ven lo suyo (por el nombre de su cuenta). La lista de atletas sale de trabajo_gav.xlsx y las
// sugerencias al escribir, de Normativos (no se cambia nada allá). El servidor valida quién escribe.
"use strict";
const APS = [
  ["piso", "PISO", "Piso", "#ff7a1a"], ["arzon", "ARZON", "Arzón", "#a855f7"], ["anillos", "ANILLOS", "Anillos", "#2f9bff"],
  ["salto", "SALTO DE CABALLO", "Salto", "#f5b700"], ["paralelas", "BARRAS PARALELAS", "Paralelas", "#14b8a6"], ["fija", "BARRA FIJA", "Fija", "#ec4899"]
];
const MAX = { rojos: 5, proy: 3 };
const TIPOS = { rojos: "Elementos rojos", proy: "En proyección o nuevos" };
const COLOR_GRUPO = { "GAV 3": "#22c55e", "GAV 4": "#06b6d4", "GAV 5": "#3b82f6", "GAV 6": "#8b5cf6", "GAV 9": "#f59e0b", "GAV FIG": "#ef4444", "GAV FIG ELITE": "#eab308" };
// BKA: solo entrenadores (permiso «Herramientas del entrenador») y el administrador; no hay cuentas de atletas.
const YO = {};
const COACH = true;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = s => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

if (!firebase.apps.length) firebase.initializeApp({apiKey:"AIzaSyA3Zni5o3VV_Q3zIdWSnhi9a0uQNNtZa_E",authDomain:"bkaapp-f61f4.firebaseapp.com",projectId:"bkaapp-f61f4",storageBucket:"bkaapp-f61f4.firebasestorage.app",messagingSenderId:"336720035886",appId:"1:336720035886:web:36fc6827c40ee030655fbf"});
const ref = firebase.firestore().collection("elementosBKA").doc("elementos");

let atletas = [], datos = {}, normDb = null, actual = null, pendiente = false, arrastre = null;

async function leerAtletas() {
  const rows = await ESGILA_XLSX.read("../gav-training/trabajo_gav.xlsx");
  const h = (rows[0] || []).map(v => String(v ?? "").trim().toUpperCase());
  const col = {}; h.forEach((x, i) => { if (x) col[x] = i; });
  const cNorm = h.findIndex(x => x.includes("NORMATIVOS"));
  const out = [];
  for (const r of rows.slice(1)) {
    const nombre = String(r[col.NOMBRE] ?? "").trim();
    if (!nombre) continue;
    const completo = String((col["NOMBRE COMPLETO"] != null ? r[col["NOMBRE COMPLETO"]] : "") ?? "").trim() || nombre;
    const normativos = String((cNorm >= 0 ? r[cNorm] : "") ?? "").trim() || nombre;
    out.push({ nombre, completo, normativos, nivel: r[col.NIVEL] ?? "", grupo: String(r[col.GRUPO] ?? "").trim(), clave: norm(normativos) });
  }
  if (!out.length) throw new Error("No se encontraron atletas en trabajo_gav.xlsx.");
  return out;
}

const del = (at, ap, tipo) => ((datos[at.clave] || {})[ap] || {})[tipo] || [];
const total = (at, tipo) => APS.reduce((n, a) => n + del(at, a[0], tipo).length, 0);
const colorGrupo = g => COLOR_GRUPO[String(g).toUpperCase()] || "#64748b";

// ¿Qué atletas son míos? (atleta: su cuenta; tutor: sus atletas). Por nombre, sin acentos: igual, o todas las palabras
// del nombre oficial (al menos dos) dentro del nombre de la cuenta.
function mios() {
  const cuentas = [YO.nombre].concat(YO.atletas || []).map(norm).filter(Boolean);
  return atletas.filter(at => cuentas.some(c => {
    const pal = new Set(c.split(" "));
    return [at.normativos, at.completo].map(norm).some(n => {
      if (n === c) return true;
      const p = n.split(" ");
      return p.length >= 2 && p.every(x => pal.has(x));
    });
  }));
}

function estado(t, cls) { const e = document.getElementById("estado"); e.textContent = t || ""; e.className = "estado " + (cls || ""); }

function pintar() {
  const c = document.getElementById("contenido");
  if (arrastre) { pendiente = true; return; }
  if (document.activeElement && document.activeElement.matches && document.activeElement.matches("input.nuevo") && document.activeElement.value) { pendiente = true; return; }
  pendiente = false;
  const visibles = COACH ? atletas : mios();
  document.getElementById("sub").textContent = COACH
    ? "Hasta 5 elementos rojos y 3 en proyección o nuevos por aparato."
    : "Tus elementos rojos y en proyección o nuevos de cada aparato.";
  if (!visibles.length) {
    c.innerHTML = `<div class="vacio">No encontramos tu nombre en la lista de atletas. Pide a tu entrenador que lo revise.</div>`;
    return;
  }
  if (actual && !visibles.includes(actual)) actual = null;
  if (!actual && visibles.length === 1) actual = visibles[0];
  c.innerHTML = actual ? detalle(actual, visibles.length > 1) : lista(visibles);
}

function lista(visibles) {
  let html = "";
  if (COACH) html += `<div class="barra"><button type="button" class="imprimir" onclick="imprimir()">🖨 Imprimir hoja de todos</button><button type="button" class="imprimir grupo-btn" onclick="imprimirGrupos()">🖨 Imprimir por grupo</button></div>`;
  let grupo = null;
  visibles.forEach((at, i) => {
    if (at.grupo !== grupo) {
      if (grupo !== null) html += `</div>`;
      grupo = at.grupo;
      html += `<h2 class="grupo" style="--g:${colorGrupo(grupo)}">${esc(grupo || "Sin grupo")}</h2><div class="atletas">`;
    }
    const r = total(at, "rojos"), p = total(at, "proy");
    html += `<button type="button" class="atleta" style="--g:${colorGrupo(at.grupo)}" onclick="abrir(${atletas.indexOf(at)})">
      <b>${esc(at.completo)}</b><small>${esc(at.grupo)}${at.nivel !== "" ? " · Nivel " + esc(at.nivel) : ""}</small>
      <span class="cuentas"><span class="c-rojo">🔴 ${r}</span><span class="c-verde">🟢 ${p}</span></span></button>`;
  });
  return html + `</div>`;
}

// Sugerencias al escribir: primero los nombres que ya se usaron en este aparato (con cualquier atleta; los más usados
// arriba), así la app "aprende" los apodos que va poniendo el entrenador; después los de Normativos (lo consolidado al
// final). No se sugiere lo que este atleta ya tiene en ese aparato.
function sugerencias(at, ap) {
  const ya = new Set(["rojos", "proy"].flatMap(t => del(at, ap, t)).map(norm));
  const usos = new Map();
  Object.values(datos).forEach(a => ["rojos", "proy"].forEach(t => ((a && a[ap] && a[ap][t]) || []).forEach(x => {
    const k = norm(x); if (!k || ya.has(k)) return;
    const u = usos.get(k) || { texto: x, n: 0 }; u.n++; usos.set(k, u);
  })));
  const vistos = new Set(ya), lista = [];
  [...usos.values()].sort((a, b) => b.n - a.n || a.texto.localeCompare(b.texto, "es")).forEach(u => { vistos.add(norm(u.texto)); lista.push(u.texto); });
  if (!normDb) return lista;
  const app = APS.find(a => a[0] === ap)[1];
  const nombreNorm = (normDb.athletes.find(a => norm(a.name) === at.clave) || {}).name;
  const primero = [], despues = [];
  normDb.items.filter(it => it.apparatus === app).forEach(it => {
    const k = norm(it.element); if (vistos.has(k)) return; vistos.add(k);
    ((nombreNorm && it.status?.[nombreNorm] === "C") ? despues : primero).push(it.element);
  });
  return lista.concat(primero, despues);
}

function detalle(at, volver) {
  let html = `<div class="cab-atleta" style="--g:${colorGrupo(at.grupo)}">
    ${volver ? `<button type="button" class="atras" onclick="abrir(-1)">← ${COACH ? "Atletas" : "Mis atletas"}</button>` : ""}
    <div><h2>${esc(at.completo)}</h2><small>${esc(at.grupo)}${at.nivel !== "" ? " · Nivel " + esc(at.nivel) : ""}</small></div></div>`;
  if (COACH) {
    const otros = atletas.filter(o => o !== at && APS.some(([ap]) => del(o, ap, "rojos").length || del(o, ap, "proy").length));
    html += `<form class="copiar" onsubmit="copiarElementos(event)"><label for="copiarDe">📋 Copiar de otro atleta</label>
      <div><select id="copiarDe"><option value="">Elige al atleta…</option>${otros.map(o => `<option value="${atletas.indexOf(o)}">${esc(o.completo)} · 🔴 ${total(o, "rojos")} 🟢 ${total(o, "proy")}</option>`).join("")}</select>
      <button type="submit">Copiar</button></div></form>`;
  }
  html += `<div class="aparatos">`;
  APS.forEach(([ap, , nombre, color]) => {
    html += `<section class="aparato" style="--a:${color}"><h3>${esc(nombre)}</h3>`;
    ["rojos", "proy"].forEach(tipo => {
      const l = del(at, ap, tipo);
      html += `<div class="bloque ${tipo}"><h4>${tipo === "rojos" ? "🔴" : "🟢"} ${TIPOS[tipo]} <span>${l.length}/${MAX[tipo]}</span></h4><ul>`;
      if (!l.length) html += `<li class="nada">${COACH ? "Sin elementos" : "—"}</li>`;
      l.forEach((el, i) => {
        html += COACH
          ? `<li data-ap="${ap}" data-tipo="${tipo}" data-i="${i}"><span class="mover" title="Arrastra para cambiar el orden" aria-hidden="true">⠿</span><span class="txt">${esc(el)}</span><button type="button" class="quitar" title="Quitar" aria-label="Quitar ${esc(el)}" onclick="quitar('${ap}','${tipo}',${i})">✕</button></li>`
          : `<li><span class="txt">${esc(el)}</span></li>`;
      });
      html += `</ul>`;
      if (COACH && l.length < MAX[tipo]) {
        const id = `s-${ap}`;
        html += `<form class="agregar" onsubmit="agregar(event,'${ap}','${tipo}')">
          <input class="nuevo" list="${id}" placeholder="Agregar elemento…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other">
          <button type="submit">＋</button></form>`;
      }
      html += `</div>`;
    });
    if (COACH) html += `<datalist id="s-${ap}">${sugerencias(at, ap).map(s => `<option value="${esc(s)}">`).join("")}</datalist>`;
    html += `</section>`;
  });
  return html + `</div>`;
}

function abrir(i) { actual = i >= 0 ? atletas[i] : null; pintar(); window.scrollTo(0, 0); }

async function guardar(at, ap) {
  const cambio = { atletas: { [at.clave]: { nombre: at.normativos, [ap]: { rojos: del(at, ap, "rojos"), proy: del(at, ap, "proy") } } } };
  estado("Guardando…");
  try { await ref.set(cambio, { merge: true }); estado("Guardado ✓", "ok"); }
  catch (e) { console.error(e); estado(e.code === "permission-denied" ? "No tienes permiso para cambiar esto." : "No se pudo guardar. Revisa tu conexión.", "err"); }
}

// Copia a este atleta los elementos rojos y en proyección de otro, en los 6 aparatos (reemplaza lo que tenía).
async function copiarElementos(ev) {
  ev.preventDefault();
  if (!COACH || !actual) return;
  const de = atletas[+ev.target.querySelector("select").value];
  if (!de) { alert("Elige de qué atleta copiar."); return; }
  const at = actual, tenia = total(at, "rojos") + total(at, "proy");
  if (!confirm(`¿Copiar a ${at.completo} los elementos de ${de.completo}?` + (tenia ? `\n\nSe reemplaza${tenia === 1 ? " el elemento" : `n los ${tenia} elementos`} que ya tiene.` : ""))) return;
  const nuevo = { nombre: at.normativos };
  APS.forEach(([ap]) => { nuevo[ap] = { rojos: del(de, ap, "rojos").slice(), proy: del(de, ap, "proy").slice() }; });
  datos[at.clave] = nuevo;
  pintar();
  estado("Guardando…");
  try { await ref.set({ atletas: { [at.clave]: nuevo } }, { merge: true }); estado(`Copiado de ${de.completo} ✓`, "ok"); }
  catch (e) { console.error(e); estado(e.code === "permission-denied" ? "No tienes permiso para cambiar esto." : "No se pudo guardar. Revisa tu conexión.", "err"); }
}

function poner(at, ap, tipo, lista) {
  const a = datos[at.clave] = datos[at.clave] || {};
  const b = a[ap] = a[ap] || { rojos: [], proy: [] };
  b.rojos = b.rojos || []; b.proy = b.proy || [];
  b[tipo] = lista;
}

function agregar(ev, ap, tipo) {
  ev.preventDefault();
  if (!COACH || !actual) return;
  const input = ev.target.querySelector("input"), texto = input.value.replace(/\s+/g, " ").trim();
  if (!texto) return;
  const at = actual, l = del(at, ap, tipo);
  if (l.length >= MAX[tipo]) { alert(`Ya tiene ${MAX[tipo]} en ${TIPOS[tipo].toLowerCase()} de este aparato.`); return; }
  const otro = tipo === "rojos" ? "proy" : "rojos";
  if (l.some(x => norm(x) === norm(texto))) { alert("Ese elemento ya está en la lista."); return; }
  if (del(at, ap, otro).some(x => norm(x) === norm(texto))) { alert(`Ese elemento ya está en ${TIPOS[otro].toLowerCase()}.`); return; }
  poner(at, ap, tipo, l.concat([texto]));
  input.value = ""; input.blur();
  pintar(); guardar(at, ap);
}

function quitar(ap, tipo, i) {
  if (!COACH || !actual) return;
  const at = actual, l = del(at, ap, tipo).slice();
  if (!confirm(`¿Quitar «${l[i]}»?`)) return;
  l.splice(i, 1);
  poner(at, ap, tipo, l);
  pintar(); guardar(at, ap);
}

// ---- Hoja para imprimir: todos los atletas, carta vertical, en 3 páginas (4 si la impresora lo necesita) ----
// Una sola tabla que corre de página en página: el encabezado y los aparatos se repiten arriba de cada hoja y ningún atleta
// se parte entre dos. El tamaño es el más grande con el que todo cabe en 3 páginas con margen de sobra; si al imprimir
// las letras salen más grandes que en pantalla, lo que no cabe pasa a la siguiente hoja, nunca se recorta (José Manuel,
// 26-oct-2026: antes cada hoja tenía alto fijo y se perdían los últimos atletas de cada una).
const HOJA_W = 754, HOJA_H = 992, HOJA_PAGINAS = 3, HOJA_HOLGURA = 0.9;
function filaHoja(at) {
  let html = `<tr><td class="h-at" style="--g:${colorGrupo(at.grupo)}"><b>${esc(at.completo)}</b><small>${esc(at.grupo)}</small></td>`;
  APS.forEach(([ap, , , color]) => {
    const r = del(at, ap, "rojos"), v = del(at, ap, "proy");
    html += `<td class="cel" style="--a:${color}">${r.map(x => `<span class="ch r">${esc(x)}</span>`).join("")}${v.map(x => `<span class="ch v">${esc(x)}</span>`).join("")}${!r.length && !v.length ? `<span class="nada">—</span>` : ""}</td>`;
  });
  return html + `</tr>`;
}
function tablaHoja(fecha, filas, primera, subtitulo) {
  return `<div class="contenido"><table><thead>
    <tr class="cab"><td colspan="${APS.length + 1}"><div class="h-cab"><div class="h-izq"><b>BKA</b><br>Gimnasia artística varonil</div>
      <h1><span class="rojo">Elementos rojos</span><br>y <span class="verde">en proyección o nuevos</span>${subtitulo ? `<small>${esc(subtitulo)}</small>` : ""}</h1>
      <div class="h-der">${esc(fecha)}<div class="ley"><i class="r"></i>Rojo <i class="v"></i>Proyección / nuevo</div></div></div></td></tr>
    <tr><th class="h-at">${primera || "Atleta"}</th>${APS.map(a => `<th style="--a:${a[3]}">${esc(a[2])}</th>`).join("")}</tr>
    </thead><tbody>${filas || atletas.map(filaHoja).join("")}</tbody></table></div>`;
}
// ¿Con este tamaño caben todos en las páginas? Se acomodan los atletas uno tras otro como lo haría la impresora.
function paginasCon(c, z) {
  c.style.width = (HOJA_W / z) + "px";
  const cab = c.querySelector("thead").getBoundingClientRect().height * z;
  const cabe = HOJA_H * HOJA_HOLGURA - cab;
  let paginas = 1, usado = 0;
  for (const tr of c.querySelectorAll("tbody tr")) {
    const h = tr.getBoundingClientRect().height * z;
    if (usado + h > cabe && usado > 0) { paginas++; usado = 0; }
    usado += h;
  }
  return paginas;
}
// Hoja por grupo (José Manuel, 26-oct-2026): una fila por grupo con todo lo que trabajan sus atletas en cada aparato, sin
// nombres de atletas. Cada elemento sale una vez (los más repetidos primero); si es rojo para uno y nuevo para otro, sale
// como rojo.
function filasGrupos() {
  const grupos = [];
  atletas.forEach(at => { let g = grupos.find(x => x.nombre === at.grupo); if (!g) grupos.push(g = { nombre: at.grupo, atletas: [] }); g.atletas.push(at); });
  return grupos.map(g => {
    let html = `<tr><td class="h-at h-grupo" style="--g:${colorGrupo(g.nombre)}"><b>${esc(g.nombre || "Sin grupo")}</b><small>${g.atletas.length} atleta${g.atletas.length === 1 ? "" : "s"}</small></td>`;
    APS.forEach(([ap, , , color]) => {
      const cuenta = tipo => { const m = new Map(); g.atletas.forEach(at => del(at, ap, tipo).forEach((x, i) => { const k = norm(x); const e = m.get(k) || { texto: x, n: 0, orden: m.size }; e.n++; m.set(k, e); })); return m; };
      const rojos = cuenta("rojos"), proy = cuenta("proy");
      rojos.forEach((v, k) => proy.delete(k));
      const lista = m => [...m.values()].sort((a, b) => b.n - a.n || a.orden - b.orden);
      const r = lista(rojos), v = lista(proy);
      html += `<td class="cel" style="--a:${color}">${r.map(x => `<span class="ch r">${esc(x.texto)}</span>`).join("")}${v.map(x => `<span class="ch v">${esc(x.texto)}</span>`).join("")}${!r.length && !v.length ? `<span class="nada">—</span>` : ""}</td>`;
    });
    return html + `</tr>`;
  }).join("");
}
function imprimirGrupos() { imprimir("grupos"); }

function imprimir(modo) {
  const hoja = document.getElementById("hoja");
  const fecha = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  const porGrupo = modo === "grupos";
  // Por grupo cabe en una página casi siempre: puede crecer más (hasta 160 %).
  const paginas = porGrupo ? 1 : HOJA_PAGINAS, maximo = porGrupo ? 1.6 : 1.25;
  hoja.classList.add("midiendo");
  hoja.innerHTML = porGrupo ? tablaHoja(fecha, filasGrupos(), "Grupo", "Por grupo") : tablaHoja(fecha);
  const c = hoja.querySelector(".contenido");
  let lo = 0.2, hi = maximo;
  if (paginasCon(c, hi) <= paginas) lo = hi;
  else for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (paginasCon(c, m) <= paginas) lo = m; else hi = m; }
  if (porGrupo && lo < 0.55) lo = 0.55;  // muchos elementos: mejor más de una página que letra diminuta
  c.style.width = (HOJA_W / lo) + "px";
  c.style.zoom = lo;
  hoja.classList.remove("midiendo");
  setTimeout(() => window.print(), 50);
}

async function iniciar() {
  try {
    atletas = await leerAtletas();
  } catch (e) {
    console.error(e); estado("No se pudo leer la lista de atletas (trabajo_gav.xlsx).", "err"); return;
  }
  estado("");
  pintar();
  ref.onSnapshot(snap => {
    datos = (snap.exists && snap.data().atletas) || {};
    pintar();
  }, e => { console.error(e); estado("Sin conexión con el servidor.", "err"); });
  if (COACH) {
    try { normDb = await AKC_NORMATIVOS.cargar(); if (actual) pintar(); } catch (e) { console.warn("Sin sugerencias de Normativos:", e); }
  }
}
// Cambiar el orden: se arrastra un elemento por su agarrador (⠿) dentro de su lista (dedo o mouse) y el orden se guarda al soltar.
document.addEventListener("pointerdown", ev => {
  const h = ev.target.closest(".mover"); if (!h || !COACH || !actual) return;
  const li = h.closest("li"); ev.preventDefault();
  arrastre = { li, ul: li.parentElement, id: ev.pointerId };
  li.classList.add("arrastrando");
  try { h.setPointerCapture(ev.pointerId); } catch (e) { /* sin captura también funciona */ }
});
document.addEventListener("pointermove", ev => {
  if (!arrastre || ev.pointerId !== arrastre.id) return;
  ev.preventDefault();
  const { li, ul } = arrastre;
  const otros = [...ul.querySelectorAll("li[data-i]")].filter(x => x !== li);
  const antes = otros.find(x => { const r = x.getBoundingClientRect(); return ev.clientY < r.top + r.height / 2; });
  if (antes) { if (li.nextElementSibling !== antes) ul.insertBefore(li, antes); }
  else if (ul.lastElementChild !== li) ul.appendChild(li);
});
function soltar(ev) {
  if (!arrastre || ev.pointerId !== arrastre.id) return;
  const { li, ul } = arrastre; arrastre = null;
  li.classList.remove("arrastrando");
  const orden = [...ul.querySelectorAll("li[data-i]")].map(x => +x.dataset.i);
  const ap = li.dataset.ap, tipo = li.dataset.tipo, at = actual, l = del(at, ap, tipo);
  if (orden.some((v, i) => v !== i) && orden.length === l.length) { poner(at, ap, tipo, orden.map(i => l[i])); pintar(); guardar(at, ap); }
  else pintar();
}
document.addEventListener("pointerup", soltar);
document.addEventListener("pointercancel", soltar);

document.addEventListener("focusout", () => setTimeout(() => { if (pendiente) pintar(); }, 0));
BKAAcceso.requiere("entrenador", { modulo: "Elementos rojos" }).then(iniciar)
  .catch(() => estado("Necesitas tu usuario con el permiso «Herramientas del entrenador». Pídelo al administrador.", "err"));
