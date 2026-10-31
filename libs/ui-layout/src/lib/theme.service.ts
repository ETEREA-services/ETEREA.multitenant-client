import { computed, Injectable, signal } from '@angular/core';

export type Tema = 'light' | 'dark';

const TEMA_KEY = 'eterea.contable.tema';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _tema = signal<Tema>(this.inicial());
  readonly tema = this._tema.asReadonly();
  readonly esOscuro = computed(() => this._tema() === 'dark');

  constructor() {
    this.aplicar(this._tema());
  }

  alternar(): void {
    this.aplicar(this._tema() === 'dark' ? 'light' : 'dark');
  }

  private aplicar(tema: Tema): void {
    this._tema.set(tema);

    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.dataset['theme'] = tema;
    try {
      localStorage.setItem(TEMA_KEY, tema);
    } catch {
      // Sin persistencia: el tema sigue funcionando en memoria.
    }
  }

  private inicial(): Tema {
    if (typeof localStorage !== 'undefined') {
      const guardado = localStorage.getItem(TEMA_KEY);
      if (guardado === 'light' || guardado === 'dark') {
        return guardado;
      }
    }

    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }

    return 'light';
  }
}
