import { ColDef } from 'ag-grid-community';
import { TableColumnProvider } from '../table-column-provider';
import { CellFormatters } from '../cell-formatters';
import { ClienteInadimplente } from '../../../models/financeiro.models';

export class InadimplenciaColumnProvider implements TableColumnProvider<ClienteInadimplente> {
  getColunas(): ColDef<ClienteInadimplente>[] {
    return [
      { field: 'codigo', headerName: 'Código', width: 110, pinned: 'left' },
      { field: 'nome_empresa', headerName: 'Empresa', width: 150, pinned: 'left' },
      {
        field: 'nome_pessoa', headerName: 'Cliente', width: 200, pinned: 'left',
        cellRenderer: CellFormatters.nomeDestaqueCellRenderer<ClienteInadimplente>(),
      },
      { field: 'numero_documento', headerName: 'Documento', width: 140 },
      { field: 'ordem', headerName: 'Ordem', width: 100 },
      { field: 'descricao_forma_cobranca', headerName: 'Cobrança', width: 140 },
      {
        field: 'valor_total', headerName: 'Valor', width: 150, type: 'numericColumn',
        valueFormatter: CellFormatters.currencyValueFormatter<ClienteInadimplente>(),
        cellStyle: CellFormatters.currencyCellStyle('#f43f5e'),
      },
      {
        field: 'data_vencimento', headerName: 'Vencimento', width: 120, sort: 'asc',
        valueFormatter: CellFormatters.dataValueFormatter<ClienteInadimplente>(),
        getQuickFilterText: (p) => `${p.value ?? ''} ${CellFormatters.data(p.value)}`,
      },
      {
        field: 'dias_atraso', headerName: 'Dias Atraso', width: 120, type: 'numericColumn',
        cellStyle: CellFormatters.diasAtrasoCellStyle<ClienteInadimplente>(),
      },
      {
        field: 'status_financeiro', headerName: 'Status', width: 130,
        cellRenderer: CellFormatters.statusBadgeCellRenderer<ClienteInadimplente>({
          VENCIDO: 'background:rgba(244,63,94,.15);color:#f43f5e;border:1px solid rgba(244,63,94,.3)',
          PAGO: 'background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.2)',
        }),
      },
    ];
  }

  getNomeArquivoExport(): string {
    return 'inadimplencia';
  }
}