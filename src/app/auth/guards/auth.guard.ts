import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { RecursoSistema } from '../../shared/models/financeiro.models';

// ── Guard de autenticação ─────────────────────────────────────
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.logado()) return true;
  router.navigate(['/login']);
  return false;
};

// ── Guard de admin (perfil contém 'admin') 
export const adminInadimplenciaGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isAdmin()) return true;
  router.navigate(['/financeiro/inadimplencia']);
  return false;
};

export const adminPmpGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isAdmin()) return true;
  router.navigate(['/financeiro/pmp']);
  return false;
};

export const adminPmrGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isAdmin()) return true;
  router.navigate(['/financeiro/pmr']);
  return false;
};

// ── Factory: guard para recurso específico 
// Uso: canActivate: [authGuard, permissaoGuard('dashboard_inadimplencia')]
export function permissaoGuard(recurso: RecursoSistema): CanActivateFn {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    if (!auth.logado()) {
      router.navigate(['/login']);
      return false;
    }
    if (auth.temPermissao(recurso, 'visualizar')) return true;
    router.navigate(['/financeiro/inadimplencia']);
    return false;
  };
}
