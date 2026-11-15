import { MenuRota } from '../../../auth/menu-rota';

export interface AvisoAdmin {
  id?: number;
  titulo: string;
  tag: 'Importante' | 'Novidade' | 'Manutenção' | null;
  publicar_de: string | null;
  publicar_ate: string | null;
  ativo: boolean;
  criado_por?: string | null;
  criado_em?: string;
}

export interface ResumoChamados { 
    abertos: number; 
    aguardandoVoce: number; 
    vencendoHoje: number; 
}
export interface Aviso { 
    id: string | number; 
    titulo: string; 
    data: string; 
    tag?: 'Importante' | 'Novidade' | 'Manutenção'; 
}
export interface StatusIntegracao { 
    nome: string; 
    status: 'ok' | 'atrasado' | 'erro'; 
    atualizadoEm?: string; 
}
export interface ItemHome extends MenuRota {
  id: string;          
  rota: string;        
  categoria: string;   
}

