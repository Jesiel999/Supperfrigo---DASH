import { ChartGeometry } from './chart-geometry';
import { PontoGrafico } from '../../models/graficos.models';

export class LinePathBuilder {
  constructor(private readonly geometry: ChartGeometry) {}

  buildLine(pontos: PontoGrafico[], minVal: number, maxVal: number): string {
    if (!pontos.length) return '';
    return pontos
      .map((p, i) => {
        const x = this.geometry.toX(i, pontos.length);
        const y = this.geometry.toY(p.valor, minVal, maxVal);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  }

  buildArea(pontos: PontoGrafico[], minVal: number, maxVal: number): string {
    if (!pontos.length) return '';
    const total = pontos.length;

    const linha = pontos
      .map((p, i) => `${this.geometry.toX(i, total)},${this.geometry.toY(p.valor, minVal, maxVal)}`)
      .join(' L');

    // Baseline agora é a linha do ZERO (não mais o fundo do gráfico) —
    // essencial para valores negativos: a área deles deve ir "para cima"
    // até o zero, não até o chão do SVG.
    const baseline = this.geometry.toY(0, minVal, maxVal);

    return `M${linha} L${this.geometry.toX(total - 1, total)},${baseline} L${this.geometry.toX(0, total)},${baseline} Z`;
  }
}