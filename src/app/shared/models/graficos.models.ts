export interface Serie {
  id: string;                         
  label: string;                       
  cor: string;                         
  formatador: 'currency' | 'number' | 'percent';
  pontos: PontoGrafico[];
}

export interface PontoGrafico {
  data: string;
  valor: number;
}