import { Component, input } from '@angular/core';

@Component({
  selector: 'et-page-header',
  template: `
    <header class="et-page-header">
      <div class="et-page-header__text">
        @if (eyebrow()) {
          <span class="et-eyebrow">{{ eyebrow() }}</span>
        }
        <h1>{{ title() }}</h1>
        @if (description()) {
          <p>{{ description() }}</p>
        }
      </div>
      <div class="et-page-header__actions">
        <ng-content />
      </div>
    </header>
  `,
  styles: `
    .et-page-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1.5rem;
      margin-bottom: 1.75rem;
    }

    .et-page-header__text {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      min-width: 0;
    }

    h1 {
      font-size: clamp(1.55rem, 1.2rem + 1vw, 2.1rem);
      letter-spacing: -0.035em;
    }

    p {
      max-width: 62ch;
      color: var(--et-text-soft);
      font-size: 0.875rem;
    }

    .et-page-header__actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: none;
    }

    @media (max-width: 720px) {
      .et-page-header {
        align-items: flex-start;
        flex-direction: column;
        gap: 1rem;
      }

      .et-page-header__actions {
        width: 100%;
        flex-wrap: wrap;
      }
    }
  `,
})
export class EtPageHeaderComponent {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly description = input('');
}
