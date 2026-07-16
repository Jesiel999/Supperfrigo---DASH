import { Component, input, computed } from '@angular/core';
import { FaixaAtraso } from '../../../models/financeiro.models';

interface DonutSegment extends FaixaAtraso {
  dasharray: string;
  dashoffset: string;
}

@Component({
  selector: 'app-donut-chart-emp',
  imports: [],
  template: `
    <div class="donut-wrap">
      <svg class="donut-svg" width="120" height="120" viewBox="0 0 120 120">

        <circle cx="60" cy="60" r="42" fill="none"
                stroke="rgba(255,255,255,.05)" stroke-width="20"/>

        @for (seg of segments(); track seg.label) {
          <circle cx="60" cy="60" r="42" fill="none"
                  [attr.stroke]="seg.cor"
                  stroke-width="20"
                  [attr.stroke-dasharray]="seg.dasharray"
                  [attr.stroke-dashoffset]="seg.dashoffset"
                  transform="rotate(-90 60 60)"/>
        }

        <text x="60" y="56" text-anchor="middle"
              font-size="14" font-weight="700" fill="white" font-family="Syne">
          {{ totalTitulos() }}
        </text>
        <text x="60" y="68" text-anchor="middle"
              font-size="8" fill="#64748b" font-family="Outfit">Títulos</text>
      </svg>

      <div class="donut-legend">
        @for (seg of segments(); track seg.label) {
          <div class="legend-row">
            <div class="legend-label">
              <span class="dot" [style.background]="seg.cor"></span>
              {{ seg.label }}
            </div>
            <span class="pct" [style.color]="seg.cor">{{ seg.percentual }}%</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .donut-wrap {
      display: flex; align-items: center; gap: 24px; padding: 8px 0;
    }
    .donut-svg { flex-shrink: 0; }
    .donut-legend { flex: 1; }
    .legend-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 7px 0; border-bottom: 1px solid var(--border);
      font-size: 12.5px;
    }
    .legend-row:last-child { border-bottom: none; }
    .legend-label { display: flex; align-items: center; gap: 8px; }
    .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
    .pct { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; }
  `],
})
export class DonutChartEmpComponent {
  readonly faixas         = input.required<FaixaAtraso[]>();
  readonly totalTitulos   = input<number>(47);

  private readonly circumference = 2 * Math.PI * 42;

  protected readonly segments = computed<DonutSegment[]>(() => {
    let offset = 0;
    return this.faixas().map((f) => {
      const dash = (f.percentual / 100) * this.circumference;
      const seg: DonutSegment = {
        ...f,
        dasharray : `${dash.toFixed(1)} ${this.circumference.toFixed(1)}`,
        dashoffset: `-${offset.toFixed(1)}`,
      };
      offset += dash;
      return seg;
    });
  });
}
