import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="login-bg">
      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>

      <div class="login-card">
        <!-- Logo -->
        <div class="logo">
          <div class="logo-icon"></div>
          <span class="logo-text">360<em>Core</em></span>
        </div>

        <h1 class="title">Bem-vindo de volta</h1>
        <p class="subtitle">Faça login para acessar</p>

        <!-- Form -->
        <form class="form" (ngSubmit)="onSubmit()">

          <div class="field">
            <label class="label">Usuário</label>
            <div class="input-wrap" [class.focused]="focusUser">
              <span class="input-icon">👤</span>
              <input
                class="input"
                type="text"
                placeholder="seu.usuario"
                [(ngModel)]="username"
                name="username"
                autocomplete="username"
                (focus)="focusUser = true"
                (blur)="focusUser = false"
                required
              />
            </div>
          </div>

          <div class="field">
            <label class="label">Senha</label>
            <div class="input-wrap" [class.focused]="focusPass">
              <span class="input-icon">🔑</span>
              <input
                class="input"
                [type]="showPass() ? 'text' : 'password'"
                placeholder="••••••••"
                [(ngModel)]="password"
                name="password"
                autocomplete="current-password"
                (focus)="focusPass = true"
                (blur)="focusPass = false"
                required
              />
              <button type="button" class="toggle-pass"
                      (click)="showPass.set(!showPass())">
                {{ showPass() ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          @if (erro()) {
            <div class="alert-error">
              ⚠️ {{ erro() }}
            </div>
          }

          <button type="submit" class="btn-login" [disabled]="carregando()">
            @if (carregando()) {
              <span class="spinner"></span> Entrando…
            } @else {
              Entrar no sistema
            }
          </button>

        </form>

        <p class="footer-text">
          360Core © {{ ano }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-bg {
      min-height: 100vh;
      background: var(--bg);
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
    }

    .glow {
      position: absolute; border-radius: 50%; filter: blur(100px); opacity: .18; pointer-events: none;
    }
    .glow-1 { width: 500px; height: 500px; background: #f43f5e; top: -150px; left: -100px; }
    .glow-2 { width: 400px; height: 400px; background: #7c3aed; bottom: -100px; right: -80px; }

    .login-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 44px 40px;
      width: 100%; max-width: 420px;
      position: relative; z-index: 1;
      box-shadow: 0 24px 80px rgba(0,0,0,.5);
    }

    .logo {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 28px;
    }
    .logo-icon {
      width: 38px; height: 38px; border-radius: 10px;
      background: linear-gradient(135deg,#f43f5e,#fb923c);
      display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    .logo-text {
      font-family: 'Syne', sans-serif; font-weight: 800; font-size: 20px;
    }
    .logo-text em { color: #f43f5e; font-style: normal; }

    .title    { font-family: 'Syne',sans-serif; font-size: 22px; font-weight: 800; margin-bottom: 6px; }
    .subtitle { color: var(--muted); font-size: 13.5px; margin-bottom: 32px; }

    .form { display: flex; flex-direction: column; gap: 18px; }

    .field { display: flex; flex-direction: column; gap: 7px; }
    .label { font-size: 12.5px; font-weight: 600; color: var(--muted); letter-spacing: .3px; }

    .input-wrap {
      display: flex; align-items: center;
      background: var(--card); border: 1px solid var(--border);
      border-radius: 10px; padding: 0 14px;
      transition: border-color .2s, box-shadow .2s;
    }
    .input-wrap.focused {
      border-color: rgba(244,63,94,.5);
      box-shadow: 0 0 0 3px rgba(244,63,94,.12);
    }
    .input-icon { font-size: 14px; margin-right: 10px; flex-shrink: 0; }

    .input {
      flex: 1; background: transparent; border: none; outline: none;
      color: var(--text); font-size: 14px; font-family: 'Outfit',sans-serif;
      padding: 12px 0;
    }
    .input::placeholder { color: var(--muted); }

    .toggle-pass {
      background: none; border: none; cursor: pointer;
      font-size: 14px; padding: 0; line-height: 1;
    }

    .alert-error {
      background: rgba(244,63,94,.12); border: 1px solid rgba(244,63,94,.3);
      color: #f43f5e; font-size: 13px; padding: 10px 14px; border-radius: 8px;
    }

    .btn-login {
      background: linear-gradient(135deg,#f43f5e,#fb923c);
      border: none; border-radius: 10px; color: white;
      font-size: 14px; font-weight: 600; font-family: 'Outfit',sans-serif;
      padding: 13px; cursor: pointer; display: flex; align-items: center;
      justify-content: center; gap: 8px; margin-top: 4px;
      transition: opacity .2s, transform .2s;
    }
    .btn-login:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
    .btn-login:disabled { opacity: .5; cursor: not-allowed; }

    .spinner {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.3);
      border-top-color: white; border-radius: 50%;
      animation: spin .7s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .footer-text { text-align: center; font-size: 11.5px; color: var(--muted); margin-top: 28px; }
  `],
})
export class LoginComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  username   = '';
  password   = '';
  focusUser  = false;
  focusPass  = false;
  showPass   = signal(false);
  carregando = signal(false);
  erro       = signal('');
  ano        = new Date().getFullYear();

  onSubmit() {
    if (!this.username || !this.password) {
      this.erro.set('Preencha usuário e senha.');
      return;
    }
    this.erro.set('');
    this.carregando.set(true);

    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => this.router.navigate(['/financeiro/inadimplencia']),
      error: (e: Error) => {
        this.erro.set(e.message);
        this.carregando.set(false);
      },
    });
  }
}
