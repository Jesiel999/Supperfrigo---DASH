import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaxaService } from '../../../../shared/services/taxa.service';
import { HelpItem } from '../../../../shared/models/config.models';
import { KpiCardComponent } from '../../../../shared/components/kpi-card/kpi-card';
import { KpiCardInvertComponent } from '../../../../shared/components/kpi-card-invert/kpi-card';
import { TopDevedoresBarComponent } from '../../../../shared/components/line-bar/line-bar';
import { LineChartComponent } from '../../../../shared/components/line-chart/line-chart';
import { ExcelExportService } from '../../../../shared/services/excel-export.service';
import { TaxaPagamentoColumnProvider, TaxaRecebimentoColumnProvider } from '../../../../shared/components/tables/taxa/column-providers';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table';

@Component({
  selector: 'app-taxa',
  standalone: true,
  imports: [
    CommonModule,
    KpiCardComponent,
    KpiCardInvertComponent,
    TopDevedoresBarComponent,
    LineChartComponent,
    DataTableComponent,
  ],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Análise <span>Taxa de Recebimento e Pagamento</span></h1>
          <p class="page-sub">
            Última atualização: <strong>{{ svc.ultimaAtualizacaoFormatada() }}</strong>
            • Próxima atualização: <strong>{{ svc.proximaAtualizacaoFormatada() }}</strong>
          </p>
        </div>

        <div class="header-right">
          <div class="periodo-picker">
            <input type="date" class="input-date" [value]="svc.dataInicio()" (change)="onDataInicio($any($event.target).value)" />
            <span class="sep">→</span>
            <input type="date" class="input-date" [value]="svc.dataFim()" (change)="onDataFim($any($event.target).value)" />
            <button class="btn-filtrar" (click)="recarregar()">Filtrar</button>
            <button class="help-btn" (click)="abrirAjuda()" title="Ajuda do Dashboard"><span>?</span></button>

            @if (ajudaAberta()) {
              <div class="help-backdrop" (click)="fecharAjuda()">
                <div class="help-modal" (click)="$event.stopPropagation()">
                  <div class="help-header">
                    <div>
                      <div class="help-badge">📊 Dashboard Taxa de Recebimento e Pagamento</div>
                      <h2>Como interpretar este Dashboard</h2>
                      <p>Entenda o significado de cada indicador apresentado nesta tela.</p>
                    </div>
                    <button class="close-btn" (click)="fecharAjuda()">✕</button>
                  </div>
                  <div class="help-body">
                    @for (item of ajuda; track item.titulo) {
                      <div class="help-card">
                        <div class="help-icon">ℹ️</div>
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
                      <span>Todos os indicadores respeitam os filtros de período e empresas selecionadas.</span>
                    </div>
                    <button class="btn-entendi" (click)="fecharAjuda()">Entendi</button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Abas -->
      <div class="tabs">
        <button class="tab" [class.active]="abaAtiva === 'taxa-recebimento'" (click)="abaAtiva = 'taxa-recebimento'">
          📊 Taxa de Recebimento
        </button>
        <button class="tab" [class.active]="abaAtiva === 'taxa-pagamento'" (click)="abaAtiva = 'taxa-pagamento'">
          📈 Taxa de Pagamento
        </button>
      </div>

      <!-- ═══════════════ ABA RECEBIMENTO ═══════════════ -->
      @if (abaAtiva === 'taxa-recebimento') {
        <div class="kpi-grid">
          <app-kpi-card
            label="Valor a Receber" icon="🔴" variant="danger"
            [value]="svc.kpiTxRecebimento().valorEsperado"
            [delta]="svc.kpiTxRecebimento().variacaoEsperado"
            [isCurrency]="true"
          />
          <app-kpi-card-invert
            label="Valor Recebido" icon="✅" variant="success"
            [value]="svc.kpiTxRecebimento().valorRealizado"
            [delta]="svc.kpiTxRecebimento().variacaoRealizado"
            [isCurrency]="true"
          />
          <app-kpi-card
            label="Diferença" icon="💵" variant="info"
            [value]="svc.kpiTxRecebimento().valorDiferenca"
            [delta]="svc.kpiTxRecebimento().variacaoDiferenca"
            [isCurrency]="true"
          />
        </div>

        <div class="charts-row">
          <div class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Rank por Empresa</h2>
                <p class="card-sub">Valor esperado a receber</p>
              </div>
            </div>
            <app-top-devedores-bar [data]="svc.rankingRecebimentoParaGrafico()" />
          </div>

          <div class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">A Receber vs Recebido</h2>
                <p class="card-sub">Comparativo por empresa</p>
              </div>
            </div>
            <div class="legend">
              <span class="legend-item"><span class="legend-dot" style="background:#f43f5e"></span> A Receber</span>
              <span class="legend-item"><span class="legend-dot" style="background:#34d399"></span> Recebido</span>
            </div>
            <app-top-devedores-bar [data]="svc.comparativoRecebimento()" />
          </div>
        </div>

        <div class="card chart-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">
                Evolução {{ svc.granularidadeGraficoRecebimento() === 'mes' ? 'Mensal' : 'Diária' }}
              </h2>
              <p class="card-sub">A Receber (vermelho) vs Recebido (verde)</p>
            </div>
            <select class="select-mini" [value]="svc.granularidadeGraficoRecebimento()" (change)="onGranularidadeRecebimentoChange($any($event.target).value)">
              <option value="dia">Por dia</option>
              <option value="mes">Por mês</option>
            </select>
          </div>
            <app-line-chart [series]="svc.seriesRecebimento()" />
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Taxa de Recebimento por Cliente</h2>
              <p class="card-sub">{{ svc.taxaPorCliente().length }} clientes</p>
            </div>
            <button class="btn-export-mini" (click)="exportarTaxaPorCliente()">📊 Excel</button>
          </div>
          <div class="table-wrapper">
            <app-data-table
              [dados]="svc.recebimentoFiltrado()"
              [colunas]="colunasRecebimento"
              [nomeArquivo]="nomeArquivoRecebimento"
            />
          </div>
        </div>
      }

      <!-- ═══════════════ ABA PAGAMENTO ═══════════════ -->
      @if (abaAtiva === 'taxa-pagamento') {
        <div class="kpi-grid">
          <app-kpi-card
            label="Valor a Pagar" icon="🔴" variant="danger"
            [value]="svc.kpiTxPagamento().valorEsperado"
            [delta]="svc.kpiTxPagamento().variacaoEsperado"
            [isCurrency]="true"
          />
          <app-kpi-card-invert
            label="Valor Pago" icon="✅" variant="success"
            [value]="svc.kpiTxPagamento().valorRealizado"
            [delta]="svc.kpiTxPagamento().variacaoRealizado"
            [isCurrency]="true"
          />
          <app-kpi-card
            label="Diferença" icon="💵" variant="info"
            [value]="svc.kpiTxPagamento().valorDiferenca"
            [delta]="svc.kpiTxPagamento().variacaoDiferenca"
            [isCurrency]="true"
          />
        </div>

        <div class="charts-row">
          <div class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Rank por Empresa</h2>
                <p class="card-sub">Valor esperado a pagar</p>
              </div>
            </div>
            <app-top-devedores-bar [data]="svc.rankingPagamentoParaGrafico()" />
          </div>

          <div class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">A Pagar vs Pago</h2>
                <p class="card-sub">Comparativo por empresa</p>
              </div>
            </div>
            <div class="legend">
              <span class="legend-item"><span class="legend-dot" style="background:#f43f5e"></span> A Pagar</span>
              <span class="legend-item"><span class="legend-dot" style="background:#34d399"></span> Pago</span>
            </div>
            <app-top-devedores-bar [data]="svc.comparativoPagamento()" />
          </div>
        </div>

        <div class="card chart-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">
                Evolução {{ svc.granularidadeGraficoPagamento() === 'mes' ? 'Mensal' : 'Diária' }}
              </h2>
              <p class="card-sub">A Pagar (vermelho) vs Pago (verde)</p>
            </div>
            <select class="select-mini" [value]="svc.granularidadeGraficoPagamento()" (change)="onGranularidadePagamentoChange($any($event.target).value)">
              <option value="dia">Por dia</option>
              <option value="mes">Por mês</option>
            </select>
          </div>
          <app-line-chart [series]="svc.seriesPagamento()" />
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Taxa de Pagamento por Fornecedor</h2>
              <p class="card-sub">{{ svc.taxaPorFornecedor().length }} fornecedores</p>
            </div>
            <button class="btn-export-mini" (click)="exportarTaxaPorFornecedor()">📊 Excel</button>
          </div>
          <div class="table-wrapper">
            <app-data-table
              [dados]="svc.pagamentoFiltrado()"
              [colunas]="colunasPagamento"
              [nomeArquivo]="nomeArquivoPagamento"
            />
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .help-backdrop{
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.65);
      backdrop-filter:blur(8px);
      display:flex;
      justify-content:center;
      align-items:center;
      z-index:9999;
      animation:fadeIn .2s ease;
  }

  .help-modal{
      width:850px;
      max-width:95vw;
      max-height:85vh;
      overflow:hidden;
      background:#141922;
      border:1px solid rgba(255,255,255,.08);
      border-radius:22px;
      display:flex;
      flex-direction:column;
      box-shadow:
          0 20px 60px rgba(0,0,0,.55);
      animation:modalIn .25s ease;
  }

  .help-header{
      padding:28px 30px;
      border-bottom:1px solid rgba(255,255,255,.06);
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
  }

  .help-badge{
      display:inline-flex;
      background:rgba(244,63,94,.15);
      color:#f43f5e;
      padding:5px 12px;
      border-radius:50px;
      font-size:12px;
      margin-bottom:14px;
  }

  .help-header h2{
      font-size:28px;
      font-family:'Syne';
      margin-bottom:8px;
  }

  .help-header p{
      color:#9ca3af;
      line-height:1.6;
      max-width:600px;
  }

  .close-btn{
      width:40px;
      height:40px;
      border-radius:50%;
      border:none;
      background:rgba(255,255,255,.06);
      color:white;
      cursor:pointer;
      transition:.2s;
  }

  .close-btn:hover{
      background:#f43f5e;
      transform:rotate(90deg);
  }

  .help-body{
      flex:1;
      overflow:auto;
      padding:26px;
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(330px,1fr));
      gap:18px;
  }

  .help-card{
      display:flex;
      gap:18px;
      background:#1a202c;
      border:1px solid rgba(255,255,255,.05);
      border-radius:16px;
      padding:20px;
      transition:.25s;
  }

  .help-card:hover{
      transform:translateY(-4px);
      border-color:#f43f5e;
      box-shadow:0 10px 25px rgba(244,63,94,.12);
  }

  .help-icon{
      width:52px;
      height:52px;
      border-radius:14px;
      display:flex;
      align-items:center;
      justify-content:center;
      background:rgba(244,63,94,.12);
      font-size:24px;
      flex-shrink:0;
  }

  .help-card h4{
      margin:0;
      font-size:15px;
      color:white;
      margin-bottom:8px;
  }

  .help-card p{
      margin:0;
      color:#9ca3af;
      line-height:1.6;
      font-size:13px;
  }

  .help-footer{
      padding:20px 28px;
      border-top:1px solid rgba(255,255,255,.06);
      display:flex;
      justify-content:space-between;
      align-items:center;
  }

  .footer-info{
      display:flex;
      flex-direction:column;
      gap:5px;
  }

  .footer-info strong{
      color:white;
  }

  .footer-info span{
      color:#9ca3af;
      font-size:13px;
  }

  .btn-entendi{
      background:#f43f5e;
      color:white;
      border:none;
      padding:10px 24px;
      border-radius:10px;
      font-weight:600;
      cursor:pointer;
      transition:.2s;
  }

  .btn-entendi:hover{
      background:#e11d48;
  }

  @keyframes modalIn{
      from{
          opacity:0;
          transform:translateY(20px) scale(.95);
      }
      to{
          opacity:1;
          transform:none;
      }
  }

  @keyframes fadeIn{
      from{
          opacity:0;
      }
      to{
          opacity:1;
      }
  }
    .page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 20px;
    }

    /* ── Header ── */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 10px;
    }

    .page-title {
      font-family: 'Syne', sans-serif;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      line-height: 1.1;
      margin: 0;
    }

    .page-title span {
      background: linear-gradient(90deg, #f43f5e, #fb923c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .page-sub {
      color: var(--muted);
      font-size: 13px;
      margin-top: 5px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    /* ── Período picker ── */
    .periodo-picker {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .input-date {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      font-size: 12px;
      font-family: 'Outfit', sans-serif;
      padding: 5px 10px;
      outline: none;
      color-scheme: dark;
    }

    .sep {
      color: var(--muted);
      font-size: 12px;
    }

    .btn-filtrar {
      background: rgba(244, 63, 94, 0.14);
      border: 1px solid rgba(244, 63, 94, 0.3);
      color: #f43f5e;
      font-size: 12px;
      font-family: 'Outfit', sans-serif;
      font-weight: 500;
      padding: 5px 14px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-filtrar:hover {
      background: rgba(244, 63, 94, 0.25);
    }

    .help-btn{
        width:34px;
        height:34px;

        border-radius:50%;

        border:1px solid var(--border);

        background:rgba(255,255,255,.05);

        color:var(--muted);

        cursor:pointer;

        transition:.2s;

        font-weight:700;

        font-size:15px;
    }

    .help-btn:hover{
        background:#f43f5e;
        color:white;
        border-color:#f43f5e;
    }

    /* ── Live badge ── */
    .live-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(52, 211, 153, 0.1);
      border: 1px solid rgba(52, 211, 153, 0.25);
      color: #34d399;
      font-size: 11px;
      font-weight: 600;
      padding: 5px 12px;
      border-radius: 20px;
    }

    .live-dot {
      width: 6px;
      height: 6px;
      background: #34d399;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }

    /* ── Botão de exportar excel ── */
    .btn-export-mini {
      background: rgba(244,63,94,.12); border: 1px solid rgba(244,63,94,.3);
      color: #f43f5e; font-size: 11px; padding: 5px 12px; border-radius: 6px;
      cursor: pointer; font-family: 'Outfit', sans-serif; font-weight: 500;
      transition: background .2s;
    }
    .btn-export-mini:hover { background: rgba(244,63,94,.22); }

    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.5;
        transform: scale(1.3);
      }
    }

    /* ── Abas ── */
    .tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 24px;
    }

    .tab {
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--muted);
      font-size: 14px;
      font-weight: 500;
      padding: 12px 16px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab:hover {
      color: var(--text);
    }

    .tab.active {
      border-bottom-color: #f43f5e;
      color: #f43f5e;
    }

    /* ── KPI Grid ── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .agrupamento-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .agrupamento-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .agrupamento-info {
      flex: 1;
    }

    .agrupamento-nome {
      font-size: 13px;
      font-weight: 500;
      color: var(--text);
      margin-bottom: 4px;
    }

    .agrupamento-stats {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: var(--muted);
    }

    .stat {
      display: inline-flex;
      gap: 4px;
    }

    .agrupamento-valor {
      text-align: right;
    }

    .agrupamento-valor .valor {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
    }

    .agrupamento-valor .percentual {
      font-size: 11px;
      color: var(--muted);
      margin-top: 2px;
    }

    /* ── Cards ── */
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 22px;
      margin-bottom: 20px;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .card-title {
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      font-size: 15px;
      letter-spacing: -0.3px;
      margin: 0;
    }

    .card-sub {
      font-size: 11.5px;
      color: var(--muted);
      margin-top: 2px;
      margin: 0;
    }

    /* ── Table ── */
    .table-wrapper {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .data-table thead {
      background: rgba(255, 255, 255, 0.04);
      border-bottom: 1px solid var(--border);
    }

    .data-table th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }

    .data-table tbody tr {
      border-bottom: 1px solid var(--border);
      transition: background 0.2s;
    }

    .data-table tbody tr:hover {
      background: rgba(255, 255, 255, 0.04);
    }

    .data-table tbody tr.pago {
      opacity: 0.6;
    }

    .data-table td {
      padding: 12px;
      color: var(--text);
    }

    .cell-nome {
      font-weight: 500;
    }

    .cell-valor {
      font-weight: 600;
      color: #34d399;
    }

    .cell-data {
      color: var(--muted);
    }

    .cell-dias {
      text-align: center;
    }

    .cell-dias .positivo {
      color: #fb923c;
      font-weight: 500;
    }

    .cell-status {
      text-align: center;
    }

    .status-pago {
      background: rgba(52, 211, 153, 0.2);
      color: #34d399;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 500;
      font-size: 10px;
    }

    .status-aberto {
      background: rgba(100, 116, 139, 0.2);
      color: #cbd5e1;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 500;
      font-size: 10px;
    }

    .status-vencido {
      background: rgba(244, 63, 94, 0.2);
      color: #f43f5e;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 500;
      font-size: 10px;
    }

    /* ── Filtros ── */
    .table-filters {
      display: flex;
      gap: 8px;
    }

    .select-status {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: #34d399;
      font-size: 12px;
      font-family: 'Outfit', sans-serif;
      padding: 6px 10px;
      outline: none;
      cursor: pointer;
    }

    /* ── Responsivo ── */
    @media (max-width: 1100px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .agrupamentos-row {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
      }

      .tabs {
        flex-direction: column;
      }

      .tab {
        padding: 8px 12px;
      }

      .agrupamento-item {
        flex-direction: column;
        align-items: flex-start;
      }

      .agrupamento-valor {
        margin-top: 8px;
        width: 100%;
      }
    }
  `],
})
export class TaxaComponent implements OnInit {
  private readonly recebimentoColunasProvider = new TaxaRecebimentoColumnProvider();
  private readonly pagamentoColunasProvider = new TaxaPagamentoColumnProvider();

  protected readonly colunasRecebimento = this.recebimentoColunasProvider.getColunas();
  protected readonly colunasPagamento = this.pagamentoColunasProvider.getColunas();
  protected readonly nomeArquivoRecebimento = this.recebimentoColunasProvider.getNomeArquivoExport();
  protected readonly nomeArquivoPagamento = this.pagamentoColunasProvider.getNomeArquivoExport();

  protected readonly svc = inject(TaxaService);
  private readonly excelExport = inject(ExcelExportService);

  abaAtiva: 'taxa-recebimento' | 'taxa-pagamento' = 'taxa-recebimento';
  readonly ajudaAberta = signal(false);

  readonly ajuda: HelpItem[] = [
    { titulo: 'Valor a Receber/Pagar', descricao: 'Soma de todos os títulos do período, independente de terem sido baixados.' },
    { titulo: 'Valor Recebido/Pago', descricao: 'Soma apenas dos títulos que já possuem data de baixa registrada.' },
    { titulo: 'Diferença', descricao: 'Valor esperado menos o valor realizado — quanto ainda falta ser liquidado.' },
    { titulo: 'Taxa', descricao: 'Percentual do valor esperado que já foi efetivamente realizado (recebido/pago).' },
  ];

  abrirAjuda(): void { this.ajudaAberta.set(true); }
  fecharAjuda(): void { this.ajudaAberta.set(false); }

  ngOnInit(): void {
    this.svc.carregar(this.svc.dataInicio(), this.svc.dataFim());
  }

  onDataInicio(v: string): void { this.svc.dataInicio.set(v); }
  onDataFim(v: string): void { this.svc.dataFim.set(v); }
  recarregar(): void { this.svc.carregar(this.svc.dataInicio(), this.svc.dataFim()); }

  onGranularidadeRecebimentoChange(v: string): void {
    this.svc.setGranularidadeRecebimento(v as 'dia' | 'mes');
  }
  onGranularidadePagamentoChange(v: string): void {
    this.svc.setGranularidadePagamento(v as 'dia' | 'mes');
  }

  exportarTaxaPorCliente(): void {
    const dados = this.svc.taxaPorCliente().map(c => ({
      'Cliente': c.label,
      'Valor Esperado (R$)': c.valorEsperado,
      'Valor Recebido (R$)': c.valorPago,
      'Taxa (%)': c.taxaPagamento.toFixed(2),
      '% do Total': c.percentualDoTotal.toFixed(2),
    }));
    this.excelExport.exportar(dados, 'taxa_recebimento_por_cliente');
  }

  exportarTaxaPorFornecedor(): void {
    const dados = this.svc.taxaPorFornecedor().map(f => ({
      'Fornecedor': f.label,
      'Valor Esperado (R$)': f.valorEsperado,
      'Valor Pago (R$)': f.valorPago,
      'Taxa (%)': f.taxaPagamento.toFixed(2),
      '% do Total': f.percentualDoTotal.toFixed(2),
    }));
    this.excelExport.exportar(dados, 'taxa_pagamento_por_fornecedor');
  }
}