import { ChartGeometry } from './chart-geometry';
import { PontoGrafico } from '../../models/graficos.models';

export class LinePathBuilder {
  constructor(private readonly geometry: ChartGeometry) {}

  buildLine(pontos: PontoGrafico[], maxVal: number): string {
    if (!pontos.length) return '';
    return pontos
      .map((p, i) => {
        const x = this.geometry.toX(i, pontos.length);
        const y = this.geometry.toY(p.valor, maxVal);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  }

  buildArea(pontos: PontoGrafico[], maxVal: number): string {
    if (!pontos.length) return '';
    const total = pontos.length;
    const baseY = this.geometry.toY(0, maxVal) + (this.geometry as any).chartH * 0; // baseline
    const linha = pontos
      .map((p, i) => `${this.geometry.toX(i, total)},${this.geometry.toY(p.valor, maxVal)}`)
      .join(' L');
    const baseline = this.geometry.toY(0, maxVal); // usa valor 0 como "chão"
    return `M${linha} L${this.geometry.toX(total - 1, total)},${baseline} L${this.geometry.toX(0, total)},${baseline} Z`;
  }
}