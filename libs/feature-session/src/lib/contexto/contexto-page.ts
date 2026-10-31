import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStore, ContextoSeleccion, ContextoStore } from '@eterea/shared-api';
import { EtIconComponent, EtPageHeaderComponent } from '@eterea/ui-layout';
import { ContextoSelectorComponent } from './contexto-selector';

/**
 * Pantalla obligatoria posterior al login: primero empresa, después negocio.
 * Al confirmar se guarda el contexto de esta solapa y se vuelve al destino.
 */
@Component({
  selector: 'et-contexto-page',
  imports: [EtPageHeaderComponent, EtIconComponent, ContextoSelectorComponent],
  templateUrl: './contexto-page.html',
  styleUrl: './contexto-page.css',
})
export class ContextoPageComponent {
  private readonly contextoStore = inject(ContextoStore);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly empresas = this.contextoStore.empresas;
  protected readonly empresaActivaId = computed(
    () => this.contextoStore.empresaActiva()?.empresaId ?? null,
  );
  protected readonly negocioActivoId = computed(
    () => this.contextoStore.negocioActivo()?.negocioId ?? null,
  );
  protected readonly hayContexto = this.contextoStore.hayContexto;

  protected elegir(seleccion: ContextoSeleccion): void {
    if (!this.contextoStore.commit(seleccion.empresaId, seleccion.negocioId)) {
      return;
    }
    void this.router.navigateByUrl(this.destino());
  }

  protected volver(): void {
    void this.router.navigateByUrl(this.destino());
  }

  protected salir(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  private destino(): string {
    const destino = this.route.snapshot.queryParamMap.get('returnUrl');
    if (
      !destino ||
      !destino.startsWith('/') ||
      destino.startsWith('//') ||
      destino.startsWith('/login') ||
      destino.startsWith('/empresas') ||
      destino.startsWith('/cambiar-password')
    ) {
      return this.auth.rutaPostLogin();
    }
    return destino;
  }
}
