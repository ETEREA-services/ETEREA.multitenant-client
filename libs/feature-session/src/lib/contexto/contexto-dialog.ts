import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  input,
  output,
  viewChild,
} from '@angular/core';
import { ContextoSeleccion, EmpresaContexto } from '@eterea/shared-api';
import { EtIconComponent } from '@eterea/ui-layout';
import { ContextoSelectorComponent } from './contexto-selector';

/**
 * Modal para cambiar de empresa o negocio sin abandonar la pantalla actual.
 * El cambio se aplica recién cuando el usuario elige un negocio.
 */
@Component({
  selector: 'et-contexto-dialog',
  imports: [ContextoSelectorComponent, EtIconComponent],
  templateUrl: './contexto-dialog.html',
  styleUrl: './contexto-dialog.css',
  host: {
    '(document:keydown.escape)': 'cerrar.emit()',
  },
})
export class ContextoDialogComponent implements AfterViewInit, OnDestroy {
  readonly empresas = input.required<ReadonlyArray<EmpresaContexto>>();
  readonly empresaActivaId = input<string | null>(null);
  readonly negocioActivoId = input<number | null>(null);

  readonly seleccionar = output<ContextoSeleccion>();
  readonly cerrar = output<void>();

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private overflowPrevio = '';

  ngAfterViewInit(): void {
    this.overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.panel()?.nativeElement.focus();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = this.overflowPrevio;
  }
}
