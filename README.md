# SyncPass · Web

Aplicación web de **SyncPass** (caso **DSY1105**, Duoc UC): una **página de inicio pública** y el **panel del
Docente / Coordinador(a) de Proyecto**, que gestiona proyectos y eventos, supervisa el quórum en vivo y descarga el
reporte de asistencia, administra a los asistentes (con credenciales QR) y emite informes de impacto.

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

**Sin sesión** (`/`): página de inicio hecha a partir de la imagen de referencia del equipo: cabecera blanca con el logo, el menú
—**Inicio**, **Cómo funciona** y **Contacto**— y "Iniciar sesión"; el titular sobre el fondo de ondas azules y cuatro
garantías en fila. Más abajo siguen "Cómo funciona" (tres pasos), "Servicios", las metas y el contacto. "Iniciar sesión"
lleva al formulario en `/#/ingresar`. La web usa solo **modo claro** y la tipografía Plus Jakarta Sans (paquete local,
sin pedir nada a internet). Las imágenes de la marca están en `src/assets` (`logo-*.png`, `fondo-hero.webp`).

> En la sección de metas se muestran las **metas del caso** (menos de 5 s por registro, más de 65 % de respuesta en encuestas,
> 80 % menos horas de digitación, 100 % operativa sin conexión). Son **objetivos del proyecto, todavía no mediciones**, y
> la página lo dice.

**Con sesión** (solo el grupo **COORDINADOR**; un monitor recibe la indicación de usar la app Android):

| Pantalla | Qué permite |
|---|---|
| **Eventos** (`/`) | Resumen con cifras reales del catálogo (proyectos, eventos, próximos eventos, personas), proyectos con sus eventos ordenados por fecha |
| **Quórum de un evento** | Asistentes marcados y cupos, dentro/fuera del radio/sin ubicación, encuestas y promedios. Se actualiza solo cada 15 s (apagable) |
| **Reporte CSV** | "Descargar CSV": una fila por asistencia (código, tipo, inscripción, hora UTC, ubicación, distancia, satisfacción, utilidad). Separador `;` y BOM para que Excel abra bien las tildes |
| **Proyectos y eventos** | Crear, editar y eliminar. No se elimina un proyecto con eventos ni un evento con asistencias (el servidor responde 409 y la web muestra el motivo) |
| **Quórum mínimo** | Cada evento puede definir un mínimo de asistentes (no mayor que los cupos). El detalle del evento muestra "Quórum cumplido" o "Faltan N para el quórum" con una barra de avance. Sin mínimo definido no se da veredicto |
| **Comentarios** | En el detalle del evento, los comentarios de las encuestas (sin quién los escribió) |
| **Asistentes** (`/asistentes`) | Lista con filtros (código, tipo, inscripción), alta en lote (hasta 200), edición de tipo e inscripción y eliminación con confirmación (409 si ya tiene asistencias). Solo código sintético, tipo e inscripción: sin datos personales |
| **Credenciales QR** (`/asistentes/credenciales`) | Una credencial imprimible por asistente con su QR `ASISTENTE_{id}`, el mismo formato que lee la app del monitor. El QR se dibuja como SVG desde la matriz de módulos (librería `qrcode`), sin canvas |
| **Informes** (`/informes`) | Informe de impacto consolidado: general o por proyecto, con totales (asistentes únicos, marcaciones, encuestas y tasa de respuesta, satisfacción y utilidad ponderadas, quórums cumplidos), tabla por evento y comentarios. "Imprimir / guardar PDF" usa la impresión del navegador (el menú y los botones no salen en el papel) y "Descargar CSV" entrega una fila por evento con decimales con coma |

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
| `/#/asistentes` · `/#/asistentes/credenciales` | Gestión de asistentes · credenciales QR para imprimir |
| `/#/informes` | Informe de impacto (imprimir, PDF o CSV) |

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
| `npm test` | 157 pruebas (Vitest + Testing Library) |
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
| Sin pruebas ni limpieza de dependencias | 157 pruebas; se quitaron `oidc-client-ts` y `react-oidc-context` |

## Despliegue

- Compila con `VITE_API_URL=https://<api-gateway> npm run build` y publica el contenido de `dist/` en cualquier hosting
  estático (por ejemplo S3). Las rutas con `#` no necesitan reglas de reescritura.
- El API Gateway responde el CORS y el backend lo deja habilitado (`CORS_ENABLED=true`): el *preflight* del navegador
  llega al backend. Acota `CORS_ALLOWED_ORIGINS` al dominio real de la web.

## Lo que NO está comprobado

Las pruebas verifican la lógica y las pantallas con un servidor **simulado**. Sin comprobar queda:

- **El flujo completo con Cognito real y el CSV abierto en Excel** con datos reales del servidor.
- **La apariencia en pantallas reales y en móvil**: se comprobaron a ojo, en escritorio, la página de inicio, el ingreso y las pantallas
  principales del panel (con datos de prueba simulados); no se miraron el móvil ni el informe impreso.
- **Que los lectores de QR escaneen las credenciales impresas** (se verificó la generación, no la lectura con cámara).
- Las cifras del panel reflejan el catálogo descargado; sin marcaciones sincronizadas el quórum sale en cero.

## Pendiente

- Probar el panel y los formularios en el navegador contra el backend desplegado.
- Un aviso de lint (`react/set-state-in-effect`) sobre el patrón estándar de cargar al montar.
- Gráficos en el informe: hoy son tablas y cifras; el PDF sale de la impresión del navegador.
- Horas de participación por estudiante y lista de quién asistió a cada evento (hoy solo conteos).
- Recuperar contraseña desde la web.

## Equipo

Proyecto del curso DSY1105 · Desarrollo de Aplicaciones Móviles · Duoc UC.

| Integrante | GitHub | Aporte en este repositorio |
|---|---|---|
| Mario Meléndez | [Mario-Melendez-Inostroza](https://github.com/Mario-Melendez-Inostroza) | Desarrollo e integración del sistema |
| _(nombre completo)_ | [bx1423](https://github.com/bx1423) | _(completar: qué aportó o revisó)_ |
| _(nombre completo)_ | [Monnacohu](https://github.com/Monnacohu) | _(completar: qué aportó o revisó)_ |
