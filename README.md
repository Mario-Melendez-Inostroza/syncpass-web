# SyncPass · Panel del coordinador (web)

Aplicación web para que el **Docente / Coordinador(a) de Proyecto** supervise sus eventos en tiempo real
(caso DSY1105, §2.4 y §4.1): quórum, ubicación de las marcaciones y satisfacción de los asistentes.

La asistencia se registra desde la app Android (`syncpass-mobile`); esta web **supervisa y gestiona el catálogo**. Habla con el
backend (`syncpass-api`), nunca directamente con Cognito.

React 19 · TypeScript (modo estricto) · Vite 8 · Tailwind 4 · wouter · Vitest.

> Parte de una base del profesor (`docentedev/fs2-web`, commit `65ee494`). Esa base solo tenía un login que no podía
> funcionar; todo lo demás es desarrollo propio, en los commits siguientes.

## Qué hace

- **Página de inicio pública** (`/`, sin sesión): landing con cabecera, hero con la imagen de fondo (`public/assets/fondo_hero.png`), "Todo lo que necesitas en una sola plataforma", "Impacto real", tecnología y contacto. "Iniciar sesión" lleva a `/#/ingresar`. Con sesión, la raíz es el panel. **Las cifras de "Impacto real" (+60 %, +85 %, -50 %) son las del diseño de referencia y son ilustrativas: no son mediciones.**
- **Login** (correo y contraseña) y cierre de sesión. Solo entra el grupo **COORDINADOR**; un monitor recibe la
  indicación de usar la app Android y su sesión no se guarda.
- **Eventos**: proyectos con sus eventos, ordenados por fecha.
- **Quórum de un evento**: asistentes marcados y cupos, dentro/fuera del radio/sin ubicación, encuestas recibidas
  y promedios de satisfacción y utilidad, y primera y última marcación. Se **actualiza solo cada 15 s** (apagable).
- **Proyectos y eventos** (caso §3.1): crear, editar y eliminar desde el panel. No se elimina un proyecto con eventos ni un evento con asistencias (el servidor responde 409 y la web muestra el motivo). Latitud y longitud van juntas o ninguna.
- **Reporte CSV** (caso §2.4): "Descargar CSV" en cada evento, con una fila por asistencia (código, tipo, inscripción, hora UTC, ubicación, distancia, satisfacción y utilidad). Separador `;` y BOM para que Excel abra bien las tildes. Sin datos que identifiquen: ni quién registró, ni coordenadas ni comentarios.
- Claro u oscuro según el sistema; controles de 44 px como mínimo; lectores de pantalla (barras con `role="progressbar"`,
  errores con `role="alert"`).

El quórum muestra solo lo que los teléfonos **ya sincronizaron**: un monitor sin cobertura no cuenta hasta que envíe.

## Cómo ejecutarla

```
npm ci
cp .env.example .env        # y ajusta VITE_API_URL si el backend no está en localhost:8080
npm run dev                 # http://localhost:5173
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | servidor de desarrollo |
| `npm test` | 120 pruebas (Vitest + Testing Library) |
| `npm run lint` | oxlint |
| `npm run build` | comprueba tipos (`tsc`, modo estricto) y genera `dist/` |

### Variable de entorno

| Variable | Valor |
|---|---|
| `VITE_API_URL` | Host del backend o de API Gateway, **sin** `/api`. Por defecto `http://localhost:8080` |

El cliente añade `/api` por su cuenta. Si la variable trae el sufijo `/api` (como el `.env` original), se quita, así que
ambas formas funcionan. **Lo que empieza por `VITE_` queda visible en el navegador: nunca pongas secretos ahí.**

Para probar con datos, levanta el backend con el perfil `demo` (catálogo **ficticio**) y entra con un usuario del
grupo `COORDINADOR`. Con una base sin marcaciones el quórum sale en cero, lo cual es correcto.

## Seguridad

- **Los roles se leen del token sin verificar su firma**: es solo presentación. La autorización real la hace el
  servidor en cada petición (el quórum devuelve 403 a quien no es COORDINADOR aunque la web mostrara el botón).
- **La sesión vive en `sessionStorage`**: se borra al cerrar la pestaña. Ningún almacenamiento del navegador es inmune
  a XSS; esto limita cuánto tiempo hay algo que robar. Cada pestaña nueva pide iniciar sesión otra vez.
- **El token se renueva solo** ante un 401 (`POST /api/auth/refresh`), una única vez aunque fallen varias llamadas a la
  vez. Si el servidor rechaza el refresh token, la sesión termina y vuelve el login. Si solo falla la red, la sesión
  **se conserva**.
- **No se usa `/api/health` para "validar" la sesión.** Esa ruta es pública y responde 200 con cualquier texto: el
  original la usaba así y bastaba cualquier cadena guardada para entrar.

## Qué se corrigió respecto a la base del profesor

| En la base | Aquí |
|---|---|
| `res.accessToken` plano: el backend responde `res.data.accessToken`, y el login guardaba la cadena `"undefined"` | Solo se desempaqueta `data`; una respuesta sin el formato esperado es un error |
| `checkSession()` consultaba `/health` (público): cualquier texto guardado daba acceso | La validez la decide el servidor en cada llamada |
| No se comprobaba `response.ok`: un 401 se tomaba por éxito y no se mostraba ningún error | Cada error se traduce a un mensaje claro |
| El prefijo `/api` vivía en el `.env` | Va en el código; el `.env` lleva solo el host |
| El hook de autenticación creaba un estado distinto por consumidor | Un único proveedor de contexto |
| `npm run build` no compilaba, y `strict` estaba desactivado | Compila en modo estricto |
| `.env` no estaba en `.gitignore` | Ignorado; solo se versiona `.env.example` |
| Sin pruebas; `wouter`, `lucide-react`, `oidc-client-ts` y `react-oidc-context` instaladas y sin usar | 65 pruebas; se quitaron las dos de OIDC |

## Despliegue

- Las rutas llevan `#` (`/#/eventos/12`), así que sirve cualquier hosting estático (S3) **sin** reglas de reescritura.
- El backend debe permitir el origen de la web: variable `CORS_ALLOWED_ORIGINS` (hoy `*` por defecto; acótala al
  dominio real al desplegar). Si pasa por API Gateway, configura allí el CORS o desactívalo en el backend.
- Compila con `VITE_API_URL=https://<api-gateway>` y publica el contenido de `dist/`.

## Lo que NO está comprobado

Las pruebas verifican la lógica y las pantallas con un servidor **simulado**. Sin comprobar queda:

- **Un navegador real contra el backend real**: CORS, cabeceras y tiempos reales.
- **El flujo completo con Cognito** (grupos en el token, renovación real).
- **Los formularios y el CSV contra el backend real**: se probaron con un servidor simulado; falta una prueba con Excel y con datos reales del servidor.
- **La apariencia** en pantallas reales y en modo oscuro (se escribió y compila, pero no se miró).
- El panel necesita que existan marcaciones sincronizadas para mostrar algo más que ceros.

## Pendiente

- Probarla en el navegador contra el backend.
- Un aviso de lint (`react/set-state-in-effect`) que es una heurística sobre el patrón estándar de cargar al montar.
- Informes en PDF y gráficos: el CSV cubre el reporte básico; lo demás queda fuera del MVP.
