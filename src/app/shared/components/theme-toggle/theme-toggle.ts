// shared/components/theme-toggle/theme-toggle.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PreferenciaTema, ThemeService } from '../../config/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tt" role="radiogroup" aria-label="Tema da tela">
      @for (o of opcoes; track o.valor) {
        <button
          type="button"
          class="tt-btn"
          role="radio"
          [class.on]="theme.preferencia() === o.valor"
          [attr.aria-checked]="theme.preferencia() === o.valor"
          [title]="o.titulo"
          (click)="theme.definir(o.valor)"
        >
          <span class="tt-ico">{{ o.icone }}</span>
          <span class="tt-txt">{{ o.rotulo }}</span>
        </button>
      }
    </div>
  `,
  styles: [`
    .tt{display:inline-flex;gap:2px;padding:3px;background:var(--tint-2);border:1px solid var(--border);border-radius:10px}
    .tt-btn{display:inline-flex;align-items:center;gap:6px;border:none;background:transparent;color:var(--muted);font-size:12px;font-family:'Outfit',sans-serif;padding:5px 10px;border-radius:7px;cursor:pointer;transition:background .15s,color .15s}
    .tt-btn:hover{color:var(--text)}
    .tt-btn.on{background:var(--card);color:var(--text-strong);box-shadow:0 1px 4px var(--shadow-color)}
    .tt-ico{font-size:13px;line-height:1}
    @media (max-width:640px){.tt-txt{display:none}}
  `],
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);

  protected readonly opcoes: { valor: PreferenciaTema; rotulo: string; icone: string; titulo: string }[] = [
    { valor: 'claro', rotulo: 'Claro', icone: '☀️', titulo: 'Tema claro' },
    { valor: 'sistema', rotulo: 'Sistema', icone: '🖥️', titulo: 'Seguir o tema do dispositivo' },
    { valor: 'escuro', rotulo: 'Escuro', icone: '🌙', titulo: 'Tema escuro' },
  ];
}