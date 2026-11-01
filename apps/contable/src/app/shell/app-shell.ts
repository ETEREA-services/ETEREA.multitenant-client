import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ContextoDialogComponent } from '@eterea/feature-session';
import {
  APP_ENV_INFO,
  AuthStore,
  ContextoSeleccion,
  ContextoStore,
  getEnvDisplay,
} from '@eterea/shared-api';
import { EtShellComponent, ShellNavGroup } from '@eterea/ui-layout';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, EtShellComponent, ContextoDialogComponent],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShellComponent {
  private readonly contextoStore = inject(ContextoStore);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly envInfo = inject(APP_ENV_INFO);

  protected readonly empresas = this.contextoStore.empresas;
  protected readonly empresaActivaId = computed(
    () => this.contextoStore.empresaActiva()?.empresaId ?? null,
  );
  protected readonly negocioActivoId = computed(
    () => this.contextoStore.negocioActivo()?.negocioId ?? null,
  );
  protected readonly selectorAbierto = signal(false);

  protected readonly userName = this.authStore.nombreVisible;
  protected readonly userRole = this.authStore.rolVisible;
  protected readonly userInitials = this.authStore.iniciales;

  protected readonly empresaName = computed(
    () => this.contextoStore.empresaActiva()?.nombre ?? 'Sin empresa',
  );
  protected readonly negocioName = computed(
    () => this.contextoStore.negocioActivo()?.nombre ?? 'Elegí un negocio',
  );

  protected readonly tenantInitials = this.contextoStore.empresaIniciales;
  protected readonly envLabel = computed(() => getEnvDisplay(this.envInfo.name).label);

  constructor() {
    // Si el contexto deja de ser válido (por ejemplo, revocaron la asignación
    // mientras la solapa estaba abierta), volver al selector.
    effect(() => {
      if (this.authStore.autenticado() && !this.contextoStore.hayContexto()) {
        void this.router.navigate(['/empresas']);
      }
    });
  }

  protected readonly navGroups: ReadonlyArray<ShellNavGroup> = [
    {
      label: 'Maestros',
      items: [
        { label: 'Plan de cuentas', path: '/plan-cuentas', icon: 'tree' },
        { label: 'Ejercicios', path: '/ejercicios', icon: 'calendar' },
        {
          label: 'Coeficientes de inflación',
          path: '/inflacion/coeficientes',
          icon: 'chart',
        },
      ],
    },
    {
      label: 'Informes',
      items: [{ label: 'Balance', path: '/balance', icon: 'chart' }],
    },
    {
      label: 'Reportes',
      items: [
        { label: 'Plan de Cuentas', path: '/reportes/plan-cuentas', icon: 'file' },
      ],
    },
  ];

  protected abrirSelector(): void {
    this.selectorAbierto.set(true);
  }

  protected cerrarSelector(): void {
    this.selectorAbierto.set(false);
  }

  protected aplicarContexto(seleccion: ContextoSeleccion): void {
    if (!this.contextoStore.commit(seleccion.empresaId, seleccion.negocioId)) {
      return;
    }
    this.selectorAbierto.set(false);
    void this.router.navigateByUrl(this.router.url, {
      onSameUrlNavigation: 'reload',
    });
  }

  protected irACambiarPassword(): void {
    void this.router.navigate(['/cambiar-password']);
  }

  protected salir(): void {
    this.authStore.logout();
    void this.router.navigate(['/login']);
  }
}
