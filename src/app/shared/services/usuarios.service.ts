import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  UsuarioAdmin,
  UsuariosResponseAdmin,
  CreateUsuarioRequest,
  UpdateUsuarioRequest,
  UsuarioEmpresasResponse
} from '../models/usuario.models';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/usuarios/api`;

  getUsuarios(filtros?: { busca?: string; perfil_id?: number; ativo?: boolean }) {
    let params = new HttpParams();

    if (filtros?.busca) {
      params = params.set('busca', filtros.busca);
    }
    if (filtros?.perfil_id !== undefined) {
      params = params.set('perfil_id', String(filtros.perfil_id));
    }
    if (filtros?.ativo !== undefined) {
      params = params.set('ativo', String(filtros.ativo));
    }

    return this.http.get<UsuariosResponseAdmin>(this.base, { params });
  }

  getEmpresasUsuario(usuarioId: number) {
    return this.http.get<UsuarioEmpresasResponse>(`${this.base}/${usuarioId}/empresas`);
  }

  atualizarEmpresasUsuario(usuarioId: number, codigos: number[]) {
    return this.http.put<UsuarioEmpresasResponse>(`${this.base}/${usuarioId}/empresas`, { codigos });
  }

  getUsuario(id: number) {
    return this.http.get<UsuarioAdmin>(`${this.base}/${id}`);
  }

  criarUsuario(data: CreateUsuarioRequest) {
    return this.http.post<UsuarioAdmin>(this.base, data);
  }

  atualizarUsuario(id: number, data: UpdateUsuarioRequest) {
    return this.http.put<UsuarioAdmin>(`${this.base}/${id}`, data);
  }

  toggleAtivo(id: number, ativo: boolean) {
    return this.http.patch<UsuarioAdmin>(`${this.base}/${id}/ativo`, { ativo });
  }

  resetarSenha(id: number, novaSenha: string) {
    return this.http.post<{ message: string }>(`${this.base}/${id}/reset-senha`, { nova_senha: novaSenha });
  }

  deletarUsuario(id: number) {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }
}