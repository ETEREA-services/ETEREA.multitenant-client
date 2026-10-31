import { Component, input, output } from '@angular/core';
import { EtIconComponent } from '../icon/icon';

/**
 * Selector de contexto de la barra superior: empresa y negocio activos.
 * Vive fuera de `shell.css` para mantener acotado el tamaño de cada hoja.
 */
@Component({
  selector: 'et-shell-context',
  imports: [EtIconComponent],
  template: `
    <button
      type="button"
      class="context"
      [attr.aria-label]="
        'Cambiar contexto. Empresa ' + empresaName() + ', negocio ' + negocioName()
      "
      (click)="open.emit()"
    >
      <span class="context__icon">
        <et-icon name="building" [size]="16" />
      </span>
      <span class="context__text">
        <span class="context__empresa" [title]="empresaName()">{{ empresaName() }}</span>
        <strong class="context__negocio" [title]="negocioName()">{{ negocioName() }}</strong>
      </span>
      <et-icon name="swap" [size]="15" class="context__swap" />
    </button>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
      max-width: min(46vw, 32rem);
    }

    .context {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      width: 100%;
      min-width: 0;
      padding: 0.3rem 0.55rem;
      border: 1px solid transparent;
      border-radius: 12px;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
      transition:
        border-color var(--et-fast) var(--et-ease),
        background var(--et-fast) var(--et-ease);
    }

    .context:hover {
      border-color: var(--et-line);
      background: var(--et-surface-2);
    }

    .context:focus-visible {
      outline: none;
      box-shadow: var(--et-ring);
    }

    .context__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      flex: none;
      border-radius: 9px;
      background: var(--et-primary-soft);
      color: var(--et-primary);
    }

    .context__text {
      display: flex;
      flex-direction: column;
      min-width: 0;
      line-height: 1.25;
    }

    .context__empresa {
      overflow: hidden;
      color: var(--et-text-mute);
      font-size: 0.58rem;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-overflow: ellipsis;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .context__negocio {
      overflow: hidden;
      font-family: var(--et-font-display);
      font-size: 0.86rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .context__swap {
      flex: none;
      color: var(--et-text-mute);
    }

    @media (max-width: 720px) {
      :host {
        max-width: 52vw;
      }
    }

    @media (max-width: 480px) {
      :host {
        max-width: 48vw;
      }

      .context {
        gap: 0.4rem;
        padding: 0.25rem 0.4rem;
      }

      .context__icon,
      .context__swap {
        display: none;
      }

      .context__empresa {
        font-size: 0.54rem;
        letter-spacing: 0.12em;
      }
    }
  `,
})
export class EtShellContextComponent {
  readonly empresaName = input('Sin empresa');
  readonly negocioName = input('Elegí un negocio');
  readonly open = output<void>();
}
