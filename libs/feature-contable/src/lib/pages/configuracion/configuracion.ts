import { Component } from '@angular/core';
import { EtEmptyStateComponent, EtPageHeaderComponent } from '@eterea/ui-layout';

@Component({
  selector: 'et-contable-configuracion',
  imports: [EtPageHeaderComponent, EtEmptyStateComponent],
  template: `
    <et-page-header
      eyebrow="Sistema"
      title="Configuración"
      description="Datos de la empresa, preferencias de trabajo e integración con la API."
    />
    <div class="et-card">
      <et-empty-state
        icon="settings"
        title="Configuración pendiente"
        description="La configuración de la empresa activa y las preferencias del cliente se van a administrar acá."
      />
    </div>
  `,
})
export class ConfiguracionPageComponent {}
