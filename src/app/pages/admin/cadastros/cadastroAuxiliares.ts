import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CadastroSimplesComponent } from '../cadastros/cadastroSimples';
import { RecursoCadastroSimples } from '../../../shared/services/admin/cadastroSimples.service';

interface AbaCadastro {
  recurso: RecursoCadastroSimples;
  titulo: string;
  singular: string;
}

const ABAS: AbaCadastro[] = [
  { recurso: 'departamentos', titulo: 'Departamentos', singular: 'Departamento' },
  { recurso: 'marcas', titulo: 'Marcas', singular: 'Marca' },
  { recurso: 'modelos', titulo: 'Modelos', singular: 'Modelo' },
  { recurso: 'toners', titulo: 'Toners', singular: 'Toner' },
];

@Component({
  selector: 'app-cadastros-auxiliares',
  standalone: true,
  imports: [CommonModule, CadastroSimplesComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Cadastros <span>Auxiliares</span></h1>
          <p class="page-sub">Departamentos, marcas, modelos e toners usados no cadastro de equipamentos.</p>
        </div>
      </div>

      <div class="tabs">
        @for (aba of abas; track aba.recurso) {
          <button class="tab" [class.active]="abaAtiva().recurso === aba.recurso" (click)="abaAtiva.set(aba)">
            {{ aba.titulo }}
          </button>
        }
      </div>

      <app-cadastro-simples
        [recurso]="abaAtiva().recurso"
        [titulo]="abaAtiva().titulo"
        [singular]="abaAtiva().singular"
      />
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 20px; padding: 20px; }
    .page-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; margin: 0; }
    .page-title span { background: linear-gradient(90deg, #38BDF8, #38BDF8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .page-sub { color: var(--muted); font-size: 13px; margin-top: 5px; }

    .tabs { display: flex; gap: 8px; border-bottom: 1px solid var(--border); }
    .tab {
      background: transparent; border: none; border-bottom: 2px solid transparent;
      color: var(--muted); font-size: 13.5px; font-weight: 500; padding: 10px 14px; cursor: pointer;
    }
    .tab:hover { color: var(--text); }
    .tab.active { border-bottom-color: #38BDF8; color: #38BDF8; }
  `],
})
export class CadastrosAuxiliaresComponent {
  protected readonly abas = ABAS;
  protected readonly abaAtiva = signal<AbaCadastro>(ABAS[0]);
}
