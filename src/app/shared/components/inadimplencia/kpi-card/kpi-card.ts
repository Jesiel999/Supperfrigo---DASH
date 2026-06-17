import { Component, input, computed } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { LOCALE_ID } from '@angular/core';

export type KpiVariant = 'danger' | 'warning' | 'info' | 'success';

@Component({
  selector: 'app-kpi-card',
  imports: [CurrencyPipe, DecimalPipe],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ],
  template: `
    <div class="kpi-card" [class]="variant()">
      <div class="kpi-top">
        <span class="kpi-label">{{ label() }}</span>
        <div class="kpi-icon">{{ icon() }}</div>
      </div>

      <div class="kpi-value">
        @if (isCurrency()) {
          {{ value() | currency:'BRL':'symbol':'1.0-0' }}
        } @else {
          {{ value() | number:'1.0-0' }}
        }
      </div>

      <div class="kpi-delta" [class]="deltaClass()">
        {{ deltaPrefix() }} {{ Math.abs(delta()) | number:'1.1-1' }}% vs mês anterior
      </div>
    </div>
  `,
  styles: [`
    .kpi-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      position: relative;
      overflow: hidden;
      transition: transform .2s, border-color .2s;
      cursor: default;
    }
    .kpi-card:hover { transform: translateY(-2px); border-color: rgba(255,255,255,.12); }
    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0; right: 0;
      width: 80px; height: 80px;
      border-radius: 50%;
      filter: blur(40px);
      opacity: .18;
    }
    .kpi-card.danger::before  { background: var(--accent); }
    .kpi-card.warning::before { background: var(--accent2); }
    .kpi-card.info::before    { background: var(--accent3); }
    .kpi-card.success::before { background: var(--green); }

    .kpi-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .kpi-label { font-size: 12px; color: var(--muted); font-weight: 500; }
    .kpi-icon {
      width: 34px; height: 34px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
    }
    .kpi-card.danger  .kpi-icon { background: rgba(244,63,94,.15); }
    .kpi-card.warning .kpi-icon { background: rgba(251,146,60,.15); }
    .kpi-card.info    .kpi-icon { background: rgba(56,189,248,.15); }
    .kpi-card.success .kpi-icon { background: rgba(52,211,153,.15); }

    .kpi-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 26px; font-weight: 700;
      letter-spacing: -1px; line-height: 1;
      margin-bottom: 8px;
    }
    .kpi-card.danger  .kpi-value { color: var(--accent); }
    .kpi-card.warning .kpi-value { color: var(--accent2); }
    .kpi-card.info    .kpi-value { color: var(--accent3); }
    .kpi-card.success .kpi-value { color: var(--green); }

    .kpi-delta { font-size: 11.5px; font-weight: 500; }
    .delta-up   { color: var(--accent); }
    .delta-down { color: var(--green); }
  `],
})
export class KpiCardComponent {
  readonly label      = input.required<string>();
  readonly value      = input.required<number>();
  readonly icon       = input.required<string>();
  readonly variant    = input.required<KpiVariant>();
  readonly delta      = input.required<number>();
  readonly isCurrency = input<boolean>(true);

  protected readonly Math = Math;

  protected readonly deltaClass = computed(() =>
    this.delta() >= 0 ? 'kpi-delta delta-up' : 'kpi-delta delta-down'
  );

  protected readonly deltaPrefix = computed(() =>
    this.delta() >= 0 ? '▲ +' : '▼'
  );
}
