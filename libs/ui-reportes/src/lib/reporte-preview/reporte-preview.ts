import { Component, input } from '@angular/core';
import { ReporteColumna, ReporteDatos, ReporteFila } from '@eterea/reporte-shared';

/**
 * Vista previa del reporte: dibuja el mismo contrato JSON que usa el PDF.
 *
 * No calcula orden, jerarquía ni formato; sólo aplica la sangría y la negrita
 * que vienen resueltas desde el backend.
 */
@Component({
  selector: 'et-reporte-preview',
  templateUrl: './reporte-preview.html',
  styleUrl: './reporte-preview.css',
})
export class EtReportePreviewComponent {
  readonly datos = input.required<ReporteDatos>();

  protected subtitulo(): string {
    // El backend envía los períodos con `dd-MM-yyyy`; en pantalla se muestran
    // siempre con barras, igual que el resto de las fechas.
    return (this.datos().subtitulo ?? '').replace(/\b(\d{2})-(\d{2})-(\d{4})\b/g, '$1/$2/$3');
  }

  protected fechaGeneracion(): string {
    const valor = this.datos().generadoEn;
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
    if (iso) {
      return `${iso[3]}/${iso[2]}/${iso[1]}`;
    }
    return valor.replace(/^(\d{2})-(\d{2})-(\d{4})$/, '$1/$2/$3');
  }

  protected sangria(columna: ReporteColumna, fila: ReporteFila): string | null {
    if (!columna.admiteSangria) {
      return null;
    }
    const nivel = Math.max(1, fila.nivel);
    return `${0.9 + (nivel - 1) * 1.25}rem`;
  }
}
