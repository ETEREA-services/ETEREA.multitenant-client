/**
 * Tipos base del dominio de administración.
 *
 * Reflejan los contratos de `/api/brain/core` (empresa, negocio, usuario y
 * sus asignaciones). Los campos sensibles de conexión no forman parte del
 * modelo de lectura del cliente.
 */

export interface Empresa {
  empresaId: string;
  nombre: string;
}

/** Datos editables de una empresa. El `empresaId` lo genera el backend. */
export interface EmpresaInput {
  nombre: string;
}

export interface Negocio {
  negocioId: number;
  empresaId: string;
  nombre: string;
  databaseName: string;
  databaseIp: string;
  databasePort: string;
  databaseUsername: string;
  backendIp: string;
  backendPort: string;
  tenantId: string;
}

/**
 * Datos editables de un negocio. El `negocioId` lo asigna el backend y el
 * `tenantId` se genera en el cliente con `generarTenantId`.
 *
 * `databasePassword` viaja sólo en la escritura: el backend no la devuelve en
 * las lecturas y, si se omite en una edición, conserva la existente.
 */
export interface NegocioInput {
  empresaId: string;
  nombre: string;
  tenantId: string;
  databaseName?: string | null;
  databaseIp?: string | null;
  databasePort?: string | null;
  databaseUsername?: string | null;
  databasePassword?: string | null;
  backendIp?: string | null;
  backendPort?: string | null;
}

/** Datos mínimos del negocio que viajan embebidos en una asignación. */
export interface NegocioResumen {
  negocioId: number;
  empresaId: string;
  nombre: string;
  tenantId: string;
}

export interface Usuario {
  usuarioId: string;
  login: string;
  nombre: string;
  email: string;
  activo: boolean;
  administrador?: boolean;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  passwordChangedAt?: string | null;
  mustChangePassword?: boolean | null;
  temporaryPasswordExpiresAt?: string | null;
}

/**
 * Datos para dar de alta un usuario de la plataforma.
 *
 * El `usuarioId` lo genera el backend y la `password` es obligatoria en el alta
 * (mínimo 8 caracteres).
 */
export interface UsuarioInput {
  login: string;
  nombre: string;
  email: string;
  password: string;
  activo?: boolean;
  administrador?: boolean;
}

export interface PasswordTemporal {
  temporaryPassword: string;
  expiresAt: string;
}

export interface UsuarioEmpresa {
  usuarioEmpresaId: string;
  usuarioId: string;
  empresaId: string;
  activo: boolean;
}

export interface UsuarioNegocio {
  usuarioNegocioId: string;
  usuarioId: string;
  negocioId: number;
  activo: boolean;
  negocio?: NegocioResumen;
}
