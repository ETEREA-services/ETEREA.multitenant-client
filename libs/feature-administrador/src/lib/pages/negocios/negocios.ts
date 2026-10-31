import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import {
  ADMINISTRADOR_REPOSITORY,
  Empresa,
  Negocio,
  NegocioInput,
  generarTenantId,
  sufijoTenantId,
} from '@eterea/administrador-data-access';
import { EtEmptyStateComponent, EtIconComponent, EtPageHeaderComponent } from '@eterea/ui-layout';

type ModoDialogo = 'crear' | 'editar';

interface DialogoNegocio {
  modo: ModoDialogo;
  negocio: Negocio | null;
}

interface FormularioNegocio {
  empresaId: string;
  nombre: string;
  databaseName: string;
  databaseIp: string;
  databasePort: string;
  databaseUsername: string;
  databasePassword: string;
  backendIp: string;
  backendPort: string;
}

const FORMULARIO_VACIO: FormularioNegocio = {
  empresaId: '',
  nombre: '',
  databaseName: '',
  databaseIp: '',
  databasePort: '',
  databaseUsername: '',
  databasePassword: '',
  backendIp: '',
  backendPort: '',
};

@Component({
  selector: 'et-administrador-negocios',
  imports: [FormsModule, RouterLink, EtPageHeaderComponent, EtEmptyStateComponent, EtIconComponent],
  templateUrl: './negocios.html',
  styleUrl: './negocios.css',
})
export class NegociosPageComponent implements OnInit {
  private readonly repository = inject(ADMINISTRADOR_REPOSITORY);

  protected readonly negocios = signal<ReadonlyArray<Negocio>>([]);
  protected readonly empresas = signal<ReadonlyArray<Empresa>>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly filtro = signal('');
  protected readonly empresaSeleccionada = signal('');
  protected readonly copiado = signal<number | null>(null);

  protected readonly dialogo = signal<DialogoNegocio | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorDialogo = signal<string | null>(null);
  protected formulario: FormularioNegocio = { ...FORMULARIO_VACIO };

  private readonly sufijo = signal(sufijoTenantId());
  private fechaAlta = new Date();
  private readonly tenantIdFijo = signal<string | null>(null);

  protected readonly empresasPorId = computed(() => {
    const mapa = new Map<string, Empresa>();
    for (const empresa of this.empresas()) {
      mapa.set(empresa.empresaId, empresa);
    }
    return mapa;
  });

  protected readonly empresaSeleccionadaNombre = computed(
    () => this.empresasPorId().get(this.empresaSeleccionada())?.nombre ?? '',
  );

  protected readonly negociosDeEmpresa = computed(() => {
    const empresaId = this.empresaSeleccionada();
    if (!empresaId) {
      return [];
    }
    return this.negocios().filter((negocio) => negocio.empresaId === empresaId);
  });

  protected readonly negociosFiltrados = computed(() => {
    const termino = this.filtro().trim().toLowerCase();
    const lista = this.negociosDeEmpresa();
    if (!termino) {
      return lista;
    }
    return lista.filter((negocio) =>
      [
        negocio.nombre,
        negocio.tenantId,
        negocio.databaseName,
        this.empresaNombre(negocio.empresaId),
      ].some((valor) => valor?.toLowerCase().includes(termino)),
    );
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    forkJoin({
      empresas: this.repository.cargarEmpresas(),
      negocios: this.repository.cargarNegocios(),
    })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: ({ empresas, negocios }) => {
          const ordenadas = this.ordenarEmpresas(empresas);
          this.empresas.set(ordenadas);
          this.negocios.set(this.ordenarNegocios(negocios));
          const seleccionada = this.empresaSeleccionada();
          if (!ordenadas.some((empresa) => empresa.empresaId === seleccionada)) {
            this.empresaSeleccionada.set(ordenadas.length === 1 ? ordenadas[0]!.empresaId : '');
          }
        },
        error: (error: unknown) => this.error.set(this.mensajeError(error)),
      });
  }

  protected actualizarFiltro(termino: string): void {
    this.filtro.set(termino);
  }

  protected seleccionarEmpresa(empresaId: string): void {
    if (this.guardando()) {
      return;
    }
    this.empresaSeleccionada.set(empresaId);
    this.filtro.set('');
    this.copiado.set(null);
    this.dialogo.set(null);
    this.errorDialogo.set(null);
  }

  protected empresaNombre(empresaId: string): string {
    return this.empresasPorId().get(empresaId)?.nombre ?? 'Empresa desconocida';
  }

  protected conexion(negocio: Negocio): string {
    const partes = [negocio.databaseIp, negocio.databasePort].filter(Boolean);
    return partes.length > 0 ? partes.join(':') : '—';
  }

  protected backend(negocio: Negocio): string {
    const partes = [negocio.backendIp, negocio.backendPort].filter(Boolean);
    return partes.length > 0 ? partes.join(':') : '—';
  }

  protected esPuertoValido(valor: string): boolean {
    return !valor || /^[0-9]{1,5}$/.test(valor);
  }

  protected copiarTenant(negocio: Negocio): void {
    this.copiado.set(null);
    void navigator.clipboard
      .writeText(negocio.tenantId)
      .then(() => this.copiado.set(negocio.negocioId))
      .catch(() => this.copiado.set(null));
  }

  protected abrirAlta(): void {
    const empresaId = this.empresaSeleccionada();
    if (!empresaId) {
      return;
    }
    this.formulario = { ...FORMULARIO_VACIO, empresaId };
    this.sufijo.set(sufijoTenantId());
    this.fechaAlta = new Date();
    this.tenantIdFijo.set(null);
    this.errorDialogo.set(null);
    this.dialogo.set({ modo: 'crear', negocio: null });
  }

  protected abrirEdicion(negocio: Negocio): void {
    this.formulario = {
      empresaId: negocio.empresaId,
      nombre: negocio.nombre,
      databaseName: negocio.databaseName ?? '',
      databaseIp: negocio.databaseIp ?? '',
      databasePort: negocio.databasePort ?? '',
      databaseUsername: negocio.databaseUsername ?? '',
      databasePassword: '',
      backendIp: negocio.backendIp ?? '',
      backendPort: negocio.backendPort ?? '',
    };
    this.tenantIdFijo.set(negocio.tenantId);
    this.errorDialogo.set(null);
    this.dialogo.set({ modo: 'editar', negocio });
  }

  protected cerrar(): void {
    if (this.guardando()) {
      return;
    }
    this.dialogo.set(null);
    this.errorDialogo.set(null);
  }

  protected regenerarTenantId(): void {
    this.sufijo.set(sufijoTenantId());
    this.errorDialogo.set(null);
  }

  /** Vista previa del tenantId: fijo al editar, generado al crear. */
  protected tenantIdVistaPrevia(): string {
    const fijo = this.tenantIdFijo();
    if (fijo) {
      return fijo;
    }
    const empresa = this.empresasPorId().get(this.formulario.empresaId);
    return generarTenantId(empresa?.nombre ?? '', this.fechaAlta, this.sufijo());
  }

  protected guardar(): void {
    const dialogo = this.dialogo();
    if (!dialogo || this.guardando()) {
      return;
    }

    const validacion = this.validar();
    if (validacion) {
      this.errorDialogo.set(validacion);
      return;
    }

    this.guardando.set(true);
    this.errorDialogo.set(null);

    const payload: NegocioInput = {
      empresaId: this.formulario.empresaId,
      nombre: this.formulario.nombre.trim(),
      tenantId: dialogo.modo === 'crear' ? this.tenantIdUnico() : this.tenantIdVistaPrevia(),
      databaseName: this.limpiar(this.formulario.databaseName),
      databaseIp: this.limpiar(this.formulario.databaseIp),
      databasePort: this.limpiar(this.formulario.databasePort),
      databaseUsername: this.limpiar(this.formulario.databaseUsername),
      databasePassword: this.limpiar(this.formulario.databasePassword),
      backendIp: this.limpiar(this.formulario.backendIp),
      backendPort: this.limpiar(this.formulario.backendPort),
    };

    const peticion =
      dialogo.modo === 'editar' && dialogo.negocio
        ? this.repository.actualizarNegocio(dialogo.negocio.negocioId, payload)
        : this.repository.crearNegocio(payload);

    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: (negocio) => {
        this.negocios.update((lista) =>
          this.ordenarNegocios(
            dialogo.modo === 'editar'
              ? lista.map((actual) => (actual.negocioId === negocio.negocioId ? negocio : actual))
              : [...lista, negocio],
          ),
        );
        this.dialogo.set(null);
      },
      error: (error: unknown) => this.errorDialogo.set(this.mensajeError(error)),
    });
  }

  private validar(): string | null {
    if (!this.formulario.empresaId) {
      return 'Seleccioná la empresa del negocio.';
    }
    if (!this.formulario.nombre.trim()) {
      return 'Ingresá el nombre del negocio.';
    }
    if (!this.esPuertoValido(this.formulario.databasePort)) {
      return 'El puerto de la base de datos debe ser numérico.';
    }
    if (!this.esPuertoValido(this.formulario.backendPort)) {
      return 'El puerto del backend debe ser numérico.';
    }
    if (!this.tenantIdVistaPrevia()) {
      return 'No se pudo generar el TenantID.';
    }
    return null;
  }

  /** Regenera el sufijo si el tenantId ya existe en otro negocio. */
  private tenantIdUnico(): string {
    const usados = new Set(this.negocios().map((negocio) => negocio.tenantId));
    let tenantId = this.tenantIdVistaPrevia();
    for (let intento = 0; intento < 5 && usados.has(tenantId); intento++) {
      this.sufijo.set(sufijoTenantId());
      tenantId = this.tenantIdVistaPrevia();
    }
    return tenantId;
  }

  private limpiar(valor: string): string | null {
    const limpio = valor.trim();
    return limpio ? limpio : null;
  }

  private ordenarEmpresas(empresas: ReadonlyArray<Empresa>): ReadonlyArray<Empresa> {
    return [...empresas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  private ordenarNegocios(negocios: ReadonlyArray<Negocio>): ReadonlyArray<Negocio> {
    return [...negocios].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return 'No tenés permisos para administrar negocios.';
      }
      if (error.status === 409) {
        return 'Ya existe un negocio con ese TenantID. Probá regenerarlo.';
      }
      if (error.status === 400) {
        return 'Revisá los datos ingresados.';
      }
      if (error.status === 0) {
        return 'No pudimos conectar con el servidor.';
      }
    }
    return 'No pudimos completar la operación. Intentá nuevamente.';
  }
}
