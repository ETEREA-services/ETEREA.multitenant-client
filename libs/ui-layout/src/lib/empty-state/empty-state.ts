import { Component, input } from '@angular/core';
import { EtIconComponent, IconName } from '../icon/icon';

@Component({
  selector: 'et-empty-state',
  imports: [EtIconComponent],
  template: `
    <div class="et-empty">
      <span class="et-empty__icon">
        <et-icon [name]="icon()" [size]="24" />
      </span>
      <h3>{{ title() }}</h3>
      @if (description()) {
        <p>{{ description() }}</p>
      }
      <div class="et-empty__actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .et-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.55rem;
      padding: 4.5rem 1.5rem;
      text-align: center;
    }

    .et-empty__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 54px;
      height: 54px;
      margin-bottom: 0.5rem;
      border: 1px solid var(--et-line);
      border-radius: var(--et-radius);
      background: var(--et-surface-2);
      color: var(--et-primary);
    }

    h3 {
      font-size: 1.05rem;
    }

    p {
      max-width: 46ch;
      color: var(--et-text-mute);
      font-size: 0.8125rem;
    }

    .et-empty__actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.6rem;
    }

    .et-empty__actions:empty {
      display: none;
    }
  `,
})
export class EtEmptyStateComponent {
  readonly icon = input<IconName>('inbox');
  readonly title = input('Sin contenido todavía');
  readonly description = input('');
}
