import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginPayload,
  Permissao,
  RecursoSistema,
  TenantInfo,
  Usuario,
} from '../../shared/models/financeiro.models';

const TOKEN_KEY  = 'ff_token';
const USER_KEY   = 'ff_usuario';
const TENANT_KEY = 'ff_tenant_id';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _token   = signal<string | null>(
    localStorage.getItem(TOKEN_KEY)
  );
  private readonly _usuario = signal<Usuario | null>(
    this._parsarUsuarioStorage()
  );

  readonly token   = this._token.asReadonly();
  readonly usuario = this._usuario.asReadonly();
  readonly logado  = computed(() => !!this._token());

  // ── Tenant atual ──────────────────────────────────────────────
  readonly tenantAtual = computed((): TenantInfo | null => {
    const u = this._usuario();
    if (!u || !u.tenant_id) return null;
    return { id: u.tenant_id, nome: u.tenant_nome ?? '', slug: u.tenant_slug ?? '' };
  });

  // ── Empresas autorizadas pelo JWT ─────────────────────────────
  // [] = sem restrição (usuário vê todas)
  readonly empresasAutorizadas = computed(() =>
    this._usuario()?.empresas ?? []
  );

  // ── Tenants acessíveis ────────────────────────────────────────
  readonly tenants = computed(() => this._usuario()?.tenants ?? []);
  readonly isMultiTenant = computed(() => this.tenants().length > 1);

  // ── Perfil ────────────────────────────────────────────────────
  readonly perfilNome = computed(() =>
    this._usuario()?.perfil_nome ?? this._usuario()?.perfil_nome ?? ''
  );
  readonly isAdmin = computed(() => {
    const u = this._usuario();
    if (!u) return false;
    const perfil = (u.perfil_nome ?? u.perfil_nome ?? '').toLowerCase();
    return perfil.includes('admin');
  });

  // ── Login ─────────────────────────────────────────────────────
  login(payload: LoginPayload) {
    let body = new HttpParams()
      .set('username', payload.username)
      .set('password', payload.password);

    if (payload.tenant_id) {
      body = body.set('client_id', String(payload.tenant_id));
    }

    return this.http
      .post<AuthResponse>(
        `${environment.apiUrl}/auth/login`,
        body.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
      .pipe(
        tap(res => this._persistir(res)),
        catchError(err =>
          throwError(() => new Error(
            err.error?.detail ?? err.message ?? 'Erro ao fazer login'
          ))
        )
      );
  }

  // ── Troca de tenant ───────────────────────────────────────────
  trocarTenant(tenantId: number) {
    return this.http
      .post<AuthResponse>(
        `${environment.apiUrl}/auth/trocar-tenant`,
        { tenant_id: tenantId }
      )
      .pipe(
        tap(res => this._persistir(res)),
        catchError(err =>
          throwError(() => new Error(err.error?.detail ?? 'Erro ao trocar tenant'))
        )
      );
  }

  // ── Logout ────────────────────────────────────────────────────
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TENANT_KEY);
    this._token.set(null);
    this._usuario.set(null);
    this.router.navigate(['/login']);
  }

  getToken() { return this._token(); }

  // ── Verificação de permissão ──────────────────────────────────
  temPermissao(recurso: RecursoSistema, acao: Permissao = 'visualizar'): boolean {
    const u = this._usuario();
    if (!u) return false;
    if (this.isAdmin()) return true;

    // Sistema novo: permissoes é um objeto { modulo: [acoes] }
    const permissoes = u.permissoes;
    if (permissoes && typeof permissoes === 'object' && !Array.isArray(permissoes)) {
      const acoes = (permissoes as Record<string, string[]>)[recurso] ?? [];
      return acoes.includes(acao);
    }

    // Sistema antigo: permissoes é array [{ recurso, acoes[] }]
    if (Array.isArray(permissoes)) {
      const entry = (permissoes as any[]).find(p => p.recurso === recurso);
      return entry?.acoes?.includes(acao) ?? false;
    }

    return false;
  }

  // ── Persiste resposta do backend ──────────────────────────────
  private _persistir(res: AuthResponse) {
    const usuario = this._normalizarUsuario(
      (res as any).usuarios
    );

    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
    localStorage.setItem(TENANT_KEY, String(usuario.tenant_id ?? ''));

    this._token.set(res.access_token);
    this._usuario.set(usuario);
  }

  // ── Normaliza resposta — garante campos obrigatórios ─────────
  // Evita quebrar o template quando vêm campos nulos do sistema antigo
  private _normalizarUsuario(u: any): Usuario {
    return {
      id:           u.id ?? '',
      username:     u.username ?? '',
      nome:         u.nome ?? '',
      email:        u.email ?? '',

      tenant_id:    u.tenant_id ?? 0,
      tenant_nome:  u.tenant_nome ?? '',
      tenant_slug:  u.tenant_slug ?? '',

      perfil_id:    u.perfil_id ?? 0,
      perfil_nome:  u.perfil_nome ?? '',
      perfil_cor:   u.perfil_cor ?? '',

      empresas: Array.isArray(u.empresas) ? u.empresas : [],
      tenants:  Array.isArray(u.tenants) ? u.tenants : [],

      permissoes: u.permissoes ?? {},
    };
  }

  // ── Carrega usuário do localStorage com normalização ──────────
  private _parsarUsuarioStorage(): Usuario | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      return this._normalizarUsuario(JSON.parse(raw));
    } catch {
      return null;
    }
  }
}
