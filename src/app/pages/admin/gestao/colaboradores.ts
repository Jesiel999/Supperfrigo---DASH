import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ColaboradorService } from '../../../shared/services/admin/colaborador.service';
import { PessoaApiItem } from '../../../shared/models/cadastros.models';

@Component({
  selector: 'app-colaboradores',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">

      <div class="page-header">
        <div>
          <h1 class="page-title">
            Cadastro de <span>Colaboradores</span>
          </h1>

          <p class="page-sub">
            Pessoas marcadas como colaborador em pessoa_bi — usadas para
            vincular equipamentos e chips.
          </p>
        </div>

        <button
          class="btn-novo"
          (click)="abrirAdicionar()"
        >
          + Adicionar Colaborador
        </button>
      </div>

      <div class="card">

        <input
          class="input-busca"
          type="text"
          placeholder="Buscar por nome ou CPF/CNPJ..."
          [value]="svc.busca()"
          (input)="svc.setBusca($any($event.target).value)"
        />

        <div class="table-wrapper">

          <table class="data-table">

            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF/CNPJ</th>
                <th>Sexo</th>
                <th class="cell-acoes">Ações</th>
              </tr>
            </thead>

            <tbody>

              @if (svc.carregando()) {

                <tr>
                  <td colspan="4" class="cell-vazio">
                    Carregando...
                  </td>
                </tr>

              } @else if (svc.colaboradores().length === 0) {

                <tr>
                  <td colspan="4" class="cell-vazio">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>

              } @else {

                @for (p of svc.colaboradores(); track p.id) {

                  <tr>

                    <td class="cell-nome">
                      {{ p.nome }}
                    </td>

                    <td class="cell-data">
                      {{ p.cpf_cnpj || '-' }}
                    </td>

                    <td class="cell-data">
                      {{ p.sexo || '-' }}
                    </td>

                    <td class="cell-acoes">

                      <button
                        class="btn-icone btn-excluir"
                        (click)="excluir(p)"
                        title="Remover da lista de colaboradores"
                      >
                        🗑️
                      </button>

                    </td>

                  </tr>

                }

              }

            </tbody>

          </table>

        </div>

        @if (svc.totalPaginas() > 1) {

          <div class="paginacao">

            <button
              class="btn-pag"
              [disabled]="svc.pagina() === 0"
              (click)="svc.irParaPagina(svc.pagina() - 1)"
            >
              ← Anterior
            </button>

            <span>
              Página {{ svc.pagina() + 1 }}
              de {{ svc.totalPaginas() }}
            </span>

            <button
              class="btn-pag"
              [disabled]="svc.pagina() + 1 >= svc.totalPaginas()"
              (click)="svc.irParaPagina(svc.pagina() + 1)"
            >
              Próxima →
            </button>

          </div>

        }

      </div>

    </div>
  `,

  styles: [`
    .page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 20px;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    .page-title {
      font-family: 'Syne', sans-serif;
      font-size: 24px;
      font-weight: 800;
      margin: 0;
    }

    .page-title span {
      background: linear-gradient(90deg, #38BDF8, #38BDF8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .page-sub {
      color: var(--muted);
      font-size: 13px;
      margin-top: 5px;
      max-width: 560px;
    }

    .btn-novo {
      background: #38BDF8;
      color: #0b1220;
      border: none;
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-novo:hover {
      background: #0ea5e9;
    }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 22px;
    }

    .input-busca {
      width: 100%;
      box-sizing: border-box;
      background: rgba(255,255,255,.06);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      font-size: 12.5px;
      padding: 8px 12px;
      outline: none;
      margin-bottom: 16px;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .data-table thead {
      background: rgba(255,255,255,.04);
      border-bottom: 1px solid var(--border);
    }

    .data-table th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: .5px;
    }

    .data-table tbody tr {
      border-bottom: 1px solid var(--border);
    }

    .data-table tbody tr:hover {
      background: rgba(255,255,255,.04);
    }

    .data-table td {
      padding: 12px;
      color: var(--text);
    }

    .cell-nome {
      font-weight: 500;
    }

    .cell-data {
      color: var(--muted);
    }

    .cell-vazio {
      text-align: center;
      color: var(--muted);
      padding: 30px 0;
    }

    .cell-acoes {
      white-space: nowrap;
    }

    .btn-icone {
      background: rgba(255,255,255,.06);
      border: 1px solid var(--border);
      border-radius: 6px;
      width: 28px;
      height: 28px;
      margin-right: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    .btn-icone:hover {
      background: rgba(255,255,255,.14);
    }

    .btn-excluir:hover {
      background: rgba(244,63,94,.2);
      border-color: #f43f5e;
    }

    .paginacao {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-top: 16px;
      font-size: 12.5px;
      color: var(--muted);
    }

    .btn-pag {
      background: rgba(255,255,255,.06);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 8px;
      padding: 6px 12px;
      cursor: pointer;
      font-size: 12px;
    }

    .btn-pag:disabled {
      opacity: .4;
      cursor: not-allowed;
    }
  `],
})
export class ColaboradorComponent implements OnInit {

  protected readonly svc = inject(ColaboradorService);

  ngOnInit(): void {
    this.svc.carregar();
  }

  abrirAdicionar(): void {
    console.log(
      'Adicionar colaborador: selecionar uma pessoa existente.'
    );
  }

  excluir(pessoa: PessoaApiItem): void {

    if (
      !confirm(
        `Remover "${pessoa.nome}" da lista de colaboradores?`
      )
    ) {
      return;
    }

    this.svc.excluir(pessoa.id).subscribe({
      next: () => {
        this.svc.carregar();
      },

      error: (err: unknown) => {
        console.error(
          'Erro ao remover colaborador:',
          err
        );
      },
    });
  }
}