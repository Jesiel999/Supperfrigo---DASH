import { Component, input } from '@angular/core';

import {
  ColDef,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
  AllCommunityModule,
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

      <span class="count">
        {{ dados().length }} registros
      </span>
    </div>

    <ag-grid-angular
      class="ag-theme-alpine-dark ag-grid-inadimplencia"
      [rowData]="dados()"
      [columnDefs]="colunas()"
      [defaultColDef]="defaultCol"
      [quickFilterText]="quickFilter"
      [localeText]="localeText"
      [pagination]="true"
      [paginationPageSize]="50"
      [animateRows]="true"
      [rowHeight]="44"
      [headerHeight]="40"
      (gridReady)="onGridReady($event)"
    />

  `,

  styles: [`
    :host {
      display: block;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .busca-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,.06);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0 10px;
    }

    .busca-icon {
      font-size: 13px;
      color: var(--muted, #64748b);
    }

    .input-busca {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text, #e2e8f0);
      font-size: 12.5px;
      font-family: 'Outfit', sans-serif;
      padding: 7px 0;
    }

    .input-busca::placeholder {
      color: var(--muted, #64748b);
    }

    .count {
      font-size: 11.5px;
      color: var(--muted, #64748b);
      white-space: nowrap;
    }

    .btn-export {
      background: rgba(244,63,94,.12);
      border: 1px solid rgba(244,63,94,.3);
      color: #f43f5e;
      font-size: 11px;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-family: 'Outfit', sans-serif;
      font-weight: 500;
      transition: background .2s;
      white-space: nowrap;
    }

    .btn-export:hover {
      background: rgba(244,63,94,.22);
    }

    .ag-grid-inadimplencia {
      width: 100%;
      height: 480px;
      --ag-background-color: #141922;
      --ag-header-background-color: #1a202c;
      --ag-odd-row-background-color: #171d27;
      --ag-row-hover-color: #252d3a;
      --ag-border-color: #374151;
      --ag-header-foreground-color: #e2e8f0;
      --ag-foreground-color: #e2e8f0;
      --ag-font-family: 'Outfit', sans-serif;
      --ag-font-size: 13px;
      --ag-selected-row-background-color: rgba(244,63,94,.08);
      --ag-row-border-color: #252d3a;
      --ag-cell-horizontal-padding: 14px;
      --ag-header-column-separator-display: none;
      --ag-pagination-panel-color: #94a3b8;
      --ag-input-focus-border-color: #F2A93B;
    }

  `],
})
export class DataTableComponent<T = any> {

  readonly dados = input.required<T[]>();

  readonly colunas = input.required<ColDef<T>[]>();

  private gridApi!: GridApi<T>;

  quickFilter = '';

  readonly localeText: Record<string, string> = {
    filterOoo: 'Filtrar...',
    equals: 'Igual a',
    notEqual: 'Diferente de',
    contains: 'Contém',
    notContains: 'Não contém',
    startsWith: 'Começa com',
    endsWith: 'Termina com',
    blank: 'Em branco',
    notBlank: 'Não está em branco',
    andCondition: 'E',
    orCondition: 'OU',
    applyFilter: 'Aplicar',
    resetFilter: 'Limpar',
    clearFilter: 'Limpar',
    cancelFilter: 'Cancelar',
    textFilter: 'Filtro de texto',
    numberFilter: 'Filtro numérico',
    dateFilter: 'Filtro de data',
    selectAll: 'Selecionar todos',
    selectAllSearchResults: 'Selecionar todos os resultados',
    searchOoo: 'Pesquisar...',
    noMatches: 'Nenhum resultado encontrado',
    noRowsToShow: 'Nenhum registro encontrado',
    noResults: 'Nenhum resultado encontrado',
    sortAscending: 'Ordenar crescente',
    sortDescending: 'Ordenar decrescente',
    sortUnSort: 'Remover ordenação',
    columns: 'Colunas',
    filters: 'Filtros',
    columnFilter: 'Filtro da coluna',
    columnMenu: 'Menu da coluna',
    page: 'Página',
    to: 'até',
    of: 'de',
    next: 'Próxima',
    last: 'Última',
    first: 'Primeira',
    previous: 'Anterior',
    loadingOoo: 'Carregando...',
  };


  readonly defaultCol: ColDef<T> = {

    sortable: true,

    filter: true,

    resizable: true,

    floatingFilter: false,
  };

  onGridReady(e: GridReadyEvent<T>): void {

    this.gridApi = e.api;

    setTimeout(() => {
      this.gridApi.sizeColumnsToFit();
    });
  }

  onBusca(valor: string): void {

    this.quickFilter = valor;
  }

}