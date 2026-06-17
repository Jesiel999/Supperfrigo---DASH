import {
  Component, output, signal, inject,
  computed, HostListener, OnInit,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService }          from '../../auth/services/auth.service';
import { EmpresaFilterService } from '../../shared/services/empresa-filter.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <button class="menu-btn" (click)="menuToggle.emit()">☰</button>

      <nav class="tabs hide-mobile">
        <a class="tab" routerLink="/financeiro/inadimplencia" routerLinkActive="active">Inadimplência</a>
        <a class="tab" routerLink="/financeiro/cobrancas"     routerLinkActive="active">Cobranças</a>
        <a class="tab" routerLink="/financeiro/dre"           routerLinkActive="active">DRE</a>
        <a class="tab" routerLink="/financeiro/pmp"           routerLinkActive="active">PMP</a>
        <a class="tab hide-tablet" routerLink="/financeiro/contas-receber" routerLinkActive="active">Receber</a>
        <a class="tab hide-tablet" routerLink="/financeiro/contas-pagar"   routerLinkActive="active">Pagar</a>
        <a class="tab hide-tablet" routerLink="/financeiro/fluxo-caixa"    routerLinkActive="active">Fluxo</a>
        <a class="tab hide-tablet" routerLink="/financeiro/aging-report"   routerLinkActive="active">Aging</a>
      </nav>

      <div class="topbar-right">

        <!-- ── Filtro de Empresas ─────────────────────────── -->
        <!--
          Mostra quando:
          - Usuário tem empresas no JWT (restrição definida), OU
          - Usuário sem restrição e já carregou dados (empresasVisiveis > 0)
        -->
        @if (filter.empresasVisiveis().length > 0) {
          <div class="empresa-filter" [class.open]="dropdownEmpresa()">

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

        <!-- ── Seletor de Tenant ──────────────────────────── 
        @if (auth.isMultiTenant()) {
          <div class="tenant-filter" [class.open]="dropdownTenant()">

            <button class="filter-btn tenant-btn" (click)="toggleTenant($event)">
              🏛
              <span class="hide-mobile">{{ auth.tenantAtual()?.nome }}</span>
              <span class="chevron" [class.rot]="dropdownTenant()">▾</span>
            </button>

            @if (dropdownTenant()) {
              <div class="dropdown" (click)="$event.stopPropagation()">

                <div class="dd-header">
                  <span class="dd-title">Trocar contexto</span>
                </div>

                <div class="dd-list">
                  @for (t of auth.tenants(); track t.id) {
                    <button
                      class="dd-item tenant-item"
                      [class.ativo]="t.id === auth.tenantAtual()?.id"
                      (click)="trocarTenant(t.id)"
                    >
                      <span class="tenant-dot" [class.ativo]="t.id === auth.tenantAtual()?.id"></span>
                      {{ t.nome }}
                    </button>
                  }
                </div>

              </div>
            }
          </div>
        }-->

        <!-- ── Usuário ────────────────────────────────────── -->
        @if (auth.usuario()) {
          <div class="usuario-info hide-mobile">
            <span class="usr-nome">{{ primeiroNome() }}</span>
            <span
              class="usr-perfil"
              [style.color]="auth.usuario()!.perfil_cor || '#64748b'"
            >
              {{ auth.perfilNome() }}
            </span>
          </div>
        }

      </div>
    </header>
  `,
  styles: [`
    .topbar {
      background: var(--surface); border-bottom: 1px solid var(--border);
      display: flex; align-items: center; padding: 0 20px;
      height: var(--topbar-h); gap: 4px; flex-shrink: 0;
      position: relative; z-index: 100;
    }

    .menu-btn {
      display: none; background: none; border: none;
      color: var(--text); font-size: 20px; cursor: pointer; padding: 4px 8px 4px 0;
    }
    @media (max-width: 768px) { .menu-btn { display: flex; } }

    .tabs { display: flex; align-items: center; gap: 2px; height: 100%; overflow-x: auto; flex: 1; }
    .tabs::-webkit-scrollbar { height: 0; }
    @media (max-width: 768px)  { .hide-mobile { display: none !important; } }
    @media (max-width: 1024px) { .hide-tablet { display: none !important; } }

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
    .tenant-btn { border-color: rgba(99,102,241,.3); }

    .badge {
      background: #f43f5e; color: white; font-size: 9px; font-weight: 700;
      padding: 1px 5px; border-radius: 20px; min-width: 16px; text-align: center;
    }

    .chevron { font-size: 10px; color: var(--muted); transition: transform .2s; }
    .chevron.rot { transform: rotate(180deg); }

    .empresa-filter, .tenant-filter { position: relative; }

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

    .tenant-item {
      width: 100%; background: none; border: none;
      font-family: 'Outfit', sans-serif; font-size: 12.5px;
      text-align: left; cursor: pointer; color: var(--text);
      display: flex; align-items: center; gap: 8px;
    }
    .tenant-item.ativo { color: #6366f1; font-weight: 600; }
    .tenant-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--border); flex-shrink: 0; }
    .tenant-dot.ativo { background: #6366f1; }

    .usuario-info { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.3; }
    .usr-nome   { font-size: 12.5px; color: var(--text); font-weight: 500; }
    .usr-perfil { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .03em; }
  `],
})
export class TopbarComponent implements OnInit {
  readonly menuToggle = output<void>();

  readonly auth   = inject(AuthService);
  readonly filter = inject(EmpresaFilterService);

  readonly dropdownEmpresa = signal(false);
  readonly dropdownTenant  = signal(false);

  readonly labelEmpresas = computed(() => {
    if (this.filter.todasSelecionadas()) return 'Todas as empresas';
    const qtd = this.filter.selecionadas().size;
    return `${qtd} empresa${qtd > 1 ? 's' : ''}`;
  });

  readonly primeiroNome = computed(() =>
    this.auth.usuario()?.nome?.split(' ')[0] ?? ''
  );

  ngOnInit() {}

  toggleEmpresa(e: Event) {
    e.stopPropagation();
    this.dropdownTenant.set(false);
    this.dropdownEmpresa.update(v => !v);
  }

  toggleTenant(e: Event) {
    e.stopPropagation();
    this.dropdownEmpresa.set(false);
    this.dropdownTenant.update(v => !v);
  }

  trocarTenant(tenantId: number) {
    this.dropdownTenant.set(false);
    this.auth.trocarTenant(tenantId).subscribe({
      next:  () => window.location.reload(),
      error: (e: Error) => console.error(e.message),
    });
  }

  @HostListener('document:click')
  fecharDropdowns() {
    this.dropdownEmpresa.set(false);
    this.dropdownTenant.set(false);
  }
}
