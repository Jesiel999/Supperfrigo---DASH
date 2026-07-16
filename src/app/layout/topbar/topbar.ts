import {
  Component, output, signal, inject,
  computed, HostListener, OnInit,
} from '@angular/core';
import {
  Router, NavigationEnd, RouterLink, RouterLinkActive
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import { EmpresaFilterService } from '../../shared/services/empresa-filter.service';
import { MenuStateService } from '../../shared/services/menu-state.service';
import { AplicacaoMenu } from '../../shared/models/usuario.models';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  styles: [`
    .topbar {
      background: var(--surface); border-bottom: 1px solid var(--border);
      display: flex; align-items: center; padding: 0 20px;
      height: var(--topbar-h); gap: 4px; flex-shrink: 0;
      position: relative; z-index: 9999; 
    }

    .menu-btn {
      display: none; background: none; border: none;
      color: var(--text); font-size: 20px; cursor: pointer; padding: 4px 8px 4px 0;
    }
    @media (max-width: 768px) { .menu-btn { display: flex; } }

    .tabs { display: flex; align-items: center; gap: 2px; height: 100%; flex: 1; }
    .tabs::-webkit-scrollbar { height: 0; }
    @media (max-width: 768px)  { .hide-mobile { display: none !important; } }

    .tab {
      padding: 6px 14px; border-radius: 8px; font-size: 12.5px; font-weight: 500;
      color: var(--muted); text-decoration: none; transition: all .18s;
      white-space: nowrap; display: flex; align-items: center; gap: 5px; flex-shrink: 0;
      position: relative;
    }
    .tab:hover { color: var(--text); }
    .tab.active { color: white; background: rgba(255,255,255,.08); }
    .tab.active::after {
      content: ''; position: absolute; bottom: -14px; left: 50%;
      transform: translateX(-50%); width: 60%; height: 2px;
      background: #f43f5e; border-radius: 2px 2px 0 0;
    }

    .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

    .filter-btn {
      display: flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,.06); border: 1px solid var(--border);
      border-radius: 8px; color: var(--text); font-size: 12px;
      font-family: 'Outfit', sans-serif; padding: 5px 10px;
      cursor: pointer; transition: background .18s; white-space: nowrap;
    }
    .filter-btn:hover { background: rgba(255,255,255,.10); }

    .badge {
      background: #f43f5e; color: white; font-size: 9px; font-weight: 700;
      padding: 1px 5px; border-radius: 20px; min-width: 16px; text-align: center;
    }

    .chevron { font-size: 10px; color: var(--muted); transition: transform .2s; }
    .chevron.rot { transform: rotate(180deg); }

    .empresa-filter { position: relative; }

    .dropdown {
      position: absolute; top: calc(100% + 8px); right: 0;
      min-width: 260px; background: var(--surface);
      border: 1px solid rgba(255,255,255,.1); border-radius: 12px;
      box-shadow: 0 16px 48px rgba(0,0,0,.5); overflow: hidden;
      z-index: 1000; animation: fadeDown .15s ease;
    }
    @keyframes fadeDown {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .dd-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 11px 14px 9px; border-bottom: 1px solid var(--border);
    }
    .dd-title { font-size: 12px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 6px; }
    .dd-badge-restrito {
      font-size: 9px; background: rgba(251,146,60,.15); color: #fb923c;
      border: 1px solid rgba(251,146,60,.3); padding: 1px 6px; border-radius: 10px;
    }
    .btn-text { background: none; border: none; color: #f43f5e; font-size: 11px; cursor: pointer; font-family: 'Outfit', sans-serif; padding: 0; }
    .btn-text:hover { text-decoration: underline; }

    .dd-list { max-height: 240px; overflow-y: auto; padding: 6px 0; }
    .dd-list::-webkit-scrollbar { width: 4px; }
    .dd-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

    .dd-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 14px; cursor: pointer; transition: background .12s;
    }
    .dd-item:hover { background: rgba(255,255,255,.04); }

    .chk { width: 15px; height: 15px; accent-color: #f43f5e; cursor: pointer; flex-shrink: 0; }
    .emp-nome { font-size: 12.5px; color: var(--text); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .emp-codigo { font-size: 10px; color: var(--muted); font-family: 'JetBrains Mono', monospace; flex-shrink: 0; }

    .dd-footer { padding: 8px 14px; border-top: 1px solid var(--border); font-size: 11px; color: var(--muted); }
  `],
  template: `
    <header class="topbar">
      <button class="menu-btn" (click)="menuToggle.emit()">☰</button>

      @if (currentTabs().length > 0) {
        <nav class="tabs hide-mobile">
          @for (tab of currentTabs(); track tab.route) {
            <a class="tab" [routerLink]="tab.route" routerLinkActive="active">
              {{ tab.label }}
            </a>
          }
        </nav>
      }

      <div class="topbar-right">
        @if (filter.empresasVisiveis().length > 0) {
          <div class="empresa-filter">
            <button class="filter-btn" (click)="toggleEmpresa($event)">
              🏢
              <span class="hide-mobile">{{ labelEmpresas() }}</span>
              @if (!filter.todasSelecionadas()) {
                <span class="badge">{{ filter.selecionadas().size }}</span>
              }
              <span class="chevron" [class.rot]="dropdownEmpresa()">▾</span>
            </button>

            @if (dropdownEmpresa()) {
              <div class="dropdown" (click)="$event.stopPropagation()">
                <div class="dd-header">
                  <span class="dd-title">
                    Empresas
                    @if (!filter.semRestricao()) {
                      <span class="dd-badge-restrito">restrito</span>
                    }
                  </span>
                  <button class="btn-text" (click)="filter.toggleTodas()">
                    {{ filter.todasSelecionadas() ? 'Desmarcar todas' : 'Marcar todas' }}
                  </button>
                </div>

                <div class="dd-list">
                  @for (emp of filter.empresasVisiveis(); track emp.codigo) {
                    <label class="dd-item">
                      <input
                        type="checkbox"
                        class="chk"
                        [checked]="filter.estaSelecionada(emp.codigo)"
                        (change)="filter.toggle(emp.codigo)"
                      />
                      <span class="emp-nome">{{ emp.nome }}</span>
                      <span class="emp-codigo">{{ emp.codigo }}</span>
                    </label>
                  }
                </div>

                <div class="dd-footer">
                  @if (filter.todasSelecionadas()) {
                    Todas visíveis
                  } @else {
                    {{ filter.selecionadas().size }} / {{ filter.empresasVisiveis().length }} selecionadas
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </header>
  `,
})
export class TopbarComponent implements OnInit {
  readonly menuToggle = output<void>();

  readonly auth = inject(AuthService);
  readonly filter = inject(EmpresaFilterService);
  readonly menuState = inject(MenuStateService);
  readonly router = inject(Router);

  readonly dropdownEmpresa = signal(false);
  readonly currentUrl = signal('');

  readonly currentAplicacao = computed((): AplicacaoMenu | null => {
    const url = this.currentUrl();
    for (const sis of this.menuState.sistemas()) {
      const ap = sis.aplicacoes.find(a => a.modulos.some(m => m.rota && url.startsWith(m.rota)));
      if (ap) return ap;
    }
    return null;
  });

  readonly currentTabs = computed(() => {
    const ap = this.currentAplicacao();
    if (!ap) return [];
    return ap.modulos
      .filter(m => !!m.rota)
      .map(m => ({ label: m.nome, route: m.rota as string }));
  });

  readonly labelEmpresas = computed(() => {
    if (this.filter.todasSelecionadas()) return 'Todas as empresas';
    const qtd = this.filter.selecionadas().size;
    return `${qtd} empresa${qtd > 1 ? 's' : ''}`;
  });

  ngOnInit() {
    this.currentUrl.set(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUrl.set(this.router.url);
      });
  }

  toggleEmpresa(e: Event) {
    e.stopPropagation();
    this.dropdownEmpresa.update(v => !v);
  }

  @HostListener('document:click')
  fecharDropdowns() {
    this.dropdownEmpresa.set(false);
  }
}