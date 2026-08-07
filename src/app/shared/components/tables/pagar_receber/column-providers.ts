import { ColDef } from 'ag-grid-community';
import { TableColumnProvider } from '../table-column-provider';
import { CellFormatters } from '../cell-formatters';
import { TaxaApiItem } from '../../../models/taxa.models';

export class TaxaRecebimentoColumnProvider implements TableColumnProvider<TaxaApiItem> {
  getColunas(): ColDef<TaxaApiItem>[] {
    return [
      { field: 'codigo', headerName: 'Código', width: 110, pinned: 'left' },
      { field: 'nome_empresa', headerName: 'Empresa', width: 150, pinned: 'left' },
      {
        field: 'nome_pessoa', headerName: 'Cliente', width: 200, pinned: 'left',
        cellRenderer: CellFormatters.nomeDestaqueCellRenderer<TaxaApiItem>(),
      },
      { field: 'numero_documento', headerName: 'Documento', width: 140 },
      {
        field: 'valor_total', headerName: 'Valor', width: 150, type: 'numericColumn',
        valueFormatter: CellFormatters.currencyValueFormatter<TaxaApiItem>(),
        cellStyle: CellFormatters.currencyCellStyle('#34d399'),
      },
      {
        field: 'data_vencimento', headerName: 'Vencimento', width: 120, sort: 'asc',
        valueFormatter: CellFormatters.dataValueFormatter<TaxaApiItem>(),
      },
      {
        field: 'data_baixa', headerName: 'Recebido em', width: 130,
        valueFormatter: CellFormatters.dataValueFormatter<TaxaApiItem>(),
      },
      {
        field: 'status_financeiro', headerName: 'Status', width: 130,
        cellRenderer: CellFormatters.statusBadgeCellRenderer<TaxaApiItem>({
          PAGO: 'background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.2)',
          ABERTO: 'background:rgba(100,116,139,.15);color:#cbd5e1;border:1px solid rgba(100,116,139,.3)',
          VENCIDO: 'background:rgba(244,63,94,.15);color:#f43f5e;border:1px solid rgba(244,63,94,.3)',
        }),
      },
    ];
  }

  getNomeArquivoExport(): string {
    return 'taxa_recebimento';
  }
}

export class TaxaPagamentoColumnProvider implements TableColumnProvider<TaxaApiItem> {
  getColunas(): ColDef<TaxaApiItem>[] {
    return [
      { field: 'codigo', headerName: 'Código', width: 110, pinned: 'left' },
      { field: 'nome_empresa', headerName: 'Empresa', width: 150, pinned: 'left' },
      {
        field: 'nome_pessoa', headerName: 'Fornecedor', width: 200, pinned: 'left',
        cellRenderer: CellFormatters.nomeDestaqueCellRenderer<TaxaApiItem>(),
      },
      { field: 'numero_documento', headerName: 'Documento', width: 140 },
      {
        field: 'valor_total', headerName: 'Valor', width: 150, type: 'numericColumn',
        valueFormatter: CellFormatters.currencyValueFormatter<TaxaApiItem>(),
        cellStyle: CellFormatters.currencyCellStyle('#f43f5e'),
      },
      {
        field: 'data_vencimento', headerName: 'Vencimento', width: 120, sort: 'asc',
        valueFormatter: CellFormatters.dataValueFormatter<TaxaApiItem>(),
      },
      {
        field: 'data_baixa', headerName: 'Pago em', width: 130,
        valueFormatter: CellFormatters.dataValueFormatter<TaxaApiItem>(),
      },
      {
        field: 'status_financeiro', headerName: 'Status', width: 130,
        cellRenderer: CellFormatters.statusBadgeCellRenderer<TaxaApiItem>({
          PAGO: 'background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.2)',
          ABERTO: 'background:rgba(100,116,139,.15);color:#cbd5e1;border:1px solid rgba(100,116,139,.3)',
          VENCIDO: 'background:rgba(244,63,94,.15);color:#f43f5e;border:1px solid rgba(244,63,94,.3)',
        }),
      },
    ];
  }

  getNomeArquivoExport(): string {
    return 'excel';
  }
}