import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PmpPmrService } from '../../../../shared/services/pmp-pmr.service';
import { KpiCardComponent } from '../../../../shared/components/pmp-pmr/kpi-card/kpi-card';
import { DataTablePmrComponent } from '../../../../shared/components/pmp-pmr/data-table-pmr/data-table';
import { DataTablePmpComponent } from '../../../../shared/components/pmp-pmr/data-table-pmp/data-table';

@Component({
  selector: 'app-pmp-pmr',
  standalone: true,
  imports: [
    CommonModule,
    KpiCardComponent,
    DataTablePmpComponent,
    DataTablePmrComponent,
  ],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Análise <span>PMP & PMR</span></h1>
          <p class="page-sub">
            Última atualização:
            <strong>{{ svc.ultimaAtualizacaoFormatada() }}</strong>

            • Próxima atualização:
            <strong>{{ svc.proximaAtualizacaoFormatada() }}</strong>
          </p>
        </div>

        <div class="header-right">
          <div class="periodo-picker">
            <input
              type="date"
              class="input-date"
              [value]="svc.dataInicio()"
              (change)="onDataInicio($any($event.target).value)"
            />
            <span class="sep">→</span>
            <input
              type="date"
              class="input-date"
              [value]="svc.dataFim()"
              (change)="onDataFim($any($event.target).value)"
            />
            <button class="btn-filtrar" (click)="recarregar()">Filtrar</button>
          </div>
        </div>
      </div>

      <!-- Abas -->
      <div class="tabs">
        <button 
          class="tab" 
          [class.active]="abaAtiva === 'pmp'"
          (click)="abaAtiva = 'pmp'"
        >
          📊 PMP - Prazo Médio de Pagamento
        </button>
        <button 
          class="tab" 
          [class.active]="abaAtiva === 'pmr'"
          (click)="abaAtiva = 'pmr'"
        >
          📈 PMR - Prazo Médio de Recebimento
        </button>
      </div>

      <!-- ABA PMP -->
      <ng-container *ngIf="abaAtiva === 'pmp'">
        <!-- KPIs PMP -->
        <div class="kpi-grid">
          <app-kpi-card
            label="PMP — Dias"
            icon="⏱️"
            variant="info"
            [value]="svc.kpisPmp().pmpDias"
            [delta]="svc.kpisPmp().variacaoPmp"
            [isCurrency]="false"
            suffix=" dias"
          />
          <app-kpi-card
            label="Quantidade de Títulos"
            icon="📋"
            variant="warning"
            [value]="svc.kpisPmp().qtdTitulos"
            [delta]="svc.kpisPmp().variacaoQtd"
            [isCurrency]="false"
          />
          <app-kpi-card
            label="Valor Médio"
            icon="💰"
            variant="success"
            [value]="svc.kpisPmp().valorMedio"
            [delta]="svc.kpisPmp().variacaoValor"
            [isCurrency]="true"
          />
          <app-kpi-card
            label="Valor Total"
            icon="💵"
            variant="danger"
            [value]="svc.kpisPmp().valorTotal"
            [delta]="svc.kpisPmp().variacaoValor"
            [isCurrency]="true"
          />
        </div>

        <!-- Agrupamentos PMP -->
        <div class="agrupamentos-row">
          <div class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">PMP por Fornecedor</h2>
                <p class="card-sub">Top 10 maiores valores</p>
              </div>
            </div>
            <div class="agrupamento-list">
              <div *ngFor="let item of svc.agrupamentoPmpFornecedor()" class="agrupamento-item">
                <div class="agrupamento-info">
                  <div class="agrupamento-nome">{{ item.label }}</div>
                  <div class="agrupamento-stats">
                    <span class="stat">{{ item.pmpDias }} dias</span>
                    <span class="stat">{{ item.qtdTitulos }} títulos</span>
                  </div>
                </div>
                <div class="agrupamento-valor">
                  <div class="valor">{{ item.valorTotal | currency }}</div>
                  <div class="percentual">{{ item.percentualTotal.toFixed(1) }}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabela PMP -->
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Títulos — PMP</h2>
              <p class="card-sub">
                {{ svc.titulosPmp().length }} títulos
              </p>
            </div>
          </div>

          <app-data-table-pmp [List]="svc.titulosPmp()" />
        </div>
      </ng-container>

      <!-- ABA PMR -->
      <ng-container *ngIf="abaAtiva === 'pmr'">
        <!-- KPIs PMR -->
        <div class="kpi-grid">
          <app-kpi-card
            label="PMR — Dias"
            icon="⏱️"
            variant="info"
            [value]="svc.kpisPmr().pmrDias"
            [delta]="svc.kpisPmr().variacaoPmr"
            [isCurrency]="false"
            suffix=" dias"
          />
          <app-kpi-card
            label="Quantidade de Títulos"
            icon="📋"
            variant="warning"
            [value]="svc.kpisPmr().qtdTitulos"
            [delta]="svc.kpisPmr().variacaoQtd"
            [isCurrency]="false"
          />
          <app-kpi-card
            label="Valor Médio"
            icon="💰"
            variant="success"
            [value]="svc.kpisPmr().valorMedio"
            [delta]="svc.kpisPmr().variacaoValor"
            [isCurrency]="true"
          />
          <app-kpi-card
            label="Valor Total"
            icon="💵"
            variant="danger"
            [value]="svc.kpisPmr().valorTotal"
            [delta]="svc.kpisPmr().variacaoValor"
            [isCurrency]="true"
          />
        </div>

        <!-- Agrupamentos PMR -->
        <div class="agrupamentos-row">
          <div class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">PMR por Cliente</h2>
                <p class="card-sub">Top 10 maiores valores</p>
              </div>
            </div>
            <div class="agrupamento-list">
              <div *ngFor="let item of svc.agrupamentoPmrCliente()" class="agrupamento-item">
                <div class="agrupamento-info">
                  <div class="agrupamento-nome">{{ item.label }}</div>
                  <div class="agrupamento-stats">
                    <span class="stat">{{ item.pmrDias }} dias</span>
                    <span class="stat">{{ item.qtdTitulos }} títulos</span>
                  </div>
                </div>
                <div class="agrupamento-valor">
                  <div class="valor">{{ item.valorTotal | currency }}</div>
                  <div class="percentual">{{ item.percentualTotal.toFixed(1) }}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabela PMR -->
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Títulos — PMR</h2>
              <p class="card-sub">
                {{ svc.titulosPmr().length }} títulos
              </p>
            </div>
          </div>

          <app-data-table-pmr [List]="svc.titulosPmr()" />
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
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
      grid-template-columns: repeat(4, 1fr);
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
export class PmpPmrComponent implements OnInit {
  protected readonly svc = inject(PmpPmrService);
  abaAtiva: 'pmp' | 'pmr' = 'pmp';

  ngOnInit(): void {
    this.svc.carregar(this.svc.dataInicio(), this.svc.dataFim());
  }

  onDataInicio(v: string): void {
    this.svc.dataInicio.set(v);
  }

  onDataFim(v: string): void {
    this.svc.dataFim.set(v);
  }

  recarregar(): void {
    this.svc.carregar(this.svc.dataInicio(), this.svc.dataFim());
  }
}