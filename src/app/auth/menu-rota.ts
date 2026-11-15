// src/app/auth/menu-rota.ts
// Metadado de menu que cada rota "publica" para a Home (e, se quiser, para o menu lateral).
// O recurso é tipado com o seu RecursoSistema: errou o nome, o compilador avisa.
import { RecursoSistema } from '../shared/models/admin/usuario.models';

export interface MenuRota {
  recurso: RecursoSistema;   // o MESMO usado no permissaoGuard da rota
  titulo: string;
  descricao: string;
  icone: string;
  sistema?: string;          // opcional: selo no cartão (ex.: 'ERP', 'Chamados')
}

/** Uso:  data: menu('dre', 'DRE', 'Resultado por conta, com detalhe dos títulos.', '📑') */
export function menu(
  recurso: RecursoSistema,
  titulo: string,
  descricao: string,
  icone: string,
  sistema?: string,
): { menu: MenuRota } {
  return { menu: { recurso, titulo, descricao, icone, sistema } };
}