import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, Observable } from 'rxjs';
import {
  ADMINISTRADOR_REPOSITORY,
  Empresa,
  NegocioResumen,
  Usuario,
  UsuarioEmpresa,
  UsuarioNegocio,
} from '@eterea/administrador-data-access';
import { EtEmptyStateComponent, EtIconComponent, EtPageHeaderComponent } from '@eterea/ui-layout';

interface ConfirmacionDesactivar {
  empresa: Empresa;
  negociosActivos: number;
}

@Component({
  selector: 'et-administrador-asignaciones',
  imports: [EtPageHeaderComponent, EtEmptyStateComponent, EtIconComponent],
  templateUrl: './asignaciones.html',
  styleUrl: './asignaciones.css',
})
export class AsignacionesPageComponent implements OnInit {
  private readonly repository = inject(ADMINISTRADOR_REPOSITORY);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly usuarios = signal<ReadonlyArray<Usuario>>([]);
  protected readonly empresas = signal<ReadonlyArray<Empresa>>([]);
  protected readonly usuarioSeleccionado = signal<Usuario | null>(null);

  protected readonly asignacionesEmpresa = signal<ReadonlyArray<UsuarioEmpresa>>([]);
  protected readonly asignacionesNegocio = signal<ReadonlyArray<UsuarioNegocio>>([]);
  protected readonly negociosPorEmpresa = signal<
    ReadonlyMap<string, ReadonlyArray<NegocioResumen>>
  >(new Map());
  protected readonly empresasExpandidas = signal<ReadonlySet<string>>(new Set());

  protected readonly filtroUsuarios = signal('');
  protected readonly cargandoInicial = signal(false);
  protected readonly cargandoAsignaciones = signal(false);
  protected readonly cargandoNegocios = signal<ReadonlySet<string>>(new Set());
  protected readonly guardando = signal<ReadonlySet<string>>(new Set());
  protected readonly error = signal<string | null>(null);
  protected readonly confirmacion = signal<ConfirmacionDesactivar | null>(null);

  protected readonly usuariosFiltrados = computed(() => {
    const termino = this.filtroUsuarios().trim().toLowerCase();
    if (!termino) {
      return this.usuarios();
    }
    return this.usuarios().filter((usuario) =>
      [usuario.nombre, usuario.login, usuario.email].some((valor) =>
        valor?.toLowerCase().includes(termino),
      ),
    );
  });

  protected readonly asignacionesEmpresaPorId = computed(() => {
    const mapa = new Map<string, UsuarioEmpresa>();
    for (const asignacion of this.asignacionesEmpresa()) {
      mapa.set(asignacion.empresaId, asignacion);
    }
    return mapa;
  });

  protected readonly asignacionesNegocioPorId = computed(() => {
    const mapa = new Map<number, UsuarioNegocio>();
    for (const asignacion of this.asignacionesNegocio()) {
      mapa.set(asignacion.negocioId, asignacion);
    }
    return mapa;
  });

  protected readonly empresasAsignadas = computed(
    () => this.asignacionesEmpresa().filter((asignacion) => asignacion.activo).length,
  );
  protected readonly negociosAsignados = computed(
    () => this.asignacionesNegocio().filter((asignacion) => asignacion.activo).length,
  );

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('usuarioId');
      if (!id) {
        return;
      }
      const usuario = this.usuarios().find((actual) => actual.usuarioId === id);
      if (usuario && this.usuarioSeleccionado()?.usuarioId !== id) {
        this.seleccionarUsuario(usuario, false);
      }
    });
    this.cargarInicial();
  }

  protected recargar(): void {
    this.negociosPorEmpresa.set(new Map());
    this.empresasExpandidas.set(new Set());
    this.cargarInicial(this.usuarioSeleccionado()?.usuarioId ?? '');
  }

  protected actualizarFiltro(event: Event): void {
    this.filtroUsuarios.set((event.target as HTMLInputElement).value);
  }

  protected seleccionarUsuario(usuario: Usuario, navegar = true): void {
    if (this.usuarioSeleccionado()?.usuarioId === usuario.usuarioId) {
      return;
    }
    this.usuarioSeleccionado.set(usuario);
    this.negociosPorEmpresa.set(new Map());
    this.empresasExpandidas.set(new Set());
    this.confirmacion.set(null);
    this.error.set(null);
    this.cargarAsignaciones(usuario.usuarioId);
    if (navegar) {
      void this.router.navigate(['/asignaciones', usuario.usuarioId], { replaceUrl: true });
    }
  }

  protected empresaAsignada(empresaId: string): boolean {
    return this.asignacionesEmpresaPorId().get(empresaId)?.activo === true;
  }

  protected empresaConAsignacion(empresaId: string): boolean {
    return this.asignacionesEmpresaPorId().has(empresaId);
  }

  protected negocioAsignado(negocioId: number): boolean {
    return this.asignacionesNegocioPorId().get(negocioId)?.activo === true;
  }

  protected negocioConAsignacion(negocioId: number): boolean {
    return this.asignacionesNegocioPorId().has(negocioId);
  }

  protected estaExpandida(empresaId: string): boolean {
    return this.empresasExpandidas().has(empresaId);
  }

  protected negociosDe(empresaId: string): ReadonlyArray<NegocioResumen> {
    return this.negociosPorEmpresa().get(empresaId) ?? [];
  }

  protected cargandoNegociosDe(empresaId: string): boolean {
    return this.cargandoNegocios().has(empresaId);
  }

  protected estaGuardando(clave: string): boolean {
    return this.guardando().has(clave);
  }

  protected claveEmpresa(empresaId: string): string {
    return `empresa:${empresaId}`;
  }

  protected claveNegocio(negocioId: number): string {
    return `negocio:${negocioId}`;
  }

  protected iniciales(usuario: Usuario): string {
    const partes = (usuario.nombre || usuario.login).trim().split(/\s+/).filter(Boolean);
    const primera = partes[0]?.charAt(0) ?? '';
    const segunda = partes[1]?.charAt(0) ?? '';
    return `${primera}${segunda}`.toUpperCase() || 'US';
  }

  protected expandirEmpresa(empresa: Empresa, forzar = false): void {
    if (!this.empresaAsignada(empresa.empresaId)) {
      return;
    }
    const expandidas = new Set(this.empresasExpandidas());
    if (!forzar && expandidas.has(empresa.empresaId)) {
      expandidas.delete(empresa.empresaId);
      this.empresasExpandidas.set(expandidas);
      return;
    }
    expandidas.add(empresa.empresaId);
    this.empresasExpandidas.set(expandidas);
    if (!this.negociosPorEmpresa().has(empresa.empresaId)) {
      this.cargarNegocios(empresa.empresaId);
    }
  }

  protected toggleEmpresa(empresa: Empresa): void {
    const usuario = this.usuarioSeleccionado();
    if (!usuario) {
      return;
    }
    const clave = this.claveEmpresa(empresa.empresaId);
    if (this.estaGuardando(clave)) {
      return;
    }

    const asignacion = this.asignacionesEmpresaPorId().get(empresa.empresaId);
    if (!asignacion) {
      this.ejecutar(
        this.repository.asignarEmpresa(usuario.usuarioId, empresa.empresaId),
        clave,
        () => this.cargarAsignaciones(usuario.usuarioId, empresa.empresaId),
      );
      return;
    }

    if (!asignacion.activo) {
      this.ejecutar(this.repository.activarEmpresa(asignacion.usuarioEmpresaId), clave, () =>
        this.cargarAsignaciones(usuario.usuarioId, empresa.empresaId),
      );
      return;
    }

    const negociosActivos = this.negociosActivosDeEmpresa(empresa.empresaId);
    if (negociosActivos > 0) {
      this.confirmacion.set({ empresa, negociosActivos });
      return;
    }
    this.desactivarEmpresa(empresa, asignacion);
  }

  protected confirmarDesactivarEmpresa(): void {
    const confirmacion = this.confirmacion();
    if (!confirmacion) {
      return;
    }
    const asignacion = this.asignacionesEmpresaPorId().get(confirmacion.empresa.empresaId);
    this.confirmacion.set(null);
    if (asignacion) {
      this.desactivarEmpresa(confirmacion.empresa, asignacion);
    }
  }

  protected cancelarDesactivarEmpresa(): void {
    this.confirmacion.set(null);
  }

  protected toggleNegocio(empresa: Empresa, negocio: NegocioResumen): void {
    const usuario = this.usuarioSeleccionado();
    if (!usuario || !this.empresaAsignada(empresa.empresaId)) {
      return;
    }
    const clave = this.claveNegocio(negocio.negocioId);
    if (this.estaGuardando(clave)) {
      return;
    }

    const asignacion = this.asignacionesNegocioPorId().get(negocio.negocioId);
    if (!asignacion) {
      this.ejecutar(
        this.repository.asignarNegocio(usuario.usuarioId, negocio.negocioId),
        clave,
        () => this.cargarAsignaciones(usuario.usuarioId),
      );
      return;
    }

    const accion = asignacion.activo
      ? this.repository.desactivarNegocio(asignacion.usuarioNegocioId)
      : this.repository.activarNegocio(asignacion.usuarioNegocioId);
    this.ejecutar(accion, clave, () => this.cargarAsignaciones(usuario.usuarioId));
  }

  protected negociosActivosDeEmpresa(empresaId: string): number {
    return this.asignacionesNegocio().filter(
      (asignacion) => asignacion.activo && asignacion.negocio?.empresaId === empresaId,
    ).length;
  }

  private cargarInicial(usuarioIdPreseleccionado?: string | null): void {
    this.cargandoInicial.set(true);
    this.error.set(null);

    forkJoin({
      usuarios: this.repository.cargarUsuarios(),
      empresas: this.repository.cargarEmpresas(),
    })
      .pipe(finalize(() => this.cargandoInicial.set(false)))
      .subscribe({
        next: ({ usuarios, empresas }) => {
          this.usuarios.set(usuarios);
          this.empresas.set(empresas);

          const id = usuarioIdPreseleccionado ?? this.route.snapshot.paramMap.get('usuarioId');
          const usuario = id ? usuarios.find((actual) => actual.usuarioId === id) : undefined;
          if (!usuario) {
            if (usuarioIdPreseleccionado) {
              this.usuarioSeleccionado.set(null);
              this.asignacionesEmpresa.set([]);
              this.asignacionesNegocio.set([]);
            }
            return;
          }
          if (this.usuarioSeleccionado()?.usuarioId === usuario.usuarioId) {
            this.usuarioSeleccionado.set(usuario);
            this.cargarAsignaciones(usuario.usuarioId);
          } else {
            this.seleccionarUsuario(usuario, false);
          }
        },
        error: (error: unknown) => this.error.set(this.mensajeError(error)),
      });
  }

  private cargarAsignaciones(usuarioId: string, expandirEmpresaId?: string): void {
    this.cargandoAsignaciones.set(true);
    this.error.set(null);

    forkJoin({
      empresas: this.repository.cargarEmpresasDeUsuario(usuarioId),
      negocios: this.repository.cargarNegociosDeUsuario(usuarioId),
    })
      .pipe(finalize(() => this.cargandoAsignaciones.set(false)))
      .subscribe({
        next: ({ empresas, negocios }) => {
          this.asignacionesEmpresa.set(empresas);
          this.asignacionesNegocio.set(negocios);

          if (!expandirEmpresaId) {
            return;
          }
          const empresa = this.empresas().find((actual) => actual.empresaId === expandirEmpresaId);
          const asignada = empresas.some(
            (actual) => actual.empresaId === expandirEmpresaId && actual.activo,
          );
          if (empresa && asignada) {
            this.expandirEmpresa(empresa, true);
          }
        },
        error: (error: unknown) => this.error.set(this.mensajeError(error)),
      });
  }

  private cargarNegocios(empresaId: string): void {
    this.marcarCargandoNegocios(empresaId, true);
    this.repository
      .cargarNegociosDeEmpresa(empresaId)
      .pipe(finalize(() => this.marcarCargandoNegocios(empresaId, false)))
      .subscribe({
        next: (negocios) => {
          const mapa = new Map(this.negociosPorEmpresa());
          mapa.set(empresaId, negocios);
          this.negociosPorEmpresa.set(mapa);
        },
        error: (error: unknown) => this.error.set(this.mensajeError(error)),
      });
  }

  private desactivarEmpresa(empresa: Empresa, asignacion: UsuarioEmpresa): void {
    const usuario = this.usuarioSeleccionado();
    if (!usuario) {
      return;
    }
    this.ejecutar(
      this.repository.desactivarEmpresa(asignacion.usuarioEmpresaId),
      this.claveEmpresa(empresa.empresaId),
      () => {
        const expandidas = new Set(this.empresasExpandidas());
        expandidas.delete(empresa.empresaId);
        this.empresasExpandidas.set(expandidas);
        this.cargarAsignaciones(usuario.usuarioId);
      },
    );
  }

  private ejecutar(accion: Observable<unknown>, clave: string, alTerminar?: () => void): void {
    this.error.set(null);
    this.marcarGuardando(clave, true);
    accion.pipe(finalize(() => this.marcarGuardando(clave, false))).subscribe({
      next: () => alTerminar?.(),
      error: (error: unknown) => this.error.set(this.mensajeError(error)),
    });
  }

  private marcarGuardando(clave: string, valor: boolean): void {
    const claves = new Set(this.guardando());
    if (valor) {
      claves.add(clave);
    } else {
      claves.delete(clave);
    }
    this.guardando.set(claves);
  }

  private marcarCargandoNegocios(empresaId: string, valor: boolean): void {
    const empresas = new Set(this.cargandoNegocios());
    if (valor) {
      empresas.add(empresaId);
    } else {
      empresas.delete(empresaId);
    }
    this.cargandoNegocios.set(empresas);
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return 'No tenés permisos para administrar asignaciones.';
      }
      if (error.status === 404) {
        return 'El usuario, la empresa o el negocio ya no existe. Actualizá los datos.';
      }
      if (error.status === 409) {
        return 'No se pudo completar: la asignación ya existe o falta asignar la empresa.';
      }
      if (error.status === 0) {
        return 'No pudimos conectar con el servidor.';
      }
    }
    return 'No pudimos completar la operación. Intentá nuevamente.';
  }
}
