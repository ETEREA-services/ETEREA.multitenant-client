import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Observable } from 'rxjs';
import {
  EJERCICIO_REPOSITORY,
  Ejercicio,
  EjercicioInput,
  EstadoEjercicio,
  normalizarErrorEjercicio,
} from '@eterea/contable-data-access';
import { AuthStore, ContextoStore } from '@eterea/shared-api';
import { EtEmptyStateComponent, EtIconComponent, EtPageHeaderComponent } from '@eterea/ui-layout';

type ModoFormulario = 'crear' | 'editar';
type TipoConfirmacion = 'bloquear' | 'desbloquear' | 'eliminar';

interface FormularioEjercicio {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}

interface Confirmacion {
  tipo: TipoConfirmacion;
  ejercicio: Ejercicio;
}

const FORMULARIO_VACIO: FormularioEjercicio = {
  nombre: '',
  fechaInicio: '',
  fechaFin: '',
};

@Component({
  selector: 'et-contable-ejercicios',
  imports: [FormsModule, EtPageHeaderComponent, EtEmptyStateComponent, EtIconComponent],
  templateUrl: './ejercicios.html',
  styleUrl: './ejercicios.css',
})
export class EjerciciosPageComponent {
  private readonly repository = inject(EJERCICIO_REPOSITORY);
  private readonly authStore = inject(AuthStore);
  private readonly contextoStore = inject(ContextoStore);
  private claveContexto: string | null = null;
  private cargaVersion = 0;

  protected readonly esAdministrador = this.authStore.esAdministrador;

  protected readonly ejercicios = signal<readonly Ejercicio[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sinPermiso = signal(false);
  protected readonly aviso = signal<string | null>(null);

  protected readonly formularioAbierto = signal(false);
  protected readonly modo = signal<ModoFormulario>('crear');
  protected readonly seleccionado = signal<Ejercicio | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorFormulario = signal<string | null>(null);
  protected readonly creando = signal(false);
  protected formulario: FormularioEjercicio = { ...FORMULARIO_VACIO };

  protected readonly confirmacion = signal<Confirmacion | null>(null);
  protected readonly ejecutandoAccion = signal(false);
  protected readonly errorAccion = signal<string | null>(null);

  protected readonly total = computed(() => this.ejercicios().length);
  protected readonly bloqueados = computed(
    () => this.ejercicios().filter((ejercicio) => ejercicio.bloqueado).length,
  );

  constructor() {
    // La pantalla puede seguir montada al cambiar de negocio desde el shell.
    effect(() => {
      const negocio = this.contextoStore.negocioActivo();
      const clave = negocio ? `${negocio.negocioId}:${negocio.tenantId}` : null;
      if (clave === this.claveContexto) {
        return;
      }
      this.claveContexto = clave;
      this.reiniciarPorContexto();
    });
  }

  protected cargar(): void {
    if (!this.claveContexto) {
      return;
    }

    const version = ++this.cargaVersion;
    this.cargando.set(true);
    this.error.set(null);
    this.sinPermiso.set(false);

    this.repository
      .listar()
      .pipe(
        finalize(() => {
          if (version === this.cargaVersion) {
            this.cargando.set(false);
          }
        }),
      )
      .subscribe({
        next: (ejercicios) => {
          if (version !== this.cargaVersion) {
            return;
          }
          this.ejercicios.set(ejercicios);
          this.sincronizarSeleccion();
        },
        error: (error: unknown) => {
          if (version !== this.cargaVersion) {
            return;
          }
          const normalizado = normalizarErrorEjercicio(error);
          this.error.set(normalizado.mensaje);
          this.sinPermiso.set(normalizado.status === 403);
        },
      });
  }

  protected crearSiguiente(): void {
    if (!this.claveContexto || this.guardando() || this.creando()) {
      return;
    }

    this.creando.set(true);
    this.aviso.set(null);
    this.error.set(null);

    this.repository.siguiente().subscribe({
      next: (siguiente) => {
        if (!siguiente.disponible) {
          this.creando.set(false);
          this.aviso.set(siguiente.motivo ?? 'No hay un siguiente ejercicio disponible.');
          return;
        }
        if (!siguiente.nombre || !siguiente.fechaInicio || !siguiente.fechaFin) {
          this.creando.set(false);
          this.error.set('El servidor no devolvió las fechas del siguiente ejercicio.');
          return;
        }

        this.repository
          .crear({
            nombre: siguiente.nombre,
            fechaInicio: siguiente.fechaInicio,
            fechaFin: siguiente.fechaFin,
          })
          .subscribe({
            next: () => {
              this.creando.set(false);
              this.aviso.set(`Ejercicio "${siguiente.nombre}" creado.`);
              this.cargar();
            },
            error: (error: unknown) => {
              this.creando.set(false);
              this.error.set(normalizarErrorEjercicio(error).mensaje);
            },
          });
      },
      error: (error: unknown) => {
        this.creando.set(false);
        this.error.set(normalizarErrorEjercicio(error).mensaje);
      },
    });
  }

  protected abrirEdicion(ejercicio: Ejercicio): void {
    if (this.guardando()) {
      return;
    }
    this.seleccionado.set(ejercicio);
    this.modo.set('editar');
    this.formulario = {
      nombre: ejercicio.nombre,
      fechaInicio: ejercicio.fechaInicio,
      fechaFin: ejercicio.fechaFin,
    };
    this.formularioAbierto.set(true);
    this.errorFormulario.set(null);
    this.aviso.set(null);
  }

  protected cancelarFormulario(): void {
    if (this.guardando()) {
      return;
    }
    this.formularioAbierto.set(false);
    this.seleccionado.set(null);
    this.errorFormulario.set(null);
  }

  protected guardar(): void {
    if (this.guardando()) {
      return;
    }

    const validacion = this.validar();
    if (validacion) {
      this.errorFormulario.set(validacion);
      return;
    }

    const input: EjercicioInput = {
      nombre: this.formulario.nombre.trim(),
      fechaInicio: this.formulario.fechaInicio,
      fechaFin: this.formulario.fechaFin,
    };

    this.guardando.set(true);
    this.errorFormulario.set(null);

    if (this.modo() === 'crear') {
      this.repository
        .crear(input)
        .pipe(finalize(() => this.guardando.set(false)))
        .subscribe({
          next: () => this.finalizarGuardado(),
          error: (error: unknown) =>
            this.errorFormulario.set(normalizarErrorEjercicio(error).mensaje),
        });
      return;
    }

    const ejercicio = this.seleccionado();
    if (!ejercicio) {
      this.guardando.set(false);
      this.errorFormulario.set('Elegí un ejercicio para editar.');
      return;
    }

    this.repository
      .actualizar(ejercicio.ejercicioId, input)
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: () => this.finalizarGuardado(),
        error: (error: unknown) =>
          this.errorFormulario.set(normalizarErrorEjercicio(error).mensaje),
      });
  }

  protected solicitarBloqueo(ejercicio: Ejercicio): void {
    if (this.ejecutandoAccion()) {
      return;
    }
    this.errorAccion.set(null);
    this.confirmacion.set({
      tipo: ejercicio.bloqueado ? 'desbloquear' : 'bloquear',
      ejercicio,
    });
  }

  protected solicitarEliminacion(ejercicio: Ejercicio): void {
    if (this.ejecutandoAccion()) {
      return;
    }
    this.errorAccion.set(null);
    this.confirmacion.set({ tipo: 'eliminar', ejercicio });
  }

  protected cancelarConfirmacion(): void {
    if (this.ejecutandoAccion()) {
      return;
    }
    this.confirmacion.set(null);
    this.errorAccion.set(null);
  }

  protected confirmarAccion(): void {
    const confirmacion = this.confirmacion();
    if (!confirmacion || this.ejecutandoAccion()) {
      return;
    }

    this.ejecutandoAccion.set(true);
    this.errorAccion.set(null);

    const peticion: Observable<unknown> =
      confirmacion.tipo === 'eliminar'
        ? this.repository.eliminar(confirmacion.ejercicio.ejercicioId)
        : this.repository.cambiarBloqueo(
            confirmacion.ejercicio.ejercicioId,
            confirmacion.tipo === 'bloquear',
          );

    peticion.pipe(finalize(() => this.ejecutandoAccion.set(false))).subscribe({
      next: () => {
        this.confirmacion.set(null);
        this.cargar();
      },
      error: (error: unknown) => {
        this.errorAccion.set(normalizarErrorEjercicio(error).mensaje);
      },
    });
  }

  protected cerrarAviso(): void {
    this.aviso.set(null);
  }

  protected fechaVisible(fecha: string): string {
    const [anio, mes, dia] = fecha.slice(0, 10).split('-');
    if (!anio || !mes || !dia) {
      return fecha;
    }
    return `${dia}-${mes}-${anio}`;
  }

  protected estadoEtiqueta(estado: EstadoEjercicio): string {
    switch (estado) {
      case 'FUTURO':
        return 'Futuro';
      case 'EN_CURSO':
        return 'En curso';
      case 'FINALIZADO':
        return 'Finalizado';
    }
  }

  protected tituloConfirmacion(confirmacion: Confirmacion): string {
    switch (confirmacion.tipo) {
      case 'eliminar':
        return 'Eliminar ejercicio';
      case 'bloquear':
        return 'Bloquear ejercicio';
      case 'desbloquear':
        return 'Desbloquear ejercicio';
    }
  }

  protected textoConfirmacion(confirmacion: Confirmacion): string {
    const nombre = confirmacion.ejercicio.nombre;
    switch (confirmacion.tipo) {
      case 'eliminar':
        return `¿Eliminar "${nombre}"? La baja sólo se permite si es el último ejercicio, no comenzó y no tiene movimientos.`;
      case 'bloquear':
        return `"${nombre}" quedará bloqueado y no admitirá asientos en su período.`;
      case 'desbloquear':
        return `"${nombre}" volverá a admitir asientos en su período.`;
    }
  }

  protected etiquetaConfirmacion(confirmacion: Confirmacion): string {
    switch (confirmacion.tipo) {
      case 'eliminar':
        return 'Eliminar';
      case 'bloquear':
        return 'Bloquear';
      case 'desbloquear':
        return 'Desbloquear';
    }
  }

  private validar(): string | null {
    if (!this.formulario.nombre.trim()) {
      return 'Ingresá el nombre del ejercicio.';
    }
    if (this.formulario.nombre.trim().length > 128) {
      return 'El nombre no puede superar los 128 caracteres.';
    }
    if (!this.formulario.fechaInicio || !this.formulario.fechaFin) {
      return 'Ingresá la fecha de inicio y la fecha de fin.';
    }
    if (this.formulario.fechaInicio > this.formulario.fechaFin) {
      return 'La fecha de inicio no puede ser posterior a la fecha de fin.';
    }
    return null;
  }

  private finalizarGuardado(): void {
    this.formularioAbierto.set(false);
    this.seleccionado.set(null);
    this.errorFormulario.set(null);
    this.cargar();
  }

  private sincronizarSeleccion(): void {
    const actual = this.seleccionado();
    if (!actual) {
      return;
    }
    const nueva = this.ejercicios().find(
      (ejercicio) => ejercicio.ejercicioId === actual.ejercicioId,
    );
    this.seleccionado.set(nueva ?? null);
    if (!nueva && this.modo() !== 'crear') {
      this.formularioAbierto.set(false);
    }
  }

  private reiniciarPorContexto(): void {
    this.cargaVersion++;
    this.ejercicios.set([]);
    this.cargando.set(false);
    this.error.set(null);
    this.sinPermiso.set(false);
    this.aviso.set(null);
    this.formularioAbierto.set(false);
    this.seleccionado.set(null);
    this.guardando.set(false);
    this.errorFormulario.set(null);
    this.creando.set(false);
    this.confirmacion.set(null);
    this.ejecutandoAccion.set(false);
    this.errorAccion.set(null);

    if (!this.claveContexto) {
      return;
    }
    this.cargar();
  }
}
