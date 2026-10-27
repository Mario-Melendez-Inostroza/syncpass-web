# SyncPass · Web

Aplicación web de **SyncPass** (caso **DSY1105**, Duoc UC): una **página de inicio pública** y el **panel del
Docente / Coordinador(a) de Proyecto**, que gestiona proyectos y eventos, supervisa el quórum en vivo y descarga el
reporte de asistencia.

La asistencia se registra desde la app Android (`syncpass-mobile`). Esta web habla con el backend (`syncpass-api`),
**nunca directamente con Cognito**.

React 19 · TypeScript (modo estricto) · Vite 8 · Tailwind 4 · wouter · Vitest.

> Parte de una base del profesor (`docentedev/fs2-web`). Esa base solo tenía un login que no podía funcionar; todo lo
> demás es desarrollo propio.

## El sistema completo

```
Usuario ─► Panel web (esta) ──┐
                               ├─► API Gateway ─► API Spring Boot (EC2) ─┬─► Amazon Cognito
Usuario ─► App Android ───────┘                                          └─► Supabase PostgreSQL
```

| Repositorio | Qué es |
|---|---|
| **syncpass-web** (este) | Página de inicio pública y panel del coordinador |
| **syncpass-api** | Backend: autenticación, catálogo, sincronización, quórum y reportes |
| **syncpass-mobile** | App Android offline-first del monitor |

## Qué hace

**Sin sesión** (`/`): página de inicio con tres secciones —**Inicio**, **Servicios** y **Contacto**—, sin imágenes
pesadas (el fondo es CSS). "Iniciar sesión" lleva al formulario en `/#/ingresar`.

> En "Servicios" se muestran las **metas del caso** (menos de 5 s por registro, más de 65 % de respuesta en encuestas,
> 80 % menos horas de digitación, 100 % operativa sin conexión). Son **objetivos del proyecto, todavía no mediciones**, y
> la página lo dice.

**Con sesión** (solo el grupo **COORDINADOR**; un monitor recibe la indicación de usar la app Android):

| Pantalla | Qué permite |
|---|---|
| **Eventos** (`/`) | Resumen con cifras reales del catálogo (proyectos, eventos, próximos eventos, personas), proyectos con sus eventos ordenados por fecha |
| **Quórum de un evento** | Asistentes marcados y cupos, dentro/fuera del radio/sin ubicación, encuestas y promedios. Se actualiza solo cada 15 s (apagable) |
| **Reporte CSV** | "Descargar CSV": una fila por asistencia (código, tipo, inscripción, hora UTC, ubicación, distancia, satisfacción, utilidad). Separador `;` y BOM para que Excel abra bien las tildes |
| **Proyectos y eventos** | Crear, editar y eliminar. No se elimina un proyecto con eventos ni un evento con asistencias (el servidor responde 409 y la web muestra el motivo) |

El quórum muestra solo lo que los teléfonos **ya sincronizaron**: un monitor sin cobertura no cuenta hasta que envíe.
El CSV no incluye datos que identifiquen a nadie: ni quién registró, ni coordenadas, ni comentarios (caso §5.1).

Rutas (con `#`, así sirve cualquier hosting estático sin reglas de reescritura):

| Ruta | Pantalla |
|---|---|
| `/#/` | Sin sesión: página de inicio. Con sesión: eventos |
| `/#/ingresar` | Formulario de ingreso (con sesión redirige al panel) |
| `/#/eventos/:id` | Quórum del evento |
| `/#/eventos/:id/editar` | Editar o eliminar un evento |
| `/#/proyectos/nuevo` · `/#/proyectos/:id/editar` | Crear, editar o eliminar un proyecto |
| `/#/proyectos/:id/eventos/nuevo` | Crear un evento en ese proyecto |

## Cómo ejecutarla

Requisitos: Node 20 o superior.

```
npm ci
cp .env.example .env        # en PowerShell: Copy-Item .env.example .env
npm run dev                 # http://localhost:5173
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | 125 pruebas (Vitest + Testing Library) |
| `npm run lint` | oxlint |
| `npm run build` | Comprueba tipos (`tsc`, modo estricto) y genera `dist/` |

### Variable de entorno

| Variable | Valor |
|---|---|
| `VITE_API_URL` | Host del backend o del API Gateway, **sin** `/api`. Por defecto `http://localhost:8080` |

El cliente añade `/api` por su cuenta (si la variable trae el sufijo, se quita). **Lo que empieza por `VITE_` queda
visible en el navegador: nunca pongas secretos ahí.** El `.env` no se sube a Git; solo `.env.example`.

Para entrar hace falta una cuenta del grupo COORDINADOR en Cognito (la crea el equipo docente) y datos: arranca el
backend con el perfil `demo` (catálogo **ficticio**) o crea tus propios proyectos desde el panel.

## Estructura

```
src/
  App.tsx            enrutado y cabecera del panel
  marca.tsx          logo
  paginas/           InicioPagina, LoginPagina, EventosPagina, EventoPagina, ProyectoFormPagina, EventoFormPagina
  api/               cliente.ts (fetch, token, renovación en 401), endpoints.ts, tipos.ts
  auth/              sesión en sessionStorage, contexto, lectura de roles del token
  csv.ts             generación y descarga del CSV
  formulario.ts      conversiones y validaciones de los formularios
  test/              pruebas y ayudas (servidor simulado)
```

## Seguridad

- **Los roles se leen del token sin verificar su firma**: es solo presentación. La autorización real la hace el servidor
  en cada petición (el quórum, la gestión y el reporte devuelven 403 a quien no es COORDINADOR aunque la web mostrara
  el botón).
- **La sesión vive en `sessionStorage`**: se borra al cerrar la pestaña. Ningún almacenamiento del navegador es inmune a
  XSS; esto limita cuánto tiempo hay algo que robar.
- **El token se renueva solo** ante un 401 (`POST /api/auth/refresh`), una única vez aunque fallen varias llamadas a la
  vez. Si el servidor rechaza el refresh token, la sesión termina. Si solo falla la red, la sesión **se conserva**.
- **No se usa `/api/health` para "validar" la sesión**: esa ruta es pública.
- **CSV**: las celdas de texto que empiezan por `=`, `+`, `-` o `@` se neutralizan contra la inyección de fórmulas.

## Qué se corrigió respecto a la base del profesor

| En la base | Aquí |
|---|---|
| `res.accessToken` plano: el backend responde `res.data.accessToken`, y el login guardaba la cadena `"undefined"` | Solo se desempaqueta `data`; una respuesta sin el formato esperado es un error |
| `checkSession()` consultaba `/health` (público): cualquier texto guardado daba acceso | La validez la decide el servidor en cada llamada |
| No se comprobaba `response.ok` | Cada error se traduce a un mensaje claro |
| El prefijo `/api` vivía en el `.env` | Va en el código; el `.env` lleva solo el host |
| `npm run build` no compilaba y `strict` estaba desactivado | Compila en modo estricto |
| `.env` no estaba en `.gitignore` | Ignorado; solo se versiona `.env.example` |
| Sin pruebas ni limpieza de dependencias | 125 pruebas; se quitaron `oidc-client-ts` y `react-oidc-context` |

## Despliegue

- Compila con `VITE_API_URL=https://<api-gateway> npm run build` y publica el contenido de `dist/` en cualquier hosting
  estático (por ejemplo S3). Las rutas con `#` no necesitan reglas de reescritura.
- El API Gateway responde el CORS y el backend lo deja habilitado (`CORS_ENABLED=true`): el *preflight* del navegador
  llega al backend. Acota `CORS_ALLOWED_ORIGINS` al dominio real de la web.

## Lo que NO está comprobado

Las pruebas verifican la lógica y las pantallas con un servidor **simulado**. Sin comprobar queda:

- **El flujo completo con Cognito real y el CSV abierto en Excel** con datos reales del servidor.
- **La apariencia en pantallas reales y en móvil**: se comprobó a ojo la página de inicio en escritorio; el panel y los
  formularios no se miraron en el navegador.
- Las cifras del panel reflejan el catálogo descargado; sin marcaciones sincronizadas el quórum sale en cero.

## Pendiente

- Probar el panel y los formularios en el navegador contra el backend desplegado.
- Un aviso de lint (`react/set-state-in-effect`) sobre el patrón estándar de cargar al montar.
- Informes en PDF y gráficos: el CSV cubre el reporte básico.
