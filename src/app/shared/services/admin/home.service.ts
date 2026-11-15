// src/app/pages/home.service.ts
// A Home NÃO tem catálogo próprio: monta os cartões lendo as rotas do app (Router.config)
// e filtra pelo mesmo controle de permissão do sistema (AuthService.temPermissao).
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router, Route } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { ApiService } from '../api.service';
import { MenuRota } from '../../../auth/menu-rota';
import { RecursoSistema } from '../../models/admin/usuario.models';
import { ResumoChamados, Aviso, StatusIntegracao, ItemHome } from '../../models/admin/home.models';

/** Nome exibido de cada grupo (primeiro segmento da rota) e a ordem em que aparecem. */
const CATEGORIAS: Record<string, string> = {
  chamados: 'Atendimento',
  financeiro: 'Financeiro',
  estoque: 'Estoque',
  telemetria: 'Telemetria',
  admin: 'Administração',
};
export const ORDEM_CATEGORIAS = ['Atendimento', 'Financeiro', 'Estoque', 'Telemetria', 'Administração'];

const CHAVE_FAVORITOS = 'home-favoritos';
const CHAVE_RECENTES = 'home-recentes';
const MAX_RECENTES = 6;

@Injectable({ providedIn: 'root' })
export class HomeService {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  /** ⚠️ Ligue ao seu AuthService, ex.: computed(() => this.auth.usuario()?.nome ?? '') */
  readonly nomeUsuario = signal<string>('');

  /** Todas as rotas que publicaram `data: menu(...)`. */
  private readonly catalogo: ItemHome[] = this._montarCatalogo(this.router.config);

  /** Só o que o usuário pode abrir (mesma regra do permissaoGuard). */
  readonly itensLiberados = computed(() => this.catalogo.filter(i => this.auth.temPermissao(i.recurso)));

  readonly favoritos = signal<string[]>(this._ler(CHAVE_FAVORITOS));
  readonly recentes = signal<string[]>(this._ler(CHAVE_RECENTES));

  // ─── Widgets: começam vazios (a Home mostra "não conectado"); alimente com suas APIs ───
  readonly resumoChamados = signal<ResumoChamados | null>(null);
  readonly avisos = signal<Aviso[]>([]);
  readonly integracoes = signal<StatusIntegracao[]>([]);

  /** Avisos + status das integrações (a Home chama ao abrir). */
  carregarWidgets(): void {
    this.api.getAvisos().subscribe({
      next: r => this.avisos.set(r.data ?? []),
      error: () => this.avisos.set([]),
    });
    this.carregarIntegracoes();
  }

  carregarIntegracoes(): void {
    this.api.getStatusIntegracoes().subscribe({
      next: r => this.integracoes.set(r.data ?? []),
      error: () => this.integracoes.set([]),
    });
  }

  temPermissao(recurso: RecursoSistema): boolean {
    return this.auth.temPermissao(recurso);
  }

  alternarFavorito(id: string): void {
    const atual = this.favoritos();
    this._salvar(CHAVE_FAVORITOS, this.favoritos, atual.includes(id) ? atual.filter(x => x !== id) : [...atual, id]);
  }

  registrarAcesso(id: string): void {
    this._salvar(CHAVE_RECENTES, this.recentes, [id, ...this.recentes().filter(x => x !== id)].slice(0, MAX_RECENTES));
  }

  private _montarCatalogo(rotas: Route[]): ItemHome[] {
    const itens: ItemHome[] = [];
    for (const pai of rotas) {
      if (!pai.path) continue;
      for (const filho of pai.children ?? []) {
        const m = (filho.data as { menu?: MenuRota } | undefined)?.menu;
        if (!m || filho.path === undefined) continue;
        itens.push({
          ...m,
          id: `${pai.path}/${filho.path}`,
          rota: `/${pai.path}/${filho.path}`,
          categoria: CATEGORIAS[pai.path] ?? pai.path.charAt(0).toUpperCase() + pai.path.slice(1),
        });
      }
    }
    return itens;
  }

  private _ler(chave: string): string[] {
    try {
      const v = JSON.parse(localStorage.getItem(chave) ?? '[]');
      return Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];
    } catch { return []; }
  }

  private _salvar(chave: string, alvo: { set(v: string[]): void }, valor: string[]): void {
    alvo.set(valor);
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* só na sessão */ }
  }
}