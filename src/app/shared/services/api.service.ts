import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import {
  ApiResponse,
  InadimplenciaApiItem,
  PmpApiItem,
  PmrApiItem,
} from '../models/financeiro/financeiro.models';
import { EnvioCobrancaPayload, RespostaEnvio } from '../models/financeiro/cobranca.models';
import { TaxaApiItem } from '../models/financeiro/taxa.models';
import { FluxoCaixaItem, FluxoCaixaTitulo } from '../models/financeiro/fluxo_caixa.models';
import {
  Usuario,
  Perfil,
  Permissao,
  CreateUsuarioRequest,
  UpdateUsuarioRequest,
} from '../models/admin/usuario.models'
import { EstoqueApiItem } from '../models/estoque/estoque.models';
import {
  EquipamentoApiItem,
  EquipamentoListaResponse,
  EquipamentoPayload,
  MovimentacaoItem,
  ResumoEquipamentos,
  DropdownItem,
} from '../models/admin/equipamentos.models';
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
} from '../models/admin/cadastros.models';
import { DreItem, DreTitulo, DreDespesaMes } from '../models/financeiro/dre.models';
import { FcpItem, FcpTitulo, FcpTituloTable } from '../models/financeiro/fcp.models';
import { FiltroOpcao } from '../components/pessoa-filter/pessoa-filter';
import { AvisoAdmin, StatusIntegracao, Aviso } from '../models/admin/home.models'
import {
  TermoModelo, EmpresaTermo, EmpresaTermoDados, GerarTermoPayload,
  TermoEmitido, CamposTermoResponse,
} from '../models/admin/termo.models';

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

  private _params(base: Record<string, string | boolean>, idPessoa = ''): Record<string, string | boolean> {
    return idPessoa ? { ...base, id_pessoa: idPessoa } : base;
  }

  // ── DRE ──
  getDre(inicio: string, fim: string, incluirAbertos = true, idPessoa = '') {
    return this.http.get<ApiResponse<DreItem>>(`${this.base}/financeiro/dre`, {
      params: this._params({ data_inicio: inicio, data_fim: fim, incluir_abertos: incluirAbertos }, idPessoa),
    });
  }
  getDreTitulos(classificacao: string, inicio: string, fim: string, incluirAbertos = true, idPessoa = '') {
    return this.http.get<ApiResponse<DreTitulo>>(`${this.base}/financeiro/dre/titulos`, {
      params: this._params({ classificacao, data_inicio: inicio, data_fim: fim, incluir_abertos: incluirAbertos }, idPessoa),
    });
  }
  getDreDespesasMensal(inicio: string, fim: string, incluirAbertos = true, idPessoa = '') {
    return this.http.get<ApiResponse<DreDespesaMes>>(`${this.base}/financeiro/despesas-mensal`, {
      params: this._params({ data_inicio: inicio, data_fim: fim, incluir_abertos: incluirAbertos }, idPessoa),
    });
  }

  // ── FCP ──
  getFcp(inicio: string, fim: string, idPessoa = '') {
    return this.http.get<ApiResponse<FcpItem>>(`${this.base}/financeiro/fcp`, {
      params: this._params({ data_inicio: inicio, data_fim: fim }, idPessoa),
    });
  }
  getFcpTitulos(classificacao: string, inicio: string, fim: string, idPessoa = '') {
    // ⚠️ caminho que o seu back-end expõe (você estava usando /financeiro/titulos)
    return this.http.get<ApiResponse<FcpTitulo>>(`${this.base}/financeiro/fcp/titulos`, {
      params: this._params({ classificacao, data_inicio: inicio, data_fim: fim }, idPessoa),
    });
  }
  getFcpPagar(inicio: string, fim: string, idPessoa = '') {
    return this.http.get<ApiResponse<FcpTituloTable>>(`${this.base}/financeiro/fcp/pagar`, {
      params: this._params({ data_inicio: inicio, data_fim: fim }, idPessoa),
    });
  }

  // ── FLUXO DE CAIXA ──
  getFluxoCaixa(inicio: string, fim: string) {
    return this.http.get<ApiResponse<FluxoCaixaItem>>(`${this.base}/financeiro/fluxo-caixa`, {
      params: { data_inicio: inicio, data_fim: fim },
    });
  }
  getFluxoCaixaTitulos(classificacao: string, inicio: string, fim: string) {
    return this.http.get<ApiResponse<FluxoCaixaTitulo>>(`${this.base}/financeiro/fluxo-caixa/titulos`, {
      params: { classificacao, data_inicio: inicio, data_fim: fim },
    });
  }
 

  // ── Filtro de pessoas ──
  getPessoasFiltro(inicio: string, fim: string) {
      return this.http.get<ApiResponse<FiltroOpcao>>(`${this.base}/financeiro/pessoas`, {
        params: { data_inicio: inicio, data_fim: fim },
    });
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

  
  // ─── Avisos (cadastro) ──────────────────────────────────────────────────

  getAvisos() {
    return this.http.get<ApiResponse<Aviso>>(`${this.base}/home/avisos`);
  }
  getStatusIntegracoes() {
    return this.http.get<ApiResponse<StatusIntegracao>>(`${this.base}/home/integracoes`);
  }
  
  // administração de avisos
  getAvisosAdmin() {
    return this.http.get<ApiResponse<AvisoAdmin>>(`${this.base}/home/admin/avisos`);
  }
  salvarAviso(a: AvisoAdmin) {
    const corpo = { titulo: a.titulo, tag: a.tag, publicar_de: a.publicar_de, publicar_ate: a.publicar_ate, ativo: a.ativo };
    return a.id
      ? this.http.put(`${this.base}/home/admin/avisos/${a.id}`, corpo)
      : this.http.post(`${this.base}/home/admin/avisos`, corpo);
  }
  excluirAviso(id: number) {
    return this.http.delete(`${this.base}/home/admin/avisos/${id}`);
  }

  // ─── TERMOS DE RESPONSABILIDADE ──────────────────────────────────────────

  getTermoModelos(incluirInativos = false) {
    return this.http.get<TermoModelo[]>(`${this.base}/api/termos/modelos`, {
      params: { incluir_inativos: String(incluirInativos) },
    });
  }

  getTermoCampos() {
    return this.http.get<CamposTermoResponse>(`${this.base}/api/termos/campos`);
  }

  baixarTermoModelo(id: number) {
    return this.http.get(`${this.base}/api/termos/modelos/${id}/download`, { responseType: 'blob' });
  }

  criarTermoModelo(slug: string, nome: string, descricao: string, arquivo: File) {
    const fd = new FormData();
    fd.append('slug', slug);
    fd.append('nome', nome);
    if (descricao) fd.append('descricao', descricao);
    fd.append('arquivo', arquivo);
    return this.http.post<TermoModelo>(`${this.base}/api/termos/modelos`, fd);
  }

  substituirTermoModelo(id: number, arquivo: File) {
    const fd = new FormData();
    fd.append('arquivo', arquivo);
    return this.http.put<TermoModelo>(`${this.base}/api/termos/modelos/${id}/arquivo`, fd);
  }

  desativarTermoModelo(id: number) {
    return this.http.delete<void>(`${this.base}/api/termos/modelos/${id}`);
  }

  getEmpresaTermo(codigo: number) {
    return this.http.get<EmpresaTermo>(`${this.base}/api/termos/empresas/${codigo}`);
  }

  salvarEmpresaTermo(codigo: number, dados: EmpresaTermoDados) {
    return this.http.put<EmpresaTermo>(`${this.base}/api/termos/empresas/${codigo}`, dados);
  }

  gerarTermo(payload: GerarTermoPayload) {
    return this.http.post(`${this.base}/api/termos/gerar`, payload, { responseType: 'blob' });
  }

  getTermosEmitidos(colaborador?: number) {
    const params: Record<string, string> = { limit: '100' };
    if (colaborador != null) params['colaborador'] = String(colaborador);
    return this.http.get<TermoEmitido[]>(`${this.base}/api/termos/emitidos`, { params });
  }

  baixarTermoEmitido(id: number) {
    return this.http.get(`${this.base}/api/termos/emitidos/${id}/download`, { responseType: 'blob' });
  }

  subirTermoAssinado(id: number, arquivo: File) {
    const fd = new FormData();
    fd.append('arquivo', arquivo);
    return this.http.post<void>(`${this.base}/api/termos/emitidos/${id}/assinado`, fd);
  }

  baixarTermoAssinado(id: number) {
    return this.http.get(`${this.base}/api/termos/emitidos/${id}/assinado`, { responseType: 'blob' });
  }
 
}
