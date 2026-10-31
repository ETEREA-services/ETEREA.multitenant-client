import { Component } from '@angular/core';
import { EtEmptyStateComponent, EtPageHeaderComponent } from '@eterea/ui-layout';

@Component({
  selector: 'et-contable-mayor',
  imports: [EtPageHeaderComponent, EtEmptyStateComponent],
  template: `
    <et-page-header
      eyebrow="Informes"
      title="Libro mayor"
      description="Movimientos y saldo acumulado por cuenta dentro de un período."
    />
    <div class="et-card">
      <et-empty-state
        icon="scale"
        title="Todavía no hay movimientos"
        description="Al elegir una cuenta, acá se van a ver sus movimientos, el saldo de apertura y el saldo acumulado."
      />
    </div>
  `,
})
export class MayorPageComponent {}
