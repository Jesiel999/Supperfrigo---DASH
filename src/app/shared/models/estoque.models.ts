export interface EstoqueApiItem {
  tenant_id: number;
  id_empresa: number;
  empresa_nome: string;
  codigo_produto: number;
  produto_descricao: string;
  categoria: string;
  grupo: string;
  data_processamento: string;
  qtd_estoque: number;
  valor_estoque_custo: number;
  valor_estoque_venda: number;
  ultima_atualizacao: string;
}

export interface ItemEstoque {
  id_empresa: number;
  codigo_empresa: number;
  empresa_nome: string;
  codigo_produto: number;
  produto_descricao: string;
  categoria: string;
  grupo: string;
  data_processamento: string;
  qtd_estoque: number;
  valor_estoque_custo: number;
  valor_estoque_venda: number;
  possui_saldo: boolean;
  ultima_atualizacao: string;
}

export interface KpiEstoque {
  qtdItens: number;
  valorEstoqueTotal: number;
  produtosComSaldo: number;
  custoMedioGeral: number;
}

export interface RankingEstoqueItem {
  nome: string;
  valor: number;
  percentual: number;
  diasAtrasoMedio: number;
}

export interface CategoriaFatia {
  label: string;
  percentual: number;
  cor: string;
}