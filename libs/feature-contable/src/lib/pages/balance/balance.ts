import { Component } from '@angular/core';
import { EtEmptyStateComponent, EtPageHeaderComponent } from '@eterea/ui-layout';

@Component({
  selector: 'et-contable-balance',
  imports: [EtPageHeaderComponent, EtEmptyStateComponent],
  template: `
    <et-page-header
      eyebrow="Informes"
      title="Balance"
      description="Balance de comprobación y estados contables del ejercicio."
    />
    <div class="et-card">
      <et-empty-state
        icon="chart"
        title="Todavía no hay estados contables"
        description="El balance de comprobación, la situación patrimonial y el estado de resultados se van a generar acá."
      />
    </div>
  `,
})
export class BalancePageComponent {}
