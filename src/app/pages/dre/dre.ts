import { Component } from '@angular/core';

@Component({
  selector: 'app-dre',
  template: `
    <div class="placeholder">
      <div class="icon">📊</div>
      <h2>DRE</h2>
      <p>Demonstrativo de Resultado do Exercício</p>
      <span class="badge">Em desenvolvimento</span>
    </div>
  `,
  styles: [`
    .placeholder {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 60vh; gap: 12px;
      color: var(--muted); text-align: center;
    }
    .icon { font-size: 52px; }
    h2 { font-family: 'Syne',sans-serif; font-size: 22px; color: var(--text); }
    p  { font-size: 14px; }
    .badge {
      background: rgba(56,189,248,.1); border: 1px solid rgba(56,189,248,.25);
      color: #38bdf8; font-size: 12px; padding: 4px 14px; border-radius: 20px;
    }
  `],
})
export class DreComponent {}
