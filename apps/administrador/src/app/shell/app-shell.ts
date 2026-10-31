import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { APP_ENV_INFO, AuthStore, getEnvDisplay } from '@eterea/shared-api';
import { EtShellComponent, ShellNavGroup } from '@eterea/ui-layout';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, EtShellComponent],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShellComponent {
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly envInfo = inject(APP_ENV_INFO);

  protected readonly envLabel = computed(() => getEnvDisplay(this.envInfo.name).label);
  protected readonly userName = this.authStore.nombreVisible;
  protected readonly userRole = this.authStore.rolVisible;
  protected readonly userInitials = this.authStore.iniciales;

  protected readonly navGroups: ReadonlyArray<ShellNavGroup> = [
    {
      label: 'Panel',
      items: [{ label: 'Resumen', path: '/', icon: 'grid', exact: true }],
    },
    {
      label: 'Organización',
      items: [
        { label: 'Empresas', path: '/empresas', icon: 'building' },
        { label: 'Negocios', path: '/negocios', icon: 'layers' },
      ],
    },
    {
      label: 'Accesos',
      items: [
        { label: 'Usuarios', path: '/usuarios', icon: 'user' },
        { label: 'Asignaciones', path: '/asignaciones', icon: 'swap' },
      ],
    },
    {
      label: 'Sistema',
      items: [{ label: 'Configuración', path: '/configuracion', icon: 'settings' }],
    },
  ];

  protected irACambiarPassword(): void {
    void this.router.navigate(['/cambiar-password']);
  }

  protected salir(): void {
    this.authStore.logout();
    void this.router.navigate(['/login']);
  }
}
