export type CanalCobranca    = 'whatsapp' | 'email' | 'ambos';
export type StatusCobranca   = 'pendente' | 'enviado' | 'visualizado' | 'pago' | 'falhou';
export type PrioridadeCobranca = 'alta' | 'media' | 'baixa';
export interface Cobranca {
  id: number; id_pessoa: number; nome_pessoa: string; empresa: string;
  documento: string; telefone: string; email: string;
  valor_devido: number; dias_atraso: number; canal: CanalCobranca;
  status: StatusCobranca; prioridade: PrioridadeCobranca;
  data_envio?: string; tentativas: number; proximo_contato?: string;
}
export interface KpiCobranca {
  totalEnviadas: number; taxaRetorno: number; valorRecuperado: number;
  whatsappEnviados: number; emailsEnviados: number; aguardandoResposta: number;
}
export interface EnvioCobrancaPayload { id_pessoa: number; canal: CanalCobranca; mensagem?: string; }
export interface RespostaEnvio { status: 'enviado' | 'falhou'; canal: CanalCobranca; mensagem: string; } 