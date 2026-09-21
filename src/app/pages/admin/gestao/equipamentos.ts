import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquipamentoService } from '../../../shared/services/admin/equipamentos.service';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card';
import {
  EquipamentoApiItem,
  EquipamentoPayload,
  DropdownItem,
  MovimentacaoItem,
} from '../../../shared/models/equipamentos.models';

const FORM_VAZIO: EquipamentoPayload = {
  nome: '',
  id_empresa: 0,
  id_tipo: 0,
  id_departamento: null,
  id_marca: null,
  id_modelo: null,
  id_toner: null,
  id_monitor: null,
  id_colaborador: null,
  senha: null,
  scanner: false,
  data_fabricacao: null,
  serie: null,
  processador: null,
  memoria_ram: null,
  armazenamento: null,
  tamanho: null,
  so: null,
  ip: null,
  mac: null,
  observacao: null,
};

@Component({
  selector: 'app-equipamentos',
  standalone: true,
  imports: [CommonModule, KpiCardComponent],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Gestão de <span>Equipamentos</span></h1>
          <p class="page-sub">Notebooks, impressoras, celulares, chips e seus vínculos com colaboradores.</p>
        </div>
        <button class="btn-novo" (click)="abrirCriacao()">+ Novo Equipamento</button>
      </div>

      <!-- KPIs -->
      @if (svc.resumo(); as r) {
        <div class="kpi-grid">
          <app-kpi-card label="Total de Ativos" icon="💻" variant="info" [value]="r.total" valueColor="#38BDF8" [isCurrency]="false" [showDelta]="false"/>
          <app-kpi-card label="Em Uso" icon="✅" variant="success" [value]="r.ativos - r.sem_colaborador" valueColor="#34D399" [isCurrency]="false" [showDelta]="false" />
          <app-kpi-card label="Disponíveis" icon="📦" variant="danger" [value]="r.sem_colaborador" valueColor="#fb923c" [isCurrency]="false" [showDelta]="false" />
          <app-kpi-card label="Inativos" icon="🗑️" variant="info" [value]="r.inativos" valueColor="#9ca3af" [isCurrency]="false" [showDelta]="false"/>
        </div>
      }

      <!-- Filtros -->
      <div class="card filtros-card">
        <div class="filtros-row">
          <input
            class="input-busca"
            type="text"
            placeholder="Buscar por nome, série, MAC ou colaborador..."
            [value]="svc.busca()"
            (input)="svc.setBusca($any($event.target).value)"
          />

          <select class="select-filtro" [value]="svc.filtroTipo() ?? ''" (change)="onFiltroTipo($any($event.target).value)">
            <option value="">Todos os tipos</option>
            @for (t of svc.tipos(); track t.id) {
              <option [value]="t.id">{{ t.nome }}</option>
            }
          </select>

          <select class="select-filtro" [value]="svc.filtroEmpresa() ?? ''" (change)="onFiltroEmpresa($any($event.target).value)">
            <option value="">Todas as empresas</option>
            @for (e of svc.empresas(); track e.id) {
              <option [value]="e.id">{{ e.nome }}</option>
            }
          </select>

          <select class="select-filtro" [value]="svc.filtroDepartamento() ?? ''" (change)="onFiltroDepartamento($any($event.target).value)">
            <option value="">Todos os departamentos</option>
            @for (d of svc.departamentos(); track d.id) {
              <option [value]="d.id">{{ d.nome }}</option>
            }
          </select>

          <label class="check-ativos">
            <input type="checkbox" [checked]="svc.somenteAtivos()" (change)="svc.setSomenteAtivos($any($event.target).checked)" />
            Somente ativos
          </label>

          @if (svc.temFiltroAtivo()) {
            <button class="btn-limpar" (click)="svc.limparFiltros()">Limpar filtros</button>
          }
        </div>
      </div>

      <!-- Tabela -->
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Equipamentos</h2>
            <p class="card-sub">{{ svc.total() }} encontrado(s)</p>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Empresa</th>
                <th>Marca / Modelo</th>
                <th>Série / MAC</th>
                <th>Colaborador</th>
                <th>Status</th>
                <th class="cell-acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              @if (svc.carregando()) {
                <tr><td colspan="8" class="cell-vazio">Carregando...</td></tr>
              } @else if (svc.equipamentos().length === 0) {
                <tr><td colspan="8" class="cell-vazio">Nenhum equipamento encontrado.</td></tr>
              } @else {
                @for (eq of svc.equipamentos(); track eq.id) {
                  <tr [class.inativo]="!eq.ativo">
                    <td class="cell-nome">{{ eq.nome }}</td>
                    <td>{{ eq.nome_tipo ?? '-' }}</td>
                    <td>{{ eq.nome_empresa ?? '-' }}</td>
                    <td>{{ eq.nome_marca ?? '-' }} @if (eq.nome_modelo) { / {{ eq.nome_modelo }} }</td>
                    <td class="cell-data">{{ eq.serie || eq.mac || '-' }}</td>
                    <td>
                      @if (eq.nome_colaborador) {
                        {{ eq.nome_colaborador }}
                      } @else {
                        <span class="sem-colaborador">Sem colaborador</span>
                      }
                    </td>
                    <td>
                      @if (eq.ativo) {
                        <span class="status-ativo">Ativo</span>
                      } @else {
                        <span class="status-inativo">Inativo</span>
                      }
                    </td>
                    <td class="cell-acoes">
                      <button class="btn-acao" (click)="abrirEdicao(eq)" title="Editar">✏️</button>
                      @if (eq.id_colaborador) {
                        <button class="btn-acao" (click)="devolver(eq)" title="Devolver">↩️</button>
                      } @else {
                        <button class="btn-acao" (click)="abrirVinculo(eq)" title="Vincular">🔗</button>
                      }
                      <button class="btn-acao" (click)="verHistorico(eq)" title="Histórico">🕓</button>
                      @if (eq.ativo) {
                        <button class="btn-acao btn-excluir" (click)="excluir(eq)" title="Excluir">🗑️</button>
                      }
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Paginação -->
        @if (svc.totalPaginas() > 1) {
          <div class="paginacao">
            <button class="btn-pag" [disabled]="svc.pagina() === 0" (click)="svc.irParaPagina(svc.pagina() - 1)">← Anterior</button>
            <span>Página {{ svc.pagina() + 1 }} de {{ svc.totalPaginas() }}</span>
            <button class="btn-pag" [disabled]="svc.pagina() + 1 >= svc.totalPaginas()" (click)="svc.irParaPagina(svc.pagina() + 1)">Próxima →</button>
          </div>
        }
      </div>
    </div>

    <!-- Modal de cadastro/edição -->
    @if (formAberto()) {
      <div class="modal-backdrop" (click)="fecharForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ modoEdicao() ? 'Editar Equipamento' : 'Novo Equipamento' }}</h2>
            <button class="close-btn" (click)="fecharForm()">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <label class="form-field">
                <span>Nome *</span>
                <input type="text" [value]="form().nome" (input)="setCampo('nome', $any($event.target).value)" />
              </label>

              <label class="form-field">
                <span>Tipo *</span>
                <select [value]="form().id_tipo || ''" (change)="setCampo('id_tipo', +$any($event.target).value)">
                  <option value="">Selecione...</option>
                  @for (t of svc.tipos(); track t.id) {
                    <option [value]="t.id">{{ t.nome }}</option>
                  }
                </select>
              </label>

              <label class="form-field">
                <span>Empresa *</span>
                <select [value]="form().id_empresa || ''" (change)="setCampo('id_empresa', +$any($event.target).value)">
                  <option value="">Selecione...</option>
                  @for (e of svc.empresas(); track e.id) {
                    <option [value]="e.id">{{ e.nome }}</option>
                  }
                </select>
              </label>

              <label class="form-field">
                <span>Departamento</span>
                <select [value]="form().id_departamento || ''" (change)="setCampo('id_departamento', toNumOuNull($any($event.target).value))">
                  <option value="">-</option>
                  @for (d of svc.departamentos(); track d.id) {
                    <option [value]="d.id">{{ d.nome }}</option>
                  }
                </select>
              </label>

              <label class="form-field">
                <span>Marca</span>
                <select [value]="form().id_marca || ''" (change)="setCampo('id_marca', toNumOuNull($any($event.target).value))">
                  <option value="">-</option>
                  @for (m of svc.marcas(); track m.id) {
                    <option [value]="m.id">{{ m.nome }}</option>
                  }
                </select>
              </label>

              <label class="form-field">
                <span>Modelo</span>
                <select [value]="form().id_modelo || ''" (change)="setCampo('id_modelo', toNumOuNull($any($event.target).value))">
                  <option value="">-</option>
                  @for (m of svc.modelos(); track m.id) {
                    <option [value]="m.id">{{ m.nome }}</option>
                  }
                </select>
              </label>

              <label class="form-field">
                <span>Série</span>
                <input type="text" [value]="form().serie ?? ''" (input)="setCampo('serie', $any($event.target).value)" />
              </label>

              <label class="form-field">
                <span>MAC</span>
                <input type="text" [value]="form().mac ?? ''" (input)="setCampo('mac', $any($event.target).value)" />
              </label>

              <label class="form-field">
                <span>IP</span>
                <input type="text" [value]="form().ip ?? ''" (input)="setCampo('ip', $any($event.target).value)" />
              </label>

              <label class="form-field">
                <span>Processador</span>
                <input type="text" [value]="form().processador ?? ''" (input)="setCampo('processador', $any($event.target).value)" />
              </label>

              <label class="form-field">
                <span>Memória RAM</span>
                <input type="text" [value]="form().memoria_ram ?? ''" (input)="setCampo('memoria_ram', $any($event.target).value)" />
              </label>

              <label class="form-field">
                <span>Armazenamento</span>
                <input type="text" [value]="form().armazenamento ?? ''" (input)="setCampo('armazenamento', $any($event.target).value)" />
              </label>

              <label class="form-field">
                <span>Sistema Operacional</span>
                <input type="text" [value]="form().so ?? ''" (input)="setCampo('so', $any($event.target).value)" />
              </label>

              <label class="form-field">
                <span>Toner (impressoras)</span>
                <select [value]="form().id_toner || ''" (change)="setCampo('id_toner', toNumOuNull($any($event.target).value))">
                  <option value="">-</option>
                  @for (t of svc.toners(); track t.id) {
                    <option [value]="t.id">{{ t.nome }}</option>
                  }
                </select>
              </label>

              <label class="form-field checkbox-field">
                <input type="checkbox" [checked]="form().scanner" (change)="setCampo('scanner', $any($event.target).checked)" />
                <span>Possui scanner</span>
              </label>

              <label class="form-field form-field-full">
                <span>Observação</span>
                <textarea rows="3" [value]="form().observacao ?? ''" (input)="setCampo('observacao', $any($event.target).value)"></textarea>
              </label>
            </div>

            @if (erroForm()) {
              <p class="erro-form">{{ erroForm() }}</p>
            }
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
    @if (vinculoAberto(); as eq) {
      <div class="modal-backdrop" (click)="fecharVinculo()">
        <div class="modal modal-pequeno" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Vincular "{{ eq.nome }}"</h2>
            <button class="close-btn" (click)="fecharVinculo()">✕</button>
          </div>

          <div class="modal-body">
            <label class="form-field form-field-full">
              <span>Buscar colaborador</span>
              <input
                type="text"
                placeholder="Digite o nome..."
                [value]="buscaColaborador()"
                (input)="onBuscarColaborador($any($event.target).value)"
              />
            </label>

            <div class="lista-colaboradores">
              @for (c of resultadoColaboradores(); track c.id) {
                <button
                  class="item-colaborador"
                  [class.selecionado]="colaboradorSelecionado()?.id === c.id"
                  (click)="colaboradorSelecionado.set(c)"
                >
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
            <button class="btn-primario" [disabled]="!colaboradorSelecionado()" (click)="confirmarVinculo(eq)">
              Vincular
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal de histórico -->
    @if (historicoAberto(); as eq) {
      <div class="modal-backdrop" (click)="fecharHistorico()">
        <div class="modal modal-pequeno" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Histórico — {{ eq.nome }}</h2>
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
                      @if (m.data_devolucao) {
                        · Devolvido: {{ m.data_devolucao | date: 'dd/MM/yyyy HH:mm' }}
                      } @else {
                        · <span class="em-aberto">em aberto</span>
                      }
                    </div>
                    @if (m.observacao) {
                      <div class="item-historico-obs">{{ m.observacao }}</div>
                    }
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

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 12px;
    }
    .page-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; margin: 0; }
    .page-title span { background: linear-gradient(90deg, #38BDF8, #38BDF8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .page-sub { color: var(--muted); font-size: 13px; margin-top: 5px; }

    .btn-novo {
      background: #38BDF8; color: #0b1220; border: none; padding: 10px 18px;
      border-radius: 10px; font-weight: 600; cursor: pointer; transition: .2s;
    }
    .btn-novo:hover { background: #0ea5e9; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    @media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .kpi-grid { grid-template-columns: 1fr; } }

    .card {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 14px; padding: 22px;
    }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .card-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; margin: 0; }
    .card-sub { font-size: 11.5px; color: var(--muted); margin: 0; }

    .filtros-card { padding: 16px 22px; }
    .filtros-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }

    .input-busca, .select-filtro {
      background: rgba(255,255,255,.06); border: 1px solid var(--border);
      border-radius: 8px; color: var(--text); font-size: 12.5px;
      font-family: 'Outfit', sans-serif; padding: 8px 12px; outline: none;
    }
    .input-busca { flex: 1; min-width: 220px; }
    .select-filtro { min-width: 160px; cursor: pointer; }
    
    option { background-color: #141922;  }

    .check-ativos { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--muted); cursor: pointer; }

    .btn-limpar {
      background: transparent; border: 1px solid var(--border); color: var(--muted);
      border-radius: 8px; padding: 8px 12px; font-size: 12px; cursor: pointer;
    }
    .btn-limpar:hover { color: var(--text); border-color: var(--text); }

    .table-wrapper { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .data-table thead { background: rgba(255,255,255,.04); border-bottom: 1px solid var(--border); }
    .data-table th { padding: 12px; text-align: left; font-weight: 600; color: var(--muted); text-transform: uppercase; font-size: 10px; letter-spacing: .5px; }
    .data-table tbody tr { border-bottom: 1px solid var(--border); transition: background .2s; }
    .data-table tbody tr:hover { background: rgba(255,255,255,.04); }
    .data-table tbody tr.inativo { opacity: .5; }
    .data-table td { padding: 12px; color: var(--text); }
    .cell-nome { font-weight: 500; }
    .cell-data { color: var(--muted); }
    .cell-vazio { text-align: center; color: var(--muted); padding: 30px 0; }
    .cell-acoes { white-space: nowrap; }

    .sem-colaborador { color: var(--muted); font-style: italic; }

    .status-ativo { background: rgba(52,211,153,.2); color: #34d399; padding: 4px 8px; border-radius: 4px; font-weight: 500; font-size: 10px; }
    .status-inativo { background: rgba(100,116,139,.2); color: #cbd5e1; padding: 4px 8px; border-radius: 4px; font-weight: 500; font-size: 10px; }

    .btn-acao {
      background: rgba(255,255,255,.06); border: 1px solid var(--border);
      border-radius: 6px; width: 28px; height: 28px; margin-right: 4px;
      cursor: pointer; font-size: 12px; transition: .2s;
    }
    .btn-acao:hover { background: rgba(255,255,255,.14); }
    .btn-excluir:hover { background: rgba(244,63,94,.2); border-color: #f43f5e; }

    .paginacao { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 16px; font-size: 12.5px; color: var(--muted); }
    .btn-pag { background: rgba(255,255,255,.06); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 6px 12px; cursor: pointer; font-size: 12px; }
    .btn-pag:disabled { opacity: .4; cursor: not-allowed; }

    /* Modais */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,.65); backdrop-filter: blur(8px);
      display: flex; justify-content: center; align-items: center; z-index: 9999;
    }
    .modal {
      width: 720px; max-width: 95vw; max-height: 88vh; overflow: hidden;
      background: #141922; border: 1px solid rgba(255,255,255,.08); border-radius: 20px;
      display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,.55);
    }
    .modal-pequeno { width: 480px; }

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
    .form-field input, .form-field select, .form-field textarea {
      background: rgba(255,255,255,.06); border: 1px solid var(--border); border-radius: 8px;
      color: var(--text); font-size: 13px; padding: 8px 10px; outline: none; font-family: 'Outfit', sans-serif;
    }
    .form-field-full { grid-column: 1 / -1; }
    .checkbox-field { flex-direction: row; align-items: center; gap: 8px; }

    .erro-form { color: #f43f5e; font-size: 12.5px; margin-top: 10px; }

    .lista-colaboradores { max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; margin-top: 10px; }
    .item-colaborador {
      text-align: left; background: rgba(255,255,255,.04); border: 1px solid transparent;
      border-radius: 8px; padding: 8px 12px; cursor: pointer; color: var(--text); font-size: 13px;
    }
    .item-colaborador:hover { background: rgba(255,255,255,.08); }
    .item-colaborador.selecionado { border-color: #38BDF8; background: rgba(56,189,248,.12); }
    .sem-resultado { color: var(--muted); font-size: 12.5px; margin-top: 10px; }

    .lista-historico { display: flex; flex-direction: column; gap: 12px; }
    .item-historico { border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
    .item-historico-nome { font-weight: 600; font-size: 13px; }
    .item-historico-datas { font-size: 11.5px; color: var(--muted); margin-top: 4px; }
    .em-aberto { color: #34d399; font-weight: 500; }
    .item-historico-obs { font-size: 12px; color: var(--text); margin-top: 6px; opacity: .8; }
  `],
})
export class AdminAtivosComponent implements OnInit {
  protected readonly svc = inject(EquipamentoService);

  // ─── Form de criação/edição ──────────────────────────────────
  protected readonly formAberto  = signal(false);
  protected readonly modoEdicao  = signal(false);
  protected readonly form        = signal<EquipamentoPayload>({ ...FORM_VAZIO });
  protected readonly erroForm    = signal<string | null>(null);
  protected readonly salvando    = signal(false);
  private equipamentoEmEdicaoId: number | null = null;

  // ─── Modal de vínculo ─────────────────────────────────────────
  protected readonly vinculoAberto           = signal<EquipamentoApiItem | null>(null);
  protected readonly buscaColaborador        = signal('');
  protected readonly resultadoColaboradores  = signal<DropdownItem[]>([]);
  protected readonly colaboradorSelecionado  = signal<DropdownItem | null>(null);
  private debounceBusca?: ReturnType<typeof setTimeout>;

  // ─── Modal de histórico ───────────────────────────────────────
  protected readonly historicoAberto = signal<EquipamentoApiItem | null>(null);
  protected readonly historico       = signal<MovimentacaoItem[]>([]);

  ngOnInit(): void {
    this.svc.carregarDropdowns();
    this.svc.carregarResumo();
    this.svc.carregar();
  }

  // ─── Filtros ────────────────────────────────────────────────
  onFiltroTipo(v: string): void { this.svc.setFiltroTipo(v ? +v : null); }
  onFiltroEmpresa(v: string): void { this.svc.setFiltroEmpresa(v ? +v : null); }
  onFiltroDepartamento(v: string): void { this.svc.setFiltroDepartamento(v ? +v : null); }

  // ─── Form ───────────────────────────────────────────────────
  setCampo<K extends keyof EquipamentoPayload>(campo: K, valor: EquipamentoPayload[K]): void {
    this.form.set({ ...this.form(), [campo]: valor });
  }

  toNumOuNull(v: string): number | null {
    return v === '' ? null : +v;
  }

  abrirCriacao(): void {
    this.modoEdicao.set(false);
    this.equipamentoEmEdicaoId = null;
    this.form.set({ ...FORM_VAZIO });
    this.erroForm.set(null);
    this.formAberto.set(true);
  }

  abrirEdicao(eq: EquipamentoApiItem): void {
    this.modoEdicao.set(true);
    this.equipamentoEmEdicaoId = eq.id;
    this.form.set({
      nome: eq.nome,
      id_empresa: eq.id_empresa,
      id_tipo: eq.id_tipo,
      id_departamento: eq.id_departamento ?? null,
      id_marca: eq.id_marca ?? null,
      id_modelo: eq.id_modelo ?? null,
      id_toner: eq.id_toner ?? null,
      id_monitor: eq.id_monitor ?? null,
      id_colaborador: eq.id_colaborador ?? null,
      senha: eq.senha ?? null,
      scanner: !!eq.scanner,
      data_fabricacao: eq.data_fabricacao ?? null,
      serie: eq.serie ?? null,
      processador: eq.processador ?? null,
      memoria_ram: eq.memoria_ram ?? null,
      armazenamento: eq.armazenamento ?? null,
      tamanho: eq.tamanho ?? null,
      so: eq.so ?? null,
      ip: eq.ip ?? null,
      mac: eq.mac ?? null,
      observacao: eq.observacao ?? null,
    });
    this.erroForm.set(null);
    this.formAberto.set(true);
  }

  fecharForm(): void {
    this.formAberto.set(false);
  }

  salvarForm(): void {
    const dados = this.form();

    if (!dados.nome.trim()) { this.erroForm.set('Informe o nome do equipamento.'); return; }
    if (!dados.id_tipo) { this.erroForm.set('Selecione o tipo do equipamento.'); return; }
    if (!dados.id_empresa) { this.erroForm.set('Selecione a empresa.'); return; }

    this.erroForm.set(null);
    this.salvando.set(true);

    const request$ = this.modoEdicao() && this.equipamentoEmEdicaoId
      ? this.svc.atualizar(this.equipamentoEmEdicaoId, dados)
      : this.svc.criar(dados);

    request$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.formAberto.set(false);
        this.svc.carregar();
        this.svc.carregarResumo();
      },
      error: err => {
        console.error('Erro ao salvar equipamento:', err);
        this.erroForm.set('Não foi possível salvar. Tente novamente.');
        this.salvando.set(false);
      },
    });
  }

  excluir(eq: EquipamentoApiItem): void {
    if (!confirm(`Excluir o equipamento "${eq.nome}"? Ele será marcado como inativo.`)) return;

    this.svc.excluir(eq.id).subscribe({
      next: () => { this.svc.carregar(); this.svc.carregarResumo(); },
      error: err => console.error('Erro ao excluir equipamento:', err),
    });
  }

  // ─── Vínculo ────────────────────────────────────────────────
  abrirVinculo(eq: EquipamentoApiItem): void {
    this.buscaColaborador.set('');
    this.resultadoColaboradores.set([]);
    this.colaboradorSelecionado.set(null);
    this.vinculoAberto.set(eq);
  }

  fecharVinculo(): void {
    this.vinculoAberto.set(null);
  }

  onBuscarColaborador(v: string): void {
    this.buscaColaborador.set(v);
    this.colaboradorSelecionado.set(null);

    clearTimeout(this.debounceBusca);
    if (!v.trim()) { this.resultadoColaboradores.set([]); return; }

    this.debounceBusca = setTimeout(() => {
      this.svc.buscarColaboradores(v).subscribe({
        next: r => this.resultadoColaboradores.set(r),
        error: err => console.error('Erro ao buscar colaboradores:', err),
      });
    }, 300);
  }

  confirmarVinculo(eq: EquipamentoApiItem): void {
    const colaborador = this.colaboradorSelecionado();
    if (!colaborador) return;

    this.svc.vincular(eq.id, colaborador.id).subscribe({
      next: () => {
        this.fecharVinculo();
        this.svc.carregar();
        this.svc.carregarResumo();
      },
      error: err => console.error('Erro ao vincular equipamento:', err),
    });
  }

  devolver(eq: EquipamentoApiItem): void {
    if (!confirm(`Registrar devolução de "${eq.nome}"?`)) return;

    this.svc.devolver(eq.id).subscribe({
      next: () => { this.svc.carregar(); this.svc.carregarResumo(); },
      error: err => console.error('Erro ao devolver equipamento:', err),
    });
  }

  // ─── Histórico ──────────────────────────────────────────────
  verHistorico(eq: EquipamentoApiItem): void {
    this.historico.set([]);
    this.historicoAberto.set(eq);

    this.svc.getHistorico(eq.id).subscribe({
      next: h => this.historico.set(h),
      error: err => console.error('Erro ao buscar histórico:', err),
    });
  }

  fecharHistorico(): void {
    this.historicoAberto.set(null);
  }
}