// ─── Auth & Multi-Tenant ──────────────────────────────────────
export interface LoginPayload {
  username:  string;
  password:  string;
  tenant_id?: number;
}

export interface Permissao {
  id: string;
  recurso: string;
  label: string;
  categoria: string;
  visualizar: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
}


export type AcaoPermissao =
  | 'visualizar'
  | 'criar'
  | 'editar'
  | 'excluir';
  
export interface TenantInfo {
  id:   number;
  nome: string;
  slug: string;
}

export interface PermissaoRecurso {
  recurso: RecursoSistema;
  acoes: Permissao[];
}

export interface Perfil {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
  total_usuarios: number;
  permissoes: Permissao[];
  ativo?: boolean;
}

export interface CreatePerfilRequest {
  nome: string;
  descricao: string;
  cor: string;
  permissoes: {
    [recurso: string]: {
      visualizar: boolean;
      criar: boolean;
      editar: boolean;
      excluir: boolean;
    }
  }
}

export interface UpdatePerfilRequest {
  nome: string;
  descricao: string;
  cor: string;
  permissoes: {
    [recurso: string]: {
      visualizar: boolean;
      criar: boolean;
      editar: boolean;
      excluir: boolean;
    }
  }
}

export interface PermissoesResponse {
  total: number;
  perfis: Perfil[];
}

export interface EmpresaAutorizada {
  codigo: string;
  nome:   string;
}

export interface AuthResponse {
  access_token: string;
  token_type:   string;
  usuario:      Usuario;
}

// Permissões agrupadas por módulo:
// { "dashboard_inadimplencia": ["visualizar", "editar"], ... }
export type PermissoesMap = Record<string, string[]>;

export type RecursoSistema =
  | 'dashboard_inadimplencia' | 'dashboard_dre'  | 'dashboard_pmp'
  | 'dashboard_aging'         | 'cobrancas'       | 'contas_receber'
  | 'contas_pagar'            | 'fluxo_caixa'     | 'admin_usuarios'
  | 'admin_permissoes'        | 'relatorios'       | 'aging_report';

export interface Usuario {
  id:           string;
  username:     string;
  nome:         string;
  email:        string;
  tenant_id:    number;
  tenant_nome:  string;
  tenant_slug:  string;
  perfil_id:    string;
  perfil_cor:   string;
  ativo:        boolean;
  role:         'admin' | 'gestor' | 'analista' | 'operador';
  telefone?:     string;
  permissoes:   PermissoesMap;
  empresas:     EmpresaAutorizada[];
  tenants:      TenantInfo[];
  ultimo_acesso: Date;
}


export interface CreateUsuarioRequest {
  username: string;
  nome: string;
  email: string;
  telefone: string;
  password: string;
  role: 'admin' | 'gestor' | 'analista' | 'operador';
  perfil_id: string;
}

export interface UpdateUsuarioRequest {
  nome: string;
  email: string;
  telefone: string;
  role: 'admin' | 'gestor' | 'analista' | 'operador';
  perfil_id: string;
  ativo: boolean;
}

export interface UsuariosResponse {
  total: number;
  usuarios: Usuario[];
}

export interface ResetSenhaRequest {
  usuario_id: string;
  nova_senha: string;
}

// ─── Inadimplência 
export type StatusInadimplencia = 'VENCIDO' | 'PAGO' | 'EM ABERTO';
export interface ClienteInadimplente {
  id: string;
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
  origem?: string;
  dias_atraso: number;
  percentualTotal: number;
  tendencia: number[];
}

export interface ClienteInadimplente {
  id: string;
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
  origem?: string;
  dias_atraso: number;
  percentualTotal: number;
  tendencia: number[];
}
export interface KpiInadimplencia {
  totalInadimplente: number; clientesInadimplentes: number;
  ticketMedio: number; recuperadoMes: number;
  variacaoTotal: number; variacaoClientes: number;
  variacaoTicket: number; variacaoRecuperado: number;
}
export interface PontoGrafico { data: string; inadimplente: number; recuperado: number; }
export interface MaioresDevedores {nome: string; valor: number; percentual: number;
}

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
  id: string; id_pessoa: number; nome_pessoa: string; empresa: string;
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
  id: string; cliente: string; documento: string; descricao: string;
  valor: number; valor_pago: number; vencimento: string; status: StatusReceber;
  dias_atraso: number; parcela: string;
}

// ─── Contas a Pagar ───────────────────────────────────────────────
export type StatusPagar = 'pendente' | 'vencido' | 'pago' | 'agendado';
export interface ContaPagar {
  id: string; fornecedor: string; categoria: string; descricao: string;
  valor: number; vencimento: string; status: StatusPagar;
  dias_atraso: number; forma_pagamento: string;
}

// ─── Fluxo de Caixa
export interface LancamentoFluxo {
  id: string; data: string; descricao: string; tipo: 'entrada' | 'saida';
  categoria: string; valor: number; saldo_acumulado: number;
}

// ─── Nav
export interface NavItem    { label: string; icon: string; route: string; badge?: number; permissao?: RecursoSistema; }
export interface NavSection { label: string; items: NavItem[]; }
export interface DashboardTab { label: string; route: string; badge?: number; }

// ─── API
export interface ApiResponse<T> { total: number; data: T[]; }
export interface InadimplenciaApiItem {
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
}