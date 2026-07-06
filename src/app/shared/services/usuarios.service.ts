import { Injectable, inject } from '@angular/core';
import { EmpresaFilterService } from './empresa-filter.service';
import { ApiService } from './api.service';
import { BehaviorSubject } from 'rxjs';
import { Usuario, CreateUsuarioRequest, UpdateUsuarioRequest } from '../models/financeiro.models';


@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private readonly api = inject(ApiService);
  readonly empresaFilter = inject(EmpresaFilterService);
  private usuariosSubject = new BehaviorSubject<Usuario[]>([]);
  public usuarios$ = this.usuariosSubject.asObservable();

  getUsuarios() {
    return this.api.getUsuarios();
  }

  getUsuario(id: string) {
    return this.api.getUsuario(id);
  }

  criarUsuario(data: CreateUsuarioRequest) {
    return this.api.criarUsuario(data);
  }

  atualizarUsuario(id: string, data: UpdateUsuarioRequest) {
    return this.api.atualizarUsuario(id, data);
  }

  toggleAtivo(id: string, ativo: boolean) {
    return this.api.toggleAtivoUsuario(id, ativo);
  }

  resetarSenha(usuario_id: string, nova_senha: string) {
    return this.api.resetarSenhaUsuario(usuario_id, nova_senha);
  }

  deletarUsuario(id: string) {
    return this.api.deletarUsuario(id);
  }
}