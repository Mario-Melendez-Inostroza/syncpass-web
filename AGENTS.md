# SyncPass · Web — guía para la IA

Página de inicio pública, panel del coordinador y portal del asistente. Habla solo con el backend, nunca con Cognito.

**Stack:** React 19 · TypeScript (modo estricto) · Vite 8 · Tailwind 4 · wouter · Vitest + Testing Library

Antes de tocar nada lee `docs/ia/REGLAS.md` y `docs/ia/CONTEXTO.md`; las decisiones ya tomadas están en `docs/ia/DECISIONES.md` y
el estado del proyecto en `docs/ia/ROADMAP.md`.

## Comandos

```
npm ci
npm run dev        # http://localhost:5173
npm run lint       # oxlint
npm test           # Vitest
npm run build      # tsc estricto + vite build (debe compilar)
```

## Estructura

```
src/
  paginas/     una pantalla por archivo (InicioPagina, EventosPagina, AsistentesPagina, …)
  api/         cliente.ts (fetch, token, renovación en 401), endpoints.ts (una función por endpoint), tipos.ts
  auth/        sesión en sessionStorage, contexto, lectura de roles del token
  csv.ts, formulario.ts, qrTexto.ts, formato.ts   lógica pura, fácil de probar
  test/        pruebas y servidor simulado
```

## Convenciones

- Toda llamada al backend pasa por `api/endpoints.ts` y `api/cliente.ts`; las páginas no usan `fetch` directamente.
- Los tipos de `api/tipos.ts` reflejan los DTO del backend. TypeScript en modo estricto, sin `any`.
- Estilos con clases de Tailwind y los colores de marca definidos en `index.css`; solo modo claro.
- Los formularios validan **antes** de enviar y muestran el mensaje del servidor ante un 400 o 409.
- Rutas con `#` (hosting estático sin reglas de reescritura).

## Antes de dar algo por terminado

1. `npm run lint`, `npm test` y `npm run build` sin errores.
2. Hay pruebas para lo nuevo y fallan si se rompe la regla a propósito.
3. No se versionó ningún secreto, dato personal ni archivo de IDE.
4. El README y `docs/ia/ROADMAP.md` reflejan lo hecho, y lo no comprobado está declarado.
