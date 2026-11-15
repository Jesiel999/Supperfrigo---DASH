import { ChangeDetectionStrategy, Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FluxoCaixaService } from '../../../shared/services/financeiro/fluxo_caixa.service';
import { HelpItem } from '../../../shared/models/config.models';
import { FluxoCaixaLinha } from '../../../shared/models/financeiro/fluxo_caixa.models';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card';
import { TopDevedoresBarComponent } from '../../../shared/components/line-bar/line-bar';
import { ExcelExportService } from '../../../shared/services/excel-export.service';
import { LineChartComponent } from '../../../shared/components/line-chart/line-chart';
import { MultiSelectFilterComponent } from '../../../shared/components/multi-select-filter/pessoa_filter';

@Component({
  selector: 'app-fluxo-caixa',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, KpiCardComponent, TopDevedoresBarComponent, LineChartComponent, MultiSelectFilterComponent],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title"><span>Fluxo de Caixa</span></h1>
          <p class="page-sub">
            Última atualização: <strong>{{ svc.ultimaAtualizacaoFormatada() }}</strong>
            • Próxima atualização: <strong>{{ svc.proximaAtualizacaoFormatada() }}</strong>
            @if (svc.filtrosAplicados(); as f) {
              • Período aplicado:
              <strong>{{ svc.formatarData(f.inicio) }} a {{ svc.formatarData(f.fim) }}</strong>
              • <strong>Somente títulos baixados</strong>
            }
          </p>
        </div>

        <div class="header-right">
          <app-multi-select-filter
            label="Pessoas"
            icon="🙋"
            [opcoes]="svc.opcoesPessoa()"
            [selecionados]="svc.filtroPessoas()"
            (toggleId)="svc.togglePessoa($event)"
            (toggleTodasEvt)="svc.toggleTodasPessoas()"
          />
          <div class="periodo-picker">
            <input type="date" class="input-date" [value]="svc.dataInicio()" (change)="onDataInicio($any($event.target).value)" />
            <span class="sep">→</span>
            <input type="date" class="input-date" [value]="svc.dataFim()" (change)="onDataFim($any($event.target).value)" />
            <label class="saldo-ini" title="Saldo de caixa no início do período">
              Saldo inicial
              <input type="number" step="0.01" class="input-date" [value]="svc.saldoInicial()" (change)="onSaldoInicial($any($event.target).value)" />
            </label>
            <button class="btn-filtrar" [disabled]="svc.carregando()" (click)="recarregar()">Filtrar</button>
            <button class="icon-btn" [disabled]="svc.carregando()" (click)="recarregar()" title="Atualizar">↻</button>
            <button class="help-btn" (click)="abrirAjuda()" title="Ajuda do Fluxo de Caixa"><span>?</span></button>

            @if (ajudaAberta()) {
              <div class="help-backdrop" (click)="fecharAjuda()">
                <div class="help-modal" (click)="$event.stopPropagation()">
                  <div class="help-header">
                    <div>
                      <div class="help-badge">💧 Fluxo de Caixa</div>
                      <h2>Como interpretar o Fluxo de Caixa</h2>
                      <p>Entenda como ler as entradas, saídas e o saldo realizados no caixa.</p>
                    </div>
                    <button class="close-btn" (click)="fecharAjuda()">✕</button>
                  </div>
                  <div class="help-body">
                    @for (item of ajuda; track item.titulo) {
                      <div class="help-card">
                        <div class="help-icon">{{ iconeAjuda(item.titulo) }}</div>
                        <div>
                          <h4>{{ item.titulo }}</h4>
                          <p>{{ item.descricao }}</p>
                        </div>
                      </div>
                    }
                  </div>
                  <div class="help-footer">
                    <div class="footer-info">
                      <strong>Dica</strong>
                      <span>Todos os valores respeitam o período e as empresas selecionadas.</span>
                    </div>
                    <button class="btn-entendi" (click)="fecharAjuda()">Entendi</button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid">
        <app-kpi-card label="Entradas Realizadas" icon="📥" variant="success"
          [value]="svc.kpis().entradas" [delta]="svc.kpis().variacaoEntradas"
          valueColor="#34D399" [isCurrency]="true" />
        <app-kpi-card label="Saídas Realizadas" icon="📤" variant="danger"
          [value]="svc.kpis().saidas" [delta]="svc.kpis().variacaoSaidas"
          valueColor="#f43F5E" [isCurrency]="true" />
        <app-kpi-card label="Saldo do Período" icon="📊" variant="info"
          [value]="svc.kpis().saldoPeriodo" [delta]="svc.kpis().variacaoSaldoPeriodo"
          [valueColor]="svc.kpis().saldoPeriodo < 0 ? '#f43F5E' : '#38BDF8'" [isCurrency]="true" />
        <app-kpi-card label="Saldo Inicial" icon="🏦" variant="info"
          [value]="svc.kpis().saldoInicial" [delta]="0"
          valueColor="#38BDF8" [isCurrency]="true" />
        <app-kpi-card label="Saldo Final" icon="🏁" variant="info"
          [value]="svc.kpis().saldoFinal" [delta]="0"
          [valueColor]="svc.kpis().saldoFinal < 0 ? '#f43F5E' : '#34D399'" [isCurrency]="true" />
        <app-kpi-card [label]="'Menor Saldo' + (svc.kpis().mesMenorSaldo ? ' (' + svc.formatarPeriodo(svc.kpis().mesMenorSaldo) + ')' : '')"
          icon="⚠️" variant="danger"
          [value]="svc.kpis().menorSaldo" [delta]="0"
          [valueColor]="svc.kpis().menorSaldo < 0 ? '#f43F5E' : '#fb923c'" [isCurrency]="true" />
      </div>

      <!-- 1) Composição do Fluxo  |  2) Saldo Acumulado (linha) -->
      <div class="charts-row">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Composição do Fluxo</h2>
              <p class="card-sub">Entradas, saídas e saldo do período (em módulo) — somente títulos baixados</p>
            </div>
          </div>
          <app-top-devedores-bar
            [data]="svc.composicaoFluxo()"
            [valueColors]="svc.composicaoFluxoCores()"
            [barColors]="svc.composicaoFluxoCores()"
            [showDays]="false"
            [showPercentage]="true"
          />
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Saldo Acumulado por Mês</h2>
              <p class="card-sub">Evolução do caixa realizado ao longo dos meses</p>
            </div>
          </div>
          @if (svc.fluxoPorPeriodo().length > 1) {
            <app-line-chart [series]="svc.seriesSaldoAcumulado()" />
          } @else {
            <div class="state"><p>É preciso ao menos 2 meses no período para exibir a evolução.</p></div>
          }
        </div>
      </div>

      <!-- Fluxo mensal -->
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Fluxo Mensal</h2>
            <p class="card-sub">Entradas, saídas e saldo acumulado mês a mês</p>
          </div>
          <div class="toolbar">
            <button class="btn-export-mini" [disabled]="!svc.fluxoPorPeriodo().length" (click)="exportarFluxo()">📊 Excel</button>
          </div>
        </div>
        @if (svc.fluxoPorPeriodo().length) {
          <div class="table-wrapper">
            <table class="dre-table" style="min-width:560px">
              <thead>
                <tr>
                  <th>Período</th>
                  <th class="num">Entradas</th>
                  <th class="num">Saídas</th>
                  <th class="num">Saldo do período</th>
                  <th class="num">Saldo acumulado</th>
                </tr>
              </thead>
              <tbody>
                @for (f of svc.fluxoPorPeriodo(); track f.periodo) {
                  <tr>
                    <td>{{ svc.formatarPeriodo(f.periodo) }}</td>
                    <td class="num pos">{{ svc.formatarMoeda(f.entradas) }}</td>
                    <td class="num neg">{{ svc.formatarMoeda(f.saidas) }}</td>
                    <td class="num valor" [class.pos]="f.saldo > 0" [class.neg]="f.saldo < 0">{{ svc.formatarMoeda(f.saldo) }}</td>
                    <td class="num valor" [class.pos]="f.acumulado > 0" [class.neg]="f.acumulado < 0">{{ svc.formatarMoeda(f.acumulado) }}</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="row-total">
                  <td>Total</td>
                  <td class="num pos">{{ svc.formatarMoeda(svc.totalProjecao().entradas) }}</td>
                  <td class="num neg">{{ svc.formatarMoeda(svc.totalProjecao().saidas) }}</td>
                  <td class="num" [class.pos]="svc.totalProjecao().saldo > 0" [class.neg]="svc.totalProjecao().saldo < 0">{{ svc.formatarMoeda(svc.totalProjecao().saldo) }}</td>
                  <td class="num" [class.pos]="svc.totalProjecao().acumulado > 0" [class.neg]="svc.totalProjecao().acumulado < 0">{{ svc.formatarMoeda(svc.totalProjecao().acumulado) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        } @else {
          <div class="state"><p>Sem movimentação baixada no período.</p></div>
        }
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Fluxo de Caixa por Conta</h2>
            <p class="card-sub">{{ svc.linhas().length }} contas • clique numa conta analítica para ver os títulos</p>
          </div>
          <div class="toolbar">
            <label class="check">
              <input type="checkbox" [checked]="svc.comparar()" (change)="svc.setComparar($any($event.target).checked)" />
              Comparar com período anterior
            </label>
            <button class="btn-ghost" (click)="svc.expandirTudo()">Expandir tudo</button>
            <button class="btn-ghost" (click)="svc.recolherTudo()">Recolher tudo</button>
            <button class="btn-export-mini" [disabled]="!svc.linhas().length" (click)="exportarPorConta()">📊 Excel</button>
          </div>
        </div>

        @if (svc.erro(); as msg) {
          <div class="state state-erro">
            <p>{{ msg }}</p>
            <button class="btn-filtrar" (click)="recarregar()">Tentar novamente</button>
          </div>
        } @else if (svc.carregando()) {
          <div class="skeleton-list" aria-busy="true">
            @for (i of skeletonRows; track i) { <div class="skeleton-row"></div> }
          </div>
        } @else if (svc.semDados()) {
          <div class="state"><p>Nenhum dado encontrado para o período selecionado.</p></div>
        } @else {
          <div class="table-wrapper">
            <table class="dre-table">
              <thead>
                <tr>
                  <th>Classificação</th>
                  <th>Conta</th>
                  <th>Tipo</th>
                  @for (p of svc.periodos(); track p) {
                    <th class="num">{{ svc.formatarPeriodo(p) }}</th>
                  }
                  <th class="num">Total</th>
                  <th class="num">% Entradas</th>
                  @if (svc.comparar()) {
                    <th class="num">Anterior</th>
                    <th class="num">Variação</th>
                  }
                  <th class="center">Ações</th>
                </tr>
              </thead>
              <tbody>
                @for (l of svc.linhasVisiveis(); track l.classificacao) {
                  <tr class="row"
                      [class.row-resultado]="l.nivel === 0"
                      [class.row-grupo]="!l.eh_analitica"
                      [class.row-analitica]="l.eh_analitica"
                      [class.row-ativa]="svc.contaSelecionada()?.classificacao === l.classificacao"
                      (click)="onLinhaClick(l)">
                    <td class="cell-class">
                      <div class="indent" [style.padding-left.px]="l.nivel * 18">
                        @if (l.temFilhos) {
                          <button class="chev" type="button"
                                  [attr.aria-expanded]="svc.contasExpandidas().has(l.classificacao)"
                                  (click)="toggle(l, $event)">
                            {{ svc.contasExpandidas().has(l.classificacao) ? '▼' : '▶' }}
                          </button>
                        } @else {
                          <span class="chev-spacer"></span>
                        }
                        <span class="code">{{ l.classificacao }}</span>
                      </div>
                    </td>
                    <td class="cell-conta">{{ limparDescricao(l.descricao) }}</td>
                    <td>
                      <span class="tag" [class.tag-analitica]="l.eh_analitica">
                        {{ l.eh_analitica ? 'Analítica' : 'Sintética' }}
                      </span>
                    </td>
                    @for (p of svc.periodos(); track p) {
                      <td class="num" [class.pos]="(l.porPeriodo[p] ?? 0) > 0" [class.neg]="(l.porPeriodo[p] ?? 0) < 0">
                        {{ svc.formatarMoeda(l.porPeriodo[p] ?? 0) }}
                      </td>
                    }
                    <td class="num valor" [class.pos]="l.total > 0" [class.neg]="l.total < 0">
                      {{ svc.formatarMoeda(l.total) }}
                    </td>
                    <td class="num muted">{{ svc.formatarPercentual(l.percentualEntradas) }}</td>
                    @if (svc.comparar()) {
                      <td class="num muted">{{ svc.formatarMoeda(l.comparativo?.anterior) }}</td>
                      <td class="num" [class.pos]="(l.comparativo?.variacao ?? 0) > 0" [class.neg]="(l.comparativo?.variacao ?? 0) < 0">
                        {{ svc.formatarPercentual(l.comparativo?.variacao) }}
                      </td>
                    }
                    <td class="center">
                      @if (l.eh_analitica) {
                        <button class="btn-link" type="button" (click)="abrirDetalhe(l, $event)">Ver títulos</button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="row-total">
                  <td colspan="3">Total</td>
                  @for (p of svc.periodos(); track p) {
                    <td class="num" [class.pos]="(svc.totalGerencial().porPeriodo[p] ?? 0) > 0" [class.neg]="(svc.totalGerencial().porPeriodo[p] ?? 0) < 0">
                      {{ svc.formatarMoeda(svc.totalGerencial().porPeriodo[p] ?? 0) }}
                    </td>
                  }
                  <td class="num" [class.pos]="svc.totalGerencial().total > 0" [class.neg]="svc.totalGerencial().total < 0">
                    {{ svc.formatarMoeda(svc.totalGerencial().total) }}
                  </td>
                  <td class="num muted">—</td>
                  @if (svc.comparar()) {
                    <td class="num muted">{{ svc.formatarMoeda(svc.totalGerencial().anterior) }}</td>
                    <td class="num" [class.pos]="(svc.totalGerencial().variacao ?? 0) > 0" [class.neg]="(svc.totalGerencial().variacao ?? 0) < 0">
                      {{ svc.formatarPercentual(svc.totalGerencial().variacao) }}
                    </td>
                  }
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        }
      </div>

      <!-- 5) Top 10 fornecedores pagos  |  Top 10 clientes que pagaram -->
      <div class="charts-row">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Top 10 Fornecedores Pagos</h2>
              <p class="card-sub">Maiores valores totais efetivamente pagos</p>
            </div>
          </div>
          @if (svc.topFornecedores().length) {
            <div class="impacto-list">
              @for (f of svc.topFornecedores(); track f.id; let i = $index) {
                <div class="impacto-row">
                  <div class="impacto-nome" [title]="f.nome"><span class="rank">{{ i + 1 }}</span> {{ f.nome }}</div>
                  <div class="impacto-bar"><span [style.width.%]="f.largura" style="background:var(--neg)"></span></div>
                  <div class="impacto-valor neg">{{ svc.formatarMoeda(f.total) }}<small>{{ svc.formatarPercentual(f.percentual) }}</small></div>
                </div>
              }
            </div>
          } @else {
            <div class="state"><p>Sem pagamentos no período.</p></div>
          }
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Top 10 Clientes Recebidos</h2>
              <p class="card-sub">Maiores valores totais efetivamente recebidos</p>
            </div>
          </div>
          @if (svc.topClientes().length) {
            <div class="impacto-list">
              @for (c of svc.topClientes(); track c.id; let i = $index) {
                <div class="impacto-row">
                  <div class="impacto-nome" [title]="c.nome"><span class="rank">{{ i + 1 }}</span> {{ c.nome }}</div>
                  <div class="impacto-bar"><span [style.width.%]="c.largura" style="background:var(--info)"></span></div>
                  <div class="impacto-valor info">{{ svc.formatarMoeda(c.total) }}<small>{{ svc.formatarPercentual(c.percentual) }}</small></div>
                </div>
              }
            </div>
          } @else {
            <div class="state"><p>Sem recebimentos no período.</p></div>
          }
        </div>
      </div>
    </div>

    <!-- Drawer: títulos que compõem a conta -->
    @if (svc.contaSelecionada(); as conta) {
      <div class="drawer-backdrop" (click)="svc.fecharDetalhe()">
        <aside class="drawer" (click)="$event.stopPropagation()" role="dialog" aria-label="Títulos da conta">
          <div class="drawer-header">
            <div>
              <div class="drawer-code">{{ conta.classificacao }}</div>
              <h2 class="drawer-title">{{ limparDescricao(conta.descricao) }}</h2>
              <div class="drawer-valor" [class.pos]="conta.total > 0" [class.neg]="conta.total < 0">
                {{ svc.formatarMoeda(conta.total) }}
              </div>
            </div>
            <div class="drawer-actions">
              <button class="btn-export-mini" [disabled]="!svc.totalTitulos()" (click)="exportarTitulos()">📊 Excel</button>
              <button class="close-btn" (click)="svc.fecharDetalhe()">✕</button>
            </div>
          </div>

          <div class="drawer-body">
            <h3 class="drawer-sub">Títulos baixados nesta conta</h3>

            @if (svc.carregandoDetalhamento()) {
              <div class="skeleton-list" aria-busy="true">
                @for (i of skeletonRows; track i) { <div class="skeleton-row"></div> }
              </div>
            } @else if (svc.erroDetalhamento(); as msg) {
              <div class="state state-erro">
                <p>{{ msg }}</p>
                <button class="btn-filtrar" (click)="abrirDetalhe(conta)">Tentar novamente</button>
              </div>
            } @else if (svc.totalTitulos() === 0) {
              <div class="state"><p>Nenhum título encontrado para esta conta.</p></div>
            } @else {
              <div class="table-wrapper">
                <table class="dre-table titulos">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Empresa</th>
                      <th>Cliente/Fornecedor</th>
                      <th>Documento</th>
                      <th>Descrição</th>
                      <th>Origem</th>
                      <th>Competência</th>
                      <th>Vencimento</th>
                      <th>Baixa</th>
                      <th>Situação</th>
                      <th class="num">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (t of svc.titulosPagina(); track t.codigo) {
                      <tr class="row">
                        <td>{{ t.codigo }}</td>
                        <td>{{ t.nome_empresa ?? '—' }}</td>
                        <td>{{ t.nome_pessoa ?? '—' }}</td>
                        <td>{{ t.numero_documento ?? '—' }}</td>
                        <td>{{ t.descricao ?? '—' }}</td>
                        <td>{{ t.origem ?? '—' }}</td>
                        <td>{{ svc.formatarData(t.data_competencia) }}</td>
                        <td>{{ svc.formatarData(t.data_vencimento) }}</td>
                        <td>{{ svc.formatarData(t.data_baixa) }}</td>
                        <td>{{ t.descricao_situacao ?? t.status_financeiro ?? '—' }}</td>
                        <td class="num valor">{{ svc.formatarMoeda(t.valor_total) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <div class="pager">
                <span class="muted">{{ svc.totalTitulos() }} títulos • página {{ svc.paginaDetalhe() }} de {{ svc.totalPaginas() }}</span>
                <div class="pager-btns">
                  <button class="btn-ghost" [disabled]="svc.paginaDetalhe() <= 1" (click)="svc.irParaPagina(svc.paginaDetalhe() - 1)">‹ Anterior</button>
                  <button class="btn-ghost" [disabled]="svc.paginaDetalhe() >= svc.totalPaginas()" (click)="svc.irParaPagina(svc.paginaDetalhe() + 1)">Próxima ›</button>
                </div>
              </div>

              <div class="drawer-totais">
                <div><span class="muted">Total dos títulos</span><strong>{{ svc.formatarMoeda(svc.somaTitulos()) }}</strong></div>
                <div><span class="muted">Valor da conta no Fluxo de Caixa</span><strong>{{ svc.formatarMoeda(conta.total) }}</strong></div>
              </div>
            }
          </div>
        </aside>
      </div>
    }
  `,
  styles: [`
    /* ── Ajuda ── */
    .help-backdrop{position:fixed;inset:0;background:var(--backdrop);backdrop-filter:blur(8px);display:flex;justify-content:center;align-items:center;z-index:9999;animation:fadeIn .2s ease}
    .help-modal{width:850px;max-width:95vw;max-height:85vh;overflow:hidden;background:var(--modal-bg);border:1px solid var(--tint-3);border-radius:22px;display:flex;flex-direction:column;box-shadow:0 20px 60px var(--backdrop);animation:modalIn .25s ease}
    .help-header{padding:28px 30px;border-bottom:1px solid var(--tint-2);display:flex;justify-content:space-between;align-items:flex-start}
    .help-badge{display:inline-flex;background:rgba(244,63,94,.15);color:var(--accent);padding:5px 12px;border-radius:50px;font-size:12px;margin-bottom:14px}
    .help-header h2{font-size:28px;font-family:'Syne';margin-bottom:8px}
    .help-header p{color:var(--muted);line-height:1.6;max-width:600px}
    .close-btn{width:40px;height:40px;border-radius:50%;border:none;background:var(--tint-2);color:var(--text-strong);cursor:pointer;transition:.2s}
    .close-btn:hover{background:var(--accent);transform:rotate(90deg)}
    .help-body{flex:1;overflow:auto;padding:26px;display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:18px}
    .help-card{display:flex;gap:18px;background:var(--modal-card);border:1px solid var(--tint-1);border-radius:16px;padding:20px;transition:.25s}
    .help-card:hover{transform:translateY(-4px);border-color:var(--accent);box-shadow:0 10px 25px rgba(244,63,94,.12)}
    .help-icon{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(244,63,94,.12);font-size:24px;flex-shrink:0}
    .help-card h4{margin:0 0 8px;font-size:15px;color:var(--text-strong)}
    .help-card p{margin:0;color:var(--muted);line-height:1.6;font-size:13px}
    .help-footer{padding:20px 28px;border-top:1px solid var(--tint-2);display:flex;justify-content:space-between;align-items:center}
    .footer-info{display:flex;flex-direction:column;gap:5px}
    .footer-info strong{color:var(--text-strong)}
    .footer-info span{color:var(--muted);font-size:13px}
    .btn-entendi{background:var(--accent);color:white;border:none;padding:10px 24px;border-radius:10px;font-weight:600;cursor:pointer;transition:.2s}
    .btn-entendi:hover{background:var(--accent-hover)}
    @keyframes modalIn{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:none}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}

    /* ── Layout ── */
    .page{display:flex;flex-direction:column;gap:24px;padding:20px}
    .page-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:10px}
    .page-title{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;letter-spacing:-.5px;line-height:1.1;margin:0}
    .page-title span{background:linear-gradient(90deg,var(--info),var(--info));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .page-sub{color:var(--muted);font-size:13px;margin-top:5px}
    .header-right{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
    .periodo-picker{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
    .input-date{background:var(--tint-2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;font-family:'Outfit',sans-serif;padding:5px 10px;outline:none;color-scheme:var(--color-scheme)}
    .saldo-ini{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}
    .saldo-ini .input-date{width:110px}
    .sep{color:var(--muted);font-size:12px}
    .btn-filtrar{background:rgba(244,63,94,.14);border:1px solid rgba(244,63,94,.3);color:var(--accent);font-size:12px;font-family:'Outfit',sans-serif;font-weight:500;padding:5px 14px;border-radius:8px;cursor:pointer;transition:background .2s}
    .btn-filtrar:hover:not(:disabled){background:rgba(244,63,94,.25)}
    button:disabled{opacity:.5;cursor:not-allowed}
    .icon-btn,.help-btn{width:34px;height:34px;border-radius:50%;border:1px solid var(--border);background:var(--tint-1);color:var(--muted);cursor:pointer;transition:.2s;font-weight:700;font-size:15px}
    .icon-btn:hover:not(:disabled),.help-btn:hover{background:var(--accent);color:white;border-color:var(--accent)}
    .kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
    .charts-row{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
    .card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:22px;margin-bottom:20px;min-width:0}
    .card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px}
    .card-title{font-family:'Syne',sans-serif;font-weight:700;font-size:15px;letter-spacing:-.3px;margin:0}
    .card-sub{font-size:11.5px;color:var(--muted);margin:2px 0 0}
    .toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .check{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);cursor:pointer}
    .btn-ghost{background:var(--tint-1);border:1px solid var(--border);color:var(--text);font-size:11px;padding:5px 12px;border-radius:6px;cursor:pointer;font-family:'Outfit',sans-serif}
    .btn-ghost:hover:not(:disabled){background:var(--tint-3)}
    .btn-export-mini{background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.3);color:var(--accent);font-size:11px;padding:5px 12px;border-radius:6px;cursor:pointer;font-family:'Outfit',sans-serif;font-weight:500;transition:background .2s}
    .btn-export-mini:hover:not(:disabled){background:rgba(244,63,94,.22)}
    .btn-link{background:none;border:none;color:var(--info);font-size:11px;cursor:pointer;font-family:'Outfit',sans-serif;text-decoration:underline}

    /* ── Tabelas ── */
    .table-wrapper{overflow-x:auto}
    .dre-table{width:100%;border-collapse:collapse;font-size:12px;min-width:720px}
    .dre-table thead{background:var(--tint-1);border-bottom:1px solid var(--border)}
    .dre-table th{padding:12px;text-align:center;font-weight:600;color:var(--muted);text-transform:uppercase;font-size:10px;letter-spacing:.5px;white-space:nowrap}
    .dre-table td{padding:10px 12px;color:var(--text);text-align:left;vertical-align:middle}
    .dre-table tbody tr{border-bottom:1px solid var(--border);transition:background .2s}
    .dre-table tbody tr:hover{background:var(--tint-1)}
    .num{text-align:center;white-space:nowrap;font-variant-numeric:tabular-nums}
    .center{text-align:center}
    .muted{color:var(--muted)}
    .valor{font-weight:600}
    .pos{color:var(--pos)}
    .neg{color:var(--neg)}
    .row{cursor:default}
    .row-grupo,.row-analitica{cursor:pointer}
    .row-grupo .cell-conta{font-weight:600}
    .row-analitica .cell-conta{font-weight:400}
    .row-ativa{background:rgba(56,189,248,.08)!important}
    .row-resultado{background:var(--tint-2);border-top:1px solid var(--border);border-bottom:2px solid var(--border)}
    .row-resultado td{font-weight:700}
    .cell-class{white-space:nowrap}
    .indent{display:flex;align-items:center;gap:6px}
    .code{color:var(--muted);font-variant-numeric:tabular-nums}
    .chev{background:none;border:none;color:var(--muted);cursor:pointer;width:18px;padding:0;font-size:10px}
    .chev:hover{color:var(--text)}
    .chev-spacer{display:inline-block;width:18px}
    .tag{background:rgba(100,116,139,.2);color:var(--text);padding:3px 8px;border-radius:4px;font-size:10px;font-weight:500}
    .tag-analitica{background:rgba(56,189,248,.15);color:var(--info)}
    .titulos td{white-space:nowrap}

    .cell-class,.cell-conta{text-align:left}
    .dre-table td:has(.tag){text-align:center}
    .titulos td:nth-child(1),.titulos td:nth-child(2),.titulos td:nth-child(3),.titulos td:nth-child(4),.titulos td:nth-child(5),.titulos td:nth-child(6),.titulos td:nth-child(10){text-align:left}
    .titulos td:nth-child(7),.titulos td:nth-child(8),.titulos td:nth-child(9),.titulos td:nth-child(11){text-align:center}

    /* ── Contas de Maior Impacto: nome da conta com área ampla (quebra linha, sem cortar) ── */
    .impacto-list{display:flex;flex-direction:column;gap:12px}
    .impacto-row{display:grid;grid-template-columns:minmax(220px,40%) 1fr auto;align-items:center;gap:14px}
    .impacto-nome{font-size:12.5px;line-height:1.35;color:var(--text);overflow-wrap:anywhere}
    .impacto-bar{height:8px;border-radius:99px;background:var(--tint-2);overflow:hidden}
    .impacto-bar span{display:block;height:100%;border-radius:99px}
    .impacto-valor{font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap;text-align:right}
    .impacto-valor small{color:var(--muted);font-weight:500;margin-left:8px}
    @media (max-width:768px){.impacto-row{grid-template-columns:1fr auto}.impacto-bar{grid-column:1/-1}}

    /* ── Linhas de total ── */
    .row-total td{font-weight:700;background:var(--tint-2);border-top:2px solid var(--border-strong)}
    .totais-pagar{display:flex;align-items:center;gap:28px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);font-size:13px}
    .totais-pagar div{display:flex;flex-direction:column;gap:2px}
    .rank{display:inline-block;min-width:22px;color:var(--muted);font-variant-numeric:tabular-nums}
    .info{color:var(--info)}

    /* ── Estados ── */
    .state{display:flex;flex-direction:column;align-items:center;gap:12px;padding:40px 12px;color:var(--muted);font-size:13px;text-align:center}
    .state p{margin:0}
    .state-erro p{color:var(--neg)}
    .skeleton-list{display:flex;flex-direction:column;gap:8px}
    .skeleton-row{height:34px;border-radius:8px;background:linear-gradient(90deg,var(--tint-1),var(--tint-3),var(--tint-1));background-size:200% 100%;animation:shimmer 1.4s infinite}
    @keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}

    /* ── Drawer ── */
    .drawer-backdrop{position:fixed;inset:0;background:var(--backdrop);backdrop-filter:blur(3px);z-index:99999;display:flex;justify-content:flex-end;animation:fadeIn .15s ease}
    .drawer{width:min(1000px,96vw);height:100%;background:var(--modal-bg);border-left:1px solid var(--tint-3);display:flex;flex-direction:column;box-shadow:-20px 0 60px var(--shadow-color);animation:drawerIn .22s ease}
    @keyframes drawerIn{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}
    .drawer-header{padding:22px 26px;border-bottom:1px solid var(--tint-2);display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
    .drawer-code{font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}
    .drawer-title{font-family:'Syne',sans-serif;font-size:20px;margin:4px 0}
    .drawer-valor{font-size:22px;font-weight:700}
    .drawer-actions{display:flex;align-items:center;gap:10px}
    .drawer-body{flex:1;overflow:auto;padding:22px 26px;display:flex;flex-direction:column;gap:16px}
    .drawer-sub{font-size:13px;color:var(--muted);margin:0;font-weight:600}
    .pager{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;font-size:12px}
    .pager-btns{display:flex;gap:8px}
    .drawer-totais{display:flex;gap:32px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--border);font-size:13px}
    .drawer-totais div{display:flex;flex-direction:column;gap:2px}

    /* ── Responsivo ── */
    @media (max-width:1100px){
      .kpi-grid{grid-template-columns:repeat(2,1fr)}
      .charts-row{grid-template-columns:1fr}
    }
    @media (max-width:768px){
      .kpi-grid{grid-template-columns:1fr}
      .page-header{flex-direction:column}
      .page{padding:12px}
    }
  `],
})
export class FluxoCaixaComponent implements OnInit {
  protected readonly svc = inject(FluxoCaixaService);
  private readonly excelExport = inject(ExcelExportService);

  protected readonly skeletonRows = [1, 2, 3, 4, 5, 6];

  readonly ajudaAberta = signal(false);

  readonly ajuda: HelpItem[] = [
    { titulo: 'O que é o Fluxo de Caixa', descricao: 'Mostra o que de fato entrou e saiu do caixa, mês a mês, considerando somente títulos já baixados (pagos ou recebidos). Por padrão o período são os últimos 3 meses.' },
    { titulo: 'Entradas e saídas', descricao: 'Entradas são os recebimentos efetivados (contas a receber baixadas). Saídas são os pagamentos efetivados (contas a pagar baixadas). Na baixa parcial entra só o valor já pago. O saldo do período é Entradas − Saídas.' },
    { titulo: 'Saldo inicial e acumulado', descricao: 'Informe o saldo de caixa no início do período. O saldo acumulado soma o saldo de cada mês ao saldo inicial e mostra a evolução do caixa.' },
    { titulo: 'Menor saldo', descricao: 'Indica o mês em que o caixa realizado ficou mais apertado. Se for negativo, o caixa terminou aquele mês no vermelho.' },
    { titulo: 'Conta sintética x analítica', descricao: 'Sintética agrupa outras contas. Analítica é a conta final, que possui títulos financeiros associados.' },
    { titulo: 'Expandir uma conta', descricao: 'Clique na seta ▶/▼ ao lado da classificação para abrir ou recolher os níveis. Use "Expandir tudo" e "Recolher tudo" para agir em toda a árvore.' },
    { titulo: 'Consultar os títulos', descricao: 'Clique em uma conta analítica (ou em "Ver títulos") para abrir o painel lateral com os títulos baixados que compõem o valor. Os dados são carregados somente nesse momento.' },
    { titulo: 'Filtros', descricao: 'O período, as empresas e as pessoas selecionadas valem para KPIs, gráficos, tabelas e títulos. A data considerada é a da baixa. A comparação usa um intervalo de mesma duração imediatamente anterior.' },
  ];

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.svc.contaSelecionada()) this.svc.fecharDetalhe();
    else if (this.ajudaAberta()) this.fecharAjuda();
  }

  abrirAjuda(): void { this.ajudaAberta.set(true); }
  fecharAjuda(): void { this.ajudaAberta.set(false); }

  ngOnInit(): void {
    this.svc.carregar();
  }

  iconeAjuda(titulo: string): string {
    if (titulo.startsWith('O que')) return '💧';
    if (titulo.startsWith('Entradas')) return '↕️';
    if (titulo.startsWith('Saldo')) return '🏦';
    if (titulo.startsWith('Menor')) return '⚠️';
    if (titulo.startsWith('Conta')) return '🧩';
    if (titulo.startsWith('Expandir')) return '🌲';
    if (titulo.startsWith('Consultar')) return '🔎';
    if (titulo.startsWith('Filtros')) return '🎛️';
    return 'ℹ️';
  }

  onDataInicio(v: string): void { this.svc.dataInicio.set(v); }
  onDataFim(v: string): void { this.svc.dataFim.set(v); }
  onSaldoInicial(v: string): void { this.svc.setSaldoInicial(Number(v)); }
  recarregar(): void { this.svc.carregar(); }

  limparDescricao(d: string): string { return d.replace(/^\.+\s*/, ''); }

  toggle(l: FluxoCaixaLinha, ev: Event): void {
    ev.stopPropagation();
    this.svc.toggleConta(l.classificacao);
  }

  abrirDetalhe(l: FluxoCaixaLinha, ev?: Event): void {
    ev?.stopPropagation();
    this.svc.abrirDetalhe(l);
  }

  onLinhaClick(l: FluxoCaixaLinha): void {
    if (l.eh_analitica) this.svc.abrirDetalhe(l);
    else if (l.temFilhos) this.svc.toggleConta(l.classificacao);
  }

  exportarPorConta(): void {
    this.excelExport.exportar(this.svc.linhasParaExport(), 'fluxo_caixa_por_conta');
  }

  exportarFluxo(): void {
    this.excelExport.exportar(this.svc.fluxoParaExport(), 'fluxo_caixa_mensal');
  }

  exportarTitulos(): void {
    const conta = this.svc.contaSelecionada();
    if (!conta) return;
    this.excelExport.exportar(this.svc.titulosParaExport(), `fluxo_caixa_titulos_${conta.classificacao}`);
  }
}