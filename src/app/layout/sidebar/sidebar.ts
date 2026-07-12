import { Component, input, output, inject, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Usuario } from '../../shared/models/usuario.models';
import { AuthService } from '../../auth/services/auth.service';
import { MenuStateService } from '../../shared/services/menu-state.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.open]="open()">
      <div class="logo">
        <span class="logo-text">Core<em>View</em></span>
        <button class="close-btn" (click)="fechar.emit()">✕</button>
      </div>

      <nav class="nav-scroll">
        @for (sis of sistemasOrdenados(); track sis.slug) {
          <div class="sistema-block">
            <p class="sistema-label">{{ sis.nome }}</p>

            @for (ap of sis.aplicacoes; track ap.slug) {
              <div class="aplicacao-block">
                <button
                  class="aplicacao-btn"
                  [class.expandida]="aplicacaoAberta() === ap.slug"
                  (click)="toggleAplicacao(ap.slug)"
                >
                  <span class="ap-nome">{{ ap.nome }}</span>
                  <span class="ap-chevron" [class.rot]="aplicacaoAberta() === ap.slug">▾</span>
                </button>

                @if (aplicacaoAberta() === ap.slug) {
                  <div class="modulos-list">
                    @for (mo of ap.modulos; track mo.codigo) {
                      @if (mo.rota) {
                        <a class="nav-item" [routerLink]="mo.rota" routerLinkActive="active" (click)="fechar.emit()">
                          <span class="nav-icon">•</span><span>{{ mo.nome }}</span>
                        </a>
                      }
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </nav>

      <div class="sidebar-bottom">
        <div class="user-card">
          <div class="avatar">{{ initials() }}</div>
          <div class="user-info">
            <div class="user-name">{{ usuario()?.nome ?? 'Usuário' }}</div>
            <div class="user-perfil_id">{{ auth.perfilNome() }}</div>
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
      position: sticky; top: 0; flex-shrink: 0;
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
    .logo-text  { font-family:'Syne',sans-serif;font-weight:800;font-size:16px;letter-spacing:-.5px;flex:1; }
    .logo-text em { color:#f43f5e;font-style:normal; }

    .nav-scroll { flex: 1; overflow-y: auto; }

    /* ── Nível 1: Sistema ─────────────────────────────────────── */
    .sistema-block { padding-top: 10px; }
    .sistema-block + .sistema-block { border-top: 1px solid var(--border); margin-top: 8px; }
    .sistema-label {
      font-size: 9.5px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase;
      color: #f43f5e; padding: 0 16px; margin-bottom: 4px;
    }

    /* ── Nível 2: Aplicação (acordeão) ───────────────────────── */
    .aplicacao-block { padding: 0 10px; }

    .aplicacao-btn {
      width: 100%; display: flex; align-items: center; justify-content: space-between;
      background: none; border: none; cursor: pointer;
      padding: 9px 8px; border-radius: 8px;
      font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500;
      color: var(--text); transition: background .15s;
    }
    .aplicacao-btn:hover { background: rgba(255,255,255,.05); }
    .aplicacao-btn.expandida { background: rgba(244,63,94,.08); color: #f43f5e; }

    .ap-chevron { font-size: 10px; color: var(--muted); transition: transform .2s; }
    .ap-chevron.rot { transform: rotate(180deg); }
    .aplicacao-btn.expandida .ap-chevron { color: #f43f5e; }

    /* ── Nível 3: Módulo ──────────────────────────────────────── */
    .modulos-list { padding: 2px 0 6px 8px; }

    .nav-item {
      display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:8px;
      font-size:12.5px;color:var(--muted);text-decoration:none;
      transition:all .18s;position:relative;margin-bottom:1px;
    }
    .nav-item:hover { background:rgba(255,255,255,.05);color:var(--text); }
    .nav-item.active { background:rgba(244,63,94,.12);color:#f43f5e;font-weight:500; }
    .nav-item.active::before { content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:60%;background:#f43f5e;border-radius:0 4px 4px 0; }
    .nav-icon { font-size:12px;width:15px;text-align:center;flex-shrink:0; }

    .sidebar-bottom { margin-top:auto;padding:12px 10px;border-top:1px solid var(--border);flex-shrink:0; }
    .user-card { display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;margin-bottom:8px; }
    .avatar { width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#2563eb);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0; }
    .user-name { font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .user-perfil_id { font-size:11px;color:var(--muted); }
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
  protected readonly menuState = inject(MenuStateService);

  // ── Controla qual aplicação está expandida — só uma por vez ────
  readonly aplicacaoAberta = signal<string | null>(null);

  toggleAplicacao(slug: string) {
    this.aplicacaoAberta.update(atual => (atual === slug ? null : slug));
  }

  readonly sistemasOrdenados = computed(() => {
    return [...this.menuState.sistemas()].sort((a, b) => {
      const aConfig = a.slug?.toLowerCase() === 'config';
      const bConfig = b.slug?.toLowerCase() === 'config';

      if (aConfig && !bConfig) return 1;
      if (!aConfig && bConfig) return -1;

      return a.nome.localeCompare(b.nome);
    });
  });

  initials(): string {
    const nome = this.usuario()?.nome ?? 'U';
    return nome.split(' ').map((x: string) => x[0]).slice(0, 2).join('').toUpperCase();
  }
}