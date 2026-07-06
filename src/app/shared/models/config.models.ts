type TopbarTab = {
  label: string;
  route: string;
  hideTablet?: boolean;
};

type TopbarSection = 'financeiro' | 'chamados' | 'admin' | null;


const TOPBAR_LINKS: Record<Exclude<TopbarSection, null>, TopbarTab[]> = {
  financeiro: [
    { label: 'Inadimplência', route: '/financeiro/inadimplencia' },
    { label: 'Cobranças',     route: '/financeiro/cobrancas' },
    { label: 'DRE',           route: '/financeiro/dre' },
    { label: 'PMP',           route: '/financeiro/pmp' },
    { label: 'Receber',       route: '/financeiro/contas-receber', hideTablet: true },
    { label: 'Pagar',         route: '/financeiro/contas-pagar',   hideTablet: true },
    { label: 'Fluxo',         route: '/financeiro/fluxo-caixa',    hideTablet: true },
    { label: 'Aging',         route: '/financeiro/aging-report',   hideTablet: true },
  ],

  chamados: [
    { label: 'Geral', route: '/chamados/geral' },
    // depois você pode adicionar:
    // { label: 'SLA', route: '/chamados/sla' },
    // { label: 'Atendentes', route: '/chamados/atendentes' },
  ],

  admin: [
    { label: 'Usuários', route: '/admin/usuarios' },
    { label: 'Perfis & Permissões', route: '/admin/permissoes' },
  ],
};