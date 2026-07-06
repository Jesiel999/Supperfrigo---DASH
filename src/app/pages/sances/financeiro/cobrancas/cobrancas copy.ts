import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { CobrancasService } from '../../shared/services/cobrancas.service';
import { Cobranca, CanalCobranca } from '../../shared/models/financeiro.models';

@Component({
  selector: 'app-cobrancas',
  imports: [FormsModule, CurrencyPipe],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Central de <span>Cobranças</span></h1>
          <p class="page-sub">Automatização de contatos via WhatsApp e E-mail</p>
        </div>
        <div class="header-actions">
          <button class="btn-auto" (click)="enviarTodosPendentes()">
            ⚡ Enviar todos pendentes
          </button>
          <button class="btn-export" (click)="exportar()">
            ⬇ Exportar
          </button>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid">
        <div class="kpi danger">
          <div class="kpi-top">
            <span class="kpi-label">Aguardando Resposta</span>
            <span class="kpi-icon">📨</span>
          </div>
          <div class="kpi-value accent">{{ svc.kpis().aguardandoResposta }}</div>
          <div class="kpi-sub">cobranças enviadas</div>
        </div>
        <div class="kpi success">
          <div class="kpi-top">
            <span class="kpi-label">Taxa de Retorno</span>
            <span class="kpi-icon">📊</span>
          </div>
          <div class="kpi-value green">{{ svc.kpis().taxaRetorno }}%</div>
          <div class="kpi-sub">pagamentos após cobrança</div>
        </div>
        <div class="kpi info">
          <div class="kpi-top">
            <span class="kpi-label">Valor Recuperado</span>
            <span class="kpi-icon">💰</span>
          </div>
          <div class="kpi-value blue">
            {{ svc.kpis().valorRecuperado | currency:'BRL':'symbol':'1.0-0' }}
          </div>
          <div class="kpi-sub">via cobranças este mês</div>
        </div>
        <div class="kpi warning">
          <div class="kpi-top">
            <span class="kpi-label">WhatsApp Enviados</span>
            <span class="kpi-icon">💬</span>
          </div>
          <div class="kpi-value orange">{{ svc.kpis().whatsappEnviados }}</div>
          <div class="kpi-sub">{{ svc.kpis().emailsEnviados }} e-mails também</div>
        </div>
      </div>

      <!-- Indicadores visuais -->
      <div class="row-2">

        <!-- Funil de cobranças -->
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Funil de Cobranças</h2>
              <p class="card-sub">Status do pipeline de contato</p>
            </div>
          </div>
          <div class="funnel">
            @for (step of funnelSteps; track step.label) {
              <div class="funnel-step">
                <div class="funnel-bar-wrap">
                  <div class="funnel-bar" [style.width.%]="step.pct" [style.background]="step.cor"></div>
                </div>
                <div class="funnel-info">
                  <span class="funnel-label">{{ step.icon }} {{ step.label }}</span>
                  <span class="funnel-val" [style.color]="step.cor">{{ step.count }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Efetividade por canal -->
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Efetividade por Canal</h2>
              <p class="card-sub">Retorno de pagamento por canal</p>
            </div>
          </div>

          <div class="canal-list">
            <div class="canal-item">
              <div class="canal-icon wpp">💬</div>
              <div class="canal-info">
                <div class="canal-name">WhatsApp</div>
                <div class="canal-bar-wrap">
                  <div class="canal-bar" style="width:72%;background:#25d366"></div>
                </div>
                <div class="canal-stats">
                  <span>72% taxa de retorno</span>
                  <span class="canal-count">{{ svc.kpis().whatsappEnviados }} enviados</span>
                </div>
              </div>
            </div>

            <div class="canal-item">
              <div class="canal-icon email">📧</div>
              <div class="canal-info">
                <div class="canal-name">E-mail</div>
                <div class="canal-bar-wrap">
                  <div class="canal-bar" style="width:48%;background:#38bdf8"></div>
                </div>
                <div class="canal-stats">
                  <span>48% taxa de retorno</span>
                  <span class="canal-count">{{ svc.kpis().emailsEnviados }} enviados</span>
                </div>
              </div>
            </div>

            <div class="canal-item">
              <div class="canal-icon both">⚡</div>
              <div class="canal-info">
                <div class="canal-name">Ambos os canais</div>
                <div class="canal-bar-wrap">
                  <div class="canal-bar" style="width:89%;background:#f43f5e"></div>
                </div>
                <div class="canal-stats">
                  <span>89% taxa de retorno</span>
                  <span class="canal-count">recomendado</span>
                </div>
              </div>
            </div>
          </div>

          <div class="tip">
            💡 Usar ambos os canais aumenta em <strong>2,4×</strong> a chance de recuperação
          </div>
        </div>
      </div>

      <!-- Tabela de cobranças -->
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Fila de Cobranças</h2>
            <p class="card-sub">{{ svc.cobrancasFiltradas().length }} registros</p>
          </div>
          <div class="table-filters">
            <input class="input-busca" type="text" placeholder="🔍 Buscar…"
                   [value]="svc.busca()" (input)="svc.setBusca($any($event.target).value)"/>
            <select class="sel" [value]="svc.filtroStatus()"
                    (change)="svc.setFiltroStatus($any($event.target).value)">
              <option value="todos">Todos status</option>
              <option value="pendente">Pendente</option>
              <option value="enviado">Enviado</option>
              <option value="visualizado">Visualizado</option>
              <option value="pago">Pago</option>
              <option value="falhou">Falhou</option>
            </select>
            <select class="sel" [value]="svc.filtroCanal()"
                    (change)="svc.setFiltroCanal($any($event.target).value)">
              <option value="todos">Todos canais</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">E-mail</option>
              <option value="ambos">Ambos</option>
            </select>
            <select class="sel" [value]="svc.filtroPrioridade()"
                    (change)="svc.setFiltroPrioridade($any($event.target).value)">
              <option value="todos">Prioridade</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Prioridade</th>
                <th>Valor</th>
                <th>Atraso</th>
                <th>Status</th>
                <th>Canal</th>
                <th>Tentativas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (c of svc.cobrancasFiltradas(); track c.id) {
                <tr>
                  <td>
                    <div class="client-name">{{ c.nome_pessoa }}</div>
                    <div class="client-doc">{{ c.empresa }} · {{ c.documento }}</div>
                  </td>
                  <td>
                    <span class="prioridade" [class]="'prio-' + c.prioridade">
                      {{ prioLabel[c.prioridade] }}
                    </span>
                  </td>
                  <td>
                    <span class="amount">{{ c.valor_devido | currency:'BRL':'symbol':'1.0-0' }}</span>
                  </td>
                  <td>
                    <span class="days" [class]="diasClass(c.dias_atraso)">
                      {{ c.dias_atraso }}d
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" [class]="'st-' + c.status">
                      {{ statusLabel[c.status] }}
                    </span>
                  </td>
                  <td>
                    <span class="canal-badge" [class]="'canal-' + c.canal">
                      {{ canalLabel[c.canal] }}
                    </span>
                  </td>
                  <td>
                    <div class="tentativas">
                      @for (t of [].constructor(Math.min(c.tentativas, 5)); track $index) {
                        <span class="dot-t filled"></span>
                      }
                      @for (t of [].constructor(Math.max(0, 5 - c.tentativas)); track $index) {
                        <span class="dot-t"></span>
                      }
                    </div>
                    <span class="tent-num">{{ c.tentativas }}×</span>
                  </td>
                  <td>
                    <div class="action-btns">
                      <!-- WhatsApp link direto -->
                      <button class="btn-wpp" title="Abrir WhatsApp"
                              (click)="abrirWhatsapp(c)">
                        💬
                      </button>
                      <!-- E-mail -->
                      <button class="btn-email" title="Enviar E-mail"
                              (click)="enviarEmail(c)"
                              [disabled]="svc.enviando() === c.id">
                        📧
                      </button>
                      <!-- Ambos -->
                      <button class="btn-ambos" title="Enviar por ambos os canais"
                              (click)="enviarAmbos(c)"
                              [disabled]="svc.enviando() === c.id">
                        ⚡
                      </button>
                      <!-- Marcar pago -->
                      @if (c.status !== 'pago') {
                        <button class="btn-pago" title="Marcar como pago"
                                (click)="marcarPago(c.id)">
                          ✅
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Toast notification -->
      @if (toast()) {
        <div class="toast" [class]="'toast-' + toastType()">
          {{ toast() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 24px; }

    /* Header */
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; }
    .page-title  { font-family:'Syne',sans-serif; font-size:24px; font-weight:800; letter-spacing:-.5px; }
    .page-title span {
      background: linear-gradient(90deg,#f43f5e,#fb923c);
      -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    }
    .page-sub { color:var(--muted); font-size:13px; margin-top:5px; }

    .header-actions { display:flex; gap:10px; }
    .btn-auto {
      background: linear-gradient(135deg,#f43f5e,#fb923c); border:none; border-radius:8px;
      color:white; font-size:12px; font-weight:600; font-family:'Outfit',sans-serif;
      padding:8px 16px; cursor:pointer; transition:opacity .2s;
    }
    .btn-auto:hover { opacity:.88; }
    .btn-export {
      background:rgba(255,255,255,.06); border:1px solid var(--border);
      border-radius:8px; color:var(--text); font-size:12px;
      font-family:'Outfit',sans-serif; padding:8px 16px; cursor:pointer;
    }

    /* KPI grid */
    .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
    .kpi {
      background:var(--card); border:1px solid var(--border); border-radius:14px;
      padding:20px; position:relative; overflow:hidden; transition:transform .2s;
    }
    .kpi:hover { transform:translateY(-2px); }
    .kpi::before {
      content:''; position:absolute; top:0; right:0;
      width:70px; height:70px; border-radius:50%; filter:blur(35px); opacity:.2;
    }
    .kpi.danger::before  { background:#f43f5e; }
    .kpi.success::before { background:#34d399; }
    .kpi.info::before    { background:#38bdf8; }
    .kpi.warning::before { background:#fb923c; }

    .kpi-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
    .kpi-label { font-size:12px; color:var(--muted); font-weight:500; }
    .kpi-icon  { font-size:18px; }
    .kpi-value { font-family:'JetBrains Mono',monospace; font-size:26px; font-weight:700; letter-spacing:-1px; line-height:1; margin-bottom:6px; }
    .kpi-value.accent { color:#f43f5e; }
    .kpi-value.green  { color:#34d399; }
    .kpi-value.blue   { color:#38bdf8; }
    .kpi-value.orange { color:#fb923c; }
    .kpi-sub { font-size:11.5px; color:var(--muted); }

    /* Row 2 */
    .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }

    /* Card */
    .card { background:var(--card); border:1px solid var(--border); border-radius:14px; padding:22px; }
    .card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
    .card-title  { font-family:'Syne',sans-serif; font-weight:700; font-size:15px; letter-spacing:-.3px; }
    .card-sub    { font-size:11.5px; color:var(--muted); margin-top:2px; }

    /* Funil */
    .funnel { display:flex; flex-direction:column; gap:10px; }
    .funnel-step { display:flex; align-items:center; gap:12px; }
    .funnel-bar-wrap { flex:1; background:rgba(255,255,255,.06); border-radius:4px; height:8px; overflow:hidden; }
    .funnel-bar { height:100%; border-radius:4px; transition:width .6s ease; }
    .funnel-info { display:flex; justify-content:space-between; width:180px; font-size:12px; }
    .funnel-label { color:var(--muted); }
    .funnel-val   { font-family:'JetBrains Mono',monospace; font-weight:600; }

    /* Canais */
    .canal-list { display:flex; flex-direction:column; gap:16px; }
    .canal-item { display:flex; align-items:flex-start; gap:12px; }
    .canal-icon {
      width:36px; height:36px; border-radius:9px;
      display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0;
    }
    .canal-icon.wpp   { background:rgba(37,211,102,.15); }
    .canal-icon.email { background:rgba(56,189,248,.15); }
    .canal-icon.both  { background:rgba(244,63,94,.15);  }
    .canal-info   { flex:1; }
    .canal-name   { font-size:13px; font-weight:600; margin-bottom:6px; }
    .canal-bar-wrap { background:rgba(255,255,255,.06); border-radius:4px; height:6px; overflow:hidden; margin-bottom:5px; }
    .canal-bar    { height:100%; border-radius:4px; transition:width .6s ease; }
    .canal-stats  { display:flex; justify-content:space-between; font-size:11px; color:var(--muted); }
    .canal-count  { font-family:'JetBrains Mono',monospace; }

    .tip {
      margin-top:16px; padding:10px 14px; border-radius:8px;
      background:rgba(251,146,60,.08); border:1px solid rgba(251,146,60,.2);
      color:#fb923c; font-size:12px;
    }

    /* Table filters */
    .table-filters { display:flex; gap:8px; flex-wrap:wrap; }
    .input-busca {
      background:rgba(255,255,255,.06); border:1px solid var(--border);
      border-radius:8px; color:var(--text); font-size:12px;
      font-family:'Outfit',sans-serif; padding:6px 12px; outline:none; width:160px;
    }
    .sel {
      background:rgba(255,255,255,.06); border:1px solid var(--border);
      border-radius:8px; color:var(--text); font-size:12px;
      font-family:'Outfit',sans-serif; padding:6px 10px; outline:none;
    }

    /* Table */
    .table-wrap { overflow-x:auto; }
    .table-wrap::-webkit-scrollbar { height:4px; }
    .table-wrap::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    thead th {
      text-align:left; padding:10px 14px; font-size:10.5px; font-weight:600;
      letter-spacing:.6px; text-transform:uppercase; color:var(--muted);
      border-bottom:1px solid var(--border); white-space:nowrap;
    }
    tbody tr { border-bottom:1px solid rgba(255,255,255,.03); transition:background .15s; }
    tbody tr:hover { background:rgba(255,255,255,.03); }
    tbody tr:last-child { border-bottom:none; }
    td { padding:11px 14px; vertical-align:middle; }

    .client-name { font-weight:500; }
    .client-doc  { font-size:11px; color:var(--muted); margin-top:2px; font-family:'JetBrains Mono',monospace; }
    .amount { font-family:'JetBrains Mono',monospace; font-weight:600; color:#f43f5e; }

    .days { font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:600; }
    .days.low    { color:#34d399; }
    .days.medium { color:#fb923c; }
    .days.high   { color:#f43f5e; }

    /* Prioridade */
    .prioridade { font-size:10.5px; font-weight:700; padding:3px 8px; border-radius:20px; }
    .prio-alta  { background:rgba(244,63,94,.14);  color:#f43f5e; border:1px solid rgba(244,63,94,.25);  }
    .prio-media { background:rgba(251,146,60,.12); color:#fb923c; border:1px solid rgba(251,146,60,.2);  }
    .prio-baixa { background:rgba(100,116,139,.12);color:var(--muted); border:1px solid var(--border);   }

    /* Status */
    .status-badge { font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px; }
    .st-pendente   { background:rgba(100,116,139,.12); color:var(--muted); border:1px solid var(--border); }
    .st-enviado    { background:rgba(56,189,248,.12);  color:#38bdf8;      border:1px solid rgba(56,189,248,.2);  }
    .st-visualizado{ background:rgba(251,146,60,.12);  color:#fb923c;      border:1px solid rgba(251,146,60,.2);  }
    .st-pago       { background:rgba(52,211,153,.12);  color:#34d399;      border:1px solid rgba(52,211,153,.2);  }
    .st-falhou     { background:rgba(244,63,94,.14);   color:#f43f5e;      border:1px solid rgba(244,63,94,.25);  }

    /* Canal badge */
    .canal-badge { font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px; }
    .canal-whatsapp { background:rgba(37,211,102,.12); color:#25d366;  border:1px solid rgba(37,211,102,.25); }
    .canal-email    { background:rgba(56,189,248,.12); color:#38bdf8;  border:1px solid rgba(56,189,248,.2);  }
    .canal-ambos    { background:rgba(244,63,94,.1);   color:#fb923c;  border:1px solid rgba(251,146,60,.2);  }

    /* Tentativas */
    .tentativas { display:flex; gap:3px; margin-bottom:3px; }
    .dot-t { width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,.1); display:inline-block; }
    .dot-t.filled { background:#f43f5e; }
    .tent-num { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--muted); }

    /* Action buttons */
    .action-btns { display:flex; gap:6px; }
    .action-btns button {
      width:30px; height:30px; border-radius:8px; border:none;
      cursor:pointer; font-size:14px; display:flex; align-items:center;
      justify-content:center; transition:all .18s;
    }
    .action-btns button:disabled { opacity:.4; cursor:not-allowed; }
    .btn-wpp   { background:rgba(37,211,102,.15); }
    .btn-wpp:hover   { background:rgba(37,211,102,.3); }
    .btn-email { background:rgba(56,189,248,.15); }
    .btn-email:hover { background:rgba(56,189,248,.3); }
    .btn-ambos { background:rgba(251,146,60,.15); }
    .btn-ambos:hover { background:rgba(251,146,60,.3); }
    .btn-pago  { background:rgba(52,211,153,.15); }
    .btn-pago:hover  { background:rgba(52,211,153,.3); }

    /* Toast */
    .toast {
      position:fixed; bottom:28px; right:28px;
      padding:12px 20px; border-radius:10px;
      font-size:13px; font-weight:500; z-index:9999;
      animation:slideIn .3s ease;
      box-shadow:0 8px 24px rgba(0,0,0,.4);
    }
    @keyframes slideIn {
      from { transform:translateY(20px); opacity:0; }
      to   { transform:translateY(0);   opacity:1; }
    }
    .toast-success { background:#14532d; border:1px solid #34d399; color:#34d399; }
    .toast-error   { background:#450a0a; border:1px solid #f43f5e; color:#f43f5e; }
    .toast-info    { background:#0c2a3e; border:1px solid #38bdf8; color:#38bdf8; }

    @media (max-width:1100px) {
      .kpi-grid { grid-template-columns:repeat(2,1fr); }
      .row-2    { grid-template-columns:1fr; }
    }
  `],
})
export class CobrancasComponent {
  protected readonly svc = inject(CobrancasService);
  protected readonly Math = Math;

  toast      = signal('');
  toastType  = signal<'success'|'error'|'info'>('info');

  readonly prioLabel: Record<string, string> = {
    alta: '🔴 Alta', media: '🟡 Média', baixa: '🟢 Baixa'
  };
  readonly statusLabel: Record<string, string> = {
    pendente: 'Pendente', enviado: 'Enviado', visualizado: 'Visualizado',
    pago: 'Pago', falhou: 'Falhou'
  };
  readonly canalLabel: Record<string, string> = {
    whatsapp: '💬 WhatsApp', email: '📧 E-mail', ambos: '⚡ Ambos'
  };

  readonly funnelSteps = [
    { label:'Pendentes',    icon:'⏳', count:4, pct:100, cor:'#64748b' },
    { label:'Enviadas',     icon:'📨', count:3, pct:75,  cor:'#38bdf8' },
    { label:'Visualizadas', icon:'👁️', count:2, pct:50,  cor:'#fb923c' },
    { label:'Pagas',        icon:'✅', count:2, pct:50,  cor:'#34d399' },
    { label:'Falhou',       icon:'❌', count:1, pct:25,  cor:'#f43f5e' },
  ];

  diasClass(dias: number): string {
    if (dias <= 30)  return 'days low';
    if (dias <= 60)  return 'days medium';
    return 'days high';
  }

  abrirWhatsapp(c: Cobranca) {
    this.svc.abrirWhatsapp(c);
    this.showToast(`WhatsApp aberto para ${c.nome_pessoa}`, 'success');
  }

  enviarEmail(c: Cobranca) {
    this.svc.marcarStatus(c.id, 'enviado');
    this.showToast(`E-mail enviado para ${c.email}`, 'success');
  }

  enviarAmbos(c: Cobranca) {
    this.svc.abrirWhatsapp(c);
    this.svc.marcarStatus(c.id, 'enviado');
    this.showToast(`WhatsApp + E-mail enviados para ${c.nome_pessoa}`, 'success');
  }

  marcarPago(id: string) {
    this.svc.marcarStatus(id, 'pago');
    this.showToast('Cliente marcado como pago ✅', 'success');
  }

  enviarTodosPendentes() {
    const pendentes = this.svc.cobrancasFiltradas().filter((c) => c.status === 'pendente');
    pendentes.forEach((c) => this.svc.marcarStatus(c.id, 'enviado'));
    this.showToast(`${pendentes.length} cobranças enviadas via WhatsApp!`, 'info');
  }

  exportar() {
    this.showToast('Exportando relatório de cobranças…', 'info');
  }

  private showToast(msg: string, type: 'success'|'error'|'info') {
    this.toast.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toast.set(''), 3500);
  }
}
