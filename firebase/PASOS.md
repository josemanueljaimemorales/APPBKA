# Activar el acceso con usuario en BKA (se hace una sola vez)

Proyecto de Firebase: **akc-con-reporte** (el mismo que usan AKC y BKA).

## 1. Activar usuario y contraseña
1. Entra a https://console.firebase.google.com y abre **akc-con-reporte**.
2. Menú izquierdo: **Compilación → Authentication** (si pide "Comenzar", tócalo).
3. Pestaña **Sign-in method** → **Correo electrónico/contraseña** → activa el primer interruptor → **Guardar**.
   (No se envían correos: la app usa un correo interno solo para identificar a cada persona.)

## 2. Crear tu usuario de administrador
1. Abre la app → Inicio → **Administración y accesos**.
2. Toca **Configuración inicial (crear administrador)** y crea tu usuario con tu nombre completo y tu contraseña.
   Esto solo se puede hacer una vez; hazlo tú antes que nadie.

## 3. Reglas de seguridad
1. En Firebase: **Firestore Database → Reglas**.
2. Copia lo que hay ahí y mándaselo a Claude antes de cambiar nada: las reglas se comparten con las apps de AKC
   y hay que acomodar las de BKA sin que AKC deje de funcionar.
3. Claude te devuelve el texto completo; lo pegas y tocas **Publicar**.

Las reglas de BKA están en `firebase/reglas_bka.txt`.

## Día a día (desde la app, sin entrar a Firebase)
- **Dar acceso:** Administración y accesos → Dar acceso → nombre completo y permisos → Generar código → Enviar por WhatsApp.
- La persona abre la parte que va a editar → "Es mi primera vez: tengo un código" → pone su nombre completo y crea su contraseña.
- **Quién entró:** pestaña "Quién entró" (nombre, qué abrió, hora de entrada y de salida o última actividad).
- **Bloquear / cambiar permisos:** pestaña Usuarios. Si alguien olvida su contraseña: bloquéalo y dale un código nuevo.
- Contraseñas: mínimo 8 caracteres, con al menos una mayúscula y un número. Cada quien puede cambiar la suya en "Mi cuenta".
- Administrador: solo Manu (el panel no permite dar permiso de administrador).
