import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  InadimplenciaApiItem,
  EnvioCobrancaPayload,
  PmpApiItem,
  PmrApiItem,
  RespostaEnvio,
} from '../models/financeiro.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getInadimplencia(dataInicio?: string, dataFim?: string) {
    let params = new HttpParams();

    if (dataInicio) {
      params = params.set('data_inicio', dataInicio);
    }

    if (dataFim) {
      params = params.set('data_fim', dataFim);
    }

    return this.http.get<ApiResponse<InadimplenciaApiItem>>(
      `${this.base}/financeiro/inadimplencia`,
      { params }
    );
  }

  getPmp(dataInicio?: string, dataFim?: string) {
    let params = new HttpParams();

    if (dataInicio) {
      params = params.set('data_inicio', dataInicio);
    }

    if (dataFim) {
      params = params.set('data_fim', dataFim);
    }

    return this.http.get<ApiResponse<PmpApiItem>>(
      `${this.base}/financeiro/pmp`,
      { params }
    );
  }

  getPmr(dataInicio?: string, dataFim?: string) {
    let params = new HttpParams();

    if (dataInicio) {
      params = params.set('data_inicio', dataInicio);
    }

    if (dataFim) {
      params = params.set('data_fim', dataFim);
    }

    return this.http.get<ApiResponse<PmrApiItem>>(
      `${this.base}/financeiro/pmr`,
      { params }
    );
  }

  enviarCobranca(payload: EnvioCobrancaPayload) {
    return this.http.post<RespostaEnvio>(
      `${this.base}/cobrancas/enviar`,
      payload
    );
  }

  enviarWhatsapp(idPessoa: number, mensagem?: string) {
    return this.http.post<RespostaEnvio>(
      `${this.base}/cobrancas/enviar-whatsapp/${idPessoa}`,
      { mensagem }
    );
  }

  enviarEmail(idPessoa: number, mensagem?: string) {
    return this.http.post<RespostaEnvio>(
      `${this.base}/cobrancas/enviar-email/${idPessoa}`,
      { mensagem }
    );
  }

  getHistoricoCobrancas(idPessoa?: number) {
    let params = new HttpParams();
    if (idPessoa) params = params.set('id_pessoa', idPessoa);
    return this.http.get<ApiResponse<any>>(
      `${this.base}/cobrancas/historico`,
      { params }
    );
  }
  
}
