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
import { ListPmr } from '../../../models/financeiro.models';

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
  selector: 'app-data-table-pmr',
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
      <span class="count">{{ List().length }} títulos</span>
      <button class="btn-export" (click)="exportarCsv()">⬇ CSV</button>
    </div>

    <ag-grid-angular
      class="ag-theme-alpine-dark ag-grid-inadimplencia"
      [rowData]="List()"
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
export class DataTablePmrComponent implements OnChanges {
  readonly List = input.required<ListPmr[]>();

  private gridApi!: GridApi<ListPmr>;
  quickFilter = '';

  // ─── Default Col ────────────────────────────────────────────
  readonly defaultCol: ColDef<ListPmr> = {
    sortable:   true,
    filter:     true,
    resizable:  true,
    floatingFilter: false,
  };

  // ─── Colunas ────────────────────────────────────────────────
  readonly colunas: ColDef<ListPmr>[] = [
    {
      field:      'codigo_titulo',
      headerName: 'Título',
      width:      80,
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
      cellRenderer: (p: ICellRendererParams<ListPmr, string>) =>
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
      valueFormatter: (p: ValueFormatterParams<ListPmr, number>) =>
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
      field:           'data_emissao',
      headerName:      'Emissao',
      width:           120,
      sort:            'asc',
      valueFormatter:  (p: ValueFormatterParams<ListPmr, string>) =>
        fmtData(p.value),
      getQuickFilterText: (p) =>
        `${p.value ?? ''} ${fmtData(p.value)}`,
    },
    {
      field:           'data_baixa',
      headerName:      'Baixa',
      width:           120,
      sort:            'asc',
      valueFormatter:  (p: ValueFormatterParams<ListPmr, string>) =>
        fmtData(p.value),
      getQuickFilterText: (p) =>
        `${p.value ?? ''} ${fmtData(p.value)}`,
    },
    {
      field:      'dias_recebimento',
      headerName: 'Dias Recebimento',
      width:      120,
      type:       'numericColumn',
    },
  ];

  // ─── Lifecycle ──────────────────────────────────────────────
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['List'] && this.gridApi) {
      this.gridApi.setGridOption('rowData', this.List());
    }
  }

  onGridReady(e: GridReadyEvent<ListPmr>): void {
    this.gridApi = e.api;
    this.gridApi.sizeColumnsToFit();
  }

  // ── quickFilterText = busca nativa do AG Grid em TODAS as colunas
  onBusca(valor: string): void {
    this.quickFilter = valor;
  }

  exportarCsv(): void {
    this.gridApi?.exportDataAsCsv({
      fileName:         `pmr_${new Date().toISOString().split('T')[0]}.csv`,
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
