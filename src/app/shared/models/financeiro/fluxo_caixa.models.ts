// shared/models/fluxo-caixa.models.ts

/**
 * FLUXO DE CAIXA REALIZADO (somente títulos baixados). Mesmo plano de contas "Resultado" do DRE. Na vw_bi_fluxo_caixa os valores já vêm com sinal:
 * RECEBER = positivo, PAGAR = negativo. Então:
 *   entradas = 3.1 | saídas = -(3.2 + 3.3) | saldo = 3 (raiz).
 * ⚠️ Confirme se as classificações do seu plano são essas.
 */
export const FLUXO_CAIXA_CLASSIFICACOES = {
  resultado: '3',
  entradas: '3.1',
  custos: '3.2',
  despesas: '3.3',
} as const;

/** Linha devolvida pela API: empresa × conta × período (mês, "YYYY-MM"). */
export interface FluxoCaixaItem {
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
export interface FluxoCaixaAgregado {
  classificacao: string;
  descricao: string;
  eh_analitica: boolean;
  total: number;
  /** Valor por mês ("YYYY-MM"). Mês sem movimento não existe no mapa → undefined. */
  porPeriodo: Partial<Record<string, number>>;
}

/** Comparação de uma conta com o período anterior. */
export interface FluxoCaixaComparativo {
  atual: number;
  anterior: number;
  variacao: number | null;
}

export interface FluxoCaixaLinha extends FluxoCaixaAgregado {
  nivel: number;
  pai: string | null;
  temFilhos: boolean;
  /** Participação sobre o total de entradas realizadas. */
  percentualEntradas: number | null;
  comparativo: FluxoCaixaComparativo | null;
}

/** Uma linha da projeção mensal (entradas, saídas, saldo e saldo acumulado). */
export interface FluxoPeriodo {
  periodo: string;
  entradas: number;
  saidas: number;
  saldo: number;
  acumulado: number;
}

export interface FluxoCaixaKpi {
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

export interface FluxoCaixaTitulo {
  codigo: number | string;
  id_empresa?: number | string | null;
  nome_empresa?: string;
  id_pessoa?: number;
  nome_pessoa?: string; // cliente/fornecedor
  numero_documento?: string | null;
  descricao?: string | null;
  origem?: string | null;
  data_competencia?: string | null;
  data_vencimento?: string | null; 
  data_baixa?: string | null;
  valor_total: number;
  valor_pago?: number | null;
  descricao_situacao?: string | null;
  status_financeiro?: string | null;
}

export interface FluxoCaixaDetalhamento {
  classificacao: string;
  descricao: string;
  totalConta: number;
  titulos: FluxoCaixaTitulo[];
}

export interface FluxoCaixaFiltrosAplicados {
  inicio: string;
  fim: string;
}