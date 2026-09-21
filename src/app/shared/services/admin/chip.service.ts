import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { ChipApiItem, ChipPayload } from '../../models/cadastros.models';

@Injectable({ providedIn: 'root' })
export class ChipService {
  private readonly api = inject(ApiService);

  readonly filtroEmpresa     = signal<number | null>(null);
  readonly filtroColaborador = signal<number | null>(null);
  readonly busca             = signal<string>('');

  readonly chips      = signal<ChipApiItem[]>([]);
  readonly carregando = signal<boolean>(false);

  carregar(): void {
    this.carregando.set(true);
    this.api.getChips({
      empresa: this.filtroEmpresa() ?? undefined,
      colaborador: this.filtroColaborador() ?? undefined,
      busca: this.busca() || undefined,
    }).subscribe({
      next: chips => { this.chips.set(chips); this.carregando.set(false); },
      error: err => { console.error('Erro ao carregar chips:', err); this.carregando.set(false); },
    });
  }

  setFiltroEmpresa(v: number | null): void { this.filtroEmpresa.set(v); this.carregar(); }
  setFiltroColaborador(v: number | null): void { this.filtroColaborador.set(v); this.carregar(); }
  setBusca(v: string): void { this.busca.set(v); this.carregar(); }

  criar(payload: ChipPayload) { return this.api.criarChip(payload); }
  atualizar(id: number, payload: ChipPayload) { return this.api.atualizarChip(id, payload); }
  excluir(id: number) { return this.api.excluirChip(id); }
  vincular(id: number, idColaborador: number, observacao?: string) { return this.api.vincularChip(id, idColaborador, observacao); }
  devolver(id: number, observacao?: string) { return this.api.devolverChip(id, observacao); }
  getHistorico(id: number) { return this.api.getHistoricoChip(id); }
  buscarColaboradores(busca?: string) { return this.api.getColaboradoresDropdown(busca); }
}
