// shared/services/financeiro/fluxo-caixa.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { EmpresaFilterService } from '../empresa-filter.service';
import { ApiResponse, MaioresDevedores } from '../../models/financeiro/financeiro.models';
import { Serie } from '../../models/graficos.models';
import { FiltroOpcao } from '../../components/multi-select-filter/pessoa_filter';
import {
  FLUXO_CAIXA_CLASSIFICACOES,
  FluxoCaixaAgregado,
  FluxoCaixaComparativo,
  FluxoCaixaFiltrosAplicados,
  FluxoPeriodo,
  FluxoCaixaItem,
  FluxoCaixaKpi,
  FluxoCaixaLinha,
  FluxoCaixaTitulo,
} from '../../models/financeiro/fluxo_caixa.models';

/**
 * Fluxo de Caixa REALIZADO (somente títulos baixados).
 *  - a API é chamada UMA vez por período (sem parâmetro de empresa);
 *  - o filtro global de empresas é aplicado em `computed` (sem nova requisição).
 *
 * Requer no ApiService:
 *   getFluxoCaixa(inicio: string, fim: string): Observable<ApiResponse<FluxoCaixaItem>>
 *   getFluxoCaixaTitulos(classificacao: string, inicio: string, fim: string): Observable<ApiResponse<FluxoCaixaTitulo>>
 */
@Injectable({ providedIn: 'root' })
export class FluxoCaixaService {
  private readonly api = inject(ApiService);
  readonly empresaFilter = inject(EmpresaFilterService);

  // ─── Filtro de Pessoa BI (mesmo padrão do ReceberService) ─────────────────────
  readonly filtroPessoas = signal<Set<number>>(new Set());

  /** Opções vindas dos próprios dados carregados (já respeitando o filtro de empresa). */
  readonly opcoesPessoa = computed((): FiltroOpcao[] => {
    const mapa = new Map<number, string>();
    for (const i of this._filtrarPorEmpresa(this._fluxo())) {
      if (i.id_pessoa == null || i.id_pessoa === '') continue;
      const id = Number(i.id_pessoa);
      if (!Number.isFinite(id) || mapa.has(id)) continue;
      mapa.set(id, i.nome_pessoa ?? `Pessoa #${id}`);
    }
    return Array.from(mapa.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  });

  readonly cfg = FLUXO_CAIXA_CLASSIFICACOES;
  readonly TAMANHO_PAGINA = 50;

  // ─── Filtros (realizado: padrão = últimos 3 meses, até hoje) ──
  /** Quantos meses o filtro padrão cobre (mês atual + anteriores). Troque aqui para mudar o padrão. */
  private static readonly MESES_PADRAO = 3;

  readonly dataInicio = signal<string>(this._fmt(this._primeiroDiaMesesAtras(FluxoCaixaService.MESES_PADRAO - 1)));
  readonly dataFim = signal<string>(this._fmt(new Date()));

  /**
   * Saldo de caixa no início do período.
   * ⚠️ Por enquanto é informado manualmente; se a API tiver saldo bancário, preencha aqui.
   */
  readonly saldoInicial = signal<number>(0);

  /** Período da última carga. O drill-down usa ESTE, não os inputs de data. */
  readonly filtrosAplicados = signal<FluxoCaixaFiltrosAplicados | null>(null);

  // ─── Estado da tela ─────────────────────────────────────────
  readonly carregando = signal<boolean>(false);
  readonly erro = signal<string | null>(null);
  readonly comparar = signal<boolean>(false);

  private readonly _fluxo = signal<FluxoCaixaItem[]>([]);
  private readonly _fluxoAnt = signal<FluxoCaixaItem[]>([]);

  readonly contasExpandidas = signal<ReadonlySet<string>>(new Set());

  private _subFluxo?: Subscription;
  private _subDetalhe?: Subscription;

  // ─── Atualização (mesma regra da DRE: vem do pipeline de integração) ──
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
    const datas = this._fluxo()
      .map(item => item.ultima_atualizacao)
      .filter((d): d is string => !!d);
    if (!datas.length) return null;
    return datas.reduce((ultima, atual) =>
      new Date(atual.replace(' ', 'T')).getTime() > new Date(ultima.replace(' ', 'T')).getTime() ? atual : ultima
    );
  });

  readonly ultimaAtualizacaoFormatada = computed(() => this.formatarDataHora(this.ultimaAtualizacao()));
  readonly proximaAtualizacaoFormatada = computed(() => this.proximaAtualizacao(this.ultimaAtualizacao()));

  // ─── Filtro por empresa (client-side) ───────────────────────
  private _filtrarPorEmpresa<T extends { id_empresa?: number | string | null }>(lista: T[]): T[] {
    const empresas = this.empresaFilter.selecionadas();
    if (empresas.size === 0) return lista;
    return lista.filter(i => i.id_empresa == null || empresas.has(Number(i.id_empresa)));
  }

  /** Filtro de Pessoa BI — mesmo padrão do ReceberService (local, sem nova requisição). */
  private _filtrarPorPessoa<T extends { id_pessoa?: number | string | null }>(lista: T[]): T[] {
    const pessoas = this.filtroPessoas();
    if (pessoas.size === 0) return lista;
    return lista.filter(i => pessoas.has(Number(i.id_pessoa)));
  }

  /** Soma por classificação (API devolve empresa × conta × mês), guardando o valor de cada mês. */
  private _agregar(itens: FluxoCaixaItem[]): FluxoCaixaAgregado[] {
    const mapa = new Map<string, FluxoCaixaAgregado>();
    for (const i of itens) {
      const valor = Number(i.total ?? 0);
      let a = mapa.get(i.classificacao);
      if (!a) {
        a = { classificacao: i.classificacao, descricao: i.descricao, eh_analitica: i.eh_analitica, total: 0, porPeriodo: {} };
        mapa.set(i.classificacao, a);
      }
      a.total += valor;
      a.eh_analitica = a.eh_analitica || i.eh_analitica;
      a.porPeriodo[i.periodo] = (a.porPeriodo[i.periodo] ?? 0) + valor;
    }
    return Array.from(mapa.values());
  }

  private readonly _fluxoBase = computed(() => this._agregar(this._filtrarPorPessoa(this._filtrarPorEmpresa(this._fluxo()))));
  private readonly _fluxoBaseAnt = computed(() => this._agregar(this._filtrarPorPessoa(this._filtrarPorEmpresa(this._fluxoAnt()))));

  readonly filtroEmpresaIndisponivel = computed(
    () => this.empresaFilter.selecionadas().size > 0 && this._fluxo().some(i => i.id_empresa == null)
  );

  /** Meses da projeção (colunas da tabela), ordenados. */
  readonly periodos = computed((): string[] => {
    const set = new Set<string>();
    for (const i of this._filtrarPorPessoa(this._filtrarPorEmpresa(this._fluxo()))) set.add(i.periodo);
    return [...set].sort();
  });

  // ─── Hierarquia ─────────────────────────────────────────────
  private readonly _itensOrdenados = computed(() =>
    [...this._fluxoBase()].sort((a, b) => this._compararClassificacao(a.classificacao, b.classificacao))
  );
  private readonly _mapaAtual = computed(() => new Map(this._fluxoBase().map(i => [i.classificacao, i])));
  private readonly _mapaAnterior = computed(() => new Map(this._fluxoBaseAnt().map(i => [i.classificacao, i])));

  readonly entradasBase = computed(() => this._mapaAtual().get(this.cfg.entradas)?.total ?? 0);

  readonly linhas = computed((): FluxoCaixaLinha[] => {
    const itens = this._itensOrdenados();
    const anterior = this._mapaAnterior();
    const base = this.entradasBase();
    const existentes = new Set(itens.map(i => i.classificacao));

    const paisComFilhos = new Set<string>();
    const paiDe = new Map<string, string | null>();
    itens.forEach(i => {
      const pai = this._paiExistente(i.classificacao, existentes);
      paiDe.set(i.classificacao, pai);
      if (pai) paisComFilhos.add(pai);
    });

    return itens.map(i => {
      const ant = anterior.get(i.classificacao);
      const comparativo: FluxoCaixaComparativo | null = ant
        ? { atual: i.total, anterior: ant.total, variacao: this.calcularVariacao(i.total, ant.total) }
        : null;
      return {
        ...i,
        nivel: i.classificacao.split('.').length - 1,
        pai: paiDe.get(i.classificacao) ?? null,
        temFilhos: paisComFilhos.has(i.classificacao),
        percentualEntradas: this.calcularPercentualEntradas(i.total, base),
        comparativo,
      };
    });
  });

  readonly linhasVisiveis = computed((): FluxoCaixaLinha[] => {
    const expandidas = this.contasExpandidas();
    const visiveis = new Set<string>();
    const resultado: FluxoCaixaLinha[] = [];
    for (const l of this.linhas()) {
      if (l.pai === null || (visiveis.has(l.pai) && expandidas.has(l.pai))) {
        visiveis.add(l.classificacao);
        resultado.push(l);
      }
    }
    return resultado;
  });

  readonly semDados = computed(() => !this.carregando() && !this.erro() && this._fluxoBase().length === 0);

  // ─── Regras de negócio isoladas ─────────────────────────────
  /** % = valor / total de entradas × 100, mantendo o sinal. */
  calcularPercentualEntradas(valor: number, base: number): number | null {
    if (!base) return null;
    return (valor / base) * 100;
  }

  /** Variação = (atual − anterior) / |anterior| × 100. */
  calcularVariacao(atual: number, anterior: number): number | null {
    if (!anterior) return null;
    return Number((((atual - anterior) / Math.abs(anterior)) * 100).toFixed(2));
  }

  // ─── Fluxo mensal realizado (núcleo da tela) ────────────────
  /** Entradas − |Saídas| por mês, com saldo acumulado a partir do saldo inicial. */
  readonly fluxoPorPeriodo = computed((): FluxoPeriodo[] => {
    const mapa = this._mapaAtual();
    const ent = mapa.get(this.cfg.entradas)?.porPeriodo ?? {};
    const cus = mapa.get(this.cfg.custos)?.porPeriodo ?? {};
    const des = mapa.get(this.cfg.despesas)?.porPeriodo ?? {};
    let acumulado = this.saldoInicial();
    return this.periodos().map(periodo => {
      const entradas = ent[periodo] ?? 0;
      const saidas = -((cus[periodo] ?? 0) + (des[periodo] ?? 0)); // PAGAR vem negativo
      const saldo = entradas - saidas;
      acumulado += saldo;
      return { periodo, entradas, saidas, saldo, acumulado };
    });
  });

  // ─── KPIs ───────────────────────────────────────────────────
  private _totais(mapa: Map<string, FluxoCaixaAgregado>) {
    const entradas = mapa.get(this.cfg.entradas)?.total ?? 0;
    const custos = mapa.get(this.cfg.custos)?.total ?? 0;
    const despesas = mapa.get(this.cfg.despesas)?.total ?? 0;
    const saidas = -(custos + despesas); // PAGAR vem negativo
    return { entradas, saidas, saldo: entradas - saidas };
  }

  readonly kpis = computed((): FluxoCaixaKpi => {
    const a = this._totais(this._mapaAtual());
    const b = this._totais(this._mapaAnterior());
    const v = (x: number, y: number) => this.calcularVariacao(x, y) ?? 0;
    const fluxo = this.fluxoPorPeriodo();
    const inicial = this.saldoInicial();
    const pior = fluxo.length ? fluxo.reduce((m, f) => (f.acumulado < m.acumulado ? f : m)) : null;
    return {
      entradas: a.entradas,
      saidas: a.saidas,
      saldoPeriodo: a.saldo,
      saldoInicial: inicial,
      saldoFinal: inicial + a.saldo,
      menorSaldo: pior ? pior.acumulado : inicial,
      mesMenorSaldo: pior ? pior.periodo : null,
      variacaoEntradas: v(a.entradas, b.entradas),
      variacaoSaidas: v(a.saidas, b.saidas),
      variacaoSaldoPeriodo: v(a.saldo, b.saldo),
    };
  });

  // ─── Gráficos ───────────────────────────────────────────────
  // Cor por sinal do valor ORIGINAL: positivo = azul, negativo = vermelho.
  readonly COR_POSITIVO = '#38BDF8';
  readonly COR_NEGATIVO = '#f43f5e';
  private _cor(v: number): string {
    return v < 0 ? this.COR_NEGATIVO : this.COR_POSITIVO;
  }

  private readonly _composicaoBase = computed(() => {
    const k = this.kpis();
    return [
      { nome: 'Entradas', total: k.entradas },
      { nome: 'Saídas', total: -k.saidas }, // saída é valor negativo no caixa
      { nome: k.saldoPeriodo < 0 ? 'Saldo (negativo)' : 'Saldo', total: k.saldoPeriodo },
    ];
  });

  /** Gráfico 1 — Entradas, saídas e saldo (em módulo; barras não suportam negativos). */
  readonly composicaoFluxo = computed((): MaioresDevedores[] => {
    const base = Math.abs(this.kpis().entradas) || 1;
    return this._composicaoBase().map(i => ({
      nome: i.nome,
      valor: Math.abs(i.total),
      percentual: (Math.abs(i.total) / base) * 100,
      diasAtrasoMedio: 0,
    }));
  });
  readonly composicaoFluxoCores = computed(() => this._composicaoBase().map(i => this._cor(i.total)));

  /** Gráfico 2 — Saldo acumulado mês a mês (em módulo, com aviso no nome quando negativo). */
  readonly saldoAcumuladoMensal = computed((): MaioresDevedores[] => {
    const fluxo = this.fluxoPorPeriodo();
    const max = fluxo.reduce((m, f) => Math.max(m, Math.abs(f.acumulado)), 0) || 1;
    return fluxo.map(f => ({
      nome: this.formatarPeriodo(f.periodo) + (f.acumulado < 0 ? ' (negativo)' : ''),
      valor: Math.abs(f.acumulado),
      percentual: (Math.abs(f.acumulado) / max) * 100,
      diasAtrasoMedio: 0,
    }));
  });
  readonly saldoAcumuladoMensalCores = computed(() => this.fluxoPorPeriodo().map(f => this._cor(f.acumulado)));

  private readonly _topContasBase = computed(() => {
    const analiticas = this.linhas().filter(l => l.eh_analitica && l.total !== 0);
    const soma = analiticas.reduce((s, l) => s + Math.abs(l.total), 0) || 1;
    return analiticas
      .map(l => ({
        total: l.total,
        item: {
          nome: l.descricao.replace(/^\.+\s*/, ''),
          valor: Math.abs(l.total),
          percentual: (Math.abs(l.total) / soma) * 100,
          diasAtrasoMedio: 0,
        } as MaioresDevedores,
      }))
      .sort((a, b) => b.item.valor - a.item.valor)
      .slice(0, 8);
  });

  /** Gráfico 3 — Contas analíticas de maior impacto (|valor|). */
  readonly topContas = computed((): MaioresDevedores[] => this._topContasBase().map(x => x.item));
  readonly topContasCores = computed(() => this._topContasBase().map(x => this._cor(x.total)));

  /** Gráfico de linha — evolução do saldo acumulado mês a mês. */
  readonly seriesSaldoAcumulado = computed((): Serie[] => [
    {
      id: 'saldo-acumulado',
      label: 'Saldo acumulado',
      cor: this.COR_POSITIVO,
      formatador: 'currency',
      pontos: this.fluxoPorPeriodo().map(f => ({ data: this.formatarPeriodo(f.periodo), valor: f.acumulado })),
    },
  ]);

  /** Contas de maior impacto (lista com nome completo, barra relativa e cor pelo sinal). */
  readonly topContasDetalhe = computed(() => {
    const base = this._topContasBase();
    const max = base.reduce((m, x) => Math.max(m, x.item.valor), 0) || 1;
    return base.map(x => ({
      nome: x.item.nome,
      total: x.total,
      percentual: x.item.percentual,
      largura: (x.item.valor / max) * 100,
      cor: this._cor(x.total),
    }));
  });

  // ─── Top 10: fornecedores pagos e clientes que pagaram ────────────────
  // Sai das mesmas linhas do /fluxo-caixa (contas 3.1 / 3.2 / 3.3 por pessoa), então bate com os KPIs
  // e respeita os filtros de empresa e de pessoa. Valores = o que foi efetivamente recebido/pago (títulos baixados).
  private _rankingPessoas(classes: readonly string[], sinal: 1 | -1) {
    const mapa = new Map<number, { nome: string; total: number }>();
    for (const r of this._filtrarPorPessoa(this._filtrarPorEmpresa(this._fluxo()))) {
      if (!classes.includes(r.classificacao)) continue;
      if (r.id_pessoa == null || r.id_pessoa === '') continue;
      const id = Number(r.id_pessoa);
      if (!Number.isFinite(id)) continue;
      const atual = mapa.get(id) ?? { nome: r.nome_pessoa ?? `Pessoa #${id}`, total: 0 };
      atual.total += sinal * Number(r.total ?? 0);
      mapa.set(id, atual);
    }
    const lista = [...mapa.entries()]
      .map(([id, v]) => ({ id, nome: v.nome, total: v.total }))
      .filter(x => x.total > 0)
      .sort((a, b) => b.total - a.total);
    const soma = lista.reduce((t, x) => t + x.total, 0) || 1;
    const max = lista[0]?.total || 1;
    return lista.slice(0, 10).map(x => ({ ...x, percentual: (x.total / soma) * 100, largura: (x.total / max) * 100 }));
  }

  readonly topFornecedores = computed(() => this._rankingPessoas([this.cfg.custos, this.cfg.despesas], -1));
  readonly topClientes = computed(() => this._rankingPessoas([this.cfg.entradas], 1));

  // ─── Linhas de total das tabelas ─────────────────────────────────────
  readonly totalProjecao = computed(() => {
    const f = this.fluxoPorPeriodo();
    return {
      entradas: f.reduce((t, x) => t + x.entradas, 0),
      saidas: f.reduce((t, x) => t + x.saidas, 0),
      saldo: f.reduce((t, x) => t + x.saldo, 0),
      acumulado: f.length ? f[f.length - 1].acumulado : this.saldoInicial(),
    };
  });

  /** Total da árvore = soma das contas RAIZ (somar pai + filhos contaria duas vezes). */
  readonly totalGerencial = computed(() => {
    const porPeriodo: Partial<Record<string, number>> = {};
    let total = 0;
    let anterior = 0;
    let temAnterior = false;
    for (const r of this.linhas().filter(l => l.pai === null)) {
      total += r.total;
      for (const [p, v] of Object.entries(r.porPeriodo)) porPeriodo[p] = (porPeriodo[p] ?? 0) + (v ?? 0);
      if (r.comparativo) { anterior += r.comparativo.anterior; temAnterior = true; }
    }
    return {
      porPeriodo,
      total,
      anterior: temAnterior ? anterior : null,
      variacao: temAnterior ? this.calcularVariacao(total, anterior) : null,
    };
  });

  // ─── Carga (só depende do período) ──────────────────────────
  carregar(): void {
    const inicio = this.dataInicio();
    const fim = this.dataFim();
    if (!inicio || !fim || inicio > fim) {
      this.erro.set('Período inválido. Verifique as datas informadas.');
      return;
    }

    const ant = this._periodoAnterior(inicio, fim);

    this._subFluxo?.unsubscribe();
    this._subDetalhe?.unsubscribe();
    this._cacheDetalhe.clear();
    this.fecharDetalhe();

    this.filtrosAplicados.set({ inicio, fim });
    this.carregando.set(true);
    this.erro.set(null);

    this._subFluxo = forkJoin({
      atual: this.api.getFluxoCaixa(inicio, fim),
      anterior: this.api
        .getFluxoCaixa(ant.inicio, ant.fim)
        .pipe(catchError(() => of({ total: 0, data: [] } as ApiResponse<FluxoCaixaItem>))),
    }).subscribe({
      next: ({ atual, anterior }) => {
        const linhasFluxo = atual.data ?? [];
        if (linhasFluxo.length && !linhasFluxo.some(r => r.id_pessoa != null && r.id_pessoa !== '')) {
          console.warn('[Fluxo de Caixa] /fluxo-caixa não retornou id_pessoa: o filtro de pessoa ficará vazio. Atualize a view vw_bi_fluxo_caixa e o endpoint.');
        }
        this._fluxo.set(atual.data ?? []);
        this._fluxoAnt.set(anterior.data ?? []);
        this._expandirRaizes();
        this.carregando.set(false);
      },
      error: err => {
        console.error('Erro ao carregar o Fluxo de Caixa:', err);
        this._fluxo.set([]);
        this._fluxoAnt.set([]);
        this.erro.set('Não foi possível carregar o Fluxo de Caixa. Tente novamente.');
        this.carregando.set(false);
      },
    });
  }

  // ─── Expandir / recolher ────────────────────────────────────
  toggleConta(classificacao: string): void {
    const nova = new Set(this.contasExpandidas());
    nova.has(classificacao) ? nova.delete(classificacao) : nova.add(classificacao);
    this.contasExpandidas.set(nova);
  }

  expandirTudo(): void {
    this.contasExpandidas.set(new Set(this.linhas().filter(l => l.temFilhos).map(l => l.classificacao)));
  }

  recolherTudo(): void {
    this.contasExpandidas.set(new Set());
  }

  private _expandirRaizes(): void {
    const existentes = new Set(this._fluxo().map(i => i.classificacao));
    const raizes = [...existentes].filter(c => this._paiExistente(c, existentes) === null);
    this.contasExpandidas.set(new Set(raizes));
  }

  setComparar(v: boolean): void {
    this.comparar.set(v);
  }

  togglePessoa(id: number): void {
    const nova = new Set(this.filtroPessoas());
    nova.has(id) ? nova.delete(id) : nova.add(id);
    this.filtroPessoas.set(nova);
  }

  toggleTodasPessoas(): void {
    const atual = this.filtroPessoas();
    const opcoes = this.opcoesPessoa();

    if (atual.size > 0 && atual.size === opcoes.length) {
      this.filtroPessoas.set(new Set());
    } else {
      this.filtroPessoas.set(new Set(opcoes.map(o => o.id)));
    }
  }

  setSaldoInicial(v: number): void {
    this.saldoInicial.set(Number.isFinite(v) ? v : 0);
  }

  // ─── Drill-down sob demanda ─────────────────────────────────
  private readonly _contaSelecionadaId = signal<string | null>(null);
  private readonly _titulosBrutos = signal<FluxoCaixaTitulo[]>([]);
  private readonly _pagina = signal<number>(1);
  private readonly _cacheDetalhe = new Map<string, FluxoCaixaTitulo[]>();

  readonly carregandoDetalhamento = signal<boolean>(false);
  readonly erroDetalhamento = signal<string | null>(null);

  readonly contaSelecionada = computed((): FluxoCaixaLinha | null => {
    const id = this._contaSelecionadaId();
    return id ? this.linhas().find(l => l.classificacao === id) ?? null : null;
  });

  readonly titulosAnaliticos = computed((): FluxoCaixaTitulo[] => this._filtrarPorPessoa(this._filtrarPorEmpresa(this._titulosBrutos())));

  readonly totalTitulos = computed(() => this.titulosAnaliticos().length);
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.totalTitulos() / this.TAMANHO_PAGINA)));
  readonly paginaDetalhe = computed(() => Math.min(this._pagina(), this.totalPaginas()));
  readonly titulosPagina = computed(() => {
    const ini = (this.paginaDetalhe() - 1) * this.TAMANHO_PAGINA;
    return this.titulosAnaliticos().slice(ini, ini + this.TAMANHO_PAGINA);
  });
  readonly somaTitulos = computed(() => this.titulosAnaliticos().reduce((s, t) => s + (t.valor_total ?? 0), 0));

  irParaPagina(p: number): void {
    this._pagina.set(Math.min(Math.max(1, p), this.totalPaginas()));
  }

  abrirDetalhe(linha: FluxoCaixaLinha): void {
    if (!linha.eh_analitica) return;

    this._subDetalhe?.unsubscribe();
    this._contaSelecionadaId.set(linha.classificacao);
    this._pagina.set(1);
    this.erroDetalhamento.set(null);

    const cache = this._cacheDetalhe.get(linha.classificacao);
    if (cache) {
      this._titulosBrutos.set(cache);
      this.carregandoDetalhamento.set(false);
      return;
    }

    const f = this.filtrosAplicados();
    if (!f) return;

    this._titulosBrutos.set([]);
    this.carregandoDetalhamento.set(true);

    this._subDetalhe = this.api.getFluxoCaixaTitulos(linha.classificacao, f.inicio, f.fim).subscribe({
      next: res => {
        const titulos = res.data ?? [];
        this._cacheDetalhe.set(linha.classificacao, titulos);
        this._titulosBrutos.set(titulos);
        this.carregandoDetalhamento.set(false);
      },
      error: err => {
        console.error('Erro ao carregar títulos da conta:', err);
        this.erroDetalhamento.set('Não foi possível carregar os títulos desta conta. Tente novamente.');
        this.carregandoDetalhamento.set(false);
      },
    });
  }

  fecharDetalhe(): void {
    this._subDetalhe?.unsubscribe();
    this._contaSelecionadaId.set(null);
    this._titulosBrutos.set([]);
    this.erroDetalhamento.set(null);
    this.carregandoDetalhamento.set(false);
    this._pagina.set(1);
  }

  // ─── Exportação ─────────────────────────────────────────────
  linhasParaExport(): Record<string, string | number>[] {
    const periodos = this.periodos();
    return this.linhas().map(l => {
      const meses: Record<string, number> = {};
      periodos.forEach(p => (meses[this.formatarPeriodo(p)] = l.porPeriodo[p] ?? 0));
      return {
        'Classificação': l.classificacao,
        'Conta': l.descricao.replace(/^\.+\s*/, ''),
        'Tipo': l.eh_analitica ? 'Analítica' : 'Sintética',
        ...meses,
        'Total (R$)': l.total,
        '% Entradas': l.percentualEntradas == null ? '' : Number(l.percentualEntradas.toFixed(2)),
        ...(this.comparar()
          ? { 'Anterior (R$)': l.comparativo?.anterior ?? '', 'Variação (%)': l.comparativo?.variacao ?? '' }
          : {}),
      };
    });
  }

  fluxoParaExport(): Record<string, string | number>[] {
    return this.fluxoPorPeriodo().map(f => ({
      'Período': this.formatarPeriodo(f.periodo),
      'Entradas (R$)': f.entradas,
      'Saídas (R$)': f.saidas,
      'Saldo do período (R$)': f.saldo,
      'Saldo acumulado (R$)': f.acumulado,
    }));
  }

  titulosParaExport(): Record<string, string | number>[] {
    return this.titulosAnaliticos().map(t => ({
      'Código': t.codigo,
      'Empresa': t.nome_empresa ?? '',
      'Cliente/Fornecedor': t.nome_pessoa ?? '',
      'Documento': t.numero_documento ?? '',
      'Descrição': t.descricao ?? '',
      'Origem': t.origem ?? '',
      'Competência': t.data_competencia ?? '',
      'Vencimento': t.data_vencimento ?? '',
      'Baixa': t.data_baixa ?? '',
      'Valor (R$)': t.valor_total,
      'Valor Pago (R$)': t.valor_pago ?? '',
      'Situação': t.descricao_situacao ?? '',
      'Status Financeiro': t.status_financeiro ?? '',
    }));
  }

  // ─── Formatadores ───────────────────────────────────────────
  private readonly _moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  private readonly _pct = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  private static readonly MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  formatarMoeda(v: number | null | undefined): string {
    return v == null ? '—' : this._moeda.format(v);
  }
  formatarPercentual(v: number | null | undefined): string {
    return v == null ? '—' : `${this._pct.format(v)}%`;
  }
  formatarData(s: string | null | undefined): string {
    if (!s) return '—';
    const [a, m, d] = s.slice(0, 10).split('-');
    return d && m && a ? `${d}/${m}/${a}` : s;
  }
  /** "2026-10" → "out/2026" */
  formatarPeriodo(p: string | null | undefined): string {
    if (!p) return '—';
    const [a, m] = p.split('-');
    const nome = FluxoCaixaService.MESES[Number(m) - 1];
    return nome && a ? `${nome}/${a}` : p;
  }

  // ─── Helpers privados ───────────────────────────────────────
  private _paiExistente(classificacao: string, existentes: Set<string>): string | null {
    let p = classificacao;
    while (p.includes('.')) {
      p = p.slice(0, p.lastIndexOf('.'));
      if (existentes.has(p)) return p;
    }
    return null;
  }

  private _compararClassificacao(a: string, b: string): number {
    const pa = a.split('.');
    const pb = b.split('.');
    const n = Math.min(pa.length, pb.length);
    for (let i = 0; i < n; i++) {
      const na = Number(pa[i]);
      const nb = Number(pb[i]);
      const diff = !isNaN(na) && !isNaN(nb) ? na - nb : pa[i].localeCompare(pb[i]);
      if (diff !== 0) return diff;
    }
    return pa.length - pb.length;
  }

  private _periodoAnterior(inicio: string, fim: string): { inicio: string; fim: string } {
    const di = this._parseDate(inicio);
    const df = this._parseDate(fim);
    const dias = Math.floor((df.getTime() - di.getTime()) / 86400000) + 1;
    const fimAnt = new Date(di);
    fimAnt.setDate(fimAnt.getDate() - 1);
    const iniAnt = new Date(fimAnt);
    iniAnt.setDate(iniAnt.getDate() - (dias - 1));
    return { inicio: this._fmt(iniAnt), fim: this._fmt(fimAnt) };
  }

  /** Primeiro dia do mês, `meses` meses antes do atual. */
  private _primeiroDiaMesesAtras(meses: number): Date {
    const h = new Date();
    return new Date(h.getFullYear(), h.getMonth() - meses, 1);
  }

  private _fmt(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private _parseDate(s: string): Date {
    const [ano, mes, dia] = s.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  }
}