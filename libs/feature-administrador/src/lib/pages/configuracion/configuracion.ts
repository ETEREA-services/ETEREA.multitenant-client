import { Component } from '@angular/core';
import { EtEmptyStateComponent, EtPageHeaderComponent } from '@eterea/ui-layout';

@Component({
  selector: 'et-administrador-configuracion',
  imports: [EtPageHeaderComponent, EtEmptyStateComponent],
  template: `
    <et-page-header
      eyebrow="Sistema"
      title="Configuración"
      description="Parámetros generales de la plataforma."
    />
    <div class="et-card">
      <et-empty-state
        icon="settings"
        title="Sin parámetros todavía"
        description="La configuración general de la plataforma se incorpora en un próximo paso."
      />
    </div>
  `,
})
export class ConfiguracionPageComponent {}
