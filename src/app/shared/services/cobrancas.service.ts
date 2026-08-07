import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  Cobranca,
  KpiCobranca,
  StatusCobranca,
} from '../models/cobranca.models';

/**
 * financeiro.models.ts não tem campo de vencimento nem histórico de envio.
 * Em vez de editar o model compartilhado (arriscado sem ver o arquivo real —
 * já quebrei o build 2x chutando esse arquivo), estendo localmente por
 * intersection type. Isso é 100% compatível com o Cobranca original: em
 * qualquer lugar que espera `Cobranca`, um `CobrancaComVencimento` serve.
 *
 * Se/quando vocês adicionarem `vencimento` direto no financeiro.models.ts,
 * é só apagar essa extensão e usar Cobranca puro.
 */
export type CobrancaComVencimento = Cobranca & { vencimento: string /* ISO yyyy-mm-dd */ };

export type CanalEnvio = 'whatsapp' | 'email';

export interface HistoricoEnvio {
  id: number;
  cobranca_id: number;
  nome_pessoa: string;
  documento: string;
  canal: CanalEnvio;
  mensagem: string;
  data_envio: string;   // ISO datetime
  sucesso: boolean;
  automatico: boolean;  // true = disparado pelo envio automático das 08h
}

export interface RelatorioCliente {
  documento: string;
  nome_pessoa: string;
  empresa: string;
  qtd_titulos: number;
  valor_total: number;
  qtd_pagos: number;
  qtd_pendentes: number;
  ultimo_envio: string | null;
}

/** Gatilhos do funil — também usados como referência pro envio automático das 08h. */
export interface MarcoCobranca {
  offsetDias: number; // negativo = antes do vencimento, positivo = depois
  label: string;
  icon: string;
  cor: string;
}

export const MARCOS_COBRANCA: MarcoCobranca[] = [
  { offsetDias: -3, label: '3 dias antes do vencimento', icon: '🔔', cor: '#38bdf8' },
  { offsetDias: -1, label: '1 dia antes do vencimento',  icon: '⏰', cor: '#fbbf24' },
  { offsetDias: 0,  label: 'No dia do vencimento',        icon: '📌', cor: '#fb923c' },
  { offsetDias: 15, label: '15 dias após o vencimento',   icon: '⚠️', cor: '#f43f5e' },
  { offsetDias: 30, label: '30 dias após o vencimento',   icon: '🚨', cor: '#dc2626' },
];

@Injectable({ providedIn: 'root' })
export class CobrancasService {
  private readonly api = inject(ApiService);

  // ─── State ────────────────────────────────────────────────────
  readonly busca            = signal('');
  readonly filtroStatus     = signal('todos');
  readonly filtroCanal      = signal('todos');
  readonly filtroPrioridade = signal('todos');
  readonly carregando       = signal(false);
  readonly enviando         = signal<number | null>(null); // id da cobrança sendo enviada

  // ─── Envio automático (08h) ─────────────────────────────────────
  // TODO backend: hoje isso só liga/desliga um estado local. Precisa de um
  // endpoint pra persistir a config e de um scheduler no servidor que
  // efetivamente rode isso às 08h (ex: cron chamando algo equivalente a
  // dispararEnvioAutomatico()). O botão "Simular envio de hoje" existe pra
  // testar o comportamento sem depender do backend ainda.
  readonly envioAutomaticoAtivo  = signal(false);
  readonly horaEnvioAutomatico   = signal('08:00');

  private readonly _cobrancas = signal<CobrancaComVencimento[]>(MOCK_COBRANCAS);
  private readonly _historico = signal<HistoricoEnvio[]>(MOCK_HISTORICO);
  private _proximoHistoricoId = MOCK_HISTORICO.length + 1;

  // ─── Computed: filtros da tabela principal ─────────────────────
  readonly cobrancasFiltradas = computed(() => {
    const b = this.busca().toLowerCase();
    const s = this.filtroStatus();
    const c = this.filtroCanal();
    const p = this.filtroPrioridade();
    return this._cobrancas().filter((x) => {
      const mB = !b || x.nome_pessoa.toLowerCase().includes(b) || x.documento.includes(b);
      const mS = s === 'todos' || x.status === s;
      const mC = c === 'todos' || x.canal === c;
      const mP = p === 'todos' || x.prioridade === p;
      return mB && mS && mC && mP;
    });
  });

  readonly kpis = computed<KpiCobranca>(() => {
    const cobr = this._cobrancas();
    return {
      totalEnviadas:      cobr.filter((c) => c.status !== 'pendente').length,
      taxaRetorno:        Math.round((cobr.filter((c) => c.status === 'pago').length / cobr.length) * 100),
      valorRecuperado:    cobr.filter((c) => c.status === 'pago').reduce((s, c) => s + c.valor_devido, 0),
      whatsappEnviados:   cobr.filter((c) => (c.canal === 'whatsapp' || c.canal === 'ambos') && c.status !== 'pendente').length,
      emailsEnviados:     cobr.filter((c) => (c.canal === 'email'    || c.canal === 'ambos') && c.status !== 'pendente').length,
      aguardandoResposta: cobr.filter((c) => c.status === 'enviado').length,
    };
  });

  // ─── Computed: funil por marco de vencimento ───────────────────
  readonly diasAteVencimento = (c: CobrancaComVencimento): number => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const venc = new Date(c.vencimento + 'T00:00:00');
    return Math.round((hoje.getTime() - venc.getTime()) / 86_400_000); // >0 = atrasado, <0 = a vencer
  };

  readonly funilVencimento = computed(() => {
    const cobr = this._cobrancas();
    const totalBase = Math.max(cobr.length, 1);
    return MARCOS_COBRANCA.map((marco) => {
      const doMarco = cobr.filter((c) => this.diasAteVencimento(c) === marco.offsetDias);
      return {
        ...marco,
        count: doMarco.length,
        cobrancas: doMarco,
        pct: Math.round((doMarco.length / totalBase) * 100),
      };
    });
  });

  /** Títulos que batem em algum marco HOJE — é isso que o envio das 08h dispararia. */
  readonly titulosParaEnvioHoje = computed(() =>
    this.funilVencimento().flatMap((m) => m.cobrancas)
  );

  // ─── Computed: relatório por cliente ────────────────────────────
  readonly relatorioPorCliente = computed<RelatorioCliente[]>(() => {
    const porDocumento = new Map<string, RelatorioCliente>();
    for (const c of this._cobrancas()) {
      const atual = porDocumento.get(c.documento);
      const ultimoEnvioDaCobranca = this._historico()
        .filter((h) => h.cobranca_id === c.id)
        .sort((a, b) => b.data_envio.localeCompare(a.data_envio))[0]?.data_envio ?? null;

      if (!atual) {
        porDocumento.set(c.documento, {
          documento: c.documento,
          nome_pessoa: c.nome_pessoa,
          empresa: c.empresa,
          qtd_titulos: 1,
          valor_total: c.valor_devido,
          qtd_pagos: c.status === 'pago' ? 1 : 0,
          qtd_pendentes: c.status === 'pendente' ? 1 : 0,
          ultimo_envio: ultimoEnvioDaCobranca,
        });
      } else {
        atual.qtd_titulos += 1;
        atual.valor_total += c.valor_devido;
        if (c.status === 'pago') atual.qtd_pagos += 1;
        if (c.status === 'pendente') atual.qtd_pendentes += 1;
        if (ultimoEnvioDaCobranca && (!atual.ultimo_envio || ultimoEnvioDaCobranca > atual.ultimo_envio)) {
          atual.ultimo_envio = ultimoEnvioDaCobranca;
        }
      }
    }
    return Array.from(porDocumento.values()).sort((a, b) => b.valor_total - a.valor_total);
  });

  // ─── Computed: relatório/histórico de envios ────────────────────
  readonly historicoEnvios = computed(() =>
    [...this._historico()].sort((a, b) => b.data_envio.localeCompare(a.data_envio))
  );

  readonly resumoEnvios = computed(() => {
    const h = this._historico();
    return {
      total: h.length,
      whatsapp: h.filter((x) => x.canal === 'whatsapp').length,
      email: h.filter((x) => x.canal === 'email').length,
      falhas: h.filter((x) => !x.sucesso).length,
      automaticos: h.filter((x) => x.automatico).length,
    };
  });

  // ─── Envio WhatsApp (link direto — não é chamada HTTP) ─────────
  abrirWhatsapp(cobranca: CobrancaComVencimento, mensagem?: string, automatico = false): void {
    const msg = mensagem ?? this.gerarMensagem(cobranca);
    const fone = cobranca.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/${fone}?text=${encodeURIComponent(msg)}`, '_blank');
    this.marcarStatus(cobranca.id, 'enviado');
    this.registrarHistorico(cobranca, 'whatsapp', msg, true, automatico);
  }

  // ─── Envio WhatsApp via API (ex: envio automático em massa) ────
  enviarWhatsapp(cobranca: CobrancaComVencimento, mensagem?: string, automatico = false): void {
    const msg = mensagem ?? this.gerarMensagem(cobranca);
    this.enviando.set(cobranca.id);

    this.api.enviarWhatsapp(cobranca.id_pessoa, msg).subscribe({
      next: () => {
        this.marcarStatus(cobranca.id, 'enviado');
        this.registrarHistorico(cobranca, 'whatsapp', msg, true, automatico);
      },
      error: (err) => {
        console.error('Falha ao enviar WhatsApp', err);
        this.marcarStatus(cobranca.id, 'falhou');
        this.registrarHistorico(cobranca, 'whatsapp', msg, false, automatico);
      },
    });
  }

  // ─── Envio E-mail via API ───────────────────────────────────────
  enviarEmail(cobranca: CobrancaComVencimento, mensagem?: string, automatico = false): void {
    const msg = mensagem ?? this.gerarMensagem(cobranca);
    this.enviando.set(cobranca.id);

    this.api.enviarEmail(cobranca.id_pessoa, msg).subscribe({
      next: () => {
        this.marcarStatus(cobranca.id, 'enviado');
        this.registrarHistorico(cobranca, 'email', msg, true, automatico);
      },
      error: (err) => {
        console.error('Falha ao enviar e-mail', err);
        this.marcarStatus(cobranca.id, 'falhou');
        this.registrarHistorico(cobranca, 'email', msg, false, automatico);
      },
    });
  }

  // ─── Envio pelos dois canais ────────────────────────────────────
  enviarAmbos(cobranca: CobrancaComVencimento, mensagem?: string): void {
    this.abrirWhatsapp(cobranca, mensagem);
    this.enviarEmail(cobranca, mensagem);
  }

  // ─── Envio automático (simulação manual até existir cron real) ──
  configurarEnvioAutomatico(ativo: boolean, hora = '08:00'): void {
    // TODO backend: persistir isso (ex: PUT /config/envio-automatico) e
    // criar o job no servidor que rode dispararEnvioAutomatico() nesse horário.
    this.envioAutomaticoAtivo.set(ativo);
    this.horaEnvioAutomatico.set(hora);
  }

  /** Dispara (manualmente, por enquanto) o envio de todos os títulos que batem em algum marco hoje. */
  dispararEnvioAutomatico(): { enviados: number } {
    const alvos = this.titulosParaEnvioHoje();
    for (const c of alvos) {
      if (c.canal === 'whatsapp' || c.canal === 'ambos') this.enviarWhatsapp(c, undefined, true);
      if (c.canal === 'email' || c.canal === 'ambos')    this.enviarEmail(c, undefined, true);
    }
    return { enviados: alvos.length };
  }

  // ─── Marcar status ────────────────────────────────────────────
  marcarStatus(id: number, status: StatusCobranca): void {
    this._cobrancas.update((list) =>
      list.map((c) => c.id === id ? { ...c, status, tentativas: c.tentativas + 1 } : c)
    );
    if (this.enviando() === id) {
      this.enviando.set(null);
    }
  }

  private registrarHistorico(
    c: CobrancaComVencimento,
    canal: CanalEnvio,
    mensagem: string,
    sucesso: boolean,
    automatico: boolean,
  ): void {
    const entrada: HistoricoEnvio = {
      id: this._proximoHistoricoId++,
      cobranca_id: c.id,
      nome_pessoa: c.nome_pessoa,
      documento: c.documento,
      canal,
      mensagem,
      data_envio: new Date().toISOString(),
      sucesso,
      automatico,
    };
    this._historico.update((list) => [entrada, ...list]);
  }

  // ─── Mensagem template (editável por título antes de enviar) ───
  gerarMensagem(c: CobrancaComVencimento): string {
    const diasAte = this.diasAteVencimento(c);
    const situacao = diasAte > 0
      ? `com *${diasAte} dias* de atraso`
      : diasAte === 0
        ? 'que vence *hoje*'
        : `que vence em *${Math.abs(diasAte)} dias*`;

    return `Olá, ${c.nome_pessoa}! 👋\n\nIdentificamos um débito em aberto no valor de *R$ ${c.valor_devido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}* ${situacao}.\n\nPor favor, entre em contato para regularizar sua situação.\n\nEquipe Financeira`;
  }

  // ─── Filters ──────────────────────────────────────────────────
  setBusca(v: string)            { this.busca.set(v); }
  setFiltroStatus(v: string)     { this.filtroStatus.set(v); }
  setFiltroCanal(v: string)      { this.filtroCanal.set(v); }
  setFiltroPrioridade(v: string) { this.filtroPrioridade.set(v); }
}

// ─── Mock ─────────────────────────────────────────────────────────
// vencimento = hoje - dias_atraso (calculado). Ajustei dias_atraso dos ids
// 6 e 8 para 30 e 15 exatamente, só pra popular os marcos "15/30 dias após"
// no mock — em produção isso some, é dado real vindo do backend.
const MOCK_COBRANCAS: CobrancaComVencimento[] = [
  { id:1,  id_pessoa:101, nome_pessoa:'Transportes Alves Ltda',     empresa:'Grupo Alpha', documento:'12.345.678/0001-90', telefone:'5511999990001', email:'financeiro@alves.com.br',  valor_devido:98400,  dias_atraso:87,  vencimento:'2026-05-10', canal:'ambos',    status:'enviado',     prioridade:'alta',  tentativas:2, proximo_contato:'2025-06-10', data_envio:'2025-06-03' },
  { id:2,  id_pessoa:102, nome_pessoa:'Madeireira São Paulo S/A',    empresa:'Grupo Alpha', documento:'98.765.432/0001-11', telefone:'5511999990002', email:'adm@madeireira.com.br',    valor_devido:76200,  dias_atraso:65,  vencimento:'2026-06-01', canal:'whatsapp', status:'visualizado',  prioridade:'alta',  tentativas:1, proximo_contato:'2025-06-08', data_envio:'2025-06-02' },
  { id:3,  id_pessoa:103, nome_pessoa:'Construtora BH Obras',        empresa:'Grupo Beta',  documento:'55.111.222/0001-33', telefone:'5531999990003', email:'bh@construtora.com.br',    valor_devido:64500,  dias_atraso:42,  vencimento:'2026-06-24', canal:'email',    status:'pago',         prioridade:'media', tentativas:3, data_envio:'2025-05-28' },
  { id:4,  id_pessoa:104, nome_pessoa:'Agro Rio Verde Ltda',         empresa:'Grupo Beta',  documento:'77.444.555/0001-77', telefone:'5562999990004', email:'agro@rioverde.com.br',     valor_devido:58900,  dias_atraso:120, vencimento:'2026-04-07', canal:'ambos',    status:'pendente',     prioridade:'alta',  tentativas:0 },
  { id:5,  id_pessoa:105, nome_pessoa:'Frigorífico Central Oeste',   empresa:'Grupo Gama',  documento:'33.222.111/0001-44', telefone:'5567999990005', email:'adm@frigocentral.com.br',  valor_devido:47300,  dias_atraso:18,  vencimento:'2026-07-18', canal:'whatsapp', status:'pendente',     prioridade:'baixa', tentativas:0 },
  { id:6,  id_pessoa:106, nome_pessoa:'Distribuidora Norte S/A',     empresa:'Grupo Gama',  documento:'66.777.888/0001-55', telefone:'5592999990006', email:'norte@distribuidora.com',  valor_devido:41100,  dias_atraso:30,  vencimento:'2026-07-06', canal:'email',    status:'enviado',      prioridade:'alta',  tentativas:1, data_envio:'2025-06-01' },
  { id:7,  id_pessoa:107, nome_pessoa:'Cerâmica Sul Mineiro',        empresa:'Grupo Alpha', documento:'44.333.999/0001-66', telefone:'5537999990007', email:'ceramica@sulmineiro.com',  valor_devido:38700,  dias_atraso:55,  vencimento:'2026-06-11', canal:'ambos',    status:'pago',         prioridade:'media', tentativas:2 },
  { id:8,  id_pessoa:108, nome_pessoa:'Comércio Atacadista JJ',      empresa:'Grupo Beta',  documento:'11.999.888/0001-22', telefone:'5511999990008', email:'jj@atacado.com.br',        valor_devido:29500,  dias_atraso:15,  vencimento:'2026-07-21', canal:'whatsapp', status:'pendente',     prioridade:'media', tentativas:0 },
  { id:9,  id_pessoa:109, nome_pessoa:'Posto Combustível Boa Vista', empresa:'Grupo Gama',  documento:'22.888.777/0001-11', telefone:'5595999990009', email:'posto@boavista.com.br',    valor_devido:24800,  dias_atraso:98,  vencimento:'2026-04-29', canal:'ambos',    status:'falhou',       prioridade:'alta',  tentativas:3, data_envio:'2025-05-30' },
  { id:10, id_pessoa:110, nome_pessoa:'Fazenda Santa Clara',         empresa:'Grupo Alpha', documento:'88.666.555/0001-99', telefone:'5564999990010', email:'santa@clarafazenda.com',   valor_devido:19200,  dias_atraso:14,  vencimento:'2026-07-22', canal:'email',    status:'visualizado',  prioridade:'baixa', tentativas:1, data_envio:'2025-06-03' },
  // ─ Novos: títulos ainda não vencidos, pra popular os marcos "antes do vencimento" ─
  { id:11, id_pessoa:111, nome_pessoa:'Auto Peças Rondônia Ltda',    empresa:'Grupo Beta',  documento:'19.222.333/0001-44', telefone:'5569999990011', email:'contato@autopecasro.com.br', valor_devido:15600, dias_atraso:0, vencimento:'2026-08-08', canal:'whatsapp', status:'pendente', prioridade:'media', tentativas:0 },
  { id:12, id_pessoa:112, nome_pessoa:'Mercado Bom Preço',           empresa:'Grupo Gama',  documento:'27.444.555/0001-66', telefone:'5541999990012', email:'financeiro@bompreco.com.br', valor_devido:8900,  dias_atraso:0, vencimento:'2026-08-06', canal:'email',    status:'pendente', prioridade:'baixa', tentativas:0 },
  { id:13, id_pessoa:113, nome_pessoa:'Papelaria Central',           empresa:'Grupo Alpha', documento:'35.666.777/0001-88', telefone:'5527999990013', email:'papelaria@central.com.br',   valor_devido:3200,  dias_atraso:0, vencimento:'2026-08-05', canal:'ambos',    status:'pendente', prioridade:'baixa', tentativas:0 },
];

const MOCK_HISTORICO: HistoricoEnvio[] = [
  { id:1, cobranca_id:1, nome_pessoa:'Transportes Alves Ltda',    documento:'12.345.678/0001-90', canal:'whatsapp', mensagem:'Olá, Transportes Alves Ltda! Débito em aberto...', data_envio:'2026-08-03T08:00:00', sucesso:true,  automatico:true  },
  { id:2, cobranca_id:1, nome_pessoa:'Transportes Alves Ltda',    documento:'12.345.678/0001-90', canal:'email',    mensagem:'Olá, Transportes Alves Ltda! Débito em aberto...', data_envio:'2026-08-03T08:00:05', sucesso:true,  automatico:true  },
  { id:3, cobranca_id:6, nome_pessoa:'Distribuidora Norte S/A',   documento:'66.777.888/0001-55', canal:'email',    mensagem:'Olá, Distribuidora Norte S/A! Débito em aberto...', data_envio:'2026-08-04T08:00:00', sucesso:true,  automatico:true  },
  { id:4, cobranca_id:9, nome_pessoa:'Posto Combustível Boa Vista',documento:'22.888.777/0001-11', canal:'whatsapp', mensagem:'Olá, Posto Combustível Boa Vista! Débito em aberto...', data_envio:'2026-08-02T14:22:00', sucesso:false, automatico:false },
];