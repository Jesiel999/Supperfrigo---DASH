import { Injectable, inject } from '@angular/core';
import { EmpresaFilterService } from './empresa-filter.service';
import { ApiService } from './api.service';
import { BehaviorSubject } from 'rxjs';
import { Permissao, PermissaoRecurso, PermissoesResponse, Perfil, CreatePerfilRequest, UpdatePerfilRequest } from '../models/financeiro.models';


@Injectable({
  providedIn: 'root'
})
export class PermissoesService {
  private readonly api = inject(ApiService);
  readonly empresaFilter = inject(EmpresaFilterService);
  private usuariosSubject = new BehaviorSubject<Perfil[]>([]);
  public usuarios$ = this.usuariosSubject.asObservable();


  /**
   * Busca todos os perfis do tenant atual
   */
  getPerfis() {
    return this.api.getPerfis();
  }

  /**
   * Busca um perfil específico
   */
  getPerfil(id: string) {
    return this.api.getPerfil(id);
  }

  /**
   * Cria um novo perfil
   */
  criarPerfil(data: CreatePerfilRequest) {
    return this.api.criarPerfil(data);
  }

  /**
   * Atualiza um perfil existente
   */
  atualizarPerfil(id: string, data: UpdatePerfilRequest) {
    return this.api.atualizarPerfil(id, data);
  }

  /**
   * Deleta um perfil
   */
  deletarPerfil(id: string) {
    return this.api.deletarPerfil(id);
  }

  /**
   * Busca as categorias disponíveis
   */
  getCategorias() {
    return this.api.getCategorias();
  }
}