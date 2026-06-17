import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { EmpresaAutorizada } from '../models/financeiro.models';

const STORAGE_KEY = 'ff_empresas_selecionadas';

@Injectable({ providedIn: 'root' })
export class EmpresaFilterService {
  private readonly auth = inject(AuthService);

  // ── Empresas vindas dos DADOS da API (populado após carregar) ──
  private readonly _dosDados = signal<EmpresaAutorizada[]>([]);

  // ── Empresas do JWT — disponíveis IMEDIATAMENTE após login ────
  // Vazio no JWT = usuário sem restrição (vê tudo)
  readonly autorizadasNoJwt = computed(() =>
    this.auth.empresasAutorizadas()   // EmpresaAutorizada[] do token
  );

  readonly semRestricao = computed(() =>
    this.autorizadasNoJwt().length === 0
  );

  // ── Lista visível no dropdown ──────────────────────────────────
  // Prioridade:
  //   1. Se o JWT tem empresas → mostra só elas (já disponíveis no login)
  //   2. Se JWT não restringe → mostra as que vieram dos dados da API
  //      (populadas pelo InadimplenciaService após o primeiro carregamento)
  readonly empresasVisiveis = computed((): EmpresaAutorizada[] => {
    if (!this.semRestricao()) {
      // Usuário tem restrição: mostra exatamente o que o JWT autoriza
      return this.autorizadasNoJwt();
    }
    // Sem restrição: mostra as empresas encontradas nos dados
    return this._dosDados();
  });

  // ── Selecionadas pelo usuário (persistidas por tenant) ────────
  private readonly _selecionadas = signal<Set<string>>(
    this._carregarStorage()
  );
  readonly selecionadas = this._selecionadas.asReadonly();

  constructor() {
    // Persiste automaticamente ao mudar seleção
    effect(() => {
      const ids = Array.from(this._selecionadas());
      localStorage.setItem(this._storageKey(), JSON.stringify(ids));
    });

    // Ao trocar de tenant, recarrega seleção do storage daquele tenant
    effect(() => {
      const tenant = this.auth.tenantAtual();
      if (tenant) {
        this._selecionadas.set(this._carregarStorage());
      }
    });
  }

  // ── Chamado pelo InadimplenciaService após receber dados ──────
  // Só importa quando o usuário NÃO tem restrição no JWT
  setDisponiveis(empresas: EmpresaAutorizada[]): void {
    const atual = this._dosDados();
    const iguais =
      atual.length === empresas.length &&
      atual.every((e, i) => e.codigo === empresas[i].codigo);
    if (iguais) return;

    this._dosDados.set(empresas);

    // Remove seleções que não existem mais nos dados
    const codigos = new Set(empresas.map(e => e.codigo));
    const nova    = new Set(
      Array.from(this._selecionadas()).filter(c => codigos.has(c))
    );
    this._selecionadas.set(nova);
  }

  // ── Computed: "todas selecionadas" ────────────────────────────
  readonly todasSelecionadas = computed(() => {
    const sel     = this._selecionadas();
    const visiveis = this.empresasVisiveis();
    return sel.size === 0 || sel.size >= visiveis.length;
  });

  estaSelecionada(codigo: string): boolean {
    if (this._selecionadas().size === 0) return true;
    return this._selecionadas().has(codigo);
  }

  // ── Retorna códigos para enviar como param na API ─────────────
  // [] = sem filtro de empresa (API usa o JWT para decidir)
  codigosSelecionados(): string[] {
    const sel = this._selecionadas();
    if (sel.size === 0) return [];
    return Array.from(sel);
  }

  // ── Toggle individual ─────────────────────────────────────────
  toggle(codigo: string): void {
    const copia = new Set(this._selecionadas());
    if (copia.has(codigo)) copia.delete(codigo);
    else                   copia.add(codigo);
    this._selecionadas.set(copia);
  }

  // ── Selecionar/desmarcar todas ────────────────────────────────
  toggleTodas(): void {
    if (this.todasSelecionadas()) {
      this._selecionadas.set(new Set());
    } else {
      this._selecionadas.set(
        new Set(this.empresasVisiveis().map(e => e.codigo))
      );
    }
  }

  // ── Filtra lista local por empresa selecionada ────────────────
  filtrar<T extends { codigo_empresa: string }>(items: T[]): T[] {
    const sel = this._selecionadas();
    if (sel.size === 0) return items;
    return items.filter(i => sel.has(i.codigo_empresa));
  }

  // ── Storage com chave isolada por tenant ──────────────────────
  private _storageKey(): string {
    const tid = this.auth.tenantAtual()?.id ?? 'global';
    return `${STORAGE_KEY}_${tid}`;
  }

  private _carregarStorage(): Set<string> {
    try {
      const raw = localStorage.getItem(this._storageKey());
      if (!raw) return new Set();
      return new Set(JSON.parse(raw) as string[]);
    } catch {
      return new Set();
    }
  }
}
