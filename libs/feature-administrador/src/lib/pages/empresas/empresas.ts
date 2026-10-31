import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { ADMINISTRADOR_REPOSITORY, Empresa, Negocio } from '@eterea/administrador-data-access';
import { EtEmptyStateComponent, EtIconComponent, EtPageHeaderComponent } from '@eterea/ui-layout';

type ModoDialogo = 'crear' | 'editar';

interface DialogoEmpresa {
  modo: ModoDialogo;
  empresa: Empresa | null;
}

@Component({
  selector: 'et-administrador-empresas',
  imports: [FormsModule, EtPageHeaderComponent, EtEmptyStateComponent, EtIconComponent],
  templateUrl: './empresas.html',
  styleUrl: './empresas.css',
})
export class EmpresasPageComponent implements OnInit {
  private readonly repository = inject(ADMINISTRADOR_REPOSITORY);

  protected readonly empresas = signal<ReadonlyArray<Empresa>>([]);
  protected readonly negocios = signal<ReadonlyArray<Negocio>>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtro = signal('');

  protected readonly dialogo = signal<DialogoEmpresa | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorDialogo = signal<string | null>(null);
  protected readonly formulario = { nombre: '' };

  protected readonly empresasFiltradas = computed(() => {
    const termino = this.filtro().trim().toLowerCase();
    const lista = this.empresas();
    if (!termino) {
      return lista;
    }
    return lista.filter(
      (empresa) =>
        empresa.nombre.toLowerCase().includes(termino) ||
        empresa.empresaId.toLowerCase().includes(termino),
    );
  });

  protected readonly negociosPorEmpresa = computed(() => {
    const mapa = new Map<string, number>();
    for (const negocio of this.negocios()) {
      mapa.set(negocio.empresaId, (mapa.get(negocio.empresaId) ?? 0) + 1);
    }
    return mapa;
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
          this.empresas.set(this.ordenar(empresas));
          this.negocios.set(negocios);
        },
        error: (error: unknown) => this.error.set(this.mensajeError(error)),
      });
  }

  protected actualizarFiltro(event: Event): void {
    this.filtro.set((event.target as HTMLInputElement).value);
  }

  protected negociosDe(empresaId: string): number {
    return this.negociosPorEmpresa().get(empresaId) ?? 0;
  }

  protected idCorto(empresaId: string): string {
    return empresaId.slice(0, 8);
  }

  protected abrirAlta(): void {
    this.formulario.nombre = '';
    this.errorDialogo.set(null);
    this.dialogo.set({ modo: 'crear', empresa: null });
  }

  protected abrirEdicion(empresa: Empresa): void {
    this.formulario.nombre = empresa.nombre;
    this.errorDialogo.set(null);
    this.dialogo.set({ modo: 'editar', empresa });
  }

  protected cerrar(): void {
    if (this.guardando()) {
      return;
    }
    this.dialogo.set(null);
    this.errorDialogo.set(null);
  }

  protected guardar(): void {
    const dialogo = this.dialogo();
    if (!dialogo || this.guardando()) {
      return;
    }

    const nombre = this.formulario.nombre.trim();
    if (!nombre) {
      this.errorDialogo.set('Ingresá el nombre de la empresa.');
      return;
    }

    this.guardando.set(true);
    this.errorDialogo.set(null);

    const peticion =
      dialogo.modo === 'editar' && dialogo.empresa
        ? this.repository.actualizarEmpresa(dialogo.empresa.empresaId, { nombre })
        : this.repository.crearEmpresa({ nombre });

    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: (empresa) => {
        this.empresas.update((lista) =>
          this.ordenar(
            dialogo.modo === 'editar'
              ? lista.map((actual) => (actual.empresaId === empresa.empresaId ? empresa : actual))
              : [...lista, empresa],
          ),
        );
        this.dialogo.set(null);
      },
      error: (error: unknown) => this.errorDialogo.set(this.mensajeError(error)),
    });
  }

  private ordenar(empresas: ReadonlyArray<Empresa>): ReadonlyArray<Empresa> {
    return [...empresas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return 'No tenés permisos para administrar empresas.';
      }
      if (error.status === 0) {
        return 'No pudimos conectar con el servidor.';
      }
      if (error.status === 400) {
        return 'Revisá los datos ingresados.';
      }
    }
    return 'No pudimos completar la operación. Intentá nuevamente.';
  }
}
