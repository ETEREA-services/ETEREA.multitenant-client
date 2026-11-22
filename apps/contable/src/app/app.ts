import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, NavigationError, Router, RouterOutlet } from '@angular/router';
import { AuthStore } from '@eterea/shared-api';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    @if (mostrarSplash()) {
      <div class="restaurando" role="status" aria-live="polite">
        <span class="restaurando__marca">eterea</span>
        <span class="restaurando__modulo">CONTABLE</span>
        <span class="restaurando__texto">Restaurando sesión…</span>
      </div>
    }
  `,
  styles: `
    .restaurando {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      background: var(--et-bg);
      color: var(--et-text);
    }

    .restaurando__marca {
      font-family: var(--et-font-display);
      font-size: 1.35rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .restaurando__modulo {
      color: var(--et-primary);
      font-family: var(--et-font-sans);
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.22em;
    }

    .restaurando__texto {
      margin-top: 1.1rem;
      color: var(--et-text-mute);
      font-size: 0.8125rem;
    }
  `,
})
export class AppComponent {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  /**
   * Al recargar, los guards esperan a que se restaure la sesión y el contexto:
   * hasta que la primera navegación termina, el `router-outlet` está vacío.
   * Mientras tanto mostramos un splash en lugar de una pantalla en blanco.
   */
  private readonly navegacionInicial = signal(false);

  protected readonly mostrarSplash = computed(
    () => this.auth.restaurando() || !this.navegacionInicial(),
  );

  constructor() {
    this.router.events
      .pipe(
        filter(
          (evento) =>
            evento instanceof NavigationEnd || evento instanceof NavigationError,
        ),
      )
      .subscribe(() => this.navegacionInicial.set(true));
  }
}
