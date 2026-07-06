import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Perfil, Permissao } from '../../../shared/models/financeiro.models';
import { PermissoesService } from '../../../shared/services/permissoes.service' ;
@Component({
  selector: 'app-admin-permissoes',
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Perfis & <span>Permissões</span></h1>
          <p class="page-sub">Gerencie o que cada perfil pode visualizar e fazer</p>
        </div>
        <button class="btn-primary" (click)="novoPerfil()">+ Novo Perfil</button>
      </div>

      @if (carregando()) {
        <div class="loading-message">Carregando perfis...</div>
      }

      @if (erroGeral()) {
        <div class="alert-erro">⚠️ {{ erroGeral() }}</div>
      }

      <div class="perfil-tabs">
        @for (p of perfis(); track p.id) {
          <div class="perfil-tab" [class.active]="perfilSelecionado()?.id === p.id"
               (click)="selecionarPerfil(p)">
            <div class="ptab-dot" [style.background]="p.cor"></div>
            <div>
              <div class="ptab-nome">{{ p.nome }}</div>
              <div class="ptab-users">{{ p.total_usuarios }} usuário{{ p.total_usuarios !== 1 ? 's' : '' }}</div>
            </div>
            @if (!isPerfilProtegido(p.id)) {
              <button class="ptab-del" title="Excluir perfil" (click)="$event.stopPropagation(); excluirPerfil(p.id)">✕</button>
            }
          </div>
        }
      </div>

      @if (perfilSelecionado()) {
        <div class="card perfil-info-card">
          <div class="perfil-info-row">
            <div class="perfil-color-picker">
              <div class="color-preview" [style.background]="perfilSelecionado()!.cor"></div>
            </div>
            <div class="perfil-fields">
              <input class="inp" type="text" [(ngModel)]="perfilSelecionado()!.nome"
                     [disabled]="isPerfilProtegido(perfilSelecionado()!.id)"
                     placeholder="Nome do perfil"/>
              <input class="inp" type="text" [(ngModel)]="perfilSelecionado()!.descricao"
                     [disabled]="isPerfilProtegido(perfilSelecionado()!.id)"
                     placeholder="Descrição do perfil"/>
            </div>
            @if (!isPerfilProtegido(perfilSelecionado()!.id)) {
              <button class="btn-save-perfil" (click)="salvarPerfil()" [disabled]="salvando()">
                @if (salvando()) { <span class="spin"></span> }
                @else { 💾 Salvar perfil }
              </button>
            } @else {
              <div class="admin-lock">🔒 Perfil protegido</div>
            }
          </div>
        </div>

        <!-- Matriz de permissões -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Matriz de Permissões</h2>
            @if (!isPerfilProtegido(perfilSelecionado()!.id)) {
              <div class="bulk-actions">
                <button class="btn-bulk success" (click)="marcarTodos(true)">✓ Selecionar todos</button>
                <button class="btn-bulk danger"  (click)="marcarTodos(false)">✕ Remover todos</button>
              </div>
            }
          </div>

          <!-- Column headers -->
          <div class="matrix-header">
            <div class="mh-recurso">Recurso</div>
            <div class="mh-acao">👁 Visualizar</div>
            <div class="mh-acao">➕ Criar</div>
            <div class="mh-acao">✏️ Editar</div>
            <div class="mh-acao">🗑️ Excluir</div>
          </div>

          @for (cat of categorias(); track cat) {
            <div class="cat-group">
              <div class="cat-header">
                <span class="cat-label">{{ cat }}</span>
                @if (!isPerfilProtegido(perfilSelecionado()!.id)) {
                  <button class="cat-sel-all" (click)="marcarCategoria(cat, true)">tudo</button>
                  <button class="cat-sel-none" (click)="marcarCategoria(cat, false)">nenhum</button>
                }
              </div>
              @for (perm of getPermsByCategoria(cat); track perm.recurso) {
                <div class="matrix-row" [class.locked]="isPerfilProtegido(perfilSelecionado()!.id)">
                  <div class="mr-label">{{ perm.label }}</div>
                  <div class="mr-check">
                    <label class="ck" [class.checked]="perm.visualizar">
                      <input type="checkbox" [(ngModel)]="perm.visualizar"
                             [disabled]="isPerfilProtegido(perfilSelecionado()!.id)"
                             (change)="onPermChange(perm, 'visualizar')"/>
                      <span class="ck-box"></span>
                    </label>
                  </div>
                  <div class="mr-check">
                    <label class="ck" [class.checked]="perm.criar">
                      <input type="checkbox" [(ngModel)]="perm.criar"
                             [disabled]="isPerfilProtegido(perfilSelecionado()!.id) || !perm.visualizar"/>
                      <span class="ck-box"></span>
                    </label>
                  </div>
                  <div class="mr-check">
                    <label class="ck" [class.checked]="perm.editar">
                      <input type="checkbox" [(ngModel)]="perm.editar"
                             [disabled]="isPerfilProtegido(perfilSelecionado()!.id) || !perm.visualizar"/>
                      <span class="ck-box"></span>
                    </label>
                  </div>
                  <div class="mr-check">
                    <label class="ck" [class.checked]="perm.excluir">
                      <input type="checkbox" [(ngModel)]="perm.excluir"
                             [disabled]="isPerfilProtegido(perfilSelecionado()!.id) || !perm.visualizar"/>
                      <span class="ck-box"></span>
                    </label>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    @if (toast()) {
      <div class="toast" [class]="'toast-' + toastType()">{{ toast() }}</div>
    }
  `,
  styles: [`
    .page{display:flex;flex-direction:column;gap:20px}
    .page-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px}
    .page-title{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.5px}
    .page-title span{background:linear-gradient(90deg,#a78bfa,#f43f5e);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .page-sub{color:var(--muted);font-size:13px;margin-top:4px}
    .btn-primary{background:linear-gradient(135deg,#a78bfa,#38bdf8);border:none;border-radius:8px;color:white;font-size:12.5px;font-weight:600;font-family:'Outfit',sans-serif;padding:9px 18px;cursor:pointer}

    .loading-message{background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.3);color:#38bdf8;padding:12px 16px;border-radius:8px;font-size:13px}
    .alert-erro{background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.3);color:#f43f5e;padding:12px 16px;border-radius:8px;font-size:13px}

    /* Perfil tabs */
    .perfil-tabs{display:flex;gap:10px;flex-wrap:wrap}
    .perfil-tab{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:12px;border:1px solid var(--border);background:var(--card);cursor:pointer;transition:all .2s;min-width:160px;position:relative}
    .perfil-tab:hover{border-color:rgba(167,139,250,.3)}
    .perfil-tab.active{border-color:rgba(167,139,250,.4);background:rgba(167,139,250,.08)}
    .ptab-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
    .ptab-nome{font-size:13px;font-weight:600}
    .ptab-users{font-size:11px;color:var(--muted);margin-top:1px}
    .ptab-del{position:absolute;top:6px;right:6px;background:none;border:none;color:var(--muted);cursor:pointer;font-size:11px;line-height:1;padding:2px;opacity:0;transition:opacity .2s}
    .perfil-tab:hover .ptab-del{opacity:1}

    /* Card */
    .card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px}
    .card-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:16px}
    .card-title{font-family:'Syne',sans-serif;font-weight:700;font-size:15px}

    /* Perfil info */
    .perfil-info-card{padding:16px 20px}
    .perfil-info-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
    .color-preview{width:36px;height:36px;border-radius:50%;flex-shrink:0;border:2px solid rgba(255,255,255,.15)}
    .perfil-fields{display:flex;gap:10px;flex:1;flex-wrap:wrap}
    .inp{background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;font-family:'Outfit',sans-serif;padding:7px 12px;outline:none;flex:1;min-width:140px}
    .inp:focus{border-color:rgba(167,139,250,.4)}
    .inp:disabled{opacity:.5}
    .btn-save-perfil{background:linear-gradient(135deg,#34d399,#38bdf8);border:none;border-radius:8px;color:#0b0f1a;font-size:12px;font-weight:700;font-family:'Outfit',sans-serif;padding:8px 16px;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:6px}
    .admin-lock{background:rgba(100,116,139,.1);border:1px solid var(--border);border-radius:8px;color:var(--muted);font-size:12px;padding:7px 14px}

    /* Bulk actions */
    .bulk-actions{display:flex;gap:8px}
    .btn-bulk{font-size:11.5px;font-weight:600;padding:5px 12px;border-radius:6px;cursor:pointer;font-family:'Outfit',sans-serif;border:1px solid}
    .btn-bulk.success{background:rgba(52,211,153,.1);border-color:rgba(52,211,153,.3);color:#34d399}
    .btn-bulk.danger{background:rgba(244,63,94,.1);border-color:rgba(244,63,94,.3);color:#f43f5e}

    /* Matrix */
    .matrix-header{display:grid;grid-template-columns:1fr 100px 100px 100px 100px;gap:0;padding:8px 12px;border-bottom:1px solid var(--border);margin-bottom:8px}
    @media(max-width:700px){
      .matrix-header{grid-template-columns:1fr 60px 60px 60px 60px}
      .mh-acao{font-size:9px}
    }
    .mh-recurso{font-size:10.5px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:var(--muted)}
    .mh-acao{font-size:10.5px;font-weight:600;text-transform:uppercase;color:var(--muted);text-align:center}

    .cat-group{margin-bottom:16px}
    .cat-header{display:flex;align-items:center;gap:8px;padding:6px 12px;margin-bottom:4px}
    .cat-label{font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--muted)}
    .cat-sel-all,.cat-sel-none{font-size:10px;padding:2px 8px;border-radius:4px;cursor:pointer;border:none;font-family:'Outfit',sans-serif}
    .cat-sel-all{background:rgba(52,211,153,.1);color:#34d399}
    .cat-sel-none{background:rgba(244,63,94,.08);color:var(--muted)}

    .matrix-row{display:grid;grid-template-columns:1fr 100px 100px 100px 100px;align-items:center;padding:8px 12px;border-radius:8px;transition:background .15s}
    @media(max-width:700px){.matrix-row{grid-template-columns:1fr 60px 60px 60px 60px}}
    .matrix-row:hover{background:rgba(255,255,255,.03)}
    .matrix-row.locked .ck-box{opacity:.4}
    .mr-label{font-size:13px;color:var(--text)}
    .mr-check{display:flex;justify-content:center;align-items:center}

    /* Custom checkbox */
    .ck{display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative}
    .ck input{position:absolute;opacity:0;width:0;height:0}
    .ck-box{width:18px;height:18px;border-radius:5px;border:1.5px solid var(--border);background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;transition:all .18s;position:relative}
    .ck.checked .ck-box{background:#a78bfa;border-color:#a78bfa}
    .ck.checked .ck-box::after{content:'✓';color:white;font-size:11px;font-weight:700;line-height:1}
    .ck:hover .ck-box{border-color:rgba(167,139,250,.5)}

    .spin{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .7s linear infinite;display:inline-block}
    @keyframes spin{to{transform:rotate(360deg)}}

    .toast{position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:500;z-index:9999;animation:slideIn .3s ease;box-shadow:0 8px 24px rgba(0,0,0,.4)}
    @keyframes slideIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
    .toast-success{background:#14532d;border:1px solid #34d399;color:#34d399}
    .toast-error{background:#450a0a;border:1px solid #f43f5e;color:#f43f5e}
  `],
})
export class AdminPermissoesComponent implements OnInit {
  protected readonly permissoesService = inject(PermissoesService);

  readonly perfis     = signal<Perfil[]>([]);
  readonly categorias = signal<string[]>([]);
  readonly perfilSelecionado = signal<Perfil | null>(null);
  readonly carregando = signal(false);
  readonly erroGeral = signal('');
  readonly salvando = signal(false);
  readonly toast     = signal('');
  readonly toastType = signal<'success'|'error'>('success');

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.carregando.set(true);
    this.erroGeral.set('');

    // Carregar perfis
    this.permissoesService.getPerfis().subscribe({
      next: (response: any) => {
        console.log('PERFIS', response.perfis);
        console.log('PERMISSOES', response.perfis[0]?.permissoes);

        this.perfis.set(response.perfis);

        if (response.perfis.length > 0) {
          this.perfilSelecionado.set(response.perfis[0]);
        }

        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar perfis:', err);
        this.erroGeral.set('Erro ao carregar perfis. Tente novamente.');
        this.carregando.set(false);
      }
    });

    // Carregar categorias
    this.permissoesService.getCategorias().subscribe({
      next: (response) => {
        this.categorias.set(response.categorias);
      },
      error: (err) => {
        console.error('Erro ao carregar categorias:', err);
      }
    });
  }

  selecionarPerfil(p: Perfil) {
    this.perfilSelecionado.set(p);
  }

  getPermsByCategoria(cat: string): Permissao[] {
    return this.perfilSelecionado()?.permissoes.filter(p => p.categoria === cat) ?? [];
  }

  onPermChange(perm: Permissao, campo: 'visualizar') {
    if (!perm.visualizar) {
      perm.criar = false; 
      perm.editar = false; 
      perm.excluir = false;
    }
  }

  marcarTodos(val: boolean) {
    this.perfilSelecionado()?.permissoes.forEach(p => {
      p.visualizar = val; 
      p.criar = val; 
      p.editar = val; 
      p.excluir = val;
    });
  }

  marcarCategoria(cat: string, val: boolean) {
    this.perfilSelecionado()?.permissoes
      .filter(p => p.categoria === cat)
      .forEach(p => { 
        p.visualizar = val; 
        p.criar = val; 
        p.editar = val; 
        p.excluir = val; 
      });
  }

  salvarPerfil() {
    const perfil = this.perfilSelecionado();
    if (!perfil) return;

    this.salvando.set(true);

    // Construir objeto de permissões para enviar
    const permissoesMap: Record<string, any> = {};
    perfil.permissoes.forEach(p => {
      permissoesMap[p.recurso] = {
        visualizar: p.visualizar,
        criar: p.criar,
        editar: p.editar,
        excluir: p.excluir
      };
    });

    const updateData = {
      nome: perfil.nome,
      descricao: perfil.descricao,
      cor: perfil.cor,
      permissoes: permissoesMap
    };

    this.permissoesService.atualizarPerfil(perfil.id, updateData).subscribe({
      next: (perfilAtualizado) => {
        this.perfis.update(list =>
          list.map(p => p.id === perfilAtualizado.id ? perfilAtualizado : p)
        );
        this.perfilSelecionado.set(perfilAtualizado);
        this.showToast('Permissões salvas com sucesso!', 'success');
        this.salvando.set(false);
      },
      error: (err) => {
        console.error('Erro:', err);
        this.showToast(err.error?.detail || 'Erro ao salvar permissões', 'error');
        this.salvando.set(false);
      }
    });
  }

  novoPerfil() {
    this.showToast('Funcionalidade de criar novo perfil em desenvolvimento', 'error');
  }

  excluirPerfil(id: string) {
    if (!confirm('Tem certeza que deseja deletar este perfil?')) {
      return;
    }

    this.permissoesService.deletarPerfil(id).subscribe({
      next: () => {
        this.perfis.update(list => list.filter(p => p.id !== id));
        if (this.perfilSelecionado()?.id === id) {
          this.perfilSelecionado.set(this.perfis()[0] ?? null);
        }
        this.showToast('Perfil excluído com sucesso', 'success');
      },
      error: (err) => {
        console.error('Erro:', err);
        this.showToast(err.error?.detail || 'Erro ao excluir perfil', 'error');
      }
    });
  }

  temPermissao(
  perfilId: string,
  recurso: string,
  acao: keyof Permissao
  ): boolean {
    const perfil = this.perfis().find(p => p.id === perfilId);

    if (!perfil) return false;

    const permissao = perfil.permissoes.find(
      p => p.recurso === recurso
    );

    return Boolean(permissao?.[acao]);
  }

  isPerfilProtegido(perfilId: any) {
  return String(perfilId).startsWith('perfil_');
}

  private showToast(msg: string, type: 'success'|'error') {
    this.toast.set(msg); 
    this.toastType.set(type);
    setTimeout(() => this.toast.set(''), 3000);
  }
}