import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { CUENTA_REPOSITORY, CuentaBusqueda } from '@eterea/contable-data-access';
import { EtIconComponent } from '@eterea/ui-layout';

/**
 * Búsqueda legacy de cuentas (equivalente a `frmBuscar` + `coleccionBuscar`).
 *
 * - Busca por nombre, sólo cuentas imputables, ordenadas por nombre.
 * - El backend devuelve hasta 20 resultados.
 * - El texto visible es `nombre (cuenta)`.
 */
@Component({
  selector: 'et-cuenta-lookup',
  imports: [EtIconComponent],
  templateUrl: './cuenta-lookup.html',
  styleUrl: './cuenta-lookup.css',
  host: {
    '(document:keydown.escape)': 'cerrar.emit()',
  },
})
export class CuentaLookupComponent implements AfterViewInit, OnDestroy {
  readonly textoInicial = input('');
  readonly seleccionar = output<CuentaBusqueda>();
  readonly cerrar = output<void>();

  private readonly repository = inject(CUENTA_REPOSITORY);
  private readonly busqueda$ = new Subject<string>();
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly buscador = viewChild<ElementRef<HTMLInputElement>>('buscador');

  protected readonly texto = signal('');
  protected readonly resultados = signal<readonly CuentaBusqueda[]>([]);
  protected readonly activo = signal(0);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  private overflowPrevio = '';

  constructor() {
    this.busqueda$
      .pipe(
        debounceTime(150),
        distinctUntilChanged(),
        tap(() => {
          this.cargando.set(true);
          this.error.set(null);
        }),
        switchMap((texto) =>
          this.repository.buscar(texto).pipe(
            catchError(() => {
              this.error.set('No pudimos buscar cuentas. Intentá nuevamente.');
              return of([] as readonly CuentaBusqueda[]);
            }),
          ),
        ),
        tap(() => this.cargando.set(false)),
      )
      .subscribe((resultados) => {
        this.resultados.set(resultados);
        this.activo.set(0);
      });
  }

  ngAfterViewInit(): void {
    this.overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.texto.set(this.textoInicial());
    this.buscar();
    this.panel()?.nativeElement.focus();
    this.buscador()?.nativeElement.focus();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = this.overflowPrevio;
    this.busqueda$.complete();
  }

  protected alEscribir(event: Event): void {
    const texto = (event.target as HTMLInputElement).value;
    this.texto.set(texto);
    this.buscar(texto);
  }

  protected alTeclear(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activo.update((indice) =>
        Math.min(indice + 1, Math.max(this.resultados().length - 1, 0)),
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activo.update((indice) => Math.max(indice - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.elegirActivo();
    }
  }

  protected elegir(cuenta: CuentaBusqueda): void {
    this.seleccionar.emit(cuenta);
  }

  protected reintentar(): void {
    this.buscar();
  }

  private elegirActivo(): void {
    const resultados = this.resultados();
    if (resultados.length === 0) {
      return;
    }
    const indice = Math.min(this.activo(), resultados.length - 1);
    this.elegir(resultados[indice]);
  }

  private buscar(texto = this.texto()): void {
    this.busqueda$.next(texto);
  }

}
