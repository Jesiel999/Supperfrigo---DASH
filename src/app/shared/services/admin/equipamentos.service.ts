import { Injectable, signal, computed, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../api.service';
import {
  EquipamentoApiItem,
  EquipamentoPayload,
  ResumoEquipamentos,
  DropdownItem,
} from '../../models/equipamentos.models';

@Injectable({ providedIn: 'root' })
export class EquipamentoService {
  private readonly api = inject(ApiService);

  // ─── Filtros ────────────────────────────────────────────────
  readonly filtroTipo         = signal<number | null>(null);
  readonly filtroEmpresa      = signal<number | null>(null);
  readonly filtroDepartamento = signal<number | null>(null);
  readonly filtroColaborador  = signal<number | null>(null);
  readonly busca              = signal<string>('');
  readonly somenteAtivos      = signal<boolean>(true);

  // ─── Paginação ──────────────────────────────────────────────
  readonly pagina        = signal<number>(0);
  readonly tamanhoPagina = signal<number>(20);

  // ─── Dados da listagem ────────────────────────────────────────
  readonly equipamentos = signal<EquipamentoApiItem[]>([]);
  readonly total        = signal<number>(0);
  readonly carregando   = signal<boolean>(false);

  readonly resumo = signal<ResumoEquipamentos | null>(null);

  // ─── Dropdowns (carregados uma vez ao abrir a tela) ─────────
  readonly tipos         = signal<DropdownItem[]>([]);
  readonly marcas        = signal<DropdownItem[]>([]);
  readonly modelos       = signal<DropdownItem[]>([]);
  readonly departamentos = signal<DropdownItem[]>([]);
  readonly empresas      = signal<DropdownItem[]>([]);
  readonly toners        = signal<DropdownItem[]>([]);

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.tamanhoPagina()))
  );

  readonly temFiltroAtivo = computed(() =>
    this.filtroTipo() !== null ||
    this.filtroEmpresa() !== null ||
    this.filtroDepartamento() !== null ||
    this.filtroColaborador() !== null ||
    !!this.busca()
  );

  // ─── Carregar dados de apoio ─────────────────────────────────
  carregarDropdowns(): void {
    forkJoin({
      tipos: this.api.getTiposEquipamento(),
      marcas: this.api.getMarcas(),
      modelos: this.api.getModelos(),
      departamentos: this.api.getDepartamentos(),
      empresas: this.api.getEmpresasDropdown(),
      toners: this.api.getToners(),
    }).subscribe({
      next: ({ tipos, marcas, modelos, departamentos, empresas, toners }) => {
        this.tipos.set(tipos);
        this.marcas.set(marcas);
        this.modelos.set(modelos);
        this.departamentos.set(departamentos);
        this.empresas.set(empresas);
        this.toners.set(toners);
      },
      error: err => console.error('Erro ao carregar dropdowns de equipamentos:', err),
    });
  }

  carregarResumo(): void {
    this.api.getResumoEquipamentos().subscribe({
      next: r => this.resumo.set(r),
      error: err => console.error('Erro ao carregar resumo de equipamentos:', err),
    });
  }

  carregar(): void {
    this.carregando.set(true);

    this.api.getEquipamentos({
      tipo: this.filtroTipo() ?? undefined,
      empresa: this.filtroEmpresa() ?? undefined,
      departamento: this.filtroDepartamento() ?? undefined,
      colaborador: this.filtroColaborador() ?? undefined,
      busca: this.busca() || undefined,
      ativo: this.somenteAtivos(),
      skip: this.pagina() * this.tamanhoPagina(),
      limit: this.tamanhoPagina(),
    }).subscribe({
      next: res => {
        this.equipamentos.set(res.itens);
        this.total.set(res.total);
        this.carregando.set(false);
      },
      error: err => {
        console.error('Erro ao carregar equipamentos:', err);
        this.carregando.set(false);
      },
    });
  }

  // ─── Actions de filtro (recarregam a lista automaticamente) ──
  setFiltroTipo(v: number | null): void { this.filtroTipo.set(v); this.pagina.set(0); this.carregar(); }
  setFiltroEmpresa(v: number | null): void { this.filtroEmpresa.set(v); this.pagina.set(0); this.carregar(); }
  setFiltroDepartamento(v: number | null): void { this.filtroDepartamento.set(v); this.pagina.set(0); this.carregar(); }
  setFiltroColaborador(v: number | null): void { this.filtroColaborador.set(v); this.pagina.set(0); this.carregar(); }
  setBusca(v: string): void { this.busca.set(v); this.pagina.set(0); this.carregar(); }
  setSomenteAtivos(v: boolean): void { this.somenteAtivos.set(v); this.pagina.set(0); this.carregar(); }

  limparFiltros(): void {
    this.filtroTipo.set(null);
    this.filtroEmpresa.set(null);
    this.filtroDepartamento.set(null);
    this.filtroColaborador.set(null);
    this.busca.set('');
    this.pagina.set(0);
    this.carregar();
  }

  irParaPagina(p: number): void {
    if (p < 0 || p >= this.totalPaginas()) return;
    this.pagina.set(p);
    this.carregar();
  }

  // ─── CRUD (o componente decide o que fazer após o sucesso) ───
  criar(payload: EquipamentoPayload) {
    return this.api.criarEquipamento(payload);
  }

  atualizar(id: number, payload: EquipamentoPayload) {
    return this.api.atualizarEquipamento(id, payload);
  }

  excluir(id: number) {
    return this.api.excluirEquipamento(id);
  }

  vincular(id: number, idColaborador: number, observacao?: string) {
    return this.api.vincularEquipamento(id, idColaborador, observacao);
  }

  devolver(id: number, observacao?: string) {
    return this.api.devolverEquipamento(id, observacao);
  }

  getHistorico(id: number) {
    return this.api.getHistoricoEquipamento(id);
  }

  buscarColaboradores(busca?: string) {
    return this.api.getColaboradoresDropdown(busca);
  }
}