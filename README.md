# Forja de Constelaciones — Frontend

SPA en React para el backend de [habit-constellations-backend](https://github.com/BecerraHector/habit-constellations-backend):
un registro de hábitos donde cada racha enciende estrellas y cada 30 días completa una constelación.

## Stack

- **React 19 + TypeScript + Vite**
- **Tailwind CSS 4** con tokens propios (tema cósmico oscuro)
- **TanStack Query** para el estado de servidor; sesión en Context
- **react-router-dom** con guard de rutas privadas

## Desarrollo

Requiere el backend corriendo en `localhost:8080` (Vite hace proxy de `/api`, sin CORS en desarrollo):

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # tsc + vite build
npm run lint       # oxlint
```

En producción, `VITE_API_URL` apunta al backend real (ver `.env.example`).

## Autenticación

El access token (JWT, 30 min) vive solo en memoria; el refresh token (opaco, rotatorio)
en `localStorage`. Ante un 401 el cliente refresca una única vez —con una sola promesa
compartida aunque haya peticiones concurrentes— y reintenta; si el refresco falla, la
sesión se cierra. Los endpoints públicos de auth no pasan por ese reintento.
