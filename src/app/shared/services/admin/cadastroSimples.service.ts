import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { DropdownItem } from '../../models/equipamentos.models';

export type RecursoCadastroSimples = 'marcas' | 'modelos' | 'toners' | 'departamentos';

/**
 * Um único service para os 4 cadastros de apoio no formato (id, nome):
 * Marca, Modelo, Toner, Departamento. O componente que o usa passa qual
 * recurso quer manipular em cada chamada.
 */
@Injectable({ providedIn: 'root' })
export class CadastroSimplesService {
  private readonly api = inject(ApiService);

  listar(recurso: RecursoCadastroSimples, busca?: string) {
    return this.api.listarCadastroSimples(recurso, busca);
  }

  criar(recurso: RecursoCadastroSimples, nome: string) {
    return this.api.criarCadastroSimples(recurso, nome);
  }

  atualizar(recurso: RecursoCadastroSimples, id: number, nome: string) {
    return this.api.atualizarCadastroSimples(recurso, id, nome);
  }

  excluir(recurso: RecursoCadastroSimples, id: number) {
    return this.api.excluirCadastroSimples(recurso, id);
  }
}

export type { DropdownItem };
