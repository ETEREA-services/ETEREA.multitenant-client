import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  finalize,
  forkJoin,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import {
  AuthTokenResponse,
  CambiarPasswordRequest,
  CredencialesLogin,
  NegocioBrain,
  UsuarioNegocioBrain,
  UsuarioSesion,
} from './auth.model';
import { AUTH_REPOSITORY } from './auth.repository';
import { EmpresaContexto, NegocioContexto } from './contexto.model';
import { ContextoStore } from './contexto.store';
import { iniciales } from './format';
import { SESSION_CONFIG } from './session.config';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly repository = inject(AUTH_REPOSITORY);
  private readonly config = inject(SESSION_CONFIG);
  private readonly contextoStore = inject(ContextoStore);

  private readonly _usuario = signal<UsuarioSesion | null>(null);
  private readonly _accessToken = signal<string | null>(null);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _restaurado = signal(false);
  private refreshInFlight: Observable<boolean> | null = null;
  private sessionVersion = 0;

  readonly usuario = this._usuario.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  readonly autenticado = computed(() => this._usuario() !== null && this._accessToken() !== null);
  readonly usuarioId = computed(() => this._usuario()?.usuarioId ?? null);
  readonly esAdministrador = computed(() => this._usuario()?.administrador === true);
  readonly passwordChangeRequired = computed(() => this._usuario()?.mustChangePassword === true);
  readonly nombreVisible = computed(() => {
    const usuario = this._usuario();
    return usuario?.nombre?.trim() || usuario?.login || 'Sin sesión';
  });
  readonly rolVisible = computed(() => (this.esAdministrador() ? 'Administrador' : 'Usuario'));
  readonly iniciales = computed(() => iniciales(this.nombreVisible()));

  login(credenciales: CredencialesLogin): Observable<UsuarioSesion> {
    this._cargando.set(true);
    this._error.set(null);
    const version = ++this.sessionVersion;

    return this.repository.login(credenciales).pipe(
      switchMap((respuesta) => {
        if (version !== this.sessionVersion) {
          return throwError(() => new Error('La sesión cambió mientras se iniciaba.'));
        }
        if (this.config.requiresAdmin && !respuesta.usuario.administrador) {
          return throwError(() => new Error('No tenés permisos de administración.'));
        }

        this.aplicarRespuesta(respuesta);
        this._restaurado.set(true);

        return this.config.usesTenants
          ? this.cargarContexto(respuesta.usuario.usuarioId, version).pipe(
              map(() => respuesta.usuario),
            )
          : of(respuesta.usuario);
      }),
      catchError((error: unknown) => {
        this._error.set(this.mensajeError(error));
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false)),
    );
  }

  refrescar(): Observable<boolean> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const version = this.sessionVersion;
    this.refreshInFlight = this.repository.refrescar().pipe(
      tap((respuesta) => {
        if (version === this.sessionVersion) {
          this.aplicarRespuesta(respuesta);
        }
      }),
      switchMap((respuesta) => {
        if (version !== this.sessionVersion) {
          return of(false);
        }
        if (this.config.requiresAdmin && !respuesta.usuario.administrador) {
          this.limpiar();
          return of(false);
        }
        return this.config.usesTenants
          ? this.cargarContexto(respuesta.usuario.usuarioId, version).pipe(map(() => true))
          : of(true);
      }),
      catchError(() => {
        this.limpiar();
        return of(false);
      }),
      finalize(() => {
        this.refreshInFlight = null;
        this._restaurado.set(true);
      }),
      shareReplay(1),
    );

    return this.refreshInFlight;
  }

  asegurarSesion(): Observable<boolean> {
    if (this.autenticado()) {
      return of(true);
    }
    if (this._restaurado()) {
      return of(false);
    }
    return this.refrescar();
  }

  logout(): void {
    this.repository.logout().subscribe({ error: () => undefined });
    this.limpiar();
  }

  cambiarPassword(datos: CambiarPasswordRequest): Observable<void> {
    const usuarioId = this._usuario()?.usuarioId;
    if (!usuarioId) {
      return throwError(() => new Error('No hay una sesión activa.'));
    }

    return this.repository.cambiarPassword(usuarioId, datos).pipe(tap(() => this.logout()));
  }

  rutaPostLogin(): string {
    if (this.passwordChangeRequired()) {
      return '/cambiar-password';
    }
    if (!this.config.usesTenants) {
      return this.config.homePath;
    }
    return this.contextoStore.hayContexto()
      ? this.config.homePath
      : (this.config.tenantPickerPath ?? '/empresas');
  }

  limpiar(): void {
    this.sessionVersion++;
    this._usuario.set(null);
    this._accessToken.set(null);
    this._error.set(null);
    this._restaurado.set(true);
    if (this.config.usesTenants) {
      this.contextoStore.limpiar();
    }
  }

  private aplicarRespuesta(respuesta: AuthTokenResponse): void {
    this._accessToken.set(respuesta.accessToken);
    this._usuario.set(respuesta.usuario);
  }

  private cargarContexto(
    usuarioId: string,
    version: number,
  ): Observable<ReadonlyArray<EmpresaContexto>> {
    return this.repository.cargarEmpresasDeUsuario(usuarioId).pipe(
      switchMap((asignaciones) => {
        const activas = [
          ...new Map(
            asignaciones
              .filter((asignacion) => asignacion.activo)
              .map((asignacion) => [asignacion.empresaId, asignacion]),
          ).values(),
        ];

        if (activas.length === 0) {
          if (version === this.sessionVersion) {
            this.contextoStore.registrarContexto([]);
          }
          return of([] as ReadonlyArray<EmpresaContexto>);
        }

        const peticiones = activas.map((asignacion) =>
          forkJoin({
            empresa: this.repository
              .cargarEmpresa(asignacion.empresaId)
              .pipe(catchError(() => of(null))),
            negocios: this.repository
              .cargarNegociosDeUsuario(usuarioId, asignacion.empresaId)
              .pipe(catchError(() => of([] as ReadonlyArray<UsuarioNegocioBrain>))),
          }),
        );

        return forkJoin(peticiones).pipe(
          map((resultados) => {
            if (version !== this.sessionVersion) {
              return [] as ReadonlyArray<EmpresaContexto>;
            }
            const empresas = resultados.flatMap(({ empresa, negocios }) => {
              if (!empresa) {
                return [];
              }
              const activos = negocios.flatMap((asignacion) => {
                if (!asignacion.activo || !asignacion.negocio) {
                  return [];
                }
                return [this.aNegocio(empresa.empresaId, asignacion.negocio)];
              });
              return [
                {
                  empresaId: empresa.empresaId,
                  nombre: empresa.nombre,
                  negocios: activos,
                } satisfies EmpresaContexto,
              ];
            });
            this.contextoStore.registrarContexto(empresas);
            return empresas;
          }),
        );
      }),
      catchError(() => {
        if (version === this.sessionVersion) {
          this.contextoStore.registrarContexto([]);
        }
        return of([] as ReadonlyArray<EmpresaContexto>);
      }),
    );
  }

  private aNegocio(empresaId: string, negocio: NegocioBrain): NegocioContexto {
    return {
      negocioId: negocio.negocioId,
      empresaId,
      nombre: negocio.nombre,
      tenantId: negocio.tenantId,
    };
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return 'Usuario o contraseña incorrectos.';
      }
      if (error.status === 428) {
        return 'La contraseña temporal venció. Pedí a un administrador que la blanquee nuevamente.';
      }
      if (error.status === 403) {
        return 'No tenés permisos para este módulo.';
      }
      if (error.status === 0) {
        return 'No pudimos conectar con el servidor.';
      }
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'No pudimos iniciar sesión. Intentá nuevamente.';
  }
}
