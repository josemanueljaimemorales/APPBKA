# Firebase de BKA (proyecto propio: bkaapp-f61f4)

BKA tiene su propio proyecto de Firebase, separado de AKC (akc-con-reporte).
La configuración web está en cliente/acceso.js, modulos/avisos/app.js, modulos/rutinas/app.js, modulos/rutinas/editor.js
y modulos/femenil/rutinas/editor.js. Pendiente: Fuerza sigue en akc-con-reporte (colección `registros`, revuelta con AKC).

## Una sola vez
1. Firestore: Bases de datos y almacenamiento → Firestore Database → Crear base de datos (modo prueba mientras se copian los datos).
2. Authentication: Seguridad → Authentication → Comenzar → Sign-in method → Correo electrónico/contraseña (solo el primer interruptor) → Guardar.
3. Crear el administrador: app → Inicio → Administración y accesos → "Configuración inicial (crear administrador)". Solo Manu, una vez.
4. Reglas: Firestore Database → Reglas → pegar completo `firebase/reglas_bka.rules` → Publicar.

## Día a día (desde la app)
- **Dar acceso:** Administración y accesos → Dar acceso → nombre completo y permisos → Generar código → Enviar por WhatsApp.
- La persona abre la parte que va a editar → "Es mi primera vez: tengo un código" → pone su nombre completo y crea su contraseña.
- **Quién entró:** pestaña "Quién entró" (nombre, qué abrió, hora de entrada y de salida o última actividad).
- **Bloquear / cambiar permisos:** pestaña Usuarios. Si alguien olvida su contraseña: bloquéalo y dale un código nuevo.
- Contraseñas: mínimo 8 caracteres, con al menos una mayúscula y un número. Cada quien puede cambiar la suya en "Mi cuenta".
- Administrador: solo Manu (el panel no permite dar permiso de administrador).
