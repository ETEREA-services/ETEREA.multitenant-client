import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MonedaInfo } from '@eterea/contable-data-access';

/**
 * Selector de una moneda del catálogo del tenant.
 *
 * Se usa dos veces en el Mayor (`Registrado en` y `Expresado en`) y puede
 * reutilizarse en otros reportes. El valor del formulario es `monedaId`.
 */
@Component({
  selector: 'et-moneda-select',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MonedaSelectComponent),
      multi: true,
    },
  ],
  template: `
    <select
      class="et-input"
      [value]="valor() ?? ''"
      [disabled]="deshabilitado() || deshabilitadoInterno()"
      (change)="alCambiar($event)"
      (blur)="onTouched()"
    >
      @for (moneda of monedas(); track moneda.monedaId) {
        <option [value]="moneda.monedaId">
          {{ moneda.simbolo }} · {{ moneda.nombre }}
        </option>
      }
    </select>
  `,
})
export class MonedaSelectComponent implements ControlValueAccessor {
  readonly monedas = input<readonly MonedaInfo[]>([]);
  readonly deshabilitado = input(false);

  protected readonly valor = signal<number | null>(null);
  protected readonly deshabilitadoInterno = signal(false);

  private onChange: (valor: number | null) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(valor: unknown): void {
    this.valor.set(typeof valor === 'number' ? valor : null);
  }

  registerOnChange(fn: (valor: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitadoInterno.set(deshabilitado);
  }

  protected alCambiar(event: Event): void {
    const valor = Number((event.target as HTMLSelectElement).value);
    const monedaId = Number.isFinite(valor) ? valor : null;
    this.valor.set(monedaId);
    this.onChange(monedaId);
  }
}
