// shared/formatters/value-formatter.strategy.ts

export interface ValueFormatterStrategy {
  format(valor: number): string;
}

export class CurrencyFormatter implements ValueFormatterStrategy {
  format(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}

export class NumberFormatter implements ValueFormatterStrategy {
  format(valor: number): string {
    return valor.toLocaleString('pt-BR');
  }
}

export class PercentFormatter implements ValueFormatterStrategy {
  format(valor: number): string {
    return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  }
}

export class ValueFormatterFactory {
  private static readonly formatters: Record<string, ValueFormatterStrategy> = {
    currency: new CurrencyFormatter(),
    number: new NumberFormatter(),
    percent: new PercentFormatter(),
  };

  static get(tipo: 'currency' | 'number' | 'percent' = 'number'): ValueFormatterStrategy {
    return this.formatters[tipo] ?? this.formatters['number'];
  }
}