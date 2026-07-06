import { Component, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

interface AgingItem {
  cliente:string; doc:string; d0_30:number; d31_60:number; d61_90:number; d91:number; total:number;
}
const MOCK: AgingItem[] = [
  { cliente:'Transportes Alves Ltda',    doc:'12.345.678/0001-90', d0_30:0,     d31_60:0,     d61_90:32400, d91:66000, total:98400 },
  { cliente:'Madeireira São Paulo S/A',  doc:'98.765.432/0001-11', d0_30:0,     d31_60:76200, d61_90:0,     d91:0,     total:76200 },
  { cliente:'Construtora BH Obras',      doc:'55.111.222/0001-33', d0_30:0,     d31_60:64500, d61_90:0,     d91:0,     total:64500 },
  { cliente:'Agro Rio Verde Ltda',       doc:'77.444.555/0001-77', d0_30:0,     d31_60:0,     d61_90:0,     d91:58900, total:58900 },
  { cliente:'Frigorífico Central Oeste', doc:'33.222.111/0001-44', d0_30:47300, d31_60:0,     d61_90:0,     d91:0,     total:47300 },
  { cliente:'Distribuidora Norte S/A',   doc:'66.777.888/0001-55', d0_30:0,     d31_60:0,     d61_90:41100, d91:0,     total:41100 },
  { cliente:'Cerâmica Sul Mineiro',      doc:'44.333.999/0001-66', d0_30:0,     d31_60:38700, d61_90:0,     d91:0,     total:38700 },
  { cliente:'Comércio Atacadista JJ',    doc:'11.999.888/0001-22', d0_30:29500, d31_60:0,     d61_90:0,     d91:0,     total:29500 },
];

@Component({
  selector: 'app-aging-report',
  imports: [CurrencyPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Aging <span>Report</span></h1>
          <p class="page-sub">Distribuição de inadimplência por faixa etária · Junho 2025</p>
        </div>
        <button class="btn-export">⬇ Exportar</button>
      </div>

      <!-- Totais por faixa -->
      <div class="faixa-grid">
        <div class="faixa-card" style="border-color:rgba(52,211,153,.3)">
          <div class="faixa-label">0 – 30 dias</div>
          <div class="faixa-val" style="color:#34d399">{{ total0_30() | currency:'BRL':'symbol':'1.0-0' }}</div>
          <div class="faixa-pct">{{ pct(total0_30()) }}% do total</div>
          <div class="faixa-bar-wrap"><div class="faixa-bar" [style.width.%]="pct(total0_30())" style="background:#34d399"></div></div>
        </div>
        <div class="faixa-card" style="border-color:rgba(251,146,60,.3)">
          <div class="faixa-label">31 – 60 dias</div>
          <div class="faixa-val" style="color:#fb923c">{{ total31_60() | currency:'BRL':'symbol':'1.0-0' }}</div>
          <div class="faixa-pct">{{ pct(total31_60()) }}% do total</div>
          <div class="faixa-bar-wrap"><div class="faixa-bar" [style.width.%]="pct(total31_60())" style="background:#fb923c"></div></div>
        </div>
        <div class="faixa-card" style="border-color:rgba(244,63,94,.3)">
          <div class="faixa-label">61 – 90 dias</div>
          <div class="faixa-val" style="color:#f43f5e">{{ total61_90() | currency:'BRL':'symbol':'1.0-0' }}</div>
          <div class="faixa-pct">{{ pct(total61_90()) }}% do total</div>
          <div class="faixa-bar-wrap"><div class="faixa-bar" [style.width.%]="pct(total61_90())" style="background:#f43f5e"></div></div>
        </div>
        <div class="faixa-card" style="border-color:rgba(124,58,237,.3)">
          <div class="faixa-label">+ 90 dias</div>
          <div class="faixa-val" style="color:#a78bfa">{{ total91() | currency:'BRL':'symbol':'1.0-0' }}</div>
          <div class="faixa-pct">{{ pct(total91()) }}% do total</div>
          <div class="faixa-bar-wrap"><div class="faixa-bar" [style.width.%]="pct(total91())" style="background:#a78bfa"></div></div>
        </div>
      </div>

      <!-- Tabela aging -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Detalhamento por Cliente</h2>
          <div class="total-badge">Total: {{ totalGeral() | currency:'BRL':'symbol':'1.0-0' }}</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>Cliente</th>
              <th class="th-faixa" style="color:#34d399">0–30 dias</th>
              <th class="th-faixa" style="color:#fb923c">31–60 dias</th>
              <th class="th-faixa" style="color:#f43f5e">61–90 dias</th>
              <th class="th-faixa" style="color:#a78bfa">+90 dias</th>
              <th>Total</th>
              <th>% Carteira</th>
            </tr></thead>
            <tbody>
              @for (item of dados(); track item.doc) {
                <tr>
                  <td>
                    <div class="cli-name">{{ item.cliente }}</div>
                    <div class="cli-doc">{{ item.doc }}</div>
                  </td>
                  <td class="mono">{{ item.d0_30 > 0 ? (item.d0_30 | currency:'BRL':'symbol':'1.0-0') : '—' }}</td>
                  <td class="mono">{{ item.d31_60 > 0 ? (item.d31_60 | currency:'BRL':'symbol':'1.0-0') : '—' }}</td>
                  <td class="mono">{{ item.d61_90 > 0 ? (item.d61_90 | currency:'BRL':'symbol':'1.0-0') : '—' }}</td>
                  <td class="mono">{{ item.d91 > 0 ? (item.d91 | currency:'BRL':'symbol':'1.0-0') : '—' }}</td>
                  <td class="mono bold accent">{{ item.total | currency:'BRL':'symbol':'1.0-0' }}</td>
                  <td>
                    <div class="pct-wrap">
                      <div class="pct-bg"><div class="pct-fill" [style.width.%]="pct(item.total)"></div></div>
                      <span class="mono" style="font-size:11px;color:var(--muted)">{{ pct(item.total) }}%</span>
                    </div>
                  </td>
                </tr>
              }
              <tr class="totals-row">
                <td class="bold">TOTAL</td>
                <td class="mono bold" style="color:#34d399">{{ total0_30() | currency:'BRL':'symbol':'1.0-0' }}</td>
                <td class="mono bold" style="color:#fb923c">{{ total31_60() | currency:'BRL':'symbol':'1.0-0' }}</td>
                <td class="mono bold" style="color:#f43f5e">{{ total61_90() | currency:'BRL':'symbol':'1.0-0' }}</td>
                <td class="mono bold" style="color:#a78bfa">{{ total91() | currency:'BRL':'symbol':'1.0-0' }}</td>
                <td class="mono bold accent">{{ totalGeral() | currency:'BRL':'symbol':'1.0-0' }}</td>
                <td class="mono" style="color:var(--muted)">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page{display:flex;flex-direction:column;gap:20px}
    .page-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px}
    .page-title{font-family:'Syne',sans-serif;font-size:22px;font-weight:800}
    .page-title span{background:linear-gradient(90deg,#fb923c,#f43f5e);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .page-sub{color:var(--muted);font-size:13px;margin-top:4px}
    .btn-export{background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12.5px;font-family:'Outfit',sans-serif;padding:8px 16px;cursor:pointer}
    .faixa-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
    @media(max-width:900px){.faixa-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:500px){.faixa-grid{grid-template-columns:1fr}}
    .faixa-card{background:var(--card);border:1px solid;border-radius:14px;padding:18px}
    .faixa-label{font-size:12px;color:var(--muted);margin-bottom:10px;font-weight:600}
    .faixa-val{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;letter-spacing:-1px;margin-bottom:5px}
    .faixa-pct{font-size:11.5px;color:var(--muted);margin-bottom:12px}
    .faixa-bar-wrap{background:rgba(255,255,255,.06);border-radius:4px;height:5px;overflow:hidden}
    .faixa-bar{height:100%;border-radius:4px;transition:width .6s ease}
    .card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px}
    .card-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:16px}
    .card-title{font-family:'Syne',sans-serif;font-weight:700;font-size:15px}
    .total-badge{background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.25);color:#f43f5e;font-size:13px;font-weight:600;padding:5px 14px;border-radius:8px;font-family:'JetBrains Mono',monospace}
    .table-wrap{overflow-x:auto}
    table{width:100%;border-collapse:collapse;font-size:12.5px}
    thead th{text-align:left;padding:9px 12px;font-size:10.5px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;border-bottom:1px solid var(--border);white-space:nowrap}
    tbody tr{border-bottom:1px solid rgba(255,255,255,.03);transition:background .15s}
    tbody tr:hover{background:rgba(255,255,255,.03)}
    .totals-row{background:rgba(255,255,255,.04)!important;border-top:1px solid var(--border)}
    td{padding:10px 12px;vertical-align:middle}
    .cli-name{font-weight:500}.cli-doc{font-size:10.5px;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-top:1px}
    .mono{font-family:'JetBrains Mono',monospace;font-size:12px}.bold{font-weight:600}.accent{color:#f43f5e}
    .th-faixa{color:var(--muted)!important}
    .pct-wrap{display:flex;align-items:center;gap:8px}
    .pct-bg{width:70px;background:rgba(255,255,255,.07);border-radius:4px;height:5px;overflow:hidden}
    .pct-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#f43f5e,#fb923c)}
  `],
})
export class AgingReportComponent {
  readonly dados     = signal(MOCK);
  readonly total0_30  = computed(()=>MOCK.reduce((s,i)=>s+i.d0_30,0));
  readonly total31_60 = computed(()=>MOCK.reduce((s,i)=>s+i.d31_60,0));
  readonly total61_90 = computed(()=>MOCK.reduce((s,i)=>s+i.d61_90,0));
  readonly total91    = computed(()=>MOCK.reduce((s,i)=>s+i.d91,0));
  readonly totalGeral = computed(()=>MOCK.reduce((s,i)=>s+i.total,0));
  pct(v:number){ return Math.round((v/this.totalGeral())*100); }
}
