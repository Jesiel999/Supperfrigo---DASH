export interface TaxaApiItem {
  codigo: number;
  id_empresa: number; 
  nome_empresa: string; 
  id_pessoa: number;
  nome_pessoa: string; 
  valor_total: number; 
  data_vencimento: string;
  dias_atraso: number; 
  status_financeiro: string; 
  data_baixa?: string | null;
  numero_documento?: string;
  ordem?: number;
  descricao_forma_cobranca?: string;
  origem?: string;
  ultima_atualizacao: string | null;
}

export interface KpiTaxaValores {
  valorEsperado: number;
  valorRealizado: number;
  valorDiferenca: number;
  variacaoEsperado: number;
  variacaoRealizado: number;
  variacaoDiferenca: number;
}

export interface RankingTaxaEmpresa {
  nome: string;
  valorEsperado: number;
  valorRealizado: number;
  taxaRealizacao: number;
  percentualDoTotal: number;
}

export interface AgrupamentoTaxaPorFornecedor {
  label: string;
  taxaPagamento: number;
  valorEsperado: number;
  valorPago: number;
  percentualDoTotal: number;
}

export interface AgrupamentoTaxaPorCliente {
  label: string;
  taxaPagamento: number;
  valorEsperado: number;
  valorPago: number;
  percentualDoTotal: number;
}