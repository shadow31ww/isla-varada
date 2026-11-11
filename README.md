# Isla Varada – multijugador

## Estructura
```
isla-varada/
├─ server.js
├─ package.json
├─ render.yaml
├─ .gitignore
└─ public/
   └─ index.html   ← el juego
```

## Subirlo a Render
1. Crea un repositorio en GitHub y sube estos archivos (respetando la carpeta `public`).
2. En https://render.com → **New +** → **Web Service** → conecta tu repositorio.
3. Configura:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
   (Si usas el archivo `render.yaml`, también puedes hacerlo con **New + → Blueprint**.)
4. Pulsa **Create Web Service**. Cuando termine, abre la URL `https://TU-APP.onrender.com` y comparte ese enlace con tus amigos.

## Qué se comparte
- Jugadores (posición, giro, nombre) y chat (tecla **Enter**).
- Día/noche y clima iguales para todos.
- Construcciones: fundaciones, paredes, ventanas, puertas, techos, camas, mesa, horno, laboratorio y cofres (colocar y desmontar).

## Qué NO se comparte todavía
- Árboles talados, recursos recogidos, objetos soltados, fogatas, refugios y balsas (cada jugador ve los suyos).
- El contenido de los cofres.
- Las construcciones viven en la memoria del servidor: se borran si Render reinicia o duerme el servicio.

## Notas
- En el plan gratis, Render duerme el servicio tras ~15 min sin visitas; la primera carga puede tardar ~50 s.
- La partida guardada local se desactiva en modo multijugador.
- Hasta 12 jugadores a la vez.
