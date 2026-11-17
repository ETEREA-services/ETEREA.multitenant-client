import { Component, ElementRef, forwardRef, input, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { EtIconComponent } from '../icon/icon';

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Enmascara hasta ocho dígitos como `dd/MM/yyyy`. */
function enmascarar(digitos: string): string {
  const valor = digitos.replace(/\D/g, '').slice(0, 8);
  if (valor.length <= 2) {
    return valor;
  }
  if (valor.length <= 4) {
    return `${valor.slice(0, 2)}/${valor.slice(2)}`;
  }
  return `${valor.slice(0, 2)}/${valor.slice(2, 4)}/${valor.slice(4)}`;
}

/** Convierte `dd/MM/yyyy` a ISO (`yyyy-MM-dd`) validando que la fecha exista. */
function aIso(texto: string): string | null {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!partes) {
    return null;
  }

  const dia = Number(partes[1]);
  const mes = Number(partes[2]);
  const anio = Number(partes[3]);
  if (anio < 1900 || mes < 1 || mes > 12) {
    return null;
  }

  const diasDelMes = new Date(anio, mes, 0).getDate();
  if (dia < 1 || dia > diasDelMes) {
    return null;
  }

  return `${partes[3]}-${partes[2]}-${partes[1]}`;
}

/** Convierte ISO a `dd/MM/yyyy` sin pasar por `Date` (evita corrimientos de zona). */
function aTexto(iso: string): string {
  const partes = ISO.exec(iso);
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : '';
}

/**
 * Campo de fecha con formato visible `dd/MM/yyyy`, independiente de la
 * configuración regional del equipo. El valor del formulario sigue siendo ISO
 * (`yyyy-MM-dd`), para no cambiar los contratos con el backend.
 */
@Component({
  selector: 'et-date-input',
  imports: [EtIconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EtDateInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="et-date" [class.is-invalid]="invalido()">
      <input
        class="et-input et-date__texto"
        type="text"
        maxlength="10"
        autocomplete="off"
        placeholder="dd/mm/aaaa"
        [value]="texto()"
        [disabled]="deshabilitado()"
        [attr.aria-invalid]="invalido()"
        [attr.aria-required]="requerido()"
        (input)="alEscribir($event)"
        (blur)="alSalir()"
      />

      <button
        type="button"
        class="et-date__calendario"
        aria-label="Abrir calendario"
        [disabled]="deshabilitado()"
        (click)="abrirCalendario()"
      >
        <et-icon name="calendar" [size]="17" />
      </button>

      <input
        #picker
        class="et-date__picker"
        type="date"
        tabindex="-1"
        aria-hidden="true"
        [value]="iso() ?? ''"
        [disabled]="deshabilitado()"
        (change)="elegirDelCalendario($event)"
      />
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .et-date {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .et-date__texto {
      width: 100%;
      padding-right: 2.6rem;
      font-variant-numeric: tabular-nums;
    }

    .et-date__calendario {
      position: absolute;
      right: 0.3rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--et-text-mute);
      cursor: pointer;
      transition:
        background var(--et-fast) var(--et-ease),
        color var(--et-fast) var(--et-ease);
    }

    .et-date__calendario:hover:not(:disabled) {
      background: var(--et-surface-3);
      color: var(--et-text);
    }

    .et-date__calendario:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .et-date__calendario:focus-visible {
      outline: none;
      box-shadow: var(--et-ring);
    }

    /* El selector nativo sólo aporta el calendario: nunca muestra su formato. */
    .et-date__picker {
      position: absolute;
      right: 0.3rem;
      bottom: 0.3rem;
      width: 1px;
      height: 1px;
      padding: 0;
      border: 0;
      opacity: 0;
      pointer-events: none;
    }

    .et-date.is-invalid .et-date__texto {
      border-color: var(--et-danger);
      box-shadow: var(--et-ring-danger);
    }
  `,
})
export class EtDateInputComponent implements ControlValueAccessor {
  /** Permite marcarlo como obligatorio a nivel accesibilidad. */
  readonly requerido = input(false);

  protected readonly texto = signal('');
  protected readonly iso = signal<string | null>(null);
  protected readonly invalido = signal(false);
  protected readonly deshabilitado = signal(false);

  private onChange: (valor: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  private readonly picker = viewChild<ElementRef<HTMLInputElement>>('picker');

  writeValue(valor: unknown): void {
    const iso = typeof valor === 'string' ? valor : '';
    this.iso.set(iso || null);
    this.texto.set(aTexto(iso));
    this.invalido.set(false);
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitado.set(deshabilitado);
  }

  protected alEscribir(event: Event): void {
    const input = event.target as HTMLInputElement;
    const original = input.value;
    // Si se tipean sólo dígitos, se insertan las barras automáticamente. Si el
    // usuario ya escribe separadores (o borra), se respeta el texto tal cual.
    const soloDigitos = /^\d+$/.test(original);
    const limpio = soloDigitos
      ? enmascarar(original)
      : original.replace(/[^\d/]/g, '').slice(0, 10);
    const digitos = limpio.replace(/\D/g, '');
    // Con ocho dígitos se muestra siempre la forma canónica `dd/MM/yyyy`.
    const valor = digitos.length === 8 ? enmascarar(digitos) : limpio;

    if (input.value !== valor) {
      input.value = valor;
      if (soloDigitos || digitos.length === 8) {
        input.setSelectionRange(valor.length, valor.length);
      }
    }

    this.texto.set(valor);
    this.actualizarValor(valor);
  }

  protected alSalir(): void {
    const digitos = this.texto().replace(/\D/g, '');
    if (digitos.length === 0) {
      this.invalido.set(false);
      this.emitir('');
    } else if (digitos.length < 8) {
      this.invalido.set(true);
      this.emitir('');
    } else {
      const formateado = enmascarar(digitos);
      const iso = aIso(formateado);
      this.invalido.set(iso === null);
      this.texto.set(formateado);
      this.emitir(iso ?? '');
    }

    this.onTouched();
  }

  protected abrirCalendario(): void {
    const picker = this.picker()?.nativeElement;
    if (!picker || this.deshabilitado()) {
      return;
    }

    picker.value = this.iso() ?? '';
    const conSelector = picker as HTMLInputElement & { showPicker?: () => void };
    if (typeof conSelector.showPicker === 'function') {
      try {
        conSelector.showPicker();
        return;
      } catch {
        // Fallback para navegadores que bloquean showPicker.
      }
    }
    picker.focus();
    picker.click();
  }

  protected elegirDelCalendario(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    const iso = ISO.test(valor) ? valor : '';
    this.iso.set(iso || null);
    this.texto.set(aTexto(iso));
    this.invalido.set(false);
    this.onChange(iso);
    this.onTouched();
  }

  private actualizarValor(texto: string): void {
    const digitos = texto.replace(/\D/g, '');
    if (digitos.length === 0) {
      this.invalido.set(false);
      this.emitir('');
      return;
    }
    if (digitos.length < 8) {
      // Mientras se escribe no se marca error: el formulario recibe vacío y su
      // validador `required` decide.
      this.invalido.set(false);
      this.emitir('');
      return;
    }

    const iso = aIso(enmascarar(digitos));
    this.invalido.set(iso === null);
    this.emitir(iso ?? '');
  }

  private emitir(valor: string): void {
    this.iso.set(valor || null);
    this.onChange(valor);
  }
}
