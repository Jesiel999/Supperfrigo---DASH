import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import {
  ApiResponse,
  InadimplenciaApiItem,
  PmpApiItem,
  PmrApiItem,
} from '../models/financeiro.models';
import { EnvioCobrancaPayload, RespostaEnvio } from '../models/cobranca.models';
import { TaxaApiItem } from '../models/taxa.models';
import {
  Usuario,
  Perfil,
  Permissao,
  CreateUsuarioRequest,
  UpdateUsuarioRequest,
} from '../models/usuario.models'
import { EstoqueApiItem } from '../models/estoque.models';
import {
  EquipamentoApiItem,
  EquipamentoListaResponse,
  EquipamentoPayload,
  MovimentacaoItem,
  ResumoEquipamentos,
  DropdownItem,
} from '../models/equipamentos.models';
import {
  ChipApiItem,
  ChipPayload,
  EmpresaApiItem,
  EmpresaCreatePayload,
  EmpresaUpdatePayload,
  PessoaApiItem,
  EmpresaListaResponse,
  PessoaPayload,
  PessoaListaResponse,
} from '../models/cadastros.models';
 
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

  getEstoque(dataInicio?: string, dataFim?: string) {
    let params = new HttpParams();

    return this.http.get<ApiResponse<EstoqueApiItem>>(
      `${this.base}/estoque/atual`,
      { params }
    );
  }

  getReceber(dataInicio?: string, dataFim?: string) {
    let params = new HttpParams();

    if(dataInicio) {
      params = params.set('data_inicio', dataInicio);
    }

    if(dataFim) {
      params = params.set('data_fim', dataFim);
    }

    return this.http.get<ApiResponse<TaxaApiItem>>(
      `${this.base}/financeiro/receber`,
      { params }
    );
  }

  getPagar(dataInicio?: string, dataFim?: string) {
    let params = new HttpParams();

    if(dataInicio) {
      params = params.set('data_inicio', dataInicio);
    }

    if(dataFim) {
      params = params.set('data_fim', dataFim);
    }

    return this.http.get<ApiResponse<TaxaApiItem>>(
      `${this.base}/financeiro/pagar`,
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
  
    // ─── EQUIPAMENTOS ───────────────────────────────────────────────────────

  getEquipamentos(filtros?: {
    tipo?: number;
    empresa?: number;
    departamento?: number;
    colaborador?: number;
    busca?: string;
    ativo?: boolean;
    skip?: number;
    limit?: number;
  }) {
    let params = new HttpParams();

    if (filtros?.tipo != null) params = params.set('tipo', filtros.tipo);
    if (filtros?.empresa != null) params = params.set('empresa', filtros.empresa);
    if (filtros?.departamento != null) params = params.set('departamento', filtros.departamento);
    if (filtros?.colaborador != null) params = params.set('colaborador', filtros.colaborador);
    if (filtros?.busca) params = params.set('busca', filtros.busca);
    if (filtros?.ativo != null) params = params.set('ativo', String(filtros.ativo));
    if (filtros?.skip != null) params = params.set('skip', filtros.skip);
    if (filtros?.limit != null) params = params.set('limit', filtros.limit);

    return this.http.get<EquipamentoListaResponse>(
      `${this.base}/api/equipamentos`,
      { params }
    );
  }

  getEquipamento(id: number) {
    return this.http.get<EquipamentoApiItem>(`${this.base}/api/equipamentos/${id}`);
  }

  getResumoEquipamentos() {
    return this.http.get<ResumoEquipamentos>(`${this.base}/api/equipamentos/resumo`);
  }

  getHistoricoEquipamento(id: number) {
    return this.http.get<MovimentacaoItem[]>(`${this.base}/api/equipamentos/${id}/historico`);
  }

  criarEquipamento(data: EquipamentoPayload) {
    return this.http.post<EquipamentoApiItem>(`${this.base}/api/equipamentos`, data);
  }

  atualizarEquipamento(id: number, data: EquipamentoPayload) {
    return this.http.put<EquipamentoApiItem>(`${this.base}/api/equipamentos/${id}`, data);
  }

  excluirEquipamento(id: number) {
    return this.http.delete<void>(`${this.base}/api/equipamentos/${id}`);
  }

  vincularEquipamento(id: number, idColaborador: number, observacao?: string) {
    return this.http.post<EquipamentoApiItem>(
      `${this.base}/api/equipamentos/${id}/vincular`,
      { id_colaborador: idColaborador, observacao }
    );
  }

  devolverEquipamento(id: number, observacao?: string) {
    return this.http.post<EquipamentoApiItem>(
      `${this.base}/api/equipamentos/${id}/devolver`,
      { observacao }
    );
  }

  // ─── DROPDOWNS (equipamentos) ────────────────────────────────────────────

  getTiposEquipamento() {
    return this.http.get<DropdownItem[]>(`${this.base}/api/tipos-equipamento`);
  }

  getMarcas() {
    return this.http.get<DropdownItem[]>(`${this.base}/api/marcas`);
  }

  getModelos(idMarca?: number) {
    let params = new HttpParams();
    if (idMarca != null) params = params.set('id_marca', idMarca);
    return this.http.get<DropdownItem[]>(`${this.base}/api/modelos`, { params });
  }

  getToners() {
    return this.http.get<DropdownItem[]>(`${this.base}/api/toners`);
  }

  getDepartamentos() {
    return this.http.get<DropdownItem[]>(`${this.base}/api/departamentos`);
  }

  getEmpresasDropdown() {
    return this.http.get<DropdownItem[]>(`${this.base}/api/empresas`);
  }

  getMonitoresDisponiveis() {
    return this.http.get<DropdownItem[]>(`${this.base}/api/monitores-disponiveis`);
  }

  // ─── COLABORADORES ───────────────────────────────────────────────────────

  getColaboradoresDropdown(busca?: string) {
    let params = new HttpParams();
    if (busca) params = params.set('busca', busca);
    params = params.set('colaborador', 'true').set('skip', '0').set('limit', '50');

    return this.http
      .get<PessoaListaResponse>(`${this.base}/api/pessoas`, { params })
      .pipe(map(res => res.itens.map(p => ({ id: p.id, nome: p.nome }))));
  }

  getEquipamentosDoColaborador(idColaborador: number) {
    return this.http.get<EquipamentoApiItem[]>(
      `${this.base}/api/colaboradores/${idColaborador}/equipamentos`
    );
  }

  // ─── CHIPS ───────────────────────────────────────────────────────────────

  getChips(filtros?: { empresa?: number; colaborador?: number; busca?: string; skip?: number; limit?: number }) {
    let params = new HttpParams();
    if (filtros?.empresa != null) params = params.set('empresa', filtros.empresa);
    if (filtros?.colaborador != null) params = params.set('colaborador', filtros.colaborador);
    if (filtros?.busca) params = params.set('busca', filtros.busca);
    if (filtros?.skip != null) params = params.set('skip', filtros.skip);
    if (filtros?.limit != null) params = params.set('limit', filtros.limit);

    return this.http.get<ChipApiItem[]>(`${this.base}/api/chips`, { params });
  }

  criarChip(data: ChipPayload) {
    return this.http.post<ChipApiItem>(`${this.base}/api/chips`, data);
  }

  atualizarChip(id: number, data: ChipPayload) {
    return this.http.put<ChipApiItem>(`${this.base}/api/chips/${id}`, data);
  }

  excluirChip(id: number) {
    return this.http.delete<void>(`${this.base}/api/chips/${id}`);
  }

  vincularChip(id: number, idColaborador: number, observacao?: string) {
    return this.http.post<ChipApiItem>(`${this.base}/api/chips/${id}/vincular`, {
      id_colaborador: idColaborador,
      observacao,
    });
  }

  devolverChip(id: number, observacao?: string) {
    return this.http.post<ChipApiItem>(`${this.base}/api/chips/${id}/devolver`, { observacao });
  }

  getHistoricoChip(id: number) {
    return this.http.get<MovimentacaoItem[]>(`${this.base}/api/chips/${id}/historico`);
  }

  private cadastroSimplesUrl(recurso: 'marcas' | 'modelos' | 'toners' | 'departamentos', id?: number) {
    return id != null ? `${this.base}/api/${recurso}/${id}` : `${this.base}/api/${recurso}`;
  }

  listarCadastroSimples(recurso: 'marcas' | 'modelos' | 'toners' | 'departamentos', busca?: string) {
    let params = new HttpParams();
    if (busca) params = params.set('busca', busca);
    return this.http.get<DropdownItem[]>(this.cadastroSimplesUrl(recurso), { params });
  }

  criarCadastroSimples(recurso: 'marcas' | 'modelos' | 'toners' | 'departamentos', nome: string) {
    return this.http.post<DropdownItem>(this.cadastroSimplesUrl(recurso), { nome });
  }

  atualizarCadastroSimples(recurso: 'marcas' | 'modelos' | 'toners' | 'departamentos', id: number, nome: string) {
    return this.http.put<DropdownItem>(this.cadastroSimplesUrl(recurso, id), { nome });
  }

  excluirCadastroSimples(recurso: 'marcas' | 'modelos' | 'toners' | 'departamentos', id: number) {
    return this.http.delete<void>(this.cadastroSimplesUrl(recurso, id));
  }

  // ─── EMPRESAS (cadastro) ──────────────────────────────────────────────────

  listarEmpresasCadastro(busca?: string) {
    let params = new HttpParams();
    if (busca) params = params.set('busca', busca);

    return this.http
      .get<EmpresaListaResponse>(`${this.base}/empresas`, { params })
      .pipe(map(res => res.empresas));
  }

  criarEmpresa(data: EmpresaCreatePayload) {
    return this.http.post<EmpresaApiItem>(`${this.base}/api/empresas`, data);
  }

  atualizarEmpresa(codigoEmpresa: number, data: EmpresaUpdatePayload) {
    return this.http.put<EmpresaApiItem>(`${this.base}/api/empresas/${codigoEmpresa}`, data);
  }

  excluirEmpresa(codigoEmpresa: number) {
    return this.http.delete<void>(`${this.base}/api/empresas/${codigoEmpresa}`);
  }

  listarPessoas(filtros?: {
    busca?: string;
    colaborador?: boolean;
    skip?: number;
    limit?: number;
  }) {
    let params = new HttpParams();

    if (filtros?.busca) {
      params = params.set('busca', filtros.busca);
    }

    if (filtros?.colaborador != null) {
      params = params.set('colaborador', String(filtros.colaborador));
    }

    if (filtros?.skip != null) {
      params = params.set('skip', String(filtros.skip));
    }

    if (filtros?.limit != null) {
      params = params.set('limit', String(filtros.limit));
    }

    return this.http.get<PessoaListaResponse>(
      `${this.base}/api/pessoas`,
      { params }
    );
  }


  obterPessoa(id: number) {
    return this.http.get<PessoaApiItem>(
      `${this.base}/api/pessoas/${id}`
    );
  }

  tornarColaborador(cpf_cnpj: string) {
    return this.http.post<PessoaApiItem>(
      `${this.base}/api/pessoas/${encodeURIComponent(cpf_cnpj)}/colaborador`,
      {}
    );
  }


  excluirPessoa(id: number) {
    return this.http.delete<void>(
      `${this.base}/api/pessoas/${id}`
    );
  }
}
