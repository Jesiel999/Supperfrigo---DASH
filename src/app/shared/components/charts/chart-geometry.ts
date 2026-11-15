export class ChartGeometry {
  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly paddingLeft: number,
    private readonly paddingRight: number,
    private readonly paddingTop: number,
    private readonly paddingBottom: number,
  ) {}

  get chartW(): number {
    return this.width - this.paddingLeft - this.paddingRight;
  }

  get chartH(): number {
    return this.height - this.paddingTop - this.paddingBottom;
  }

  toX(i: number, total: number): number {
    if (total <= 1) return this.paddingLeft;
    return this.paddingLeft + (i / (total - 1)) * this.chartW;
  }

  toY(val: number, minVal: number, maxVal: number): number {
    const range = maxVal - minVal;

    // Evita divisão por zero quando todos os valores são iguais (ex: tudo 0)
    if (range === 0) {
      return this.paddingTop + this.chartH / 2;
    }

    return this.paddingTop + this.chartH * (1 - (val - minVal) / range);
  }
}