// shared/models/fcp.models.ts

/**
 * Mesmo plano de contas "Resultado" do DRE. Na vw_bi_fcp os valores já vêm com sinal:
 * RECEBER = positivo, PAGAR = negativo. Então:
 *   entradas = 3.1 | saídas = -(3.2 + 3.3) | saldo = 3 (raiz).
 * ⚠️ Confirme se as classificações do seu plano são essas.
 */
export const FCP_CLASSIFICACOES = {
  resultado: '3',
  entradas: '3.1',
  custos: '3.2',
  despesas: '3.3',
} as const;

/** Linha devolvida pela API: empresa × conta × período (mês, "YYYY-MM"). */
export interface FcpItem {
  classificacao: string;
  descricao: string;
  eh_analitica: boolean;
  /** Mês de projeção, formato "YYYY-MM". */
  periodo: string;
  total: number;
  id_empresa?: number | string | null;
  nome_empresa?: string | null;
  id_pessoa?: number | string | null;
  nome_pessoa?: string | null;
  /** Última execução do pipeline de integração (mesma origem da DRE). */
  ultima_atualizacao?: string | null;
}

/** Conta já agregada (todas as empresas filtradas), com valores por mês. */
export interface FcpAgregado {
  classificacao: string;
  descricao: string;
  eh_analitica: boolean;
  total: number;
  /** Valor por mês ("YYYY-MM"). Mês sem movimento não existe no mapa → undefined. */
  porPeriodo: Partial<Record<string, number>>;
}

/** Comparação de uma conta com o período anterior. */
export interface FcpComparativo {
  atual: number;
  anterior: number;
  variacao: number | null;
}

export interface FcpLinha extends FcpAgregado {
  nivel: number;
  pai: string | null;
  temFilhos: boolean;
  /** Participação sobre o total de entradas previstas. */
  percentualEntradas: number | null;
  comparativo: FcpComparativo | null;
}

/** Uma linha da projeção mensal (entradas, saídas, saldo e saldo acumulado). */
export interface FcpFluxoPeriodo {
  periodo: string;
  entradas: number;
  saidas: number;
  saldo: number;
  acumulado: number;
}

export interface FcpKpi {
  entradas: number;
  saidas: number;
  saldoPeriodo: number;
  saldoInicial: number;
  saldoFinal: number;
  /** Menor saldo acumulado da projeção (ponto de maior aperto de caixa). */
  menorSaldo: number;
  /** Mês em que o menor saldo acontece. */
  mesMenorSaldo: string | null;

  variacaoEntradas: number;
  variacaoSaidas: number;
  variacaoSaldoPeriodo: number;
}

export interface FcpTitulo {
  codigo: number | string;
  id_empresa?: number | string | null;
  nome_empresa?: string;
  id_pessoa?: number;
  nome_pessoa?: string; // cliente/fornecedor
  numero_documento?: string | null;
  descricao?: string | null;
  origem?: string | null;
  data_competencia?: string | null;
  data_vencimento?: string | null; // data prevista do fluxo
  data_baixa?: string | null;
  valor_total: number;
  valor_pago?: number | null;
  descricao_situacao?: string | null;
  status_financeiro?: string | null;
}

export interface FcpDetalhamento {
  classificacao: string;
  descricao: string;
  totalConta: number;
  titulos: FcpTitulo[];
}

export interface FcpFiltrosAplicados {
  inicio: string;
  fim: string;
}

/** Título a pagar de custos/despesas (tabela "Custos e Despesas a Pagar"). */
export interface FcpTituloTable {
  codigo: number | string;
  id_empresa?: number | string | null;
  nome_empresa?: string | null;
  id_pessoa?: number | string | null;
  nome_fornecedor?: string | null;
  numero_documento?: string | null;
  parcela?: string | number | null;
  origem?: string | null;
  descricao_situacao?: string | null;
  status_financeiro?: string | null;
  descricao_forma_pagamento?: string | null;
  descricao_categoria_financeira?: string | null;
  descricao_centro_custo?: string | null;
  numero_conta_resultado?: string | null;
  descricao_conta_resultado?: string | null;
  data_emissao?: string | null;
  data_competencia?: string | null;
  data_vencimento?: string | null;
  data_baixa?: string | null;
  dias_atraso?: number | null;
  valor_titulo: number;
  valor_pago: number;
  valor_em_aberto: number;
  valor_nota: number;
}