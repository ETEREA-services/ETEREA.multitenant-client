/** Contratos de autenticación y contexto de empresas contra `/api/brain`. */

export type AppModulo = 'contable' | 'administrador';

export interface CredencialesLogin {
  login: string;
  password: string;
  app: AppModulo;
}

export interface CambiarPasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UsuarioSesion {
  usuarioId: string;
  login: string;
  nombre: string;
  email?: string | null;
  activo: boolean;
  administrador: boolean;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  failedLoginAttempts?: number | null;
  lockedUntil?: string | null;
  passwordChangedAt?: string | null;
  mustChangePassword?: boolean | null;
  temporaryPasswordExpiresAt?: string | null;
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  usuario: UsuarioSesion;
}

export interface EmpresaBrain {
  empresaId: string;
  nombre: string;
}

export interface NegocioBrain {
  negocioId: number;
  empresaId: string;
  nombre: string;
  tenantId: string;
}

export interface UsuarioEmpresaBrain {
  usuarioEmpresaId: string;
  usuarioId: string;
  empresaId: string;
  activo: boolean;
}

export interface UsuarioNegocioBrain {
  usuarioNegocioId: string;
  usuarioId: string;
  negocioId: number;
  activo: boolean;
  negocio?: NegocioBrain | null;
}
