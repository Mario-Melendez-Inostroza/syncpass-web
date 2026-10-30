# SyncPass · Web

Aplicación web de **SyncPass** (caso **DSY1105**, Duoc UC): una **página de inicio pública** y el **panel del
Docente / Coordinador(a) de Proyecto**, que gestiona proyectos y eventos, supervisa el quórum en vivo y descarga el
reporte de asistencia, administra a los asistentes (con credenciales QR) y emite informes de impacto.

La asistencia se registra desde la app Android (`syncpass-mobile`). Esta web habla con el backend (`syncpass-api`),
**nunca directamente con Cognito**.

React 19 · TypeScript (modo estricto) · Vite 8 · Tailwind 4 · wouter · Vitest.

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

## El caso que resolvemos

**SyncPass** nace del caso de Ticdgm (CITT Plaza Vespucio, DSY1105): los proyectos de vinculación comunitaria toman la
asistencia **en papel** y consolidan todo a mano. Eso produce hojas perdidas, filas de 15 a 20 minutos en la entrada,
encuestas con menos de 15 % de respuesta (se envían semanas después) y barrios con poca señal donde una web normal no sirve.

| Pieza del sistema | Quién la usa | Problema que resuelve |
|---|---|---|
| **App Android** (`syncpass-mobile`) | Monitores en terreno | Registrar asistencia con QR, sin internet, y encuestar en el momento |
| **Panel web** (este repositorio) | Docente / Coordinador(a) | Planificar proyectos y eventos, ver el quórum en vivo y sacar informes sin transcribir planillas |
| **Portal del asistente** (este repositorio) | Vecinos, estudiantes y docentes | Crear cuenta, ver talleres, inscribirse y mostrar su QR |
| **API** (`syncpass-api`) | Todos | Guarda todo en PostgreSQL, autentica con Cognito y reparte permisos por rol |

Metas del caso: registrar en **menos de 5 segundos**, **más de 65 %** de respuesta a la encuesta, **80 %** menos tiempo de
consolidación y **100 %** de operación sin conexión. Son objetivos, no mediciones.

## Cómo usamos la IA

Trabajamos con **Claude Code** (Anthropic) como asistente de programación, y lo hacemos como se trabaja hoy de forma profesional:
**no se le da una orden suelta, se le da contexto, reglas y un proceso** en archivos del propio repositorio. La IA no recuerda
conversaciones anteriores; lo que está escrito en estos archivos es lo que lee al empezar cada tarea.

| Archivo | Qué contiene |
|---|---|
| [`AGENTS.md`](AGENTS.md) y `CLAUDE.md` | Guía de entrada: qué es el proyecto, stack, comandos, estructura, convenciones y qué comprobar antes de dar algo por terminado |
| [`docs/ia/CONTEXTO.md`](docs/ia/CONTEXTO.md) | El caso resumido: problema, roles, datos, metas y restricciones |
| [`docs/ia/REGLAS.md`](docs/ia/REGLAS.md) | **Instrucciones y restricciones**: sin datos personales, sin secretos, autorización en el servidor, pruebas obligatorias, las acciones de permisos las ejecuta una persona |
| [`docs/ia/ROADMAP.md`](docs/ia/ROADMAP.md) | Fases del proyecto con su estado real y lo pendiente |
| [`docs/ia/DECISIONES.md`](docs/ia/DECISIONES.md) | Decisiones de diseño con su porqué (offline-first, idempotencia, roles, sin datos personales…) |
| [`docs/ia/FLUJO-DE-TRABAJO.md`](docs/ia/FLUJO-DE-TRABAJO.md) | El ciclo de trabajo, quién hace qué y cómo se verifica lo que escribe la IA |
| [`docs/ia/PROMPTS.md`](docs/ia/PROMPTS.md) | Plantillas de instrucciones por tipo de tarea (funcionalidad, error, pruebas, revisión, despliegue) |

**El ciclo de cada tarea:** especificar → la IA propone un plan y una persona lo aprueba → implementar en pasos pequeños →
**verificar ejecutando** (compilación, pruebas, lint, prueba real contra la nube) → una persona revisa el cambio → Pull Request con
integración continua → documentar lo hecho y lo que no se pudo comprobar.

**Qué hace la IA:** propone arquitectura y alternativas, escribe código, pruebas y documentación, diagnostica errores leyendo
registros y código, y ejecuta las verificaciones.
**Qué hacemos nosotros:** definimos y corregimos los requisitos (por ejemplo, que el asistente también es un rol), aprobamos los
planes, revisamos cada cambio, ejecutamos las acciones de permisos en AWS, probamos en el teléfono y en el navegador, y somos
responsables de lo que se entrega y de poder explicarlo.

**Cómo controlamos sus errores:** nada se da por bueno sin ejecutarlo; se rompen reglas a propósito para comprobar que las pruebas
las detectan; se compara el contrato entre la app y el backend; se prueba el flujo real contra el API Gateway desplegado; y antes
de publicar un repositorio se revisa que no haya secretos ni datos reales.

## Roles y cómo iniciar sesión

El ingreso es contra el backend (que habla con Amazon Cognito) y el rol sale del grupo del usuario (`cognito:groups`).

| Rol | Cómo entra | Qué ve en la web |
|---|---|---|
| **COORDINADOR** | Cuenta creada por el equipo de coordinación | Panel completo: proyectos, eventos, asistentes, credenciales QR, informes |
| **ASISTENTE** | **Se registra solo** en `/#/registro` | Talleres (cupos, inscribirse, cancelar) y "Mi credencial" con su QR |
| **MONITOR** | Cuenta creada por el equipo de coordinación | Solo usa la app Android: la web le indica que la descargue |

Los roles se leen del token **sin verificar su firma**, solo para decidir qué mostrar. La autorización real la hace el servidor
en cada petición, y responde 403 a quien no corresponde aunque el botón estuviera visible.

## Mantenedores (CRUD) de la web

| Mantenedor | Pantallas | Operaciones | Reglas |
|---|---|---|---|
| **Proyectos** ("creación de curso") | `ProyectoFormPagina` | Crear · editar · eliminar · listar | Fechas coherentes; no se elimina un proyecto con eventos (409) |
| **Eventos** (talleres) | `EventoFormPagina`, `EventoPagina` | Crear · editar · eliminar · listar | Cupos, quórum mínimo ≤ cupos, GPS completo; no se elimina un evento con asistencias (409) |
| **Asistentes** ("estudiantes del curso") | `AsistentesPagina` | Alta en lote (hasta 200) · editar · eliminar · filtrar | El código lo genera el servidor; sin datos personales |

Cada formulario valida **antes de enviar** y, si el servidor rechaza algo, muestra su mensaje tal cual.

## Qué tecnologías usamos y por qué

| Tecnología | Qué es | Por qué la elegimos |
|---|---|---|
| **React 19** | Biblioteca para construir interfaces con **componentes**: piezas reutilizables que se redibujan cuando cambia su estado | La interfaz del panel (formularios, listas, quórum que se actualiza solo) es mucho estado cambiante; React lo maneja sin tocar el DOM a mano |
| **TypeScript (estricto)** | JavaScript con tipos, comprobados al compilar | Los errores aparecen al escribir, no en producción. Los tipos de `api/tipos.ts` reflejan los DTO del backend |
| **Vite 8** | Herramienta de desarrollo y compilación | Arranca al instante y recarga en caliente; genera un `dist/` pequeño y estático que se publica en cualquier hosting |
| **Tailwind CSS 4** | Estilos con **clases utilitarias** (`flex`, `p-4`, `text-sky-700`) escritas junto al componente | No hay hojas de estilo enormes ni nombres de clase que inventar; el diseño queda consistente y los colores de marca viven en un solo lugar (`index.css`) |
| **wouter** | Enrutador mínimo | Pesa muy poco; con rutas por `#` sirve en cualquier hosting estático sin reglas de reescritura |
| **Vitest + Testing Library** | Pruebas de componentes y lógica | Prueban como las usa una persona (buscan "botón Guardar"), con un servidor simulado |
| **qrcode** | Genera la matriz del QR | Dibujamos el QR como **SVG** propio, sin canvas, imprimible |
| **fontsource (Plus Jakarta Sans)** | Tipografía empaquetada | La web no pide nada a servidores de terceros |

## Arquitectura de la web

La web es solo la **vista**: toda regla de negocio vive en el backend (controller → service → repository).

```
 Página (componente React)  ──►  api/endpoints.ts  ──►  api/cliente.ts  ──►  Backend (API Gateway → Spring Boot)
   estado local, formulario      una función por          fetch + token +
   y validación                  endpoint                 renovación en 401
```

| Capa | Archivos | Responsabilidad |
|---|---|---|
| Páginas | `paginas/*.tsx` | Dibujar, recoger datos del formulario, mostrar errores |
| Cliente de la API | `api/cliente.ts`, `api/endpoints.ts`, `api/tipos.ts` | Una función por endpoint, tipada; añade el token y lo renueva |
| Sesión | `auth/*` | Guarda el token en `sessionStorage`, lee los roles, protege rutas |
| Utilidades puras | `csv.ts`, `formulario.ts`, `qrTexto.ts`, `formato.ts` | Lógica sin pantalla: fácil de probar |

## Mockup de la web

```
 ┌─ Inicio (sin sesión) ──────────────────────────────────────────┐   ┌─ Panel del coordinador ───────────┐
 │ [logo]   Inicio  Cómo funciona  Contacto        [Iniciar sesión]│   │ Proyectos 3 · Eventos 8 · Próx. 2  │
 │                                                                 │   │ ▾ Alfabetización digital  [Editar] │
 │   Registra asistencia en terreno,                               │   │    Taller de correo   05/11  14/30 │
 │   incluso sin internet                [ fondo de ondas azules ] │   │    Quórum ▓▓▓▓▓░░ Faltan 4         │
 │   ✔ Sin papel  ✔ Con QR  ✔ Sin conexión  ✔ Datos seguros       │   │ [Nuevo proyecto] [Descargar CSV]   │
 └─────────────────────────────────────────────────────────────────┘   └────────────────────────────────────┘
```

La imagen de referencia con la que se construyó el inicio está en `src/assets/imagen_referencial.png` (local, no versionada).

## Pruebas y CI

- **Pruebas:** `npm test` (Vitest). Cubren el cliente HTTP (token, renovación, errores), los formularios, el CSV (BOM, comillas,
  inyección de fórmulas), el QR del asistente, el formato de fechas y las pantallas del panel y del asistente.
- **Integración continua:** cada `push` y cada Pull Request ejecutan **GitHub Actions** (`.github/workflows/ci.yml`):
  instala, revisa el lint, compila con TypeScript estricto y corre las pruebas.

## Qué hace

**Sin sesión** (`/`): página de inicio hecha a partir de la imagen de referencia del equipo: cabecera blanca con el logo, el menú
—**Inicio**, **Cómo funciona** y **Contacto**— y "Iniciar sesión"; el titular sobre el fondo de ondas azules y cuatro
garantías en fila. Más abajo siguen "Cómo funciona" (tres pasos), "Servicios", las metas y el contacto. "Iniciar sesión"
lleva al formulario en `/#/ingresar`. La web usa solo **modo claro** y la tipografía Plus Jakarta Sans (paquete local,
sin pedir nada a internet). Las imágenes de la marca están en `src/assets` (`logo-*.png`, `fondo-hero.webp`).

> En la sección de metas se muestran las **metas del caso** (menos de 5 s por registro, más de 65 % de respuesta en encuestas,
> 80 % menos horas de digitación, 100 % operativa sin conexión). Son **objetivos del proyecto, todavía no mediciones**, y
> la página lo dice.

**Con sesión como COORDINADOR** (un monitor recibe la indicación de usar la app Android; el asistente ve su propio portal):

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
| `npm test` | 170 pruebas (Vitest + Testing Library) |
| `npm run lint` | oxlint |
| `npm run build` | Comprueba tipos (`tsc`, modo estricto) y genera `dist/` |

### Variable de entorno

| Variable | Valor |
|---|---|
| `VITE_API_URL` | Host del backend o del API Gateway, **sin** `/api`. Por defecto `http://localhost:8080` |

El cliente añade `/api` por su cuenta (si la variable trae el sufijo, se quita). **Lo que empieza por `VITE_` queda
visible en el navegador: nunca pongas secretos ahí.** El `.env` no se sube a Git; solo `.env.example`.

Para entrar hace falta una cuenta del grupo COORDINADOR en Cognito (la crea el equipo de coordinación) y datos: arranca el
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
| _(nombre completo)_ | [bx1423](https://github.com/bx1423) | Pruebas del formato del código QR del asistente (`src/test/qrTesxto.test.ts`) |
| _(nombre completo)_ | [Monnacohu](https://github.com/Monnacohu) | Pruebas del formato de fechas y horas (`src/test/formato-fechas.test.ts`) |
