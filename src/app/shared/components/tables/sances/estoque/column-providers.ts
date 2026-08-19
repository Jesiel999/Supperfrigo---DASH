import { ColDef } from 'ag-grid-community';
import { TableColumnProvider } from '../../table-column-provider';
import { CellFormatters } from '../../cell-formatters';
import { ItemEstoque } from '../../../../models/estoque.models';
import { DashboardColors } from '../../../../config/dashboard-colors';

export class EstoqueColumnProvider implements TableColumnProvider<ItemEstoque> {
  getColunas(): ColDef<ItemEstoque>[] {
    return [
      {
        field: 'codigo_produto',
        headerName: 'Código',
        width: 120,
        pinned: 'left',
      },
      {
        field: 'produto_descricao',
        headerName: 'Produto',
        width: 250,
        pinned: 'left',
      },
      {
        field: 'empresa_nome',
        headerName: 'Empresa',
        width: 160,
        pinned: 'left',
      },
      {
        field: 'categoria',
        headerName: 'Categoria',
        width: 140,
      },
      {
        field: 'grupo',
        headerName: 'Grupo',
        width: 140,
      },
      {
        field: 'qtd_estoque',
        headerName: 'Saldo',
        width: 120,
        type: 'numericColumn',
        valueFormatter: CellFormatters.numberValueFormatter<ItemEstoque>(),
      },
      {
        field: 'valor_estoque_custo',
        headerName: 'Custo Médio',
        width: 150,
        type: 'numericColumn',
        valueFormatter: CellFormatters.currencyValueFormatter<ItemEstoque>(),
        cellStyle: CellFormatters.currencyCellStyle(
          DashboardColors.estoque.valor
        ),
      },
      {
        field: 'valor_estoque_venda',
        headerName: 'Valor em Estoque',
        width: 170,
        type: 'numericColumn',
        valueFormatter: CellFormatters.currencyValueFormatter<ItemEstoque>(),
        cellStyle: CellFormatters.currencyCellStyle(
          DashboardColors.estoque.valor
        ),
      },
      {
        field: 'data_processamento',
        headerName: 'Data',
        width: 130,
        sort: 'desc',
        valueFormatter: CellFormatters.dataValueFormatter<ItemEstoque>(),
      },
    ];
  }

  getNomeArquivoExport(): string {
    return 'produtos_em_estoque';
  }
}