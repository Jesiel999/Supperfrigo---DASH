// ─── Inadimplência 
export type StatusInadimplencia = 'VENCIDO' | 'PAGO' | 'EM ABERTO';
export interface ClienteInadimplente {
  codigo: number;
  id: number;
  id_empresa: number;
  nome_empresa: string;
  id_pessoa: number;
  nome_pessoa: string;
  documento: string;
  telefone?: string;
  email?: string;
  status: StatusInadimplencia;
  status_financeiro: string;
  valor_total: number;
  data_vencimento: string;
  data_baixa?: string | null;
  numero_documento?: string;
  ordem?: number;
  descricao_forma_cobranca?: string;
  ultima_atualizacao: string;
  origem?: string;
  dias_atraso: number;
  percentualTotal: number;
  tendencia: number[];
}

export interface KpiInadimplencia {
  totalInadimplente: number; clientesInadimplentes: number;
  ticketMedio: number; qtdTitulosAtual: number;
  variacaoTotal: number; variacaoClientes: number;
  variacaoTicket: number; variacaoTitulos: number;
}
export interface PontoGrafico {
  data: string;
  valor: number;
  label?: string;
  formatador?: 'currency' | 'number' | 'percent';
}
export interface MaioresDevedores {nome: string; valor: number; percentual: number; diasAtrasoMedio: number;}

export interface DonutSegment {
  label: string;
  valor: number;
  percentual: number;
  cor: string;
}

export interface FaixaAtraso {
  label: string;
  percentual: number;
  cor: string;
}

export type CanalCobranca    = 'whatsapp' | 'email' | 'ambos';
export type StatusCobranca   = 'pendente' | 'enviado' | 'visualizado' | 'pago' | 'falhou';
export type PrioridadeCobranca = 'alta' | 'media' | 'baixa';
export interface Cobranca {
  id: number; id_pessoa: number; nome_pessoa: string; empresa: string;
  documento: string; telefone: string; email: string;
  valor_devido: number; dias_atraso: number; canal: CanalCobranca;
  status: StatusCobranca; prioridade: PrioridadeCobranca;
  data_envio?: string; tentativas: number; proximo_contato?: string;
}
export interface KpiCobranca {
  totalEnviadas: number; taxaRetorno: number; valorRecuperado: number;
  whatsappEnviados: number; emailsEnviados: number; aguardandoResposta: number;
}

// ─── Contas a Receber ─────────────────────────────────────────────
export type StatusReceber = 'aberto' | 'vencido' | 'pago' | 'parcial';
export interface ContaReceber {
  id: number; cliente: string; documento: string; descricao: string;
  valor: number; valor_pago: number; vencimento: string; status: StatusReceber;
  dias_atraso: number; parcela: string;
}

// ─── Contas a Pagar ───────────────────────────────────────────────
export type StatusPagar = 'pendente' | 'vencido' | 'pago' | 'agendado';
export interface ContaPagar {
  id: number; fornecedor: string; categoria: string; descricao: string;
  valor: number; vencimento: string; status: StatusPagar;
  dias_atraso: number; forma_pagamento: string;
}

// ─── Fluxo de Caixa
export interface LancamentoFluxo {
  id: number; data: string; descricao: string; tipo: 'entrada' | 'saida';
  categoria: string; valor: number; saldo_acumulado: number;
}

// ─── API
export interface ApiResponse<T> { total: number; data: T[]; }
export interface InadimplenciaApiItem {
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
export interface EnvioCobrancaPayload { id_pessoa: number; canal: CanalCobranca; mensagem?: string; }
export interface RespostaEnvio { status: 'enviado' | 'falhou'; canal: CanalCobranca; mensagem: string; }

export interface PmpApiItem {
  codigo_titulo: string;
  id_empresa: string;
  nome_empresa: string;
  id_pessoa: string;
  nome_pessoa: string;
  numero_documento: string | null;
  ordem: number | null;
  origem: string | null;
  descricao_forma_cobranca: string | null;
  valor_total: number;
  data_emissao: string | null;
  data_vencimento: string | null;
  data_baixa: string | null;
  dias_pagamento: number | null;
  status_financeiro: string;
  descricao_situacao: string | null;
  ultima_atualizacao: string | null;
}

export interface PmrApiItem {
  codigo_titulo: string;
  id_empresa: string;
  nome_empresa: string;
  id_pessoa: string;
  nome_pessoa: string;
  numero_documento: string | null;
  ordem: number | null;
  origem: string | null;
  descricao_forma_cobranca: string | null;
  valor_total: number;
  data_emissao: string | null;
  data_vencimento: string | null;
  data_baixa: string | null;
  dias_recebimento: number | null;
  status_financeiro: string;
  descricao_situacao: string | null;
  ultima_atualizacao: string | null;
}

// ─── PMP e PMR
export interface KpiPmp {
  pmpDias: number;
  qtdTitulos: number;
  valorMedio: number;
  valorTotal: number;
  variacaoPmp: number;
  variacaoQtd: number;
  variacaoValor: number;
}

export interface KpiPmr {
  pmrDias: number;
  qtdTitulos: number;
  valorMedio: number;
  valorTotal: number;
  variacaoPmr: number;
  variacaoQtd: number;
  variacaoValor: number;
}

export interface AgrupamentoPmp {
  chave: string;
  label: string;
  pmpDias: number;
  qtdTitulos: number;
  valorTotal: number;
  valorMedio: number;
  percentualTotal: number;
}

export interface AgrupamentoPmr {
  chave: string;
  label: string;
  pmrDias: number;
  qtdTitulos: number;
  valorTotal: number;
  valorMedio: number;
  percentualTotal: number;
}

export interface ListPmp {
  codigo_titulo: string;
  id_empresa: string;
  nome_empresa: string;
  id_pessoa: string;
  nome_pessoa: string;
  numero_documento: string | null;
  ordem: number | null;
  origem: string | null;
  descricao_forma_cobranca: string | null;
  valor_total: number;
  data_emissao: string | null;
  data_vencimento: string | null;
  data_baixa: string | null;
  dias_pagamento: number | null;
  status_financeiro: string;
  descricao_situacao: string | null;
  ultima_atualizacao: string | null;
  
}

export interface ListPmr {
  codigo_titulo: string;
  id_empresa: string;
  nome_empresa: string;
  id_pessoa: string;
  nome_pessoa: string;
  numero_documento: string | null;
  ordem: number | null;
  origem: string | null;
  descricao_forma_cobranca: string | null;
  valor_total: number;
  data_emissao: string | null;
  data_vencimento: string | null;
  data_baixa: string | null;
  dias_recebimento: number | null;
  status_financeiro: string;
  descricao_situacao: string | null;
  ultima_atualizacao: string | null;
}