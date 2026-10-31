import { Component, OnInit, computed, input, output, signal } from '@angular/core';
import { ContextoSeleccion, EmpresaContexto, NegocioContexto, iniciales } from '@eterea/shared-api';
import { EtEmptyStateComponent, EtIconComponent } from '@eterea/ui-layout';

/**
 * Selector de empresa → negocio reutilizable.
 *
 * Arranca en el paso de negocio cuando ya hay una empresa activa (modo cambio)
 * y en el paso de empresa cuando se entra por primera vez.
 */
@Component({
  selector: 'et-contexto-selector',
  imports: [EtEmptyStateComponent, EtIconComponent],
  templateUrl: './contexto-selector.html',
  styleUrl: './contexto-selector.css',
})
export class ContextoSelectorComponent implements OnInit {
  readonly empresas = input.required<ReadonlyArray<EmpresaContexto>>();
  readonly empresaActivaId = input<string | null>(null);
  readonly negocioActivoId = input<number | null>(null);
  readonly permitirSalir = input(true);

  readonly seleccionar = output<ContextoSeleccion>();
  readonly salir = output<void>();

  protected readonly iniciales = iniciales;
  protected readonly empresaElegida = signal<EmpresaContexto | null>(null);
  protected readonly negocios = computed(() => this.empresaElegida()?.negocios ?? []);
  protected readonly paso = computed(() => (this.empresaElegida() ? 'negocio' : 'empresa'));

  ngOnInit(): void {
    const activa = this.empresas().find((empresa) => empresa.empresaId === this.empresaActivaId());
    if (activa && this.negocioActivoId() !== null) {
      this.empresaElegida.set(activa);
    }
  }

  protected elegirEmpresa(empresa: EmpresaContexto): void {
    if (empresa.negocios.length === 0) {
      return;
    }
    this.empresaElegida.set(empresa);
  }

  protected volver(): void {
    this.empresaElegida.set(null);
  }

  protected elegirNegocio(negocio: NegocioContexto): void {
    const empresa = this.empresaElegida();
    if (!empresa) {
      return;
    }
    this.seleccionar.emit({ empresaId: empresa.empresaId, negocioId: negocio.negocioId });
  }

  protected esNegocioActivo(negocio: NegocioContexto): boolean {
    return (
      negocio.negocioId === this.negocioActivoId() &&
      this.empresaElegida()?.empresaId === this.empresaActivaId()
    );
  }

  protected resumenNegocios(cantidad: number): string {
    if (cantidad === 0) {
      return 'Sin negocios asignados';
    }
    return cantidad === 1 ? '1 negocio' : `${cantidad} negocios`;
  }
}
