// 🔥 CAMBIO DE PANTALLAS
function openScreen(type){

  const screens = document.querySelectorAll(".screen");

  // Ocultar todas
  screens.forEach(screen=>{
    screen.classList.remove("active");
  });

  // 🌐 URLs internas
  const urls = {
    basicos: "https://josemanueljaimemorales.github.io/BASICOSBKA/"
  };

  const frame = document.getElementById("viewerFrame");
  const viewer = document.getElementById("viewerScreen");

  // 🔥 seguridad
  if(!urls[type]){
    goHome();
    return;
  }

  // Limpiar antes de cargar
  if(frame) frame.src = "";

  // Cargar nueva URL
  if(frame && viewer){
    frame.src = urls[type];
    viewer.classList.add("active");
  }
}

// 🔙 REGRESAR AL HOME
function goHome(){

  const screens = document.querySelectorAll(".screen");

  screens.forEach(screen=>{
    screen.classList.remove("active");
  });

  const home = document.getElementById("home");
  const frame = document.getElementById("viewerFrame");

  if(home) home.classList.add("active");

  // limpiar iframe
  if(frame) frame.src = "";
}

// 🔥 INICIO LIMPIO
window.addEventListener("load", () => {

  const screens = document.querySelectorAll(".screen");
  const home = document.getElementById("home");

  screens.forEach(screen=>{
    screen.classList.remove("active");
  });

  if(home) home.classList.add("active");

});
