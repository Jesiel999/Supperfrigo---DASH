import { Component, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

type StatusP = 'pendente' | 'vencido' | 'pago' | 'agendado';
interface ContaPagar {
  id:string; fornecedor:string; categoria:string; descricao:string;
  valor:number; vencimento:string; status:StatusP; dias_atraso:number; forma:string;
}
const MOCK: ContaPagar[] = [
  { id:'p1', fornecedor:'Posto BR Gasolina',     categoria:'Combustível', descricao:'Abastecimento frota Jun',  valor:18400, vencimento:'2025-06-10', status:'pendente', dias_atraso:0,  forma:'Boleto'   },
  { id:'p2', fornecedor:'Seguradora Mapfre',      categoria:'Seguros',     descricao:'Seguro frota anual',       valor:32000, vencimento:'2025-05-30', status:'vencido',  dias_atraso:6,  forma:'Débito'   },
  { id:'p3', fornecedor:'Oficina Rota Diesel',    categoria:'Manutenção',  descricao:'Revisão caminhões',        valor:7800,  vencimento:'2025-05-25', status:'pago',     dias_atraso:0,  forma:'PIX'      },
  { id:'p4', fornecedor:'Locação Galpão Sul',     categoria:'Aluguel',     descricao:'Galpão logístico Mai/Jun', valor:9500,  vencimento:'2025-06-05', status:'agendado', dias_atraso:0,  forma:'TED'      },
  { id:'p5', fornecedor:'Telecom Fibra Net',      categoria:'Telecom',     descricao:'Link dedicado mensal',     valor:2400,  vencimento:'2025-05-20', status:'pago',     dias_atraso:0,  forma:'Débito'   },
  { id:'p6', fornecedor:'Pneus Nordeste Ltda',    categoria:'Manutenção',  descricao:'Pneus novos lote 12',      valor:14200, vencimento:'2025-04-28', status:'vencido',  dias_atraso:38, forma:'Boleto'   },
  { id:'p7', fornecedor:'Folha de Pagamento',     categoria:'RH',          descricao:'Salários Junho 2025',      valor:85000, vencimento:'2025-06-05', status:'agendado', dias_atraso:0,  forma:'TED'      },
  { id:'p8', fornecedor:'Receita Federal',        categoria:'Impostos',    descricao:'IRPJ + CSLL trim 1',       valor:22000, vencimento:'2025-06-30', status:'pendente', dias_atraso:0,  forma:'DARF'     },
];
const ST: Record<StatusP, { label:string; css:string }> = {
  pendente:  { label:'Pendente',  css:'st-pendente'  },
  vencido:   { label:'Vencido',   css:'st-vencido'   },
  pago:      { label:'Pago',      css:'st-pago'      },
  agendado:  { label:'Agendado',  css:'st-agendado'  },
};

@Component({
  selector: 'app-contas-pagar',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Contas a <span>Pagar</span></h1>
          <p class="page-sub">Gestão de pagamentos · {{ dados().length }} títulos</p>
        </div>
        <button class="btn-novo">+ Novo Lançamento</button>
      </div>

      <div class="kpi-grid">
        <div class="kpi danger">
          <div class="kpi-label">Total a Pagar</div>
          <div class="kpi-value accent">{{ totalPendente() | currency:'BRL':'symbol':'1.0-0' }}</div>
          <div class="kpi-sub">{{ qtdPendente() }} em aberto</div>
        </div>
        <div class="kpi warning">
          <div class="kpi-label">Vencido</div>
          <div class="kpi-value orange">{{ totalVencido() | currency:'BRL':'symbol':'1.0-0' }}</div>
          <div class="kpi-sub">{{ qtdVencido() }} títulos</div>
        </div>
        <div class="kpi info">
          <div class="kpi-label">Agendado</div>
          <div class="kpi-value blue">{{ totalAgendado() | currency:'BRL':'symbol':'1.0-0' }}</div>
          <div class="kpi-sub">{{ qtdAgendado() }} a vencer</div>
        </div>
        <div class="kpi success">
          <div class="kpi-label">Pago no Mês</div>
          <div class="kpi-value green">{{ totalPago() | currency:'BRL':'symbol':'1.0-0' }}</div>
          <div class="kpi-sub">{{ qtdPago() }} quitados</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Títulos a Pagar</h2>
          <div class="filters">
            <input class="input-f" type="text" placeholder="🔍 Buscar…" [(ngModel)]="busca" (ngModelChange)="filtrar()"/>
            <select class="sel-f" [(ngModel)]="filtroStatus" (ngModelChange)="filtrar()">
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="vencido">Vencido</option>
              <option value="agendado">Agendado</option>
              <option value="pago">Pago</option>
            </select>
            <select class="sel-f" [(ngModel)]="filtroCategoria" (ngModelChange)="filtrar()">
              <option value="">Categoria</option>
              <option>Combustível</option><option>Seguros</option>
              <option>Manutenção</option><option>Aluguel</option>
              <option>RH</option><option>Impostos</option>
            </select>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>Fornecedor</th><th>Categoria</th><th>Descrição</th>
              <th>Valor</th><th>Vencimento</th><th>Atraso</th>
              <th>Forma</th><th>Status</th><th>Ação</th>
            </tr></thead>
            <tbody>
              @for (p of filtrados(); track p.id) {
                <tr>
                  <td class="cli-name">{{ p.fornecedor }}</td>
                  <td><span class="cat-badge">{{ p.categoria }}</span></td>
                  <td style="color:var(--muted);font-size:12px">{{ p.descricao }}</td>
                  <td class="mono bold accent">{{ p.valor | currency:'BRL':'symbol':'1.0-0' }}</td>
                  <td class="mono">{{ p.vencimento | date:'dd/MM/yy' }}</td>
                  <td>@if(p.dias_atraso>0){ <span class="dias-badge">{{ p.dias_atraso }}d</span> } @else { <span style="color:var(--muted)">—</span> }</td>
                  <td style="font-size:12px;color:var(--muted)">{{ p.forma }}</td>
                  <td><span class="badge" [class]="stMap[p.status].css">{{ stMap[p.status].label }}</span></td>
                  <td>
                    <div class="act-row">
                      <button class="btn-act" title="Marcar pago">✅</button>
                      <button class="btn-act" title="Editar">✏️</button>
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
  styles: [`
    .page{display:flex;flex-direction:column;gap:20px}
    .page-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px}
    .page-title{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.5px}
    .page-title span{background:linear-gradient(90deg,#f43f5e,#fb923c);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .page-sub{color:var(--muted);font-size:13px;margin-top:4px}
    .btn-novo{background:linear-gradient(135deg,#f43f5e,#fb923c);border:none;border-radius:8px;color:white;font-size:12.5px;font-weight:600;font-family:'Outfit',sans-serif;padding:8px 16px;cursor:pointer}
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
    @media(max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:500px){.kpi-grid{grid-template-columns:1fr}}
    .kpi{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;position:relative;overflow:hidden}
    .kpi-label{font-size:11.5px;color:var(--muted);margin-bottom:10px}
    .kpi-value{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;letter-spacing:-1px;margin-bottom:5px}
    .kpi-sub{font-size:11px;color:var(--muted)}
    .accent{color:#f43f5e}.orange{color:#fb923c}.green{color:#34d399}.blue{color:#38bdf8}
    .kpi::before{content:'';position:absolute;top:0;right:0;width:60px;height:60px;border-radius:50%;filter:blur(30px);opacity:.2}
    .kpi.danger::before{background:#f43f5e}.kpi.warning::before{background:#fb923c}
    .kpi.success::before{background:#34d399}.kpi.info::before{background:#38bdf8}
    .card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px}
    .card-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:16px}
    .card-title{font-family:'Syne',sans-serif;font-weight:700;font-size:15px}
    .filters{display:flex;gap:8px;flex-wrap:wrap}
    .input-f{background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;font-family:'Outfit',sans-serif;padding:6px 12px;outline:none;width:150px}
    .sel-f{background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;font-family:'Outfit',sans-serif;padding:6px 10px;outline:none}
    .table-wrap{overflow-x:auto}
    table{width:100%;border-collapse:collapse;font-size:12.5px}
    thead th{text-align:left;padding:9px 12px;font-size:10.5px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border);white-space:nowrap}
    tbody tr{border-bottom:1px solid rgba(255,255,255,.03);transition:background .15s}
    tbody tr:hover{background:rgba(255,255,255,.03)}
    tbody tr:last-child{border-bottom:none}
    td{padding:10px 12px;vertical-align:middle}
    .cli-name{font-weight:500}
    .mono{font-family:'JetBrains Mono',monospace;font-size:12px}.bold{font-weight:600}
    .badge{font-size:10.5px;font-weight:600;padding:3px 8px;border-radius:20px}
    .cat-badge{background:rgba(167,139,250,.12);color:#a78bfa;border:1px solid rgba(167,139,250,.2);font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:20px}
    .st-pendente{background:rgba(100,116,139,.12);color:var(--muted);border:1px solid var(--border)}
    .st-vencido{background:rgba(244,63,94,.14);color:#f43f5e;border:1px solid rgba(244,63,94,.25)}
    .st-pago{background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.2)}
    .st-agendado{background:rgba(56,189,248,.12);color:#38bdf8;border:1px solid rgba(56,189,248,.2)}
    .dias-badge{background:rgba(244,63,94,.14);color:#f43f5e;font-size:11px;font-weight:600;padding:2px 7px;border-radius:20px}
    .act-row{display:flex;gap:6px}
    .btn-act{width:28px;height:28px;border-radius:6px;border:1px solid var(--border);background:rgba(255,255,255,.05);cursor:pointer;font-size:13px;transition:background .15s}
    .btn-act:hover{background:rgba(255,255,255,.1)}
  `],
})
export class ContasPagarComponent {
  readonly dados = signal(MOCK);
  readonly filtrados = signal(MOCK);
  busca = ''; filtroStatus = ''; filtroCategoria = '';
  readonly stMap = ST;
  readonly totalPendente  = computed(()=>this.dados().filter(p=>p.status==='pendente').reduce((s,p)=>s+p.valor,0));
  readonly totalVencido   = computed(()=>this.dados().filter(p=>p.status==='vencido').reduce((s,p)=>s+p.valor,0));
  readonly totalAgendado  = computed(()=>this.dados().filter(p=>p.status==='agendado').reduce((s,p)=>s+p.valor,0));
  readonly totalPago      = computed(()=>this.dados().filter(p=>p.status==='pago').reduce((s,p)=>s+p.valor,0));
  readonly qtdPendente    = computed(()=>this.dados().filter(p=>p.status==='pendente').length);
  readonly qtdVencido     = computed(()=>this.dados().filter(p=>p.status==='vencido').length);
  readonly qtdAgendado    = computed(()=>this.dados().filter(p=>p.status==='agendado').length);
  readonly qtdPago        = computed(()=>this.dados().filter(p=>p.status==='pago').length);
  filtrar(){
    const b=this.busca.toLowerCase(); const s=this.filtroStatus; const c=this.filtroCategoria;
    this.filtrados.set(this.dados().filter(p=>(!b||p.fornecedor.toLowerCase().includes(b))&&(!s||p.status===s)&&(!c||p.categoria===c)));
  }
}
