import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { EmpresaAutorizada } from '../models/usuario.models';
import { EmpresasService } from './empresas.service';

const STORAGE_KEY = 'ff_empresas_selecionadas';

@Injectable({ providedIn: 'root' })
export class EmpresaFilterService {
  private readonly auth = inject(AuthService);
  private readonly empresasService = inject(EmpresasService);

  private readonly _dosDados = signal<EmpresaAutorizada[]>([]);
  private readonly _selecionadas = signal<Set<number>>(new Set());

  readonly selecionadas = this._selecionadas.asReadonly();

  private _catalogoCarregado = false;
  private _customizado = false;

  readonly autorizadasNoJwt = computed(() => this.auth.empresasAutorizadas());

  readonly semRestricao = computed(() =>
    this.autorizadasNoJwt().length === 0
  );

  readonly empresasVisiveis = computed((): EmpresaAutorizada[] => {
    return this.semRestricao()
      ? this._dosDados()
      : this.autorizadasNoJwt();
  });

  readonly todasSelecionadas = computed(() => {
    const visiveis = this.empresasVisiveis();
    const sel = this._selecionadas();

    return visiveis.length > 0 && sel.size === visiveis.length;
  });

  constructor() {

    /**
     * Salva no LocalStorage somente quando houver login.
     */
    effect(() => {
      if (!this.auth.logado()) return;

      const ids = Array.from(this._selecionadas());

      if (this._customizado) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(ids)
        );
      }
    });

    /**
     * Seleciona todas automaticamente quando o usuário
     * ainda não personalizou o filtro.
     */
    effect(() => {
      if (!this.auth.logado()) return;

      const visiveis = this.empresasVisiveis();

      if (!this._customizado) {
        this._selecionadas.set(
          new Set(visiveis.map(e => e.codigo))
        );
      }
    });

    /**
     * Quando troca de tenant ou realiza login.
     */
    effect(() => {

      if (!this.auth.logado()) {
        this.clear(false);
        return;
      }

      this.auth.tenantAtual();

      this._recarregarDoStorage();
    });

    /**
     * Carrega catálogo apenas uma vez.
     */
    effect(() => {

      if (!this.auth.logado()) {
        this._catalogoCarregado = false;
        return;
      }

      if (
        this.semRestricao() &&
        !this._catalogoCarregado
      ) {
        this._catalogoCarregado = true;

        this.empresasService.listarTodas().subscribe({

          next: (r) => {

            const empresas: EmpresaAutorizada[] = r.empresas.map(e => ({
              codigo: Number(e.codigo_empresa),
              nome: e.nome_empresa
            }));

            this.setDisponiveis(empresas);

          },

          error: err => {
            console.error(err);
            this._catalogoCarregado = false;
          }

        });
      }
    });
  }

  clear(removerStorage = true): void {

    this._catalogoCarregado = false;
    this._customizado = false;

    this._dosDados.set([]);
    this._selecionadas.set(new Set());

    if (removerStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  setDisponiveis(empresas: EmpresaAutorizada[]): void {

    this._dosDados.set(empresas);

    if (!this._customizado) {
      this._selecionadas.set(
        new Set(empresas.map(e => e.codigo))
      );
      return;
    }

    const permitidas = new Set(empresas.map(e => e.codigo));

    this._selecionadas.set(
      new Set(
        [...this._selecionadas()].filter(c => permitidas.has(c))
      )
    );
  }

  estaSelecionada(codigo: number): boolean {
    return this._selecionadas().has(codigo);
  }

  codigosSelecionados(): number[] {

    if (this.todasSelecionadas()) {
      return [];
    }

    return [...this._selecionadas()];
  }

  toggle(codigo: number): void {

    this._customizado = true;

    const nova = new Set(this._selecionadas());

    if (nova.has(codigo)) {
      nova.delete(codigo);
    } else {
      nova.add(codigo);
    }

    this._selecionadas.set(nova);
  }

  toggleTodas(): void {

    this._customizado = true;

    if (this.todasSelecionadas()) {
      this._selecionadas.set(new Set());
      return;
    }

    this._selecionadas.set(
      new Set(
        this.empresasVisiveis().map(e => e.codigo)
      )
    );
  }

  filtrar<T extends { codigo_empresa: number }>(items: T[]): T[] {

    if (this.todasSelecionadas()) {
      return items;
    }

    const sel = this._selecionadas();

    return items.filter(i => sel.has(i.codigo_empresa));
  }

  private _recarregarDoStorage(): void {

    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {

      this._customizado = false;

      this._selecionadas.set(
        new Set(this.empresasVisiveis().map(e => e.codigo))
      );

      return;
    }

    try {

      this._customizado = true;

      this._selecionadas.set(
        new Set(JSON.parse(raw))
      );

    } catch {

      this._customizado = false;

      this._selecionadas.set(new Set());
    }
  }
}