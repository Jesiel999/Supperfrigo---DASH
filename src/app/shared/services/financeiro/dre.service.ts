// shared/services/financeiro/dre.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { EmpresaFilterService } from '../empresa-filter.service';
import { ApiResponse, MaioresDevedores } from '../../models/financeiro/financeiro.models';
import { Serie } from '../../models/graficos.models';
import { FiltroOpcao } from '../../components/multi-select-filter/pessoa_filter';
import {
  DRE_CLASSIFICACOES,
  DreComparativo,
  DreDespesaMes,
  DreFiltrosAplicados,
  DreItem,
  DreKpi,
  DreLinha,
  DreTitulo,
} from '../../models/financeiro/dre.models';

@Injectable({ providedIn: 'root' })
export class DreService {
  private readonly api = inject(ApiService);
  readonly empresaFilter = inject(EmpresaFilterService);

  // ─── Filtro de Pessoa BI (mesmo padrão do ReceberService) ─────────────────────
  readonly filtroPessoas = signal<Set<number>>(new Set());

  /** Opções vindas dos próprios dados carregados (já respeitando o filtro de empresa). */
  readonly opcoesPessoa = computed((): FiltroOpcao[] => {
    const mapa = new Map<number, string>();
    for (const i of this._filtrarPorEmpresa(this._dre())) {
      if (i.id_pessoa == null || i.id_pessoa === '') continue;
      const id = Number(i.id_pessoa);
      if (!Number.isFinite(id) || mapa.has(id)) continue;
      mapa.set(id, i.nome_pessoa ?? `Pessoa #${id}`);
    }
    return Array.from(mapa.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  });

  readonly cfg = DRE_CLASSIFICACOES;
  readonly TAMANHO_PAGINA = 50;

  // ─── Filtros ────────────────────────────────────────────────
  private getPrimeiroDiaMes(): string {
    const h = new Date();
    return this._fmt(new Date(h.getFullYear(), h.getMonth() - 3));
  }
  private getUltimoDiaMes(): string {
    const h = new Date();
    return this._fmt(new Date(h.getFullYear(), h.getMonth(), 0));
  }

  readonly dataInicio = signal<string>(this.getPrimeiroDiaMes());
  readonly dataFim = signal<string>(this.getUltimoDiaMes());

  /** true = considera títulos em aberto; false = apenas baixados (realizado). */
  readonly incluirAbertos = signal<boolean>(true);

  /** Período/filtros da última carga. O drill-down usa ESTES, não os inputs. */
  readonly filtrosAplicados = signal<DreFiltrosAplicados | null>(null);

  // ─── Estado da tela ─────────────────────────────────────────
  readonly carregando = signal<boolean>(false);
  readonly erro = signal<string | null>(null);
  readonly comparar = signal<boolean>(false);

  // Dados brutos (todas as empresas)
  private readonly _dre = signal<DreItem[]>([]);
  private readonly _dreAnt = signal<DreItem[]>([]);

  readonly contasExpandidas = signal<ReadonlySet<string>>(new Set());

  private _subDre?: Subscription;
  private _subDetalhe?: Subscription;

  // ─── Atualização ────────────────────────────────────────────
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
    const lista = this._dre();

    const datas = lista
      .map(item => item.ultima_atualizacao)
      .filter((data): data is string => !!data);

    if (!datas.length) {
      return null;
    }

    return datas.reduce((ultima, atual) => {
      return new Date(atual.replace(' ', 'T')).getTime() >
        new Date(ultima.replace(' ', 'T')).getTime()
        ? atual
        : ultima;
    });
  });

  readonly ultimaAtualizacaoFormatada = computed(() =>
    this.formatarDataHora(this.ultimaAtualizacao())
  );

  readonly proximaAtualizacaoFormatada = computed(() =>
    this.proximaAtualizacao(this.ultimaAtualizacao())
  );

  private _filtrarPorEmpresa<T extends { id_empresa?: number | string | null }>(lista: T[]): T[] {
    const empresas = this.empresaFilter.selecionadas();
    if (empresas.size === 0) return lista;
    // Itens sem id_empresa não têm como ser filtrados: são mantidos (ver aviso na tela).
    return lista.filter(i => i.id_empresa == null || empresas.has(Number(i.id_empresa)));
  }

  /** Filtro de Pessoa BI — mesmo padrão do ReceberService (local, sem nova requisição). */
  private _filtrarPorPessoa<T extends { id_pessoa?: number | string | null }>(lista: T[]): T[] {
    const pessoas = this.filtroPessoas();
    if (pessoas.size === 0) return lista;
    return lista.filter(i => pessoas.has(Number(i.id_pessoa)));
  }

  /** Soma por classificação (a API devolve empresa × conta). */
  private _agregar(itens: DreItem[]): DreItem[] {
    const mapa = new Map<string, DreItem>();
    for (const i of itens) {
      const atual = mapa.get(i.classificacao);
      if (atual) {
        atual.total += Number(i.total ?? 0);
        atual.eh_analitica = atual.eh_analitica || i.eh_analitica;
      } else {
        mapa.set(i.classificacao, {
          classificacao: i.classificacao,
          descricao: i.descricao,
          eh_analitica: i.eh_analitica,
          total: Number(i.total ?? 0),
          ultima_atualizacao: i.ultima_atualizacao,
        });
      }
    }
    return Array.from(mapa.values());
  }

  private readonly _dreBase = computed(() => this._agregar(this._filtrarPorPessoa(this._filtrarPorEmpresa(this._dre()))));
  private readonly _dreBaseAnt = computed(() => this._agregar(this._filtrarPorPessoa(this._filtrarPorEmpresa(this._dreAnt()))));

  /** true quando há empresa selecionada mas a API não enviou id_empresa → filtro impossível. */
  readonly filtroEmpresaIndisponivel = computed(
    () => this.empresaFilter.selecionadas().size > 0 && this._dre().some(i => i.id_empresa == null)
  );

  // ─── Hierarquia ─────────────────────────────────────────────
  private readonly _itensOrdenados = computed(() =>
    [...this._dreBase()].sort((a, b) => this._compararClassificacao(a.classificacao, b.classificacao))
  );
  private readonly _mapaAtual = computed(() => new Map(this._dreBase().map(i => [i.classificacao, i])));
  private readonly _mapaAnterior = computed(() => new Map(this._dreBaseAnt().map(i => [i.classificacao, i])));

  readonly receitaBase = computed(() => this._mapaAtual().get(this.cfg.receitas)?.total ?? 0);

  /** Todas as linhas, com nível, pai, %, comparativo. */
  readonly linhas = computed((): DreLinha[] => {
    const itens = this._itensOrdenados();
    const anterior = this._mapaAnterior();
    const receita = this.receitaBase();
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
      const comparativo: DreComparativo | null = ant
        ? { atual: i.total, anterior: ant.total, variacao: this.calcularVariacao(i.total, ant.total) }
        : null;
      return {
        ...i,
        nivel: i.classificacao.split('.').length - 1,
        pai: paiDe.get(i.classificacao) ?? null,
        temFilhos: paisComFilhos.has(i.classificacao),
        percentualReceita: this.calcularPercentualReceita(i.total, receita),
        comparativo,
      };
    });
  });

  /** Apenas as linhas visíveis conforme as contas expandidas (pais vêm antes dos filhos). */
  readonly linhasVisiveis = computed((): DreLinha[] => {
    const expandidas = this.contasExpandidas();
    const visiveis = new Set<string>();
    const resultado: DreLinha[] = [];
    for (const l of this.linhas()) {
      if (l.pai === null || (visiveis.has(l.pai) && expandidas.has(l.pai))) {
        visiveis.add(l.classificacao);
        resultado.push(l);
      }
    }
    return resultado;
  });

  readonly semDados = computed(() => !this.carregando() && !this.erro() && this._dreBase().length === 0);

  // ─── Regras de negócio isoladas (fáceis de alterar) ─────────

  /**
   * % da Receita = valor / receita × 100, mantendo o sinal.
   * ⚠️ O briefing mostra custos/despesas como % positivo e resultado como negativo.
   * Se quiser exibir custos em módulo, ajuste aqui.
   */
  calcularPercentualReceita(valor: number, receita: number): number | null {
    if (!receita) return null;
    return (valor / receita) * 100;
  }

  /**
   * Variação = (atual − anterior) / |anterior| × 100.
   * ⚠️ Para contas negativas (custos), o sinal resultante é o do valor com sinal.
   * Se quiser variação sobre o módulo (custo maior = +), ajuste aqui.
   */
  calcularVariacao(atual: number, anterior: number): number | null {
    if (!anterior) return null;
    return Number((((atual - anterior) / Math.abs(anterior)) * 100).toFixed(2));
  }

  /** Receitas − |Custos| − |Despesas|. Independe da convenção de sinal da API. */
  private _calcularResultadoOperacional(receitas: number, custos: number, despesas: number): number {
    return receitas - Math.abs(custos) - Math.abs(despesas);
  }

  // ─── KPIs ───────────────────────────────────────────────────
  private _valoresKpi(mapa: Map<string, DreItem>) {
    const receitas = mapa.get(this.cfg.receitas)?.total ?? 0;
    const custos = mapa.get(this.cfg.custos)?.total ?? 0;
    const despesas = mapa.get(this.cfg.despesas)?.total ?? 0;
    const resultadoLiquido = mapa.get(this.cfg.resultado)?.total ?? 0;
    const resultadoOperacional = this._calcularResultadoOperacional(receitas, custos, despesas);
    return { receitas, custos, despesas, resultadoOperacional, resultadoLiquido };
  }

  readonly kpis = computed((): DreKpi => {
    const a = this._valoresKpi(this._mapaAtual());
    const b = this._valoresKpi(this._mapaAnterior());
    const v = (x: number, y: number) => this.calcularVariacao(x, y) ?? 0;
    return {
      receitas: a.receitas,
      custos: Math.abs(a.custos),
      despesas: Math.abs(a.despesas),
      resultadoOperacional: a.resultadoOperacional,
      margemOperacional: a.receitas ? (a.resultadoOperacional / a.receitas) * 100 : null,
      resultadoLiquido: a.resultadoLiquido,
      variacaoReceitas: v(a.receitas, b.receitas),
      variacaoCustos: v(Math.abs(a.custos), Math.abs(b.custos)),
      variacaoDespesas: v(Math.abs(a.despesas), Math.abs(b.despesas)),
      variacaoResultadoOperacional: v(a.resultadoOperacional, b.resultadoOperacional),
      variacaoResultadoLiquido: v(a.resultadoLiquido, b.resultadoLiquido),
    };
  });

  // ─── Gráficos ───────────────────────────────────────────────
  // Cor por sinal do valor ORIGINAL: positivo = azul, negativo = vermelho.
  // (as barras usam o módulo, por isso o sinal é guardado à parte e vira o array de cores)
  readonly COR_POSITIVO = '#38BDF8';
  readonly COR_NEGATIVO = '#f43f5e';
  private _cor(v: number): string {
    return v < 0 ? this.COR_NEGATIVO : this.COR_POSITIVO;
  }

  private readonly _composicaoBase = computed(() => {
    const a = this._valoresKpi(this._mapaAtual());
    return [
      { nome: 'Receitas', total: a.receitas },
      { nome: 'Custos', total: a.custos },
      { nome: 'Despesas', total: a.despesas },
      { nome: a.resultadoLiquido < 0 ? 'Resultado (negativo)' : 'Resultado', total: a.resultadoLiquido },
    ];
  });

  /** Gráfico 1 — Composição (valores em módulo; barras não suportam negativos). */
  readonly composicaoResultado = computed((): MaioresDevedores[] => {
    const itens = this._composicaoBase();
    const base = Math.abs(this.kpis().receitas) || 1;
    return itens.map(i => ({
      nome: i.nome,
      valor: Math.abs(i.total),
      percentual: (Math.abs(i.total) / base) * 100,
      diasAtrasoMedio: 0,
    }));
  });
  readonly composicaoResultadoCores = computed(() => this._composicaoBase().map(i => this._cor(i.total)));

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

  /** Gráfico 2 — Contas analíticas de maior impacto (|valor|). */
  readonly topContas = computed((): MaioresDevedores[] => this._topContasBase().map(x => x.item));
  readonly topContasCores = computed(() => this._topContasBase().map(x => this._cor(x.total)));

  // ─── Carga da DRE (depende do período e do filtro de abertos) ──
  carregar(): void {
    const abertos = this.incluirAbertos();
    const inicio = this.dataInicio();
    const fim = this.dataFim();
    if (!inicio || !fim || inicio > fim) {
      this.erro.set('Período inválido. Verifique as datas informadas.');
      return;
    }

    const ant = this._periodoAnterior(inicio, fim);

    // Mudou o período/filtro → descarta cache de títulos e fecha o detalhamento
    this._subDre?.unsubscribe();
    this._subDetalhe?.unsubscribe();
    this._cacheDetalhe.clear();
    this.fecharDetalhe();

    this.filtrosAplicados.set({ inicio, fim, incluirAbertos: abertos });
    this.carregando.set(true);
    this.erro.set(null);
    this._carregarDespesas(inicio, fim, abertos);

    this._subDre = forkJoin({
      atual: this.api.getDre(inicio, fim, abertos),
      anterior: this.api
        .getDre(ant.inicio, ant.fim, abertos)
        .pipe(catchError(() => of({ total: 0, data: [] } as ApiResponse<DreItem>))),
    }).subscribe({
      next: ({ atual, anterior }) => {
        const linhasDre = atual.data ?? [];
        if (linhasDre.length && !linhasDre.some(r => r.id_pessoa != null && r.id_pessoa !== '')) {
          console.warn('[DRE] /dre não retornou id_pessoa: o filtro de pessoa ficará vazio. Atualize a view vw_bi_dre e o endpoint /dre.');
        }
        this._dre.set(atual.data ?? []);
        this._dreAnt.set(anterior.data ?? []);
        this._expandirRaizes();
        this.carregando.set(false);
      },
      error: err => {
        console.error('Erro ao carregar DRE:', err);
        this._dre.set([]);
        this._dreAnt.set([]);
        this.erro.set('Não foi possível carregar a DRE. Tente novamente.');
        this.carregando.set(false);
      },
    });
  }

  // ─── Despesas por mês (gráficos de linha: somente despesas, conta 3.3) ──
  private readonly _despesasMes = signal<DreDespesaMes[]>([]);
  readonly carregandoDespesas = signal<boolean>(false);
  private _subDespesas?: Subscription;

  private static readonly PALETA_LINHAS = ['#f43f5e', '#fb923c', '#facc15', '#a78bfa', '#38bdf8', '#34d399', '#f472b6', '#818cf8', '#2dd4bf', '#a3e635', '#e879f9', '#94a3b8'];
  private static readonly MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  /** "2026-10" → "out/2026" (o line-chart mostra o texto como veio quando não é data ISO). */
  formatarPeriodo(p: string): string {
    const [a, m] = p.split('-');
    const nome = DreService.MESES[Number(m) - 1];
    return nome && a ? `${nome}/${a}` : p;
  }

  private readonly _despesasFiltradas = computed(() => this._filtrarPorPessoa(this._filtrarPorEmpresa(this._despesasMes())));

  /** Meses presentes (eixo X). */
  readonly periodosDespesas = computed((): string[] =>
    [...new Set(this._despesasFiltradas().map(d => d.periodo))].sort()
  );

  /** Composição do Resultado → uma linha: total de despesas por mês (valor positivo). */
  readonly serieDespesas = computed((): Serie[] => {
    const porMes = new Map<string, number>();
    for (const d of this._despesasFiltradas()) {
      porMes.set(d.periodo, (porMes.get(d.periodo) ?? 0) - Number(d.total ?? 0)); // despesa vem negativa
    }
    return [
      {
        id: 'despesas',
        label: 'Despesas',
        cor: '#f43f5e',
        formatador: 'currency',
        pontos: this.periodosDespesas().map(p => ({ data: this.formatarPeriodo(p), valor: porMes.get(p) ?? 0 })),
      },
    ];
  });

  /**
   * Contas de Maior Impacto → UMA série por conta de despesa (todas, da maior para a menor).
   * O line-chart mostra as 5 maiores por padrão e deixa escolher as contas ([seletorSeries]="true").
   */
  readonly seriesTopDespesas = computed((): Serie[] => {
    const periodos = this.periodosDespesas();
    const contas = new Map<string, { nome: string; total: number; porMes: Map<string, number> }>();
    for (const d of this._despesasFiltradas()) {
      const v = -Number(d.total ?? 0);
      let c = contas.get(d.classificacao);
      if (!c) {
        c = { nome: d.descricao.replace(/^\.+\s*/, ''), total: 0, porMes: new Map<string, number>() };
        contas.set(d.classificacao, c);
      }
      c.total += v;
      c.porMes.set(d.periodo, (c.porMes.get(d.periodo) ?? 0) + v);
    }

    const ordenadas = [...contas.entries()].sort((a, b) => b[1].total - a[1].total);
    const repetidos = new Map<string, number>();
    ordenadas.forEach(([, c]) => repetidos.set(c.nome, (repetidos.get(c.nome) ?? 0) + 1));

    return ordenadas.map(([id, c], i) => ({
      id,
      // nomes repetidos ganham a classificação para dar para distinguir no seletor e na legenda
      label: (repetidos.get(c.nome) ?? 0) > 1 ? `${c.nome} (${id})` : c.nome,
      cor: DreService.PALETA_LINHAS[i % DreService.PALETA_LINHAS.length],
      formatador: 'currency' as const,
      pontos: periodos.map(p => ({ data: this.formatarPeriodo(p), valor: c.porMes.get(p) ?? 0 })),
    }));
  });

  private _carregarDespesas(inicio: string, fim: string, abertos: boolean): void {
    this._subDespesas?.unsubscribe();
    this.carregandoDespesas.set(true);
    this._subDespesas = this.api.getDreDespesasMensal(inicio, fim, abertos).subscribe({
      next: res => {
        this._despesasMes.set(res.data ?? []);
        this.carregandoDespesas.set(false);
      },
      error: err => {
        console.error('Erro ao carregar despesas por mês:', err);
        this._despesasMes.set([]);
        this.carregandoDespesas.set(false);
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

  /** Abre apenas a(s) raiz(es), calculadas sobre os dados brutos (independe do filtro de empresa). */
  private _expandirRaizes(): void {
    const existentes = new Set(this._dre().map(i => i.classificacao));
    const raizes = [...existentes].filter(c => this._paiExistente(c, existentes) === null);
    this.contasExpandidas.set(new Set(raizes));
  }

  setComparar(v: boolean): void {
    this.comparar.set(v);
  }

  /** O filtro é aplicado no servidor: recarrega a DRE e limpa o cache de títulos. */
  setIncluirAbertos(v: boolean): void {
    this.incluirAbertos.set(v);
    this.carregar();
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

  // ─── Drill-down sob demanda ─────────────────────────────────
  // A busca de títulos NÃO depende da empresa: o cache vale por conta+período+filtro
  // e o filtro de empresa é aplicado localmente sobre o array carregado.
  private readonly _contaSelecionadaId = signal<string | null>(null);
  private readonly _titulosBrutos = signal<DreTitulo[]>([]);
  private readonly _pagina = signal<number>(1);
  private readonly _cacheDetalhe = new Map<string, DreTitulo[]>();

  readonly carregandoDetalhamento = signal<boolean>(false);
  readonly erroDetalhamento = signal<string | null>(null);

  /** Conta aberta no painel, sempre com o valor atual (reage ao filtro de empresa). */
  readonly contaSelecionada = computed((): DreLinha | null => {
    const id = this._contaSelecionadaId();
    return id ? this.linhas().find(l => l.classificacao === id) ?? null : null;
  });

  readonly titulosAnaliticos = computed((): DreTitulo[] => this._filtrarPorPessoa(this._filtrarPorEmpresa(this._titulosBrutos())));

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

  abrirDetalhe(linha: DreLinha): void {
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

    this._subDetalhe = this.api.getDreTitulos(linha.classificacao, f.inicio, f.fim, f.incluirAbertos).subscribe({
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

  // ─── Exportação (retorna linhas prontas para o ExcelExportService) ──
  linhasParaExport(): Record<string, string | number>[] {
    return this.linhas().map(l => ({
      'Classificação': l.classificacao,
      'Conta': l.descricao.replace(/^\.+\s*/, ''),
      'Tipo': l.eh_analitica ? 'Analítica' : 'Sintética',
      'Valor (R$)': l.total,
      '% Receita': l.percentualReceita == null ? '' : Number(l.percentualReceita.toFixed(2)),
      ...(this.comparar()
        ? {
            'Anterior (R$)': l.comparativo?.anterior ?? '',
            'Variação (%)': l.comparativo?.variacao ?? '',
          }
        : {}),
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

  private _fmt(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private _parseDate(s: string): Date {
    const [ano, mes, dia] = s.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  }
}