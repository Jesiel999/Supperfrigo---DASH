import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { RecursoSistema } from '../../shared/models/usuario.models';

// ── Guard de autenticação ─────────────────────────────────────
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.logado()) return true;
  router.navigate(['/home']);
  return false;
};

// ── Guard de admin (perfil contém 'admin') 
export const adminSancesGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.logado()) return true;
  router.navigate(['/sances']);
  return false;
};

export const adminSultsGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.logado()) return true;
  router.navigate(['/sults']);
  return false;
};

// ── Factory: guard para recurso específico 
// Uso: canActivate: [authGuard]
export function permissaoGuard(
  recurso: RecursoSistema
): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.logado()) {
      router.navigate(['/home']);
      return false;
    }

    if (auth.temPermissao(recurso)) {
      return true;
    }

    router.navigate(['/acesso-negado']);
    return false;
  };
}
