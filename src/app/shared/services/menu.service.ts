import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MenuResponse } from '../../shared/models/usuario.models';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/menu`;

  obterMenu() {
    return this.http.get<MenuResponse>(this.base);
  }
}