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
} from '../models/financeiro.models';
import {
  Usuario,
  Perfil,
  Permissao,
  CreateUsuarioRequest,
  UpdateUsuarioRequest,
} from '../models/usuario.models'
 
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
      `${this.base}/usuarios/api`,
      { params }
    );
  }
 
  /**
   * Obtém um usuário específico
   */
  getUsuario(id: number) {
    return this.http.get<Usuario>(
      `${this.base}/usuarios/api${id}`
    );
  }
 
  /**
   * Cria um novo usuário
   */
  criarUsuario(data: CreateUsuarioRequest) {
    return this.http.post<Usuario>(
      `${this.base}/usuarios/api`,
      data
    );
  }
 
  /**
   * Atualiza um usuário existente
   */
  atualizarUsuario(id: number, data: UpdateUsuarioRequest) {
    return this.http.put<Usuario>(
      `${this.base}/usuarios/api/${id}`,
      data
    );
  }
 
  /**
   * Ativa ou desativa um usuário
   */
  toggleAtivoUsuario(id: number, ativo: boolean) {
    return this.http.patch<Usuario>(
      `${this.base}/usuarios/api/${id}/ativo`,
      { ativo }
    );
  }
 
  /**
   * Reseta a senha de um usuário
   */
  resetarSenhaUsuario(id: number, novaSenha: string) {
    return this.http.post<{ message: string }>(
      `${this.base}/usuarios/api/${id}/reset-senha`,
      { nova_senha: novaSenha }
    );
  }
 
  /**
   * Deleta um usuário (soft delete)
   */
  deletarUsuario(id: number) {
    return this.http.delete<{ message: string }>(
      `${this.base}/usuarios/api/${id}`
    );
  }
 
  // ─── PERMISSÕES ───────────────────────────────────────────────────────
  
  /**
   * Obtém lista de perfis
   */
  getPerfis() {
    return this.http.get<ApiResponse<Perfil>>(
      `${this.base}/permissoes/api/perfis`
    );
  }
 
  /**
   * Obtém um perfil específico com permissões
   */
  getPerfil(id: number) {
    return this.http.get<Perfil & { permissoes: Permissao[] }>(
      `${this.base}/permissoes/api/perfis/${id}`
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
      `${this.base}/permissoes/api/perfis`,
      data
    );
  }
 
  /**
   * Atualiza um perfil existente
   */
  atualizarPerfil(id: number, data: {
    nome: string;
    descricao: string;
    cor: string;
    permissoes: { [recurso: string]: { visualizar: boolean; criar: boolean; editar: boolean; excluir: boolean } };
  }) {
    return this.http.put<Perfil>(
      `${this.base}/permissoes/api/perfis/${id}`,
      data
    );
  }
 
  /**
   * Deleta um perfil
   */
  deletarPerfil(id: number) {
    return this.http.delete<{ message: string }>(
      `${this.base}/permissoes/api/perfis/${id}`
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
    }>(`${this.base}/permissoes/api/recursos`);
  }
 
  /**
   * Obtém categorias de recursos
   */
  getCategorias() {
    return this.http.get<{
      categorias: string[];
    }>(`${this.base}/permissoes/api/categorias`);
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
