import { Routes } from '@angular/router';
import { authGuard, adminInadimplenciaGuard, adminPmpGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'financeiro',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then(m => m.ShellComponent),
    children: [
      { path: 'inadimplencia', loadComponent: () => import('./pages/inadimplencia/inadimplencia').then(m => m.InadimplenciaComponent) },
      { path: 'cobrancas',     loadComponent: () => import('./pages/cobrancas/cobrancas').then(m => m.CobrancasComponent) },
      { path: 'dre',           loadComponent: () => import('./pages/dre/dre').then(m => m.DreComponent) },
      { path: 'pmp',           loadComponent: () => import('./pages/pmp-pmr/pmp-pmr').then(m => m.PmpPmrComponent) },
      { path: 'contas-receber',loadComponent: () => import('./pages/contas-receber/contas-receber').then(m => m.ContasReceberComponent) },
      { path: 'contas-pagar',  loadComponent: () => import('./pages/contas-pagar/contas-pagar').then(m => m.ContasPagarComponent) },
      { path: 'fluxo-caixa',  loadComponent: () => import('./pages/fluxo-caixa/fluxo-caixa').then(m => m.FluxoCaixaComponent) },
      { path: 'aging-report',  loadComponent: () => import('./pages/aging-report/aging-report').then(m => m.AgingReportComponent) },
      { path: '', redirectTo: 'inadimplencia', pathMatch: 'full' },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminInadimplenciaGuard],
    loadComponent: () => import('./layout/shell/shell').then(m => m.ShellComponent),
    children: [
      { path: 'usuarios',    loadComponent: () => import('./pages/admin/usuarios/usuarios').then(m => m.AdminUsuariosComponent) },
      { path: 'permissoes',  loadComponent: () => import('./pages/admin/permissoes/permissoes').then(m => m.AdminPermissoesComponent) },
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'financeiro/inadimplencia', pathMatch: 'full' },
  { path: '', redirectTo: 'financeiro/pmp', pathMatch: 'full' },
  { path: '', redirectTo: 'financeiro/pmr', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];