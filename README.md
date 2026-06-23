# TropelCare Control Room

Frontend React + TypeScript para la hackathon **Pizza Protocol**.

## Qué implementa

- Login contra `POST /auth/login`.
- Restauración de sesión con `GET /auth/me`.
- Ruta privada y logout.
- Dashboard con `GET /dashboard/summary`.
- Atlas de Tropeles con paginación real del servidor, filtros combinables, búsqueda, ordenamiento y URL sincronizada.
- Protección contra respuestas antiguas mediante `AbortController` y secuencia de request.
- Feed infinito de Señales con cursor, deduplicación por ID, una sola carga en vuelo, filtros por URL y recuperación de errores sin borrar páginas previas.
- Detalle de Señal con PATCH a `PROCESANDO` o `ATENDIDA`, loading/error y actualización reflejada en el feed al volver.
- Sector Story Engine con etapas por scroll, visual persistente, métricas activas, soporte para View Transition API, CSS Scroll-driven Animations con fallback, reduced motion y navegación por teclado.

No incluye backend, datos hardcodeados ni consumo de APIs de IA.

## Stack

- React 18+
- TypeScript estricto
- Vite
- React Router
- Tailwind CSS
- Fetch API

## Variables requeridas

Crear `.env` a partir de `.env.example`:

```bash
VITE_API_BASE_URL=https://TU-BACKEND/api/v1
```

Las credenciales `TEAM_CODE`, `EMAIL` y `PASSWORD` se ingresan desde la pantalla de login. No se deben subir al repositorio.

## Comandos

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
```

## Deploy

El proyecto incluye:

- `vercel.json` para que cualquier ruta abra `index.html`.
- `public/_redirects` para Netlify.

En Vercel o Netlify configurar la variable `VITE_API_BASE_URL`.

## Decisiones técnicas importantes

- No se usa React Query, SWR, TanStack Query ni librerías de infinite scroll.
- El estado de filtros de Tropeles y Señales vive en la URL para poder recargar o compartir la vista.
- En Tropeles se abortan requests antiguas y también se descartan respuestas por número de secuencia.
- En Señales se guarda un snapshot en memoria/sessionStorage para conservar páginas cargadas y posición al abrir/cerrar detalle.
- El PATCH de estado no es optimista: si falla se conserva el estado anterior.
- El Story Engine no usa video, GIF ni canvas pregrabado; construye el visual con CSS a partir de `assetKey`, `colorToken`, métricas y etapa activa del backend.
