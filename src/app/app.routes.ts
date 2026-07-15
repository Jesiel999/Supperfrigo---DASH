import { Routes } from '@angular/router';
import { authGuard, permissaoGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then(m => m.ShellComponent),
    children: [
      { path: '', loadComponent: () => import('./pages/home').then(m => m.HomeComponent) },
    ],
  },
  {
    path: 'financeiro',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then(m => m.ShellComponent),
    children: [
      { path: 'inadimplencia',   canActivate: [permissaoGuard('inadimplencia')],   loadComponent: () => import('./pages/sances/financeiro/inadimplencia/inadimplencia').then(m => m.InadimplenciaComponent) },
      { path: 'cobrancas',       canActivate: [permissaoGuard('cobrancas')],       loadComponent: () => import('./pages/sances/financeiro/cobrancas/cobrancas').then(m => m.CobrancasComponent) },
      { path: 'dre',             canActivate: [permissaoGuard('dre')],             loadComponent: () => import('./pages/sances/financeiro/dre/dre').then(m => m.DreComponent) },
      { path: 'pmp_pmr',         canActivate: [permissaoGuard('pmp_pmr')],         loadComponent: () => import('./pages/sances/financeiro/pmp_pmr/pmp_pmr').then(m => m.PmpPmrComponent) },
      { path: 'receber',         canActivate: [permissaoGuard('receber')],         loadComponent: () => import('./pages/sances/financeiro/receber/receber').then(m => m.ContasReceberComponent) },
      { path: 'pagar',           canActivate: [permissaoGuard('pagar')],           loadComponent: () => import('./pages/sances/financeiro/pagar/pagar').then(m => m.ContasPagarComponent) },
      { path: 'credito',         canActivate: [permissaoGuard('credito')],         loadComponent: () => import('./pages/sances/financeiro/credito/credito').then(m => m.CreditoComponent) },
      { path: 'fluxo_caixa',     canActivate: [permissaoGuard('fluxo_caixa')],     loadComponent: () => import('./pages/sances/financeiro/fluxo_caixa/fluxo_caixa').then(m => m.FluxoCaixaComponent) },
      { path: 'aging_report',    canActivate: [permissaoGuard('aging_report')],    loadComponent: () => import('./pages/sances/financeiro/aging-report/aging-report').then(m => m.AgingReportComponent) },
      { path: '', redirectTo: 'inadimplencia', pathMatch: 'full' },
    ],
  },
  {
    path: 'estoque',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then(m => m.ShellComponent),
    children: [
      { path: 'movimentacao', canActivate: [permissaoGuard('estoque_movimentacao')], loadComponent: () => import('./pages/sances/estoque/movimentacao/estoque_movimentacao').then(m => m.MovimentacaoComponent) },
      { path: '', redirectTo: 'movimentacao', pathMatch: 'full' },
    ],
  },
  {
    path: 'chamados',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then(m => m.ShellComponent),
    children: [
      { path: 'geral', canActivate: [permissaoGuard('chamados_geral')], loadComponent: () => import('./pages/sults/chamados/geral').then(m => m.ChamadosGeralComponent) },
      { path: '', redirectTo: 'geral', pathMatch: 'full' },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell-sfiltro').then(m => m.ShellComponent),
    children: [
      { path: 'usuarios',    canActivate: [permissaoGuard('usuarios')],    loadComponent: () => import('./pages/admin/usuarios/usuarios').then(m => m.AdminUsuariosComponent) },
      { path: 'permissoes',  canActivate: [permissaoGuard('permissoes')],  loadComponent: () => import('./pages/admin/permissoes/permissoes').then(m => m.AdminPermissoesComponent) },
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];