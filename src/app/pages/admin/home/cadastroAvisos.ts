// src/app/pages/admin/avisos/admin-avisos.ts — cadastro dos avisos que aparecem na Home
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { AvisoAdmin } from '../../../shared/models/admin/home.models'

const NOVO = (): AvisoAdmin => ({ titulo: '', tag: null, publicar_de: null, publicar_ate: null, ativo: true });

@Component({
  selector: 'app-admin-avisos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="topo">
        <div>
          <h1 class="titulo">Avisos da Home</h1>
          <p class="sub">Comunicados exibidos para todos os usuários na tela inicial (até 5 por vez, os importantes primeiro).</p>
        </div>
        <button type="button" class="btn" (click)="novo()">+ Novo aviso</button>
      </header>

      @if (editando(); as a) {
        <section class="card form">
          <h2>{{ a.id ? 'Editar aviso' : 'Novo aviso' }}</h2>
          <label>Título
            <input type="text" maxlength="200" [value]="a.titulo" (input)="campo('titulo', $any($event.target).value)" />
          </label>
          <div class="linha">
            <label>Tipo
              <select (change)="campo('tag', $any($event.target).value || null)">
                <option value="" [selected]="!a.tag">Sem tipo</option>
                @for (t of tags; track t) { <option [value]="t" [selected]="a.tag === t">{{ t }}</option> }
              </select>
            </label>
            <label>Publicar a partir de
              <input type="date" [value]="a.publicar_de" (change)="campo('publicar_de', $any($event.target).value || null)" />
            </label>
            <label>Exibir até
              <input type="date" [value]="a.publicar_ate" (change)="campo('publicar_ate', $any($event.target).value || null)" />
            </label>
            <label class="check">
              <input type="checkbox" [checked]="a.ativo" (change)="campo('ativo', $any($event.target).checked)" />
              Ativo
            </label>
          </div>
          @if (erro()) { <p class="erro">{{ erro() }}</p> }
          <div class="acoes">
            <button type="button" class="btn" [disabled]="salvando() || !a.titulo.trim()" (click)="salvar()">
              {{ salvando() ? 'Salvando…' : 'Salvar' }}
            </button>
            <button type="button" class="btn-ghost" (click)="editando.set(null)">Cancelar</button>
          </div>
        </section>
      }

      <section class="card">
        @if (carregando()) {
          <p class="vazio">Carregando…</p>
        } @else if (!lista().length) {
          <p class="vazio">Nenhum aviso cadastrado.</p>
        } @else {
          <table class="tabela">
            <thead><tr><th>Título</th><th>Tipo</th><th>De</th><th>Até</th><th>Situação</th><th></th></tr></thead>
            <tbody>
              @for (a of lista(); track a.id) {
                <tr>
                  <td class="t">{{ a.titulo }}</td>
                  <td>{{ a.tag || '—' }}</td>
                  <td>{{ data(a.publicar_de) }}</td>
                  <td>{{ data(a.publicar_ate) }}</td>
                  <td><span class="pill" [class.on]="a.ativo">{{ a.ativo ? 'Ativo' : 'Inativo' }}</span></td>
                  <td class="ac">
                    <button type="button" class="link" (click)="editar(a)">Editar</button>
                    <button type="button" class="link perigo" (click)="excluir(a)">Excluir</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </div>
  `,
  styles: [`
    .page{display:flex;flex-direction:column;gap:18px;padding:20px;max-width:1100px;margin:0 auto}
    .topo{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
    .titulo{margin:0;font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--text-strong)}
    .sub{margin:4px 0 0;font-size:12.5px;color:var(--muted)}
    .card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px}
    .form{display:flex;flex-direction:column;gap:12px}
    .form h2{margin:0;font-size:15px;font-family:'Syne',sans-serif;color:var(--text-strong)}
    label{display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--muted)}
    input[type=text],input[type=date],select{background:var(--tint-2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;font-family:'Outfit',sans-serif;padding:8px 10px;outline:none;color-scheme:var(--color-scheme)}
    .linha{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end}
    .check{flex-direction:row;align-items:center;gap:8px;color:var(--text)}
    .acoes{display:flex;gap:10px}
    .btn{background:var(--accent);color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:600;font-family:'Outfit',sans-serif;padding:8px 16px;cursor:pointer}
    .btn:hover:not(:disabled){background:var(--accent-hover)}
    .btn:disabled{opacity:.5;cursor:not-allowed}
    .btn-ghost{background:var(--tint-2);color:var(--text);border:1px solid var(--border);border-radius:10px;font-size:12px;font-family:'Outfit',sans-serif;padding:8px 16px;cursor:pointer}
    .erro{margin:0;color:var(--neg);font-size:12.5px}
    .vazio{margin:0;color:var(--muted);font-size:13px}
    .tabela{width:100%;border-collapse:collapse;font-size:12.5px}
    .tabela th{padding:10px;text-align:left;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--border)}
    .tabela td{padding:10px;color:var(--text);border-bottom:1px solid var(--border)}
    .tabela .t{font-weight:500}
    .ac{text-align:right;white-space:nowrap}
    .link{background:none;border:none;color:var(--info);font-size:12px;cursor:pointer;font-family:'Outfit',sans-serif;margin-left:10px}
    .link.perigo{color:var(--neg)}
    .pill{font-size:10px;font-weight:600;padding:2px 9px;border-radius:999px;background:var(--tint-3);color:var(--muted)}
    .pill.on{background:rgba(52,211,153,.18);color:var(--pos)}
  `],
})
export class AdminAvisosComponent implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly tags = ['Importante', 'Novidade', 'Manutenção'] as const;
  protected readonly lista = signal<AvisoAdmin[]>([]);
  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly editando = signal<AvisoAdmin | null>(null);

  ngOnInit(): void { this.carregar(); }

  protected carregar(): void {
    this.carregando.set(true);
    this.api.getAvisosAdmin().subscribe({
      next: r => { this.lista.set(r.data ?? []); this.carregando.set(false); },
      error: () => { this.lista.set([]); this.carregando.set(false); },
    });
  }

  protected novo(): void { this.erro.set(null); this.editando.set(NOVO()); }

  protected editar(a: AvisoAdmin): void {
    this.erro.set(null);
    this.editando.set({ ...a, publicar_de: a.publicar_de?.slice(0, 10) ?? null, publicar_ate: a.publicar_ate?.slice(0, 10) ?? null });
  }

  protected campo<K extends keyof AvisoAdmin>(chave: K, valor: AvisoAdmin[K]): void {
    const atual = this.editando();
    if (atual) this.editando.set({ ...atual, [chave]: valor });
  }

  protected salvar(): void {
    const a = this.editando();
    if (!a || !a.titulo.trim()) return;
    this.salvando.set(true);
    this.erro.set(null);
    this.api.salvarAviso(a).subscribe({
      next: () => { this.salvando.set(false); this.editando.set(null); this.carregar(); },
      error: () => { this.salvando.set(false); this.erro.set('Não foi possível salvar o aviso.'); },
    });
  }

  protected excluir(a: AvisoAdmin): void {
    if (!a.id || !confirm(`Excluir o aviso "${a.titulo}"?`)) return;
    this.api.excluirAviso(a.id).subscribe({ next: () => this.carregar() });
  }

  protected data(iso: string | null | undefined): string {
    const [ano, mes, dia] = (iso ?? '').slice(0, 10).split('-');
    return dia && mes && ano ? `${dia}/${mes}/${ano}` : '—';
  }
}