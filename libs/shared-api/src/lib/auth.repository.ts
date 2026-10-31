import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuthTokenResponse,
  CambiarPasswordRequest,
  CredencialesLogin,
  EmpresaBrain,
  UsuarioEmpresaBrain,
  UsuarioNegocioBrain,
} from './auth.model';

export interface AuthRepository {
  login(credenciales: CredencialesLogin): Observable<AuthTokenResponse>;
  refrescar(): Observable<AuthTokenResponse>;
  logout(): Observable<void>;
  cambiarPassword(usuarioId: string, datos: CambiarPasswordRequest): Observable<void>;
  cargarEmpresasDeUsuario(usuarioId: string): Observable<ReadonlyArray<UsuarioEmpresaBrain>>;
  cargarNegociosDeUsuario(
    usuarioId: string,
    empresaId: string,
  ): Observable<ReadonlyArray<UsuarioNegocioBrain>>;
  cargarEmpresa(empresaId: string): Observable<EmpresaBrain>;
}

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AUTH_REPOSITORY');
