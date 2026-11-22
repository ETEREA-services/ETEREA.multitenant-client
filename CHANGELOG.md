# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado adopta [SemVer](https://semver.org/lang/es/).

## [0.5.0] - 2026-11-22

### Añadido

- Contable: consulta **Mayor** (`/mayor`) sobre
  `POST /api/tenant/core/reporte/mayor/{datos,pdf,xlsx}` con cuenta contable,
  rango de fechas, opción de omitir el saldo anterior y monedas de registro y de
  expresión; incluye vista previa, descarga de PDF, impresión y exportación
  XLSX.
- Contable: la consulta Mayor muestra un bloque plegable de controles con total
  de movimientos, movimientos excluidos, total por módulo y comprobantes sin
  tipo.
- Contable: consulta **Mayor discriminado** (`/mayor/discriminado`) sobre
  `POST /api/tenant/core/reporte/mayor-discriminado/{datos,pdf,xlsx}` con
  selección múltiple de cuentas (chips para quitar una o vaciar la selección),
  rango de fechas, monedas de registro y expresión, aviso cuando la selección
  supera las 50 cuentas, vista previa, PDF, impresión y XLSX.
- `contable-data-access`: repositorios HTTP `MayorReporteHttpRepository` y
  `MayorDiscriminadoHttpRepository`, y `CuentaRepository.buscar`
  (`POST /cuenta/buscar`) con hasta 20 cuentas imputables ordenadas por nombre.
- `contable-data-access`: catálogo de monedas compartido `MonedaRepository`
  (`GET /api/tenant/core/moneda`); `MonedaInfo` y `MonedasResponse` se mueven a
  `moneda.models` y el balance los consume desde allí a través del mismo índice
  público.
- `feature-contable`: componentes `et-cuenta-lookup` (búsqueda de cuentas con
  teclado, `Escape` y cierre en modal) y `et-moneda-select`
  (`ControlValueAccessor` con el `monedaId` como valor del formulario).
- `ui-reportes`: `EtReporteLayoutComponent` acepta contenido `[reporteControl]`
  y el input `mostrarControl` para bloques de control propios del reporte.
- `shared-api` y app Contable: `AuthStore.restaurando` y un splash "Restaurando
  sesión…" que se muestra hasta que termina la primera navegación.

### Cambiado

- Shell de Contable: nuevo grupo de navegación **Consultas** con Mayor y Mayor
  discriminado.
- Las pantallas de Mayor y Mayor discriminado recargan el catálogo de monedas y
  limpian la consulta al cambiar de negocio, reaccionando a `ContextoStore` en
  lugar de cargar sólo en el alta del componente.
- docs: README documenta las nuevas rutas, el grupo Consultas y los reportes
  Mayor y Mayor discriminado.

## [0.4.0] - 2026-11-17

### Añadido

- `ui-layout`: componente `et-date-input` (`ControlValueAccessor`) con texto
  enmascarado `dd/MM/aaaa`, botón de calendario sobre el selector nativo
  (`showPicker` con fallback), estado inválido y atributos `aria-*`; el
  formulario sigue recibiendo el valor ISO `yyyy-MM-dd`.
- `shared-api`: helpers `fechaHora()` (`dd/MM/yyyy HH:mm`) y `fechaArchivo()`
  (`dd-MM-yyyy` para nombres de archivo) junto a `fecha()`.
- Sesión: la pantalla de selección de contexto muestra el usuario activo
  (iniciales, nombre y login) y un botón para alternar el tema claro/oscuro.

### Cambiado

- `shared-api`: `fecha()` devuelve `dd/MM/yyyy` en lugar de `dd-MM-yyyy` y
  normaliza fechas ya formateadas con guiones o barras; las pantallas de
  ejercicios, usuarios, cambio de contraseña y la vista previa de reportes usan
  ese formato visible.
- Contable: los campos de fecha de balance y ejercicios usan `et-date-input`
  en lugar de `<input type="date">`; los payloads contra el backend conservan
  el formato ISO.
- `ui-reportes`: la vista previa normaliza `subtitulo` y `generadoEn` a
  `dd/MM/yyyy` aunque el backend los entregue con guiones.
- docs: `AGENTS.md` documenta `et-date-input` y la regla de fechas visibles con
  `fecha()`/`fechaHora()`.

## [0.3.0] - 2026-11-16

### Añadido

- ci(actions): workflow reutilizable `deploy-pipeline.yml` (verify, publicación
  de imágenes por matriz de apps y despliegue en runner self-hosted) y
  `deploy-develop.yml` para PRs y pushes a `develop`.
- ci(docker): publicación de `eterea.multitenant-contable-client` y
  `eterea.multitenant-administrador-client` en Docker Hub etiquetadas con el SHA
  completo del commit.
- ci(deploy): despliegue en el runner self-hosted `develop` mediante
  `/home/daniel/docker/multitenant/deploy-multitenant-frontend-develop.sh` con el
  SHA del commit.

### Cambiado

- ci(actions): `ci.yml` limita los pull request a `main`; los PRs a `develop`
  quedan cubiertos por `deploy-develop.yml` para evitar lint/build duplicados.
- docs: README y `AGENTS.md` documentan el flujo de despliegue a `develop`.

### Eliminado

- Administrador: los modelos `Negocio` y `NegocioInput` ya no incluyen `backendIp`
  ni `backendPort`, y el alta/edición de negocios perdió la sección Backend. La
  pantalla sólo gestiona la conexión a la base de datos y el TenantID.

## [0.2.0] - 2026-11-01

### Añadido

- Contable: informe de **Balance** (`/balance`) sobre el negocio activo, con
  filtros de rango de fechas, inclusión de la apertura y de los asientos de
  inflación, vista por estructura o por cuenta y selección de moneda de registro
  y de expresión desde el catálogo de monedas del tenant.
- Contable: vista previa del balance, descarga en PDF, impresión y exportación a
  XLSX.
- `contable-data-access`: contrato `BalanceReporteRepository` e implementación
  `BalanceReporteHttpRepository` contra `/api/tenant/core/reporte/balance`
  (`datos`, `pdf`, `xlsx` y `monedas`).
- `reporte-shared` y `ui-reportes`: `ReporteDatos` admite `subtitulo` y
  `advertencias`, cada columna declara su `tipo` para la exportación XLSX, y
  `EtReporteLayoutComponent` incorpora `exportar`, `mostrarExportarXlsx` y los
  textos e icono configurables del estado vacío.

### Cambiado

- Contable: la raíz `/` redirige a `/plan-cuentas`; el menú del shell y las rutas
  quedan alineados con las pantallas implementadas.
- Contable: el balance reacciona al cambio de negocio de `ContextoStore`,
  recarga el catálogo de monedas y vuelve a la moneda base.

### Eliminado

- Contable: rutas y pantallas placeholder de Resumen, Asientos, Libro mayor,
  Períodos, Centros de costo y Configuración, junto con sus entradas en el menú.

## [0.1.0] - 2026-10-31

Primera versión documentada del cliente multiempresa.

### Añadido

- Workspace Nx 23 con Angular 22 y dos aplicaciones (`contable` y
  `administrador`), aliases `@eterea/*` y límites entre librerías enforced por
  `@nx/enforce-module-boundaries`.
- Sistema de diseño propio en `ui-layout`: tokens de tema claro/oscuro,
  primitivas `et-*`, shell responsive con navegación agrupada e indicador de
  entorno (`LOCAL`, `DESARROLLO`, `STAGING`, `PRODUCCIÓN`).
- Autenticación contra Brain en `shared-api` y `feature-session`: login,
  refresh token en cookie `HttpOnly`, logout, `authInterceptor` con reintento
  ante `401`, guards de sesión, invitado, administrador y contexto, y cambio de
  contraseña con cierre de sesión.
- Contexto multiempresa empresa → negocio: `ContextoStore` con persistencia en
  `sessionStorage` por solapa, `contextoInterceptor` con `X-Tenant-Id` tomado de
  `negocio.tenantId`, pantalla obligatoria de selección y cambio de contexto en
  modal desde el shell.
- Contable: plan de cuentas con árbol jerárquico, alta, edición y baja de
  cuentas, y reporte de Plan de Cuentas con vista previa, descarga de PDF e
  impresión.
- Contable: ejercicios contables con alta, edición, bloqueo/desbloqueo y
  eliminación, y coeficientes de inflación por año con edición mensual y guarda
  de cambios pendientes.
- Administrador: alta, edición y listado de empresas y negocios, con generación
  del `tenantId` en el cliente al dar de alta un negocio y filtro por empresa.
- Administrador: alta de usuarios con contraseña inicial, blanqueo con
  contraseña temporal y asignaciones usuario–empresa / usuario–negocio con
  activación, desactivación y cascada al desasignar una empresa.
- Publicación con Docker multietapa y Nginx: HTTPS con certificado
  auto-firmado, fallback de SPA, proxy same-origin de `/api/` y placeholders de
  `API_URL`, `ENV_NAME` y `APP_VERSION` reemplazados en runtime.
- CI en GitHub Actions con Node.js 22: `npm ci`, lint de todos los proyectos y
  build de producción de Contable.
