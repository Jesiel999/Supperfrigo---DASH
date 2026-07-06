import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  TaxaRecebimentoDiaria,
  KpiTaxaRecebimento,
  AgrupamentoTaxaPorCliente,
  AgrupamentoTaxaPorVendedor,
} from '../models/taxa-recebimento.models';

@Injectable({
  providedIn: 'root',
})
export class TaxaRecebimentoService {
  private readonly http = new HttpClient();
  private readonly API_URL = '/api/inadimplencia/taxa-recebimento';

  // ── Sinais de Estado ──
  readonly dataInicio = signal<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  readonly dataFim = signal<string>(new Date().toISOString().split('T')[0]);

  private readonly _taxasDiarias = signal<TaxaRecebimentoDiaria[]>([]);
  private readonly _kpis = signal<KpiTaxaRecebimento | null>(null);
  private readonly _agrupamentoPorCliente = signal<AgrupamentoTaxaPorCliente[]>([]);
  private readonly _agrupamentoPorVendedor = signal<AgrupamentoTaxaPorVendedor[]>([]);
  private readonly _carregando = signal(false);

  // ── Sinais Computados (Read-only) ──
  readonly taxasDiarias = this._taxasDiarias.asReadonly();
  readonly kpis = this._kpis.asReadonly();
  readonly agrupamentoPorCliente = this._agrupamentoPorCliente.asReadonly();
  readonly agrupamentoPorVendedor = this._agrupamentoPorVendedor.asReadonly();
  readonly carregando = this._carregando.asReadonly();

  // ── Computadas ──
  readonly taxaDiaAtual = computed(() => {
    const taxas = this._taxasDiarias();
    return taxas.length > 0 ? taxas[taxas.length - 1] : null;
  });

  readonly tendencia = computed(() => {
    const taxas = this._taxasDiarias();
    if (taxas.length < 2) return 0;
    const ultimoDia = taxas[taxas.length - 1];
    const penultimoDia = taxas[taxas.length - 2];
    return ultimoDia.taxaRecebimento - penultimoDia.taxaRecebimento;
  });

  constructor() {}

  /**
   * Carrega dados de taxa de recebimento para o período especificado
   */
  carregar(dataInicio: string, dataFim: string): void {
    this._carregando.set(true);

    this.http
      .get<{
        taxasDiarias: TaxaRecebimentoDiaria[];
        kpis: KpiTaxaRecebimento;
        agrupamentoPorCliente: AgrupamentoTaxaPorCliente[];
        agrupamentoPorVendedor: AgrupamentoTaxaPorVendedor[];
      }>(`${this.API_URL}/periodo`, {
        params: { dataInicio, dataFim },
      })
      .subscribe({
        next: (response) => {
          this._taxasDiarias.set(response.taxasDiarias);
          this._kpis.set(response.kpis);
          this._agrupamentoPorCliente.set(response.agrupamentoPorCliente);
          this._agrupamentoPorVendedor.set(response.agrupamentoPorVendedor);
          this._carregando.set(false);
        },
        error: (err) => {
          console.error('Erro ao carregar taxa de recebimento:', err);
          this._carregando.set(false);
        },
      });
  }

  /**
   * Exporta dados para CSV
   */
  exportarCSV(): void {
    const taxas = this._taxasDiarias();
    if (!taxas.length) return;

    const headers = ['Data', 'Valor Esperado', 'Valor Recebido', 'Taxa (%)', 'Clientes Liquidados', 'Clientes em Atraso'];
    const rows = taxas.map((t) => [
      t.data,
      t.valorEsperado.toFixed(2),
      t.valorRecebido.toFixed(2),
      t.taxaRecebimento.toFixed(2),
      t.clientesLiquidados,
      t.clientesEmAtraso,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taxa-recebimento-${new Date().toISOString()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}