import { Component, input } from '@angular/core';
import { MaioresDevedores } from '../../models/financeiro/financeiro.models';

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
    :host {
      display: block;
      width: 100%;
      min-width: 0;
    }

    .bar-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      min-width: 0;
      max-height: 350px;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 4px 6px 4px 0;
      box-sizing: border-box;
    }

    .bar-row {
      display: grid;
      grid-template-columns:
        minmax(0, 30%)
        minmax(40px, 1fr)
        minmax(0, 20%);
      align-items: center;
      gap: 10px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }

    .bar-label {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }

    .rank {
      flex: 0 0 22px;
      width: 22px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: var(--muted, #64748b);
    }

    .nome {
      flex: 1;
      min-width: 0;
      color: var(--text, #e2e8f0);
      white-space: normal;
      overflow-wrap: anywhere;
      line-height: 1.4;
    }

    .bar-track {
      width: 100%;
      min-width: 0;
      height: 8px;
      background: rgba(255, 255, 255, .06);
      border-radius: 4px;
      overflow: hidden;
      justify-self: stretch;
    }

    .bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width .4s ease, background .3s ease;
    }

    .bar-values {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      min-width: 0;
      width: 100%;
    }

    .valor {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }

    .qtd,
    .pct {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: var(--muted, #64748b);
      text-align: right;
      white-space: nowrap;
    }

    .qtd {
      min-width: 42px;
    }

    .pct {
      min-width: 36px;
    }

    .empty {
      text-align: center;
      color: var(--muted, #64748b);
      font-size: 12px;
      padding: 20px 0;
    }

    /* Tablets e telas médias */
    @media (max-width: 900px) {
      .bar-row {
        grid-template-columns:
          minmax(0, 32%)
          minmax(40px, 1fr)
          minmax(0, 25%);
        gap: 8px;
      }

      .bar-values {
        gap: 5px;
      }
    }

    /* Celulares */
    @media (max-width: 600px) {
      .bar-list {
        gap: 14px;
        padding-right: 4px;
      }

      .bar-row {
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 6px 10px;
      }

      .bar-label {
        grid-column: 1;
        grid-row: 1;
      }

      .bar-values {
        grid-column: 2;
        grid-row: 1;
        width: auto;
        gap: 6px;
      }

      .bar-track {
        grid-column: 1 / -1;
        grid-row: 2;
        height: 12px;
      }

      .nome {
        font-size: 12px;
      }

      .valor {
        font-size: 10px;
      }

      .qtd,
      .pct {
        font-size: 9px;
        min-width: 0;
      }
    }

    /* Celulares estreitos */
    @media (max-width: 380px) {
      .bar-row {
        gap: 6px;
      }

      .bar-values {
        gap: 4px;
      }

      .qtd {
        display: none;
      }
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