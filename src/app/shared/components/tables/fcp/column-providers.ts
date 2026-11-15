
import { ColDef } from 'ag-grid-community';
import { TableColumnProvider } from '../table-column-provider';
import { CellFormatters } from '../cell-formatters';
import { FcpTituloTable } from '../../../models/financeiro/fcp.models';
import { DashboardColors } from '../../../config/dashboard-colors';

const corValorTitulo = (
  situacao: string | null | undefined
): string => {
  const status = (situacao ?? '')
    .trim()
    .toLocaleUpperCase('pt-BR');

  if (status.includes('PAGO') || status.includes('POSITIVO')) {
    return DashboardColors.fcp.pago;
  }

  if (status.includes('VENCIDO') || status.includes('NEGATIVO')) {
    return DashboardColors.fcp.vencido;
  }

  return DashboardColors.fcp.valor_pagar;
};

export class FcpColumnProvider
  implements TableColumnProvider<FcpTituloTable> {

  getColunas(): ColDef<FcpTituloTable>[] {
    return [
      {
        field: 'codigo',
        headerName: 'Código',
        width: 110,
        pinned: 'left',
      },
      {
        field: 'id_pessoa',
        headerName: 'Código Fornecedor',
        width: 150,
        pinned: 'left',
      },
      {
        field: 'nome_fornecedor',
        headerName: 'Fornecedor',
        width: 400,
        pinned: 'left',
        cellRenderer:
          CellFormatters.nomeDestaqueCellRenderer<FcpTituloTable>(),
      },
      {
        field: 'nome_empresa',
        headerName: 'Empresa',
        width: 150,
      },
      {
        field: 'numero_documento',
        headerName: 'Documento',
        width: 150,
      },
      {
        field: 'parcela',
        headerName: 'Parcela',
        width: 100,
      },
      {
        field: 'valor_titulo',
        headerName: 'Valor título',
        width: 160,
        type: 'numericColumn',
        valueFormatter:
          CellFormatters.currencyValueFormatter<FcpTituloTable>(),
        cellStyle: (params) => ({
          color: corValorTitulo(params.data?.descricao_situacao),
          fontWeight: '600',
        }),
      },
      {
        field: 'data_vencimento',
        headerName: 'Vencimento',
        width: 150,
        sort: 'asc',
        valueFormatter:
          CellFormatters.dataValueFormatter<FcpTituloTable>(),
      },
      {
        field: 'origem',
        headerName: 'Origem',
        width: 200,
      },
      {
        field: 'status_financeiro',
        headerName: 'Status',
        width: 150,
        cellRenderer:
          CellFormatters.statusBadgeCellRenderer<FcpTituloTable>({
            PAGO: 'background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.2)',
            ABERTO: 'background:rgba(100,116,139,.15);color:#cbd5e1;border:1px solid rgba(100,116,139,.3)',
            VENCIDO: 'background:rgba(244,63,94,.15);color:#f43f5e;border:1px solid rgba(244,63,94,.3)',
          }),
      },
      {
        field: 'numero_conta_resultado',
        headerName: 'Número conta de resultado',
        width: 220,
      },
      {
        field: 'descricao_conta_resultado',
        headerName: 'Descrição conta de resultado',
        width: 300,
      },
      {
        field: 'data_emissao',
        headerName: 'Emissão',
        width: 150,
        valueFormatter:
          CellFormatters.dataValueFormatter<FcpTituloTable>(),
      },
      {
        field: 'data_competencia',
        headerName: 'Competência',
        width: 150,
        valueFormatter:
          CellFormatters.dataValueFormatter<FcpTituloTable>(),
      },
      {
        field: 'valor_nota',
        headerName: 'Valor nota',
        width: 160,
        type: 'numericColumn',
        valueFormatter:
          CellFormatters.currencyValueFormatter<FcpTituloTable>(),
        cellStyle: CellFormatters.currencyCellStyle(
          DashboardColors.fcp.valor_pagar
        ),
      },
    ];
  }

  getNomeArquivoExport(): string {
    return 'fcp';
  }
}
