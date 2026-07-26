import { Component, input, OnChanges, SimpleChanges } from '@angular/core';
import {
  ColDef, GridApi, GridReadyEvent, ModuleRegistry, AllCommunityModule,
} from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { CellFormatters } from '../tables/cell-formatters';

ModuleRegistry.registerModules([AllCommunityModule]);

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
      <span class="count">{{ dados().length }} registros</span>
      <button class="btn-export" (click)="exportarCsv()">⬇ CSV</button>
    </div>

    <ag-grid-angular
      class="ag-theme-alpine-dark ag-grid-inadimplencia"
      [rowData]="dados()"
      [columnDefs]="colunas()"
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
    .toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
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
export class DataTableComponent<T = any> implements OnChanges {
  // ─── Inputs genéricos — o componente não sabe mais o "domínio" ─
  readonly dados = input.required<T[]>();
  readonly colunas = input.required<ColDef<T>[]>();
  readonly nomeArquivo = input<string>('exportacao');

  private gridApi!: GridApi<T>;
  quickFilter = '';

  readonly defaultCol: ColDef<T> = {
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: false,
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dados'] && this.gridApi) {
      this.gridApi.setGridOption('rowData', this.dados());
    }
  }

  onGridReady(e: GridReadyEvent<T>): void {
    this.gridApi = e.api;
    this.gridApi.sizeColumnsToFit();
  }

  onBusca(valor: string): void {
    this.quickFilter = valor;
  }

  exportarCsv(): void {
    this.gridApi?.exportDataAsCsv({
      fileName: `${this.nomeArquivo()}_${new Date().toISOString().split('T')[0]}.csv`,
      processCellCallback: (params) => {
        const col = params.column.getColId();
        if (col === 'data_vencimento' || col === 'data_baixa') {
          return CellFormatters.data(params.value);
        }
        return params.value;
      },
    });
  }
}