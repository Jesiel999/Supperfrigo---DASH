import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  Cobranca,
  KpiCobranca,
  CanalCobranca,
  StatusCobranca,
} from '../models/financeiro.models';

@Injectable({ providedIn: 'root' })
export class CobrancasService {
  private readonly api = inject(ApiService);

  // ─── State ────────────────────────────────────────────────────
  readonly busca           = signal('');
  readonly filtroStatus    = signal('todos');
  readonly filtroCanal     = signal('todos');
  readonly filtroPrioridade= signal('todos');
  readonly carregando      = signal(false);
  readonly enviando        = signal<string | null>(null); // id do cliente sendo enviado

  private readonly _cobrancas = signal<Cobranca[]>(MOCK_COBRANCAS);

  // ─── Computed ─────────────────────────────────────────────────
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

  // ─── Envio WhatsApp ───────────────────────────────────────────
  enviarWhatsapp(cobranca: Cobranca, mensagem?: string) {
    this.enviando.set(cobranca.id);
    const msg = mensagem ?? this.gerarMensagem(cobranca);

    return this.api.enviarWhatsapp(cobranca.id_pessoa, msg).pipe();
  }

  // ─── Envio E-mail ─────────────────────────────────────────────
  enviarEmail(cobranca: Cobranca, mensagem?: string) {
    this.enviando.set(cobranca.id);
    return this.api.enviarEmail(cobranca.id_pessoa, mensagem);
  }

  // ─── Marcar status ────────────────────────────────────────────
  marcarStatus(id: number, status: StatusCobranca) {
    this._cobrancas.update((list) =>
      list.map((c) => c.id === id ? { ...c, status, tentativas: c.tentativas + 1 } : c)
    );
    this.enviando.set(null);
  }

  // ─── Whatsapp link direto ─────────────────────────────────────
  abrirWhatsapp(cobranca: Cobranca) {
    const msg   = encodeURIComponent(this.gerarMensagem(cobranca));
    const fone  = cobranca.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/${fone}?text=${msg}`, '_blank');
    this.marcarStatus(cobranca.id, 'enviado');
  }

  // ─── Mensagem template ────────────────────────────────────────
  gerarMensagem(c: Cobranca): string {
    return `Olá, ${c.nome_pessoa}! 👋\n\nIdentificamos um débito em aberto no valor de *R$ ${c.valor_devido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}* com *${c.dias_atraso} dias* de atraso.\n\nPor favor, entre em contato para regularizar sua situação.\n\nEquipe Financeira`;
  }

  // ─── Filters ──────────────────────────────────────────────────
  setBusca(v: string)            { this.busca.set(v); }
  setFiltroStatus(v: string)     { this.filtroStatus.set(v); }
  setFiltroCanal(v: string)      { this.filtroCanal.set(v); }
  setFiltroPrioridade(v: string) { this.filtroPrioridade.set(v); }
}

// ─── Mock ─────────────────────────────────────────────────────────
const MOCK_COBRANCAS: Cobranca[] = [
  { id:'c1',  id_pessoa:101, nome_pessoa:'Transportes Alves Ltda',    empresa:'Grupo Alpha', documento:'12.345.678/0001-90', telefone:'5511999990001', email:'financeiro@alves.com.br',  valor_devido:98400,  dias_atraso:87,  canal:'ambos',    status:'enviado',     prioridade:'alta',  tentativas:2, proximo_contato:'2025-06-10', data_envio:'2025-06-03' },
  { id:'c2',  id_pessoa:102, nome_pessoa:'Madeireira São Paulo S/A',   empresa:'Grupo Alpha', documento:'98.765.432/0001-11', telefone:'5511999990002', email:'adm@madeireira.com.br',    valor_devido:76200,  dias_atraso:65,  canal:'whatsapp', status:'visualizado',  prioridade:'alta',  tentativas:1, proximo_contato:'2025-06-08', data_envio:'2025-06-02' },
  { id:'c3',  id_pessoa:103, nome_pessoa:'Construtora BH Obras',       empresa:'Grupo Beta',  documento:'55.111.222/0001-33', telefone:'5531999990003', email:'bh@construtora.com.br',    valor_devido:64500,  dias_atraso:42,  canal:'email',    status:'pago',         prioridade:'media', tentativas:3, data_envio:'2025-05-28' },
  { id:'c4',  id_pessoa:104, nome_pessoa:'Agro Rio Verde Ltda',        empresa:'Grupo Beta',  documento:'77.444.555/0001-77', telefone:'5562999990004', email:'agro@rioverde.com.br',     valor_devido:58900,  dias_atraso:120, canal:'ambos',    status:'pendente',     prioridade:'alta',  tentativas:0 },
  { id:'c5',  id_pessoa:105, nome_pessoa:'Frigorífico Central Oeste',  empresa:'Grupo Gama',  documento:'33.222.111/0001-44', telefone:'5567999990005', email:'adm@frigocentral.com.br',  valor_devido:47300,  dias_atraso:18,  canal:'whatsapp', status:'pendente',     prioridade:'baixa', tentativas:0 },
  { id:'c6',  id_pessoa:106, nome_pessoa:'Distribuidora Norte S/A',    empresa:'Grupo Gama',  documento:'66.777.888/0001-55', telefone:'5592999990006', email:'norte@distribuidora.com',  valor_devido:41100,  dias_atraso:73,  canal:'email',    status:'enviado',      prioridade:'alta',  tentativas:1, data_envio:'2025-06-01' },
  { id:'c7',  id_pessoa:107, nome_pessoa:'Cerâmica Sul Mineiro',       empresa:'Grupo Alpha', documento:'44.333.999/0001-66', telefone:'5537999990007', email:'ceramica@sulmineiro.com',  valor_devido:38700,  dias_atraso:55,  canal:'ambos',    status:'pago',         prioridade:'media', tentativas:2 },
  { id:'c8',  id_pessoa:108, nome_pessoa:'Comércio Atacadista JJ',     empresa:'Grupo Beta',  documento:'11.999.888/0001-22', telefone:'5511999990008', email:'jj@atacado.com.br',        valor_devido:29500,  dias_atraso:22,  canal:'whatsapp', status:'pendente',     prioridade:'media', tentativas:0 },
  { id:'c9',  id_pessoa:109, nome_pessoa:'Posto Combustível Boa Vista',empresa:'Grupo Gama',  documento:'22.888.777/0001-11', telefone:'5595999990009', email:'posto@boavista.com.br',    valor_devido:24800,  dias_atraso:98,  canal:'ambos',    status:'falhou',       prioridade:'alta',  tentativas:3, data_envio:'2025-05-30' },
  { id:'c10', id_pessoa:110, nome_pessoa:'Fazenda Santa Clara',        empresa:'Grupo Alpha', documento:'88.666.555/0001-99', telefone:'5564999990010', email:'santa@clarafazenda.com',   valor_devido:19200,  dias_atraso:14,  canal:'email',    status:'visualizado',  prioridade:'baixa', tentativas:1, data_envio:'2025-06-03' },
];
