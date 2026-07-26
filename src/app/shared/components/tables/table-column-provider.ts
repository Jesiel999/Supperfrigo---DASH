import { ColDef } from 'ag-grid-community';

export interface TableColumnProvider<T> {
  getColunas(): ColDef<T>[];
  getNomeArquivoExport(): string;
}