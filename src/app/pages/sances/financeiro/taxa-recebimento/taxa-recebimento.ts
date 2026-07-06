import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaxaRecebimentoDiaria } from '../../../models/taxa-recebimento.model';

@Component({
  selector: 'app-taxa-recebimento-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-data">Data</th>
            <th class="col-valor">Valor Esperado</th>
            <th class="col-valor">Valor Recebido</th>
            <th class="col-taxa">Taxa (%)</th>
            <th class="col-status">Status</th>
            <th class="col-clientes">Clientes Liquidados</th>
            <th class="col-clientes">Clientes em Atraso</th>
            <th class="col-dias">Dias em Atraso</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of dados">
            <td class="cell-data">{{ item.data | date: 'dd/MM/yyyy' }}</td>
            <td class="cell-valor">{{ item.valorEsperado | currency }}</td>
            <td class="cell-valor positivo">{{ item.valorRecebido | currency }}</td>
            <td class="cell-taxa">
              <div class="taxa-badge" [ngClass]="obterClassTaxa(item.taxaRecebimento)">
                {{ item.taxaRecebimento.toFixed(2) }}%
              </div>
            </td>
            <td class="cell-status">
              <span [ngClass]="obterClassStatus(item.taxaRecebimento)">
                {{ obterStatus(item.taxaRecebimento) }}
              </span>
            </td>
            <td class="cell-clientes">
              <span class="badge-success">{{ item.clientesLiquidados }}</span>
            </td>
            <td class="cell-clientes">
              <span class="badge-warning">{{ item.clientesEmAtraso }}</span>
            </td>
            <td class="cell-dias">
              <span class="dias-badge">{{ item.diasEmAtraso }}d</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-wrapper {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .data-table thead {
      background: rgba(255, 255, 255, 0.04);
      border-bottom: 1px solid var(--border);
    }

    .data-table th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }

    .data-table tbody tr {
      border-bottom: 1px solid var(--border);
      transition: background 0.2s;
    }

    .data-table tbody tr:hover {
      background: rgba(255, 255, 255, 0.04);
    }

    .data-table td {
      padding: 12px;
      color: var(--text);
    }

    /* ── Colunas ── */
    .col-data {
      min-width: 100px;
    }

    .col-valor {
      min-width: 120px;
    }

    .col-taxa {
      min-width: 100px;
    }

    .col-status {
      min-width: 90px;
    }

    .col-clientes {
      min-width: 130px;
      text-align: center;
    }

    .col-dias {
      min-width: 80px;
      text-align: center;
    }

    /* ── Styles por celula ── */
    .cell-data {
      font-weight: 500;
      color: var(--text);
    }

    .cell-valor {
      font-weight: 500;
      color: var(--muted);
    }

    .cell-valor.positivo {
      color: #34d399;
      font-weight: 600;
    }

    .cell-taxa {
      text-align: center;
    }

    .taxa-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 11px;
    }

    .taxa-badge.excelente {
      background: rgba(52, 211, 153, 0.2);
      color: #34d399;
    }

    .taxa-badge.bom {
      background: rgba(107, 114, 128, 0.2);
      color: #d1d5db;
    }

    .taxa-badge.alerta {
      background: rgba(251, 146, 60, 0.2);
      color: #fb923c;
    }

    .taxa-badge.critico {
      background: rgba(244, 63, 94, 0.2);
      color: #f43f5e;
    }

    .cell-status {
      text-align: center;
    }

    .cell-status span {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 500;
      font-size: 10px;
    }

    .status-excelente {
      background: rgba(52, 211, 153, 0.2);
      color: #34d399;
    }

    .status-bom {
      background: rgba(107, 114, 128, 0.2);
      color: #d1d5db;
    }

    .status-alerta {
      background: rgba(251, 146, 60, 0.2);
      color: #fb923c;
    }

    .status-critico {
      background: rgba(244, 63, 94, 0.2);
      color: #f43f5e;
    }

    .cell-clientes {
      text-align: center;
    }

    .badge-success {
      display: inline-block;
      background: rgba(52, 211, 153, 0.15);
      color: #34d399;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 11px;
    }

    .badge-warning {
      display: inline-block;
      background: rgba(251, 146, 60, 0.15);
      color: #fb923c;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 11px;
    }

    .cell-dias {
      text-align: center;
    }

    .dias-badge {
      display: inline-block;
      background: rgba(100, 116, 139, 0.2);
      color: #cbd5e1;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 500;
      font-size: 10px;
    }

    /* ── Responsivo ── */
    @media (max-width: 768px) {
      .data-table th,
      .data-table td {
        padding: 8px;
        font-size: 10px;
      }

      .col-valor {
        min-width: 90px;
      }

      .col-clientes {
        min-width: 80px;
      }
    }
  `],
})
export class TaxaRecebimentoTableComponent {
  @Input() dados: TaxaRecebimentoDiaria[] = [];

  obterClassTaxa(taxa: number): string {
    if (taxa >= 95) return 'excelente';
    if (taxa >= 90) return 'bom';
    if (taxa >= 70) return 'alerta';
    return 'critico';
  }

  obterClassStatus(taxa: number): string {
    if (taxa >= 95) return 'status-excelente';
    if (taxa >= 90) return 'status-bom';
    if (taxa >= 70) return 'status-alerta';
    return 'status-critico';
  }

  obterStatus(taxa: number): string {
    if (taxa >= 95) return '✅ Excelente';
    if (taxa >= 90) return '✔️ Bom';
    if (taxa >= 70) return '⚠️ Alerta';
    return '🔴 Crítico';
  }
}