import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { TopbarComponent }  from '../topbar/topbar';
import { AuthService }      from '../../auth/services/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="shell">
      <app-sidebar
        [usuario]="auth.usuario()"
        [open]="sidebarOpen()"
        (sair)="auth.logout()"
        (fechar)="sidebarOpen.set(false)"
      />
      <div class="shell-main">
        <app-topbar
          (menuToggle)="sidebarOpen.set(!sidebarOpen())"
        />
        <main class="shell-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell { display:flex; height:100vh; overflow:hidden; background:var(--bg); }
    .shell-main { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }
    .shell-content { flex:1; overflow-y:auto; padding:24px; }
    @media (max-width:1024px) { .shell-content { padding:16px; } }
    @media (max-width:600px)  { .shell-content { padding:12px; } }
  `],
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  readonly sidebarOpen = signal(false);
}