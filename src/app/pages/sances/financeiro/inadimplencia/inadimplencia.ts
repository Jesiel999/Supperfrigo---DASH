import { Component, OnInit, inject, signal } from '@angular/core';
import { InadimplenciaService }       from '../../../../shared/services/inadimplencia.service';
import { LineChartComponent } from '../../../../shared/components/inadimplencia/line-chart/line-chart';
import { KpiCardComponent }           from '../../../../shared/components/inadimplencia/kpi-card/kpi-card';
import { KpiCardInvertComponent }           from '../../../../shared/components/inadimplencia/kpi-card-invert/kpi-card';
import { DonutChartComponent }        from '../../../../shared/components/inadimplencia/donut-chart/donut-chart';
import { TopDevedoresBarComponent }   from '../../../../shared/components/inadimplencia/line-bar/line-bar';
import { DataTableComponent }         from '../../../../shared/components/inadimplencia/data-table/data-table';
import { MultiSelectFilterComponent } from '../../../../shared/components/multi-select-filter/pessoa_filter';

interface HelpItem {
  titulo: string;
  descricao: string;
}

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
    MultiSelectFilterComponent,
  ],
  template: `
    <div class="page">

      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard de <span>Inadimplência</span></h1>
          

          <p class="page-sub">
            Última atualização:
            <strong>{{ svc.ultimaAtualizacaoFormatada() }}</strong>

            • Próxima atualização:
            <strong>{{ svc.proximaAtualizacaoFormatada() }}</strong>
          </p>
        </div>

        <div class="header-right">
          <app-multi-select-filter
            label="Cliente"
            icon="🙋"
            [opcoes]="svc.opcoesPessoa()"
            [selecionados]="svc.filtroPessoas()"
            (toggleId)="svc.togglePessoa($event)"
            (toggleTodasEvt)="svc.toggleTodasPessoas()"
          />

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
            <button
                class="help-btn"
                (click)="abrirAjuda()"
                title="Ajuda do Dashboard">
                <span>?</span>
            </button>
            @if (ajudaAberta()) {
              <div class="help-backdrop" (click)="fecharAjuda()">
                  <div class="help-modal" (click)="$event.stopPropagation()">
                      <div class="help-header">
                          <div>
                              <div class="help-badge">
                                  📊 Dashboard Inadimplência
                              </div>
                              <h2>Como interpretar este Dashboard</h2>
                              <p>
                                  Entenda o significado de cada indicador apresentado
                                  nesta tela e como utilizá-los na tomada de decisão.
                              </p>
                          </div>
                          <button class="close-btn" (click)="fecharAjuda()">
                              ✕
                          </button>
                      </div>
                      <div class="help-body">
                          @for(item of ajuda; track item.titulo){
                              <div class="help-card">
                                  <div class="help-icon">
                                      @switch (item.titulo) {
                                          @case ("Total Inadimplente") { 💰 }
                                          @case ("Quantidade de Títulos") { 📄 }
                                          @case ("Ticket Médio") { 💵 }
                                          @case ("Clientes Inadimplentes") { 👥 }
                                          @case ("Maiores Devedores") { 🏆 }
                                          @case ("Faixa de Atraso") { ⏳ }
                                          @case ("Evolução Diária") { 📈 }
                                          @case ("Última Atualização") { 🔄 }
                                          @default { ℹ️ }

                                      }
                                  </div>
                                  <div>
                                      <h4>{{item.titulo}}</h4>

                                      <p>{{item.descricao}}</p>
                                  </div>
                              </div>
                          }
                      </div>
                      <div class="help-footer">
                          <div class="footer-info">
                              <strong>Dica</strong>
                              <span>
                                  Todos os indicadores respeitam os filtros de período e empresas selecionadas.
                              </span>
                          </div>
                          <button
                              class="btn-entendi"
                              (click)="fecharAjuda()">
                              Entendi
                          </button>
                      </div>
                  </div>
              </div>
              }
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
        <app-kpi-card-invert
          label="Quantidade de Títulos"
          icon="✅"
          variant="success"
          [value]="svc.kpis().qtdTitulosAtual"
          [delta]="svc.kpis().variacaoTitulos"
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
        <app-kpi-card
          label="Clientes Inadimplentes"
          icon="👥"
          variant="warning"
          [value]="svc.kpis().clientesInadimplentes"
          [delta]="svc.kpis().variacaoClientes"
          [isCurrency]="false"
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
        </div>

        <app-data-table [clientes]="svc.clientesFiltrados()" />
      </div>

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

  readonly ajudaAberta = signal(false);

  readonly ajuda: HelpItem[] = [
    {
      titulo: 'Total Inadimplente',
      descricao:
        'Representa a soma financeira de todos os títulos vencidos e ainda não baixados dentro do período selecionado.'
    },
    {
      titulo: 'Quantidade de Títulos',
      descricao:
        'Quantidade total de títulos inadimplentes considerados nos indicadores.'
    },
    {
      titulo: 'Ticket Médio',
      descricao:
        'Valor médio dos títulos inadimplentes. É calculado dividindo o Total Inadimplente pela Quantidade de Títulos.'
    },
    {
      titulo: 'Clientes Inadimplentes',
      descricao:
        'Quantidade de clientes distintos que possuem pelo menos um título em atraso.'
    },
    {
      titulo: 'Maiores Devedores',
      descricao:
        'Ranking dos clientes com maior valor financeiro inadimplente.'
    },
    {
      titulo: 'Faixa de Atraso',
      descricao:
        'Distribuição dos títulos conforme a quantidade de dias em atraso.'
    },
    {
      titulo: 'Evolução Diária',
      descricao:
        'Mostra a evolução diária dos valores inadimplentes considerando a data de vencimento.'
    },
    {
      titulo: 'Última Atualização',
      descricao:
        'Data e horário da última sincronização realizada pelo processo ETL.'
    },
    {
      titulo: 'Filtros',
      descricao:
        'O período afeta todos os indicadores, inclusive a tabela. Já o filtro de Cliente afeta os KPIs, o gráfico, os maiores devedores e as faixas de atraso — mas não filtra a tabela de títulos, que sempre mostra todos os clientes.'
    }
  ];

  abrirAjuda(): void {
    this.ajudaAberta.set(true);
  }

  fecharAjuda(): void {
    this.ajudaAberta.set(false);
  }

  ngOnInit(): void {
    this.svc.carregar(this.svc.dataInicio(), this.svc.dataFim());
  }

  onDataInicio(v: string): void { this.svc.dataInicio.set(v); }
  onDataFim(v: string): void    { this.svc.dataFim.set(v); }

  recarregar(): void {
    this.svc.carregar(this.svc.dataInicio(), this.svc.dataFim());
  }
}