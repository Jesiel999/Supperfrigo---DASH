import { Component, OnInit, inject } from '@angular/core';
import { InadimplenciaService }       from '../../../../shared/services/inadimplencia.service';
import { LineChartComponent } from '../../../../shared/components/inadimplencia/line-chart/line-chart';
import { KpiCardComponent }           from '../../../../shared/components/inadimplencia/kpi-card/kpi-card';
import { KpiCardInvertComponent }           from '../../../../shared/components/inadimplencia/kpi-card-invert/kpi-card';
import { DonutChartComponent }        from '../../../../shared/components/inadimplencia/donut-chart/donut-chart';
import { TopDevedoresBarComponent }   from '../../../../shared/components/inadimplencia/line-bar/line-bar';
import { DataTableComponent }         from '../../../../shared/components/inadimplencia/data-table/data-table';

@Component({
  selector: 'app-inadimplencia',
  standalone: true,
  imports: [
    KpiCardComponent,
    LineChartComponent,
    DonutChartComponent,
    TopDevedoresBarComponent,
    DataTableComponent,
    KpiCardInvertComponent,
  ],
  template: `
    <div class="page">

      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard de <span>Inadimplência</span></h1>
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

          <div class="live-badge">
            <span class="live-dot"></span>
            Ao vivo
          </div>
        </div>
      </div>

      <div class="kpi-grid">
        <app-kpi-card
          label="Total Inadimplente"
          icon="🔴"
          variant="danger"
          [value]="svc.kpis().totalInadimplente"
          [delta]="svc.kpis().variacaoTotal"
          [isCurrency]="true"
        />
        <app-kpi-card
          label="Clientes Inadimplentes"
          icon="👥"
          variant="warning"
          [value]="svc.kpis().clientesInadimplentes"
          [delta]="svc.kpis().variacaoClientes"
          [isCurrency]="false"
        />
        <app-kpi-card
          label="Ticket Médio"
          icon="💵"
          variant="info"
          [value]="svc.kpis().ticketMedio"
          [delta]="svc.kpis().variacaoTicket"
          [isCurrency]="true"
        />
        <app-kpi-card-invert
          label="Recuperado no Mês"
          icon="✅"
          variant="success"
          [value]="svc.kpis().recuperadoMes"
          [delta]="svc.kpis().variacaoRecuperado"
          [isCurrency]="true"
        />
      </div>

      <div class="charts-row">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Maiores Devedores</h2>
              <p class="card-sub">Por valor total inadimplente</p>
            </div>
          </div>
          <app-top-devedores-bar [data]="svc.topDevedores()" />
        </div>
        
        <div class="card donut-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Por Faixa de Atraso</h2>
              <p class="card-sub">Distribuição atual</p>
            </div>
          </div>
          <app-donut-chart
            [faixas]="svc.faixasAtraso()"
            [totalClientes]="svc.kpis().clientesInadimplentes"
          />
        </div>    
      </div>

      <div class="card chart-card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Evolução Diária — Inadimplência</h2>
          </div>
          <div class="legend">
            <div class="legend-item">
              <span class="legend-dot" style="background:#f43f5e"></span>
              Inadimplente
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background:#34d399"></span>
              Recuperado
            </div>
          </div>
        </div>
        <app-line-chart [pontos]="svc.pontosGrafico()" />
      </div>
      

      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Títulos Inadimplentes</h2>
            <p class="card-sub">
              {{ svc.clientesFiltrados().length }} títulos · ordenado por vencimento
            </p>
          </div>
          <div class="table-filters">
            <select
              class="select-status"
              [value]="svc.filtroStatus()"
              (change)="svc.setFiltroStatus($any($event.target).value)"
            >
              <option value="todos">Todos os status</option>
              <option value="VENCIDO">Vencido</option>
              <option value="PAGO">Pago</option>
            </select>
          </div>
        </div>

        <app-data-table [clientes]="svc.clientesFiltrados()" />
      </div>

    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 24px; }

    /* ── Header ── */
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 12px;
    }
    .page-title {
      font-family: 'Syne', sans-serif; font-size: 24px;
      font-weight: 800; letter-spacing: -.5px; line-height: 1.1;
    }
    .page-title span {
      background: linear-gradient(90deg,#f43f5e,#fb923c);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .page-sub { color: var(--muted); font-size: 13px; margin-top: 5px; }

    .header-right {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    }

    /* ── Período picker ── */
    .periodo-picker {
      display: flex; align-items: center; gap: 6px;
    }
    .input-date {
      background: rgba(255,255,255,.06); border: 1px solid var(--border);
      border-radius: 8px; color: var(--text); font-size: 12px;
      font-family: 'Outfit', sans-serif; padding: 5px 10px; outline: none;
      color-scheme: dark;
    }
    .sep { color: var(--muted); font-size: 12px; }
    .btn-filtrar {
      background: rgba(244,63,94,.14); border: 1px solid rgba(244,63,94,.3);
      color: #f43f5e; font-size: 12px; font-family: 'Outfit', sans-serif;
      font-weight: 500; padding: 5px 14px; border-radius: 8px;
      cursor: pointer; transition: background .2s;
    }
    .btn-filtrar:hover { background: rgba(244,63,94,.25); }

    /* ── Live badge ── */
    .live-badge {
      display: flex; align-items: center; gap: 6px;
      background: rgba(52,211,153,.1); border: 1px solid rgba(52,211,153,.25);
      color: #34d399; font-size: 11px; font-weight: 600;
      padding: 5px 12px; border-radius: 20px;
    }
    .live-dot {
      width: 6px; height: 6px; background: #34d399; border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%,100% { opacity:1; transform:scale(1); }
      50%      { opacity:.5; transform:scale(1.3); }
    }

    /* ── Grids ── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .charts-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
    }

    /* ── Cards ── */
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 22px;
    }
    .card-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px;
    }
    .card-title {
      font-family: 'Syne', sans-serif; font-weight: 700;
      font-size: 15px; letter-spacing: -.3px;
    }
    .card-sub { font-size: 11.5px; color: var(--muted); margin-top: 2px; }

    /* ── Legenda ── */
    .legend { display: flex; gap: 16px; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--muted); }
    .legend-dot  { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

    /* ── Filtros tabela ── */
    .table-filters { display: flex; gap: 8px; }
    .input-busca {
      background: rgba(255,255,255,.06); border: 1px solid var(--border);
      border-radius: 8px; color: var(--text); font-size: 12px;
      font-family: 'Outfit', sans-serif; padding: 6px 12px; outline: none; width: 190px;
    }
    .select-status {
      background: rgba(255,255,255,.06); border: 1px solid var(--border);
      border-radius: 8px; color: #34d399; font-size: 12px;
      font-family: 'Outfit', sans-serif; padding: 6px 10px; outline: none;
    }

    /* ── Faixas card ── */
    .faixas-list { display: flex; flex-direction: column; gap: 12px; }
    .faixa-row {
      display: grid;
      grid-template-columns: 10px 100px 1fr 40px;
      align-items: center;
      gap: 10px;
      font-size: 12px;
    }
    .faixa-dot   { width: 9px; height: 9px; border-radius: 50%; }
    .faixa-label { color: var(--text); }
    .faixa-bar-bg { background: rgba(255,255,255,.06); border-radius: 4px; height: 5px; overflow: hidden; }
    .faixa-bar    { height: 100%; border-radius: 4px; transition: width .4s; }
    .faixa-pct    { font-family: 'JetBrains Mono', monospace; font-size: 11px; text-align: right; }

    /* ── Responsivo ── */
    @media (max-width: 1100px) {
      .kpi-grid   { grid-template-columns: repeat(2, 1fr); }
      .charts-row { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .kpi-grid { grid-template-columns: 1fr; }
      .table-filters { flex-direction: column; }
      .periodo-picker { flex-wrap: wrap; }
    }
  `],
})
export class InadimplenciaComponent implements OnInit {
  protected readonly svc = inject(InadimplenciaService);

  ngOnInit(): void {
    this.svc.carregar(this.svc.dataInicio(), this.svc.dataFim());
  }

  onDataInicio(v: string): void { this.svc.dataInicio.set(v); }
  onDataFim(v: string): void    { this.svc.dataFim.set(v); }

  recarregar(): void {
    this.svc.carregar(this.svc.dataInicio(), this.svc.dataFim());
  }
}
