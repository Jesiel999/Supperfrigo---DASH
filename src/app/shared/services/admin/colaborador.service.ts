import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from '../api.service';
import {
  PessoaApiItem,
  PessoaPayload,
} from '../../models/cadastros.models';

@Injectable({ providedIn: 'root' })
export class ColaboradorService {

  private readonly api = inject(ApiService);

  readonly busca = signal('');
  readonly pagina = signal(0);
  readonly tamanhoPagina = signal(20);

  readonly colaboradores = signal<PessoaApiItem[]>([]);
  readonly total = signal(0);
  readonly carregando = signal(false);

  readonly totalPaginas = computed(() =>
    Math.max(
      1,
      Math.ceil(this.total() / this.tamanhoPagina())
    )
  );

  carregar(): void {
    this.carregando.set(true);

    this.api.listarPessoas({
      busca: this.busca() || undefined,
      colaborador: true,
      skip: this.pagina() * this.tamanhoPagina(),
      limit: this.tamanhoPagina(),
    }).subscribe({
      next: res => {
        this.colaboradores.set(res.itens);
        this.total.set(res.total);
        this.carregando.set(false);
      },

      error: (err: unknown) => {
        console.error('Erro ao carregar colaboradores:', err);
        this.carregando.set(false);
      },
    });
  }

  setBusca(v: string): void {
    this.busca.set(v);
    this.pagina.set(0);
    this.carregar();
  }

  irParaPagina(p: number): void {
    if (p < 0 || p >= this.totalPaginas()) {
      return;
    }

    this.pagina.set(p);
    this.carregar();
  }

  /**
   * Marca uma pessoa existente como colaborador.
   */
  criar(cpf_cnpj: string) {
    return this.api.tornarColaborador(cpf_cnpj);
  }

  /**
   * Remove a pessoa da condição de colaborador.
   *
   * ATENÇÃO:
   * O ApiService atual usa excluirPessoa(), que provavelmente
   * exclui a pessoa inteira, e não apenas colaborador = false.
   *
   * Por isso não usamos este método para o botão "excluir"
   * até confirmar o comportamento do backend.
   */
  excluir(id: number) {
    return this.api.excluirPessoa(id);
  }
}
