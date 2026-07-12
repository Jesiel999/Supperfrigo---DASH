// ─── Auth & Multi-Tenant ──────────────────────────────────────
export interface LoginPayload {
  username:  string;
  password:  string;
  tenant_id?: number;
}
// ─── Sistemas, Modulo & Aplicação ─────────────────────────────
export interface ModuloMenu {
  codigo: string;
  nome: string;
  rota: string | null;
}

export interface AplicacaoMenu {
  nome: string;
  slug: string;
  modulos: ModuloMenu[];
}

export interface SistemaMenu {
  nome: string;
  slug: string;
  aplicacoes: AplicacaoMenu[];
}

export interface MenuResponse {
  sistemas: SistemaMenu[];
}
// ─── Permissão ────────────────────────────────────────────────
export interface Permissao {
  id: number;
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

export interface EmpresaAutorizada {
  codigo: number;
  nome:   string;
}
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
  id: number;             
  nome: string;
  descricao: string;
  cor: string;
  total_usuarios: number;
  permissoes: Permissao[];
  ativo?: boolean;
  is_admin?: boolean; 
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

export interface AuthResponse {
  access_token: string;
  token_type:   string;
  usuario:      Usuario;  
}

export type PermissoesMap = Record<string, string[]>;

export interface PermissoesResponse {
  total: number;
  perfis: Perfil[];
}

export interface Empresas {
  codigo_empresa: number;
  nome_empresa: string;
}

export interface UsuarioEmpresasResponse {
  codigos: number[];
  sem_restricao: boolean;
}

export type RecursoSistema =
  | 'inadimplencia'           | 'dre'                     | 'pmp_pmr'
  | 'aging'                   | 'cobrancas'               | 'receber'
  | 'pagar'                   | 'fluxo_caixa'             | 'usuarios'
  | 'permissoes'              | 'relatorios'              | 'aging_report'
  | 'credito'                 | 'estoque_movimentacao'    | 'chamados_geral'  ;

// ─── Nav
export interface NavItem    { label: string; icon: string; route: string; badge?: number; permissao?: RecursoSistema; }
export interface NavSection { label: string; items: NavItem[]; }
export interface DashboardTab { label: string; route: string; badge?: number; }

export interface Usuario {
  id: number;
  username: string;
  nome: string;
  email: string;

  tenant_id: number;
  tenant_nome: string;
  tenant_slug: string;

  perfil_id: number;
  perfil_nome: string;
  perfil_cor: string;
  is_admin: boolean;

  ativo: boolean;
  telefone?: string;
  permissoes: PermissoesMap;
  empresas: EmpresaAutorizada[];
  tenants: TenantInfo[];
  ultimo_acesso?: string | null;
}

export interface UsuarioAdmin {
  id: number;
  username: string;
  nome: string;
  email: string;
  telefone?: string | null;
  perfil_id: number;
  perfil_nome?: string | null;
  perfil_cor?: string | null;
  is_admin: boolean;
  ativo: boolean;
  criado_em?: string | null;
  ultimo_acesso?: string | null;
}
 
// UsuariosService / UsuariosResponse devem usar UsuarioAdmin[] em vez de Usuario[]:
export interface UsuariosResponseAdmin {
  total: number;
  usuarios: UsuarioAdmin[];
}
 

export interface CreateUsuarioRequest {
  username: string;
  nome: string;
  email: string;
  telefone: string;
  password: string;
  perfil_id: number;
}

export interface UpdateUsuarioRequest {
  nome: string;
  email: string;
  telefone: string;
  perfil_id: number;
  ativo: boolean;
}

export interface UsuariosResponse {
  total: number;
  usuarios: Usuario[];
}

export interface ResetSenhaRequest {
  usuario_id: number;
  nova_senha: string;
}