import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuthTokenResponse,
  CambiarPasswordRequest,
  CredencialesLogin,
  EmpresaBrain,
  UsuarioEmpresaBrain,
  UsuarioNegocioBrain,
} from './auth.model';
import { SKIP_AUTH_REFRESH } from './auth.interceptor';
import { AuthRepository } from './auth.repository';
import { SESSION_CONFIG } from './session.config';

@Injectable()
export class AuthHttpRepository implements AuthRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(SESSION_CONFIG);

  login(credenciales: CredencialesLogin): Observable<AuthTokenResponse> {
    return this.http.post<AuthTokenResponse>(`${this.config.authApiUrl}/auth/login`, credenciales, {
      withCredentials: true,
    });
  }

  refrescar(): Observable<AuthTokenResponse> {
    return this.http.post<AuthTokenResponse>(
      `${this.config.authApiUrl}/auth/refresh`,
      {},
      { withCredentials: true },
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.config.authApiUrl}/auth/logout`,
      {},
      { withCredentials: true },
    );
  }

  cambiarPassword(usuarioId: string, datos: CambiarPasswordRequest): Observable<void> {
    return this.http.put<void>(
      `${this.config.authApiUrl}/core/usuario/${encodeURIComponent(usuarioId)}/password`,
      datos,
      { context: new HttpContext().set(SKIP_AUTH_REFRESH, true) },
    );
  }

  cargarEmpresasDeUsuario(usuarioId: string): Observable<ReadonlyArray<UsuarioEmpresaBrain>> {
    return this.http.get<ReadonlyArray<UsuarioEmpresaBrain>>(
      `${this.config.authApiUrl}/core/usuario-empresa/usuario/${encodeURIComponent(usuarioId)}`,
    );
  }

  cargarNegociosDeUsuario(
    usuarioId: string,
    empresaId: string,
  ): Observable<ReadonlyArray<UsuarioNegocioBrain>> {
    return this.http.get<ReadonlyArray<UsuarioNegocioBrain>>(
      `${this.config.authApiUrl}/core/usuario-negocio/usuario/${encodeURIComponent(
        usuarioId,
      )}/empresa/${encodeURIComponent(empresaId)}`,
    );
  }

  cargarEmpresa(empresaId: string): Observable<EmpresaBrain> {
    return this.http.get<EmpresaBrain>(
      `${this.config.authApiUrl}/core/empresa/${encodeURIComponent(empresaId)}`,
    );
  }
}
