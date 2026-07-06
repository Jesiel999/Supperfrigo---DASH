export interface TaxaRecebimentoDiaria {
  data: string;
  valorEsperado: number;
  valorRecebido: number;
  taxaRecebimento: number; // percentagem 0-100
  diasEmAtraso: number;
  clientesLiquidados: number;
  clientesEmAtraso: number;
}
 
export interface KpiTaxaRecebimento {
  taxaMediaMes: number;
  taxaMediaPeriodo: number;
  melhorDia: string;
  piorDia: string;
  variacaoTaxa: number; // delta percentual
  diasAcima90: number;
  diasAbaixo70: number;
}
 
export interface AgrupamentoTaxaPorCliente {
  label: string;
  taxaRecebimento: number;
  valorEsperado: number;
  valorRecebido: number;
  diasEmAtraso: number;
  percentualDoTotal: number;
}
 
export interface AgrupamentoTaxaPorVendedor {
  label: string;
  taxaRecebimento: number;
  qtdClientes: number;
  valorEsperado: number;
  valorRecebido: number;
  percentualDoTotal: number;
}