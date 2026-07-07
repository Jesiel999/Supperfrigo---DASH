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
      { path: 'inadimplencia', loadComponent: () => import('./pages/sances/financeiro/inadimplencia/inadimplencia').then(m => m.InadimplenciaComponent) },
      { path: 'cobrancas',     loadComponent: () => import('./pages/sances/financeiro/cobrancas/cobrancas').then(m => m.CobrancasComponent) },
      { path: 'dre',           loadComponent: () => import('./pages/sances/financeiro/dre/dre').then(m => m.DreComponent) },
      { path: 'pmp',           loadComponent: () => import('./pages/sances/financeiro/pmp-pmr/pmp-pmr').then(m => m.PmpPmrComponent) },
      { path: 'contas-receber',loadComponent: () => import('./pages/sances/financeiro/contas-receber/contas-receber').then(m => m.ContasReceberComponent) },
      { path: 'contas-pagar',  loadComponent: () => import('./pages/sances/financeiro/contas-pagar/contas-pagar').then(m => m.ContasPagarComponent) },
      { path: 'fluxo-caixa',  loadComponent: () => import('./pages/sances/financeiro/fluxo-caixa/fluxo-caixa').then(m => m.FluxoCaixaComponent) },
      { path: 'aging-report',  loadComponent: () => import('./pages/sances/financeiro/aging-report/aging-report').then(m => m.AgingReportComponent) },
      { path: '', redirectTo: 'inadimplencia', pathMatch: 'full' },
    ],
  },
  {
    path: 'estoque',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then(m => m.ShellComponent),
    children: [
      { path: 'movimentacao', loadComponent: () => import('./pages/sances/estoque/movimentacao/movimentacao').then(m => m.MovimentacaoComponent) },
    ],
  },
  {
    path: 'chamados',
    canActivate: [authGuard, adminInadimplenciaGuard],
    loadComponent: () => import('./layout/shell/shell').then(m => m.ShellComponent),
    children: [
      { path: 'geral',    loadComponent: () => import('./pages/sults/chamados/geral').then(m => m.ChamadosGeralComponent) },
      { path: '', redirectTo: 'geral', pathMatch: 'full' },
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