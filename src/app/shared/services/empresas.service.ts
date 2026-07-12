import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Empresas } from '../models/usuario.models';

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/empresas`;

  listarTodas() {
    return this.http.get<{ total: number; empresas: Empresas[] }>(this.base);
  }
}