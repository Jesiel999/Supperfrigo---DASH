import { Component, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

type StatusR = 'aberto' | 'vencido' | 'pago' | 'parcial';
interface ContaReceber {
  id: number; cliente: string; documento: string; descricao: string;
  valor: number; valor_pago: number; vencimento: string;
  status: StatusR; dias_atraso: number; parcela: string;
}

const MOCK: ContaReceber[] = [
  { id:1, cliente:'Transportes Alves',    documento:'12.345.678/0001-90', descricao:'Frete SP–RJ Maio',    valor:32400, valor_pago:0,     vencimento:'2025-05-10', status:'vencido', dias_atraso:26, parcela:'1/3' },
  { id:2, cliente:'Madeireira São Paulo', documento:'98.765.432/0001-11', descricao:'Transporte Madeira',  valor:18900, valor_pago:18900, vencimento:'2025-05-20', status:'pago',    dias_atraso:0,  parcela:'1/1' },
  { id:3, cliente:'Construtora BH',       documento:'55.111.222/0001-33', descricao:'Frete BH–Uberaba',    valor:12600, valor_pago:6300,  vencimento:'2025-05-25', status:'parcial', dias_atraso:11, parcela:'2/4' },
  { id:4, cliente:'Agro Rio Verde',       documento:'77.444.555/0001-77', descricao:'Colheita Transporte', valor:45000, valor_pago:0,     vencimento:'2025-06-05', status:'aberto',  dias_atraso:0,  parcela:'1/2' },
  { id:5, cliente:'Frigorífico Central',  documento:'33.222.111/0001-44', descricao:'Frete Frigorífico',   valor:8750,  valor_pago:8750,  vencimento:'2025-05-28', status:'pago',    dias_atraso:0,  parcela:'1/1' },
  { id:6, cliente:'Distribuidora Norte',  documento:'66.777.888/0001-55', descricao:'Distribuição Semanal',valor:22300, valor_pago:0,     vencimento:'2025-04-30', status:'vencido', dias_atraso:36, parcela:'3/3' },
  { id:7, cliente:'Cerâmica Sul',         documento:'44.333.999/0001-66', descricao:'Transporte Cerâmica', valor:9400,  valor_pago:0,     vencimento:'2025-06-10', status:'aberto',  dias_atraso:0,  parcela:'1/1' },
  { id:8, cliente:'Comércio Atacadista',  documento:'11.999.888/0001-22', descricao:'Frete Atacado',       valor:15600, valor_pago:15600, vencimento:'2025-05-15', status:'pago',    dias_atraso:0,  parcela:'2/2' },
];

const ST: Record<StatusR, { label: string; css: string }> = {
  aberto:  { label:'Em aberto', css:'st-aberto'  },
  vencido: { label:'Vencido',   css:'st-vencido' },
  pago:    { label:'Pago',      css:'st-pago'    },
  parcial: { label:'Parcial',   css:'st-parcial' },
};

const BASE_STYLES = `
  .page{display:flex;flex-direction:column;gap:20px}
  .page-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px}
  .page-title{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.5px}
  .page-title span{background:linear-gradient(90deg,#f43f5e,#fb923c);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .page-sub{color:var(--muted);font-size:13px;margin-top:4px}
  .btn-novo{background:linear-gradient(135deg,#f43f5e,#fb923c);border:none;border-radius:8px;color:white;font-size:12.5px;font-weight:600;font-family:'Outfit',sans-serif;padding:8px 16px;cursor:pointer}
  .card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px}
  .card-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:16px}
  .card-title{font-family:'Syne',sans-serif;font-weight:700;font-size:15px}
  .filters{display:flex;gap:8px;flex-wrap:wrap}
  .input-f{background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;font-family:'Outfit',sans-serif;padding:6px 12px;outline:none;width:160px}
  .sel-f{background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;font-family:'Outfit',sans-serif;padding:6px 10px;outline:none}
  .table-wrap{overflow-x:auto}
  table{width:100%;border-collapse:collapse;font-size:12.5px}
  thead th{text-align:left;padding:9px 12px;font-size:10.5px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border);white-space:nowrap}
  tbody tr{border-bottom:1px solid rgba(255,255,255,.03);transition:background .15s}
  tbody tr:hover{background:rgba(255,255,255,.03)}
  tbody tr:last-child{border-bottom:none}
  td{padding:10px 12px;vertical-align:middle}
  .cli-name{font-weight:500}.cli-doc{font-size:10.5px;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-top:1px}
  .mono{font-family:'JetBrains Mono',monospace;font-size:12px}
  .badge{font-size:10.5px;font-weight:600;padding:3px 8px;border-radius:20px}
`;

@Component({
  selector: 'app-contas-receber',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Contas a <span>Receber</span></h1>
          <p class="page-sub">Gestão de recebimentos · {{ dados().length }} títulos</p>
        </div>
        <button class="btn-novo">+ Novo Título</button>
      </div>

      <div class="kpi-grid">
        <div class="kpi danger">
          <div class="kpi-label">A Receber</div>
          <div class="kpi-val accent">{{ totalAberto() | currency:'BRL':'symbol':'1.0-0' }}</div>
          <div class="kpi-sub">{{ qtdAberto() }} em aberto</div>
        </div>
        <div class="kpi warning">
          <div class="kpi-label">Vencido</div>
          <div class="kpi-val orange">{{ totalVencido() | currency:'BRL':'symbol':'1.0-0' }}</div>
          <div class="kpi-sub">{{ qtdVencido() }} títulos</div>
        </div>
        <div class="kpi success">
          <div class="kpi-label">Recebido</div>
          <div class="kpi-val green">{{ totalPago() | currency:'BRL':'symbol':'1.0-0' }}</div>
          <div class="kpi-sub">{{ qtdPago() }} quitados</div>
        </div>
        <div class="kpi info">
          <div class="kpi-label">Parcial</div>
          <div class="kpi-val blue">{{ totalParcial() | currency:'BRL':'symbol':'1.0-0' }}</div>
          <div class="kpi-sub">{{ qtdParcial() }} parciais</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Títulos a Receber</h2>
          <div class="filters">
            <input class="input-f" type="text" placeholder="🔍 Buscar cliente…"
                   [(ngModel)]="busca" (ngModelChange)="filtrar()"/>
            <select class="sel-f" [(ngModel)]="filtroStatus" (ngModelChange)="filtrar()">
              <option value="">Todos</option>
              <option value="aberto">Em aberto</option>
              <option value="vencido">Vencido</option>
              <option value="pago">Pago</option>
              <option value="parcial">Parcial</option>
            </select>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>Cliente</th><th>Descrição</th><th>Valor</th><th>Pago</th>
              <th>Vencimento</th><th>Atraso</th><th>Status</th><th>Parcela</th><th>Ação</th>
            </tr></thead>
            <tbody>
              @for (r of filtrados(); track r.id) {
                <tr>
                  <td><div class="cli-name">{{ r.cliente }}</div><div class="cli-doc">{{ r.documento }}</div></td>
                  <td style="font-size:12px;color:var(--muted)">{{ r.descricao }}</td>
                  <td class="mono bold">{{ r.valor | currency:'BRL':'symbol':'1.0-0' }}</td>
                  <td class="mono green-t">{{ r.valor_pago | currency:'BRL':'symbol':'1.0-0' }}</td>
                  <td class="mono">{{ r.vencimento | date:'dd/MM/yy' }}</td>
                  <td>
                    @if (r.dias_atraso > 0) {
                      <span class="dias-b">{{ r.dias_atraso }}d</span>
                    } @else {
                      <span style="color:var(--muted)">—</span>
                    }
                  </td>
                  <td><span class="badge" [class]="stMap[r.status].css">{{ stMap[r.status].label }}</span></td>
                  <td class="mono">{{ r.parcela }}</td>
                  <td>
                    <div class="act-row">
                      <button class="btn-act" title="Registrar pagamento">💰</button>
                      <button class="btn-act" title="Enviar cobrança">📨</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [BASE_STYLES + `
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
    @media(max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:500px){.kpi-grid{grid-template-columns:1fr}}
    .kpi{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;position:relative;overflow:hidden}
    .kpi::before{content:'';position:absolute;top:0;right:0;width:60px;height:60px;border-radius:50%;filter:blur(30px);opacity:.2}
    .kpi.danger::before{background:#f43f5e}.kpi.warning::before{background:#fb923c}
    .kpi.success::before{background:#34d399}.kpi.info::before{background:#38bdf8}
    .kpi-label{font-size:11.5px;color:var(--muted);margin-bottom:10px}
    .kpi-val{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;letter-spacing:-1px;margin-bottom:5px}
    .kpi-sub{font-size:11px;color:var(--muted)}
    .accent{color:#f43f5e}.orange{color:#fb923c}.green{color:#34d399}.blue{color:#38bdf8}.green-t{color:#34d399}.bold{font-weight:600}
    .st-aberto{background:rgba(56,189,248,.12);color:#38bdf8;border:1px solid rgba(56,189,248,.2)}
    .st-vencido{background:rgba(244,63,94,.14);color:#f43f5e;border:1px solid rgba(244,63,94,.25)}
    .st-pago{background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.2)}
    .st-parcial{background:rgba(251,146,60,.12);color:#fb923c;border:1px solid rgba(251,146,60,.2)}
    .dias-b{background:rgba(244,63,94,.14);color:#f43f5e;font-size:11px;font-weight:600;padding:2px 7px;border-radius:20px}
    .act-row{display:flex;gap:6px}
    .btn-act{width:28px;height:28px;border-radius:6px;border:1px solid var(--border);background:rgba(255,255,255,.05);cursor:pointer;font-size:13px;transition:background .15s}
    .btn-act:hover{background:rgba(255,255,255,.1)}
  `],
})
export class ContasReceberComponent {
  readonly dados     = signal(MOCK);
  readonly filtrados = signal(MOCK);
  busca = ''; filtroStatus = '';
  readonly stMap = ST;

  readonly totalAberto  = computed(() => this.dados().filter(r => r.status === 'aberto' ).reduce((s, r) => s + r.valor - r.valor_pago, 0));
  readonly totalVencido = computed(() => this.dados().filter(r => r.status === 'vencido').reduce((s, r) => s + r.valor - r.valor_pago, 0));
  readonly totalPago    = computed(() => this.dados().filter(r => r.status === 'pago'   ).reduce((s, r) => s + r.valor_pago, 0));
  readonly totalParcial = computed(() => this.dados().filter(r => r.status === 'parcial').reduce((s, r) => s + r.valor_pago, 0));
  readonly qtdAberto    = computed(() => this.dados().filter(r => r.status === 'aberto' ).length);
  readonly qtdVencido   = computed(() => this.dados().filter(r => r.status === 'vencido').length);
  readonly qtdPago      = computed(() => this.dados().filter(r => r.status === 'pago'   ).length);
  readonly qtdParcial   = computed(() => this.dados().filter(r => r.status === 'parcial').length);

  filtrar() {
    const b = this.busca.toLowerCase(); const s = this.filtroStatus;
    this.filtrados.set(this.dados().filter(r =>
      (!b || r.cliente.toLowerCase().includes(b)) && (!s || r.status === s)
    ));
  }
}
