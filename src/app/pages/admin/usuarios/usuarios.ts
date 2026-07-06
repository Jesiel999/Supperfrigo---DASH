import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Usuario, CreateUsuarioRequest, UpdateUsuarioRequest  } from '../../../shared/models/financeiro.models';
import { UsuariosService } from '../../../shared/services/usuarios.service';

type Role = 'admin' | 'gestor' | 'analista' | 'operador';

interface UsuarioForm {
  id: string; username: string; nome: string; email: string;
  telefone: string; password: string; role: Role; perfil_id: string; ativo: boolean;
}

interface PerfilOpcao { id: string; nome: string; cor: string; }

const PERFIS_MOCK: PerfilOpcao[] = [
  { id:'perfil_admin',    nome:'Administrador',      cor:'#f43f5e' },
  { id:'perfil_gestor',   nome:'Gestor Financeiro',  cor:'#34d399' },
  { id:'perfil_analista', nome:'Analista',            cor:'#38bdf8' },
  { id:'perfil_operador', nome:'Operador',            cor:'#fb923c' },
];

const ROLE_INFO: Record<Role, { label: string; cor: string }> = {
  admin:    { label:'Admin',    cor:'#f43f5e' },
  gestor:   { label:'Gestor',   cor:'#34d399' },
  analista: { label:'Analista', cor:'#38bdf8' },
  operador: { label:'Operador', cor:'#fb923c' },
};

@Component({
  selector: 'app-admin-usuarios',
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Gestão de <span>Usuários</span></h1>
          <p class="page-sub">{{ usuariosFiltrados().length }} usuários cadastrados</p>
        </div>
        <button class="btn-primary" (click)="abrirModal()">+ Novo Usuário</button>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        @for (stat of stats(); track stat.label) {
          <div class="stat-card">
            <div class="stat-num" [style.color]="stat.cor">{{ stat.num }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        }
      </div>

      <!-- Loading -->
      @if (carregando()) {
        <div class="loading-message">Carregando usuários...</div>
      }

      <!-- Erro -->
      @if (erroGeral()) {
        <div class="alert-erro">⚠️ {{ erroGeral() }}</div>
      }

      <!-- Filters -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Usuários do Sistema</h2>
          <div class="filters">
            <input class="input-f" type="text" placeholder="🔍 Buscar nome ou e-mail…"
                   [(ngModel)]="busca" (ngModelChange)="aplicarFiltro()"/>
            <select class="sel-f" [(ngModel)]="filtroRole" (ngModelChange)="aplicarFiltro()">
              <option value="">Todos os perfis</option>
              <option value="admin">Admin</option>
              <option value="gestor">Gestor</option>
              <option value="analista">Analista</option>
              <option value="operador">Operador</option>
            </select>
            <select class="sel-f" [(ngModel)]="filtroAtivo" (ngModelChange)="aplicarFiltro()">
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>
        </div>

        <!-- Table -->
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>Usuário</th><th>Login</th><th>Perfil</th>
              <th>Status</th><th>Último acesso</th><th>Ações</th>
            </tr></thead>
            <tbody>
              @for (u of usuariosFiltrados(); track u.id) {
                <tr [class.inativo]="!u.ativo">
                  <td>
                    <div class="user-cell">
                      <div class="avatar-sm" [style.background]="avatarGrad(u.role)">
                        {{ initials(u.nome) }}
                      </div>
                      <div>
                        <div class="u-nome">{{ u.nome }}</div>
                        <div class="u-email">{{ u.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="mono">{{ u.username }}</td>
                  <td>
                    <span class="role-badge" [style.background]="roleBg(u.role)" [style.color]="ROLE_INFO[u.role].cor" [style.border-color]="roleBorder(u.role)">
                      {{ ROLE_INFO[u.role].label }}
                    </span>
                  </td>
                  <td>
                    <div class="status-toggle" [class.ativo]="u.ativo" (click)="toggleAtivo(u)">
                      <div class="toggle-knob"></div>
                    </div>
                    <span class="status-text" [class.ativo]="u.ativo">{{ u.ativo ? 'Ativo' : 'Inativo' }}</span>
                  </td>
                  <td class="mono muted">{{ u.ultimo_acesso }}</td>
                  <td>
                    <div class="act-row">
                      <button class="btn-icon" title="Editar" (click)="editarUsuario(u)">✏️</button>
                      <button class="btn-icon" title="Resetar senha" (click)="resetSenha(u)">🔑</button>
                      @if (u.role !== 'admin') {
                        <button class="btn-icon danger" title="Desativar" (click)="toggleAtivo(u)">🗑️</button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ───── MODAL ───── -->
    @if (modalAberto()) {
      <div class="modal-overlay" (click)="fecharModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">{{ editando() ? 'Editar Usuário' : 'Novo Usuário' }}</h2>
            <button class="modal-close" (click)="fecharModal()">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <div class="field">
                <label class="lbl">Nome completo *</label>
                <input class="inp" type="text" [(ngModel)]="form.nome" placeholder="Ex.: João Silva"/>
              </div>
              <div class="field">
                <label class="lbl">Username *</label>
                <input class="inp" type="text" [(ngModel)]="form.username" placeholder="joao.silva" [disabled]="editando()"/>
              </div>
              <div class="field">
                <label class="lbl">E-mail *</label>
                <input class="inp" type="email" [(ngModel)]="form.email" placeholder="joao@empresa.com.br"/>
              </div>
              <div class="field">
                <label class="lbl">Telefone</label>
                <input class="inp" type="text" [(ngModel)]="form.telefone" placeholder="(11) 99999-0000"/>
              </div>
              @if (!editando()) {
                <div class="field">
                  <label class="lbl">Senha inicial *</label>
                  <input class="inp" type="password" [(ngModel)]="form.password" placeholder="Mínimo 8 caracteres"/>
                </div>
              }
              <div class="field">
                <label class="lbl">Nível de acesso *</label>
                <select class="inp" [(ngModel)]="form.role">
                  <option value="admin">Administrador</option>
                  <option value="gestor">Gestor Financeiro</option>
                  <option value="analista">Analista</option>
                  <option value="operador">Operador</option>
                </select>
              </div>
              <div class="field full">
                <label class="lbl">Perfil de permissões *</label>
                <div class="perfil-opts">
                  @for (p of perfisDisponiveis; track p.id) {
                    <div class="perfil-opt" [class.selected]="form.perfil_id === p.id"
                         (click)="form.perfil_id = p.id">
                      <div class="perfil-dot" [style.background]="p.cor"></div>
                      <span>{{ p.nome }}</span>
                      @if (form.perfil_id === p.id) { <span class="check">✓</span> }
                    </div>
                  }
                </div>
              </div>
            </div>

            @if (erroForm()) {
              <div class="alert-err">⚠️ {{ erroForm() }}</div>
            }
            @if (sucessoForm()) {
              <div class="alert-ok">✅ {{ sucessoForm() }}</div>
            }
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="fecharModal()">Cancelar</button>
            <button class="btn-save" (click)="salvar()" [disabled]="salvando()">
              @if (salvando()) { <span class="spin"></span> Salvando… }
              @else { {{ editando() ? 'Salvar alterações' : 'Criar usuário' }} }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal reset senha -->
    @if (modalSenhaAberto()) {
      <div class="modal-overlay" (click)="modalSenhaAberto.set(false)">
        <div class="modal" style="max-width:380px" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">🔑 Redefinir Senha</h2>
            <button class="modal-close" (click)="modalSenhaAberto.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <p style="color:var(--muted);font-size:13px;margin-bottom:16px">
              Redefinindo senha de: <strong style="color:var(--text)">{{ usuarioSenha()?.nome }}</strong>
            </p>
            <div class="field">
              <label class="lbl">Nova senha *</label>
              <input class="inp" type="password" [(ngModel)]="novaSenha" placeholder="Mínimo 8 caracteres"/>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="modalSenhaAberto.set(false)">Cancelar</button>
            <button class="btn-save" (click)="confirmarResetSenha()" [disabled]="salvando()">
              @if (salvando()) { <span class="spin"></span> }
              @else { Confirmar }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Toast -->
    @if (toast()) {
      <div class="toast" [class]="'toast-' + toastType()">{{ toast() }}</div>
    }
  `,
  styles: [`
    .page{display:flex;flex-direction:column;gap:20px}
    .page-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px}
    .page-title{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.5px}
    .page-title span{background:linear-gradient(90deg,#a78bfa,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .page-sub{color:var(--muted);font-size:13px;margin-top:4px}
    .btn-primary{background:linear-gradient(135deg,#a78bfa,#38bdf8);border:none;border-radius:8px;color:white;font-size:12.5px;font-weight:600;font-family:'Outfit',sans-serif;padding:9px 18px;cursor:pointer;transition:opacity .2s}
    .btn-primary:hover{opacity:.88}

    .stats-row{display:flex;gap:14px;flex-wrap:wrap}
    .stat-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px 22px;flex:1;min-width:140px}
    .stat-num{font-family:'JetBrains Mono',monospace;font-size:26px;font-weight:700;letter-spacing:-1px}
    .stat-label{font-size:12px;color:var(--muted);margin-top:4px}

    .loading-message{background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.3);color:#38bdf8;padding:12px 16px;border-radius:8px;font-size:13px}
    .alert-erro{background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.3);color:#f43f5e;padding:12px 16px;border-radius:8px;font-size:13px}

    .card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px}
    .card-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:16px}
    .card-title{font-family:'Syne',sans-serif;font-weight:700;font-size:15px}
    .filters{display:flex;gap:8px;flex-wrap:wrap}
    .input-f{background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;font-family:'Outfit',sans-serif;padding:6px 12px;outline:none;width:190px}
    .sel-f{background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;font-family:'Outfit',sans-serif;padding:6px 10px;outline:none}

    .table-wrap{overflow-x:auto}
    table{width:100%;border-collapse:collapse;font-size:13px}
    thead th{text-align:left;padding:9px 14px;font-size:10.5px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border);white-space:nowrap}
    tbody tr{border-bottom:1px solid rgba(255,255,255,.03);transition:background .15s}
    tbody tr:hover{background:rgba(255,255,255,.03)}
    tbody tr.inativo{opacity:.5}
    td{padding:11px 14px;vertical-align:middle}

    .user-cell{display:flex;align-items:center;gap:10px}
    .avatar-sm{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0}
    .u-nome{font-weight:500;font-size:13px}
    .u-email{font-size:11px;color:var(--muted);margin-top:1px}
    .mono{font-family:'JetBrains Mono',monospace;font-size:12px}
    .muted{color:var(--muted)}

    .role-badge{font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px;border:1px solid}

    .status-toggle{display:inline-flex;width:34px;height:18px;border-radius:20px;background:rgba(255,255,255,.1);position:relative;cursor:pointer;transition:background .2s;vertical-align:middle;margin-right:6px}
    .status-toggle.ativo{background:rgba(52,211,153,.3)}
    .toggle-knob{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--muted);transition:all .2s}
    .status-toggle.ativo .toggle-knob{left:18px;background:#34d399}
    .status-text{font-size:12px;color:var(--muted)}
    .status-text.ativo{color:#34d399}

    .act-row{display:flex;gap:5px}
    .btn-icon{width:28px;height:28px;border-radius:6px;border:1px solid var(--border);background:rgba(255,255,255,.05);cursor:pointer;font-size:13px;transition:background .15s}
    .btn-icon:hover{background:rgba(255,255,255,.1)}
    .btn-icon.danger:hover{background:rgba(244,63,94,.15)}

    /* Modal */
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px}
    .modal{background:var(--surface);border:1px solid var(--border);border-radius:16px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.6)}
    .modal-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--border)}
    .modal-title{font-family:'Syne',sans-serif;font-size:17px;font-weight:700}
    .modal-close{background:none;border:none;color:var(--muted);font-size:18px;cursor:pointer;padding:0}
    .modal-body{padding:20px 24px;display:flex;flex-direction:column;gap:0}
    .modal-footer{padding:16px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px}

    .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    @media(max-width:520px){.form-grid{grid-template-columns:1fr}}
    .field{display:flex;flex-direction:column;gap:6px}
    .field.full{grid-column:1/-1}
    .lbl{font-size:12px;font-weight:600;color:var(--muted);letter-spacing:.3px}
    .inp{background:var(--card);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;font-family:'Outfit',sans-serif;padding:9px 12px;outline:none;transition:border-color .2s}
    .inp:focus{border-color:rgba(167,139,250,.5);box-shadow:0 0 0 3px rgba(167,139,250,.1)}
    .inp:disabled{opacity:.5;cursor:not-allowed}

    .perfil-opts{display:flex;gap:8px;flex-wrap:wrap}
    .perfil-opt{display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:8px;border:1px solid var(--border);cursor:pointer;font-size:12.5px;transition:all .18s;color:var(--muted)}
    .perfil-opt:hover{border-color:rgba(167,139,250,.4);color:var(--text)}
    .perfil-opt.selected{background:rgba(167,139,250,.1);border-color:rgba(167,139,250,.4);color:#a78bfa}
    .perfil-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
    .check{margin-left:auto;font-size:11px;color:#a78bfa;font-weight:700}

    .alert-err{margin-top:14px;background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.25);color:#f43f5e;font-size:12.5px;padding:10px 14px;border-radius:8px}
    .alert-ok{margin-top:14px;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.25);color:#34d399;font-size:12.5px;padding:10px 14px;border-radius:8px}

    .btn-cancel{background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:8px;color:var(--muted);font-size:13px;font-family:'Outfit',sans-serif;padding:8px 18px;cursor:pointer}
    .btn-save{background:linear-gradient(135deg,#a78bfa,#38bdf8);border:none;border-radius:8px;color:white;font-size:13px;font-weight:600;font-family:'Outfit',sans-serif;padding:8px 20px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:opacity .2s}
    .btn-save:disabled{opacity:.5;cursor:not-allowed}
    .spin{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .7s linear infinite;display:inline-block}
    @keyframes spin{to{transform:rotate(360deg)}}

    .toast{position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:500;z-index:9999;animation:slideIn .3s ease;box-shadow:0 8px 24px rgba(0,0,0,.4)}
    @keyframes slideIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
    .toast-success{background:#14532d;border:1px solid #34d399;color:#34d399}
    .toast-error{background:#450a0a;border:1px solid #f43f5e;color:#f43f5e}
  `],
})
export class AdminUsuariosComponent implements OnInit {
  protected readonly usuariosService = inject(UsuariosService);

  readonly ROLE_INFO = ROLE_INFO;
  readonly perfisDisponiveis = PERFIS_MOCK;

  // State
  private readonly _usuarios = signal<Usuario[]>([]);
  readonly carregando = signal(false);
  readonly erroGeral = signal('');
  readonly modalAberto     = signal(false);
  readonly modalSenhaAberto= signal(false);
  readonly editando        = signal(false);
  readonly salvando        = signal(false);
  readonly erroForm        = signal('');
  readonly sucessoForm     = signal('');
  readonly toast           = signal('');
  readonly toastType       = signal<'success'|'error'>('success');
  readonly usuarioSenha    = signal<Usuario | null>(null);
  novaSenha = '';
  busca = ''; filtroRole = ''; filtroAtivo = '';

  form: UsuarioForm = this.emptyForm();

  readonly usuariosFiltrados = computed(() => {
    const b = this.busca.toLowerCase(); const r = this.filtroRole; const a = this.filtroAtivo;
    return (this._usuarios() ?? []).filter(u =>
      (!b || u.nome.toLowerCase().includes(b) || u.email.toLowerCase().includes(b)) &&
      (!r || u.role === r) &&
      (a === '' || String(u.ativo) === a)
    );
  });

  readonly stats = computed(() => [
    { label:'Total cadastros', num: this._usuarios().length,                              cor:'#a78bfa' },
    { label:'Ativos',          num: this._usuarios().filter(u => u.ativo).length,         cor:'#34d399' },
    { label:'Inativos',        num: this._usuarios().filter(u => !u.ativo).length,        cor:'#f43f5e' },
    { label:'Administradores', num: this._usuarios().filter(u => u.role === 'admin').length, cor:'#fb923c' },
  ]);

  ngOnInit() {
    this.carregarUsuarios();
  }

  carregarUsuarios() {
    this.carregando.set(true);
    this.erroGeral.set('');
    
    this.usuariosService.getUsuarios().subscribe({
      next: (response: any) => {
        this._usuarios.set(response.usuarios || []);
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar usuários:', err);
        this.erroGeral.set('Erro ao carregar usuários. Tente novamente.');
        this.carregando.set(false);
      }
    });
  }

  abrirModal() {
    this.form = this.emptyForm();
    this.editando.set(false);
    this.erroForm.set(''); this.sucessoForm.set('');
    this.modalAberto.set(true);
  }

  editarUsuario(u: Usuario) {
    this.form = { 
      id: u.id,
      username: u.username,
      nome: u.nome,
      email: u.email,
      telefone: u.telefone || '',
      password: '',
      role: u.role,
      perfil_id: u.perfil_id,
      ativo: u.ativo
    };
    this.editando.set(true);
    this.erroForm.set(''); this.sucessoForm.set('');
    this.modalAberto.set(true);
  }

  fecharModal() { this.modalAberto.set(false); }

  salvar() {
    if (!this.form.nome || !this.form.username || !this.form.email) {
      this.erroForm.set('Preencha os campos obrigatórios: nome, username e e-mail.');
      return;
    }
    if (!this.editando() && this.form.password.length < 8) {
      this.erroForm.set('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (!this.form.perfil_id) {
      this.erroForm.set('Selecione um perfil de permissões.');
      return;
    }

    this.salvando.set(true);
    this.erroForm.set('');

    if (this.editando()) {
      // Atualizar
      const updateData: UpdateUsuarioRequest = {
        nome: this.form.nome,
        email: this.form.email,
        telefone: this.form.telefone,
        role: this.form.role,
        perfil_id: this.form.perfil_id,
        ativo: this.form.ativo
      };

      this.usuariosService.atualizarUsuario(this.form.id, updateData).subscribe({
        next: (usuario) => {
          this._usuarios.update(list => 
            list.map(u => u.id === usuario.id ? usuario : u)
          );
          this.showToast('Usuário atualizado com sucesso!', 'success');
          this.salvando.set(false);
          this.fecharModal();
        },
        error: (err) => {
          console.error('Erro:', err);
          this.erroForm.set(err.error?.detail || 'Erro ao atualizar usuário');
          this.salvando.set(false);
        }
      });
    } else {
      // Criar
      const createData: CreateUsuarioRequest = {
        username: this.form.username,
        nome: this.form.nome,
        email: this.form.email,
        telefone: this.form.telefone,
        password: this.form.password,
        role: this.form.role,
        perfil_id: this.form.perfil_id
      };

      this.usuariosService.criarUsuario(createData).subscribe({
        next: (usuario) => {
          this._usuarios.update(list => [usuario, ...list]);
          this.showToast('Usuário criado com sucesso!', 'success');
          this.salvando.set(false);
          this.fecharModal();
        },
        error: (err) => {
          console.error('Erro:', err);
          this.erroForm.set(err.error?.detail || 'Erro ao criar usuário');
          this.salvando.set(false);
        }
      });
    }
  }

  toggleAtivo(u: Usuario) {
    if (u.role === 'admin') return;
    
    this.usuariosService.toggleAtivo(u.id, !u.ativo).subscribe({
      next: (usuarioAtualizado) => {
        this._usuarios.update(list => 
          list.map(x => x.id === u.id ? usuarioAtualizado : x)
        );
        this.showToast(u.ativo ? 'Usuário desativado.' : 'Usuário ativado!', 'success');
      },
      error: (err) => {
        console.error('Erro:', err);
        this.showToast('Erro ao atualizar status do usuário', 'error');
      }
    });
  }

  resetSenha(u: Usuario) {
    this.usuarioSenha.set(u);
    this.novaSenha = '';
    this.modalSenhaAberto.set(true);
  }

  confirmarResetSenha() {
    if (this.novaSenha.length < 8) {
      this.showToast('Senha muito curta (mínimo 8 caracteres)', 'error');
      return;
    }

    const usuario = this.usuarioSenha();
    if (!usuario) return;

    this.salvando.set(true);

    this.usuariosService.resetarSenha(usuario.id, this.novaSenha).subscribe({
      next: () => {
        this.showToast('Senha redefinida com sucesso!', 'success');
        this.modalSenhaAberto.set(false);
        this.salvando.set(false);
      },
      error: (err) => {
        console.error('Erro:', err);
        this.showToast(err.error?.detail || 'Erro ao resetar senha', 'error');
        this.salvando.set(false);
      }
    });
  }

  aplicarFiltro() { /* filtros são reativos via computed */ }

  private emptyForm(): UsuarioForm {
    return { id:'', username:'', nome:'', email:'', telefone:'', password:'', role:'operador', perfil_id:'perfil_operador', ativo:true };
  }

  initials(nome: string) { return nome.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase(); }
  
  avatarGrad(role: string) {
    const grads: Record<string, string> = {
      admin:'linear-gradient(135deg,#f43f5e,#fb923c)',
      gestor:'linear-gradient(135deg,#34d399,#38bdf8)',
      analista:'linear-gradient(135deg,#38bdf8,#a78bfa)',
      operador:'linear-gradient(135deg,#a78bfa,#7c3aed)',
    };
    return grads[role] ?? 'linear-gradient(135deg,#64748b,#475569)';
  }

  roleBg(role: string)     { return `rgba(${this.roleRgb(role)},.1)`; }
  roleBorder(role: string) { return `rgba(${this.roleRgb(role)},.25)`; }
  
  private roleRgb(role: string) {
    const m: Record<string,string> = { admin:'244,63,94', gestor:'52,211,153', analista:'56,189,248', operador:'251,146,60' };
    return m[role] ?? '100,116,139';
  }

  formatarDataAcesso(data: string | undefined): string {
    if (!data) return 'Nunca';
    try {
      const d = new Date(data);
      const agora = new Date();
      const diff = agora.getTime() - d.getTime();
      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (dias === 0) return 'Hoje';
      if (dias === 1) return 'Ontem';
      if (dias < 7) return `Há ${dias} dias`;
      return d.toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  }

  private showToast(msg: string, type: 'success'|'error') {
    this.toast.set(msg); this.toastType.set(type);
    setTimeout(() => this.toast.set(''), 3000);
  }
}