# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado adopta [SemVer](https://semver.org/lang/es/).

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
