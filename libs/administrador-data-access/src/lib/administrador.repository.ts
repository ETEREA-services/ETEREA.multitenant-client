import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
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

/**
 * Contrato de acceso a datos del módulo administrador.
 *
 * Las páginas dependen de este contrato para poder testearse con dobles.
 */
export interface AdministradorRepository {
  cargarEmpresas(): Observable<ReadonlyArray<Empresa>>;
  crearEmpresa(empresa: EmpresaInput): Observable<Empresa>;
  actualizarEmpresa(empresaId: string, empresa: EmpresaInput): Observable<Empresa>;

  cargarNegocios(): Observable<ReadonlyArray<Negocio>>;
  cargarNegociosDeEmpresa(empresaId: string): Observable<ReadonlyArray<NegocioResumen>>;
  crearNegocio(negocio: NegocioInput): Observable<Negocio>;
  actualizarNegocio(negocioId: number, negocio: NegocioInput): Observable<Negocio>;

  cargarUsuarios(): Observable<ReadonlyArray<Usuario>>;
  crearUsuario(usuario: UsuarioInput): Observable<Usuario>;
  blanquearPassword(usuarioId: string): Observable<PasswordTemporal>;

  cargarEmpresasDeUsuario(usuarioId: string): Observable<ReadonlyArray<UsuarioEmpresa>>;
  cargarNegociosDeUsuario(usuarioId: string): Observable<ReadonlyArray<UsuarioNegocio>>;

  asignarEmpresa(usuarioId: string, empresaId: string): Observable<UsuarioEmpresa>;
  activarEmpresa(usuarioEmpresaId: string): Observable<UsuarioEmpresa>;
  desactivarEmpresa(usuarioEmpresaId: string): Observable<UsuarioEmpresa>;

  asignarNegocio(usuarioId: string, negocioId: number): Observable<UsuarioNegocio>;
  activarNegocio(usuarioNegocioId: string): Observable<UsuarioNegocio>;
  desactivarNegocio(usuarioNegocioId: string): Observable<UsuarioNegocio>;
}

export const ADMINISTRADOR_REPOSITORY = new InjectionToken<AdministradorRepository>(
  'ADMINISTRADOR_REPOSITORY',
);
