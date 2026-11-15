// ─── Chips ──────────────────────────────────────────────────────────────

export interface ChipApiItem {
  id: number;
  id_empresa: number;
  id_departamento?: number | null;
  id_colaborador?: number | null;
  numero?: string | null;
  iccid?: string | null;
  nome_colaborador?: string | null;
  nome_empresa?: string | null;
}

export interface ChipPayload {
  id_empresa: number;
  id_departamento?: number | null;
  id_colaborador?: number | null;
  numero?: string | null;
  iccid?: string | null;
}

// ─── Empresas ───────────────────────────────────────────────────────────

export interface EmpresaApiItem {
  codigo_empresa: number;
  nome_empresa: string;
}

export interface EmpresaCreatePayload {
  codigo_empresa: number;
  nome_empresa: string;
}

export interface EmpresaUpdatePayload {
  nome_empresa: string;
}

// ─── Colaboradores (pessoa_bi) ────────────────────────────────────────────

export interface PessoaApiItem {
  id: number;
  nome: string;
  cpf_cnpj?: string | null;
  sexo?: string | null;
  colaborador: boolean;
}

export interface PessoaPayload {
  nome: string;
  cpf_cnpj?: string | null;
  sexo?: string | null;
  colaborador: boolean;
}

export interface PessoaListaResponse {
  total: number;
  itens: PessoaApiItem[];
}

export interface EmpresaListaResponse {
  total: number;
  empresas: EmpresaApiItem[];
}