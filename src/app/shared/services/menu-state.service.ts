import { Injectable, signal, effect, inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { MenuService } from '../services/menu.service';
import { SistemaMenu } from '../models/usuario.models';

@Injectable({ providedIn: 'root' })
export class MenuStateService {
  private readonly auth = inject(AuthService);
  private readonly menuService = inject(MenuService);

  private readonly _sistemas = signal<SistemaMenu[]>([]);
  readonly sistemas = this._sistemas.asReadonly();

  private _carregado = false;

  constructor() {
    effect(() => {
      const logado = this.auth.logado();

      if (logado && !this._carregado) {
        this._carregado = true;
        this.menuService.obterMenu().subscribe({
          next: (r) => this._sistemas.set(r.sistemas),
          error: (e) => {
            console.error('Erro ao carregar menu:', e);
            this._carregado = false;
          },
        });
      }

      if (!logado) {
        this._sistemas.set([]);
        this._carregado = false;
      }
    });
  }

  /** Força recarregar (chame após trocar de tenant, se necessário) */
  recarregar(): void {
    this._carregado = false;
    this._sistemas.set([]);
  }
}