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
  readonly empresasVisiveis = computed((): EmpresaAutorizada[] => {
    if (!this.semRestricao()) {
      return this.autorizadasNoJwt();
    }
    return this._dosDados();
  });

  // ── Selecionadas pelo usuário ──────────────────────────────────
  // IMPORTANTE: aqui o Set guarda EXATAMENTE os códigos marcados.
  // Set vazio = literalmente "nenhuma empresa marcada", nunca "todas".
  // "Todas marcadas" é apenas quando o Set contém todos os códigos visíveis.
  private readonly _selecionadas = signal<Set<string>>(new Set());
  readonly selecionadas = this._selecionadas.asReadonly();

  // Enquanto o usuário não mexer manualmente, a seleção acompanha
  // automaticamente a lista de empresas visíveis (ou seja, "todas" por padrão).
  private _customizado = false;

  constructor() {
    // Persiste automaticamente ao mudar seleção, mas só depois que o
    // usuário customizou algo manualmente (senão ficaríamos gravando
    // o estado "padrão" toda vez que a lista de empresas mudasse).
    effect(() => {
      const ids = Array.from(this._selecionadas());
      if (this._customizado) {
        localStorage.setItem(this._storageKey(), JSON.stringify(ids));
      }
    });

    // Sempre que a lista de empresas visíveis mudar (JWT carregou,
    // ou os dados da API chegaram) E o usuário ainda não tiver
    // customizado a seleção, marca todas automaticamente.
    effect(() => {
      const visiveis = this.empresasVisiveis();
      if (!this._customizado) {
        this._selecionadas.set(new Set(visiveis.map(e => e.codigo)));
      }
    });

    // Ao trocar de tenant, recarrega a seleção salva daquele tenant
    // (ou volta ao padrão "todas" se não houver nada salvo).
    effect(() => {
      this.auth.tenantAtual();
      this._recarregarDoStorage();
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

    if (this._customizado) {
      // Remove seleções que não existem mais nos dados
      const codigos = new Set(empresas.map(e => e.codigo));
      const nova = new Set(
        Array.from(this._selecionadas()).filter(c => codigos.has(c))
      );
      this._selecionadas.set(nova);
    }
    // Se não customizado, o effect acima já re-seleciona "todas" automaticamente
  }

  // ── Computed: "todas selecionadas" ────────────────────────────
  readonly todasSelecionadas = computed(() => {
    const sel = this._selecionadas();
    const visiveis = this.empresasVisiveis();
    return visiveis.length > 0 && sel.size >= visiveis.length;
  });

  estaSelecionada(codigo: string): boolean {
    return this._selecionadas().has(codigo);
  }

  // ── Retorna códigos para enviar como param na API ─────────────
  // [] = sem filtro de empresa (todas selecionadas, API usa o JWT p/ decidir)
  codigosSelecionados(): string[] {
    if (this.todasSelecionadas()) return [];
    return Array.from(this._selecionadas());
  }

  // ── Toggle individual ─────────────────────────────────────────
  toggle(codigo: string): void {
    this._customizado = true;
    const copia = new Set(this._selecionadas());
    if (copia.has(codigo)) copia.delete(codigo);
    else                   copia.add(codigo);
    this._selecionadas.set(copia);
  }

  // ── Selecionar/desmarcar todas ─────────────────────────────────
  toggleTodas(): void {
    this._customizado = true;
    if (this.todasSelecionadas()) {
    } else {
      this._selecionadas.set(
        new Set(this.empresasVisiveis().map(e => e.codigo))
      );
    }
  }

  // ── Filtra lista local por empresa selecionada ────────────────
  filtrar<T extends { codigo_empresa: string }>(items: T[]): T[] {
    if (this.todasSelecionadas()) return items;
    const sel = this._selecionadas();
    return items.filter(i => sel.has(i.codigo_empresa));
  }

  // ── Storage com chave isolada por tenant ──────────────────────
  private _storageKey(): string {
    const tid = this.auth.tenantAtual()?.id ?? 'global';
    return `${STORAGE_KEY}`;
  }

  private _recarregarDoStorage(): void {
    try {
      const raw = localStorage.getItem(this._storageKey());
      if (raw === null) {
        // Nada salvo para esse tenant: volta ao padrão "todas"
        this._customizado = false;
        this._selecionadas.set(new Set(this.empresasVisiveis().map(e => e.codigo)));
        return;
      }
      const codigos = JSON.parse(raw) as string[];
      this._customizado = true;
      this._selecionadas.set(new Set(codigos));
    } catch {
      this._customizado = false;
      this._selecionadas.set(new Set());
    }
  }
}