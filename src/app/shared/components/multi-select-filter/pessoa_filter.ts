import {
  Component, input, output, signal, HostListener,
} from '@angular/core';

export interface FiltroOpcao {
  id: number;
  nome: string;
}

@Component({
  selector: 'app-multi-select-filter',
  standalone: true,
  imports: [],
  template: `
    <div class="filter-wrap">
      <button class="filter-btn" (click)="toggleDropdown($event)">
        {{ icon() }}
        <span class="hide-mobile">{{ label() }}</span>
        @if (selecionados().size > 0) {
          <span class="badge">{{ selecionados().size }}</span>
        }
        <span class="chevron" [class.rot]="aberto()">▾</span>
      </button>

      @if (aberto()) {
        <div class="dropdown" (click)="$event.stopPropagation()">
          <div class="dd-header">
            <span class="dd-title">{{ label() }}</span>
            <button class="btn-text" (click)="toggleTodas()">
              {{ todasSelecionadas() ? 'Desmarcar todas' : 'Marcar todas' }}
            </button>
          </div>

          <div class="dd-list">
            @if (opcoes().length === 0) {
              <div class="dd-empty">Nenhuma opção disponível</div>
            }
            @for (op of opcoes(); track op.id) {
              <label class="dd-item">
                <input
                  type="checkbox"
                  class="chk"
                  [checked]="selecionados().has(op.id)"
                  (change)="onToggle(op.id)"
                />
                <span class="opt-nome">{{ op.id }} | {{ op.nome }}</span>
              </label>
            }
          </div>

          <div class="dd-footer">
            @if (selecionados().size === 0) {
              Todas visíveis
            } @else {
              {{ selecionados().size }} / {{ opcoes().length }} selecionadas
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .filter-wrap { position: relative; }

    .filter-btn {
      display: flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,.06); border: 1px solid var(--border);
      border-radius: 8px; color: var(--text); font-size: 12px;
      font-family: 'Outfit', sans-serif; padding: 5px 10px;
      cursor: pointer; transition: background .18s; white-space: nowrap;
    }
    .filter-btn:hover { background: rgba(255,255,255,.10); }

    .badge {
      background: #f43f5e; color: white; font-size: 9px; font-weight: 700;
      padding: 1px 5px; border-radius: 20px; min-width: 16px; text-align: center;
    }

    .chevron { font-size: 10px; color: var(--muted); transition: transform .2s; }
    .chevron.rot { transform: rotate(180deg); }

    .dropdown {
      position: absolute; top: calc(100% + 8px); left: 0;
      min-width: 240px; max-width: 300px; background: var(--surface);
      border: 1px solid rgba(255,255,255,.1); border-radius: 12px;
      box-shadow: 0 16px 48px rgba(0,0,0,.5); overflow: hidden;
      z-index: 1000; animation: fadeDown .15s ease;
    }
    @keyframes fadeDown {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .dd-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 11px 14px 9px; border-bottom: 1px solid var(--border);
    }
    .dd-title { font-size: 12px; font-weight: 600; color: var(--text); }
    .btn-text { background: none; border: none; color: #f43f5e; font-size: 11px; cursor: pointer; font-family: 'Outfit', sans-serif; padding: 0; }
    .btn-text:hover { text-decoration: underline; }

    .dd-list { max-height: 240px; overflow-y: auto; padding: 6px 0; }
    .dd-list::-webkit-scrollbar { width: 4px; }
    .dd-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
    .dd-empty { padding: 12px 14px; font-size: 12px; color: var(--muted); }

    .dd-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 14px; cursor: pointer; transition: background .12s;
    }
    .dd-item:hover { background: rgba(255,255,255,.04); }

    .chk { width: 15px; height: 15px; accent-color: #f43f5e; cursor: pointer; flex-shrink: 0; }
    .opt-nome { font-size: 12.5px; color: var(--text); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .dd-footer { padding: 8px 14px; border-top: 1px solid var(--border); font-size: 11px; color: var(--muted); }
  `],
})
export class MultiSelectFilterComponent {
  readonly label       = input.required<string>();
  readonly icon        = input<string>('🔎');
  readonly opcoes      = input.required<FiltroOpcao[]>();
  readonly selecionados = input.required<Set<number>>();

  readonly toggleId    = output<number>();
  readonly toggleTodasEvt = output<void>();

  readonly aberto = signal(false);

  readonly todasSelecionadas = () =>
    this.selecionados().size === 0 || this.selecionados().size === this.opcoes().length;

  toggleDropdown(e: Event): void {
    e.stopPropagation();
    this.aberto.update(v => !v);
  }

  onToggle(id: number): void {
    this.toggleId.emit(id);
  }

  toggleTodas(): void {
    this.toggleTodasEvt.emit();
  }

  @HostListener('document:click')
  fechar(): void {
    this.aberto.set(false);
  }
}