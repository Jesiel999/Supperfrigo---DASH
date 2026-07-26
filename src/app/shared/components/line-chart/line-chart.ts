import { Component, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { Serie, PontoGrafico } from '../../models/graficos.models';
import { ValueFormatterFactory } from '../../formaters/value-formaters';
import { ChartGeometry } from '../charts/chart-geometry';
import { LinePathBuilder } from '../charts/line-path-builder';

interface PontoHover {
  data: string;
  serieId: string;
  serieLabel: string;
  serieCor: string;
  valor: number;
  formatador: 'currency' | 'number' | 'percent';
}

@Component({
  selector: 'app-line-chart',
  imports: [CommonModule],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  template: `
    <div class="chart-wrap">
      @if (series().length > 1) {
        <div class="legend">
          @for (s of series(); track s.id) {
            <span class="legend-item">
              <span class="legend-dot" [style.background]="s.cor"></span>
              {{ s.label }}
            </span>
          }
        </div>
      }

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

        <!-- Área preenchida só na primeira série (a "principal") -->
        @if (series()[0]; as principal) {
          <defs>
            <linearGradient [attr.id]="'area-' + principal.id" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" [attr.stop-color]="principal.cor" stop-opacity=".25"/>
              <stop offset="100%" [attr.stop-color]="principal.cor" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <path [attr.d]="areasPorSerie().get(principal.id)" [attr.fill]="'url(#area-' + principal.id + ')'"/>
        }

        <!-- Uma <path> por série, cor própria -->
        @for (s of series(); track s.id) {
          <path
            [attr.d]="linhasPorSerie().get(s.id)"
            fill="none"
            [attr.stroke]="s.cor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        }

        @for (p of labelPoints(); track $index) {
          <text [attr.x]="p.x" [attr.y]="height - 4"
                font-size="9" fill="#475569" font-family="JetBrains Mono"
                text-anchor="middle">{{ p.label }}</text>
        }

        @if (hoverIndex() !== null) {
          @for (s of series(); track s.id) {
            <circle
              [attr.cx]="getX(hoverIndex()!)"
              [attr.cy]="getY(s.pontos[hoverIndex()!]?.valor ?? 0)"
              r="4"
              [attr.fill]="s.cor"
              stroke="#0b0f1a"
              stroke-width="1.5"
            />
          }
        }
      </svg>
    </div>

    @if (hoverPontos().length) {
      <div class="tooltip" [class.tooltip--left]="tooltipSide() === 'left'"
          [style.left.px]="tooltip().x" [style.top.px]="tooltip().y">
        <div class="title">{{ formatarData(hoverData()) }}</div>
        @for (h of hoverPontos(); track h.serieId) {
          <div class="row">
            <span><span class="dot" [style.background]="h.serieCor"></span>{{ h.serieLabel }}</span>
            <b>{{ formatarValor(h.valor, h.formatador) }}</b>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .chart-wrap { position: relative; width: 100%; height: 200px; }
    .chart-svg  { width: 100%; height: 100%; overflow: visible; }

    .legend { display: flex; gap: 14px; margin-bottom: 8px; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #94a3b8; }
    .legend-dot  { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

    .tooltip {
      position: fixed;
      transform: translate(0, -50%);
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(255,255,255,0.08);
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 12px;
      backdrop-filter: blur(12px);
      z-index: 10000;
      pointer-events: none;
      min-width: 170px;
    }
    .tooltip--left { transform: translate(-100%, -50%); }
    .tooltip .title { font-weight: 700; margin-bottom: 6px; color: #f8fafc; }
    .tooltip .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 11px; color: #94a3b8; margin-top: 3px; }
    .tooltip .row .dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; margin-right: 5px; }
    .tooltip .row b { color: white; font-family: 'JetBrains Mono', monospace; }
  `],
})
export class LineChartComponent {
  // ─── Input principal: N séries, cada uma com seus próprios pontos ─
  readonly series = input.required<Serie[]>();

  protected readonly width         = 1200;
  protected readonly height        = 200;
  protected readonly paddingLeft   = 42;
  protected readonly paddingRight  = 10;
  protected readonly paddingTop    = 10;
  protected readonly paddingBottom = 20;
  protected readonly viewBox = `0 0 ${this.width} ${this.height}`;

  // ─── Objetos que fazem o trabalho pesado ─
  private readonly geometry = new ChartGeometry(
    this.width, this.height, this.paddingLeft, this.paddingRight, this.paddingTop, this.paddingBottom,
  );
  private readonly pathBuilder = new LinePathBuilder(this.geometry);

  private readonly maxVal = computed(() => {
    const todos = this.series().flatMap(s => s.pontos.map(p => p.valor));
    return Math.max(...todos, 1);
  });

  protected readonly gridLines = computed(() => {
    const steps = [0, 0.33, 0.66, 1];
    const max = this.maxVal();
    return steps.map(s => ({
      y: this.geometry.toY(max * s, max),
      label: s === 0 ? '0' : Math.round(max * s / 1000) + 'K',
    }));
  });

  // ─── Um path por série, calculado uma vez por render ────────
  protected readonly linhasPorSerie = computed(() => {
    const max = this.maxVal();
    const mapa = new Map<string, string>();
    this.series().forEach(s => mapa.set(s.id, this.pathBuilder.buildLine(s.pontos, max)));
    return mapa;
  });

  protected readonly areasPorSerie = computed(() => {
    const max = this.maxVal();
    const mapa = new Map<string, string>();
    this.series().forEach(s => mapa.set(s.id, this.pathBuilder.buildArea(s.pontos, max)));
    return mapa;
  });

  protected readonly labelPoints = computed(() => {
    const principal = this.series()[0];
    if (!principal) return [];
    const pts = principal.pontos;
    const step = Math.ceil(pts.length / 7);
    return pts
      .filter((_, i) => i % step === 0 || i === pts.length - 1)
      .map((p) => {
        const i = pts.indexOf(p);
        return { x: this.geometry.toX(i, pts.length), label: p.data };
      });
  });

  protected getX(index: number): number {
    const total = this.series()[0]?.pontos.length ?? 0;
    return this.geometry.toX(index, total);
  }
  protected getY(value: number): number {
    return this.geometry.toY(value, this.maxVal());
  }

  readonly hoverIndex = signal<number | null>(null);
  readonly tooltip = signal({ x: 0, y: 0 });
  readonly tooltipSide = signal<'left' | 'right'>('right');

  protected readonly hoverData = computed(() => {
    const idx = this.hoverIndex();
    if (idx === null) return '';
    return this.series()[0]?.pontos[idx]?.data ?? '';
  });

  protected readonly hoverPontos = computed((): PontoHover[] => {
    const idx = this.hoverIndex();
    if (idx === null) return [];
    return this.series().map(s => ({
      data: s.pontos[idx]?.data ?? '',
      serieId: s.id,
      serieLabel: s.label,
      serieCor: s.cor,
      valor: s.pontos[idx]?.valor ?? 0,
      formatador: s.formatador,
    }));
  });

  onMouseMove(event: MouseEvent) {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;

    const total = this.series()[0]?.pontos.length ?? 0;
    if (!total) return;

    const scaleX = rect.width / this.width;
    const chartWidth = this.width - this.paddingLeft - this.paddingRight;
    const relativeX = (x / scaleX) - this.paddingLeft;
    const ratio = relativeX / chartWidth;
    const rawIndex = ratio * (total - 1);

    const left = Math.floor(rawIndex);
    const right = Math.ceil(rawIndex);
    const index = (rawIndex - left < right - rawIndex) ? left : right;
    this.hoverIndex.set(Math.max(0, Math.min(index, total - 1)));

    const TOOLTIP_W = 190;
    const TOOLTIP_H = 30 + this.series().length * 22;
    const OFFSET = 16;
    const MARGEM = 8;

    const cursorX = event.clientX;
    const cursorY = event.clientY;

    const cabeADireita = cursorX + OFFSET + TOOLTIP_W + MARGEM <= window.innerWidth;
    this.tooltipSide.set(cabeADireita ? 'right' : 'left');
    const tooltipX = cabeADireita ? cursorX + OFFSET : cursorX - OFFSET;

    let tooltipY = cursorY;
    const metade = TOOLTIP_H / 2;
    if (tooltipY - metade < MARGEM) tooltipY = metade + MARGEM;
    else if (tooltipY + metade > window.innerHeight - MARGEM) tooltipY = window.innerHeight - metade - MARGEM;

    this.tooltip.set({ x: tooltipX, y: tooltipY });
  }

  onMouseLeave() {
    this.hoverIndex.set(null);
  }

  formatarData(data: string): string {
    if (!data || !data.includes('-')) return data;
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  protected formatarValor(valor: number, formatador: 'currency' | 'number' | 'percent'): string {
    return ValueFormatterFactory.get(formatador).format(valor);
  }
}