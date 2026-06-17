import { Component, input, output, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Usuario } from '../../shared/models/financeiro.models';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.open]="open()">
      <div class="logo">
        <span class="logo-text">Dash<em>GSC</em></span>
        <button class="close-btn" (click)="fechar.emit()">✕</button>
      </div>

      <div class="nav-section">
        <p class="section-label">Sances</p>
        <a class="nav-item" routerLink="/financeiro/inadimplencia" routerLinkActive="active" (click)="fechar.emit()">
          <span class="nav-icon">💸</span><span>Financeiro</span>
        </a>
      </div>
      <div class="nav-section">
        <p class="section-label">Sults</p>
        <a class="nav-item" routerLink="/chamados/geral" routerLinkActive="active" (click)="fechar.emit()">
          <span class="nav-icon">📊</span><span>Geral</span>
        </a>
      </div>

      @if (auth.isAdmin()) {
        <div class="nav-section">
          <p class="section-label">Administração</p>
          <a class="nav-item admin-item" routerLink="/admin/usuarios" routerLinkActive="active" (click)="fechar.emit()">
            <span class="nav-icon">👥</span><span>Usuários</span>
          </a>
          <a class="nav-item admin-item" routerLink="/admin/permissoes" routerLinkActive="active" (click)="fechar.emit()">
            <span class="nav-icon">🔐</span><span>Perfis & Permissões</span>
          </a>
        </div>
      }

      <div class="sidebar-bottom">
        <div class="user-card">
          <div class="avatar">{{ initials() }}</div>
          <div class="user-info">
            <div class="user-name">{{ usuario()?.nome ?? 'Usuário' }}</div>
            <div class="user-role">{{ getRoleLabel() }}</div>
          </div>
        </div>
        <button class="btn-sair" (click)="sair.emit()">⏻ Sair</button>
      </div>
    </aside>
    @if (open()) {
      <div class="sidebar-overlay" (click)="fechar.emit()"></div>
    }
  `,
  styles: [`
    .sidebar {
      width: 240px; background: var(--surface); border-right: 1px solid var(--border);
      display: flex; flex-direction: column; height: 100vh;
      position: sticky; top: 0; overflow-y: auto; flex-shrink: 0;
      transition: transform .3s ease; z-index: 200;
    }
    .close-btn { display:none; background:none; border:none; color:var(--muted); cursor:pointer; font-size:16px; padding:0; }
    .sidebar-overlay { display:none; }

    @media (max-width: 768px) {
      .sidebar { position:fixed; top:0; left:0; transform:translateX(-100%); width:260px; box-shadow:4px 0 20px rgba(0,0,0,.5); }
      .sidebar.open { transform:translateX(0); }
      .close-btn { display:flex; }
      .sidebar-overlay { display:block; position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:199; }
    }

    .logo { padding:18px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px; flex-shrink:0; }
    .logo-icon { width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#f43f5e,#fb923c);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0; }
    .logo-text  { font-family:'Syne',sans-serif;font-weight:800;font-size:16px;letter-spacing:-.5px;flex:1; }
    .logo-text em { color:#f43f5e;font-style:normal; }

    .nav-section { padding:14px 10px 4px; }
    .section-label { font-size:10px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);padding:0 8px;margin-bottom:4px; }

    .nav-item {
      display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;
      font-size:13px;color:var(--muted);text-decoration:none;
      transition:all .18s;position:relative;margin-bottom:1px;
    }
    .nav-item:hover { background:rgba(255,255,255,.05);color:var(--text); }
    .nav-item.active { background:rgba(244,63,94,.12);color:#f43f5e;font-weight:500; }
    .nav-item.active::before { content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:60%;background:#f43f5e;border-radius:0 4px 4px 0; }
    .admin-item.active { background:rgba(167,139,250,.12);color:#a78bfa; }
    .admin-item.active::before { background:#a78bfa; }
    .nav-icon { font-size:14px;width:17px;text-align:center;flex-shrink:0; }
    .nav-badge { background:#f43f5e;color:white;font-size:10px;font-weight:600;padding:2px 6px;border-radius:20px;font-family:'JetBrains Mono',monospace;margin-left:auto; }

    .sidebar-bottom { margin-top:auto;padding:12px 10px;border-top:1px solid var(--border);flex-shrink:0; }
    .user-card { display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;margin-bottom:8px; }
    .avatar { width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#2563eb);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0; }
    .user-name { font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .user-role { font-size:11px;color:var(--muted); }
    .btn-sair { width:100%;background:rgba(244,63,94,.08);border:1px solid rgba(244,63,94,.2);border-radius:8px;color:#f43f5e;font-size:12px;font-weight:500;font-family:'Outfit',sans-serif;padding:7px;cursor:pointer;transition:background .18s; }
    .btn-sair:hover { background:rgba(244,63,94,.2); }
  `],
})
export class SidebarComponent {
  readonly usuario = input<Usuario | null>(null);
  readonly open    = input<boolean>(false);
  readonly sair    = output<void>();
  readonly fechar  = output<void>();
  protected readonly auth = inject(AuthService);

  private readonly roleLabels: Record<string, string> = {
    admin:'Administrador', gestor:'Gestor Financeiro', analista:'Analista', operador:'Operador'
  };

  getRoleLabel(): string {
    const role = this.usuario()?.perfil_nome;
    if (!role) return '';
    return this.roleLabels[role] ?? role;
  }

  initials(): string {
    const nome = this.usuario()?.nome ?? 'U';
    return nome.split(' ').map((x: string) => x[0]).slice(0, 2).join('').toUpperCase();
  }
}
