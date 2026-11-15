export interface EquipamentoApiItem {
  id: number;
  nome: string;
  id_empresa: number;
  id_tipo: number;
  id_departamento?: number | null;
  id_marca?: number | null;
  id_modelo?: number | null;
  id_toner?: number | null;
  id_monitor?: number | null;
  id_colaborador?: number | null;
  senha?: string | null;
  scanner?: boolean | null;
  data_fabricacao?: string | null;
  serie?: string | null;
  processador?: string | null;
  memoria_ram?: string | null;
  armazenamento?: string | null;
  tamanho?: string | null;
  so?: string | null;
  ip?: string | null;
  mac?: string | null;
  observacao?: string | null;
  ativo: boolean;

  // enriquecidos pelo backend (joins)
  nome_empresa?: string | null;
  nome_tipo?: string | null;
  nome_marca?: string | null;
  nome_modelo?: string | null;
  nome_colaborador?: string | null;
}

export interface EquipamentoListaResponse {
  total: number;
  itens: EquipamentoApiItem[];
}

export interface MovimentacaoItem {
  id: number;
  id_colaborador: number;
  nome_colaborador?: string | null;
  data_vinculo: string;
  data_devolucao?: string | null;
  observacao?: string | null;
}

export interface ResumoEquipamentos {
  total: number;
  ativos: number;
  inativos: number;
  sem_colaborador: number;
  por_tipo: Record<string, number>;
  por_empresa: Record<string, number>;
}

export interface DropdownItem {
  id: number;
  nome: string;
}

// Payload de criação/edição — mesmos campos do EquipamentoBase no backend
export interface EquipamentoPayload {
  nome: string;
  id_empresa: number;
  id_tipo: number;
  id_departamento?: number | null;
  id_marca?: number | null;
  id_modelo?: number | null;
  id_toner?: number | null;
  id_monitor?: number | null;
  id_colaborador?: number | null;
  senha?: string | null;
  scanner?: boolean;
  data_fabricacao?: string | null;
  serie?: string | null;
  processador?: string | null;
  memoria_ram?: string | null;
  armazenamento?: string | null;
  tamanho?: string | null;
  so?: string | null;
  ip?: string | null;
  mac?: string | null;
  observacao?: string | null;
}