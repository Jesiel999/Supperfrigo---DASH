export interface TermoModelo {
  id: number;
  slug: string;
  nome: string;
  descricao: string | null;
  versao: number;
  ativo: boolean;
  atualizado_em: string | null;
}

export interface EmpresaTermoDados {
  razao_social: string | null;
  nome_fantasia: string | null;
  cnpj: string | null;
  ie: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  telefone: string | null;
}

export interface EmpresaTermo extends EmpresaTermoDados {
  codigo_empresa: number;
  nome_empresa: string;
}

export interface ItemEquipamentoTermo {
  id: number;
  cor?: string | null;
  condicao?: string | null;
}

export interface GerarTermoPayload {
  id_modelo: number;
  id_empresa: number;
  id_colaborador: number;
  equipamentos: ItemEquipamentoTermo[];
  ids_chips: number[];
  acessorios: Record<string, boolean>;
  data_emissao?: string | null;
  formato: 'pdf' | 'docx';
}

export interface TermoEmitido {
  id: number;
  id_modelo: number;
  nome_modelo: string | null;
  versao_modelo: number;
  id_empresa: number;
  id_colaborador: number;
  nome_colaborador: string | null;
  ids_equipamentos: number[];
  ids_chips: number[];
  gerado_por: string | null;
  gerado_em: string;
  tem_assinado: boolean;
}

export interface CamposTermoResponse {
  campos: Record<string, string[]>;
  exemplo_lista: string;
}

/** Acessórios exibidos por modelo (slug) — deve bater com os campos do .docx */
export const ACESSORIOS_POR_MODELO: Record<string, { chave: string; rotulo: string }[]> = {
  notebook: [
    { chave: 'carregador', rotulo: 'Carregador' },
    { chave: 'mouse', rotulo: 'Mouse' },
    { chave: 'teclado', rotulo: 'Teclado' },
    { chave: 'monitor', rotulo: 'Monitor' },
    { chave: 'suporte', rotulo: 'Suporte de notebook' },
    { chave: 'mouse_pad', rotulo: 'Mouse pad' },
  ],
  tablet: [
    { chave: 'carregador', rotulo: 'Carregador' },
    { chave: 'cabo_usb', rotulo: 'Cabo USB' },
    { chave: 'capa', rotulo: 'Capa' },
    { chave: 'pelicula', rotulo: 'Película' },
    { chave: 'caneta', rotulo: 'Caneta' },
  ],
  monitor: [
    { chave: 'cabo_energia', rotulo: 'Cabo de energia' },
    { chave: 'cabo_video', rotulo: 'Cabo de vídeo (HDMI/VGA/DP)' },
    { chave: 'suporte', rotulo: 'Suporte / base' },
  ],
};
