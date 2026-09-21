import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpresaCadastroService } from '../../../shared/services/admin/cadastroEmpresa.service';
import { EmpresaApiItem } from '../../../shared/models/cadastros.models';

// Ajuste os caminhos de import acima conforme a pasta real do projeto.

@Component({
  selector: 'app-empresas-cadastro',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Cadastro de <span>Empresas</span></h1>
          <p class="page-sub">Empresas usadas em Financeiro, Estoque e Equipamentos.</p>
        </div>
        <button class="btn-novo" (click)="abrirCriacao()">+ Nova Empresa</button>
      </div>

      <div class="card">
        <input
          class="input-busca"
          type="text"
          placeholder="Buscar por nome..."
          [value]="svc.busca()"
          (input)="svc.setBusca($any($event.target).value)"
        />

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th class="cell-acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              @if (svc.carregando()) {
                <tr><td colspan="3" class="cell-vazio">Carregando...</td></tr>
              } @else if (svc.empresas().length === 0) {
                <tr><td colspan="3" class="cell-vazio">Nenhuma empresa cadastrada.</td></tr>
              } @else {
                @for (e of svc.empresas(); track e.codigo_empresa) {
                  <tr>
                    <td class="cell-data">{{ e.codigo_empresa }}</td>
                    <td class="cell-nome">{{ e.nome_empresa }}</td>
                    <td class="cell-acoes">
                      <button class="btn-icone" (click)="abrirEdicao(e)" title="Editar">✏️</button>
                      <button class="btn-icone btn-excluir" (click)="excluir(e)" title="Excluir">🗑️</button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    @if (formAberto()) {
      <div class="modal-backdrop" (click)="fecharForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ modoEdicao() ? 'Editar Empresa' : 'Nova Empresa' }}</h2>
            <button class="close-btn" (click)="fecharForm()">✕</button>
          </div>
          <div class="modal-body">
            <label class="form-field">
              <span>Código da empresa {{ modoEdicao() ? '' : '*' }}</span>
              <input
                type="number"
                [value]="codigoEmpresa()"
                [disabled]="modoEdicao()"
                (input)="codigoEmpresa.set(+$any($event.target).value)"
              />
              @if (!modoEdicao()) {
                <small>Use o mesmo código já utilizado no ERP/sistema de origem.</small>
              }
            </label>
            <label class="form-field">
              <span>Nome *</span>
              <input type="text" [value]="nomeEmpresa()" (input)="nomeEmpresa.set($any($event.target).value)" />
            </label>
            @if (erroForm()) { <p class="erro-form">{{ erroForm() }}</p> }
          </div>
          <div class="modal-footer">
            <button class="btn-secundario" (click)="fecharForm()">Cancelar</button>
            <button class="btn-primario" (click)="salvarForm()" [disabled]="salvando()">
              {{ salvando() ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 24px; padding: 20px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .page-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; margin: 0; }
    .page-title span { background: linear-gradient(90deg, #38BDF8, #38BDF8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .page-sub { color: var(--muted); font-size: 13px; margin-top: 5px; }
    .btn-novo { background: #38BDF8; color: #0b1220; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 600; cursor: pointer; }
    .btn-novo:hover { background: #0ea5e9; }

    .card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 22px; }
    .input-busca {
      width: 100%; box-sizing: border-box; background: rgba(255,255,255,.06); border: 1px solid var(--border);
      border-radius: 8px; color: var(--text); font-size: 12.5px; padding: 8px 12px; outline: none; margin-bottom: 16px;
    }

    .table-wrapper { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .data-table thead { background: rgba(255,255,255,.04); border-bottom: 1px solid var(--border); }
    .data-table th { padding: 12px; text-align: left; font-weight: 600; color: var(--muted); text-transform: uppercase; font-size: 10px; letter-spacing: .5px; }
    .data-table tbody tr { border-bottom: 1px solid var(--border); }
    .data-table tbody tr:hover { background: rgba(255,255,255,.04); }
    .data-table td { padding: 12px; color: var(--text); }
    .cell-nome { font-weight: 500; }
    .cell-data { color: var(--muted); }
    .cell-vazio { text-align: center; color: var(--muted); padding: 30px 0; }
    .cell-acoes { white-space: nowrap; }

    .btn-icone { background: rgba(255,255,255,.06); border: 1px solid var(--border); border-radius: 6px; width: 28px; height: 28px; margin-right: 4px; cursor: pointer; font-size: 12px; }
    .btn-icone:hover { background: rgba(255,255,255,.14); }
    .btn-excluir:hover { background: rgba(244,63,94,.2); border-color: #f43f5e; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.65); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 9999; }
    .modal { width: 420px; max-width: 95vw; background: #141922; border: 1px solid rgba(255,255,255,.08); border-radius: 20px; display: flex; flex-direction: column; }
    .modal-header { padding: 22px 26px; border-bottom: 1px solid rgba(255,255,255,.06); display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { font-size: 18px; font-family: 'Syne'; margin: 0; }
    .close-btn { width: 34px; height: 34px; border-radius: 50%; border: none; background: rgba(255,255,255,.06); color: white; cursor: pointer; }
    .close-btn:hover { background: #f43f5e; }
    .modal-body { padding: 22px 26px; display: flex; flex-direction: column; gap: 14px; }
    .modal-footer { padding: 18px 26px; border-top: 1px solid rgba(255,255,255,.06); display: flex; justify-content: flex-end; gap: 10px; }
    .btn-primario { background: #38BDF8; color: #0b1220; border: none; padding: 9px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primario:disabled { opacity: .5; cursor: not-allowed; }
    .btn-secundario { background: transparent; border: 1px solid var(--border); color: var(--text); padding: 9px 20px; border-radius: 8px; cursor: pointer; }

    .form-field { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: var(--muted); }
    .form-field input { background: rgba(255,255,255,.06); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 13px; padding: 8px 10px; outline: none; }
    .form-field input:disabled { opacity: .5; }
    .form-field small { font-size: 11px; color: var(--muted); }
    .erro-form { color: #f43f5e; font-size: 12.5px; }
  `],
})
export class EmpresaCadastroComponent implements OnInit {
  protected readonly svc = inject(EmpresaCadastroService);

  protected readonly formAberto  = signal(false);
  protected readonly modoEdicao  = signal(false);
  protected readonly codigoEmpresa = signal<number>(0);
  protected readonly nomeEmpresa   = signal('');
  protected readonly erroForm    = signal<string | null>(null);
  protected readonly salvando    = signal(false);

  ngOnInit(): void {
    this.svc.carregar();
  }

  abrirCriacao(): void {
    this.modoEdicao.set(false);
    this.codigoEmpresa.set(0);
    this.nomeEmpresa.set('');
    this.erroForm.set(null);
    this.formAberto.set(true);
  }

  abrirEdicao(empresa: EmpresaApiItem): void {
    this.modoEdicao.set(true);
    this.codigoEmpresa.set(empresa.codigo_empresa);
    this.nomeEmpresa.set(empresa.nome_empresa);
    this.erroForm.set(null);
    this.formAberto.set(true);
  }

  fecharForm(): void { this.formAberto.set(false); }

  salvarForm(): void {
    const nome = this.nomeEmpresa().trim();
    if (!nome) { this.erroForm.set('Informe o nome da empresa.'); return; }
    if (!this.modoEdicao() && !this.codigoEmpresa()) { this.erroForm.set('Informe o código da empresa.'); return; }

    this.erroForm.set(null);
    this.salvando.set(true);

    const request$ = this.modoEdicao()
      ? this.svc.atualizar(this.codigoEmpresa(), { nome_empresa: nome })
      : this.svc.criar({ codigo_empresa: this.codigoEmpresa(), nome_empresa: nome });

    request$.subscribe({
      next: () => { this.salvando.set(false); this.formAberto.set(false); this.svc.carregar(); },
      error: err => {
        console.error('Erro ao salvar empresa:', err);
        this.erroForm.set(err?.error?.detail ?? 'Não foi possível salvar. Tente novamente.');
        this.salvando.set(false);
      },
    });
  }

  excluir(empresa: EmpresaApiItem): void {
    if (!confirm(`Excluir a empresa "${empresa.nome_empresa}"?`)) return;

    this.svc.excluir(empresa.codigo_empresa).subscribe({
      next: () => this.svc.carregar(),
      error: err => {
        console.error('Erro ao excluir empresa:', err);
        alert(err?.error?.detail ?? 'Não foi possível excluir esta empresa.');
      },
    });
  }
}
