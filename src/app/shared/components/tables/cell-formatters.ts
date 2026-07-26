import { ICellRendererParams, ValueFormatterParams, CellClassParams } from 'ag-grid-community';

export class CellFormatters {
  static data(valor: string | null | undefined): string {
    if (!valor) return '—';
    const parte = valor.split(' ')[0].split('T')[0];
    const [a, m, d] = parte.split('-');
    if (!a || !m || !d) return valor;
    return `${d}/${m}/${a}`;
  }

  static currencyValueFormatter<T>(): (p: ValueFormatterParams<T, number>) => string {
    return (p) =>
      p.value != null
        ? p.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : '';
  }

  static currencyCellStyle(cor = '#f43f5e') {
    return {
      fontFamily: "'JetBrains Mono', monospace",
      color: cor,
      fontWeight: '600',
    };
  }

  static dataValueFormatter<T>(): (p: ValueFormatterParams<T, string>) => string {
    return (p) => CellFormatters.data(p.value);
  }

  static diasAtrasoCellStyle<T>(): (p: CellClassParams<T, number>) => Record<string, string> {
    return (p) => {
      const value = Number(p.value ?? 0);
      const base = { fontFamily: "'JetBrains Mono', monospace" };

      if (value > 90) return { ...base, color: '#f43f5e', fontWeight: '600' };
      if (value > 60) return { ...base, color: '#fb923c', fontWeight: '500' };
      if (value > 30) return { ...base, color: '#fbbf24', fontWeight: '400' };
      return { ...base, color: '#94a3b8', fontWeight: '400' };
    };
  }

  static statusBadgeCellRenderer<T>(mapaEstilos: Record<string, string>): (p: ICellRendererParams<T, string>) => string {
    return (p) => {
      const val = (p.value ?? '').toUpperCase();
      const style = mapaEstilos[val] ?? '';
      return `<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;${style}">${p.value ?? ''}</span>`;
    };
  }

  static nomeDestaqueCellRenderer<T>(): (p: ICellRendererParams<T, string>) => string {
    return (p) => `<span style="font-weight:500;color:#e2e8f0">${p.value ?? ''}</span>`;
  }
}