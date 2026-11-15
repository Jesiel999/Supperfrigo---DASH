import { Routes } from '@angular/router';
import { authGuard, permissaoGuard } from './auth/guards/auth.guard';
import { menu } from '../app/auth/menu-rota';

// `data: menu(...)` publica a rota na Home (título, descrição e ícone do cartão).
// Rota sem `data: menu(...)` continua funcionando normalmente, só não aparece na Home.
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell-sfiltro').then(m => m.ShellComponent),
    children: [
      { path: '', loadComponent: () => import('./pages/home').then(m => m.HomeComponent) },
    ],
  },
  {
    path: 'telemetria',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then(m => m.ShellComponent),
    children: [
      { path: 'frota', canActivate: [permissaoGuard('frota')], data: menu('frota', 'Frota', 'Telemetria e acompanhamento da frota.', '🚚'),
        loadComponent: () => import('./pages/telemetria/frota').then(m => m.TelemetriaFrotaComponent) },
    ],
  },
  {
    path: 'financeiro',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then(m => m.ShellComponent),
    children: [
      { path: 'inadimplencia', canActivate: [permissaoGuard('inadimplencia')], data: menu('inadimplencia', 'Inadimplência', 'Títulos vencidos e não pagos, por cliente.', '⏰'),
        loadComponent: () => import('./pages/financeiro/inadimplencia/inadimplencia').then(m => m.InadimplenciaComponent) },
      { path: 'cobrancas', canActivate: [permissaoGuard('cobrancas')], data: menu('cobrancas', 'Cobranças', 'Acompanhamento das ações de cobrança.', '📞'),
        loadComponent: () => import('./pages/financeiro/cobrancas/cobrancas').then(m => m.CobrancasComponent) },
      { path: 'dre', canActivate: [permissaoGuard('dre')], data: menu('dre', 'DRE', 'Resultado por conta, com detalhe dos títulos.', '📑'),
        loadComponent: () => import('./pages/financeiro/dre/dre').then(m => m.DreComponent) },
      { path: 'fcp', canActivate: [permissaoGuard('fcp')], data: menu('fcp', 'FCP', 'Fluxo de caixa projetado, mês a mês.', '💧'),
        loadComponent: () => import('./pages/financeiro/fcp/fcp').then(m => m.FcpComponent) },
      { path: 'pmp', canActivate: [permissaoGuard('pmp')], data: menu('pmp', 'PMP', 'Prazo médio de pagamento.', '🧾'),
        loadComponent: () => import('./pages/financeiro/pmp/pmp').then(m => m.PmpComponent) },
      { path: 'pmr', canActivate: [permissaoGuard('pmr')], data: menu('pmr', 'PMR', 'Prazo médio de recebimento.', '🧮'),
        loadComponent: () => import('./pages/financeiro/pmr/pmr').then(m => m.PmrComponent) },
      { path: 'credito', canActivate: [permissaoGuard('credito')], data: menu('credito', 'Crédito', 'Análise de crédito e limites de clientes.', '💳'),
        loadComponent: () => import('./pages/financeiro/credito/credito').then(m => m.CreditoComponent) },
      { path: 'fluxo_caixa', canActivate: [permissaoGuard('fluxo_caixa')], data: menu('fluxo_caixa', 'Fluxo de Caixa', 'Entradas e saídas realizadas.', '🌊'),
        loadComponent: () => import('./pages/financeiro/fluxo_caixa/fluxo_caixa').then(m => m.FluxoCaixaComponent) },
      { path: 'aging_report', canActivate: [permissaoGuard('aging_report')], data: menu('aging_report', 'Aging Report', 'Vencimentos por faixa de atraso.', '📊'),
        loadComponent: () => import('./pages/financeiro/aging-report/aging-report').then(m => m.AgingReportComponent) },
      { path: 'receber', canActivate: [permissaoGuard('receber')], data: menu('receber', 'Contas a Receber', 'Valores a receber, recebidos e taxa de recebimento.', '💰'),
        loadComponent: () => import('./pages/financeiro/receber/receber').then(m => m.ReceberComponent) },
      { path: 'pagar', canActivate: [permissaoGuard('pagar')], data: menu('pagar', 'Contas a Pagar', 'Valores a pagar e pagos, por fornecedor.', '💸'),
        loadComponent: () => import('./pages/financeiro/pagar/pagar').then(m => m.PagarComponent) },
      { path: '', redirectTo: 'inadimplencia', pathMatch: 'full' },
    ],
  },
  {
    path: 'estoque',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then(m => m.ShellComponent),
    children: [
      { path: 'movimentacao', canActivate: [permissaoGuard('estoque_movimentacao')], data: menu('estoque_movimentacao', 'Movimentação de Estoque', 'Entradas, saídas e saldo de estoque.', '📦'),
        loadComponent: () => import('./pages/estoque/movimentacao/estoque_movimentacao').then(m => m.EstoqueComponent) },
      { path: '', redirectTo: 'movimentacao', pathMatch: 'full' },
    ],
  },
  {
    path: 'chamados',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then(m => m.ShellComponent),
    children: [
      { path: 'geral', canActivate: [permissaoGuard('chamados_geral')], data: menu('chamados_geral', 'Chamados', 'Abra e acompanhe solicitações com qualquer departamento.', '🎫'),
        loadComponent: () => import('./pages/chamados/geral').then(m => m.ChamadosGeralComponent) },
      { path: '', redirectTo: 'geral', pathMatch: 'full' },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell-sfiltro').then(m => m.ShellComponent),
    children: [
      { path: 'usuarios', canActivate: [permissaoGuard('usuarios')], data: menu('usuarios', 'Usuários', 'Cadastro e gestão de usuários.', '👤'),
        loadComponent: () => import('./pages/admin/usuarios/usuarios').then(m => m.AdminUsuariosComponent) },
      { path: 'permissoes', canActivate: [permissaoGuard('permissoes')], data: menu('permissoes', 'Permissões', 'Acessos por perfil e por usuário.', '🔐'),
        loadComponent: () => import('./pages/admin/permissoes/permissoes').then(m => m.AdminPermissoesComponent) },
      { path: 'equipamentos', canActivate: [permissaoGuard('equipamentos')], data: menu('equipamentos', 'Equipamentos', 'Gestão de equipamentos e ativos.', '💻'),
        loadComponent: () => import('./pages/admin/gestao/equipamentos').then(m => m.AdminAtivosComponent) },
      { path: 'chips', canActivate: [permissaoGuard('chips')], data: menu('chips', 'Chips', 'Gestão de chips e linhas.', '📶'),
        loadComponent: () => import('./pages/admin/gestao/chips').then(m => m.ChipComponent) },
      { path: 'cadastroAuxiliares', canActivate: [permissaoGuard('cadastroAuxiliares')], data: menu('cadastroAuxiliares', 'Cadastros Auxiliares', 'Tabelas de apoio do sistema.', '🗂️'),
        loadComponent: () => import('./pages/admin/cadastros/cadastroAuxiliares').then(m => m.CadastrosAuxiliaresComponent) },
      { path: 'colaboradores', canActivate: [permissaoGuard('colaboradores')], data: menu('colaboradores', 'Colaboradores', 'Cadastro e gestão de colaboradores.', '🧑‍💼'),
        loadComponent: () => import('./pages/admin/gestao/colaboradores').then(m => m.ColaboradorComponent) },
      { path: 'cadastroEmpresa', canActivate: [permissaoGuard('cadastroEmpresa')], data: menu('cadastroEmpresa', 'Empresas', 'Cadastro de empresas.', '🏢'),
        loadComponent: () => import('./pages/admin/cadastros/cadastroEmpresa').then(m => m.EmpresaCadastroComponent) },
      { path: 'cadastroAvisos', canActivate: [permissaoGuard('cadastroAvisos')], data: menu('cadastroAvisos', 'Home', 'Cadastro de Avisos', '🏢'),
        loadComponent: () => import('./pages/admin/home/cadastroAvisos').then(m => m.AdminAvisosComponent) },
      { path: 'termo', canActivate: [permissaoGuard('termo')], data: menu('termo', 'Termo', 'Geração de Termo', '🏢'),
        loadComponent: () => import('./pages/admin/gestao/termo').then(m => m.TermosPage) },
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
    ],
  },
  // qualquer endereço desconhecido volta para a Home (o authGuard dela manda ao login se não houver sessão)
  { path: '**', redirectTo: 'home' },
];