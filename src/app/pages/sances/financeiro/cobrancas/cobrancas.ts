import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { CobrancasService, CobrancaComVencimento } from '../../../../shared/services/cobrancas.service';

type Aba = 'cobrancas' | 'envios' | 'clientes';

@Component({
  selector: 'app-cobrancas',
  imports: [FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Central de <span>Cobranças</span></h1>
          <p class="page-sub">Automatização de contatos via WhatsApp e E-mail</p>
        </div>
        <div class="header-actions">
          <button class="btn-auto" (click)="dispararEnvioHoje()">
            ⚡ Enviar títulos de hoje ({{ svc.titulosParaEnvioHoje().length }})
          </button>
          <button class="btn-export" (click)="exportar()">
            ⬇ Exportar
          </button>
        </div>
      </div>

      <!-- Config: envio automático -->
      <div class="card auto-config">
        <div class="auto-config-left">
          <span class="auto-config-icon">⏰</span>
          <div>
            <div class="auto-config-title">Envio automático às {{ svc.horaEnvioAutomatico() }}</div>
            <div class="auto-config-sub">
              @if (svc.envioAutomaticoAtivo()) {
                Ativo — todo dia, os títulos que baterem em algum marco do funil são enviados sozinhos.
              } @else {
                Desativado — os envios continuam só manuais até você ligar isso.
              }
            </div>
          </div>
        </div>
        <label class="switch">
          <input type="checkbox" [checked]="svc.envioAutomaticoAtivo()"
                 (change)="toggleEnvioAutomatico($any($event.target).checked)"/>
          <span class="slider"></span>
        </label>
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

      <!-- Abas -->
      <div class="tabs">
        <button class="tab" [class.active]="aba() === 'cobrancas'" (click)="aba.set('cobrancas')">📋 Cobranças</button>
        <button class="tab" [class.active]="aba() === 'envios'" (click)="aba.set('envios')">📤 Relatório de Envios</button>
        <button class="tab" [class.active]="aba() === 'clientes'" (click)="aba.set('clientes')">🏢 Relatório por Cliente</button>
      </div>

      <!-- ══════════════ ABA: COBRANÇAS ══════════════ -->
      @if (aba() === 'cobrancas') {

        <div class="row-2">

          <!-- Funil por vencimento -->
          <div class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Funil de Cobranças</h2>
                <p class="card-sub">Marcos de vencimento (gatilhos do envio automático)</p>
              </div>
            </div>
            <div class="funnel">
              @for (marco of svc.funilVencimento(); track marco.label) {
                <div class="funnel-step">
                  <div class="funnel-bar-wrap">
                    <div class="funnel-bar" [style.width.%]="marco.pct" [style.background]="marco.cor"></div>
                  </div>
                  <div class="funnel-info">
                    <span class="funnel-label">{{ marco.icon }} {{ marco.label }}</span>
                    <span class="funnel-val" [style.color]="marco.cor">{{ marco.count }}</span>
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
              <p class="card-sub">{{ svc.cobrancasFiltradas().length }} títulos</p>
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
                  <th>Vencimento</th>
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
                      <span class="days" [class]="diasClass(svc.diasAteVencimento(c))">
                        {{ vencimentoLabel(c) }}
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
                        @for (i of dotsPreenchidos(c.tentativas); track i) {
                          <span class="dot-t filled"></span>
                        }
                        @for (i of dotsVazios(c.tentativas); track i) {
                          <span class="dot-t"></span>
                        }
                      </div>
                      <span class="tent-num">{{ c.tentativas }}×</span>
                    </td>
                    <td>
                      <div class="action-btns">
                        <button class="btn-wpp" title="Abrir WhatsApp" (click)="abrirWhatsapp(c)">💬</button>
                        <button class="btn-email" title="Enviar E-mail" (click)="enviarEmail(c)"
                                [disabled]="svc.enviando() === c.id">📧</button>
                        <button class="btn-ambos" title="Enviar por ambos os canais" (click)="enviarAmbos(c)"
                                [disabled]="svc.enviando() === c.id">⚡</button>
                        <button class="btn-msg" title="Personalizar mensagem deste título" (click)="abrirCompositor(c)">✏️</button>
                        @if (c.status !== 'pago') {
                          <button class="btn-pago" title="Marcar como pago" (click)="marcarPago(c.id)">✅</button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ══════════════ ABA: RELATÓRIO DE ENVIOS ══════════════ -->
      @if (aba() === 'envios') {
        <div class="kpi-grid kpi-grid-5">
          <div class="kpi info"><div class="kpi-top"><span class="kpi-label">Total de Envios</span><span class="kpi-icon">📤</span></div><div class="kpi-value blue">{{ svc.resumoEnvios().total }}</div></div>
          <div class="kpi success"><div class="kpi-top"><span class="kpi-label">WhatsApp</span><span class="kpi-icon">💬</span></div><div class="kpi-value green">{{ svc.resumoEnvios().whatsapp }}</div></div>
          <div class="kpi warning"><div class="kpi-top"><span class="kpi-label">E-mail</span><span class="kpi-icon">📧</span></div><div class="kpi-value orange">{{ svc.resumoEnvios().email }}</div></div>
          <div class="kpi danger"><div class="kpi-top"><span class="kpi-label">Falhas</span><span class="kpi-icon">❌</span></div><div class="kpi-value accent">{{ svc.resumoEnvios().falhas }}</div></div>
          <div class="kpi info"><div class="kpi-top"><span class="kpi-label">Automáticos (08h)</span><span class="kpi-icon">⏰</span></div><div class="kpi-value blue">{{ svc.resumoEnvios().automaticos }}</div></div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Histórico de Envios</h2>
              <p class="card-sub">{{ svc.historicoEnvios().length }} registros</p>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Cliente</th>
                  <th>Canal</th>
                  <th>Origem</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                @for (h of svc.historicoEnvios(); track h.id) {
                  <tr>
                    <td class="mono">{{ h.data_envio | date:'dd/MM/yy HH:mm' }}</td>
                    <td>
                      <div class="client-name">{{ h.nome_pessoa }}</div>
                      <div class="client-doc">{{ h.documento }}</div>
                    </td>
                    <td>
                      <span class="canal-badge" [class]="'canal-' + h.canal">
                        {{ h.canal === 'whatsapp' ? '💬 WhatsApp' : '📧 E-mail' }}
                      </span>
                    </td>
                    <td>{{ h.automatico ? '⏰ Automático' : '🖱️ Manual' }}</td>
                    <td>
                      <span class="status-badge" [class]="h.sucesso ? 'st-pago' : 'st-falhou'">
                        {{ h.sucesso ? 'Enviado' : 'Falhou' }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="empty-row">Nenhum envio registrado ainda.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ══════════════ ABA: RELATÓRIO POR CLIENTE ══════════════ -->
      @if (aba() === 'clientes') {
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Cobrança Consolidada por Cliente</h2>
              <p class="card-sub">{{ svc.relatorioPorCliente().length }} clientes com títulos em aberto</p>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Títulos</th>
                  <th>Valor Total</th>
                  <th>Pagos</th>
                  <th>Pendentes</th>
                  <th>Último Envio</th>
                </tr>
              </thead>
              <tbody>
                @for (r of svc.relatorioPorCliente(); track r.documento) {
                  <tr>
                    <td>
                      <div class="client-name">{{ r.nome_pessoa }}</div>
                      <div class="client-doc">{{ r.empresa }} · {{ r.documento }}</div>
                    </td>
                    <td class="mono">{{ r.qtd_titulos }}</td>
                    <td><span class="amount">{{ r.valor_total | currency:'BRL':'symbol':'1.0-0' }}</span></td>
                    <td class="mono">{{ r.qtd_pagos }}</td>
                    <td class="mono">{{ r.qtd_pendentes }}</td>
                    <td class="mono">{{ r.ultimo_envio ? (r.ultimo_envio | date:'dd/MM/yy HH:mm') : '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Modal: compositor de mensagem por título -->
      @if (compositorAberto(); as c) {
        <div class="modal-backdrop" (click)="fecharCompositor()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3>Mensagem para {{ c.nome_pessoa }}</h3>
                <p class="card-sub">{{ c.documento }} · {{ c.valor_devido | currency:'BRL':'symbol':'1.0-0' }}</p>
              </div>
              <button class="modal-close" (click)="fecharCompositor()">✕</button>
            </div>
            <textarea class="modal-textarea" rows="8" [(ngModel)]="mensagemEditavel"></textarea>
            <div class="modal-actions">
              <button class="btn-wpp-full" (click)="enviarComMensagem(c, 'whatsapp')">💬 Enviar WhatsApp</button>
              <button class="btn-email-full" (click)="enviarComMensagem(c, 'email')">📧 Enviar E-mail</button>
            </div>
          </div>
        </div>
      }

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

    /* Config envio automático */
    .auto-config {
      display:flex; align-items:center; justify-content:space-between; padding:16px 22px;
    }
    .auto-config-left { display:flex; align-items:center; gap:14px; }
    .auto-config-icon { font-size:22px; }
    .auto-config-title { font-weight:600; font-size:14px; }
    .auto-config-sub { font-size:12px; color:var(--muted); margin-top:2px; }

    .switch { position:relative; display:inline-block; width:44px; height:24px; flex-shrink:0; }
    .switch input { opacity:0; width:0; height:0; }
    .slider {
      position:absolute; cursor:pointer; inset:0; background:rgba(255,255,255,.12);
      border-radius:24px; transition:.2s;
    }
    .slider::before {
      content:''; position:absolute; height:18px; width:18px; left:3px; bottom:3px;
      background:white; border-radius:50%; transition:.2s;
    }
    .switch input:checked + .slider { background:#34d399; }
    .switch input:checked + .slider::before { transform:translateX(20px); }

    /* KPI grid */
    .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
    .kpi-grid-5 { grid-template-columns:repeat(5,1fr); }
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

    /* Tabs */
    .tabs { display:flex; gap:6px; border-bottom:1px solid var(--border); }
    .tab {
      background:transparent; border:none; color:var(--muted); font-size:13px;
      font-weight:600; font-family:'Outfit',sans-serif; padding:10px 16px;
      cursor:pointer; border-bottom:2px solid transparent; transition:all .15s;
    }
    .tab:hover { color:var(--text); }
    .tab.active { color:#f43f5e; border-bottom-color:#f43f5e; }

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
    .funnel-info { display:flex; justify-content:space-between; width:220px; font-size:12px; }
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
    .mono { font-family:'JetBrains Mono',monospace; font-size:12px; }
    .empty-row { text-align:center; color:var(--muted); padding:24px; }

    .client-name { font-weight:500; }
    .client-doc  { font-size:11px; color:var(--muted); margin-top:2px; font-family:'JetBrains Mono',monospace; }
    .amount { font-family:'JetBrains Mono',monospace; font-weight:600; color:#f43f5e; }

    .days { font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:600; white-space:nowrap; }
    .days.low    { color:#34d399; }
    .days.medium { color:#fb923c; }
    .days.high   { color:#f43f5e; }
    .days.futuro { color:#38bdf8; }

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
    .btn-msg   { background:rgba(148,163,184,.15); }
    .btn-msg:hover   { background:rgba(148,163,184,.3); }
    .btn-pago  { background:rgba(52,211,153,.15); }
    .btn-pago:hover  { background:rgba(52,211,153,.3); }

    /* Modal compositor */
    .modal-backdrop {
      position:fixed; inset:0; background:rgba(0,0,0,.55);
      display:flex; align-items:center; justify-content:center; z-index:9998; padding:20px;
    }
    .modal {
      background:var(--card); border:1px solid var(--border); border-radius:14px;
      padding:22px; width:100%; max-width:480px;
    }
    .modal-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:14px; }
    .modal-header h3 { font-family:'Syne',sans-serif; font-size:15px; font-weight:700; }
    .modal-close {
      background:transparent; border:none; color:var(--muted); font-size:16px; cursor:pointer;
    }
    .modal-textarea {
      width:100%; background:rgba(255,255,255,.06); border:1px solid var(--border);
      border-radius:8px; color:var(--text); font-size:12.5px; font-family:'Outfit',sans-serif;
      padding:10px 12px; resize:vertical; outline:none;
    }
    .modal-actions { display:flex; gap:10px; margin-top:14px; }
    .btn-wpp-full, .btn-email-full {
      flex:1; border:none; border-radius:8px; padding:10px; font-size:12.5px;
      font-weight:600; cursor:pointer; font-family:'Outfit',sans-serif;
    }
    .btn-wpp-full   { background:rgba(37,211,102,.18); color:#25d366; }
    .btn-email-full { background:rgba(56,189,248,.18); color:#38bdf8; }

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
      .kpi-grid-5 { grid-template-columns:repeat(2,1fr); }
      .row-2    { grid-template-columns:1fr; }
    }
  `],
})
export class CobrancasComponent {
  protected readonly svc = inject(CobrancasService);

  aba = signal<Aba>('cobrancas');

  toast     = signal('');
  toastType = signal<'success'|'error'|'info'>('info');

  compositorAberto = signal<CobrancaComVencimento | null>(null);
  mensagemEditavel = '';

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

  diasClass(diasAte: number): string {
    if (diasAte < 0)  return 'days futuro';
    if (diasAte <= 30) return diasAte <= 15 ? 'days medium' : 'days high';
    return 'days high';
  }

  vencimentoLabel(c: CobrancaComVencimento): string {
    const dias = this.svc.diasAteVencimento(c);
    if (dias > 0)  return `${dias}d atraso`;
    if (dias === 0) return 'Vence hoje';
    return `Vence em ${Math.abs(dias)}d`;
  }

  /** Índices para os pontos preenchidos do indicador de tentativas (máx. 5). */
  dotsPreenchidos(tentativas: number): number[] {
    const n = Math.min(tentativas, 5);
    return Array.from({ length: n }, (_, i) => i);
  }

  /** Índices para os pontos vazios do indicador de tentativas (completa até 5). */
  dotsVazios(tentativas: number): number[] {
    const n = Math.max(0, 5 - tentativas);
    return Array.from({ length: n }, (_, i) => i);
  }

  abrirWhatsapp(c: CobrancaComVencimento): void {
    this.svc.abrirWhatsapp(c);
    this.showToast(`WhatsApp aberto para ${c.nome_pessoa}`, 'success');
  }

  enviarEmail(c: CobrancaComVencimento): void {
    this.svc.enviarEmail(c);
    this.showToast(`E-mail enviado para ${c.email}`, 'success');
  }

  enviarAmbos(c: CobrancaComVencimento): void {
    this.svc.enviarAmbos(c);
    this.showToast(`WhatsApp + E-mail enviados para ${c.nome_pessoa}`, 'success');
  }

  marcarPago(id: number): void {
    this.svc.marcarStatus(id, 'pago');
    this.showToast('Cliente marcado como pago ✅', 'success');
  }

  dispararEnvioHoje(): void {
    const { enviados } = this.svc.dispararEnvioAutomatico();
    if (enviados === 0) {
      this.showToast('Nenhum título bate em um marco do funil hoje.', 'info');
    } else {
      this.showToast(`${enviados} título(s) enviados (marcos de vencimento de hoje)!`, 'info');
    }
  }

  toggleEnvioAutomatico(ativo: boolean): void {
    this.svc.configurarEnvioAutomatico(ativo);
    this.showToast(
      ativo ? 'Envio automático das 08h ativado.' : 'Envio automático desativado.',
      'info',
    );
  }

  abrirCompositor(c: CobrancaComVencimento): void {
    this.mensagemEditavel = this.svc.gerarMensagem(c);
    this.compositorAberto.set(c);
  }

  fecharCompositor(): void {
    this.compositorAberto.set(null);
  }

  enviarComMensagem(c: CobrancaComVencimento, canal: 'whatsapp' | 'email'): void {
    if (canal === 'whatsapp') {
      this.svc.abrirWhatsapp(c, this.mensagemEditavel);
    } else {
      this.svc.enviarEmail(c, this.mensagemEditavel);
    }
    this.showToast(`Mensagem personalizada enviada para ${c.nome_pessoa}`, 'success');
    this.fecharCompositor();
  }

  exportar(): void {
    this.showToast('Exportando relatório de cobranças…', 'info');
  }

  private showToast(msg: string, type: 'success'|'error'|'info'): void {
    this.toast.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toast.set(''), 3500);
  }
}