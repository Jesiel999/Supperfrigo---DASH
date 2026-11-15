import { Component, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { Serie, PontoGrafico } from '../../models/graficos.models';
import { ValueFormatterFactory } from '../../formaters/value-formaters';
import { ChartGeometry } from '../charts/chart-geometry';
import { LinePathBuilder } from '../charts/line-path-builder';
import { MultiSelectFilterComponent, FiltroOpcao } from '../multi-select-filter/pessoa_filter';

interface PontoHover {
  data: string;
  serieId: string;
  serieLabel: string;
  serieCor: string;
  valor: number;
  formatador: 'currency' | 'number' | 'percent';
}

@Component({
  selector: 'app-line-chart',
  imports: [CommonModule, MultiSelectFilterComponent],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  template: `
    <!-- Seletor de séries: só aparece quando o gráfico habilita [seletorSeries]="true" -->
    @if (seletorSeries()) {
      <div class="toolbar-series">
        <app-multi-select-filter
          [label]="rotuloSeletor()"
          icon="🔎"
          [opcoes]="opcoesSeletor()"
          [selecionados]="selecionadosNumeros()"
          [mostrarId]="false"
          [rotuloVazio]="'Top ' + limitePadrao() + ' automático'"
          (toggleId)="aoAlternarOpcao($event)"
          (toggleTodasEvt)="aoAlternarTodas()"
        />
        @if (excedeuLimite()) {
          <span class="nota-series">Mostrando {{ selecionadas().length }} de {{ selecionadosNumeros().size }} selecionadas (limite do gráfico)</span>
        }
      </div>
    }

    <!-- Legenda clicável: clique para remover/restaurar a série (só quando há mais de uma) -->
    @if (selecionadas().length > 1) {
      <div class="legend">
        @for (s of selecionadas(); track s.id) {
          <button
            type="button"
            class="legend-item"
            [class.off]="estaOculta(s.id)"
            [attr.aria-pressed]="!estaOculta(s.id)"
            [title]="estaOculta(s.id) ? 'Clique para exibir novamente' : 'Clique para remover do gráfico'"
            (click)="alternarSerie(s.id)"
          >
            <span class="legend-dot" [style.background]="s.cor"></span>
            {{ s.label }}
          </button>
        }
      </div>
    }

    <div class="chart-wrap">
      <svg
        class="chart-svg"
        [attr.viewBox]="viewBox"
        preserveAspectRatio="none"
        (mousemove)="onMouseMove($event)"
        (mouseleave)="onMouseLeave()"
      >
        @for (gridY of gridLines(); track $index) {
          <line [attr.x1]="paddingLeft" [attr.y1]="gridY.y"
                [attr.x2]="width - paddingRight" [attr.y2]="gridY.y"
                class="grid-line" stroke-width="1"/>
          <text [attr.x]="paddingLeft - 4" [attr.y]="gridY.y + 3"
                class="axis-text" font-size="9" font-family="JetBrains Mono"
                text-anchor="end">{{ gridY.label }}</text>
        }

        <!-- Linha do zero, destacada, só aparece quando há valores negativos -->
        @if (minVal() < 0) {
          <line [attr.x1]="paddingLeft" [attr.y1]="zeroY()"
                [attr.x2]="width - paddingRight" [attr.y2]="zeroY()"
                class="zero-line" stroke-width="1" stroke-dasharray="4,4"/>
        }

        <!-- Área preenchida só na primeira série VISÍVEL (a "principal") -->
        @if (visiveis()[0]; as principal) {
          <defs>
            <linearGradient [attr.id]="'area-' + principal.id" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" [attr.stop-color]="principal.cor" stop-opacity=".25"/>
              <stop offset="100%" [attr.stop-color]="principal.cor" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <path [attr.d]="areasPorSerie().get(principal.id)" [attr.fill]="'url(#area-' + principal.id + ')'"/>
        }

        <!-- Uma <path> por série visível; clicar na linha também a remove -->
        @for (s of visiveis(); track s.id) {
          <path
            [attr.d]="linhasPorSerie().get(s.id)"
            fill="none"
            [attr.stroke]="s.cor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          @if (selecionadas().length > 1) {
            <path
              class="hit"
              [attr.d]="linhasPorSerie().get(s.id)"
              fill="none"
              stroke="transparent"
              stroke-width="14"
              (click)="alternarSerie(s.id)"
            ><title>{{ s.label }} — clique para remover</title></path>
          }
        }

        @if (visiveis().length === 0) {
          <text [attr.x]="width / 2" [attr.y]="height / 2" class="axis-text" font-size="12"
                text-anchor="middle">Todas as séries foram removidas — clique na legenda para exibir</text>
        }

        @for (p of labelPoints(); track $index) {
          <text [attr.x]="p.x" [attr.y]="height - 4"
                class="axis-text" font-size="9" font-family="JetBrains Mono"
                text-anchor="middle">{{ p.label }}</text>
        }

        @if (hoverIndex() !== null) {
          @for (s of visiveis(); track s.id) {
            <circle
              [attr.cx]="getX(hoverIndex()!)"
              [attr.cy]="getY(s.pontos[hoverIndex()!]?.valor ?? 0)"
              r="4"
              [attr.fill]="s.cor"
              class="dot-ring"
              stroke-width="1.5"
              pointer-events="none"
            />
          }
        }
      </svg>
    </div>

    @if (hoverPontos().length) {
      <div class="tooltip" [class.tooltip--left]="tooltipSide() === 'left'"
          [style.left.px]="tooltip().x" [style.top.px]="tooltip().y">
        <div class="title">{{ formatarData(hoverData()) }}</div>
        @for (h of hoverPontos(); track h.serieId) {
          <div class="row">
            <span><span class="dot" [style.background]="h.serieCor"></span>{{ h.serieLabel }}</span>
            <b>{{ formatarValor(h.valor, h.formatador) }}</b>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .chart-wrap { position: relative; width: 100%; height: 200px; }
    .chart-svg  { width: 100%; height: 100%; overflow: visible; }
    .hit { cursor: pointer; pointer-events: stroke; }
    .toolbar-series { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
    .nota-series { font-size: 11px; color: var(--muted); }
    .grid-line { stroke: var(--chart-grid, rgba(255,255,255,.06)); }
    .zero-line { stroke: var(--chart-zero, rgba(255,255,255,.18)); }
    .axis-text { fill: var(--chart-axis, #64748b); }
    .dot-ring { stroke: var(--chart-dot-ring, #0b0f1a); }

    /* legenda fora da área do gráfico, quebra linha e é clicável */
    .legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-bottom: 10px; }
    .legend-item {
      display: inline-flex; align-items: center; gap: 6px; min-width: 0;
      font-size: 11px; color: var(--muted, #94a3b8); overflow-wrap: anywhere; text-align: left;
      background: transparent; border: 1px solid transparent; border-radius: 6px;
      padding: 2px 6px; cursor: pointer; font-family: inherit;
      transition: background .15s, opacity .15s;
    }
    .legend-item:hover { background: var(--tint-2); }
    .legend-item.off { opacity: .4; text-decoration: line-through; }
    .legend-dot  { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex-shrink: 0; }

    .tooltip {
      position: fixed;
      transform: translate(0, -50%);
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(255,255,255,0.08);
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 12px;
      backdrop-filter: blur(12px);
      z-index: 10000;
      pointer-events: none;
      min-width: 170px;
    }
    .tooltip--left { transform: translate(-100%, -50%); }
    .tooltip .title { font-weight: 700; margin-bottom: 6px; color: #f8fafc; }
    .tooltip .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 11px; color: #94a3b8; margin-top: 3px; }
    .tooltip .row .dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; margin-right: 5px; }
    .tooltip .row b { color: white; font-family: 'JetBrains Mono', monospace; }
  `],
})
export class LineChartComponent {
  readonly series = input.required<Serie[]>();

  /**
   * Habilita o seletor de séries (multi-select). Desligado por padrão: só os gráficos que
   * precisam escolher o que analisar ligam isso, ex.: <app-line-chart [series]="..." [seletorSeries]="true" />
   * Sem nada escolhido, mostra as `limitePadrao` maiores séries.
   */
  readonly seletorSeries = input<boolean>(false);
  readonly limitePadrao = input<number>(5);
  readonly rotuloSeletor = input<string>('Séries');
  /** true = a lista do seletor mostra "id | nome" (ex.: "3.3.1.01 | Aluguel"), como no filtro de pessoas. */
  readonly idNaOpcao = input<boolean>(false);

  private static readonly LIMITE_MAX = 12;

  private readonly idsEscolhidos = signal<ReadonlySet<string>>(new Set());

  /** Séries da maior para a menor (soma do valor absoluto). */
  private readonly ranqueadas = computed((): Serie[] => {
    const total = (s: Serie) => s.pontos.reduce((a, p) => a + Math.abs(p.valor), 0);
    return [...this.series()].sort((a, b) => total(b) - total(a));
  });

  /** O multi-select trabalha com id numérico: usamos a posição no ranking (1, 2, 3…). */
  protected readonly opcoesSeletor = computed((): FiltroOpcao[] =>
    this.ranqueadas().map((s, i) => ({ id: i + 1, nome: this.idNaOpcao() ? `${s.id} | ${s.label}` : s.label }))
  );

  protected readonly selecionadosNumeros = computed(() => {
    const escolhidos = this.idsEscolhidos();
    const ids = new Set<number>();
    this.ranqueadas().forEach((s, i) => { if (escolhidos.has(s.id)) ids.add(i + 1); });
    return ids;
  });

  /** Séries que o gráfico mostra (antes dos cliques de "remover"). */
  protected readonly selecionadas = computed((): Serie[] => {
    if (!this.seletorSeries()) return this.series();
    const escolhidos = this.idsEscolhidos();
    if (escolhidos.size === 0) return this.ranqueadas().slice(0, this.limitePadrao());
    return this.ranqueadas().filter(s => escolhidos.has(s.id)).slice(0, LineChartComponent.LIMITE_MAX);
  });

  protected readonly excedeuLimite = computed(() =>
    this.seletorSeries() && this.selecionadosNumeros().size > LineChartComponent.LIMITE_MAX
  );

  protected aoAlternarOpcao(id: number): void {
    const serie = this.ranqueadas()[id - 1];
    if (!serie) return;
    const nova = new Set(this.idsEscolhidos());
    nova.has(serie.id) ? nova.delete(serie.id) : nova.add(serie.id);
    this.idsEscolhidos.set(nova);
  }

  /** Mesmo padrão do filtro de pessoas: todas marcadas → limpa; senão marca todas. */
  protected aoAlternarTodas(): void {
    const todas = this.ranqueadas();
    const atual = this.idsEscolhidos();
    this.idsEscolhidos.set(atual.size > 0 && atual.size === todas.length ? new Set() : new Set(todas.map(s => s.id)));
  }

  protected readonly width         = 1200;
  protected readonly height        = 200;
  protected readonly paddingLeft   = 42;
  protected readonly paddingRight  = 10;
  protected readonly paddingTop    = 10;
  protected readonly paddingBottom = 20;
  protected readonly viewBox = `0 0 ${this.width} ${this.height}`;

  private readonly geometry = new ChartGeometry(
    this.width, this.height, this.paddingLeft, this.paddingRight, this.paddingTop, this.paddingBottom,
  );
  private readonly pathBuilder = new LinePathBuilder(this.geometry);

  // ─── Séries removidas pelo usuário (clique na legenda ou na linha) ───
  protected readonly ocultas = signal<ReadonlySet<string>>(new Set());

  protected readonly visiveis = computed(() =>
    this.selecionadas().filter(s => !this.ocultas().has(s.id))
  );

  protected estaOculta(id: string): boolean {
    return this.ocultas().has(id);
  }

  /** Remove a série do gráfico (ou a restaura, se já estava removida). */
  protected alternarSerie(id: string): void {
    if (this.selecionadas().length < 2) return; // com uma só série não há como restaurar
    const nova = new Set(this.ocultas());
    nova.has(id) ? nova.delete(id) : nova.add(id);
    this.ocultas.set(nova);
    this.hoverIndex.set(null);
  }

  // ─── Escala cobre [min, max] das séries VISÍVEIS (remover uma série reescala o gráfico) ───
  private readonly faixa = computed(() => {
    const todos = this.visiveis().flatMap(s => s.pontos.map(p => p.valor));
    const min = Math.min(...todos, 0);
    let max = Math.max(...todos, 0);
    if (max === min) max = min + 1; // evita divisão por zero na escala
    return { min, max };
  });

  protected readonly minVal = computed(() => this.faixa().min);
  protected readonly maxVal = computed(() => this.faixa().max);

  protected readonly zeroY = computed(() =>
    this.geometry.toY(0, this.minVal(), this.maxVal())
  );

  protected readonly gridLines = computed(() => {
    const steps = [0, 0.33, 0.66, 1];
    const min = this.minVal();
    const max = this.maxVal();
    return steps.map(s => {
      const valor = min + (max - min) * s;
      return {
        y: this.geometry.toY(valor, min, max),
        label: Math.round(valor) === 0 ? '0' : Math.round(valor / 1000) + 'K',
      };
    });
  });

  protected readonly linhasPorSerie = computed(() => {
    const min = this.minVal();
    const max = this.maxVal();
    const mapa = new Map<string, string>();
    this.visiveis().forEach(s => mapa.set(s.id, this.pathBuilder.buildLine(s.pontos, min, max)));
    return mapa;
  });

  protected readonly areasPorSerie = computed(() => {
    const min = this.minVal();
    const max = this.maxVal();
    const mapa = new Map<string, string>();
    this.visiveis().forEach(s => mapa.set(s.id, this.pathBuilder.buildArea(s.pontos, min, max)));
    return mapa;
  });

  // O eixo X usa sempre a 1ª série (mesmos pontos em todas), independente de estar visível
  protected readonly labelPoints = computed(() => {
    const principal = this.series()[0];
    if (!principal) return [];
    const pts = principal.pontos;
    const step = Math.ceil(pts.length / 7);
    return pts
      .filter((_, i) => i % step === 0 || i === pts.length - 1)
      .map((p) => {
        const i = pts.indexOf(p);
        return { x: this.geometry.toX(i, pts.length), label: p.data };
      });
  });

  protected getX(index: number): number {
    const total = this.series()[0]?.pontos.length ?? 0;
    return this.geometry.toX(index, total);
  }
  protected getY(value: number): number {
    return this.geometry.toY(value, this.minVal(), this.maxVal());
  }

  readonly hoverIndex = signal<number | null>(null);
  readonly tooltip = signal({ x: 0, y: 0 });
  readonly tooltipSide = signal<'left' | 'right'>('right');

  protected readonly hoverData = computed(() => {
    const idx = this.hoverIndex();
    if (idx === null) return '';
    return this.series()[0]?.pontos[idx]?.data ?? '';
  });

  protected readonly hoverPontos = computed((): PontoHover[] => {
    const idx = this.hoverIndex();
    if (idx === null) return [];
    return this.visiveis().map(s => ({
      data: s.pontos[idx]?.data ?? '',
      serieId: s.id,
      serieLabel: s.label,
      serieCor: s.cor,
      valor: s.pontos[idx]?.valor ?? 0,
      formatador: s.formatador,
    }));
  });

  onMouseMove(event: MouseEvent) {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;

    const total = this.series()[0]?.pontos.length ?? 0;
    if (!total) return;

    const scaleX = rect.width / this.width;
    const chartWidth = this.width - this.paddingLeft - this.paddingRight;
    const relativeX = (x / scaleX) - this.paddingLeft;
    const ratio = relativeX / chartWidth;
    const rawIndex = ratio * (total - 1);

    const left = Math.floor(rawIndex);
    const right = Math.ceil(rawIndex);
    const index = (rawIndex - left < right - rawIndex) ? left : right;
    this.hoverIndex.set(Math.max(0, Math.min(index, total - 1)));

    const TOOLTIP_W = 190;
    const TOOLTIP_H = 30 + this.visiveis().length * 22;
    const OFFSET = 16;
    const MARGEM = 8;

    const cursorX = event.clientX;
    const cursorY = event.clientY;

    const cabeADireita = cursorX + OFFSET + TOOLTIP_W + MARGEM <= window.innerWidth;
    this.tooltipSide.set(cabeADireita ? 'right' : 'left');
    const tooltipX = cabeADireita ? cursorX + OFFSET : cursorX - OFFSET;

    let tooltipY = cursorY;
    const metade = TOOLTIP_H / 2;
    if (tooltipY - metade < MARGEM) tooltipY = metade + MARGEM;
    else if (tooltipY + metade > window.innerHeight - MARGEM) tooltipY = window.innerHeight - metade - MARGEM;

    this.tooltip.set({ x: tooltipX, y: tooltipY });
  }

  onMouseLeave() {
    this.hoverIndex.set(null);
  }

  formatarData(data: string): string {
    if (!data || !data.includes('-')) return data;
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  protected formatarValor(valor: number, formatador: 'currency' | 'number' | 'percent'): string {
    return ValueFormatterFactory.get(formatador).format(valor);
  }
}