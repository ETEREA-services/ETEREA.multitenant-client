import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '@eterea/shared-api';
import { AdministradorRepository } from './administrador.repository';
import {
  Empresa,
  EmpresaInput,
  Negocio,
  NegocioInput,
  NegocioResumen,
  PasswordTemporal,
  Usuario,
  UsuarioEmpresa,
  UsuarioInput,
  UsuarioNegocio,
} from './models';

/** Implementación HTTP del módulo administrador contra `/api/brain/core`. */
@Injectable()
export class AdministradorHttpRepository implements AdministradorRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  cargarEmpresas(): Observable<ReadonlyArray<Empresa>> {
    return this.http.get<ReadonlyArray<Empresa>>(`${this.apiUrl}/empresa`);
  }

  crearEmpresa(empresa: EmpresaInput): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.apiUrl}/empresa`, empresa);
  }

  actualizarEmpresa(empresaId: string, empresa: EmpresaInput): Observable<Empresa> {
    return this.http.put<Empresa>(
      `${this.apiUrl}/empresa/${encodeURIComponent(empresaId)}`,
      empresa,
    );
  }

  cargarNegocios(): Observable<ReadonlyArray<Negocio>> {
    return this.http.get<ReadonlyArray<Negocio>>(`${this.apiUrl}/negocio`);
  }

  cargarNegociosDeEmpresa(empresaId: string): Observable<ReadonlyArray<NegocioResumen>> {
    return this.http.get<ReadonlyArray<NegocioResumen>>(
      `${this.apiUrl}/negocio/empresa/${encodeURIComponent(empresaId)}`,
    );
  }

  crearNegocio(negocio: NegocioInput): Observable<Negocio> {
    return this.http.post<Negocio>(`${this.apiUrl}/negocio`, negocio);
  }

  actualizarNegocio(negocioId: number, negocio: NegocioInput): Observable<Negocio> {
    return this.http.put<Negocio>(
      `${this.apiUrl}/negocio/${encodeURIComponent(String(negocioId))}`,
      negocio,
    );
  }

  cargarUsuarios(): Observable<ReadonlyArray<Usuario>> {
    return this.http.get<ReadonlyArray<Usuario>>(`${this.apiUrl}/usuario`);
  }

  crearUsuario(usuario: UsuarioInput): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/usuario`, usuario);
  }

  blanquearPassword(usuarioId: string): Observable<PasswordTemporal> {
    return this.http.post<PasswordTemporal>(
      `${this.apiUrl}/usuario/${encodeURIComponent(usuarioId)}/password-reset`,
      {},
    );
  }

  cargarEmpresasDeUsuario(usuarioId: string): Observable<ReadonlyArray<UsuarioEmpresa>> {
    return this.http.get<ReadonlyArray<UsuarioEmpresa>>(
      `${this.apiUrl}/usuario-empresa/usuario/${encodeURIComponent(usuarioId)}`,
    );
  }

  cargarNegociosDeUsuario(usuarioId: string): Observable<ReadonlyArray<UsuarioNegocio>> {
    return this.http.get<ReadonlyArray<UsuarioNegocio>>(
      `${this.apiUrl}/usuario-negocio/usuario/${encodeURIComponent(usuarioId)}`,
    );
  }

  asignarEmpresa(usuarioId: string, empresaId: string): Observable<UsuarioEmpresa> {
    return this.http.post<UsuarioEmpresa>(`${this.apiUrl}/usuario-empresa`, {
      usuarioId,
      empresaId,
    });
  }

  activarEmpresa(usuarioEmpresaId: string): Observable<UsuarioEmpresa> {
    return this.http.put<UsuarioEmpresa>(
      `${this.apiUrl}/usuario-empresa/${encodeURIComponent(usuarioEmpresaId)}/activate`,
      {},
    );
  }

  desactivarEmpresa(usuarioEmpresaId: string): Observable<UsuarioEmpresa> {
    return this.http.put<UsuarioEmpresa>(
      `${this.apiUrl}/usuario-empresa/${encodeURIComponent(usuarioEmpresaId)}/deactivate`,
      {},
    );
  }

  asignarNegocio(usuarioId: string, negocioId: number): Observable<UsuarioNegocio> {
    return this.http.post<UsuarioNegocio>(`${this.apiUrl}/usuario-negocio`, {
      usuarioId,
      negocioId,
    });
  }

  activarNegocio(usuarioNegocioId: string): Observable<UsuarioNegocio> {
    return this.http.put<UsuarioNegocio>(
      `${this.apiUrl}/usuario-negocio/${encodeURIComponent(usuarioNegocioId)}/activate`,
      {},
    );
  }

  desactivarNegocio(usuarioNegocioId: string): Observable<UsuarioNegocio> {
    return this.http.put<UsuarioNegocio>(
      `${this.apiUrl}/usuario-negocio/${encodeURIComponent(usuarioNegocioId)}/deactivate`,
      {},
    );
  }
}
