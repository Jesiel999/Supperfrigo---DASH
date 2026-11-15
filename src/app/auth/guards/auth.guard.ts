// src/app/auth/guards/auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { RecursoSistema } from '../../shared/models/admin/usuario.models';

// ── Guard de autenticação ─────────────────────────────────────
// Antes mandava para '/home', que também é protegido por este guard → laço infinito ao deslogar.
// O login está na rota '' (raiz).
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.logado() ? true : router.createUrlTree(['/']);
};

// ── Guard por recurso (permissão) ─────────────────────────────
// Uso: canActivate: [permissaoGuard('dre')]
export function permissaoGuard(recurso: RecursoSistema): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.logado()) return router.createUrlTree(['/']);   // '/login' não existe nas rotas
    if (auth.temPermissao(recurso)) return true;

    // '/acesso-negado' não existe nas rotas; volta para a Home até criar essa tela.
    return router.createUrlTree(['/home']);
  };
}