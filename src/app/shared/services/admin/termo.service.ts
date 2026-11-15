import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { EmpresaTermoDados, GerarTermoPayload } from '../../../shared/models/admin/termo.models';

@Injectable({ providedIn: 'root' })
export class TermoService {
  private readonly api = inject(ApiService);

  // modelos
  modelos(incluirInativos = false) { return this.api.getTermoModelos(incluirInativos); }
  campos() { return this.api.getTermoCampos(); }
  baixarModelo(id: number) { return this.api.baixarTermoModelo(id); }
  criarModelo(slug: string, nome: string, descricao: string, arquivo: File) {
    return this.api.criarTermoModelo(slug, nome, descricao, arquivo);
  }
  novaVersao(id: number, arquivo: File) { return this.api.substituirTermoModelo(id, arquivo); }
  desativarModelo(id: number) { return this.api.desativarTermoModelo(id); }

  // empresa
  empresa(codigo: number) { return this.api.getEmpresaTermo(codigo); }
  salvarEmpresa(codigo: number, d: EmpresaTermoDados) { return this.api.salvarEmpresaTermo(codigo, d); }

  // geração / histórico
  gerar(p: GerarTermoPayload) { return this.api.gerarTermo(p); }
  emitidos(colaborador?: number) { return this.api.getTermosEmitidos(colaborador); }
  baixarEmitido(id: number) { return this.api.baixarTermoEmitido(id); }
  subirAssinado(id: number, f: File) { return this.api.subirTermoAssinado(id, f); }
  baixarAssinado(id: number) { return this.api.baixarTermoAssinado(id); }

  // apoio (reaproveita o que já existe)
  empresas() { return this.api.getEmpresasDropdown(); }
  colaboradores(busca?: string) { return this.api.getColaboradoresDropdown(busca); }
  buscarEquipamentos(busca: string) {
    return this.api.getEquipamentos({ busca: busca || undefined, ativo: true, skip: 0, limit: 30 });
  }
  equipamentosDoColaborador(id: number) { return this.api.getEquipamentosDoColaborador(id); }
  buscarChips(busca: string, colaborador?: number) {
    return this.api.getChips({ busca: busca || undefined, colaborador, skip: 0, limit: 30 });
  }
}
