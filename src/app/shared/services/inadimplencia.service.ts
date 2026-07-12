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

  // ─── Dados BRUTOS vindos da API (nunca filtrados) ─────────────
  // Separar bruto do filtrado é o ponto central da correção.
  // Tudo que depende de filtro deve ser computed, não calculado no subscribe.
  private readonly _todosBrutos      = signal<ClienteInadimplente[]>([]);
  private readonly _todosBrutosAnt   = signal<ClienteInadimplente[]>([]);
  private readonly _diasPeriodo      = signal<string[]>([]);
  private readonly _fmtInicio        = signal<string>('');
  private readonly _fmtFim           = signal<string>('');

  // ─── Filtro de empresa aplicado reativamente ──────────────────
  // Qualquer mudança em empresaFilter.selecionadas() dispara
  // o recálculo de TUDO automaticamente — sem F5.
  private readonly _inadimplentes = computed(() => {
    const brutos   = this._todosBrutos();
    const empresas = this.empresaFilter.selecionadas();

    const semBaixa = brutos.filter(c => !c.data_baixa);

    if (empresas.size === 0) return semBaixa;
    return semBaixa.filter(c => empresas.has(Number(c.id_empresa)));
  });

  private readonly _inadimplentesAnt = computed(() => {
    const brutos   = this._todosBrutosAnt();
    const empresas = this.empresaFilter.selecionadas();

    const semBaixa = brutos.filter(c => !c.data_baixa);

    if (empresas.size === 0) return semBaixa;
    return semBaixa.filter(c => empresas.has(Number(c.id_empresa)));
  });

  private readonly _comBaixa = computed(() => {
    const brutos   = this._todosBrutos();
    const empresas = this.empresaFilter.selecionadas();

    if (empresas.size === 0) return brutos;
    return brutos.filter(c => empresas.has(Number(c.id_empresa)));
  });

  private readonly _comBaixaAnt = computed(() => {
    const brutos   = this._todosBrutosAnt();
    const empresas = this.empresaFilter.selecionadas();

    if (empresas.size === 0) return brutos;
    return brutos.filter(c => empresas.has(Number(c.id_empresa)));
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

    console.log(qtdTitulosAtual)
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
      .slice(0, 10)
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

  // ─── Clientes filtrados para a tabela — computed reativo ──────
  readonly clientesFiltrados = computed((): ClienteInadimplente[] => {
    const busca  = this.busca().toLowerCase().trim();
    const status = this.filtroStatus();

    return this._inadimplentes().filter(c => {

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