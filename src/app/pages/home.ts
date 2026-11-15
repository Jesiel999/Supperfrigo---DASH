// src/app/pages/home.ts — tela inicial (todos os usuários caem aqui depois do login)
// Os cartões vêm das rotas (data: menu(...)) filtradas pelo seu AuthService.temPermissao.
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeToggleComponent } from '../shared/components/theme-toggle/theme-toggle';
import { HomeService, ORDEM_CATEGORIAS } from '../shared/services/admin/home.service';
import { ItemHome } from '../shared/models/admin/home.models';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, ThemeToggleComponent],
  template: `
    <div class="home">
      <!-- Topo: saudação, busca e tema -->
      <section class="hero">
        <div class="hero-txt">
          <p class="hero-data">{{ dataHoje }}</p>
          <h1 class="hero-titulo">{{ saudacao }}@if (home.nomeUsuario()) {, <span>{{ home.nomeUsuario() }}</span>}</h1>
        </div>
        <div class="hero-acoes">
          <input type="search" class="busca" placeholder="Buscar sistema ou tela…"
                 [value]="busca()" (input)="busca.set($any($event.target).value)" />
          <app-theme-toggle />
        </div>
      </section>

      @if (busca().trim()) {
        <!-- Resultado da busca -->
        <section class="bloco">
          <h2 class="bloco-titulo">Resultados <small>{{ resultadoBusca().length }}</small></h2>
          @if (resultadoBusca().length) {
            <div class="grade">
              @for (m of resultadoBusca(); track m.id) {
                <ng-container [ngTemplateOutlet]="cartao" [ngTemplateOutletContext]="{ $implicit: m }" />
              }
            </div>
          } @else {
            <p class="vazio">Nada encontrado para “{{ busca() }}”.</p>
          }
        </section>
      } @else {
        <!-- Favoritos -->
        @if (favoritos().length) {
          <section class="bloco">
            <h2 class="bloco-titulo">⭐ Favoritos</h2>
            <div class="grade">
              @for (m of favoritos(); track m.id) {
                <ng-container [ngTemplateOutlet]="cartao" [ngTemplateOutletContext]="{ $implicit: m }" />
              }
            </div>
          </section>
        }

        <!-- Recentes -->
        @if (recentes().length) {
          <section class="bloco">
            <h2 class="bloco-titulo">🕘 Acessados recentemente</h2>
            <div class="chips">
              @for (m of recentes(); track m.id) {
                <button type="button" class="chip" (click)="abrir(m)">{{ m.icone }} {{ m.titulo }}</button>
              }
            </div>
          </section>
        }

        <!-- Widgets -->
        <section class="widgets">
          @if (home.temPermissao('chamados_geral')) {
          <article class="widget">
            <header class="widget-topo">
              <h3>🎫 Meus chamados</h3>
              <a type="button" class="link" href="https://supperfrigo.sults.com.br/ordem-servico/novo" target="_blank" rel="noopener noreferrer">Ver todos</a>
            </header>
            @if (home.resumoChamados(); as r) {
              <div class="numeros">
                <div><strong>{{ r.abertos }}</strong><span>Abertos</span></div>
                <div [class.alerta]="r.aguardandoVoce > 0"><strong>{{ r.aguardandoVoce }}</strong><span>Aguardando você</span></div>
                <div [class.alerta]="r.vencendoHoje > 0"><strong>{{ r.vencendoHoje }}</strong><span>Vencem hoje</span></div>
              </div>
            } @else {
              <p class="vazio">Integração com o sistema de chamados ainda não conectada.</p>
            }
            <a type="button" class="btn-principal" href="https://supperfrigo.sults.com.br/ordem-servico/novo" target="_blank" rel="noopener noreferrer">Abrir chamado</a>
          </article>
          }

          <article class="widget">
            <header class="widget-topo"><h3>📣 Avisos e comunicados</h3></header>
            @if (home.avisos().length) {
              <ul class="avisos">
                @for (a of home.avisos(); track a.id) {
                  <li>
                    <div class="aviso-linha">
                      @if (a.tag) { <span class="tag" [class]="'tag tag-' + a.tag.toLowerCase()">{{ a.tag }}</span> }
                      <span class="aviso-data">{{ formatarData(a.data) }}</span>
                    </div>
                    <div class="aviso-titulo">{{ a.titulo }}</div>
                  </li>
                }
              </ul>
            } @else {
              <p class="vazio">Nenhum aviso no momento.</p>
            }
          </article>

          <article class="widget">
            <header class="widget-topo"><h3>🔌 Status das integrações</h3></header>
            @if (home.integracoes().length) {
              <ul class="integracoes">
                @for (i of home.integracoes(); track i.nome) {
                  <li>
                    <span class="ponto" [class]="'ponto ponto-' + i.status" [title]="rotuloStatus(i.status)"></span>
                    <span class="int-nome">{{ i.nome }}</span>
                    <span class="int-hora">{{ i.atualizadoEm ? formatarDataHora(i.atualizadoEm) : '—' }}</span>
                  </li>
                }
              </ul>
            } @else {
              <p class="vazio">Sem informações de sincronização.</p>
            }
          </article>
        </section>

        <!-- Todos os sistemas, por categoria -->
        @for (g of grupos(); track g.categoria) {
          <section class="bloco">
            <h2 class="bloco-titulo">{{ g.categoria }}</h2>
            <div class="grade">
              @for (m of g.itens; track m.id) {
                <ng-container [ngTemplateOutlet]="cartao" [ngTemplateOutletContext]="{ $implicit: m }" />
              }
            </div>
          </section>
        }
      }
    </div>

    <!-- Cartão de sistema -->
    <ng-template #cartao let-m>
      <div class="cartao" role="button" tabindex="0" (click)="abrir(m)" (keydown.enter)="abrir(m)">
        <div class="cartao-icone">{{ m.icone }}</div>
        <div class="cartao-corpo">
          <div class="cartao-titulo">{{ m.titulo }}@if (m.sistema) { <span class="selo">{{ m.sistema }}</span> }</div>
          <div class="cartao-desc">{{ m.descricao }}</div>
        </div>
        <button type="button" class="fav" [class.on]="ehFavorito(m.id)"
                [attr.aria-label]="ehFavorito(m.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'"
                (click)="alternarFavorito($event, m)">★</button>
      </div>
    </ng-template>
  `,
  styles: [`
    .home{display:flex;flex-direction:column;gap:26px;padding:24px;max-width:1280px;margin:0 auto}

    /* topo */
    .hero{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;padding:24px 26px;border:1px solid var(--border);border-radius:18px;background:
      radial-gradient(900px 220px at 0% 0%, var(--accent-soft, rgba(244,63,94,.10)), transparent 60%), var(--card)}
    .hero-data{margin:0 0 6px;font-size:12px;color:var(--muted);text-transform:capitalize}
    .hero-titulo{margin:0;font-family:'Syne',sans-serif;font-size:28px;font-weight:800;letter-spacing:-.5px;color:var(--text-strong)}
    .hero-titulo span{color:var(--info)}
    .hero-sub{margin:6px 0 0;font-size:13px;color:var(--muted)}
    .hero-acoes{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .busca{min-width:260px;background:var(--tint-2);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:'Outfit',sans-serif;padding:8px 12px;outline:none;color-scheme:var(--color-scheme)}
    .busca:focus{border-color:var(--info)}

    /* blocos */
    .bloco{display:flex;flex-direction:column;gap:12px}
    .bloco-titulo{margin:0;font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:var(--text-strong)}
    .bloco-titulo small{color:var(--muted);font-weight:500;margin-left:6px}
    .vazio{margin:0;font-size:12.5px;color:var(--muted)}

    .grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
    .cartao{position:relative;display:flex;gap:14px;align-items:flex-start;padding:16px;background:var(--card);border:1px solid var(--border);border-radius:14px;cursor:pointer;transition:transform .15s,border-color .15s,box-shadow .15s}
    .cartao:hover,.cartao:focus-visible{transform:translateY(-2px);border-color:var(--info);box-shadow:0 10px 24px var(--shadow-color);outline:none}
    .cartao-icone{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--tint-2);font-size:22px;flex-shrink:0}
    .cartao-corpo{min-width:0;flex:1;padding-right:22px}
    .cartao-titulo{font-size:14px;font-weight:600;color:var(--text-strong)}
    .selo{font-size:10px;font-weight:600;color:var(--muted);background:var(--tint-3);border-radius:999px;padding:1px 7px;margin-left:6px;vertical-align:middle}
    .cartao-desc{margin-top:4px;font-size:12px;line-height:1.5;color:var(--muted)}
    .fav{position:absolute;top:10px;right:10px;border:none;background:transparent;color:var(--muted);font-size:16px;cursor:pointer;opacity:.5;transition:opacity .15s,color .15s}
    .cartao:hover .fav{opacity:1}
    .fav.on{color:#fbbf24;opacity:1}

    .chips{display:flex;gap:8px;flex-wrap:wrap}
    .chip{background:var(--tint-2);border:1px solid var(--border);color:var(--text);font-size:12px;font-family:'Outfit',sans-serif;padding:6px 12px;border-radius:999px;cursor:pointer;transition:background .15s}
    .chip:hover{background:var(--tint-3)}

    /* widgets */
    .widgets{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}
    .widget{display:flex;flex-direction:column;gap:12px;padding:18px;background:var(--card);border:1px solid var(--border);border-radius:14px;min-width:0}
    .widget-topo{display:flex;justify-content:space-between;align-items:center;gap:8px}
    .widget-topo h3{margin:0;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:var(--text-strong)}
    .link{background:none;border:none;text-decoration: none; color:var(--info);font-size:12px;cursor:pointer;font-family:'Outfit',sans-serif}
    .link:hover{text-decoration:underline}
    .numeros{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .numeros div{display:flex;flex-direction:column;gap:2px;padding:10px;border-radius:10px;background:var(--tint-1);text-align:center}
    .numeros strong{font-size:22px;font-weight:700;color:var(--text-strong)}
    .numeros span{font-size:11px;color:var(--muted)}
    .numeros .alerta strong{color:var(--warn)}
    .btn-principal{align-self:flex-start;text-decoration: none;background:var(--accent);color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:600;font-family:'Outfit',sans-serif;padding:8px 16px;cursor:pointer;transition:background .15s}
    .btn-principal:hover{background:var(--accent-hover)}

    .avisos,.integracoes{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
    .aviso-linha{display:flex;align-items:center;gap:8px}
    .aviso-data{font-size:11px;color:var(--muted)}
    .aviso-titulo{margin-top:3px;font-size:12.5px;color:var(--text)}
    .tag{font-size:10px;font-weight:600;padding:2px 8px;border-radius:999px;background:var(--tint-3);color:var(--text)}
    .tag-importante{background:rgba(244,63,94,.15);color:var(--accent)}
    .tag-novidade{background:rgba(56,189,248,.15);color:var(--info)}
    .tag-manutenção{background:rgba(251,146,60,.18);color:var(--warn)}

    .integracoes li{display:flex;align-items:center;gap:10px;font-size:12.5px}
    .ponto{width:9px;height:9px;border-radius:50%;flex-shrink:0;background:var(--muted)}
    .ponto-ok{background:var(--pos)}
    .ponto-atrasado{background:var(--warn)}
    .ponto-erro{background:var(--neg)}
    .int-nome{flex:1;color:var(--text)}
    .int-hora{color:var(--muted);font-size:11px}

    @media (max-width:640px){.home{padding:14px}.busca{min-width:0;width:100%}.hero-titulo{font-size:22px}}
  `],
})
export class HomeComponent implements OnInit {
  protected readonly home = inject(HomeService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.home.carregarWidgets();
    // mantém o status das integrações fresco enquanto a Home estiver aberta
    interval(5 * 60_000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.home.carregarIntegracoes());
  }

  protected rotuloStatus(status: 'ok' | 'atrasado' | 'erro'): string {
    return status === 'ok' ? 'Em dia' : status === 'atrasado' ? 'Atrasado' : 'Sem atualização';
  }
  private readonly router = inject(Router);

  protected readonly busca = signal('');

  protected readonly dataHoje = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date());

  protected readonly saudacao = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  })();

  private _norm(v: string): string {
    return (v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  private readonly _porId = computed(() => new Map(this.home.itensLiberados().map(m => [m.id, m])));

  protected readonly favoritos = computed(() =>
    this.home.favoritos().map(id => this._porId().get(id)).filter((m): m is ItemHome => !!m)
  );

  protected readonly recentes = computed(() =>
    this.home.recentes().map(id => this._porId().get(id)).filter((m): m is ItemHome => !!m)
  );

  protected readonly grupos = computed(() =>
    ORDEM_CATEGORIAS
      .map(categoria => ({ categoria, itens: this.home.itensLiberados().filter(m => m.categoria === categoria) }))
      .filter(g => g.itens.length > 0)
  );

  protected readonly resultadoBusca = computed(() => {
    const q = this._norm(this.busca().trim());
    if (!q) return [];
    return this.home.itensLiberados().filter(m =>
      this._norm(`${m.titulo} ${m.descricao} ${m.categoria} ${m.sistema ?? ''}`).includes(q)
    );
  });

  protected ehFavorito(id: string): boolean {
    return this.home.favoritos().includes(id);
  }

  protected alternarFavorito(ev: Event, m: ItemHome): void {
    ev.stopPropagation();
    this.home.alternarFavorito(m.id);
  }

  protected abrir(m: ItemHome): void {
    this.home.registrarAcesso(m.id);
    this.router.navigateByUrl(m.rota);
  }

  protected irPara(rota: string): void {
    this.router.navigateByUrl(rota);
  }

  protected formatarData(iso: string): string {
    const [a, m, d] = (iso ?? '').slice(0, 10).split('-');
    return d && m && a ? `${d}/${m}/${a}` : iso;
  }

  protected formatarDataHora(iso: string): string {
    const dt = new Date(iso.replace(' ', 'T'));
    return isNaN(dt.getTime())
      ? iso
      : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(dt);
  }
}