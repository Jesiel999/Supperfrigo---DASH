import { Injectable, signal, computed, inject } from '@angular/core';
import { EmpresaFilterService } from './empresa-filter.service';
import { ApiService } from './api.service';
import { forkJoin } from 'rxjs';
import {
  ClienteInadimplente,
  FaixaAtraso,
  InadimplenciaApiItem,
  KpiInadimplencia,
  PontoGrafico,
  StatusInadimplencia,
  MaioresDevedores,
} from '../models/financeiro.models';
import { FiltroOpcao } from '../components/multi-select-filter/pessoa_filter';

const PALETA_EMPRESAS = [
  '#f43f5e', '#fb923c', '#38bdf8', '#a78bfa',
  '#34d399', '#fbbf24', '#818cf8', '#f472b6',
];

@Injectable({ providedIn: 'root' })
export class InadimplenciaService {
  private readonly api          = inject(ApiService);
  readonly          empresaFilter = inject(EmpresaFilterService);

  // ─── Período ──────────────────────────────────────────────────
  private getPrimeiroDiaMes(): string {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`;
  }
  private getHoje(): string {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);

    return `${ontem.getFullYear()}-${String(ontem.getMonth() + 1).padStart(2, '0')}-${String(ontem.getDate()).padStart(2, '0')}`;
  }
  

  readonly dataInicio = signal<string>(this.getPrimeiroDiaMes());
  readonly dataFim    = signal<string>(this.getHoje());
  readonly periodo    = signal<string>('');

  // ─── Filtros locais ───────────────────────────────────────────
  readonly filtroStatus = signal<string>('todos');
  readonly busca        = signal<string>('');
  readonly carregando   = signal<boolean>(false);

  // Conjunto vazio == "todos" (sem restrição) — mesma convenção do
  // EmpresaFilterService. Filtra por id_pessoa em TODO o escopo
  // (KPIs, gráfico, maiores devedores, faixas de atraso) — EXCETO
  // na planilha/tabela, que continua mostrando todos os clientes
  // (respeitando apenas empresa + busca + status).
  readonly filtroPessoas = signal<Set<number>>(new Set());

  // ─── Dados BRUTOS vindos da API (nunca filtrados) ─────────────
  // Separar bruto do filtrado é o ponto central da correção.
  // Tudo que depende de filtro deve ser computed, não calculado no subscribe.
  private readonly _todosBrutos      = signal<ClienteInadimplente[]>([]);
  private readonly _todosBrutosAnt   = signal<ClienteInadimplente[]>([]);
  private readonly _diasPeriodo      = signal<string[]>([]);
  private readonly _fmtInicio        = signal<string>('');
  private readonly _fmtFim           = signal<string>('');

  formatarDataHora(data: string | null | undefined): string {
    if (!data) return '-';

    const dt = new Date(data.replace(' ', 'T'));

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dt);
  }

  proximaAtualizacao(data: string | null | undefined): string {
    if (!data) return '-';

    const dt = new Date(data.replace(' ', 'T'));

    dt.setMinutes(dt.getMinutes() + 30);

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dt);
  }

  readonly ultimaAtualizacao = computed(() => {

    const lista = this._todosBrutos();

    if (!lista.length) return null;

    return lista
      .map(x => x.ultima_atualizacao)
      .sort()
      .at(-1) ?? null;
  });

  readonly ultimaAtualizacaoFormatada = computed(() =>
    this.formatarDataHora(this.ultimaAtualizacao())
  );

  readonly proximaAtualizacaoFormatada = computed(() =>
    this.proximaAtualizacao(this.ultimaAtualizacao())
  );

  // ─── Filtro de empresa aplicado reativamente (BASE — sem id_pessoa) ──
  // Esta é a base usada pela TABELA (planilha), que não deve ser
  // afetada pelo filtro de cliente/id_pessoa.
  private readonly _inadimplentesBase = computed(() => {
    const brutos   = this._todosBrutos();
    const empresas = this.empresaFilter.selecionadas();

    const semBaixa = brutos.filter(c => !c.data_baixa);

    if (empresas.size === 0) return semBaixa;
    return semBaixa.filter(c => empresas.has(Number(c.id_empresa)));
  });

  private readonly _inadimplentesBaseAnt = computed(() => {
    const brutos   = this._todosBrutosAnt();
    const empresas = this.empresaFilter.selecionadas();

    const semBaixa = brutos.filter(c => !c.data_baixa);

    if (empresas.size === 0) return semBaixa;
    return semBaixa.filter(c => empresas.has(Number(c.id_empresa)));
  });

  // ─── Filtro de id_pessoa aplicado por cima da base ────────────
  // Usado em TUDO (KPIs, gráfico, maiores devedores, faixas de
  // atraso) — menos na tabela, que usa a base diretamente.
  private _filtrarPorPessoa(lista: ClienteInadimplente[]): ClienteInadimplente[] {
    const pessoas = this.filtroPessoas();
    if (pessoas.size === 0) return lista;
    return lista.filter(c => pessoas.has(Number(c.id_pessoa)));
  }

  private readonly _inadimplentes = computed(() =>
    this._filtrarPorPessoa(this._inadimplentesBase())
  );

  private readonly _inadimplentesAnt = computed(() =>
    this._filtrarPorPessoa(this._inadimplentesBaseAnt())
  );

  private readonly _comBaixa = computed(() => {
    const brutos   = this._todosBrutos();
    const empresas = this.empresaFilter.selecionadas();

    const porEmpresa = empresas.size === 0
      ? brutos
      : brutos.filter(c => empresas.has(Number(c.id_empresa)));

    return this._filtrarPorPessoa(porEmpresa);
  });

  private readonly _comBaixaAnt = computed(() => {
    const brutos   = this._todosBrutosAnt();
    const empresas = this.empresaFilter.selecionadas();

    const porEmpresa = empresas.size === 0
      ? brutos
      : brutos.filter(c => empresas.has(Number(c.id_empresa)));

    return this._filtrarPorPessoa(porEmpresa);
  });

  // ─── Opções para o dropdown de clientes (id_pessoa) ───────────
  // Derivadas da BASE (empresa aplicada, mas sem o filtro de
  // pessoa), para que a lista de opções não "encolha" conforme o
  // usuário vai selecionando.
  readonly opcoesPessoa = computed((): FiltroOpcao[] => {
    const base = this._inadimplentesBase();
    const map  = new Map<number, string>();

    base.forEach(c => {
      const id = Number(c.id_pessoa);
      if (!map.has(id)) map.set(id, c.nome_pessoa ?? `Cliente #${id}`);
    });

    return Array.from(map.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  });

  // ─── KPIs — computed reativo ──────────────────────────────────
  readonly kpis = computed((): KpiInadimplencia => {
    const inadAtual  = this._inadimplentes();
    const inadAnt    = this._inadimplentesAnt();
    const inicio     = this._fmtInicio();
    const fim        = this._fmtFim();

    const totalAtual    = inadAtual.reduce((s, c) => s + c.valor_total, 0);
    const totalAnterior = inadAnt.reduce((s, c) => s + c.valor_total, 0);

    const qtdAtual    = new Set(inadAtual.map(c => c.id_pessoa)).size;
    const qtdAnterior = new Set(inadAnt.map(c => c.id_pessoa)).size;

    const qtdTitulosAtual = new Set(inadAtual).size;
    const qtdTitulosAnterior = new Set(inadAnt).size;
    
    const ticketAtual    = qtdTitulosAtual    ? totalAtual    / qtdTitulosAtual    : 0;
    const ticketAnterior = qtdTitulosAnterior ? totalAnterior / qtdTitulosAnterior : 0;

    return {
      totalInadimplente: totalAtual,
      clientesInadimplentes: qtdAtual,
      ticketMedio: ticketAtual,
      qtdTitulosAtual,
      variacaoTotal: this._var(totalAtual, totalAnterior),
      variacaoClientes: this._var(qtdAtual, qtdAnterior),
      variacaoTicket: this._var(ticketAtual, ticketAnterior),
      variacaoTitulos: this._var(qtdTitulosAtual, qtdTitulosAnterior),
    };
  });

  // ─── Gráfico — computed reativo ───────────────────────────────
  readonly pontosGrafico = computed((): PontoGrafico[] => {
    const inadAtual = this._inadimplentes();
    const comBaixa  = this._comBaixa();
    const dias      = this._diasPeriodo();
    const inicio    = this._fmtInicio();
    const fim       = this._fmtFim();

    if (!dias.length || !inicio || !fim) return [];

    const dtInicio = this._parseDate(inicio);
    const dtFim    = this._parseDate(fim);

    const evolucaoMap   = new Map<string, number>();

    // Linha vermelha: soma valor_total por data_vencimento, APENAS de quem não tem data_baixa
    inadAtual.forEach(c => {
      const dt = this._parseDate(c.data_vencimento);
      if (dt < dtInicio || dt > dtFim) return;
      evolucaoMap.set(c.data_vencimento, (evolucaoMap.get(c.data_vencimento) ?? 0) + c.valor_total);
    });


    return dias.map(d => ({
      data:         d,
      inadimplente: evolucaoMap.get(d)  ?? 0,
    }));
  });

  // ─── Top devedores — computed reativo ────────────────────────
  readonly topDevedores = computed((): MaioresDevedores[] => {
    const inadAtual  = this._inadimplentes();
    const totalAtual = inadAtual.reduce((s, c) => s + c.valor_total, 0);

    const map = new Map<string, { nome: string; valor: number }>();
    inadAtual.forEach(c => {
      const key = c.nome_pessoa ?? 'Desconhecido';
      if (!map.has(key)) map.set(key, { nome: key, valor: 0 });
      map.get(key)!.valor += c.valor_total;
    });

    return Array.from(map.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 1000)
      .map(item => ({
        nome:       item.nome,
        valor:      item.valor,
        percentual: totalAtual > 0 ? (item.valor / totalAtual) * 100 : 0,
      }));
  });

  // ─── Faixas de atraso — computed reativo ─────────────────────
  readonly faixasAtraso = computed((): FaixaAtraso[] => {
    const inad  = this._inadimplentes();
    const total = inad.length || 1;

    return [
      { label: '1–30 dias',  percentual: Math.round(inad.filter(c => c.dias_atraso >= 1  && c.dias_atraso <= 30).length / total * 100), cor: '#fb923c' },
      { label: '31–60 dias', percentual: Math.round(inad.filter(c => c.dias_atraso >= 31 && c.dias_atraso <= 60).length / total * 100), cor: '#f43f5e' },
      { label: '61–90 dias', percentual: Math.round(inad.filter(c => c.dias_atraso >= 61 && c.dias_atraso <= 90).length / total * 100), cor: '#38bdf8' },
      { label: '+90 dias',   percentual: Math.round(inad.filter(c => c.dias_atraso > 90).length                          / total * 100), cor: '#a78bfa' },
    ];
  });

  // ─── Agrupamento de filiais — pega só o primeiro "nome" da
  // razão social para consolidar filiais sob a mesma matriz.
  // Ex: "ACME COMERCIO FILIAL 02" e "ACME COMERCIO MATRIZ" → "ACME".
  private _nomeGrupoEmpresa(nome: string | null | undefined): string {
    if (!nome) return 'Sem empresa';
    const primeiro = nome.trim().split(/\s+/)[0];
    return primeiro || 'Sem empresa';
  }

  // ─── Distribuição por empresa (pizza) — computed reativo ─────
  // Agrupado pelo primeiro nome (filiais consolidadas). Top 8
  // grupos por valor inadimplente no período; se houver mais que
  // isso, os demais não aparecem na fatia (ajuste o slice(0, 8)
  // se quiser um bucket "Outras").
  readonly distribuicaoPorEmpresa = computed((): FaixaAtraso[] => {
    const inad  = this._inadimplentes();
    const total = inad.reduce((s, c) => s + c.valor_total, 0) || 1;

    const map = new Map<string, number>();
    inad.forEach(c => {
      const grupo = this._nomeGrupoEmpresa(c.nome_empresa);
      map.set(grupo, (map.get(grupo) ?? 0) + c.valor_total);
    });

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, valor], i) => ({
        label,
        percentual: Math.round((valor / total) * 100),
        cor: PALETA_EMPRESAS[i % PALETA_EMPRESAS.length],
      }));
  });

  // ─── Valor total por empresa (barra) — computed reativo ──────
  // Mesmo agrupamento pelo primeiro nome (filiais consolidadas).
  // Reaproveita o formato MaioresDevedores para usar o mesmo
  // app-top-devedores-bar já existente na tela.
  readonly valorPorEmpresa = computed((): MaioresDevedores[] => {
    const inad  = this._inadimplentes();
    const total = inad.reduce((s, c) => s + c.valor_total, 0);

    const map = new Map<string, number>();
    inad.forEach(c => {
      const grupo = this._nomeGrupoEmpresa(c.nome_empresa);
      map.set(grupo, (map.get(grupo) ?? 0) + c.valor_total);
    });

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([nome, valor]) => ({
        nome,
        valor,
        percentual: total > 0 ? (valor / total) * 100 : 0,
      }));
  });

  // ─── Clientes filtrados para a tabela — computed reativo ──────
  // IMPORTANTE: usa _inadimplentesBase (empresa + sem baixa), e
  // NÃO aplica o filtro de id_pessoa — a planilha sempre mostra
  // todos os clientes, só respeitando busca e status.
  readonly clientesFiltrados = computed((): ClienteInadimplente[] => {
    const busca  = this.busca().toLowerCase().trim();
    const status = this.filtroStatus();

    return this._inadimplentesBase().filter(c => {

      if (busca) {
        const campos = [
          c.nome_pessoa,          c.nome_empresa,
          c.numero_documento,     c.ordem,
          c.origem,               c.descricao_forma_cobranca,
          c.status_financeiro,    c.data_vencimento,
          c.data_baixa,
          String(c.valor_total),  String(c.dias_atraso),
        ];
            return campos.some(v => (v ?? '').toString().toLowerCase().includes(busca));
      }
      return true;
    });
  });

  // ─── carregar — APENAS busca e armazena dados brutos ─────────
  // Não calcula mais nada. Todo cálculo fica nos computeds acima.
  carregar(dataInicio?: string, dataFim?: string): void {
    const inicioAtual = dataInicio ?? this.dataInicio();
    const fimAtual    = dataFim    ?? this.dataFim();

    const dtInicioAtual = this._parseDate(inicioAtual);
    const dtFimAtual    = this._parseDate(fimAtual);

    const inicioAnterior = new Date(dtInicioAtual);
    inicioAnterior.setMonth(inicioAnterior.getMonth() - 1);
    const fimAnterior = new Date(dtFimAtual);
    fimAnterior.setMonth(fimAnterior.getMonth() - 1);

    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Armazena período para os computeds usarem
    this._fmtInicio.set(fmt(dtInicioAtual));
    this._fmtFim.set(fmt(dtFimAtual));

    // Gera lista de dias do período
    const dias: string[] = [];
    const cursor = new Date(dtInicioAtual);
    while (cursor <= dtFimAtual) {
      dias.push(fmt(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    this._diasPeriodo.set(dias);
    this.periodo.set(`${fmt(dtInicioAtual)} a ${fmt(dtFimAtual)}`);

    this.carregando.set(true);

    forkJoin({
      atual:    this.api.getInadimplencia(fmt(dtInicioAtual), fmt(dtFimAtual)),
      anterior: this.api.getInadimplencia(fmt(inicioAnterior), fmt(fimAnterior)),
    }).subscribe({
      next: ({ atual: resAtual, anterior: resAnterior }) => {
        const brutos    = (resAtual.data    ?? []).map((i: InadimplenciaApiItem) => this.mapApiItem(i));
        const brutosAnt = (resAnterior.data ?? []).map((i: InadimplenciaApiItem) => this.mapApiItem(i));

        this._todosBrutos.set(brutos);
        this._todosBrutosAnt.set(brutosAnt);

        this.carregando.set(false);
      },
      error: err => {
        console.error('Erro ao carregar inadimplência:', err);
        this.carregando.set(false);
      },
    });
  }

  // ─── Mapear item da API ───────────────────────────────────────
  private mapApiItem(item: InadimplenciaApiItem): ClienteInadimplente {
    return {
      id:                       Number(item.id_pessoa),
      id_empresa:               item.id_empresa,
      nome_empresa:             item.nome_empresa,
      id_pessoa:                item.id_pessoa,
      nome_pessoa:              item.nome_pessoa,
      documento:                '',
      status:                   this._calcularStatus(item),
      status_financeiro:        item.status_financeiro,
      valor_total:              Number(item.valor_total ?? 0),
      data_vencimento:          item.data_vencimento,
      data_baixa:               item.data_baixa ?? null,
      numero_documento:         item.numero_documento,
      ordem:                    item.ordem,
      descricao_forma_cobranca: item.descricao_forma_cobranca,
      ultima_atualizacao:       String(item.ultima_atualizacao),
      origem:                   item.origem,
      dias_atraso:              Number(item.dias_atraso ?? 0),
      percentualTotal:          0,
      tendencia:                [10, 15, 20, 18, 25, 30, 35],
    };
  }

  private _calcularStatus(item: InadimplenciaApiItem): StatusInadimplencia {
    if (item.data_baixa)       return 'PAGO';
    if (item.dias_atraso > 0)  return 'VENCIDO';
    return 'EM ABERTO';
  }

  // ─── Actions ──────────────────────────────────────────────────
  setBusca(v: string)        { this.busca.set(v); }
  setFiltroStatus(v: string) { this.filtroStatus.set(v); }
  setPeriodo(v: string)      { this.periodo.set(v); }
  cobrarCliente(id: number)  { console.log('Cobrar:', id); }

  // ─── Filtro de cliente (id_pessoa) — mesma convenção do
  //     EmpresaFilterService: conjunto vazio == "todos" ─────────
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

  // ─── Helpers privados ────────────────────────────────────────
  private _var(atual: number, anterior: number): number {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return Number(((atual - anterior) / anterior * 100).toFixed(2));
  }

  private _parseDate(s: string): Date {
    const [ano, mes, dia] = s.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  }
}