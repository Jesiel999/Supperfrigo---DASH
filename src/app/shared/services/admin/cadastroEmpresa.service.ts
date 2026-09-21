import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { EmpresaApiItem, EmpresaCreatePayload, EmpresaUpdatePayload } from '../../models/cadastros.models';

@Injectable({ providedIn: 'root' })
export class EmpresaCadastroService {
  private readonly api = inject(ApiService);

  readonly empresas   = signal<EmpresaApiItem[]>([]);
  readonly carregando = signal(false);
  readonly busca      = signal('');

  carregar(): void {
    this.carregando.set(true);
    this.api.listarEmpresasCadastro(this.busca() || undefined).subscribe({
      next: e => { this.empresas.set(e); this.carregando.set(false); },
      error: err => { console.error('Erro ao carregar empresas:', err); this.carregando.set(false); },
    });
  }

  setBusca(v: string): void { this.busca.set(v); this.carregar(); }

  criar(payload: EmpresaCreatePayload) { return this.api.criarEmpresa(payload); }
  atualizar(codigo: number, payload: EmpresaUpdatePayload) { return this.api.atualizarEmpresa(codigo, payload); }
  excluir(codigo: number) { return this.api.excluirEmpresa(codigo); }
}
