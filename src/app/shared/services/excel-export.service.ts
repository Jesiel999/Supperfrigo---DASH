import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({ providedIn: 'root' })
export class ExcelExportService {

  private readonly formatoData = 'dd/mm/yyyy';
  private readonly formatoMoeda = '"R$" #,##0.00;[Red]-"R$" #,##0.00';

  // Identifica campos que representam datas
  private readonly camposData = [
    'data',
    'emissao',
    'competencia',
    'vencimento',
    'baixa',
    'pagamento',
    'recebimento',
    'gerado_em'
  ];

  // Identifica campos que representam valores financeiros
  private readonly camposMoeda = [
    'valor',
    'total',
    'saldo',
    'pago',
    'recebido',
    'custo',
    'despesa',
    'receita',
    'montante',
    'preco'
  ];

  exportar<T extends object>(
    dados: T[],
    nomeArquivo: string,
    nomeAba = 'Dados'
  ): void {

    if (!dados?.length) return;

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();

    const colunas = Object.keys(dados[0]);

    colunas.forEach((coluna, index) => {
      const nomeNormalizado = this.normalizar(coluna);
      const letra = XLSX.utils.encode_col(index);

      const ehData = this.camposData.some(campo =>
        nomeNormalizado.includes(campo)
      );

      const ehMoeda = this.camposMoeda.some(campo =>
        nomeNormalizado.includes(campo)
      );

      for (let linha = 2; linha <= dados.length + 1; linha++) {
        const endereco = `${letra}${linha}`;
        const celula = worksheet[endereco];

        if (!celula || celula.v == null) continue;

        if (ehData) {
          const serial = this.converterDataExcel(celula.v);

          if (serial !== null) {
            celula.v = serial;
            celula.t = 'n';
            celula.z = this.formatoData;
          }
        } else if (ehMoeda && typeof celula.v === 'number') {
          celula.t = 'n';
          celula.z = this.formatoMoeda;
        }
      }
    });

    // Ajusta a largura das colunas
    worksheet['!cols'] = colunas.map(coluna => ({
      wch: Math.max(
        coluna.length + 2,
        ...dados.map(item =>
          String((item as Record<string, unknown>)[coluna] ?? '').length + 2
        )
      )
    }));

    const intervalo = worksheet['!ref'];

    if (intervalo) {
      worksheet['!autofilter'] = {
        ref: intervalo
      };
    }

    worksheet['!freeze'] = {
      xSplit: 0,
      ySplit: 1,
      topLeftCell: 'A2',
      activePane: 'bottomLeft',
      state: 'frozen'
    };

    XLSX.utils.book_append_sheet(workbook, worksheet, nomeAba);

    const dataAtual = new Date().toISOString().slice(0, 10);

    XLSX.writeFile(
      workbook,
      `${nomeArquivo}_${dataAtual}.xlsx`
    );
  }

  private normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
  }

  private converterDataExcel(valor: unknown): number | null {
    if (valor instanceof Date && !isNaN(valor.getTime())) {
      return this.dataParaSerial(valor);
    }

    if (typeof valor !== 'string') return null;

    const texto = valor.trim();

    // Formato ISO: yyyy-mm-dd ou yyyy-mm-ddTHH:mm:ss
    const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (iso) {
      const [, ano, mes, dia] = iso;
      return this.dataParaSerial(
        new Date(Date.UTC(+ano, +mes - 1, +dia))
      );
    }

    // Formato brasileiro: dd/mm/yyyy
    const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (br) {
      const [, dia, mes, ano] = br;
      return this.dataParaSerial(
        new Date(Date.UTC(+ano, +mes - 1, +dia))
      );
    }

    return null;
  }

  private dataParaSerial(data: Date): number {
    const inicioExcel = Date.UTC(1899, 11, 30);
    return (Date.UTC(
      data.getUTCFullYear(),
      data.getUTCMonth(),
      data.getUTCDate()
    ) - inicioExcel) / 86400000;
  }
}