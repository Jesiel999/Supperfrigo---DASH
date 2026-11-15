// shared/models/dre.models.ts

export const DRE_CLASSIFICACOES = {
  resultado: '3',
  receitas: '3.1',
  custos: '3.2',
  despesas: '3.3',
} as const;

export interface DreItem {
  classificacao: string;
  descricao: string;
  eh_analitica: boolean;
  total: number;
  id_empresa?: number | string | null;
  nome_empresa?: string | null;
  ultima_atualizacao?: string | null;
  id_pessoa?: number | string | null;
  nome_pessoa?: string | null;
}

/** Comparação de uma conta com o período anterior. */
export interface DreComparativo {
  atual: number;
  anterior: number;
  variacao: number | null;
}

export interface DreLinha extends DreItem {
  nivel: number;
  pai: string | null;
  temFilhos: boolean;
  percentualReceita: number | null;
  comparativo: DreComparativo | null;
}

export interface DreKpi {
  receitas: number;
  custos: number;
  despesas: number;
  resultadoOperacional: number;
  margemOperacional: number | null;
  resultadoLiquido: number;

  variacaoReceitas: number;
  variacaoCustos: number;
  variacaoDespesas: number;
  variacaoResultadoOperacional: number;
  variacaoResultadoLiquido: number;
}

export interface DreTitulo {
  codigo: number | string;
  id_empresa?: number | string | null;
  nome_empresa?: string;
  id_pessoa?: number;
  nome_pessoa?: string;          // cliente/fornecedor
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

export interface DreDetalhamento {
  classificacao: string;
  descricao: string;
  totalConta: number;
  titulos: DreTitulo[];
}

export interface DreFiltrosAplicados {
  inicio: string;
  fim: string;
  /** true = considera títulos em aberto; false = apenas baixados. */
  incluirAbertos: boolean;
}

/** Despesa (conta analítica de 3.3) por mês — alimenta os gráficos de linha. */
export interface DreDespesaMes {
  classificacao: string;
  descricao: string;
  /** Mês, formato "YYYY-MM". */
  periodo: string;
  /** Valor com sinal da view (despesa = negativo). */
  total: number;
  id_empresa?: number | string | null;
  id_pessoa?: number | string | null;
  nome_pessoa?: string | null;
}