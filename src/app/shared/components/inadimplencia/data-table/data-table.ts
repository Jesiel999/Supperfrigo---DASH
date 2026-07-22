import { Component, input, OnChanges, SimpleChanges } from '@angular/core';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  CellClassParams,
  ValueFormatterParams,
  ICellRendererParams,
  ModuleRegistry,
  AllCommunityModule,
} from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { ClienteInadimplente } from '../../../models/financeiro.models';

ModuleRegistry.registerModules([AllCommunityModule]);

// ── Formata "YYYY-MM-DD" → "DD/MM/AAAA" ──────────────────────────
function fmtData(valor: string | null | undefined): string {
  if (!valor) return '—';
  // Aceita "YYYY-MM-DD" ou "YYYY-MM-DD HH:MM:SS"
  const parte = valor.split(' ')[0].split('T')[0];
  const [a, m, d] = parte.split('-');
  if (!a || !m || !d) return valor;
  return `${d}/${m}/${a}`;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [AgGridAngular],
  template: `
    <div class="toolbar">
      <div class="busca-wrap">
        <span class="busca-icon">🔍</span>
        <input
          class="input-busca"
          type="text"
          placeholder="Buscar em todos os campos…"
          (input)="onBusca($any($event.target).value)"
        />
      </div>
      <span class="count">{{ clientes().length }} títulos</span>
      <button class="btn-export" (click)="exportarCsv()">⬇ CSV</button>
    </div>

    <ag-grid-angular
      class="ag-theme-alpine-dark ag-grid-inadimplencia"
      [rowData]="clientes()"
      [columnDefs]="colunas"
      [defaultColDef]="defaultCol"
      [quickFilterText]="quickFilter"
      [pagination]="true"
      [paginationPageSize]="50"
      [animateRows]="true"
      [rowHeight]="44"
      [headerHeight]="40"
      (gridReady)="onGridReady($event)"
    />
  `,
  styles: [`
    :host { display: block; }

    /* ── Toolbar ── */
    .toolbar {
      display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
    }
    .busca-wrap {
      flex: 1; display: flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,.06); border: 1px solid var(--border);
      border-radius: 8px; padding: 0 10px;
    }
    .busca-icon { font-size: 13px; color: var(--muted, #64748b); }
    .input-busca {
      flex: 1; background: transparent; border: none; outline: none;
      color: var(--text, #e2e8f0); font-size: 12.5px;
      font-family: 'Outfit', sans-serif; padding: 7px 0;
    }
    .input-busca::placeholder { color: var(--muted, #64748b); }

    .count { font-size: 11.5px; color: var(--muted, #64748b); white-space: nowrap; }

    .btn-export {
      background: rgba(244,63,94,.12); border: 1px solid rgba(244,63,94,.3);
      color: #f43f5e; font-size: 11px; padding: 6px 14px; border-radius: 6px;
      cursor: pointer; font-family: 'Outfit', sans-serif; font-weight: 500;
      transition: background .2s; white-space: nowrap;
    }
    .btn-export:hover { background: rgba(244,63,94,.22); }

    /* ── AG Grid tema dark ── */
    .ag-grid-inadimplencia {
      width: 100%; height: 480px;
      --ag-background-color: transparent;
      --ag-header-background-color: rgba(255,255,255,0.03);
      --ag-odd-row-background-color: rgba(255,255,255,0.01);
      --ag-row-hover-color: rgba(255,255,255,0.04);
      --ag-border-color: rgba(255,255,255,0.06);
      --ag-header-foreground-color: #64748b;
      --ag-foreground-color: #e2e8f0;
      --ag-font-family: 'Outfit', sans-serif;
      --ag-font-size: 13px;
      --ag-selected-row-background-color: rgba(244,63,94,0.08);
      --ag-row-border-color: rgba(255,255,255,0.03);
      --ag-cell-horizontal-padding: 14px;
      --ag-header-column-separator-display: none;
      --ag-pagination-panel-color: #64748b;
      --ag-input-focus-border-color: rgba(244,63,94,0.4);
    }
  `],
})
export class DataTableComponent implements OnChanges {
  readonly clientes = input.required<ClienteInadimplente[]>();

  private gridApi!: GridApi<ClienteInadimplente>;
  quickFilter = '';

  // ─── Default Col ────────────────────────────────────────────
  readonly defaultCol: ColDef<ClienteInadimplente> = {
    sortable:   true,
    filter:     true,
    resizable:  true,
    floatingFilter: false,
  };

  // ─── Colunas ────────────────────────────────────────────────
  readonly colunas: ColDef<ClienteInadimplente>[] = [
    {
      field:      'codigo',
      headerName: 'Código',
      width:      110,
      pinned:     'left',
    },
    {
      field:      'nome_empresa',
      headerName: 'Empresa',
      width:      150,
      pinned:     'left',
    },
    {
      field:      'nome_pessoa',
      headerName: 'Cliente',
      width:      200,
      pinned:     'left',
      cellRenderer: (p: ICellRendererParams<ClienteInadimplente, string>) =>
        `<span style="font-weight:500;color:#e2e8f0">${p.value ?? ''}</span>`,
    },
    {
      field:      'numero_documento',
      headerName: 'Documento',
      width:      140,
    },
    {
      field:      'ordem',
      headerName: 'Ordem',
      width:      100,
    },
    {
      field:      'descricao_forma_cobranca',
      headerName: 'Cobrança',
      width:      140,
    },
    {
      field:      'valor_total',
      headerName: 'Valor',
      width:      150,
      type:       'numericColumn',
      valueFormatter: (p: ValueFormatterParams<ClienteInadimplente, number>) =>
        p.value != null
          ? p.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          : '',
      cellStyle: {
        fontFamily: "'JetBrains Mono', monospace",
        color:      '#f43f5e',
        fontWeight: '600',
      },
    },
    {
      field:           'data_vencimento',
      headerName:      'Vencimento',
      width:           120,
      sort:            'asc',
      valueFormatter:  (p: ValueFormatterParams<ClienteInadimplente, string>) =>
        fmtData(p.value),
      getQuickFilterText: (p) =>
        `${p.value ?? ''} ${fmtData(p.value)}`,
    },
    {
      field:      'dias_atraso',
      headerName: 'Dias Atraso',
      width:      120,
      type:       'numericColumn',
      cellStyle: (p: CellClassParams<ClienteInadimplente, number>) => {

        const value = Number(p.value ?? 0);

        if (value > 90) {
          return {
            color: '#f43f5e',
            fontWeight: '600',
            fontFamily: "'JetBrains Mono', monospace"
          };
        }

        if (value > 60) {
          return {
            color: '#fb923c',
            fontWeight: '500',
            fontFamily: "'JetBrains Mono', monospace"
          };
        }

        if (value > 30) {
          return {
            color: '#fbbf24',
            fontWeight: '400',
            fontFamily: "'JetBrains Mono', monospace"
          };
        }

        return {
          color: '#94a3b8',
          fontWeight: '400',
          fontFamily: "'JetBrains Mono', monospace"
        };
      },
    },
    {
      field:      'status_financeiro',
      headerName: 'Status',
      width:      130,
      cellRenderer: (p: ICellRendererParams<ClienteInadimplente, string>) => {
        const estilos: Record<string, string> = {
          VENCIDO:   'background:rgba(244,63,94,.15);color:#f43f5e;border:1px solid rgba(244,63,94,.3)',
          PAGO:      'background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.2)',
        };
        const val   = (p.value ?? '').toUpperCase();
        const style = estilos[val];
        return `<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;${style}">${p.value ?? ''}</span>`;
      },
    },
  ];

  // ─── Lifecycle ──────────────────────────────────────────────
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clientes'] && this.gridApi) {
      this.gridApi.setGridOption('rowData', this.clientes());
    }
  }

  onGridReady(e: GridReadyEvent<ClienteInadimplente>): void {
    this.gridApi = e.api;
    this.gridApi.sizeColumnsToFit();
  }

  // ── quickFilterText = busca nativa do AG Grid em TODAS as colunas
  onBusca(valor: string): void {
    this.quickFilter = valor;
  }

  exportarCsv(): void {
    this.gridApi?.exportDataAsCsv({
      fileName:         `inadimplencia_${new Date().toISOString().split('T')[0]}.csv`,
      // Exporta as datas no formato dd/mm/aaaa no CSV também
      processCellCallback: (params) => {
        const col = params.column.getColId();
        if (col === 'data_vencimento' || col === 'data_baixa') {
          return fmtData(params.value);
        }
        return params.value;
      },
    });
  }
}
