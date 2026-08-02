import { Injectable, signal, computed, inject } from '@angular/core';
import { EmpresaFilterService } from './empresa-filter.service';
import { ApiService } from './api.service';
import { forkJoin } from 'rxjs';
import {
  TaxaApiItem,
  KpiTaxaValores,
  RankingTaxaEmpresa,
  AgrupamentoTaxaPorFornecedor,
} from '../models/taxa.models';
import { PontoGrafico, Serie } from '../models/graficos.models';
import { MaioresDevedores, Pessoa } from '../models/financeiro.models';
import { FiltroOpcao } from '../components/multi-select-filter/pessoa_filter';

const PALETA_EMPRESAS = [
  '#f43f5e', '#fb923c', '#38bdf8', '#a78bfa',
  '#34d399', '#fbbf24', '#818cf8', '#f472b6',
];

@Injectable({ providedIn: 'root' })
export class PagarService {
  private readonly api = inject(ApiService);
  readonly empresaFilter = inject(EmpresaFilterService);

  // ─── Período ────────────────────────────────────────────────
  private getPrimeiroDiaMes(): string {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
  }
  private getUltimoDiaMes(): string {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
  }

  readonly dataInicio = signal<string>(this.getPrimeiroDiaMes());
  readonly dataFim    = signal<string>(this.getUltimoDiaMes());
  readonly periodo    = signal<string>('');

  // ─── Filtros locais ─────────────────────────────────────────
  readonly filtroStatusTxPagamento   = signal<string>('todos');
  readonly buscaPagamento   = signal<string>('');

  readonly carregandoTaxaPagamento   = signal<boolean>(false);
  
  readonly filtroPessoas = signal<Set<number>>(new Set());

  // ─── Dados brutos (nunca filtrados) ────────────────────────
  private readonly _txPagamentoBruto      = signal<TaxaApiItem[]>([]);
  private readonly _txPagamentoBrutoAnt   = signal<TaxaApiItem[]>([]);

  private readonly _diasPeriodo = signal<string[]>([]);
  private readonly _fmtInicio   = signal<string>('');
  private readonly _fmtFim      = signal<string>('');

  // ─── Atualização ────────────────────────────────────────────
  formatarDataHora(data: string | null | undefined): string {
    if (!data) return '-';
    const dt = new Date(data.replace(' ', 'T'));
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(dt);
  }

  proximaAtualizacao(data: string | null | undefined): string {
      if (!data) return '-';
      const dt = new Date(data.replace(' ', 'T'));
      dt.setMinutes(dt.getMinutes() + 30);
      return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
      }).format(dt);
  }

  readonly ultimaAtualizacao = computed(() => {
      const lista = this._txPagamentoBruto();
      if (!lista.length) return null;

      return lista
      .map(x => (x as any).ultima_atualizacao ?? (x as any)['ultima_atualização'])
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;
  });

  readonly ultimaAtualizacaoFormatada  = computed(() => this.formatarDataHora(this.ultimaAtualizacao()));
  readonly proximaAtualizacaoFormatada = computed(() => this.proximaAtualizacao(this.ultimaAtualizacao()));

  private _filtrarPorPessoa(lista: TaxaApiItem[]): TaxaApiItem[] {
    const pessoas = this.filtroPessoas();
    if (pessoas.size === 0) return lista;
    return lista.filter(c => pessoas.has(Number(c.id_pessoa)));
  }

  private readonly _pagamentoBaseEmpresa = computed(() => {
    const empresas = this.empresaFilter.selecionadas();
    const brutos = this._txPagamentoBruto();
    return empresas.size === 0 ? brutos : brutos.filter(c => empresas.has(Number(c.id_empresa)));
  });
  private readonly _pagamentoBaseEmpresaAnt = computed(() => {
    const empresas = this.empresaFilter.selecionadas();
    const brutos = this._txPagamentoBrutoAnt();
    return empresas.size === 0 ? brutos : brutos.filter(c => empresas.has(Number(c.id_empresa)));
  });

  private readonly _pagamentoBase = computed(() =>
    this._filtrarPorPessoa(this._pagamentoBaseEmpresa())
  );
  private readonly _pagamentoBaseAnt = computed(() =>
    this._filtrarPorPessoa(this._pagamentoBaseEmpresaAnt())
  );

  readonly pagamentoFiltrado = computed(() => {
    const status = this.filtroStatusTxPagamento();
    const base = this._pagamentoBase();
    return status === 'todos' ? base : base.filter(c => c.status_financeiro === status);
  });

  private _foiRealizado(item: TaxaApiItem): boolean {
    return !!item.data_baixa;
  }
  private _valorRealizado(item: TaxaApiItem): number {
    return this._foiRealizado(item) ? item.valor_total : 0;
  }

  readonly opcoesPessoa = computed((): FiltroOpcao[] => {
    const base = this._pagamentoBaseEmpresa();
    const map  = new Map<number, string>();

    base.forEach(c => {
      const id = Number(c.id_pessoa);
      if (!map.has(id)) map.set(id, c.nome_pessoa ?? `Cliente #${id}`);
    });

    return Array.from(map.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  });

  // ─── KPIs de topo ───────────────────────────────────────────
  private kpis(atual: TaxaApiItem[], anterior: TaxaApiItem[]): KpiTaxaValores {
    const calcular = (lista: TaxaApiItem[]) => {
      const esperado  = lista.reduce((s, c) => s + (c.valor_total ?? 0), 0);
      const realizado = lista.reduce((s, c) => s + this._valorRealizado(c), 0);
      return { esperado, realizado };
    };
    const a = calcular(atual);
    const b = calcular(anterior);
    return {
      valorEsperado: a.esperado,
      valorRealizado: a.realizado,
      valorDiferenca: a.esperado - a.realizado,
      variacaoEsperado: this._var(a.esperado, b.esperado),
      variacaoRealizado: this._var(a.realizado, b.realizado),
      variacaoDiferenca: this._var(a.esperado - a.realizado, b.esperado - b.realizado),
    };
  }

  readonly kpiTxPagamento = computed((): KpiTaxaValores =>
    this.kpis(this.pagamentoFiltrado(), this._pagamentoBaseAnt())
  );
  
  private _nomeGrupoEmpresa(nome: string | null | undefined): string {
    if (!nome) return 'Sem empresa';
    const primeiro = nome.trim().split(/\s+/)[0];
    return primeiro || 'Sem empresa';
  }

  private _rankingPorEmpresa(lista: TaxaApiItem[]): RankingTaxaEmpresa[] {
    const totalEsperado = lista.reduce((s, c) => s + c.valor_total, 0) || 1;
    const map = new Map<string, { esperado: number; realizado: number }>();

    lista.forEach(c => {
      const key = this._nomeGrupoEmpresa(c.nome_empresa);   
      if (!map.has(key)) map.set(key, { esperado: 0, realizado: 0 });
      const item = map.get(key)!;
      item.esperado  += c.valor_total;
      item.realizado += this._valorRealizado(c);
    });

    return Array.from(map.entries())
      .map(([nome, v]) => ({
        nome,
        valorEsperado: v.esperado,
        valorRealizado: v.realizado,
        taxaRealizacao: v.esperado > 0 ? (v.realizado / v.esperado) * 100 : 0,
        percentualDoTotal: (v.esperado / totalEsperado) * 100,
      }))
      .sort((a, b) => b.valorEsperado - a.valorEsperado);
  }

  readonly rankingPagamentoPorEmpresa   = computed(() => this._rankingPorEmpresa(this.pagamentoFiltrado()));

  readonly rankingPagamentoParaGrafico = computed((): MaioresDevedores[] =>
    this.rankingPagamentoPorEmpresa().map(r => ({
      nome: r.nome,
      valor: r.valorEsperado,
      percentual: r.percentualDoTotal,
      diasAtrasoMedio: Math.round(r.taxaRealizacao),
    }))
  );

  readonly comparativoPagamento = computed((): MaioresDevedores[] => {
    const kpi = this.kpiTxPagamento();
    return [
      { nome: 'A Pagar', valor: kpi.valorEsperado, percentual: 100, diasAtrasoMedio: 0 },
      { nome: 'Pago', valor: kpi.valorRealizado, percentual: kpi.valorEsperado > 0 ? (kpi.valorRealizado / kpi.valorEsperado) * 100 : 0, diasAtrasoMedio: 0 },
    ];
  });

  // ─── Evolução temporal (linha) ──────────────────────────────
  private _chaveData(data: string, granularidade: 'dia' | 'mes'): string {
    return granularidade === 'mes' ? data.slice(0, 7) : data;
  }
  private _formatarLabelMes(chave: string): string {
    const [ano, mes] = chave.split('-');
    return `${mes}/${ano}`;
  }
  private _chavesPeriodo(granularidade: 'dia' | 'mes'): string[] {
    const dias = this._diasPeriodo();
    if (granularidade === 'dia') return dias;
    const meses = new Set(dias.map(d => d.slice(0, 7)));
    return Array.from(meses).sort();
  }

  readonly granularidadeGraficoPagamento   = signal<'dia' | 'mes'>('dia');

  setGranularidadePagamento(v: 'dia' | 'mes'): void { this.granularidadeGraficoPagamento.set(v); }

  private _construirLinhas(
    lista: TaxaApiItem[],
    granularidade: 'dia' | 'mes',
  ): { esperado: PontoGrafico[]; realizado: PontoGrafico[] } {
    const inicio  = this._fmtInicio();
    const fim     = this._fmtFim();
    const chaves  = this._chavesPeriodo(granularidade);
    if (!chaves.length || !inicio || !fim) return { esperado: [], realizado: [] };

    const dtInicio = this._parseDate(inicio);
    const dtFim    = this._parseDate(fim);
    const mapaEsperado  = new Map<string, number>();
    const mapaRealizado = new Map<string, number>();

    lista.forEach(c => {
      if (!c.data_vencimento) return;
      const dt = this._parseDate(c.data_vencimento);
      if (dt < dtInicio || dt > dtFim) return;
      const chave = this._chaveData(c.data_vencimento, granularidade);
      mapaEsperado.set(chave, (mapaEsperado.get(chave) ?? 0) + c.valor_total);
      mapaRealizado.set(chave, (mapaRealizado.get(chave) ?? 0) + this._valorRealizado(c));
    });

    const montarPontos = (mapa: Map<string, number>): PontoGrafico[] =>
      chaves.map(k => ({
        data: granularidade === 'mes' ? this._formatarLabelMes(k) : k,
        valor: mapa.get(k) ?? 0,
      }));

    return {
      esperado: montarPontos(mapaEsperado),
      realizado: montarPontos(mapaRealizado),
    };
  }

  readonly linhasPagamento = computed(() =>
    this._construirLinhas(this.pagamentoFiltrado(), this.granularidadeGraficoPagamento())
  );

  // ─── Séries prontas para o LineChartComponent ───────────────
  

  readonly seriesPagamento = computed((): Serie[] => {
    const linhas = this.linhasPagamento();
    return [
      { id: 'esperado', label: 'A Pagar', cor: '#f43f5e', formatador: 'currency', pontos: linhas.esperado },
      { id: 'realizado', label: 'Pago', cor: '#34d399', formatador: 'currency', pontos: linhas.realizado },
    ];
  });


  // ─── Tabela: Taxa por Fornecedor (pagamento) ───────────────
  readonly taxaPorFornecedor = computed((): AgrupamentoTaxaPorFornecedor[] => {
    const lista = this.pagamentoFiltrado();
    const totalEsperado = lista.reduce((s, c) => s + c.valor_total, 0) || 1;

    return lista
      .map(c => ({
        codigo: c.codigo,
        nomePessoa: c.nome_pessoa,
        nomeEmpresa: c.nome_empresa,
        numeroDocumento: c.numero_documento,
        ordem: c.ordem,
        origem: c.origem,
        formaCobranca: c.descricao_forma_cobranca,
        statusFinanceiro: c.status_financeiro,
        dataVencimento: c.data_vencimento,
        dataBaixa: c.data_baixa,

        label: c.nome_pessoa,

        valorEsperado: c.valor_total,
        valorPago: this._valorRealizado(c),

        taxaPagamento: this._foiRealizado(c) ? 100 : 0,
        percentualDoTotal: (c.valor_total / totalEsperado) * 100,
      }))
      .sort((a, b) => b.valorEsperado - a.valorEsperado);
  });

  // ─── Carregar dados ─────────────────────────────────────────
  carregar(dataInicio?: string, dataFim?: string): void {
    const inicioAtual = dataInicio ?? this.dataInicio();
    const fimAtual    = dataFim ?? this.dataFim();

    const dtInicioAtual = this._parseDate(inicioAtual);
    const dtFimAtual    = this._parseDate(fimAtual);

    const diffDias = Math.floor((dtFimAtual.getTime() - dtInicioAtual.getTime()) / 86400000) + 1;
    const fimAnterior = new Date(dtInicioAtual);
    fimAnterior.setDate(fimAnterior.getDate() - 1);
    const inicioAnterior = new Date(fimAnterior);
    inicioAnterior.setDate(inicioAnterior.getDate() - (diffDias - 1));

    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    this._fmtInicio.set(fmt(dtInicioAtual));
    this._fmtFim.set(fmt(dtFimAtual));
    this.periodo.set(`${fmt(dtInicioAtual)} a ${fmt(dtFimAtual)}`);

    const dias: string[] = [];
    const cursor = new Date(dtInicioAtual);
    while (cursor <= dtFimAtual) {
      dias.push(fmt(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    this._diasPeriodo.set(dias);

    this.carregandoTaxaPagamento.set(true);

    forkJoin({
      pagamentoAtual:      this.api.getTxPagamento(fmt(dtInicioAtual), fmt(dtFimAtual)),
      pagamentoAnterior:   this.api.getTxPagamento(fmt(inicioAnterior), fmt(fimAnterior)),
    }).subscribe({
      next: ({ pagamentoAtual, pagamentoAnterior }) => {
        this._txPagamentoBruto.set(pagamentoAtual.data ?? []);
        this._txPagamentoBrutoAnt.set(pagamentoAnterior.data ?? []);

        this.carregandoTaxaPagamento.set(false);
      },
      error: err => {
        console.error('Erro ao carregar taxas:', err);
        this.carregandoTaxaPagamento.set(false);
      },
    });
  }

  // ─── Actions ────────────────────────────────────────────────
  setBuscaPagamento(v: string)   { this.buscaPagamento.set(v); }
  setFiltroStatusTxPagamento(v: string)   { this.filtroStatusTxPagamento.set(v); }

  togglePessoa(id: number): void {
    const nova = new Set(this.filtroPessoas());
    nova.has(id) ? nova.delete(id) : nova.add(id);
    this.filtroPessoas.set(nova);
  }

  toggleTodasPessoas(): void {
    const atual   = this.filtroPessoas();
    const opcoes  = this.opcoesPessoa();

    if (atual.size > 0 && atual.size === opcoes.length) {
      this.filtroPessoas.set(new Set());
    } else {
      this.filtroPessoas.set(new Set(opcoes.map(o => o.id)));
    }
  }

  // ─── Helpers privados ───────────────────────────────────────
  private _var(atual: number, anterior: number): number {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return Number(((atual - anterior) / anterior * 100).toFixed(2));
  }

  private _parseDate(s: string): Date {
    const [ano, mes, dia] = s.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  }
}