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

// ── Factory: guard para recurso específico 
// Uso: canActivate: [authGuard]
export function permissaoGuard(
  recurso: RecursoSistema
): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.logado()) {
      router.navigate(['/login']);
      return false;
    }

    if (auth.temPermissao(recurso)) {
      return true;
    }

    router.navigate(['/acesso-negado']);
    return false;
  };
}
