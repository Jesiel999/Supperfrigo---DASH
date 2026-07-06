import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  InadimplenciaApiItem,
  EnvioCobrancaPayload,
  PmpApiItem,
  PmrApiItem,
  RespostaEnvio,
  Usuario,
  Perfil,
  Permissao,
  CreateUsuarioRequest,
  UpdateUsuarioRequest,
} from '../models/financeiro.models';
 
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;
 
  // ─── USUÁRIOS ─────────────────────────────────────────────────────────
  
  getUsuarios(filtros?: {
    busca?: string;
    perfil_id?: string;
    ativo?: boolean;
  }) {
    let params = new HttpParams();
 
    if (filtros?.busca) {
      params = params.set('busca', filtros.busca);
    }
 
    if (filtros?.perfil_id) {
      params = params.set('perfil_id', filtros.perfil_id);
    }
 
    if (filtros?.ativo !== undefined) {
      params = params.set('ativo', String(filtros.ativo));
    }
 
    return this.http.get<ApiResponse<Usuario>>(
      `${this.base}/usuarios/api/usuarios`,
      { params }
    );
  }
 
  /**
   * Obtém um usuário específico
   */
  getUsuario(id: string) {
    return this.http.get<Usuario>(
      `${this.base}/api/usuarios/${id}`
    );
  }
 
  /**
   * Cria um novo usuário
   */
  criarUsuario(data: CreateUsuarioRequest) {
    return this.http.post<Usuario>(
      `${this.base}/usuarios/api/usuarios`,
      data
    );
  }
 
  /**
   * Atualiza um usuário existente
   */
  atualizarUsuario(id: string, data: UpdateUsuarioRequest) {
    return this.http.put<Usuario>(
      `${this.base}/api/usuarios/${id}`,
      data
    );
  }
 
  /**
   * Ativa ou desativa um usuário
   */
  toggleAtivoUsuario(id: string, ativo: boolean) {
    return this.http.patch<Usuario>(
      `${this.base}/api/usuarios/${id}/ativo`,
      { ativo }
    );
  }
 
  /**
   * Reseta a senha de um usuário
   */
  resetarSenhaUsuario(id: string, novaSenha: string) {
    return this.http.post<{ message: string }>(
      `${this.base}/api/usuarios/${id}/reset-senha`,
      { nova_senha: novaSenha }
    );
  }
 
  /**
   * Deleta um usuário (soft delete)
   */
  deletarUsuario(id: string) {
    return this.http.delete<{ message: string }>(
      `${this.base}/api/usuarios/${id}`
    );
  }
 
  // ─── PERMISSÕES ───────────────────────────────────────────────────────
  
  /**
   * Obtém lista de perfis
   */
  getPerfis() {
    return this.http.get<ApiResponse<Perfil>>(
      `${this.base}/permissoes/api/permissoes/perfis`
    );
  }
 
  /**
   * Obtém um perfil específico com permissões
   */
  getPerfil(id: string) {
    return this.http.get<Perfil & { permissoes: Permissao[] }>(
      `${this.base}/permissoes/api/permissoes/perfis/${id}`
    );
  }
 
  /**
   * Cria um novo perfil
   */
  criarPerfil(data: {
    nome: string;
    descricao: string;
    cor: string;
    permissoes: { [recurso: string]: { visualizar: boolean; criar: boolean; editar: boolean; excluir: boolean } };
  }) {
    return this.http.post<Perfil>(
      `${this.base}/permissoes/api/permissoes/perfis`,
      data
    );
  }
 
  /**
   * Atualiza um perfil existente
   */
  atualizarPerfil(id: string, data: {
    nome: string;
    descricao: string;
    cor: string;
    permissoes: { [recurso: string]: { visualizar: boolean; criar: boolean; editar: boolean; excluir: boolean } };
  }) {
    return this.http.put<Perfil>(
      `${this.base}/permissoes/api/permissoes/perfis/${id}`,
      data
    );
  }
 
  /**
   * Deleta um perfil
   */
  deletarPerfil(id: string) {
    return this.http.delete<{ message: string }>(
      `${this.base}/permissoes/api/permissoes/perfis/${id}`
    );
  }
 
  /**
   * Obtém recursos/módulos disponíveis
   */
  getRecursos() {
    return this.http.get<{
      recursos: Array<{
        recurso: string;
        label: string;
        categoria: string;
      }>;
    }>(`${this.base}/permissoes/api/permissoes/recursos`);
  }
 
  /**
   * Obtém categorias de recursos
   */
  getCategorias() {
    return this.http.get<{
      categorias: string[];
    }>(`${this.base}/permissoes/api/permissoes/categorias`);
  }

  getInadimplencia(dataInicio?: string, dataFim?: string) {
    let params = new HttpParams();

    if (dataInicio) {
      params = params.set('data_inicio', dataInicio);
    }

    if (dataFim) {
      params = params.set('data_fim', dataFim);
    }

    return this.http.get<ApiResponse<InadimplenciaApiItem>>(
      `${this.base}/financeiro/inadimplencia`,
      { params }
    );
  }

  getPmp(dataInicio?: string, dataFim?: string) {
    let params = new HttpParams();

    if (dataInicio) {
      params = params.set('data_inicio', dataInicio);
    }

    if (dataFim) {
      params = params.set('data_fim', dataFim);
    }

    return this.http.get<ApiResponse<PmpApiItem>>(
      `${this.base}/financeiro/pmp`,
      { params }
    );
  }

  getPmr(dataInicio?: string, dataFim?: string) {
    let params = new HttpParams();

    if (dataInicio) {
      params = params.set('data_inicio', dataInicio);
    }

    if (dataFim) {
      params = params.set('data_fim', dataFim);
    }

    return this.http.get<ApiResponse<PmrApiItem>>(
      `${this.base}/financeiro/pmr`,
      { params }
    );
  }

  enviarCobranca(payload: EnvioCobrancaPayload) {
    return this.http.post<RespostaEnvio>(
      `${this.base}/cobrancas/enviar`,
      payload
    );
  }

  enviarWhatsapp(idPessoa: number, mensagem?: string) {
    return this.http.post<RespostaEnvio>(
      `${this.base}/cobrancas/enviar-whatsapp/${idPessoa}`,
      { mensagem }
    );
  }

  enviarEmail(idPessoa: number, mensagem?: string) {
    return this.http.post<RespostaEnvio>(
      `${this.base}/cobrancas/enviar-email/${idPessoa}`,
      { mensagem }
    );
  }

  getHistoricoCobrancas(idPessoa?: number) {
    let params = new HttpParams();
    if (idPessoa) params = params.set('id_pessoa', idPessoa);
    return this.http.get<ApiResponse<any>>(
      `${this.base}/cobrancas/historico`,
      { params }
    );
  }
  
}
