import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStore, SESSION_CONFIG } from '@eterea/shared-api';
import { EtIconComponent } from '@eterea/ui-layout';

@Component({
  selector: 'et-login',
  imports: [RouterLink, ReactiveFormsModule, EtIconComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  protected readonly config = inject(SESSION_CONFIG);
  protected readonly auth = inject(AuthStore);
  protected readonly error = this.auth.error;
  protected readonly cargando = this.auth.cargando;
  protected readonly esAdministrador = this.config.app === 'administrador';

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly passwordCambiada =
    this.route.snapshot.queryParamMap.get('passwordChanged') === '1';

  protected readonly form = this.fb.group({
    login: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected ingresar(): void {
    if (this.form.invalid || this.cargando()) {
      this.form.markAllAsTouched();
      return;
    }

    const { login, password } = this.form.getRawValue();
    this.auth.login({ login, password, app: this.config.app }).subscribe({
      next: () => void this.router.navigateByUrl(this.auth.rutaPostLogin()),
      error: () => undefined,
    });
  }
}
