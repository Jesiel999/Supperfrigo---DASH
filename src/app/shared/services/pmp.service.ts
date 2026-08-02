import { Injectable, signal, computed, inject } from '@angular/core';
import { EmpresaFilterService } from './empresa-filter.service';
import { ApiService } from './api.service';
import { forkJoin } from 'rxjs';
import {
  PmpApiItem,
  ApiResponse,
  KpiPmp,
  AgrupamentoPmp,
} from '../models/financeiro.models';

@Injectable({ providedIn: 'root' })
export class PmpService {
  private readonly api = inject(ApiService);
  readonly empresaFilter = inject(EmpresaFilterService);

  // ─── Período
  private getPrimeiroDiaMes(): string {
    const data = new Date();
    data.setDate(data.getDate() - 90);

    return data.toISOString().split('T')[0];
  }

  private getHoje(): string {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    return ontem.toISOString().split('T')[0];
  }

  readonly dataInicio = signal<string>(this.getPrimeiroDiaMes());
  readonly dataFim = signal<string>(this.getHoje());
  readonly periodo = signal<string>('');

  // ─── Estados de carregamento
  readonly carregandoPmp = signal<boolean>(false);

  // ─── Dados BRUTOS da API 
  private readonly _pmpBruto = signal<PmpApiItem[]>([]);
  private readonly _pmpBrutoAnt = signal<PmpApiItem[]>([]);

  private readonly _fmtInicio = signal<string>('');
  private readonly _fmtFim = signal<string>('');

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

    const lista = this._pmpBruto();

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

  // ─── Filtros de status
  readonly filtroStatusPmp = signal<string>('todos');

  // ─── PMP filtrado por empresa
  private readonly _pmpFiltrado = computed(() => {
    const brutos = this._pmpBruto();
    const empresas = this.empresaFilter.selecionadas();
    const status = this.filtroStatusPmp();

    let resultado = brutos;

    if (empresas.size > 0) {
      resultado = resultado.filter(c => empresas.has(Number(c.id_empresa)));
    }

    if (status !== 'todos') {
      resultado = resultado.filter(c => c.status_financeiro === status);
    }

    return resultado;
  });

  private readonly _pmpFiltradoAnt = computed(() => {
    const brutos = this._pmpBrutoAnt();
    const empresas = this.empresaFilter.selecionadas();

    if (empresas.size === 0) return brutos;
    return brutos.filter(c => empresas.has(Number(c.id_empresa)));
  });

  // ─── KPI PMP
  readonly kpisPmp = computed((): KpiPmp => {
    const pmpAtual = this._pmpFiltrado();
    const pmpAnt = this._pmpFiltradoAnt();

    const calcularKpi = (dados: PmpApiItem[]): { pmp: number; qtd: number; valorMedio: number; valorTotal: number } => {
      if (dados.length === 0) {
        return { pmp: 0, qtd: dados.length, valorMedio: 0, valorTotal: 0 };
      }

      const somaValorDias = dados.reduce((acc, item) => {
        const dias = item.dias_pagamento ?? 0;
        return acc + (item.valor_total * dias);
      }, 0);

      const somaValor = dados.reduce((acc, item) => acc + item.valor_total, 0);
      const pmp = somaValor > 0 ? Math.round(somaValorDias / somaValor) : 0;

      return {
        pmp,
        qtd: dados.length,
        valorMedio: somaValor > 0 ? somaValor / dados.length : 0,
        valorTotal: somaValor,
      };
    };

    const atual = calcularKpi(pmpAtual);
    const anterior = calcularKpi(pmpAnt);

    return {
      pmpDias: atual.pmp,
      qtdTitulos: atual.qtd,
      valorMedio: atual.valorMedio,
      valorTotal: atual.valorTotal,
      variacaoPmp: this._var(atual.pmp, anterior.pmp),
      variacaoQtd: this._var(atual.qtd, anterior.qtd),
      variacaoValor: this._var(atual.valorTotal, anterior.valorTotal),
    };
  });

  // ─── Agrupamento PMP por Fornecedor
  readonly agrupamentoPmpFornecedor = computed((): AgrupamentoPmp[] => {
    const dados = this._pmpFiltrado();
    const totalGeral = dados.reduce((s, c) => s + c.valor_total, 0);

    const map = new Map<
      string,
      { nome: string; somaValor: number; somaValorDias: number; qtd: number }
    >();

    dados.forEach(c => {
      const chave = c.nome_pessoa ?? 'Desconhecido';
      if (!map.has(chave)) {
        map.set(chave, { nome: chave, somaValor: 0, somaValorDias: 0, qtd: 0 });
      }

      const item = map.get(chave)!;
      const dias = c.dias_pagamento ?? 0;
      item.somaValor += c.valor_total;
      item.somaValorDias += c.valor_total * dias;
      item.qtd += 1;
    });

    return Array.from(map.values())
      .map(item => ({
        chave: item.nome,
        label: item.nome,
        pmpDias: item.somaValor > 0 ? Math.round(item.somaValorDias / item.somaValor) : 0,
        qtdTitulos: item.qtd,
        valorTotal: item.somaValor,
        valorMedio: item.somaValor / item.qtd,
        percentualTotal: totalGeral > 0 ? (item.somaValor / totalGeral) * 100 : 0,
      }))
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 10);
  });

  // ─── Dados para tabelas
  readonly titulosPmp = computed(() => this._pmpFiltrado());

  // ─── Carregar dados
  carregar(dataInicio?: string, dataFim?: string): void {
    const inicioAtual = dataInicio ?? this.dataInicio();
    const fimAtual = dataFim ?? this.dataFim();

    const dtInicioAtual = this._parseDate(inicioAtual);
    const dtFimAtual = this._parseDate(fimAtual);

    const diffDias = Math.floor(
      (dtFimAtual.getTime() - dtInicioAtual.getTime()) / 86400000
    ) + 1;

    const fimAnterior = new Date(dtInicioAtual);
    fimAnterior.setDate(fimAnterior.getDate() - 1);

    const inicioAnterior = new Date(fimAnterior);
    inicioAnterior.setDate(inicioAnterior.getDate() - (diffDias - 1));

    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    this._fmtInicio.set(fmt(dtInicioAtual));
    this._fmtFim.set(fmt(dtFimAtual));
    this.periodo.set(`${fmt(dtInicioAtual)} a ${fmt(dtFimAtual)}`);

    this.carregandoPmp.set(true);

    forkJoin({
      pmpAtual: this.api.getPmp(fmt(dtInicioAtual), fmt(dtFimAtual)),
      pmpAnterior: this.api.getPmp(fmt(inicioAnterior), fmt(fimAnterior)),
    }).subscribe({
      next: ({ pmpAtual, pmpAnterior }) => {
        const pmpBrutos = (pmpAtual.data ?? []);
        const pmpBrutosAnt = (pmpAnterior.data ?? []);

        // Popula filtro de empresas
         const empresasUnicas = Array.from(
          new Map(
            pmpBrutos.map(c => [
              Number(c.id_empresa),
              {
                codigo: Number(c.id_empresa),
                nome: c.nome_empresa ?? 'Empresa sem nome'
              }
            ])
          ).values()
        ).sort((a, b) =>
          (a.nome ?? '').localeCompare(b.nome ?? '')
        );

        this.empresaFilter.setDisponiveis(empresasUnicas);

        this._pmpBruto.set(pmpBrutos);
        this._pmpBrutoAnt.set(pmpBrutosAnt);

        this.carregandoPmp.set(false);
      },
      error: err => {
        console.error('Erro ao carregar PMP:', err);
        this.carregandoPmp.set(false);
      },
    });
  }

  // ─── Actions
  setFiltroStatusPmp(v: string) {
    this.filtroStatusPmp.set(v);
  }

  // ─── Helpers privados
  private _var(atual: number, anterior: number): number {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return Number(((atual - anterior) / anterior * 100).toFixed(2));
  }

  private _parseDate(s: string): Date {
    const [ano, mes, dia] = s.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  }
}