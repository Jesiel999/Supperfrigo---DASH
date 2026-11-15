import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type PreferenciaTema = 'claro' | 'escuro' | 'sistema';

const CHAVE = 'app-tema';

/** Paleta ESCURA. As 6 "legadas" só são aplicadas se o seu CSS NÃO as definir (o seu escuro continua o seu). */
const ESCURO: Record<string, string> = {
  '--bg': '#0b0f1a',
  '--surface': '#141922',
  '--card': '#111723',
  '--text': '#e5e7eb',
  '--text-primary': '#ffffff',
  '--text-secondary': '#94a3b8',
  '--muted': '#94a3b8',
  '--border': 'rgba(255,255,255,.08)',

  '--modal-bg': '#141922',
  '--modal-card': '#1a202c',
  '--text-strong': '#ffffff',
  '--border-strong': 'rgba(255,255,255,.14)',
  '--tint-1': 'rgba(255,255,255,.04)',
  '--tint-2': 'rgba(255,255,255,.06)',
  '--tint-3': 'rgba(255,255,255,.10)',
  '--backdrop': 'rgba(0,0,0,.6)',
  '--shadow-color': 'rgba(0,0,0,.45)',
  '--accent': '#f43f5e',
  '--accent-hover': '#e11d48',
  '--accent-soft': 'rgba(244,63,94,.14)',
  '--info': '#38bdf8',
  '--pos': '#34d399',
  '--neg': '#f43f5e',
  '--warn': '#fb923c',
  '--chart-grid': 'rgba(255,255,255,.06)',
  '--chart-zero': 'rgba(255,255,255,.18)',
  '--chart-axis': '#64748b',
  '--chart-dot-ring': '#0b0f1a',
  '--color-scheme': 'dark',
};

/** Paleta CLARA — aplicada sempre por cima de tudo. */
const CLARO: Record<string, string> = {
  '--bg': '#f4f6fa',
  '--surface': '#ffffff',
  '--card': '#ffffff',
  '--text': '#1e293b',
  '--text-primary': '#1e293b',
  '--text-secondary': '#64748b',
  '--muted': '#64748b',
  '--border': 'rgba(15,23,42,.10)',

  '--modal-bg': '#ffffff',
  '--modal-card': '#f1f5f9',
  '--text-strong': '#0f172a',
  '--border-strong': 'rgba(15,23,42,.18)',
  '--tint-1': 'rgba(15,23,42,.035)',
  '--tint-2': 'rgba(15,23,42,.06)',
  '--tint-3': 'rgba(15,23,42,.10)',
  '--backdrop': 'rgba(15,23,42,.45)',
  '--shadow-color': 'rgba(15,23,42,.18)',
  '--accent': '#e11d48',
  '--accent-hover': '#be123c',
  '--accent-soft': 'rgba(225,29,72,.10)',
  '--info': '#0284c7',
  '--pos': '#059669',
  '--neg': '#e11d48',
  '--warn': '#ea580c',
  '--chart-grid': 'rgba(15,23,42,.08)',
  '--chart-zero': 'rgba(15,23,42,.25)',
  '--chart-axis': '#64748b',
  '--chart-dot-ring': '#ffffff',
  '--color-scheme': 'light',
};

const LEGADAS = ['--bg', '--surface', '--card', '--text', '--muted', '--border'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly mql = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;

  /** Variáveis legadas que o CSS do app já define (medido ANTES de aplicar qualquer coisa). */
  private readonly legadasDoApp: ReadonlySet<string> = this._detectarLegadas();

  /** O que o usuário escolheu: claro, escuro ou "sistema" (segue o dispositivo). */
  readonly preferencia = signal<PreferenciaTema>(this._lerPreferencia());
  private readonly sistemaEscuro = signal<boolean>(this.mql?.matches ?? true);

  /** Tema realmente aplicado. */
  readonly tema = computed<'claro' | 'escuro'>(() => {
    const p = this.preferencia();
    if (p === 'sistema') return this.sistemaEscuro() ? 'escuro' : 'claro';
    return p;
  });

  constructor() {
    this.mql?.addEventListener('change', e => this.sistemaEscuro.set(e.matches));
    this._aplicar(this.tema());                 // síncrono: nenhum quadro com variáveis indefinidas
    effect(() => this._aplicar(this.tema()));   // e a cada troca
  }

  definir(p: PreferenciaTema): void {
    const html = this.doc.documentElement;
    html.classList.add('tema-transicao');
    this.preferencia.set(p);
    try { localStorage.setItem(CHAVE, p); } catch { /* storage indisponível: vale só nesta sessão */ }
    setTimeout(() => html.classList.remove('tema-transicao'), 300);
  }

  alternar(): void {
    this.definir(this.tema() === 'escuro' ? 'claro' : 'escuro');
  }

  private _aplicar(tema: 'claro' | 'escuro'): void {
    const html = this.doc.documentElement;
    const body = this.doc.body;
    const claro = tema === 'claro';

    html.setAttribute('data-theme', claro ? 'light' : 'dark');
    html.style.colorScheme = claro ? 'light' : 'dark';

    for (const [token, valor] of Object.entries(claro ? CLARO : ESCURO)) {
      if (!claro && this.legadasDoApp.has(token)) html.style.removeProperty(token); // escuro: vale o SEU valor
      else html.style.setProperty(token, valor);
    }

    // fundo e texto da página (vence um `body { background: #... }` fixo no tema claro)
    if (body) {
      if (claro) {
        body.style.backgroundColor = 'var(--bg)';
        body.style.color = 'var(--text)';
      } else {
        body.style.removeProperty('background-color');
        body.style.removeProperty('color');
      }
    }
  }

  private _detectarLegadas(): ReadonlySet<string> {
    if (typeof getComputedStyle !== 'function') return new Set();
    const cs = getComputedStyle(this.doc.documentElement);
    return new Set(LEGADAS.filter(t => cs.getPropertyValue(t).trim() !== ''));
  }

  private _lerPreferencia(): PreferenciaTema {
    try {
      const v = localStorage.getItem(CHAVE);
      if (v === 'claro' || v === 'escuro' || v === 'sistema') return v;
    } catch { /* ignore */ }
    return 'escuro'; // padrão = comportamento atual do sistema
  }
}