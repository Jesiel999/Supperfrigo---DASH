import { Component, input } from '@angular/core';
import { MaioresDevedores } from '../../models/financeiro.models';

@Component({
  selector: 'app-top-devedores-bar',
  standalone: true,
  imports: [],
  template: `
    <div class="bar-list">

      @for (item of data(); track item.nome; let i = $index) {

        <div class="bar-row">

          <div class="bar-label">
            <span class="rank">#{{ i + 1 }}</span>

            <span
              class="nome"
              [title]="item.nome">
              {{ item.nome }}
            </span>
          </div>

          <div class="bar-track">

            <div
              class="bar-fill"
              [style.width.%]="item.percentual"
              [style.background]="getBarColor(i)"
            ></div>

          </div>

          <div class="bar-values">

            <span
              class="valor"
              [style.color]="getValueColor(i)">
              {{ formatarValor(item.valor) }}
            </span>

            @if (showDays()) {
              <span class="qtd">
                {{ item.diasAtrasoMedio }} Dias
              </span>
            }

            @if (showPercentage()) {
              <span class="pct">
                {{ item.percentual.toFixed(1) }}%
              </span>
            }

          </div>

        </div>

      } @empty {

        <div class="empty">
          Sem dados.
        </div>

      }

    </div>
  `,

  styles: [`
    .bar-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 350px;
      overflow-y: auto;
      padding-right: 6px;
    }

    .bar-row {
      display: grid;
      grid-template-columns:
        minmax(120px, 180px)
        minmax(80px, 1fr)
        minmax(120px, auto);

      align-items: center;
      gap: 10px;
    }

    .bar-label {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }

    .rank {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: var(--muted, #64748b);
      flex-shrink: 0;
      width: 22px;
    }

    .nome {
      color: var(--text, #e2e8f0);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bar-track {
      background: rgba(255,255,255,.06);
      border-radius: 4px;
      height: 6px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 4px;
      transition:
        width .4s ease,
        background .3s ease;
    }

    .bar-values {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    .valor {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }

    .qtd {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: var(--muted, #64748b);
      min-width: 42px;
      text-align: right;
      white-space: nowrap;
    }

    .pct {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: var(--muted, #64748b);
      min-width: 36px;
      text-align: right;
      white-space: nowrap;
    }

    .empty {
      text-align: center;
      color: var(--muted, #64748b);
      font-size: 12px;
      padding: 20px 0;
    }
  `],
})
export class TopDevedoresBarComponent {

  readonly data =
    input.required<MaioresDevedores[]>();

  readonly valueColors =
    input<string[]>([]);

  readonly showDays =
    input<boolean>(true);

  readonly showPercentage =
    input<boolean>(true);

  readonly barColors =
    input<string[]>([]);

  protected getBarColor(index: number): string {
    const colors = this.barColors();

    return colors[index % colors.length];
  }

  protected getValueColor(index: number): string {
    const colors = this.valueColors();

    return colors[index % colors.length];
  }

  protected formatarValor(v: number): string {

    if (v >= 1_000_000) {
      return `R$ ${(v / 1_000_000).toFixed(1)}M`;
    }

    return v.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}