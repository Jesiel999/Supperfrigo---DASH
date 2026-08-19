import { Injectable, signal, computed, inject } from '@angular/core';
import { forkJoin } from 'rxjs';

import { EmpresaFilterService } from '../empresa-filter.service';
import { ApiService } from '../api.service';
import {
  EstoqueApiItem,
  ItemEstoque,
  KpiEstoque,
  RankingEstoqueItem,
  CategoriaFatia,
} from '../../models/estoque.models';
import { FiltroOpcao } from '../../components/multi-select-filter/pessoa_filter';

const PALETA_CATEGORIAS = [
  '#1F8A8C', '#F2A93B', '#38bdf8', '#a78bfa',
  '#34d399', '#fbbf24', '#818cf8', '#f472b6',
];

@Injectable({ providedIn: 'root' })
export class EstoqueService {
  private readonly api          = inject(ApiService);
  readonly          empresaFilter = inject(EmpresaFilterService);

  readonly busca       = signal<string>('');
  readonly carregando  = signal<boolean>(false);
  readonly filtroPecas = signal<Set<number>>(new Set());
  readonly filtroCategorias = signal<Set<string>>(new Set());

  private readonly _todosBrutos = signal<ItemEstoque[]>([]);

  // ─── Última atualização — único lugar onde uma "data" importa ──
  formatarDataHora(data: string | null | undefined): string {
    if (!data) return '-';
    const dt = new Date(data.replace(' ', 'T'));
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(dt);
  }

  proximaAtualizacao(data: string | null | undefined): string {
    if (!data) return '-';
    const dt = new Date(data.replace(' ', 'T'));
    dt.setMinutes(dt.getMinutes() + 30);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(dt);
  }

  readonly ultimaAtualizacao = computed(() => {
    const lista = this._todosBrutos();
    if (!lista.length) return null;
    return lista.map(x => x.ultima_atualizacao).sort().at(-1) ?? null;
  });

  readonly ultimaAtualizacaoFormatada = computed(() =>
    this.formatarDataHora(this.ultimaAtualizacao()),
  );
  readonly proximaAtualizacaoFormatada = computed(() =>
    this.proximaAtualizacao(this.ultimaAtualizacao()),
  );

  // ─── Pipeline de filtros (empresa vem do EmpresaFilterService global
  private readonly _baseEmpresa = computed(() => {
    const brutos   = this._todosBrutos();
    const empresas = this.empresaFilter.selecionadas();
    if (empresas.size === 0) return brutos;
    return brutos.filter(i => empresas.has(Number(i.id_empresa)));
  });

  private _filtrarPorCategoria(lista: ItemEstoque[]): ItemEstoque[] {
    const categorias = this.filtroCategorias();
    if (categorias.size === 0) return lista;
    return lista.filter(i => categorias.has(i.categoria));
  }
  private _filtrarPorPecas(lista: ItemEstoque[]): ItemEstoque[] {
    const pessoas = this.filtroPecas();
    if (pessoas.size === 0) return lista;
    return lista.filter(c => pessoas.has(Number(c.codigo_produto)));
  }

  /** Itens já filtrados por empresa + categoria. Cada linha é o saldo
   *  ATUAL de um produto numa empresa — não há mais recorte por dia. */
  private readonly _itensFiltrados = computed(() => {
    let lista = this._baseEmpresa();

    lista = this._filtrarPorCategoria(lista);
    lista = this._filtrarPorPecas(lista);

    return lista;
  });

  readonly opcoesCategoria = computed((): string[] => {
    const base = this._baseEmpresa();
    const set  = new Set<string>();
    base.forEach(i => set.add(i.categoria));
    return Array.from(set).sort();
  });

  readonly opcoesPecas = computed((): FiltroOpcao[] => {
    const base = this._baseEmpresa();

    const mapa = new Map<number, FiltroOpcao>();

    base.forEach(item => {
      const id = Number(item.codigo_produto);

      if (!mapa.has(id)) {
        mapa.set(id, {
          id,
          nome: `${item.codigo_produto} - ${item.produto_descricao}`,
        });
      }
    });

    return Array.from(mapa.values()).sort(
      (a, b) => a.id - b.id
    );
  });

  // ─── KPIs — computed reativo, direto sobre _itensFiltrados ────
  readonly kpis = computed((): KpiEstoque => {
    const atual = this._itensFiltrados();

    const qtdItensAtual   = new Set(atual.map(i => i.codigo_produto)).size;
    const valorAtual      = atual.reduce((s, i) => s + i.valor_estoque_custo, 0);
    const saldoAtual      = atual.filter(i => i.possui_saldo).length;
    const qtdFisicaAtual  = atual.reduce((s, i) => s + i.qtd_estoque, 0);
    const custoMedioAtual = qtdFisicaAtual ? valorAtual / qtdFisicaAtual : 0;

    return {
      qtdItens:          qtdItensAtual,
      valorEstoqueTotal: valorAtual,
      produtosComSaldo:  saldoAtual,
      custoMedioGeral:   custoMedioAtual,
    };
  });

  // ─── Agrupamento de filiais — pega só o primeiro "nome" da
  private _nomeGrupoEmpresa(
    nome_empresa: string | null | undefined
  ): string {
    const primeiro = nome_empresa?.trim().split(/\s+/)[0];
    return primeiro || 'Sem empresa';
  }

  // ─── Valor por empresa (bar) ───────────────────────────────────
  readonly valorPorEmpresa = computed((): RankingEstoqueItem[] => {
    const atual = this._itensFiltrados();

    const total = atual.reduce(
      (s, i) => s + i.valor_estoque_custo,
      0
    );

    const map = new Map<string, number>();

    atual.forEach(i => {
      const key = this._nomeGrupoEmpresa(i.empresa_nome);

      map.set(
        key,
        (map.get(key) ?? 0) + i.valor_estoque_custo
      );
    });

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([nome, valor]) => ({
        nome,
        valor,
        percentual: total > 0 ? (valor / total) * 100 : 0,
        diasAtrasoMedio: 0,
      }));
  });

  // ─── Distribuição por empresa (donut) — mesmo dado, outra visão ──
  readonly distribuicaoPorEmpresa = computed((): CategoriaFatia[] => {
    const ranking = this.valorPorEmpresa();
    return ranking.slice(0, 8).map((item, i) => ({
      label: item.nome,
      percentual: Math.round(item.percentual),
      cor: PALETA_CATEGORIAS[i % PALETA_CATEGORIAS.length],
    }));
  });

  // ─── Maiores produtos em valor de estoque (bar) ───────────────
  readonly maioresProdutos = computed((): RankingEstoqueItem[] => {
    const atual = this._itensFiltrados();
    const total = atual.reduce((s, i) => s + i.valor_estoque_custo, 0);

    const map = new Map<string, number>();
    atual.forEach(i => map.set(i.produto_descricao, (map.get(i.produto_descricao) ?? 0) + i.valor_estoque_custo));

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1000)
      .map(([nome, valor]) => ({
        nome,
        valor,
        percentual: total > 0 ? (valor / total) * 100 : 0,
        diasAtrasoMedio: 0,
      }));
  });

  // ─── Por categoria (donut) — Elétrica, Motor, ... ─────────────
  readonly porCategoria = computed((): CategoriaFatia[] => {
    const atual = this._itensFiltrados();
    const total = atual.reduce((s, i) => s + i.valor_estoque_custo, 0) || 1;

    const map = new Map<string, number>();
    atual.forEach(i => map.set(i.categoria, (map.get(i.categoria) ?? 0) + i.valor_estoque_custo));

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, valor], i) => ({
        label,
        percentual: Math.round((valor / total) * 100),
        cor: PALETA_CATEGORIAS[i % PALETA_CATEGORIAS.length],
      }));
  });

  readonly produtosFiltrados = computed((): ItemEstoque[] => {
    const base  = this._baseEmpresa();
    const busca = this.busca().toLowerCase().trim();

    return base.filter(i => {
      if (busca) {
        const campos = [
          i.codigo_produto, i.produto_descricao, i.empresa_nome,
          i.categoria, i.grupo, String(i.qtd_estoque), String(i.valor_estoque_custo),
        ];
        return campos.some(v => (v ?? '').toString().toLowerCase().includes(busca));
      }
      return true;
    });
  });

  // ─── Carregamento ──────────────────────────────────────────────
  carregar(): void {
    this.carregando.set(true);

    forkJoin({
      atual: this.api.getEstoque(),
    }).subscribe({
      next: ({ atual: resAtual }) => {
        const brutos = (resAtual.data ?? []).map((i: EstoqueApiItem) => this.mapApiItem(i));
        this._todosBrutos.set(brutos);
        this.carregando.set(false);
      },
      error: err => {
        console.error('Erro ao carregar estoque:', err);
        this.carregando.set(false);
      },
    });
  }

  private mapApiItem(item: EstoqueApiItem): ItemEstoque {
    return {
      id_empresa:         Number(item.id_empresa ?? item.id_empresa),
      codigo_empresa:     item.id_empresa,
      empresa_nome:       item.empresa_nome,
      codigo_produto:     item.codigo_produto,
      produto_descricao:  item.produto_descricao,
      categoria:          item.categoria,
      grupo:              item.grupo,
      data_processamento: item.data_processamento,
      qtd_estoque:        Number(item.qtd_estoque ?? 0),
      valor_estoque_custo:        Number(item.valor_estoque_custo ?? 0),
      valor_estoque_venda:      Number(item.valor_estoque_venda ?? 0),
      possui_saldo:       Number(item.qtd_estoque ?? 0) > 0,
      ultima_atualizacao: String(item.ultima_atualizacao),
    };
  }

  // ─── Actions ──────────────────────────────────────────────────
  setBusca(v: string) { this.busca.set(v); }

  toggleCategoria(nome: string): void {
    const nova = new Set(this.filtroCategorias());
    nova.has(nome) ? nova.delete(nome) : nova.add(nome);
    this.filtroCategorias.set(nova);
  }

  // ─── Filtro de cliente (id_pessoa) — mesma convenção do
  togglePecas(id: number): void {
    const nova = new Set(this.filtroPecas());
    nova.has(id) ? nova.delete(id) : nova.add(id);
    this.filtroPecas.set(nova);
  }

  toggleTodasPecas(): void {
    const atual   = this.filtroPecas();
    const opcoes  = this.opcoesPecas();

    if (atual.size > 0 && atual.size === opcoes.length) {
      this.filtroPecas.set(new Set());
    } else {
      this.filtroPecas.set(new Set(opcoes.map(o => o.id)));
    }
  }

  toggleTodasCategorias(): void {
    const atual  = this.filtroCategorias();
    const opcoes = this.opcoesCategoria();
    if (atual.size > 0 && atual.size === opcoes.length) {
      this.filtroCategorias.set(new Set());
    } else {
      this.filtroCategorias.set(new Set(opcoes));
    }
  }
}