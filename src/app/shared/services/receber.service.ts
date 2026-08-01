import { Injectable, signal, computed, inject } from "@angular/core";
import { EmpresaFilterService } from "./empresa-filter.service";
import { ApiService } from "./api.service";
import { forkJoin } from "rxjs";
import {
    TaxaApiItem,
    KpiTaxaValores,
    RankingTaxaEmpresa,
    AgrupamentoTaxaPorCliente
} from '../models/taxa.models';
import { PontoGrafico, Serie } from "../models/graficos.models";
import { MaioresDevedores } from "../models/financeiro.models";

const PALETA_EMPRESAS = [
    '#f43f5e', '#fb923c', '#38bdf8', '#a78bfa',
    '#34d399', '#fbbf24', '#818cf8', '#f472b6',
];

@Injectable({ providedIn: 'root' })
export class ReceberService {
    private readonly api = inject(ApiService);
    readonly empresaFilter = inject(EmpresaFilterService);

    private getPrimeiroDiaMes(): string {
        const hoje = new Date();
        return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
    }
    private getUltimoDiaMes(): string {
        const hoje = new Date();
        return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
    }

    readonly dataInicio = signal<string>(this.getPrimeiroDiaMes());
    readonly dataFim = signal<string>(this.getUltimoDiaMes());
    readonly periodo    = signal<string>('');

    readonly filtroStatusTxRecebimento = signal<string>('todos');
    readonly filtroStatusTxPagamento = signal<string>('todos');
    readonly buscaRecebimento = signal<string>('');

    readonly carregandoTaxaRecebimento = signal<boolean>(false);

    private readonly _txRecebimentoBruto = signal<TaxaApiItem[]>([]);
    private readonly _txRecebimentoBrutoAnt = signal<TaxaApiItem[]>([]);

    private readonly _diasPeriodo = signal<string[]>([]);
    private readonly _fmtInicio = signal<string>('');
    private readonly _fmtFim = signal<string>('');

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
        const lista = this._txRecebimentoBruto();
        if (!lista.length) return null;

        return lista
        .map(x => (x as any).ultima_atualizacao ?? (x as any)['ultima_atualização'])
        .filter(Boolean)
        .sort()
        .at(-1) ?? null;
    });

    readonly ultimaAtualizacaoFormatada  = computed(() => this.formatarDataHora(this.ultimaAtualizacao()));
    readonly proximaAtualizacaoFormatada = computed(() => this.proximaAtualizacao(this.ultimaAtualizacao()));


    // ─── Base filtrada por empresa ──────────────────────────────
    private readonly _recebimentoBase = computed(() => {
        const empresas = this.empresaFilter.selecionadas();
        const brutos = this._txRecebimentoBruto();
        return empresas.size === 0 ? brutos : brutos.filter(c => empresas.has(Number(c.id_empresa)));
    });
    private readonly _recebimentoBaseAnt = computed(() => {
        const empresas = this.empresaFilter.selecionadas();
        const brutos = this._txRecebimentoBrutoAnt();
        return empresas.size === 0 ? brutos : brutos.filter(c => empresas.has(Number(c.id_empresa)));
    });

    // ─── + filtro de status ─────────────────────────────────────
    readonly recebimentoFiltrado = computed(() => {
        const status = this.filtroStatusTxRecebimento();
        const base = this._recebimentoBase();
        return status === 'todos' ? base : base.filter(c => c.status_financeiro === status);
    });

     // ─── Helper central: um título é "realizado" quando tem data_baixa ─
    private _foiRealizado(item: TaxaApiItem): boolean {
        return !!item.data_baixa;
    }
    private _valorRealizado(item: TaxaApiItem): number {
        return this._foiRealizado(item) ? item.valor_total : 0;
    }

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

    readonly kpiTxRecebimento = computed((): KpiTaxaValores =>
        this.kpis(this.recebimentoFiltrado(), this._recebimentoBaseAnt())
    );

    // ─── Agrupamento de filiais — pega só o primeiro "nome" da razão social ─
    private _nomeGrupoEmpresa(nome: string | null | undefined): string {
        if (!nome) return 'Sem empresa';
        const primeiro = nome.trim().split(/\s+/)[0];
        return primeiro || 'Sem empresa';
    }

    // ─── Ranking por empresa ────────────────────────────────────
    private _rankingPorEmpresa(lista: TaxaApiItem[]): RankingTaxaEmpresa[] {
        const totalEsperado = lista.reduce((s, c) => s + c.valor_total, 0) || 1;
        const map = new Map<string, { esperado: number; realizado: number }>();

        lista.forEach(c => {
        const key = this._nomeGrupoEmpresa(c.nome_empresa);   // ← agrupado, não mais nome_empresa cru
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

    readonly rankingRecebimentoPorEmpresa = computed(() => this._rankingPorEmpresa(this.recebimentoFiltrado()));

    // ─── Adaptadores p/ reaproveitar TopDevedoresBarComponent ───
    readonly rankingRecebimentoParaGrafico = computed((): MaioresDevedores[] =>
        this.rankingRecebimentoPorEmpresa().map(r => ({
        nome: r.nome,
        valor: r.valorEsperado,
        percentual: r.percentualDoTotal,
        diasAtrasoMedio: Math.round(r.taxaRealizacao),
        }))
    );

    readonly comparativoRecebimento = computed((): MaioresDevedores[] => {
        const kpi = this.kpiTxRecebimento();
        return [
        { nome: 'A Receber', valor: kpi.valorEsperado, percentual: 100, diasAtrasoMedio: 0 },
        { nome: 'Recebido', valor: kpi.valorRealizado, percentual: kpi.valorEsperado > 0 ? (kpi.valorRealizado / kpi.valorEsperado) * 100 : 0, diasAtrasoMedio: 0 },
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
    
      readonly granularidadeGraficoRecebimento = signal<'dia' | 'mes'>('dia');
      readonly granularidadeGraficoPagamento   = signal<'dia' | 'mes'>('dia');
    
      setGranularidadeRecebimento(v: 'dia' | 'mes'): void { this.granularidadeGraficoRecebimento.set(v); }
      setGranularidadePagamento(v: 'dia' | 'mes'): void { this.granularidadeGraficoPagamento.set(v); }
    
      // Sem label/formatador aqui — isso agora é responsabilidade da Serie
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
    
      readonly linhasRecebimento = computed(() =>
        this._construirLinhas(this.recebimentoFiltrado(), this.granularidadeGraficoRecebimento())
      );
    
      // ─── Séries prontas para o LineChartComponent ───────────────
      readonly seriesRecebimento = computed((): Serie[] => {
        const linhas = this.linhasRecebimento();
        return [
          { id: 'esperado', label: 'A Receber', cor: '#f43f5e', formatador: 'currency', pontos: linhas.esperado },
          { id: 'realizado', label: 'Recebido', cor: '#34d399', formatador: 'currency', pontos: linhas.realizado },
        ];
      });

    
      readonly taxaPorCliente = computed((): AgrupamentoTaxaPorCliente[] => {
        const lista = this.recebimentoFiltrado();
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
    
        this.carregandoTaxaRecebimento.set(true);
    
        forkJoin({
          recebimentoAtual:    this.api.getTxRecebimento(fmt(dtInicioAtual), fmt(dtFimAtual)),
          recebimentoAnterior: this.api.getTxRecebimento(fmt(inicioAnterior), fmt(fimAnterior)),
        }).subscribe({
          next: ({ recebimentoAtual, recebimentoAnterior}) => {
            this._txRecebimentoBruto.set(recebimentoAtual.data ?? []);
            this._txRecebimentoBrutoAnt.set(recebimentoAnterior.data ?? []);
    
            this.carregandoTaxaRecebimento.set(false);
          },
          error: err => {
            console.error('Erro ao carregar taxas:', err);
            this.carregandoTaxaRecebimento.set(false);
          },
        });
      }
    
      // ─── Actions ────────────────────────────────────────────────
      setBuscaRecebimento(v: string) { this.buscaRecebimento.set(v); }
      setFiltroStatusTxRecebimento(v: string) { this.filtroStatusTxRecebimento.set(v); }
    
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