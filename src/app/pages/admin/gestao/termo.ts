import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TermoService } from '../../../shared/services/admin/termo.service';
import { DropdownItem } from '../../../shared/models/admin/equipamentos.models';
import {
  ACESSORIOS_POR_MODELO, CamposTermoResponse, EmpresaTermoDados,
  TermoEmitido, TermoModelo,
} from '../../../shared/models/admin/termo.models';

type Aba = 'gerar' | 'modelos' | 'emitidos';

interface ItemSel { id: number; titulo: string; detalhe: string; cor: string; condicao: string; }
interface ChipSel { id: number; numero: string; iccid: string; }

const EMPRESA_VAZIA: EmpresaTermoDados = {
  razao_social: '', nome_fantasia: '', cnpj: '', ie: '', endereco: '',
  bairro: '', cidade: '', uf: '', cep: '', telefone: '',
};

@Component({
  selector: 'app-termos-page',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="termos">
        <header class="topo">
            <h1>Termos de responsabilidade</h1>
            <nav class="abas">
            <button [class.ativa]="aba() === 'gerar'" (click)="trocarAba('gerar')">Gerar termo</button>
            <button [class.ativa]="aba() === 'modelos'" (click)="trocarAba('modelos')">Modelos (documentos)</button>
            <button [class.ativa]="aba() === 'emitidos'" (click)="trocarAba('emitidos')">Termos emitidos</button>
            </nav>
        </header>

        @if (mensagem(); as m) {
            <div class="msg" [class.erro]="m.tipo === 'erro'" (click)="mensagem.set(null)">{{ m.texto }}</div>
        }

        <!-- ═════════════════ GERAR ═════════════════ -->
        @if (aba() === 'gerar') {
            <section class="card">
            <h2>1. Documento e empresa</h2>
            <div class="grade">
                <label>Documento
                <select [ngModel]="idModelo()" (ngModelChange)="escolherModelo($event)">
                    <option [ngValue]="null">Selecione…</option>
                    @for (m of modelos(); track m.id) { <option [ngValue]="m.id">{{ m.nome }}</option> }
                </select>
                </label>
                <label>Empresa
                <select [ngModel]="idEmpresa()" (ngModelChange)="escolherEmpresa($event)">
                    <option [ngValue]="null">Selecione…</option>
                    @for (e of empresas(); track e.id) { <option [ngValue]="e.id">{{ e.nome }}</option> }
                </select>
                </label>
                <label>Data do termo
                <input type="date" [ngModel]="dataEmissao()" (ngModelChange)="dataEmissao.set($event)" />
                </label>
                <label>Formato
                <select [ngModel]="formato()" (ngModelChange)="formato.set($event)">
                    <option value="pdf">PDF</option>
                    <option value="docx">Word (.docx)</option>
                </select>
                </label>
            </div>

            @if (idEmpresa()) {
                @if (!empresaCompleta() || editandoEmpresa()) {
                <div class="aviso">
                    @if (!empresaCompleta()) { <strong>Faltam dados desta empresa para o termo (CNPJ, endereço…).</strong> }
                    <div class="grade empresa">
                    <label>Razão social <input [ngModel]="empresaDados().razao_social" (ngModelChange)="setCampoEmpresa('razao_social', $event)" /></label>
                    <label>Nome fantasia <input [ngModel]="empresaDados().nome_fantasia" (ngModelChange)="setCampoEmpresa('nome_fantasia', $event)" /></label>
                    <label>CNPJ <input [ngModel]="empresaDados().cnpj" (ngModelChange)="setCampoEmpresa('cnpj', $event)" /></label>
                    <label>I.E. <input [ngModel]="empresaDados().ie" (ngModelChange)="setCampoEmpresa('ie', $event)" /></label>
                    <label>Endereço <input [ngModel]="empresaDados().endereco" (ngModelChange)="setCampoEmpresa('endereco', $event)" /></label>
                    <label>Bairro <input [ngModel]="empresaDados().bairro" (ngModelChange)="setCampoEmpresa('bairro', $event)" /></label>
                    <label>Cidade <input [ngModel]="empresaDados().cidade" (ngModelChange)="setCampoEmpresa('cidade', $event)" /></label>
                    <label>UF <input maxlength="2" [ngModel]="empresaDados().uf" (ngModelChange)="setCampoEmpresa('uf', $event)" /></label>
                    <label>CEP <input [ngModel]="empresaDados().cep" (ngModelChange)="setCampoEmpresa('cep', $event)" /></label>
                    <label>Telefone <input [ngModel]="empresaDados().telefone" (ngModelChange)="setCampoEmpresa('telefone', $event)" /></label>
                    </div>
                    <button class="primario" (click)="salvarEmpresa()">Salvar dados da empresa</button>
                </div>
                } @else {
                <p class="resumo-empresa">
                    {{ empresaDados().razao_social }} — CNPJ {{ empresaDados().cnpj }}
                    <button class="link" (click)="editandoEmpresa.set(true)">editar dados</button>
                </p>
                }
            }
            </section>

            <section class="card">
            <h2>2. Colaborador</h2>
            @if (colaborador(); as c) {
                <p class="selecionado">
                <strong>{{ c.nome }}</strong>
                <button class="link" (click)="colaborador.set(null)">trocar</button>
                </p>
            } @else {
                <input placeholder="Buscar colaborador pelo nome…" [ngModel]="buscaColab()" (ngModelChange)="buscarColaborador($event)" />
                @if (colabResultados().length) {
                <ul class="resultados">
                    @for (c of colabResultados(); track c.id) {
                    <li><button (click)="escolherColaborador(c)">{{ c.nome }}</button></li>
                    }
                </ul>
                }
            }
            </section>

            <section class="card">
            <h2>3. Equipamentos (um ou mais no mesmo termo)</h2>
            <div class="linha">
                <input placeholder="Buscar por nome, série, MAC…" [ngModel]="buscaEq()" (ngModelChange)="buscarEquipamento($event)" />
                <button [disabled]="!colaborador()" (click)="adicionarDoColaborador()">Adicionar os do colaborador</button>
            </div>
            @if (eqResultados().length) {
                <ul class="resultados">
                @for (e of eqResultados(); track e.id) {
                    <li><button (click)="adicionarEquipamento(e)">+ {{ e.titulo }} <small>{{ e.detalhe }}</small></button></li>
                }
                </ul>
            }

            @if (selecionados().length) {
                <table class="tabela">
                <thead><tr><th>Equipamento</th><th>Cor</th><th>Condição</th><th></th></tr></thead>
                <tbody>
                    @for (s of selecionados(); track s.id) {
                    <tr>
                        <td>{{ s.titulo }}<br /><small>{{ s.detalhe }}</small></td>
                        <td><input [ngModel]="s.cor" (ngModelChange)="setItem(s.id, 'cor', $event)" /></td>
                        <td>
                        <select [ngModel]="s.condicao" (ngModelChange)="setItem(s.id, 'condicao', $event)">
                            <option value="">—</option><option>Novo</option><option>Seminovo</option><option>Usado</option>
                        </select>
                        </td>
                        <td><button class="link perigo" (click)="removerEquipamento(s.id)">remover</button></td>
                    </tr>
                    }
                </tbody>
                </table>
            }

            <h3>Chips</h3>
            <input placeholder="Buscar chip por número ou ICCID…" [ngModel]="buscaChip()" (ngModelChange)="buscarChip($event)" />
            @if (chipResultados().length) {
                <ul class="resultados">
                @for (c of chipResultados(); track c.id) {
                    <li><button (click)="adicionarChip(c)">+ {{ c.numero }} <small>{{ c.iccid }}</small></button></li>
                }
                </ul>
            }
            @if (chipsSel().length) {
                <ul class="chips">
                @for (c of chipsSel(); track c.id) {
                    <li>{{ c.numero }} <button class="link perigo" (click)="removerChip(c.id)">×</button></li>
                }
                </ul>
            }
            </section>

            @if (listaAcessorios().length) {
            <section class="card">
                <h2>4. Acessórios entregues</h2>
                <div class="acessorios">
                @for (a of listaAcessorios(); track a.chave) {
                    <label class="check">
                    <input type="checkbox" [ngModel]="!!acessorios()[a.chave]" (ngModelChange)="toggleAcessorio(a.chave, $event)" />
                    {{ a.rotulo }}
                    </label>
                }
                </div>
                <small>O monitor é marcado automaticamente quando o equipamento tem monitor vinculado.</small>
            </section>
            }

            <div class="acoes">
            <button class="primario" [disabled]="!podeGerar()" (click)="gerar()">
                {{ ocupado() ? 'Gerando…' : (formato() === 'pdf' ? 'Gerar PDF' : 'Gerar Word') }}
            </button>
            <button (click)="limparSelecao()">Limpar seleção</button>
            </div>
        }

        <!-- ═════════════════ MODELOS ═════════════════ -->
        @if (aba() === 'modelos') {
            <section class="card">
            <h2>Documentos cadastrados</h2>
            <p class="dica">Baixe o .docx, edite no Word (mantendo os campos entre <code>{{ '{{' }} {{ '}}' }}</code>) e envie como nova versão.</p>
            <table class="tabela">
                <thead><tr><th>Nome</th><th>Identificador</th><th>Versão</th><th>Atualizado</th><th></th></tr></thead>
                <tbody>
                @for (m of modelos(); track m.id) {
                    <tr>
                    <td>{{ m.nome }}<br /><small>{{ m.descricao }}</small></td>
                    <td>{{ m.slug }}</td>
                    <td>v{{ m.versao }}</td>
                    <td>{{ m.atualizado_em | date: 'dd/MM/yyyy HH:mm' }}</td>
                    <td class="botoes">
                        <button (click)="baixarModelo(m)">Baixar .docx</button>
                        <label class="botao">Subir nova versão
                        <input type="file" accept=".docx" hidden (change)="novaVersao(m, $event)" />
                        </label>
                        <button class="link perigo" (click)="desativar(m)">Desativar</button>
                    </td>
                    </tr>
                }
                </tbody>
            </table>
            </section>

            <section class="card">
            <h2>Novo documento</h2>
            <div class="grade">
                <label>Identificador (ex.: celular-vendas)
                <input [ngModel]="novoSlug()" (ngModelChange)="novoSlug.set($event)" />
                </label>
                <label>Nome <input [ngModel]="novoNome()" (ngModelChange)="novoNome.set($event)" /></label>
                <label>Descrição <input [ngModel]="novoDescricao()" (ngModelChange)="novoDescricao.set($event)" /></label>
                <label>Arquivo .docx <input type="file" accept=".docx" (change)="escolherArquivoNovo($event)" /></label>
            </div>
            <button class="primario" (click)="criarModelo()">Criar documento</button>
            </section>

            <section class="card">
            <h2>Campos que podem ser usados no Word</h2>
            @if (campos(); as c) {
                <dl class="campos">
                @for (g of camposChaves(); track g) {
                    <dt>{{ g }}</dt>
                    <dd>@for (f of c.campos[g]; track f) { <code>{{ f }}</code> }</dd>
                }
                </dl>
                <p class="dica">Lista de equipamentos: <code>{{ c.exemplo_lista }}</code></p>
            }
            </section>
        }

        <!-- ═════════════════ EMITIDOS ═════════════════ -->
        @if (aba() === 'emitidos') {
            <section class="card">
            <h2>Termos emitidos</h2>
            <label class="check">
                <input type="checkbox" [ngModel]="somenteColaborador()" (ngModelChange)="setSomenteColab($event)" [disabled]="!colaborador()" />
                Somente do colaborador selecionado na aba "Gerar termo"
            </label>
            <table class="tabela">
                <thead><tr><th>Data</th><th>Documento</th><th>Colaborador</th><th>Itens</th><th>Gerado por</th><th>Assinado</th><th></th></tr></thead>
                <tbody>
                @for (t of emitidos(); track t.id) {
                    <tr>
                    <td>{{ t.gerado_em | date: 'dd/MM/yyyy HH:mm' }}</td>
                    <td>{{ t.nome_modelo }} (v{{ t.versao_modelo }})</td>
                    <td>{{ t.nome_colaborador }}</td>
                    <td>{{ qtdItens(t) }}</td>
                    <td>{{ t.gerado_por }}</td>
                    <td>{{ t.tem_assinado ? 'Sim' : 'Não' }}</td>
                    <td class="botoes">
                        <button (click)="baixarEmitido(t)">Baixar</button>
                        @if (t.tem_assinado) { <button (click)="baixarAssinado(t)">Ver assinado</button> }
                        <label class="botao">{{ t.tem_assinado ? 'Trocar assinado' : 'Subir assinado' }}
                        <input type="file" accept=".pdf" hidden (change)="subirAssinado(t, $event)" />
                        </label>
                    </td>
                    </tr>
                } @empty {
                    <tr><td colspan="7" class="vazio">Nenhum termo emitido.</td></tr>
                }
                </tbody>
            </table>
            </section>
        }
        </div>
  `,
  styles: `
    .termos { padding: 1.5rem; max-width: 1100px; margin: 0 auto; }
    .topo { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem;
    h1 { margin: 0; font-size: 1.4rem; } }
    .abas { display: flex; gap: .25rem;
    button { padding: .5rem 1rem; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; cursor: pointer;
        &.ativa { background: #1e40af; color: #fff; border-color: #1e40af; } } }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 1rem;
    h2 { margin: 0 0 .75rem; font-size: 1.05rem; } h3 { margin: 1rem 0 .5rem; font-size: .95rem; } }
    .grade { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: .75rem; margin-bottom: .75rem; }
    label { display: flex; flex-direction: column; gap: .25rem; font-size: .85rem; color: #475569; }
    input:not([type=checkbox]):not([type=file]), select { padding: .45rem .6rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: .9rem; width: 100%; box-sizing: border-box; }
    button { padding: .45rem .9rem; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; cursor: pointer;
    &:disabled { opacity: .5; cursor: not-allowed; }
    &.primario { background: #1e40af; color: #fff; border-color: #1e40af; }
    &.link { border: 0; background: none; color: #1e40af; padding: 0 .25rem; text-decoration: underline; }
    &.perigo { color: #b91c1c; } }
    .botao { display: inline-block; padding: .45rem .9rem; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; cursor: pointer; color: inherit; font-size: .9rem; }
    .linha { display: flex; gap: .5rem; margin-bottom: .5rem; input { flex: 1; } }
    .resultados { list-style: none; margin: .25rem 0 .75rem; padding: 0; border: 1px solid #e2e8f0; border-radius: 6px; max-height: 220px; overflow: auto;
    button { display: block; width: 100%; text-align: left; border: 0; border-radius: 0; background: #fff; &:hover { background: #eff6ff; } }
    small { color: #64748b; margin-left: .5rem; } }
    .tabela { width: 100%; border-collapse: collapse; margin-top: .5rem; font-size: .88rem;
    th, td { text-align: left; padding: .5rem; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    th { color: #64748b; font-weight: 600; } small { color: #64748b; } }
    .botoes { display: flex; gap: .35rem; flex-wrap: wrap; justify-content: flex-end; }
    .vazio { text-align: center; color: #94a3b8; padding: 1.5rem; }
    .chips { list-style: none; display: flex; flex-wrap: wrap; gap: .5rem; padding: 0; margin: .5rem 0 0;
    li { background: #eff6ff; border-radius: 999px; padding: .2rem .7rem; } }
    .acessorios { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: .5rem; margin-bottom: .5rem; }
    .check { flex-direction: row; align-items: center; gap: .5rem; color: inherit; }
    .aviso { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: .75rem; margin-top: .5rem; }
    .resumo-empresa, .selecionado { margin: .25rem 0 0; }
    .msg { background: #ecfdf5; border: 1px solid #6ee7b7; padding: .6rem .9rem; border-radius: 8px; margin-bottom: 1rem; cursor: pointer;
    &.erro { background: #fef2f2; border-color: #fca5a5; } }
    .acoes { display: flex; gap: .5rem; margin-bottom: 2rem; }
    .dica { color: #64748b; font-size: .85rem; }
    .campos { display: grid; grid-template-columns: 180px 1fr; gap: .4rem .75rem; dt { font-weight: 600; } dd { margin: 0; }
    code { background: #f1f5f9; padding: .1rem .4rem; border-radius: 4px; margin-right: .3rem; display: inline-block; } }
  `,
})
export class TermosPage implements OnInit {
  private readonly svc = inject(TermoService);

  readonly aba = signal<Aba>('gerar');
  readonly mensagem = signal<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  readonly ocupado = signal(false);

  // ── dados de apoio ─────────────────────────────────────────
  readonly modelos = signal<TermoModelo[]>([]);
  readonly empresas = signal<DropdownItem[]>([]);

  // ── GERAR ──────────────────────────────────────────────────
  readonly idModelo = signal<number | null>(null);
  readonly idEmpresa = signal<number | null>(null);
  readonly formato = signal<'pdf' | 'docx'>('pdf');
  readonly dataEmissao = signal<string>('');

  readonly buscaColab = signal('');
  readonly colabResultados = signal<DropdownItem[]>([]);
  readonly colaborador = signal<DropdownItem | null>(null);

  readonly buscaEq = signal('');
  readonly eqResultados = signal<ItemSel[]>([]);
  readonly selecionados = signal<ItemSel[]>([]);

  readonly buscaChip = signal('');
  readonly chipResultados = signal<ChipSel[]>([]);
  readonly chipsSel = signal<ChipSel[]>([]);

  readonly acessorios = signal<Record<string, boolean>>({});

  readonly modeloAtual = computed(() => this.modelos().find(m => m.id === this.idModelo()) ?? null);
  readonly listaAcessorios = computed(() => ACESSORIOS_POR_MODELO[this.modeloAtual()?.slug ?? ''] ?? []);

  readonly empresaDados = signal<EmpresaTermoDados>({ ...EMPRESA_VAZIA });
  readonly empresaCompleta = computed(() => !!this.empresaDados().cnpj);
  readonly editandoEmpresa = signal(false);

  readonly podeGerar = computed(() =>
    !!this.idModelo() && !!this.idEmpresa() && !!this.colaborador() &&
    (this.selecionados().length > 0 || this.chipsSel().length > 0) &&
    this.empresaCompleta() && !this.ocupado());

  // ── MODELOS ────────────────────────────────────────────────
  readonly campos = signal<CamposTermoResponse | null>(null);
  readonly novoSlug = signal('');
  readonly novoNome = signal('');
  readonly novoDescricao = signal('');
  novoArquivo: File | null = null;

  // ── EMITIDOS ───────────────────────────────────────────────
  readonly emitidos = signal<TermoEmitido[]>([]);
  readonly somenteColaborador = signal(false);

  private timers: Record<string, ReturnType<typeof setTimeout>> = {};

  ngOnInit(): void {
    this.carregarModelos();
    this.svc.empresas().subscribe({ next: e => this.empresas.set(e), error: e => this.erro(e) });
  }

  // ───────────────────────── util ─────────────────────────
  trocarAba(a: Aba) {
    this.aba.set(a);
    if (a === 'emitidos') this.carregarEmitidos();
    if (a === 'modelos' && !this.campos()) {
      this.svc.campos().subscribe({ next: c => this.campos.set(c) });
    }
  }

  private ok(texto: string) { this.mensagem.set({ tipo: 'ok', texto }); }

  /** Erros de download vêm como Blob; converte para o texto "detail" da API. */
  private async erro(err: any) {
    let texto = 'Erro inesperado';
    try {
      const corpo = err?.error instanceof Blob ? JSON.parse(await err.error.text()) : err?.error;
      const d = corpo?.detail;
      texto = typeof d === 'string' ? d : Array.isArray(d) ? d.map((x: any) => x.msg).join('; ') : texto;
    } catch { /* mantém texto padrão */ }
    this.mensagem.set({ tipo: 'erro', texto });
    this.ocupado.set(false);
  }

  private baixar(blob: Blob, nome: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    a.click();
    URL.revokeObjectURL(url);
  }

  private debounce(chave: string, fn: () => void, ms = 300) {
    clearTimeout(this.timers[chave]);
    this.timers[chave] = setTimeout(fn, ms);
  }

  // ───────────────────────── GERAR ─────────────────────────
  carregarModelos() {
    this.svc.modelos().subscribe({
      next: m => this.modelos.set(m),
      error: e => this.erro(e),
    });
  }

  escolherModelo(id: number | null) {
    this.idModelo.set(id);
    this.acessorios.set({});
  }

  toggleAcessorio(chave: string, v: boolean) {
    this.acessorios.update(a => ({ ...a, [chave]: v }));
  }

  escolherEmpresa(id: number | null) {
    this.idEmpresa.set(id);
    this.editandoEmpresa.set(false);
    this.empresaDados.set({ ...EMPRESA_VAZIA });
    if (id == null) return;
    this.svc.empresa(id).subscribe({
      next: e => {
        this.empresaDados.set({
          razao_social: e.razao_social ?? '', nome_fantasia: e.nome_fantasia ?? '', cnpj: e.cnpj ?? '',
          ie: e.ie ?? '', endereco: e.endereco ?? '', bairro: e.bairro ?? '', cidade: e.cidade ?? '',
          uf: e.uf ?? '', cep: e.cep ?? '', telefone: e.telefone ?? '',
        });
        if (!e.cnpj) this.editandoEmpresa.set(true);   // força cadastrar os dados que faltam
      },
      error: e => this.erro(e),
    });
  }

  setCampoEmpresa(campo: keyof EmpresaTermoDados, valor: string) {
    this.empresaDados.update(d => ({ ...d, [campo]: valor }));
  }

  salvarEmpresa() {
    const id = this.idEmpresa();
    if (id == null) return;
    this.svc.salvarEmpresa(id, this.empresaDados()).subscribe({
      next: () => { this.editandoEmpresa.set(false); this.ok('Dados da empresa salvos.'); },
      error: e => this.erro(e),
    });
  }

  // colaborador
  buscarColaborador(v: string) {
    this.buscaColab.set(v);
    this.debounce('colab', () => {
      if (v.trim().length < 2) { this.colabResultados.set([]); return; }
      this.svc.colaboradores(v).subscribe({ next: r => this.colabResultados.set(r) });
    });
  }

  escolherColaborador(c: DropdownItem) {
    this.colaborador.set(c);
    this.colabResultados.set([]);
    this.buscaColab.set('');
  }

  // equipamentos
  private paraItem(e: any): ItemSel {
    const partes = [e.nome_marca, e.nome_modelo, e.serie ? `série ${e.serie}` : ''].filter(Boolean);
    return { id: e.id, titulo: `${e.nome_tipo ?? 'Equipamento'} — ${e.nome}`, detalhe: partes.join(' · '), cor: '', condicao: '' };
  }

  buscarEquipamento(v: string) {
    this.buscaEq.set(v);
    this.debounce('eq', () => {
      this.svc.buscarEquipamentos(v).subscribe({
        next: r => this.eqResultados.set(r.itens.map(e => this.paraItem(e))),
      });
    });
  }

  adicionarEquipamento(it: ItemSel) {
    if (this.selecionados().some(s => s.id === it.id)) return;
    this.selecionados.update(l => [...l, { ...it }]);
  }

  adicionarDoColaborador() {
    const c = this.colaborador();
    if (!c) return;
    this.svc.equipamentosDoColaborador(c.id).subscribe({
      next: lista => lista.forEach(e => this.adicionarEquipamento(this.paraItem(e))),
      error: e => this.erro(e),
    });
  }

  removerEquipamento(id: number) { this.selecionados.update(l => l.filter(s => s.id !== id)); }

  setItem(id: number, campo: 'cor' | 'condicao', valor: string) {
    this.selecionados.update(l => l.map(s => (s.id === id ? { ...s, [campo]: valor } : s)));
  }

  // chips
  buscarChip(v: string) {
    this.buscaChip.set(v);
    this.debounce('chip', () => {
      this.svc.buscarChips(v, this.colaborador()?.id).subscribe({
        next: r => this.chipResultados.set(r.map((c: any) => ({ id: c.id, numero: c.numero, iccid: c.iccid }))),
      });
    });
  }

  adicionarChip(c: ChipSel) {
    if (!this.chipsSel().some(x => x.id === c.id)) this.chipsSel.update(l => [...l, c]);
  }
  removerChip(id: number) { this.chipsSel.update(l => l.filter(c => c.id !== id)); }

  gerar() {
    if (!this.podeGerar()) return;
    this.ocupado.set(true);
    this.mensagem.set(null);
    const modelo = this.modeloAtual()!;
    const fmt = this.formato();

    this.svc.gerar({
      id_modelo: modelo.id,
      id_empresa: this.idEmpresa()!,
      id_colaborador: this.colaborador()!.id,
      equipamentos: this.selecionados().map(s => ({ id: s.id, cor: s.cor || null, condicao: s.condicao || null })),
      ids_chips: this.chipsSel().map(c => c.id),
      acessorios: this.acessorios(),
      data_emissao: this.dataEmissao() || null,
      formato: fmt,
    }).subscribe({
      next: blob => {
        const nome = `termo_${modelo.slug}_${this.colaborador()!.nome.replace(/\W+/g, '_')}.${fmt}`;
        this.baixar(blob, nome);
        this.ok('Termo gerado e salvo no histórico.');
        this.ocupado.set(false);
      },
      error: e => this.erro(e),
    });
  }

  limparSelecao() {
    this.selecionados.set([]);
    this.chipsSel.set([]);
    this.acessorios.set({});
  }

  // ───────────────────────── MODELOS ─────────────────────────
  baixarModelo(m: TermoModelo) {
    this.svc.baixarModelo(m.id).subscribe({
      next: b => this.baixar(b, `${m.slug}_v${m.versao}.docx`),
      error: e => this.erro(e),
    });
  }

  novaVersao(m: TermoModelo, ev: Event) {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    this.svc.novaVersao(m.id, f).subscribe({
      next: () => { this.ok(`Nova versão de "${m.nome}" enviada.`); this.carregarModelos(); },
      error: e => this.erro(e),
    });
    input.value = '';
  }

  desativar(m: TermoModelo) {
    if (!confirm(`Desativar o modelo "${m.nome}"?`)) return;
    this.svc.desativarModelo(m.id).subscribe({
      next: () => { this.ok('Modelo desativado.'); this.carregarModelos(); },
      error: e => this.erro(e),
    });
  }

  escolherArquivoNovo(ev: Event) {
    this.novoArquivo = (ev.target as HTMLInputElement).files?.[0] ?? null;
  }

  criarModelo() {
    if (!this.novoArquivo || !this.novoSlug() || !this.novoNome()) {
      this.mensagem.set({ tipo: 'erro', texto: 'Informe identificador, nome e o arquivo .docx.' });
      return;
    }
    this.svc.criarModelo(this.novoSlug(), this.novoNome(), this.novoDescricao(), this.novoArquivo).subscribe({
      next: () => {
        this.ok('Modelo criado.');
        this.novoSlug.set(''); this.novoNome.set(''); this.novoDescricao.set(''); this.novoArquivo = null;
        this.carregarModelos();
      },
      error: e => this.erro(e),
    });
  }

  camposChaves(): string[] { return Object.keys(this.campos()?.campos ?? {}); }

  // ───────────────────────── EMITIDOS ─────────────────────────
  carregarEmitidos() {
    const colab = this.somenteColaborador() ? this.colaborador()?.id : undefined;
    this.svc.emitidos(colab).subscribe({ next: l => this.emitidos.set(l), error: e => this.erro(e) });
  }

  setSomenteColab(v: boolean) { this.somenteColaborador.set(v); this.carregarEmitidos(); }

  baixarEmitido(t: TermoEmitido) {
    this.svc.baixarEmitido(t.id).subscribe({
      next: b => this.baixar(b, `termo_${t.id}.pdf`),
      error: e => this.erro(e),
    });
  }

  baixarAssinado(t: TermoEmitido) {
    this.svc.baixarAssinado(t.id).subscribe({
      next: b => this.baixar(b, `termo_${t.id}_assinado.pdf`),
      error: e => this.erro(e),
    });
  }

  subirAssinado(t: TermoEmitido, ev: Event) {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    this.svc.subirAssinado(t.id, f).subscribe({
      next: () => { this.ok('Cópia assinada anexada.'); this.carregarEmitidos(); },
      error: e => this.erro(e),
    });
    input.value = '';
  }

  qtdItens(t: TermoEmitido) { return t.ids_equipamentos.length + t.ids_chips.length; }
}
