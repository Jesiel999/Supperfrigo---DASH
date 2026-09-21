import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CadastroSimplesService, RecursoCadastroSimples } from '../../../shared/services/admin/cadastroSimples.service';
import { DropdownItem } from '../../../shared/models/equipamentos.models';

@Component({
  selector: 'app-cadastro-simples',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">{{ titulo }}</h2>
          <p class="card-sub">{{ itens().length }} cadastrado(s)</p>
        </div>
        <button class="btn-novo" (click)="abrirCriacao()">+ Novo</button>
      </div>

      <input
        class="input-busca"
        type="text"
        [placeholder]="'Buscar ' + singular.toLowerCase() + '...'"
        [value]="busca()"
        (input)="onBuscar($any($event.target).value)"
      />

      <div class="lista">
        @if (carregando()) {
          <p class="vazio">Carregando...</p>
        } @else if (itens().length === 0) {
          <p class="vazio">Nenhum(a) {{ singular.toLowerCase() }} cadastrado(a).</p>
        } @else {
          @for (item of itens(); track item.id) {
            <div class="item">
              @if (emEdicaoId() === item.id) {
                <input class="input-edicao" [value]="nomeEdicao()" (input)="nomeEdicao.set($any($event.target).value)" />
                <div class="acoes">
                  <button class="btn-icone" (click)="salvarEdicao(item)" title="Salvar">✅</button>
                  <button class="btn-icone" (click)="cancelarEdicao()" title="Cancelar">✕</button>
                </div>
              } @else {
                <span class="item-nome">{{ item.nome }}</span>
                <div class="acoes">
                  <button class="btn-icone" (click)="iniciarEdicao(item)" title="Editar">✏️</button>
                  <button class="btn-icone btn-excluir" (click)="excluir(item)" title="Excluir">🗑️</button>
                </div>
              }
            </div>
          }
        }
      </div>

      @if (criandoAberto()) {
        <div class="item item-novo">
          <input class="input-edicao" [placeholder]="'Nome ' + '(' + singular.toLowerCase() + ')'" [value]="nomeNovo()" (input)="nomeNovo.set($any($event.target).value)" />
          <div class="acoes">
            <button class="btn-icone" (click)="salvarCriacao()" title="Salvar">✅</button>
            <button class="btn-icone" (click)="criandoAberto.set(false)" title="Cancelar">✕</button>
          </div>
        </div>
      }

      @if (erro()) {
        <p class="erro">{{ erro() }}</p>
      }
    </div>
  `,
  styles: [`
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 22px; }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .card-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; margin: 0; }
    .card-sub { font-size: 11.5px; color: var(--muted); margin: 0; }

    .btn-novo { background: #38BDF8; color: #0b1220; border: none; padding: 7px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 12.5px; }
    .btn-novo:hover { background: #0ea5e9; }

    .input-busca {
      width: 100%; box-sizing: border-box; background: rgba(255,255,255,.06); border: 1px solid var(--border);
      border-radius: 8px; color: var(--text); font-size: 12.5px; padding: 8px 12px; outline: none; margin-bottom: 14px;
    }

    .lista { display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; }
    .item {
      display: flex; align-items: center; justify-content: space-between;
      background: rgba(255,255,255,.04); border: 1px solid var(--border);
      border-radius: 8px; padding: 8px 12px;
    }
    .item-novo { margin-top: 10px; border-color: #38BDF8; }
    .item-nome { font-size: 13px; color: var(--text); }
    .vazio { color: var(--muted); font-size: 12.5px; text-align: center; padding: 20px 0; }

    .acoes { display: flex; gap: 4px; }
    .btn-icone { background: rgba(255,255,255,.06); border: 1px solid var(--border); border-radius: 6px; width: 26px; height: 26px; cursor: pointer; font-size: 11px; }
    .btn-icone:hover { background: rgba(255,255,255,.14); }
    .btn-excluir:hover { background: rgba(244,63,94,.2); border-color: #f43f5e; }

    .input-edicao {
      flex: 1; background: rgba(255,255,255,.08); border: 1px solid #38BDF8;
      border-radius: 6px; color: var(--text); font-size: 13px; padding: 5px 8px; outline: none; margin-right: 8px;
    }

    .erro { color: #f43f5e; font-size: 12.5px; margin-top: 10px; }
  `],
})
export class CadastroSimplesComponent implements OnChanges {
  @Input({ required: true }) recurso!: RecursoCadastroSimples;
  @Input() titulo = 'Cadastro';
  @Input() singular = 'Item';

  private readonly svc = inject(CadastroSimplesService);

  protected readonly itens      = signal<DropdownItem[]>([]);
  protected readonly carregando = signal(false);
  protected readonly busca      = signal('');
  protected readonly erro       = signal<string | null>(null);

  protected readonly criandoAberto = signal(false);
  protected readonly nomeNovo      = signal('');

  protected readonly emEdicaoId = signal<number | null>(null);
  protected readonly nomeEdicao = signal('');

  private debounceBusca?: ReturnType<typeof setTimeout>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recurso']) {
      this.busca.set('');
      this.criandoAberto.set(false);
      this.nomeNovo.set('');
      this.emEdicaoId.set(null);
      this.erro.set(null);
      this.carregar();
    }
  }

  private carregar(): void {
    this.carregando.set(true);
    this.svc.listar(this.recurso, this.busca() || undefined).subscribe({
      next: itens => { this.itens.set(itens); this.carregando.set(false); },
      error: err => {
        console.error(`Erro ao carregar ${this.recurso}:`, err);
        this.carregando.set(false);
      },
    });
  }

  onBuscar(v: string): void {
    this.busca.set(v);
    clearTimeout(this.debounceBusca);
    this.debounceBusca = setTimeout(() => this.carregar(), 300);
  }

  abrirCriacao(): void {
    this.nomeNovo.set('');
    this.erro.set(null);
    this.criandoAberto.set(true);
  }

  salvarCriacao(): void {
    const nome = this.nomeNovo().trim();
    if (!nome) { this.erro.set('Informe um nome.'); return; }

    this.svc.criar(this.recurso, nome).subscribe({
      next: () => { this.criandoAberto.set(false); this.erro.set(null); this.carregar(); },
      error: err => {
        console.error(`Erro ao criar ${this.recurso}:`, err);
        this.erro.set('Não foi possível salvar. Tente novamente.');
      },
    });
  }

  iniciarEdicao(item: DropdownItem): void {
    this.emEdicaoId.set(item.id);
    this.nomeEdicao.set(item.nome);
    this.erro.set(null);
  }

  cancelarEdicao(): void {
    this.emEdicaoId.set(null);
  }

  salvarEdicao(item: DropdownItem): void {
    const nome = this.nomeEdicao().trim();
    if (!nome) { this.erro.set('Informe um nome.'); return; }

    this.svc.atualizar(this.recurso, item.id, nome).subscribe({
      next: () => { this.emEdicaoId.set(null); this.carregar(); },
      error: err => {
        console.error(`Erro ao atualizar ${this.recurso}:`, err);
        this.erro.set('Não foi possível salvar. Tente novamente.');
      },
    });
  }

  excluir(item: DropdownItem): void {
    if (!confirm(`Excluir "${item.nome}"?`)) return;

    this.svc.excluir(this.recurso, item.id).subscribe({
      next: () => this.carregar(),
      error: err => {
        console.error(`Erro ao excluir ${this.recurso}:`, err);
        this.erro.set(err?.error?.detail ?? 'Não foi possível excluir este item.');
      },
    });
  }
}