import { Component, OnInit, inject, signal } from '@angular/core';
import { EstoqueService }             from '../../../../shared/services/estoque/estoque.service';
import { KpiCardComponent }           from '../../../../shared/components/kpi-card/kpi-card';
import { KpiCardInvertComponent }     from '../../../../shared/components/kpi-card-invert/kpi-card';
import { DonutChartComponent }        from '../../../../shared/components/donut-chart/donut-chart';
import { DonutChartEmpComponent }     from '../../../../shared/components/donut-chart-emp/donut-chart';
import { TopDevedoresBarComponent }   from '../../../../shared/components/line-bar/line-bar';
import { DataTableComponent }         from '../../../../shared/components/data-table/data-table';
import { ExcelExportService } from '../../../../shared/services/excel-export.service';
import { HelpItem } from '../../../../shared/models/config.models';
import { EstoqueColumnProvider } from '../../../../shared/components/tables/sances/estoque/column-providers';
import { MultiSelectFilterComponent } from "../../../../shared/components/multi-select-filter/pessoa_filter";


@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [
    KpiCardComponent,
    KpiCardInvertComponent,
    DonutChartComponent,
    DonutChartEmpComponent,
    TopDevedoresBarComponent,
    DataTableComponent,
    MultiSelectFilterComponent
],
  template: `
    <div class="page">

      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard de <span>Estoque</span></h1>

          <p class="page-sub">
            Última atualização:
            <strong>{{ svc.ultimaAtualizacaoFormatada() }}</strong>

            • Próxima atualização:
            <strong>{{ svc.proximaAtualizacaoFormatada() }}</strong>
          </p>
        </div>

        <div class="header-right">
          <app-multi-select-filter
            label="Peças"
            icon="🔩"
            [opcoes]="svc.opcoesPecas()"
            [selecionados]="svc.filtroPecas()"
            (toggleId)="svc.togglePecas($event)"
            (toggleTodasEvt)="svc.toggleTodasPecas()"
          />
          <div class="pecas-picker" role="tablist" aria-label="Categoria de peças">
            @for (categoria of svc.opcoesCategoria(); track categoria) {
              <button
                type="button"
                role="tab"
                class="btn-peca"
                [class.btn-peca--ativo]="svc.filtroCategorias().has(categoria)"
                [attr.aria-selected]="svc.filtroCategorias().has(categoria)"
                (click)="svc.toggleCategoria(categoria)"
              >
                {{ categoria }}
              </button>
            }
          </div>

          <div class="periodo-picker">
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
                                  📦 Dashboard Estoque
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
                                          @case ("Valor do Estoque") { 💰 }
                                          @case ("Quantidade de Itens") { 📄 }
                                          @case ("Custo Médio") { 💵 }
                                          @case ("Produtos com Saldo") { 📦 }
                                          @case ("Valor por Empresa") { 🏆 }
                                          @case ("Distribuição por Empresa") { ⏳ }
                                          @case ("Maiores Produtos") { 🏆 }
                                          @case ("Por Categoria") { 🔧 }
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
                                  Todos os indicadores respeitam o período e as empresas
                                  selecionadas no filtro global.
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
          label="Valor do Estoque"
          icon="💰"
          variant="success"
          [value]="svc.kpis().valorEstoqueTotal"
          valueColor="#F2A93B"
          [isCurrency]="true"
          [showDelta]="false"
        />
        <app-kpi-card-invert
          label="Quantidade de Itens"
          icon="📄"
          variant="info"
          [value]="svc.kpis().qtdItens"
          valueColor="#38BDF8"
          [isCurrency]="false"
          [showDelta]="false"
        />
        <app-kpi-card
          label="Custo Médio"
          icon="💵"
          variant="info"
          [value]="svc.kpis().custoMedioGeral"
          valueColor="#38BDF8"
          [isCurrency]="true"
          [showDelta]="false"
        />
        <app-kpi-card
          label="Produtos com Saldo"
          icon="📦"
          variant="success"
          [value]="svc.kpis().produtosComSaldo"
          valueColor="#1F8A8C"
          [isCurrency]="false"
          [showDelta]="false"
        />
      </div>

      <div class="charts-row">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Valor por Empresa</h2>
              <p class="card-sub">Total em estoque</p>
            </div>
          </div>
          <app-top-devedores-bar
            [data]="svc.valorPorEmpresa()"
            [valueColors]="['#F2A93B','#F2A93B']"
            [showDays]="false"
            [showPercentage]="true"
            [barColors]="['#F2A93B','#F2A93B']"
          />
        </div>

        <div class="card donut-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Distribuição por Empresa</h2>
              <p class="card-sub">% do valor total em estoque</p>
            </div>
          </div>
          <app-donut-chart-emp
            [faixas]="svc.distribuicaoPorEmpresa()"
            [totalTitulos]="svc.produtosFiltrados().length"
          />
        </div>
      </div>

      <div class="charts-row">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Maiores Produtos</h2>
              <p class="card-sub">Por valor total em estoque</p>
            </div>
            <button class="btn-export-mini" (click)="exportarMaioresProdutos()">
              📊 Excel
            </button>
          </div>
          <app-top-devedores-bar
            [data]="svc.maioresProdutos()"
            [valueColors]="['#1F8A8C']"
            [showDays]="false"
            [showPercentage]="true"
            [barColors]="['#1F8A8C']"
          />
        </div>

        <div class="card donut-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Por Categoria</h2>
              <p class="card-sub">Elétrica, Motor e demais</p>
            </div>
          </div>
          <app-donut-chart
            [faixas]="svc.porCategoria()"
            [totalClientes]="svc.kpis().qtdItens"
          />
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Produtos em Estoque</h2>
            <p class="card-sub">
              {{ svc.produtosFiltrados().length }} produtos · última posição do período
            </p>
          </div>

            <button class="btn-export-mini" (click)="exportarProdutosEstoque()">
              📊 Excel
            </button>
        </div>

        <app-data-table
          [dados]="svc.produtosFiltrados()"
          [colunas]="colunas"
        />
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
      background:rgba(242,169,59,.15);
      color:#F2A93B;
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
      background:#F2A93B;
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
      border-color:#F2A93B;
      box-shadow:0 10px 25px rgba(242,169,59,.12);
  }

  .help-icon{
      width:52px;
      height:52px;
      border-radius:14px;
      display:flex;
      align-items:center;
      justify-content:center;
      background:rgba(242,169,59,.12);
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
      background:#F2A93B;
      color:#141922;
      border:none;
      padding:10px 24px;
      border-radius:10px;
      font-weight:600;
      cursor:pointer;
      transition:.2s;
  }

  .btn-entendi:hover{
      background:#c9860f;
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
    .page { display: flex; flex-direction: column; gap: 24px; padding: 20px; }

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
      background: linear-gradient(90deg,#F2A93B,#F2A93B);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .page-sub { color: var(--muted); font-size: 13px; margin-top: 5px; }

    .header-right {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    }

    .pecas-picker { display: flex; gap: 6px; }
    .btn-peca {
      background: rgba(255,255,255,.06); border: 1px solid var(--border);
      color: var(--muted); font-size: 12px; font-family: 'Outfit', sans-serif;
      padding: 6px 14px; border-radius: 20px; cursor: pointer; transition: .2s;
    }
    .btn-peca:hover { border-color: #F2A93B; color: var(--text); }
    .btn-peca--ativo {
      background: rgba(242,169,59,.16); border-color: #F2A93B; color: #F2A93B;
    }

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
      background: rgba(242,169,59,.14); border: 1px solid rgba(242,169,59,.3);
      color: #F2A93B; font-size: 12px; font-family: 'Outfit', sans-serif;
      font-weight: 500; padding: 5px 14px; border-radius: 8px;
      cursor: pointer; transition: background .2s;
    }
    .btn-filtrar:hover { background: rgba(242,169,59,.25); }

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

  .chart-controls { display: flex; gap: 8px; }
  .select-mini {
    background: rgba(255,255,255,.06); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text); font-size: 12px;
    font-family: 'Outfit', sans-serif; padding: 5px 10px; outline: none;
    cursor: pointer;
  }

  .help-btn:hover{
      background:#F2A93B;
      color:#141922;
      border-color:#F2A93B;
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

    /* ── Botão de exportar excel ── */
    .btn-export-mini {
      background: rgba(242,169,59,.12); border: 1px solid rgba(242,169,59,.3);
      color: #F2A93B; font-size: 11px; padding: 5px 12px; border-radius: 6px;
      cursor: pointer; font-family: 'Outfit', sans-serif; font-weight: 500;
      transition: background .2s;
    }
    .btn-export-mini:hover { background: rgba(242,169,59,.22); }

    /* ── Responsivo ── */
    @media (max-width: 1100px) {
      .kpi-grid   { grid-template-columns: repeat(2, 1fr); }
      .charts-row { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .kpi-grid { grid-template-columns: 1fr; }
      .periodo-picker { flex-wrap: wrap; }
    }
  `],
})
export class EstoqueComponent implements OnInit {
  private readonly colunasProvider = new EstoqueColumnProvider();
  protected readonly colunas = this.colunasProvider.getColunas();
  protected readonly nomeArquivo = this.colunasProvider.getNomeArquivoExport();


  protected readonly svc = inject(EstoqueService);

  readonly ajudaAberta = signal(false);

  readonly ajuda: HelpItem[] = [
    {
      titulo: 'Valor do Estoque',
      descricao:
        'Soma financeira (saldo × custo médio) de todos os produtos na posição mais recente do período selecionado.'
    },
    {
      titulo: 'Quantidade de Itens',
      descricao:
        'Quantidade de produtos distintos com registro na última posição de estoque do período.'
    },
    {
      titulo: 'Custo Médio',
      descricao:
        'Custo médio ponderado por unidade, calculado dividindo o Valor do Estoque pela quantidade física total.'
    },
    {
      titulo: 'Produtos com Saldo',
      descricao:
        'Quantidade de produtos com saldo físico maior que zero na última posição do período.'
    },
    {
      titulo: 'Valor por Empresa',
      descricao:
        'Ranking por empresa do valor financeiro em estoque.'
    },
    {
      titulo: 'Distribuição por Empresa',
      descricao:
        'Participação percentual de cada empresa no valor total em estoque.'
    },
    {
      titulo: 'Maiores Produtos',
      descricao:
        'Ranking dos produtos com maior valor financeiro em estoque.'
    },
    {
      titulo: 'Por Categoria',
      descricao:
        'Distribuição do valor em estoque entre as categorias de peças (Elétrica, Motor, etc.).'
    },
    {
      titulo: 'Evolução Diária',
      descricao:
        'Mostra a evolução diária ou mensal do valor/saldo em estoque ao longo do período selecionado.'
    },
    {
      titulo: 'Última Atualização',
      descricao:
        'Data e horário da última sincronização realizada pelo processo ETL.'
    },
    {
      titulo: 'Filtros',
      descricao:
        'O período afeta todos os indicadores, inclusive a tabela. O filtro de categoria (Peças) afeta os KPIs, os gráficos e os rankings — mas não filtra a tabela de produtos, que sempre mostra todas as categorias da empresa selecionada.'
    }
  ];

  abrirAjuda(): void {
    this.ajudaAberta.set(true);
  }

  fecharAjuda(): void {
    this.ajudaAberta.set(false);
  }

  ngOnInit(): void {
    this.svc.carregar();
  }

  recarregar(): void {
    this.svc.carregar();
  }

  private readonly excelExport = inject(ExcelExportService);

  exportarMaioresProdutos(): void {
    const dados = this.svc.maioresProdutos().map(d => ({
      'Produto': d.nome,
      'Valor Total (R$)': d.valor,
      'Percentual (%)': d.percentual.toFixed(2),
    }));

    this.excelExport.exportar(dados, 'maiores_produtos_estoque');
  }

  exportarProdutosEstoque(): void {
    const dados = this.svc.produtosFiltrados().map(p => ({
      'Código': p.codigo_produto,
      'Empresa': p.empresa_nome,
      'Produto': p.produto_descricao,
      'Categoria': p.categoria,
      'Grupo': p.grupo,
      'Saldo': p.qtd_estoque,
      'Custo Médio (R$)': p.valor_estoque_custo,
      'Valor em Estoque (R$)': p.valor_estoque_venda,
      'Data': p.data_processamento,
    }));

    this.excelExport.exportar(dados, 'produtos_em_estoque');
  }

}