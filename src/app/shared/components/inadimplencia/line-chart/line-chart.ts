import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PontoGrafico } from '../../../models/financeiro.models';
import { LOCALE_ID } from '@angular/core';

@Component({
  selector: 'app-line-chart',
  imports: [CommonModule],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ],
  template: `
    <div class="chart-wrap">
      <svg
        class="chart-svg"
        [attr.viewBox]="viewBox"
        preserveAspectRatio="none"
        (mousemove)="onMouseMove($event)"
        (mouseleave)="onMouseLeave()"
      >

        @for (gridY of gridLines(); track $index) {
          <line [attr.x1]="paddingLeft" [attr.y1]="gridY.y"
                [attr.x2]="width - paddingRight" [attr.y2]="gridY.y"
                stroke="rgba(255,255,255,.05)" stroke-width="1"/>
          <text [attr.x]="paddingLeft - 4" [attr.y]="gridY.y + 3"
                font-size="9" fill="#475569" font-family="JetBrains Mono"
                text-anchor="end">{{ gridY.label }}</text>
        }

        <defs>
          <linearGradient id="areaInad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#f43f5e" stop-opacity=".3"/>
            <stop offset="100%" stop-color="#f43f5e" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="areaRec" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#34d399" stop-opacity=".2"/>
            <stop offset="100%" stop-color="#34d399" stop-opacity="0"/>
          </linearGradient>
        </defs>

        <path [attr.d]="areaInad()" fill="url(#areaInad)"/>
        <path [attr.d]="lineInad()" fill="none"
              stroke="#f43f5e" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round"/>

        <path [attr.d]="areaRec()" fill="url(#areaRec)"/>
        <path [attr.d]="lineRec()" fill="none"
              stroke="#34d399" stroke-width="2"
              stroke-dasharray="5,3" stroke-linecap="round"/>

        @if (lastPoint()) {
          <circle [attr.cx]="lastPoint()!.x" [attr.cy]="lastPoint()!.yInad"
                  r="4" fill="#f43f5e" stroke="#0b0f1a" stroke-width="2"/>
          <circle [attr.cx]="lastPoint()!.x" [attr.cy]="lastPoint()!.yRec"
                  r="4" fill="#34d399" stroke="#0b0f1a" stroke-width="2"/>
        }

        @for (p of labelPoints(); track $index) {
          <text [attr.x]="p.x" [attr.y]="height - 4"
                font-size="9" fill="#475569" font-family="JetBrains Mono"
                text-anchor="middle">{{ p.label }}</text>
        }
        @if (hover && hoverIndex !== null) {
          <circle
            [attr.cx]="getX(hoverIndex)"
            [attr.cy]="getY(hover.inadimplente)"
            r="5"
            fill="#f43f5e"
          />
        }
      </svg>
    </div>
    
    @if (hover) {
      <div class="tooltip"
          [style.left.px]="mouse.x + 200"
          [style.top.px]="mouse.y + 450">

        <div class="title">{{ formatarData(hover.data) }}</div>

        <div class="row">
          <span>Inadimplente</span>
          <b>R$ {{ hover.inadimplente | number:'1.2-2' }}</b>
        </div>

        <div class="row">
          <span>Recuperado</span>
          <b>R$ {{ hover.recuperado | number:'1.2-2' }}</b>
        </div>
      </div>
    }
    
  `,
  styles: [`
    .chart-wrap { position: relative; width: 100%; height: 210px; }
    .chart-svg  { width: 100%; height: 100%; overflow: visible; }
    .tooltip {
      position: absolute;
      transform: translate(-50%, -120%);
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(255,255,255,0.08);
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 12px;
      backdrop-filter: blur(12px);
      z-index: 10000;
      pointer-events: none;
      min-width: 160px;
    }

    .tooltip .title {
      font-weight: 700;
      margin-bottom: 6px;
      color: #f8fafc;
    }

    .tooltip .row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }

    .tooltip .row b {
      color: white;
      font-family: JetBrains Mono;
    }
  `],
})
export class LineChartComponent {
  readonly pontos = input.required<PontoGrafico[]>();

  protected readonly width        = 1200;
  protected readonly height       = 200;
  protected readonly paddingLeft  = 42;
  protected readonly paddingRight = 10;
  protected readonly paddingTop   = 10;
  protected readonly paddingBottom= 20;

  protected readonly viewBox = `0 0 ${this.width} ${this.height}`;

  private readonly chartW = computed(() =>
    this.width - this.paddingLeft - this.paddingRight
  );
  private readonly chartH = computed(() =>
    this.height - this.paddingTop - this.paddingBottom
  );

  private readonly maxVal = computed(() => {
    const all = this.pontos().flatMap((p) => [p.inadimplente, p.recuperado]);
    return Math.max(...all, 1);
  });

  protected toX = (i: number, total: number) =>
  this.paddingLeft + (i / (total - 1)) * this.chartW();

  protected toY = (val: number) =>
    this.paddingTop + this.chartH() * (1 - val / this.maxVal());

  protected readonly gridLines = computed(() => {
    const steps = [0, 0.33, 0.66, 1];
    return steps.map((s) => ({
      y    : this.paddingTop + this.chartH() * (1 - s),
      label: s === 0 ? '0' : Math.round(this.maxVal() * s / 1000) + 'K',
    }));
  });

  private buildLine(key: 'inadimplente' | 'recuperado'): string {
    const pts = this.pontos();
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${this.toX(i, pts.length)},${this.toY(p[key])}`)
      .join(' ');
  }

  private buildArea(key: 'inadimplente' | 'recuperado'): string {
    const pts   = this.pontos();
    const total = pts.length;
    const baseY = this.paddingTop + this.chartH();
    const line  = pts.map((p, i) => `${this.toX(i, total)},${this.toY(p[key])}`).join(' L');
    return `M${line} L${this.toX(total - 1, total)},${baseY} L${this.toX(0, total)},${baseY} Z`;
  }

  protected readonly lineInad = computed(() => this.buildLine('inadimplente'));
  protected readonly lineRec  = computed(() => this.buildLine('recuperado'));
  protected readonly areaInad = computed(() => this.buildArea('inadimplente'));
  protected readonly areaRec  = computed(() => this.buildArea('recuperado'));

  protected readonly lastPoint = computed(() => {
    const pts = this.pontos();
    if (!pts.length) return null;
    const last = pts[pts.length - 1];
    return {
      x     : this.toX(pts.length - 1, pts.length),
      yInad : this.toY(last.inadimplente),
      yRec  : this.toY(last.recuperado),
    };
  });

  protected getX(index: number) {
    return this.toX(index, this.pontos().length);
  }

  protected getY(value: number) {
    return this.toY(value);
  }

  protected readonly labelPoints = computed(() => {
    const pts    = this.pontos();
    const step   = Math.ceil(pts.length / 7);
    return pts
      .filter((_, i) => i % step === 0 || i === pts.length - 1)
      .map((p, _, arr) => {
        const i = pts.indexOf(p);
        return { x: this.toX(i, pts.length), label: p.data };
      });
  });

  onMouseMove(event: MouseEvent) {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.mouse = { x, y };

    const pts = this.pontos();
    if (!pts.length) return;

    const chartWidth = this.width - this.paddingLeft - this.paddingRight;

    const relativeX = x - this.paddingLeft;

    const ratio = relativeX / chartWidth;
    const rawIndex = ratio * (pts.length - 1);

    const left = Math.floor(rawIndex);
    const right = Math.ceil(rawIndex);

    // escolhe o mais próximo real
    const index =
    (rawIndex - left < right - rawIndex) ? left : right;

    const safeIndex = Math.max(0, Math.min(index, pts.length - 1));

    this.hoverIndex = safeIndex;
    this.hover = pts[safeIndex];
  }
  
  // Formatar data
  formatarData(data: string): string {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  onMouseLeave() {
    this.hover = null;
    this.hoverIndex = null;
  }

  hover: PontoGrafico | null = null;
  hoverIndex: number | null = null;
  mouse = { x: 0, y: 0 };
}
