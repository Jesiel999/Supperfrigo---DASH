import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({ providedIn: 'root' })
export class ExcelExportService {

  exportar<T extends object>(dados: T[], nomeArquivo: string, nomeAba = 'Dados'): void {
    if (!dados.length) return;

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, nomeAba);

    const dataAtual = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `${nomeArquivo}_${dataAtual}.xlsx`);
  }
}