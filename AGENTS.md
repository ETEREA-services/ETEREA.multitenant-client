# Repository Instructions

> Contexto: esta carpeta es el repo `frontend` del workspace multitenant. El
> contexto global, los contratos entre repos y las reglas transversales están en
> [`../AGENTS.md`](../AGENTS.md). Este archivo sólo cubre el cliente Angular.

## Estado del proyecto

- Este repositorio contiene los **esqueletos estructurales** de los clientes
  multiempresa (contable y administrador).
- No agregar lógica de negocio, datos semilla, autenticación simulada ni cálculos
  contables sin un pedido explícito del usuario. La funcionalidad se implementa por pasos.
- Las páginas de ambos módulos son intencionalmente placeholders, salvo
  **Usuarios**, **Asignaciones**, **Empresas** y **Negocios** del administrador.
  Usuarios lista usuarios, permite darlos de alta y blanquear contraseñas con
  clave temporal;
  Asignaciones vincula cada usuario con empresas y negocios; Empresas y Negocios
  permiten listar, crear y editar (el alta de negocio genera el TenantID).
  Negocios siempre opera dentro de una empresa seleccionada: no muestra ni
  permite gestionar negocios de otras empresas.

## Workspace

- Nx 23 + Angular 22 + TypeScript 6 + Tailwind 4 + npm 11; Node.js 22+.
- Instalar con `npm install` (hay `package-lock.json`; usar npm, no otro gestor).
- `apps/contable` es un cascarón delgado: bootstrap, `app.config.ts`, rutas raíz y shell.
  Las vistas viven en librerías.
- `apps/administrador` sigue el mismo patrón, pero opera de forma global (sin empresa
  activa) y su shell oculta el selector de empresa.
- Librerías:
  - `shared-api` (`type:data-access`, `scope:shared`): contexto empresa/negocio, interceptor, tokens, env, formato.
  - `ui-layout` (`type:ui`, `scope:shared`): sistema de diseño y shell.
  - `feature-session` (`type:feature`, `scope:shared`): login y selector de contexto (empresa → negocio).
  - `contable-data-access` (`type:data-access`, `scope:contable`): modelos y contrato de datos.
  - `feature-contable` (`type:feature`, `scope:contable`): rutas y páginas del módulo.
  - `reporte-shared` (`type:util`, `scope:shared`): contrato genérico de reportes (`ReporteDatos`).
  - `ui-reportes` (`type:ui`, `scope:shared`): shell de reportes, vista previa, descarga e impresión.
  - `administrador-data-access` (`type:data-access`, `scope:administrador`): modelos y contrato.
  - `feature-administrador` (`type:feature`, `scope:administrador`): rutas y páginas del módulo.
- Importar siempre por los aliases `@eterea/*` y a través de `src/index.ts`.
- `@nx/enforce-module-boundaries` valida tipos y scopes; respetar la dirección de dependencias.

## Comandos

```bash
npm start                      # nx serve contable (puerto 4220)
npm run start:administrador    # nx serve administrador (puerto 4221)
npm run build                  # nx build contable (producción)
npm run build:administrador    # nx build administrador (producción)
npm run lint                   # lint de todos los proyectos
npx nx show project contable   # targets disponibles
npx nx graph                   # grafo del workspace
```

Formato: Prettier, 100 columnas, comillas simples, parser Angular para HTML, 2 espacios.

## Sistema de diseño

- Tokens y temas: `libs/ui-layout/src/styles/tokens.css` (claro/oscuro con `data-theme`).
- Primitivas: `libs/ui-layout/src/styles/ui.css` (`et-btn`, `et-card`, `et-input`,
  `et-table`, `et-badge`, `et-eyebrow`, `et-amount`, etc.).
- Shell: `et-shell` con grupos de navegación, empresa activa, usuario y tema.
- Componentes compartidos: `et-icon`, `et-page-header`, `et-empty-state`.
- No crear paletas ni estilos ad hoc por pantalla: usar tokens y clases `et-*`.
- La identidad es propia (ultramar + lima + tinta). No copiar la estética de otros repositorios.
- Los títulos usan Sora, el texto Inter y los importes JetBrains Mono (con `font-variant-numeric`).
- Toda pantalla nueva debe funcionar en tema claro y oscuro y en mobile.

## Multiempresa

- `ContextoStore` mantiene la jerarquía empresa → negocio. `contextoInterceptor`
  envía `X-Tenant-Id` con `negocio.tenantId`, nunca con `empresaId`.
- La lista de empresas/negocios se carga desde Brain después del login con
  `registrarContexto`; no hardcodear empresas ni negocios. No hay auto-selección:
  el usuario debe elegir empresa y después negocio.
- `contextoGuard` exige ambos y está conectado a las rutas del shell de Contable.
  Espera a `AuthStore.asegurarSesion()` antes de leer el contexto: los guards de
  una misma ruta se resuelven en paralelo, y tras un F5 la sesión todavía puede
  estar cargándose.
- `/empresas` es la pantalla obligatoria de dos pasos; el shell abre el mismo
  selector en un modal para cambiar de contexto sin perder la ruta actual.
- La selección se guarda en `sessionStorage` (`eterea.contable.contexto`), así cada
  solapa es independiente y sobrevive a F5. No usar `localStorage` para el contexto
  ni sincronizar solapas con eventos `storage`/`BroadcastChannel`.
- El cliente administrador es global: no usa `ContextoStore` ni el selector de contexto.
- No persistir datos sensibles en `localStorage`. El access token vive en memoria y
  el refresh token en cookie HttpOnly; la cookie es compartida entre solapas.
- Al cambiar de negocio desde el shell, la ruta se reutiliza y el componente
  **no se recrea**: las pantallas que cargan datos del tenant deben reaccionar a
  `ContextoStore` (por ejemplo con un `effect` sobre `negocioActivo`/`version`) y
  recargar. No alcanza con cargar sólo en `ngOnInit`.

## Datos

- `contable-data-access` sólo define modelos y el contrato `ContableRepository`.
- `administrador-data-access` define modelos y el contrato `AdministradorRepository`
  (empresas, negocios, usuarios y asignaciones contra `/api/brain/core`), con su
  implementación HTTP en `AdministradorHttpRepository`. Incluye las altas y
  ediciones de empresa y negocio.
- El TenantID de un negocio se genera en el cliente con `generarTenantId`
  (`administrador-data-access`): `<PREFIJO>_tenant_<YYYYMMDD>_<36 hex>`, donde el
  prefijo son las iniciales de la empresa (`Termalia SA` → `TSA`). El backend
  valida que no se repita.
- La implementación HTTP futura debe:
  - depender de `API_URL` y del header de tenant cuando corresponda (no de `environment` directamente);
  - vivir en la librería de datos del módulo;
  - exponer Observables tipados y errores normalizados;
  - mantenerse testeable con dobles del contrato.
- No agregar datos de demostración a las apps.

## Reportes

- El PDF se genera en el core con OpenPDF; el frontend sólo pide datos para la
  vista previa o el PDF para descargar/imprimir.
- Contrato único: `POST /api/tenant/core/reporte/<slug>/datos` (JSON) y
  `POST .../<slug>/pdf` (binario). El tenant viaja en `X-Tenant-Id`; el body no
  lleva `tenantId` ni `negocioId`.
- Página de referencia: `/reportes/plan-cuentas` (botón “Reporte” en
  `/plan-cuentas`). Para un reporte nuevo, reutilizar `EtReporteLayoutComponent`
  y `EtReportePreviewComponent` de `ui-reportes`, y sumar el repository en la
  librería de datos del módulo.
- Fechas visibles: `dd-MM-yyyy` (ver regla global
  `~/.config/opencode/rules/formatos.md`).

## Verificación

- `npx nx build contable --configuration=production`,
  `npx nx build administrador --configuration=production` y
  `npx nx run-many -t lint` deben pasar sin errores.
- `strict`, `strictTemplates` y strict injection están activos: no relajarlos.
- Presupuestos de bundle: 500 kB warning / 1 MB error inicial; estilos de componente
  8 kB warning / 12 kB error.
- Tests: pendientes de configurar; no afirmar cobertura inexistente.

## Integración con el backend

El login común ya está implementado en `feature-session` y usa `shared-api`:

```http
POST /api/brain/auth/login
Content-Type: application/json

{ "login": "usuario", "password": "...", "app": "contable" | "administrador" }
```

- La respuesta es `{ accessToken, tokenType, expiresIn, usuario }`.
- El **access token JWT vive sólo en memoria** (`AuthStore`); no persistirlo en
  `localStorage`.
- El **refresh token** viaja en cookie `HttpOnly`/`SameSite=Strict`; el navegador
  la envía en `/api/brain/auth/refresh` y `/api/brain/auth/logout`. El core lo
  valida y extiende sin rotarlo en cada request, para que ambos módulos puedan
  compartir la misma sesión.
- `authInterceptor` agrega `Authorization: Bearer` y, ante un `401`, refresca una
  sola vez y reintenta.
- `authGuard`, `guestGuard`, `adminGuard`, `contextoGuard` y
  `pendingPasswordChangeGuard` están en `shared-api`. Los guards son UX: la
  autorización real la hace el backend.
- Si el login devuelve `usuario.mustChangePassword = true`, `rutaPostLogin()`
  lleva a `/cambiar-password` y `pendingPasswordChangeGuard` impide entrar al
  shell de ambas apps hasta que se defina una clave nueva.
- Si la sesión no tiene empresa y negocio elegidos, `rutaPostLogin()` lleva a
  `/empresas`; `contextoGuard` repite esa redirección al entrar al shell.
- El administrador consume `/api/brain/core/usuario`,
  `POST /api/brain/core/usuario` (alta con password inicial obligatoria) y
  `POST /api/brain/core/usuario/{id}/password-reset` desde
  `AdministradorHttpRepository`; la temporal se muestra una sola vez.
- Asignaciones usa `GET /api/brain/core/usuario-empresa/usuario/{id}`,
  `GET /api/brain/core/usuario-negocio/usuario/{id}`,
  `GET /api/brain/core/negocio/empresa/{empresaId}` y las mutaciones
  `POST/PUT` de `usuario-empresa` y `usuario-negocio`. Sólo muestra los negocios
  de empresas asignadas y desactiva en cascada al desasignar una empresa.
- Empresas usa `GET/POST /api/brain/core/empresa` y
  `PUT /api/brain/core/empresa/{empresaId}`. Negocios usa
  `GET/POST /api/brain/core/negocio` y `PUT /api/brain/core/negocio/{negocioId}`.
  La pantalla de Negocios exige elegir una empresa y sólo lista/edita los
  negocios de esa empresa; el buscador filtra dentro de ese conjunto.
  En el alta el backend asigna el `negocioId`; en la edición conserva
  `tenantId` y `databasePassword` si no se envían. La contraseña de la base no
  se devuelve en las lecturas (`WRITE_ONLY`).
- Para Contable, el contexto se arma con:
  - `GET /api/brain/core/usuario-empresa/usuario/{usuarioId}`;
  - `GET /api/brain/core/usuario-negocio/usuario/{usuarioId}/empresa/{empresaId}`;
  - `GET /api/brain/core/empresa/{empresaId}`.
- El header `X-Tenant-Id` debe llevar `negocio.tenantId`, no `empresaId`.
- `SESSION_CONFIG` define `app`, `appName`, `homePath`, `tenantPickerPath`,
  `requiresAdmin`, `usesTenants` y `authApiUrl`. Ambos hosts lo proveen.
- El login usa `authApiUrl` (`/api/brain`), separado de `API_URL`: Contable apunta
  a `/api/tenant/core` y Administrador a `/api/brain/core`.
- En desarrollo, `proxy.conf.json` redirige `/api` a `http://localhost:9050`. No
  abrir CORS global.
