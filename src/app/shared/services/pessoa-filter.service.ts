// shared/services/pessoa-filter.service.ts
// Filtro global de Pessoa BI (mesma ideia do EmpresaFilterService): a seleção vale para DRE e FCP.
// Seleção vazia = todas as pessoas (sem filtro).
import { Injectable, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from './api.service';
import { OpcaoPessoa } from '../components/pessoa-filter/pessoa-filter';

@Injectable({ providedIn: 'root' })
export class PessoaFilterService {
  private readonly api = inject(ApiService);

  readonly opcoes = signal<OpcaoPessoa[]>([]);
  readonly selecionadas = signal<ReadonlySet<string>>(new Set());
  readonly carregandoOpcoes = signal<boolean>(false);

  /** Ids selecionados em CSV para a API ('' = sem filtro). */
  readonly csv = computed(() => [...this.selecionadas()].join(','));

  private _sub?: Subscription;

  /** Pessoas com títulos no período (alimenta o dropdown). */
  carregarOpcoes(inicio: string, fim: string): void {
    this._sub?.unsubscribe();
    this.carregandoOpcoes.set(true);
    this._sub = this.api.getPessoasFiltro(inicio, fim).subscribe({
      next: res => {
        this.opcoes.set(res.data ?? []);
        this.carregandoOpcoes.set(false);
      },
      error: err => {
        console.error('Erro ao carregar pessoas:', err);
        this.opcoes.set([]);
        this.carregandoOpcoes.set(false);
      },
    });
  }

  toggle(id: string): void {
    const nova = new Set(this.selecionadas());
    nova.has(id) ? nova.delete(id) : nova.add(id);
    this.selecionadas.set(nova);
  }

  /** "Todos" = limpa a seleção. */
  limpar(): void {
    this.selecionadas.set(new Set());
  }
}