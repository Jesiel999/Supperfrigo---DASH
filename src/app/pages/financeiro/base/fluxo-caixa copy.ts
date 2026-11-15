import { Component, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

interface Lancamento { id:string; data:string; desc:string; tipo:'entrada'|'saida'; cat:string; valor:number; saldo:number; }
const MOCK: Lancamento[] = [
  { id:'f1',  data:'01/06', desc:'Recebimento Transportes Alves',    tipo:'entrada', cat:'Frete',      valor:32400, saldo:102400 },
  { id:'f2',  data:'02/06', desc:'Combustível frota',                tipo:'saida',   cat:'Operacional', valor:8400,  saldo:94000  },
  { id:'f3',  data:'03/06', desc:'Recebimento Madeireira SP',        tipo:'entrada', cat:'Frete',      valor:18900, saldo:112900 },
  { id:'f4',  data:'04/06', desc:'Salários motoristas',              tipo:'saida',   cat:'RH',         valor:42000, saldo:70900  },
  { id:'f5',  data:'05/06', desc:'Manutenção preventiva',            tipo:'saida',   cat:'Manutenção', valor:7800,  saldo:63100  },
  { id:'f6',  data:'06/06', desc:'Recebimento Frigorífico Central',  tipo:'entrada', cat:'Frete',      valor:47300, saldo:110400 },
  { id:'f7',  data:'07/06', desc:'Seguro frota mensal',              tipo:'saida',   cat:'Seguros',    valor:5200,  saldo:105200 },
  { id:'f8',  data:'08/06', desc:'Recebimento Distribuidora Norte',  tipo:'entrada', cat:'Frete',      valor:41100, saldo:146300 },
  { id:'f9',  data:'09/06', desc:'Aluguel galpão logístico',         tipo:'saida',   cat:'Aluguel',    valor:9500,  saldo:136800 },
  { id:'f10', data:'10/06', desc:'IRPJ + CSLL',                      tipo:'saida',   cat:'Impostos',   valor:22000, saldo:114800 },
];

@Component({
  selector: 'app-fluxo-caixa',
  imports: [CurrencyPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Fluxo de <span>Caixa</span></h1>
          <p class="page-sub">Entradas e saídas · Junho 2025</p>
        </div>
        <div class="header-acts">
          <select class="sel-f">
            <option>Junho 2025</option><option>Maio 2025</option>
          </select>
          <button class="btn-novo">⬇ Exportar</button>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid">
        <div class="kpi success">
          <div class="kpi-label">Total Entradas</div>
          <div class="kpi-value green">{{ totalEntradas() | currency:'BRL':'symbol':'1.0-0' }}</div>
        </div>
        <div class="kpi danger">
          <div class="kpi-label">Total Saídas</div>
          <div class="kpi-value accent">{{ totalSaidas() | currency:'BRL':'symbol':'1.0-0' }}</div>
        </div>
        <div class="kpi info">
          <div class="kpi-label">Saldo Período</div>
          <div class="kpi-value" [class]="saldoPeriodo()>=0 ? 'green' : 'accent'">
            {{ saldoPeriodo() | currency:'BRL':'symbol':'1.0-0' }}
          </div>
        </div>
        <div class="kpi warning">
          <div class="kpi-label">Saldo Atual</div>
          <div class="kpi-value orange">{{ saldoAtual() | currency:'BRL':'symbol':'1.0-0' }}</div>
        </div>
      </div>

      <!-- SVG Chart -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Evolução do Saldo</h2>
          <div class="legend-row">
            <span class="leg-item"><span class="leg-dot" style="background:#34d399"></span>Entradas</span>
            <span class="leg-item"><span class="leg-dot" style="background:#f43f5e"></span>Saídas</span>
            <span class="leg-item"><span class="leg-dot" style="background:#38bdf8"></span>Saldo</span>
          </div>
        </div>
        <div class="chart-wrap">
          <svg viewBox="0 0 700 180" preserveAspectRatio="none" style="width:100%;height:180px;overflow:visible">
            <defs>
              <linearGradient id="gSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38bdf8" stop-opacity=".25"/>
                <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <!-- Grid -->
            @for (y of [40,80,120,160]; track y) {
              <line x1="0" [attr.y1]="y" x2="700" [attr.y2]="y" stroke="rgba(255,255,255,.04)" stroke-width="1"/>
            }
            <!-- Bars entrada/saida -->
            @for (item of chartData(); track $index) {
              <rect [attr.x]="item.x-14" [attr.y]="item.yIn" [attr.width]="10" [attr.height]="item.hIn" fill="#34d399" opacity=".7" rx="2"/>
              <rect [attr.x]="item.x+4"  [attr.y]="item.ySa" [attr.width]="10" [attr.height]="item.hSa" fill="#f43f5e" opacity=".7" rx="2"/>
              <text [attr.x]="item.x" y="176" font-size="8" fill="#475569" text-anchor="middle" font-family="JetBrains Mono">{{ item.label }}</text>
            }
            <!-- Saldo line -->
            <path [attr.d]="saldoPath()" fill="url(#gSaldo)"/>
            <path [attr.d]="saldoLine()" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <!-- Tabela -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Lançamentos</h2>
          <div class="toggle-row">
            <button class="tog" [class.active]="filtro()==='todos'" (click)="filtro.set('todos')">Todos</button>
            <button class="tog" [class.active]="filtro()==='entrada'" (click)="filtro.set('entrada')">Entradas</button>
            <button class="tog" [class.active]="filtro()==='saida'" (click)="filtro.set('saida')">Saídas</button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th><th>Saldo</th></tr></thead>
            <tbody>
              @for (l of lancamentosFiltrados(); track l.id) {
                <tr>
                  <td class="mono">{{ l.data }}</td>
                  <td>{{ l.desc }}</td>
                  <td><span class="cat-b">{{ l.cat }}</span></td>
                  <td><span class="tipo-b" [class]="l.tipo==='entrada'?'entrada':'saida'">{{ l.tipo==='entrada'?'↑ Entrada':'↓ Saída' }}</span></td>
                  <td class="mono" [class]="l.tipo==='entrada'?'green':'accent'">
                    {{ l.tipo==='entrada'?'+':'-' }}{{ l.valor | currency:'BRL':'symbol':'1.0-0' }}
                  </td>
                  <td class="mono" style="color:var(--muted)">{{ l.saldo | currency:'BRL':'symbol':'1.0-0' }}</td>
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
    .page-title{font-family:'Syne',sans-serif;font-size:22px;font-weight:800}
    .page-title span{background:linear-gradient(90deg,#34d399,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .page-sub{color:var(--muted);font-size:13px;margin-top:4px}
    .header-acts{display:flex;gap:8px}
    .sel-f{background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;font-family:'Outfit',sans-serif;padding:6px 10px;outline:none}
    .btn-novo{background:linear-gradient(135deg,#34d399,#38bdf8);border:none;border-radius:8px;color:#0b0f1a;font-size:12.5px;font-weight:700;font-family:'Outfit',sans-serif;padding:8px 16px;cursor:pointer}
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
    @media(max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:500px){.kpi-grid{grid-template-columns:1fr}}
    .kpi{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;position:relative;overflow:hidden}
    .kpi::before{content:'';position:absolute;top:0;right:0;width:60px;height:60px;border-radius:50%;filter:blur(30px);opacity:.2}
    .kpi.success::before{background:#34d399}.kpi.danger::before{background:#f43f5e}.kpi.info::before{background:#38bdf8}.kpi.warning::before{background:#fb923c}
    .kpi-label{font-size:11.5px;color:var(--muted);margin-bottom:10px}
    .kpi-value{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;letter-spacing:-1px}
    .green{color:#34d399}.accent{color:#f43f5e}.orange{color:#fb923c}
    .card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px}
    .card-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:16px}
    .card-title{font-family:'Syne',sans-serif;font-weight:700;font-size:15px}
    .legend-row{display:flex;gap:16px}
    .leg-item{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}
    .leg-dot{width:8px;height:8px;border-radius:50%;display:inline-block}
    .chart-wrap{overflow:hidden}
    .table-wrap{overflow-x:auto}
    table{width:100%;border-collapse:collapse;font-size:12.5px}
    thead th{text-align:left;padding:9px 12px;font-size:10.5px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border);white-space:nowrap}
    tbody tr{border-bottom:1px solid rgba(255,255,255,.03);transition:background .15s}
    tbody tr:hover{background:rgba(255,255,255,.03)}
    tbody tr:last-child{border-bottom:none}
    td{padding:10px 12px;vertical-align:middle}
    .mono{font-family:'JetBrains Mono',monospace;font-size:12px}
    .cat-b{background:rgba(167,139,250,.12);color:#a78bfa;border:1px solid rgba(167,139,250,.2);font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:20px}
    .tipo-b{font-size:11px;font-weight:600;padding:3px 8px;border-radius:20px}
    .entrada{background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.2)}
    .saida{background:rgba(244,63,94,.12);color:#f43f5e;border:1px solid rgba(244,63,94,.2)}
    .toggle-row{display:flex;gap:4px}
    .tog{background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--muted);font-size:12px;font-family:'Outfit',sans-serif;padding:5px 12px;cursor:pointer;transition:all .18s}
    .tog.active{background:rgba(244,63,94,.12);color:#f43f5e;border-color:rgba(244,63,94,.3)}
  `],
})
export class FluxoCaixaComponent {
  readonly dados  = signal(MOCK);
  readonly filtro = signal<'todos'|'entrada'|'saida'>('todos');

  readonly totalEntradas  = computed(()=>MOCK.filter(l=>l.tipo==='entrada').reduce((s,l)=>s+l.valor,0));
  readonly totalSaidas    = computed(()=>MOCK.filter(l=>l.tipo==='saida').reduce((s,l)=>s+l.valor,0));
  readonly saldoPeriodo   = computed(()=>this.totalEntradas()-this.totalSaidas());
  readonly saldoAtual     = computed(()=>MOCK[MOCK.length-1]?.saldo ?? 0);

  readonly lancamentosFiltrados = computed(()=>{
    const f=this.filtro();
    return f==='todos' ? MOCK : MOCK.filter(l=>l.tipo===f);
  });

  readonly chartData = computed(()=>{
    const maxV = Math.max(...MOCK.map(l=>l.valor), 1);
    const H = 140; const step = 700 / (MOCK.length - 1);
    return MOCK.map((l, i) => {
      const h = Math.round((l.valor/maxV)*H*.7);
      return {
        x: Math.round(20 + i * step * 0.88),
        label: l.data.slice(0,2),
        yIn: l.tipo==='entrada' ? 155-h : 155,
        hIn: l.tipo==='entrada' ? h : 0,
        ySa: l.tipo==='saida'   ? 155-h : 155,
        hSa: l.tipo==='saida'   ? h : 0,
      };
    });
  });

  readonly saldoLine = computed(()=>{
    const maxS = Math.max(...MOCK.map(l=>l.saldo));
    const minS = Math.min(...MOCK.map(l=>l.saldo));
    const range = maxS - minS || 1;
    const H = 120; const step = 700/(MOCK.length-1);
    const pts = MOCK.map((l,i)=>{
      const x = Math.round(20 + i*step*0.88);
      const y = Math.round(155 - ((l.saldo-minS)/range)*H);
      return `${i===0?'M':'L'}${x},${y}`;
    });
    return pts.join(' ');
  });

  readonly saldoPath = computed(()=>{
    const line = this.saldoLine();
    return `${line} L${Math.round(20+700*0.88)},155 L20,155 Z`;
  });
}
