# Consola de Soporte

Frontend del área de Soporte Software. Muestra tablero, tickets y técnicos de ServiceDesk Plus consumiendo la API de solo lectura (`dashboard-soporte-blunk/backend`).

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript estricto · Tailwind CSS 4 · shadcn/ui (Base UI) · TanStack Query y Table · Recharts · zod · date-fns · Vitest · pnpm.

## Ejecutar en local
1. Levanta la API (`dotnet run` en `backend/src/SoporteBlunk.Api`, puerto 5138).
2. Copia `.env.example` a `.env.local` y ajusta `API_URL` si la API no está en `http://localhost:5138`.
3. `pnpm install` y `pnpm dev` → http://localhost:3000

## Cómo se conecta a la API
El navegador nunca habla directo con la API: llama a `/api/proxy/v1/...` (route handler de Next, `app/api/proxy/[...path]/route.ts`), que reenvía solo `GET` a `dashboard`, `tickets`, `tecnicos` y `catalogos`. Así la URL interna (`API_URL`) queda en el servidor y no hace falta CORS.
Las respuestas se validan con zod (`lib/api/schemas.ts`); si el contrato cambia, la UI muestra un error claro en vez de datos incorrectos.

## Sesión
El acceso es con correo y contraseña de Prosur (solo usuarios del rol ROL-SISTEMAS).
- `/login` envía las credenciales a `/api/auth/login`, que las pasa a la API de soporte; esta las valida con el servicio de Seguridad.
- El token de sesión queda en la cookie `sb_session` (**HttpOnly**, `SameSite=Lax`, `Secure` en producción). El navegador nunca lo lee; el proxy `/api/proxy` lo convierte en `Authorization: Bearer`.
- `proxy.ts` redirige a `/login` toda página sin sesión vigente (conservando la página pedida) y las llamadas `/api/*` sin sesión responden 401.
- Si la consola se sirve por **HTTP** (sin HTTPS) en producción, define `COOKIE_SECURE=false` o la cookie no se guardará. Con HTTPS déjalo por defecto.

## Estructura
- `app/` rutas (`/dashboard`, `/tickets`, `/tickets/[id]`, `/tecnicos`) y el proxy.
- `modules/` pantallas por dominio (`dashboard`, `tickets`, `tecnicos`).
- `components/` `ui` (shadcn), `shared`, `layout`.
- `lib/` cliente de API, esquemas, hooks de consulta, formato y rangos.

## Scripts
`pnpm dev` · `pnpm build` · `pnpm test` · `pnpm typecheck` · `pnpm lint` · `pnpm format`

## Docker
```bash
API_URL=http://<host-de-la-api>:8080 docker compose up --build
```
`API_URL` debe ser alcanzable desde el contenedor (no uses `localhost`).

## Notas
- Los filtros de `/tickets` viven en la URL, así que cualquier vista se puede compartir.
- La descripción y resolución de cada ticket son HTML de correos: se muestran en un `iframe` con `sandbox` y CSP que bloquea scripts.
- La pestaña "Tiempos" muestra el valor `TIMESPENT` de ServiceDesk tal cual; su unidad no está confirmada.
- Sin autenticación por ahora: publícalo solo en red interna.
