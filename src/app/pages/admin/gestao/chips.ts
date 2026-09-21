import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChipService } from '../../../shared/services/admin/chip.service';
import { EquipamentoService } from '../../../shared/services/admin/equipamentos.service';
import { ChipApiItem, ChipPayload } from '../../../shared/models/cadastros.models';
import { DropdownItem, MovimentacaoItem } from '../../../shared/models/equipamentos.models';

const FORM_VAZIO: ChipPayload = {
  id_empresa: 0,
  id_departamento: null,
  id_colaborador: null,
  numero: null,
  iccid: null,
};

@Component({
  selector: 'app-chips',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Gestão de <span>Chips</span></h1>
          <p class="page-sub">SIM cards e seus vínculos com colaboradores.</p>
        </div>
        <button class="btn-novo" (click)="abrirCriacao()">+ Novo Chip</button>
      </div>

      <div class="card filtros-card">
        <div class="filtros-row">
          <input
            class="input-busca"
            type="text"
            placeholder="Buscar por número..."
            [value]="svc.busca()"
            (input)="svc.setBusca($any($event.target).value)"
          />
          <select class="select-filtro" [value]="svc.filtroEmpresa() ?? ''" (change)="onFiltroEmpresa($any($event.target).value)">
            <option value="">Todas as empresas</option>
            @for (e of equipamentoSvc.empresas(); track e.id) {
              <option [value]="e.id">{{ e.nome }}</option>
            }
          </select>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Chips</h2>
            <p class="card-sub">{{ svc.chips().length }} encontrado(s)</p>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>ICCID</th>
                <th>Empresa</th>
                <th>Colaborador</th>
                <th class="cell-acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              @if (svc.carregando()) {
                <tr><td colspan="5" class="cell-vazio">Carregando...</td></tr>
              } @else if (svc.chips().length === 0) {
                <tr><td colspan="5" class="cell-vazio">Nenhum chip encontrado.</td></tr>
              } @else {
                @for (chip of svc.chips(); track chip.id) {
                  <tr>
                    <td class="cell-nome">{{ chip.numero || '-' }}</td>
                    <td class="cell-data">{{ chip.iccid || '-' }}</td>
                    <td>{{ chip.nome_empresa ?? '-' }}</td>
                    <td>
                      @if (chip.nome_colaborador) {
                        {{ chip.nome_colaborador }}
                      } @else {
                        <span class="sem-colaborador">Sem colaborador</span>
                      }
                    </td>
                    <td class="cell-acoes">
                      <button class="btn-acao" (click)="abrirEdicao(chip)" title="Editar">✏️</button>
                      @if (chip.id_colaborador) {
                        <button class="btn-acao" (click)="devolver(chip)" title="Devolver">↩️</button>
                      } @else {
                        <button class="btn-acao" (click)="abrirVinculo(chip)" title="Vincular">🔗</button>
                      }
                      <button class="btn-acao" (click)="verHistorico(chip)" title="Histórico">🕓</button>
                      <button class="btn-acao btn-excluir" (click)="excluir(chip)" title="Excluir">🗑️</button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de cadastro/edição -->
    @if (formAberto()) {
      <div class="modal-backdrop" (click)="fecharForm()">
        <div class="modal modal-pequeno" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ modoEdicao() ? 'Editar Chip' : 'Novo Chip' }}</h2>
            <button class="close-btn" (click)="fecharForm()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <label class="form-field form-field-full">
                <span>Empresa *</span>
                <select [value]="form().id_empresa || ''" (change)="setCampo('id_empresa', +$any($event.target).value)">
                  <option value="">Selecione...</option>
                  @for (e of equipamentoSvc.empresas(); track e.id) {
                    <option [value]="e.id">{{ e.nome }}</option>
                  }
                </select>
              </label>
              <label class="form-field">
                <span>Número</span>
                <input type="text" [value]="form().numero ?? ''" (input)="setCampo('numero', $any($event.target).value)" />
              </label>
              <label class="form-field">
                <span>ICCID</span>
                <input type="text" [value]="form().iccid ?? ''" (input)="setCampo('iccid', $any($event.target).value)" />
              </label>
              <label class="form-field form-field-full">
                <span>Departamento</span>
                <select [value]="form().id_departamento || ''" (change)="setCampo('id_departamento', toNumOuNull($any($event.target).value))">
                  <option value="">-</option>
                  @for (d of equipamentoSvc.departamentos(); track d.id) {
                    <option [value]="d.id">{{ d.nome }}</option>
                  }
                </select>
              </label>
            </div>
            @if (erroForm()) { <p class="erro-form">{{ erroForm() }}</p> }
          </div>
          <div class="modal-footer">
            <button class="btn-secundario" (click)="fecharForm()">Cancelar</button>
            <button class="btn-primario" (click)="salvarForm()" [disabled]="salvando()">
              {{ salvando() ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal de vínculo -->
    @if (vinculoAberto(); as chip) {
      <div class="modal-backdrop" (click)="fecharVinculo()">
        <div class="modal modal-pequeno" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Vincular chip "{{ chip.numero }}"</h2>
            <button class="close-btn" (click)="fecharVinculo()">✕</button>
          </div>
          <div class="modal-body">
            <label class="form-field form-field-full">
              <span>Buscar colaborador</span>
              <input type="text" placeholder="Digite o nome..." [value]="buscaColaborador()" (input)="onBuscarColaborador($any($event.target).value)" />
            </label>
            <div class="lista-colaboradores">
              @for (c of resultadoColaboradores(); track c.id) {
                <button class="item-colaborador" [class.selecionado]="colaboradorSelecionado()?.id === c.id" (click)="colaboradorSelecionado.set(c)">
                  {{ c.nome }}
                </button>
              }
              @if (buscaColaborador() && resultadoColaboradores().length === 0) {
                <p class="sem-resultado">Nenhum colaborador encontrado.</p>
              }
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secundario" (click)="fecharVinculo()">Cancelar</button>
            <button class="btn-primario" [disabled]="!colaboradorSelecionado()" (click)="confirmarVinculo(chip)">Vincular</button>
          </div>
        </div>
      </div>
    }

    <!-- Modal de histórico -->
    @if (historicoAberto(); as chip) {
      <div class="modal-backdrop" (click)="fecharHistorico()">
        <div class="modal modal-pequeno" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Histórico — {{ chip.numero }}</h2>
            <button class="close-btn" (click)="fecharHistorico()">✕</button>
          </div>
          <div class="modal-body">
            @if (historico().length === 0) {
              <p class="sem-resultado">Nenhuma movimentação registrada.</p>
            } @else {
              <div class="lista-historico">
                @for (m of historico(); track m.id) {
                  <div class="item-historico">
                    <div class="item-historico-nome">{{ m.nome_colaborador ?? ('Colaborador #' + m.id_colaborador) }}</div>
                    <div class="item-historico-datas">
                      Vínculo: {{ m.data_vinculo | date: 'dd/MM/yyyy HH:mm' }}
                      @if (m.data_devolucao) { · Devolvido: {{ m.data_devolucao | date: 'dd/MM/yyyy HH:mm' }} }
                      @else { · <span class="em-aberto">em aberto</span> }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-secundario" (click)="fecharHistorico()">Fechar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 24px; padding: 20px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .page-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; margin: 0; }
    .page-title span { background: linear-gradient(90deg, #38BDF8, #38BDF8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .page-sub { color: var(--muted); font-size: 13px; margin-top: 5px; }
    .btn-novo { background: #38BDF8; color: #0b1220; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 600; cursor: pointer; }
    .btn-novo:hover { background: #0ea5e9; }

    .card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 22px; }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .card-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; margin: 0; }
    .card-sub { font-size: 11.5px; color: var(--muted); margin: 0; }

    .filtros-card { padding: 16px 22px; }
    .filtros-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .input-busca, .select-filtro { background: rgba(255,255,255,.06); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 12.5px; padding: 8px 12px; outline: none; }
    .input-busca { flex: 1; min-width: 220px; }
    .select-filtro { min-width: 160px; cursor: pointer; }
    option { background-color: #141922;  }

    .table-wrapper { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .data-table thead { background: rgba(255,255,255,.04); border-bottom: 1px solid var(--border); }
    .data-table th { padding: 12px; text-align: left; font-weight: 600; color: var(--muted); text-transform: uppercase; font-size: 10px; letter-spacing: .5px; }
    .data-table tbody tr { border-bottom: 1px solid var(--border); }
    .data-table tbody tr:hover { background: rgba(255,255,255,.04); }
    .data-table td { padding: 12px; color: var(--text); }
    .cell-nome { font-weight: 500; }
    .cell-data { color: var(--muted); }
    .cell-vazio { text-align: center; color: var(--muted); padding: 30px 0; }
    .cell-acoes { white-space: nowrap; }
    .sem-colaborador { color: var(--muted); font-style: italic; }

    .btn-acao { background: rgba(255,255,255,.06); border: 1px solid var(--border); border-radius: 6px; width: 28px; height: 28px; margin-right: 4px; cursor: pointer; font-size: 12px; }
    .btn-acao:hover { background: rgba(255,255,255,.14); }
    .btn-excluir:hover { background: rgba(244,63,94,.2); border-color: #f43f5e; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.65); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 9999; }
    .modal { width: 480px; max-width: 95vw; max-height: 88vh; overflow: hidden; background: #141922; border: 1px solid rgba(255,255,255,.08); border-radius: 20px; display: flex; flex-direction: column; }
    .modal-header { padding: 22px 26px; border-bottom: 1px solid rgba(255,255,255,.06); display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { font-size: 18px; font-family: 'Syne'; margin: 0; }
    .close-btn { width: 34px; height: 34px; border-radius: 50%; border: none; background: rgba(255,255,255,.06); color: white; cursor: pointer; }
    .close-btn:hover { background: #f43f5e; }
    .modal-body { padding: 22px 26px; overflow-y: auto; flex: 1; }
    .modal-footer { padding: 18px 26px; border-top: 1px solid rgba(255,255,255,.06); display: flex; justify-content: flex-end; gap: 10px; }
    .btn-primario { background: #38BDF8; color: #0b1220; border: none; padding: 9px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primario:disabled { opacity: .5; cursor: not-allowed; }
    .btn-secundario { background: transparent; border: 1px solid var(--border); color: var(--text); padding: 9px 20px; border-radius: 8px; cursor: pointer; }

    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
    .form-field { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: var(--muted); }
    .form-field input, .form-field select { background: rgba(255,255,255,.06); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 13px; padding: 8px 10px; outline: none; }
    .form-field-full { grid-column: 1 / -1; }
    .erro-form { color: #f43f5e; font-size: 12.5px; margin-top: 10px; }

    .lista-colaboradores { max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; margin-top: 10px; }
    .item-colaborador { text-align: left; background: rgba(255,255,255,.04); border: 1px solid transparent; border-radius: 8px; padding: 8px 12px; cursor: pointer; color: var(--text); font-size: 13px; }
    .item-colaborador:hover { background: rgba(255,255,255,.08); }
    .item-colaborador.selecionado { border-color: #38BDF8; background: rgba(56,189,248,.12); }
    .sem-resultado { color: var(--muted); font-size: 12.5px; margin-top: 10px; }

    .lista-historico { display: flex; flex-direction: column; gap: 12px; }
    .item-historico { border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
    .item-historico-nome { font-weight: 600; font-size: 13px; }
    .item-historico-datas { font-size: 11.5px; color: var(--muted); margin-top: 4px; }
    .em-aberto { color: #34d399; font-weight: 500; }
  `],
})
export class ChipComponent implements OnInit {
  protected readonly svc = inject(ChipService);
  protected readonly equipamentoSvc = inject(EquipamentoService); // reaproveita dropdowns já carregados (empresas/departamentos)

  protected readonly formAberto = signal(false);
  protected readonly modoEdicao = signal(false);
  protected readonly form       = signal<ChipPayload>({ ...FORM_VAZIO });
  protected readonly erroForm   = signal<string | null>(null);
  protected readonly salvando   = signal(false);
  private chipEmEdicaoId: number | null = null;

  protected readonly vinculoAberto          = signal<ChipApiItem | null>(null);
  protected readonly buscaColaborador       = signal('');
  protected readonly resultadoColaboradores = signal<DropdownItem[]>([]);
  protected readonly colaboradorSelecionado = signal<DropdownItem | null>(null);
  private debounceBusca?: ReturnType<typeof setTimeout>;

  protected readonly historicoAberto = signal<ChipApiItem | null>(null);
  protected readonly historico       = signal<MovimentacaoItem[]>([]);

  ngOnInit(): void {
    // Se a tela de Equipamentos ainda não rodou nesta sessão, garante os dropdowns.
    if (this.equipamentoSvc.empresas().length === 0) {
      this.equipamentoSvc.carregarDropdowns();
    }
    this.svc.carregar();
  }

  onFiltroEmpresa(v: string): void { this.svc.setFiltroEmpresa(v ? +v : null); }

  setCampo<K extends keyof ChipPayload>(campo: K, valor: ChipPayload[K]): void {
    this.form.set({ ...this.form(), [campo]: valor });
  }
  toNumOuNull(v: string): number | null { return v === '' ? null : +v; }

  abrirCriacao(): void {
    this.modoEdicao.set(false);
    this.chipEmEdicaoId = null;
    this.form.set({ ...FORM_VAZIO });
    this.erroForm.set(null);
    this.formAberto.set(true);
  }

  abrirEdicao(chip: ChipApiItem): void {
    this.modoEdicao.set(true);
    this.chipEmEdicaoId = chip.id;
    this.form.set({
      id_empresa: chip.id_empresa,
      id_departamento: chip.id_departamento ?? null,
      id_colaborador: chip.id_colaborador ?? null,
      numero: chip.numero ?? null,
      iccid: chip.iccid ?? null,
    });
    this.erroForm.set(null);
    this.formAberto.set(true);
  }

  fecharForm(): void { this.formAberto.set(false); }

  salvarForm(): void {
    const dados = this.form();
    if (!dados.id_empresa) { this.erroForm.set('Selecione a empresa.'); return; }

    this.erroForm.set(null);
    this.salvando.set(true);

    const request$ = this.modoEdicao() && this.chipEmEdicaoId
      ? this.svc.atualizar(this.chipEmEdicaoId, dados)
      : this.svc.criar(dados);

    request$.subscribe({
      next: () => { this.salvando.set(false); this.formAberto.set(false); this.svc.carregar(); },
      error: err => {
        console.error('Erro ao salvar chip:', err);
        this.erroForm.set('Não foi possível salvar. Tente novamente.');
        this.salvando.set(false);
      },
    });
  }

  excluir(chip: ChipApiItem): void {
    if (!confirm(`Excluir o chip "${chip.numero}"?`)) return;
    this.svc.excluir(chip.id).subscribe({
      next: () => this.svc.carregar(),
      error: err => console.error('Erro ao excluir chip:', err),
    });
  }

  abrirVinculo(chip: ChipApiItem): void {
    this.buscaColaborador.set('');
    this.resultadoColaboradores.set([]);
    this.colaboradorSelecionado.set(null);
    this.vinculoAberto.set(chip);
  }
  fecharVinculo(): void { this.vinculoAberto.set(null); }

  onBuscarColaborador(v: string): void {
    this.buscaColaborador.set(v);
    this.colaboradorSelecionado.set(null);
    clearTimeout(this.debounceBusca);

    if (!v.trim()) {
      this.resultadoColaboradores.set([]);
      return;
    }

    this.debounceBusca = setTimeout(() => {
      this.svc.buscarColaboradores(v).subscribe({
        next: r => this.resultadoColaboradores.set(r),
        error: err => {
          console.error('Erro ao buscar colaboradores:', err);
          this.resultadoColaboradores.set([]);
        },
      });
    }, 300);
  }

  confirmarVinculo(chip: ChipApiItem): void {
    const colaborador = this.colaboradorSelecionado();
    if (!colaborador) return;
    this.svc.vincular(chip.id, colaborador.id).subscribe({
      next: () => { this.fecharVinculo(); this.svc.carregar(); },
      error: err => console.error('Erro ao vincular chip:', err),
    });
  }

  devolver(chip: ChipApiItem): void {
    if (!confirm(`Registrar devolução do chip "${chip.numero}"?`)) return;
    this.svc.devolver(chip.id).subscribe({
      next: () => this.svc.carregar(),
      error: err => console.error('Erro ao devolver chip:', err),
    });
  }

  verHistorico(chip: ChipApiItem): void {
    this.historico.set([]);
    this.historicoAberto.set(chip);
    this.svc.getHistorico(chip.id).subscribe({
      next: h => this.historico.set(h),
      error: err => console.error('Erro ao buscar histórico:', err),
    });
  }
  fecharHistorico(): void { this.historicoAberto.set(null); }
}
