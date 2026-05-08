import { useState, useRef } from 'react';
import { PelasIcon } from '../icons';
import { T } from '../theme';
import { Card, SectionTitle, TxRow, Progress, Sparkline, CreditCard, Donut } from '../components';
import {
  PELAS_ACCOUNTS, PELAS_CARDS, PELAS_TRANSACTIONS, PELAS_CATEGORIES,
  PELAS_SERIES_30D, PELAS_BUDGETS, PELAS_GOALS, PELAS_HOLDINGS, PELAS_USER,
  PELAS_INCOME_CATEGORIES,
} from '../data';

const CARD_COLORS = [
  { id: 'mesh-blue',   label: 'Azul',    bg: 'linear-gradient(135deg,#1E3FFF,#001A66)' },
  { id: 'mesh-night',  label: 'Noche',   bg: 'linear-gradient(135deg,#2E2E5F,#0E0E1A)' },
  { id: 'mesh-purple', label: 'Morado',  bg: 'linear-gradient(135deg,#9B5CFF,#2D1066)' },
  { id: 'mesh-gold',   label: 'Oro',     bg: 'linear-gradient(135deg,#C9A227,#4A3800)' },
  { id: 'mesh-green',  label: 'Verde',   bg: 'linear-gradient(135deg,#1DBF7B,#054830)' },
  { id: 'mesh-rose',   label: 'Rosa',    bg: 'linear-gradient(135deg,#FF5A7E,#7A0028)' },
];

const fmtEUR = (n, hide) =>
  hide ? '••••••' : n.toLocaleString('es-ES', { minimumFractionDigits: 2 }) + ' €';

const CURRENCIES = [
  { id: 'EUR', symbol: '€',   label: 'Euro',          locale: 'es-ES', decimals: 2 },
  { id: 'USD', symbol: '$',   label: 'Dólar',         locale: 'en-US', decimals: 2 },
  { id: 'GBP', symbol: '£',   label: 'Libra',         locale: 'en-GB', decimals: 2 },
  { id: 'CHF', symbol: 'Fr',  label: 'Franco suizo',  locale: 'de-CH', decimals: 2 },
  { id: 'JPY', symbol: '¥',   label: 'Yen',           locale: 'ja-JP', decimals: 0 },
  { id: 'MXN', symbol: 'MX$', label: 'Peso mexicano', locale: 'es-MX', decimals: 2 },
  { id: 'BRL', symbol: 'R$',  label: 'Real',          locale: 'pt-BR', decimals: 2 },
  { id: 'AED', symbol: 'AED', label: 'Dírham',        locale: 'ar-AE', decimals: 2 },
];

const fmtAmount = (n, hide, currencyId = 'EUR') => {
  if (hide) return '••••••';
  const cur = CURRENCIES.find(c => c.id === currencyId) || CURRENCIES[0];
  return n.toLocaleString('es-ES', { minimumFractionDigits: cur.decimals, maximumFractionDigits: cur.decimals }) + ' ' + cur.symbol;
};

// ── Drag handle icon ─────────────────────────────────────────────────────────
const GripIcon = ({ color }) => (
  <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
    <rect y="0" width="16" height="2" rx="1" fill={color}/>
    <rect y="6" width="16" height="2" rx="1" fill={color}/>
    <rect y="12" width="16" height="2" rx="1" fill={color}/>
  </svg>
);

// ── Toggle pill ──────────────────────────────────────────────────────────────
const Toggle = ({ on, color = '#0066FF', onChange }) => (
  <div onClick={onChange} style={{
    width: 40, height: 22, borderRadius: 11, position: 'relative',
    background: on ? color : '#44445A',
    transition: 'background 0.18s', cursor: 'pointer', flexShrink: 0,
  }}>
    <div style={{
      position: 'absolute', top: 3, left: on ? 21 : 3,
      width: 16, height: 16, borderRadius: 8,
      background: '#fff', transition: 'left 0.18s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
    }}/>
  </div>
);

// ── Default widget config ────────────────────────────────────────────────────
// tabletCol: 'full' = ambas columnas · 'left' = col izquierda · 'right' = col derecha
const DEFAULT_WIDGETS = [
  { id: 'balance',          label: 'Visión global',               icon: 'chart',    enabled: true, tabletCol: 'full'  },
  { id: 'accounts',         label: 'Carrusel de cuentas',         icon: 'wallet',   enabled: true, tabletCol: 'full'  },
  { id: 'transactions',     label: 'Movimientos recientes',       icon: 'card',     enabled: true, tabletCol: 'right' },
  { id: 'cards',            label: 'Mis tarjetas',                icon: 'card',     enabled: true, tabletCol: 'left'  },
  { id: 'budget-bar',       label: 'Barra de presupuesto',        icon: 'goal',     enabled: true, tabletCol: 'left'  },
  { id: 'budgets',          label: 'Presupuestos detallados',     icon: 'goal',     enabled: true, tabletCol: 'right' },
  { id: 'donut-both',       label: 'Gastos e ingresos combinado', icon: 'chart',    enabled: true, tabletCol: 'full'  },
  { id: 'shared-accounts',  label: 'Cuentas compartidas',         icon: 'people',   enabled: true, tabletCol: 'full'  },
  { id: 'goals',            label: 'Objetivos de ahorro',         icon: 'shield',   enabled: true, tabletCol: 'full'  },
];

const DEFAULT_WIDGET_SETTINGS = {
  balance:      { accounts: ['a1','a2','a3','a4'], includeInvestments: false, chartPeriod: '30d', currency: 'EUR' },
  accounts:     { order: ['a1','a2','a3','a4'], hidden: [] },
  transactions: { count: 4 },
  cards:        { order: ['c1','c2'], hidden: [] },
  'budget-bar': { mode: 'simple' },
  budgets:      { order: ['b1','b2','b3','b4'], hidden: [] },
  'donut-both': { period: 'month' },
  goals:        { order: ['g1','g2','g3'], hidden: [] },
};

const WIDGETS_WITH_SETTINGS = [
  'balance','accounts','transactions','cards',
  'budget-bar','budgets','donut-both','goals',
];

// ── Individual widget renderers ───────────────────────────────────────────────

// ── Fullscreen landscape chart overlay ───────────────────────────────────────

const PERIOD_OPTIONS = [
  { id: '7d', short: '7D', label: 'Última semana' },
  { id: '30d', short: '1M', label: 'Último mes' },
  { id: '90d', short: '3M', label: 'Últimos 3 meses' },
  { id: '1y',  short: '1A', label: 'Último año' },
];

const X_LABELS = {
  '7d':  ['L','M','X','J','V','S','D'],
  '30d': ['1 abr','8 abr','15 abr','22 abr','30 abr'],
  '90d': ['Ene','Feb','Mar','Abr'],
  '1y':  ['Ene','Mar','May','Jul','Sep','Nov','Dic'],
};

const buildChartData = (period) => {
  if (period === '7d')  return PELAS_SERIES_30D.slice(-7);
  if (period === '90d') return [...PELAS_SERIES_30D, ...PELAS_SERIES_30D.map(v => v * 1.015)];
  if (period === '1y')  return [
    ...PELAS_SERIES_30D.map(v => v * 0.88),
    ...PELAS_SERIES_30D.map(v => v * 0.93),
    ...PELAS_SERIES_30D.map(v => v * 0.97),
    ...PELAS_SERIES_30D,
  ];
  return PELAS_SERIES_30D;
};

const ChartFullscreenOverlay = ({ theme, settings, onClose }) => {
  const t = T(theme);
  const [period, setPeriod]     = useState(settings.chartPeriod || '30d');
  const [accs, setAccs]         = useState(settings.accounts || ['a1','a2','a3','a4']);
  const [inclInv, setInclInv]   = useState(settings.includeInvestments || false);
  const [showFilters, setShowFilters] = useState(false);

  const currency = settings.currency || 'EUR';
  const cur = CURRENCIES.find(c => c.id === currency) || CURRENCIES[0];

  const chartData = buildChartData(period);
  const minV = Math.min(...chartData);
  const maxV = Math.max(...chartData);
  const midV = (minV + maxV) / 2;

  const included = PELAS_ACCOUNTS.filter(a => accs.includes(a.id));
  const total = included.reduce((s, a) => s + a.balance, 0)
    + (inclInv ? PELAS_HOLDINGS.reduce((s, h) => s + h.value, 0) : 0);

  const periodLabel = PERIOD_OPTIONS.find(p => p.id === period)?.label || '';

  const fmt = (v) => (v / 1000).toFixed(1) + 'k ' + cur.symbol;

  // The overlay lives inside the Home content area, below status and above tabbar.
  // Keep the rotated width within that available height so the chart ends are not clipped.
  const CW = 650, CH = 360;
  // Chart occupies width minus left padding, Y-labels col, gap, and right padding
  const CHART_W = CW - 42 - 50 - 8 - 30;
  const CHART_H = CH - 76 - 24;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: t.bg, overflow: 'hidden' }}>

      {/* ── Landscape content ── */}
      <div style={{
        position: 'absolute',
        width: CW, height: CH,
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%) rotate(90deg)',
        background: t.bg,
        display: 'flex', flexDirection: 'column',
        boxSizing: 'border-box',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px 8px', flexShrink: 0 }}>
          <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 17, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <PelasIcon name="x" size={15} color={t.text2}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: t.text2, marginBottom: 2 }}>Evolución del saldo · {periodLabel}</div>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.6 }}>
              {fmtAmount(total, false, currency)}
            </div>
          </div>
          {/* Period chips */}
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            {PERIOD_OPTIONS.map(p => (
              <div key={p.id} onClick={() => setPeriod(p.id)} style={{
                padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: period === p.id ? t.accent : t.surface2,
                color: period === p.id ? '#fff' : t.text2,
                transition: 'all 0.15s',
              }}>{p.short}</div>
            ))}
          </div>
          {/* Filter icon */}
          <div onClick={() => setShowFilters(true)} style={{ width: 34, height: 34, borderRadius: 17, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <PelasIcon name="filter" size={15} color={t.text2}/>
          </div>
        </div>

        {/* Chart area */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', padding: '0 18px 12px', gap: 8 }}>
          {/* Y-axis labels */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 50, paddingBottom: 18, flexShrink: 0 }}>
            {[maxV, midV, minV].map((v, i) => (
              <div key={i} style={{ fontSize: 9, color: t.text3, textAlign: 'right' }}>{fmt(v)}</div>
            ))}
          </div>
          {/* Chart + X-axis */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible', padding: '0 8px' }}>
              <Sparkline data={chartData} width={CHART_W} height={CHART_H} color={t.accent}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, padding: '0 8px 0 10px' }}>
              {X_LABELS[period].map((l, i) => (
                <div key={i} style={{ fontSize: 9, color: t.text3 }}>{l}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter sheet (portrait-orientation, slides up from bottom) ── */}
      {showFilters && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 61, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={() => setShowFilters(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', maxHeight: '82%', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease-out' }}>
            <div style={{ padding: '14px 22px 0', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 14px' }}/>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>Filtros del gráfico</div>
                <div onClick={() => setShowFilters(false)} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <PelasIcon name="x" size={15} color={t.text2}/>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px' }}>
              {/* Período */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Período</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {PERIOD_OPTIONS.map(p => (
                    <div key={p.id} onClick={() => setPeriod(p.id)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer', textAlign: 'center', fontSize: 12.5, fontWeight: 500, background: period === p.id ? t.accent : t.surface2, color: period === p.id ? '#fff' : t.text2, transition: 'all 0.15s' }}>
                      {p.label}
                    </div>
                  ))}
                </div>
              </div>
              {/* Cuentas */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Cuentas incluidas</div>
                {PELAS_ACCOUNTS.map(a => {
                  const on = accs.includes(a.id);
                  return (
                    <div key={a.id} onClick={() => setAccs(prev => on ? prev.filter(x => x !== a.id) : [...prev, a.id])} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 14, marginBottom: 6, background: on ? a.color + '14' : t.surface2, border: `1px solid ${on ? a.color : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: a.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PelasIcon name={a.icon} size={14} color={a.color}/>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: t.text2 }}>{a.bank}</div>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: on ? a.color : 'transparent', border: `1.5px solid ${on ? a.color : t.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {on && <PelasIcon name="check" size={11} color="#fff" strokeWidth={3}/>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Incluir inversiones */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderRadius: 14, background: t.surface }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>Incluir inversiones</div>
                  <div style={{ fontSize: 11, color: t.text2, marginTop: 2 }}>Suma el valor de la cartera al saldo total</div>
                </div>
                <Toggle on={inclInv} color={t.accent} onChange={() => setInclInv(v => !v)}/>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WidgetBalance = ({ theme, hideBalance, setHideBalance, onNavigate, settings = DEFAULT_WIDGET_SETTINGS.balance }) => {
  const t = T(theme);
  const [showChart, setShowChart] = useState(false);
  const included = PELAS_ACCOUNTS.filter(a => settings.accounts.includes(a.id));
  const total = included.reduce((s, a) => s + a.balance, 0)
    + (settings.includeInvestments ? PELAS_HOLDINGS.reduce((s, h) => s + h.value, 0) : 0);
  const chartData = settings.chartPeriod === '7d' ? PELAS_SERIES_30D.slice(-7) :
                    settings.chartPeriod === '90d' ? [...PELAS_SERIES_30D, ...PELAS_SERIES_30D, ...PELAS_SERIES_30D] :
                    PELAS_SERIES_30D;
  const periodLabel = { '7d': 'Esta semana', '30d': 'Últimos 30 días', '90d': 'Últimos 90 días' }[settings.chartPeriod] || 'Abril';
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 12, color: t.text2 }}>Saldo total · {periodLabel}</div>
        <div onClick={() => setHideBalance(v => !v)} style={{ cursor: 'pointer' }}>
          <PelasIcon name={hideBalance ? 'eye-off' : 'eye'} size={14} color={t.text2}/>
        </div>
      </div>
      <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: -1.2 }}>
        {fmtAmount(total, hideBalance, settings.currency)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 12 }}>
        <div style={{ background: 'rgba(63,185,132,0.16)', color: t.positive, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>+12,4%</div>
        <div style={{ fontSize: 11, color: t.text2 }}>vs mes anterior</div>
      </div>
      {/* Chart — tap to open fullscreen */}
      <div onClick={() => setShowChart(true)} style={{ marginLeft: -10, marginBottom: 14, cursor: 'pointer', position: 'relative' }}>
        <Sparkline data={chartData} width={settings.chartPeriod === '7d' ? 200 : 356} height={70} color={t.accent}/>
        <div style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 8, background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PelasIcon name="up" size={11} color={t.text2}/>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {/* Ingresos — tap to go to movements */}
        <Card theme={theme} padding={14} radius={16} style={{ flex: 1, cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('history')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: 'rgba(63,185,132,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PelasIcon name="arrow-down" size={12} color={t.positive} strokeWidth={2.4}/>
            </div>
            <div style={{ fontSize: 11, color: t.text2 }}>Ingresos</div>
          </div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{fmtAmount(3120, hideBalance, settings.currency)}</div>
        </Card>
        {/* Gastos — tap to go to movements */}
        <Card theme={theme} padding={14} radius={16} style={{ flex: 1, cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('history')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: 'rgba(225,99,100,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PelasIcon name="arrow-up" size={12} color={t.negative} strokeWidth={2.4}/>
            </div>
            <div style={{ fontSize: 11, color: t.text2 }}>Gastos</div>
          </div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{fmtAmount(1842.58, hideBalance, settings.currency)}</div>
        </Card>
      </div>
      {showChart && (
        <ChartFullscreenOverlay theme={theme} settings={settings} onClose={() => setShowChart(false)}/>
      )}
    </div>
  );
};

const WidgetAccounts = ({ theme, hideBalance, onNavigate, settings = DEFAULT_WIDGET_SETTINGS.accounts }) => {
  const t = T(theme);
  const visibleAccounts = settings.order
    .map(id => PELAS_ACCOUNTS.find(a => a.id === id))
    .filter(a => a && !settings.hidden.includes(a.id));
  return (
    <div style={{ marginBottom: 22 }}>
      <SectionTitle theme={theme} title="Mis cuentas" action="Gestionar" onAction={() => onNavigate('accounts')}/>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginRight: -22, paddingRight: 22 }}>
        {visibleAccounts.map(a => (
          <Card key={a.id} theme={theme} padding={14} radius={16} style={{ minWidth: 150, flexShrink: 0, cursor: 'pointer' }}
            onClick={() => onNavigate('account-detail', { account: { ...a, currency: 'EUR', shared: false, sharedWith: [] } })}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: a.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PelasIcon name={a.icon} size={15} color={a.color}/>
              </div>
              {a.type === 'cash'
                ? <div style={{ fontSize: 9.5, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Efectivo</div>
                : <div style={{ width: 4, height: 4, borderRadius: 2, background: t.positive }}/>}
            </div>
            <div style={{ fontSize: 12, color: t.text2 }}>{a.name}</div>
            <div style={{ fontSize: 10.5, color: t.text3, marginBottom: 6 }}>{a.bank}</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{fmtEUR(a.balance, hideBalance)}</div>
          </Card>
        ))}

      </div>
    </div>
  );
};

const WidgetTransactions = ({ theme, onNavigate, settings = DEFAULT_WIDGET_SETTINGS.transactions }) => (
  <div style={{ marginBottom: 22 }}>
    <SectionTitle theme={theme} title="Movimientos" action="Ver todo" onAction={() => onNavigate('history')}/>
    {PELAS_TRANSACTIONS.slice(0, settings.count).map(tx => {
      const cat = PELAS_CATEGORIES.find(c => c.id === tx.cat);
      return <TxRow key={tx.id} theme={theme} tx={tx} cat={cat} onClick={() => onNavigate('tx-detail', { tx })}/>;
    })}
  </div>
);

const WidgetBudgets = ({ theme, onNavigate, settings = DEFAULT_WIDGET_SETTINGS.budgets }) => {
  const t = T(theme);
  const visible = settings.order
    .map(id => PELAS_BUDGETS.find(b => b.id === id))
    .filter(b => b && !settings.hidden.includes(b.id));
  return (
    <div style={{ marginBottom: 22 }}>
      <SectionTitle theme={theme} title="Presupuestos" action="Editar" onAction={() => onNavigate('budgets')}/>
      <Card theme={theme} padding={16} radius={18}>
        {visible.map((b, i) => {
          const pct = (b.spent / b.budget) * 100;
          const danger = pct > 90;
          return (
            <div key={b.id} style={{ padding: '10px 0', borderBottom: i < visible.length - 1 ? `1px solid ${t.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{b.label}</div>
                <div style={{ fontSize: 11.5, color: t.text2 }}>
                  <span style={{ color: danger ? t.negative : t.text, fontWeight: 600 }}>{b.spent} €</span> / {b.budget} €
                </div>
              </div>
              <Progress value={pct} color={danger ? t.negative : b.color} track={t.surface2} height={5}/>
            </div>
          );
        })}
      </Card>
    </div>
  );
};


const WidgetGoals = ({ theme, onNavigate, settings = DEFAULT_WIDGET_SETTINGS.goals }) => {
  const t = T(theme);
  const visible = settings.order
    .map(id => PELAS_GOALS.find(g => g.id === id))
    .filter(g => g && !settings.hidden.includes(g.id));
  return (
    <div style={{ marginBottom: 22 }}>
      <SectionTitle theme={theme} title="Mis metas" action="Ver todo" onAction={() => onNavigate('goals')}/>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginRight: -22, paddingRight: 22 }}>
        {visible.map(g => {
          const pct = Math.round((g.saved / g.target) * 100);
          return (
            <Card key={g.id} theme={theme} padding={14} radius={18} style={{ minWidth: 180, flexShrink: 0, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: g.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PelasIcon name={g.icon} size={16} color={g.color}/>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: g.color }}>{pct}%</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{g.label}</div>
              <div style={{ fontSize: 10.5, color: t.text3, marginBottom: 8 }}>{g.due}</div>
              <Progress value={pct} color={g.color} track={t.surface2} height={4}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10.5, color: t.text2 }}>
                <span>{g.saved} €</span><span>{g.target} €</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};


// ── Widget: Barra de presupuesto mensual ─────────────────────────────────────

// ── Widget: Cuentas compartidas ───────────────────────────────────────────────

const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', JPY: '¥', CAD: 'CA$', AUD: 'A$' };

const WidgetSharedAccounts = ({ theme, onNavigate, familyGroup }) => {
  const t = T(theme);
  const sharedAccounts = PELAS_ACCOUNTS.filter(a => a.shared);
  const hasGroup = !!familyGroup?.group;
  const groupName = familyGroup?.group?.name || '';
  const groupMembers = familyGroup?.members ?? [];

  const allAvatars = groupMembers.slice(0, 4);

  const MemberDots = ({ count = 3 }) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {allAvatars.slice(0, count).map((m, i) => (
        <div key={m.id} style={{ width: 22, height: 22, borderRadius: 11, background: m.id === 'u0' ? 'linear-gradient(135deg,#0066FF,#7C5CFF)' : (m.color || '#7C5CFF'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontWeight: 700, border: `1.5px solid ${t.surface}`, marginLeft: i > 0 ? -6 : 0, zIndex: count - i, flexShrink: 0 }}>
          {m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
      ))}
      {groupMembers.length > count && (
        <div style={{ width: 22, height: 22, borderRadius: 11, background: t.surface2, border: `1.5px solid ${t.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: t.text2, marginLeft: -6, flexShrink: 0 }}>
          +{groupMembers.length - count}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ marginBottom: 22 }}>
      <SectionTitle theme={theme} title="Cuentas compartidas" action="Ver todo" onAction={() => onNavigate('accounts')}/>

      {/* Sin grupo familiar */}
      {!hasGroup ? (
        <Card theme={theme} padding={20} radius={20}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PelasIcon name="people" size={22} color={t.text2}/>
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text, marginBottom: 4 }}>Sin grupo familiar</div>
              <div style={{ fontSize: 12, color: t.text2, lineHeight: 1.5 }}>Crea un grupo familiar en tu perfil para ver las cuentas compartidas aquí</div>
            </div>
            <div onClick={() => onNavigate('profile')} style={{ fontSize: 12.5, fontWeight: 600, color: t.accent, cursor: 'pointer' }}>
              Ir al perfil →
            </div>
          </div>
        </Card>

      ) : sharedAccounts.length === 0 ? (
        /* Grupo existe pero sin cuentas compartidas */
        <Card theme={theme} padding={20} radius={20}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: t.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PelasIcon name="card" size={22} color={t.accent}/>
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text, marginBottom: 4 }}>Ninguna cuenta compartida</div>
              <div style={{ fontSize: 12, color: t.text2, lineHeight: 1.5 }}>Marca una cuenta como compartida desde la sección de Cuentas</div>
            </div>
            <div onClick={() => onNavigate('accounts')} style={{ fontSize: 12.5, fontWeight: 600, color: t.accent, cursor: 'pointer' }}>
              Ir a Cuentas →
            </div>
          </div>
        </Card>

      ) : (
        /* Cuentas compartidas */
        <>
          {/* Cabecera del grupo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 14, background: t.accentSoft, marginBottom: 10 }}>
            <MemberDots count={4}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: t.accent, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{groupName}</div>
              <div style={{ fontSize: 11, color: t.text2, marginTop: 1 }}>
                {groupMembers.length} miembro{groupMembers.length !== 1 ? 's' : ''} · {sharedAccounts.length} cuenta{sharedAccounts.length !== 1 ? 's' : ''} compartida{sharedAccounts.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Lista de cuentas */}
          <Card theme={theme} padding={0} radius={20}>
            {sharedAccounts.map((acc, i) => {
              const sym = CURRENCY_SYMBOLS[acc.currency] || acc.currency;
              const balanceStr = `${acc.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })} ${sym}`;
              const sharedPeople = hasGroup ? groupMembers : acc.sharedWith;
              return (
                <div key={acc.id} onClick={() => onNavigate('accounts')} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: i < sharedAccounts.length - 1 ? `1px solid ${t.border}` : 'none', cursor: 'pointer' }}>
                  {/* Icon */}
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: acc.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PelasIcon name={acc.icon} size={20} color={acc.color}/>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</div>
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3, background: acc.color + '18', padding: '2px 6px', borderRadius: 6 }}>
                        <PelasIcon name="people" size={9} color={acc.color}/>
                        <span style={{ fontSize: 9.5, color: acc.color, fontWeight: 700 }}>FAMILIA</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11.5, color: t.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.bank}</div>
                  </div>
                  {/* Balance + avatars */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{balanceStr}</div>
                    {groupMembers.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {groupMembers.slice(0, 3).map((m, mi) => (
                          <div key={m.id} style={{ width: 18, height: 18, borderRadius: 9, background: m.id === 'u0' ? 'linear-gradient(135deg,#0066FF,#7C5CFF)' : (m.color || '#7C5CFF'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 7, fontWeight: 700, border: `1.5px solid ${t.surface}`, marginLeft: mi > 0 ? -5 : 0, zIndex: 3 - mi, flexShrink: 0 }}>
                            {m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                        ))}
                        {groupMembers.length > 3 && (
                          <div style={{ width: 18, height: 18, borderRadius: 9, background: t.surface2, border: `1.5px solid ${t.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: t.text2, marginLeft: -5, flexShrink: 0 }}>
                            +{groupMembers.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        </>
      )}
    </div>
  );
};

const WidgetBudgetBar = ({ theme, onNavigate, settings = DEFAULT_WIDGET_SETTINGS['budget-bar'] }) => {
  const t = T(theme);
  const totalBudget = PELAS_BUDGETS.reduce((s, b) => s + b.budget, 0);
  const totalSpent  = PELAS_BUDGETS.reduce((s, b) => s + b.spent, 0);
  const remaining   = totalBudget - totalSpent;
  const pct         = Math.round((totalSpent / totalBudget) * 100);
  const daysLeft    = 28; // días restantes en el mes (mock)
  const barColor    = pct < 70 ? t.positive : pct < 90 ? t.warning : t.negative;

  return (
    <div style={{ marginBottom: 22 }}>
      <SectionTitle theme={theme} title="Presupuesto del mes" action="Detalles" onAction={() => onNavigate('budgets')}/>
      <Card theme={theme} padding={18} radius={20}>
        {/* Porcentaje grande */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: t.text2, marginBottom: 4 }}>Gastado este mes</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, color: barColor }}>{pct}%</span>
              <span style={{ fontSize: 13, color: t.text2 }}>de {totalBudget} €</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: t.text2 }}>Te quedan</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: t.text, marginTop: 2 }}>
              {remaining.toLocaleString('es-ES', { minimumFractionDigits: 0 })} €
            </div>
            <div style={{ fontSize: 10.5, color: t.text3, marginTop: 1 }}>{daysLeft} días</div>
          </div>
        </div>

        {/* Barra principal */}
        <div style={{ width: '100%', height: 10, background: t.surface2, borderRadius: 5, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: 5, background: barColor, transition: 'width 0.5s ease' }}/>
        </div>

        {/* Mini barras por categoría — sólo en modo extenso */}
        {settings.mode === 'extended' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {PELAS_BUDGETS.map(b => {
              const p = Math.round((b.spent / b.budget) * 100);
              const danger = p > 90;
              return (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: danger ? t.negative : b.color, flexShrink: 0 }}/>
                  <div style={{ flex: 1, fontSize: 11.5, color: t.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.label}</div>
                  <div style={{ width: 80, height: 4, background: t.surface2, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, p)}%`, height: '100%', borderRadius: 2, background: danger ? t.negative : b.color }}/>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: danger ? t.negative : t.text2, minWidth: 28, textAlign: 'right' }}>{p}%</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

// ── Widget: Gráfico de gastos ─────────────────────────────────────────────────

// ── Widget: Gráfico combinado (gastos + ingresos) ────────────────────────────

const DONUT_PERIODS = [
  { id: 'week',    label: 'Esta semana',      mult: 0.25 },
  { id: 'month',   label: 'Este mes',         mult: 1    },
  { id: 'quarter', label: 'Últ. trimestre',   mult: 3    },
  { id: 'year',    label: 'Este año',         mult: 12   },
];

const WidgetDonutCombined = ({ theme, settings = {} }) => {
  const t = T(theme);
  const [active, setActive] = useState(null);

  const period = settings.period || 'month';
  const { mult, label: periodLabel } = DONUT_PERIODS.find(p => p.id === period);

  const rawExpTotal = PELAS_CATEGORIES.reduce((s, c) => s + c.spent, 0);
  const rawIncTotal = PELAS_INCOME_CATEGORIES.reduce((s, c) => s + c.amount, 0);
  const expTotal = rawExpTotal * mult;
  const incTotal = rawIncTotal * mult;

  const expData = PELAS_CATEGORIES.slice(0, 5).map(c => ({ v: c.spent, color: c.color }));
  const incData = PELAS_INCOME_CATEGORIES.map(c => ({ v: c.amount, color: c.color }));

  const breakdown = active === 'exp'
    ? PELAS_CATEGORIES.slice(0, 5).map(c => ({ label: c.label, color: c.color, pct: Math.round((c.spent / rawExpTotal) * 100), amount: c.spent * mult }))
    : active === 'inc'
    ? PELAS_INCOME_CATEGORIES.map(c => ({ label: c.label, color: c.color, pct: Math.round((c.amount / rawIncTotal) * 100), amount: c.amount * mult }))
    : [];

  const DonutTile = ({ id, label, data, total, color }) => {
    const isActive = active === id;
    return (
      <div onClick={() => setActive(isActive ? null : id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '14px 10px', borderRadius: 16, background: isActive ? color + '14' : 'transparent', border: `1px solid ${isActive ? color : 'transparent'}`, transition: 'all 0.18s' }}>
        <div style={{ position: 'relative', width: 100, height: 100 }}>
          <Donut theme={theme} size={100} thickness={12} data={data}/>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 8.5, color: t.text2 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{(total / 1000).toFixed(1)}k €</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: isActive ? color : t.text2, fontWeight: isActive ? 600 : 400 }}>
          {isActive ? 'Ocultar desglose ▲' : 'Ver desglose ▼'}
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginBottom: 22 }}>
      <SectionTitle theme={theme} title="Gastos e ingresos" action={periodLabel}/>
      <Card theme={theme} padding={12} radius={22}>
        <div style={{ display: 'flex', gap: 8 }}>
          <DonutTile id="exp" label="Gastos"   data={expData} total={expTotal} color={t.negative}/>
          <div style={{ width: 1, background: t.border, margin: '8px 0' }}/>
          <DonutTile id="inc" label="Ingresos" data={incData} total={incTotal} color={t.positive}/>
        </div>
        {active && (
          <div style={{ borderTop: `1px solid ${t.border}`, marginTop: 4, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {breakdown.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: item.color, flexShrink: 0 }}/>
                <div style={{ flex: 1, fontSize: 12.5, color: t.text }}>{item.label}</div>
                <div style={{ fontSize: 12, color: t.text2 }}>{item.amount.toLocaleString('es-ES', { minimumFractionDigits: 0 })} €</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: item.color, minWidth: 34, textAlign: 'right' }}>{item.pct}%</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// ── Add Card Sheet ────────────────────────────────────────────────────────────

const BLANK_CARD = { bank: '', number: '', expiry: '', cvv: '', holder: '', type: 'visa', color: 'mesh-blue' };

const AddCardSheet = ({ theme, onClose, onSave }) => {
  const t = T(theme);
  const [form, setForm] = useState({ ...BLANK_CARD, holder: PELAS_USER.name });
  const [showCvv, setShowCvv] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const formatNumber = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const handleSave = () => {
    const digits = form.number.replace(/\D/g, '');
    if (digits.length < 4) return;
    onSave({
      id: 'c' + Date.now(),
      bank: form.bank || 'Mi tarjeta',
      last4: digits.slice(-4),
      expiry: form.expiry || '00/00',
      holder: form.holder || PELAS_USER.name,
      type: form.type,
      balance: 0,
      color: form.color,
    });
    onClose();
  };

  const Field = ({ label, value, onChange, placeholder, type = 'text', suffix }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48, gap: 8 }}>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}/>
        {suffix}
      </div>
    </div>
  );

  const previewCard = {
    bank: form.bank || 'Mi tarjeta', last4: (form.number.replace(/\D/g, '') || '0000').slice(-4).padStart(4, '0'),
    expiry: form.expiry || 'MM/AA', holder: form.holder || PELAS_USER.name,
    type: form.type, balance: 0, color: form.color,
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', maxHeight: '94%', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease-out' }}>
        {/* Handle + header */}
        <div style={{ padding: '14px 22px 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 14px' }}/>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>Nueva tarjeta</div>
            <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PelasIcon name="x" size={15} color={t.text2}/>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px' }}>
          {/* Live preview */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <CreditCard theme={theme} card={previewCard} width={300} height={183}/>
          </div>

          {/* Color picker */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 8 }}>Color de diseño</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {CARD_COLORS.map(c => (
                <div key={c.id} onClick={() => set('color', c.id)} style={{ flex: 1, height: 32, borderRadius: 10, background: c.bg, cursor: 'pointer', border: form.color === c.id ? '2px solid #fff' : '2px solid transparent', boxShadow: form.color === c.id ? '0 0 0 2px #0066FF' : 'none', transition: 'box-shadow 0.15s' }}/>
              ))}
            </div>
          </div>

          <Field label="Nombre del banco / tarjeta" value={form.bank} onChange={v => set('bank', v)} placeholder="p. ej. BBVA, Revolut…"/>
          <Field label="Número de tarjeta" value={form.number} onChange={v => set('number', formatNumber(v))} placeholder="1234 5678 9012 3456"/>

          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>Caducidad</div>
              <div style={{ display: 'flex', alignItems: 'center', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48 }}>
                <input value={form.expiry} placeholder="MM/AA" maxLength={5}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
                    set('expiry', raw.length > 2 ? raw.slice(0,2) + '/' + raw.slice(2) : raw);
                  }}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}/>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>CVV</div>
              <div style={{ display: 'flex', alignItems: 'center', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48, gap: 8 }}>
                <input value={form.cvv} placeholder="•••" maxLength={4} type={showCvv ? 'text' : 'password'}
                  onChange={e => set('cvv', e.target.value.replace(/\D/g, '').slice(0,4))}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}/>
                <div onClick={() => setShowCvv(v => !v)} style={{ cursor: 'pointer' }}>
                  <PelasIcon name={showCvv ? 'eye-off' : 'eye'} size={16} color={t.text2}/>
                </div>
              </div>
            </div>
          </div>

          <Field label="Titular" value={form.holder} onChange={v => set('holder', v)} placeholder="Nombre completo"/>

          {/* Red / Tipo */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 8 }}>Red de pago</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ id: 'visa', label: 'Visa' }, { id: 'mc', label: 'Mastercard' }].map(opt => (
                <div key={opt.id} onClick={() => set('type', opt.id)} style={{ flex: 1, height: 46, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', background: form.type === opt.id ? t.accentSoft : t.surface, border: `1px solid ${form.type === opt.id ? t.accent : t.border}`, transition: 'all 0.15s' }}>
                  <PelasIcon name={opt.id} size={form.type === opt.id ? 16 : 14} color={form.type === opt.id ? t.accent : t.text2}/>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: form.type === opt.id ? t.accent : t.text2 }}>{opt.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 22px 22px', flexShrink: 0 }}>
          <button onClick={handleSave} style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: t.accent, color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Guardar tarjeta
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Widget Tarjetas ───────────────────────────────────────────────────────────

// Modal overlay showing private card data (number, expiry, CVV, holder)
const CardDataModal = ({ theme, card, onClose }) => {
  const t = T(theme);
  const [showNum, setShowNum] = useState(false);
  const [showCvv, setShowCvv] = useState(false);

  const fullNumber = card.fullNumber
    ? card.fullNumber.replace(/(.{4})/g, '$1 ').trim()
    : `•••• •••• •••• ${card.last4}`;
  const maskedNumber = `•••• •••• •••• ${card.last4}`;
  const cvv = card.cvv || '•••';

  return (
    <div
      onClick={onClose}
      style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 340 }}>
        {/* Full card visual with chosen design */}
        <div style={{ borderRadius: '18px 18px 0 0', overflow: 'hidden' }}>
          <CreditCard theme={theme} card={card} width={340} height={207}/>
        </div>

        {/* Data rows */}
        <div style={{ background: t.surface, borderRadius: '0 0 18px 18px', overflow: 'hidden' }}>
          {/* Titular */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${t.border}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 }}>Titular</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{card.holder}</div>
            </div>
          </div>

          {/* Número */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${t.border}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 }}>Número</div>
              <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: showNum ? 1.5 : 2, fontFamily: showNum ? 'JetBrains Mono, monospace' : 'inherit' }}>
                {showNum ? fullNumber : maskedNumber}
              </div>
            </div>
            <div onClick={() => setShowNum(v => !v)} style={{ cursor: 'pointer', padding: 4 }}>
              <PelasIcon name={showNum ? 'eye-off' : 'eye'} size={18} color={t.text2}/>
            </div>
          </div>

          {/* Caducidad + CVV */}
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1, padding: '14px 18px', borderRight: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 10.5, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 }}>Caducidad</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{card.expiry}</div>
            </div>
            <div style={{ flex: 1, padding: '14px 18px', display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 }}>CVV</div>
                <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: showCvv ? 2 : 3 }}>
                  {showCvv ? cvv : '•'.repeat(cvv.length)}
                </div>
              </div>
              <div onClick={() => setShowCvv(v => !v)} style={{ cursor: 'pointer', padding: 4 }}>
                <PelasIcon name={showCvv ? 'eye-off' : 'eye'} size={18} color={t.text2}/>
              </div>
            </div>
          </div>

          {/* Close button */}
          <div style={{ padding: '12px 18px' }}>
            <button onClick={onClose} style={{ width: '100%', height: 44, borderRadius: 22, border: `1px solid ${t.border}`, background: t.surface2, color: t.text2, fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MESH_DOT_HOME = {
  'mesh-blue': '#0066FF', 'mesh-night': '#7C5CFF', 'mesh-purple': '#9B5CFF',
  'mesh-gold': '#C9A227', 'mesh-green': '#1DBF7B', 'mesh-rose': '#FF5A7E',
};

const WidgetCards = ({ theme, onNavigate, settings = DEFAULT_WIDGET_SETTINGS.cards }) => {
  const t = T(theme);
  const [peekCard, setPeekCard] = useState(null);
  const visibleCards = settings.order
    .map(id => PELAS_CARDS.find(c => c.id === id))
    .filter(c => c && !settings.hidden.includes(c.id));

  return (
    <div style={{ marginBottom: 22 }}>
      <SectionTitle theme={theme} title="Mis tarjetas" action="Gestionar" onAction={() => onNavigate('cards')}/>

      <Card theme={theme} padding={0} radius={18} style={{ overflow: 'hidden' }}>
        {visibleCards.map((card, i) => {
          const dot = MESH_DOT_HOME[card.color] || t.accent;
          return (
            <div key={card.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: i < visibleCards.length - 1 ? `1px solid ${t.border}` : 'none' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: dot + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PelasIcon name="card" size={17} color={dot}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{card.bank}</div>
                <div style={{ fontSize: 11.5, color: t.text2, marginTop: 1 }}>
                  •••• {card.last4} · {card.type === 'visa' ? 'Visa' : 'Mastercard'}
                </div>
              </div>
              <div onClick={() => setPeekCard(card)} style={{ width: 36, height: 36, borderRadius: 10, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <PelasIcon name="eye" size={16} color={t.text2}/>
              </div>
            </div>
          );
        })}
      </Card>

      {peekCard && (
        <CardDataModal theme={theme} card={peekCard} onClose={() => setPeekCard(null)}/>
      )}
    </div>
  );
};

// ── Per-widget settings sheet ────────────────────────────────────────────────

const WidgetSettingsSheet = ({ theme, widgetId, settings, onSave, onClose }) => {
  const t = T(theme);
  const [local, setLocal] = useState({ ...settings });
  const set = (k, v) => setLocal(s => ({ ...s, [k]: v }));

  const dragIdx = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  const reorder = (list, from, to) => {
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  };

  const TITLES = {
    balance: 'Visión global', accounts: 'Carrusel de cuentas',
    transactions: 'Movimientos recientes', cards: 'Mis tarjetas',
    'budget-bar': 'Presupuesto del mes', budgets: 'Presupuestos',
    'donut-both': 'Gastos e ingresos', goals: 'Mis metas',
  };

  // ── Drag helpers for ordered lists ──
  const startDrag = (i) => { dragIdx.current = i; };
  const overDrag  = (e, i) => { e.preventDefault(); if (dragIdx.current !== null && dragIdx.current !== i) setDragOver(i); };
  const dropDrag  = (e, i, key) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    set(key, reorder(local[key], dragIdx.current, i));
    dragIdx.current = null; setDragOver(null);
  };
  const endDrag   = () => { dragIdx.current = null; setDragOver(null); };

  // ── Eye toggle for list items ──
  const toggleHidden = (id) =>
    set('hidden', local.hidden.includes(id)
      ? local.hidden.filter(x => x !== id)
      : [...local.hidden, id]);

  const DraggableRow = ({ id, label, sub, color, icon, idx, orderKey }) => {
    const hidden = local.hidden?.includes(id);
    const isOver = dragOver === idx;
    return (
      <div draggable onDragStart={() => startDrag(idx)} onDragOver={e => overDrag(e, idx)}
        onDrop={e => dropDrag(e, idx, orderKey)} onDragEnd={endDrag}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, marginBottom: 6, background: isOver ? t.accentSoft : t.surface, border: `1px solid ${isOver ? t.accent : t.border}`, cursor: 'grab', transition: 'all 0.12s', opacity: hidden ? 0.45 : 1 }}>
        <div style={{ opacity: 0.4, flexShrink: 0 }}><GripIcon color={t.text}/></div>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <PelasIcon name={icon} size={15} color={color}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: t.text2, marginTop: 1 }}>{sub}</div>}
        </div>
        <div onClick={() => toggleHidden(id)} style={{ width: 32, height: 32, borderRadius: 10, background: hidden ? t.surface2 : t.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}>
          <PelasIcon name={hidden ? 'eye-off' : 'eye'} size={14} color={hidden ? t.text2 : t.accent}/>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    // ── balance ──
    if (widgetId === 'balance') return (
      <>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Cuentas incluidas</div>
          {PELAS_ACCOUNTS.map(a => {
            const on = local.accounts.includes(a.id);
            return (
              <div key={a.id} onClick={() => set('accounts', on ? local.accounts.filter(x => x !== a.id) : [...local.accounts, a.id])}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 14, marginBottom: 6, background: on ? a.color + '14' : t.surface2, border: `1px solid ${on ? a.color : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: a.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PelasIcon name={a.icon} size={14} color={a.color}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: t.text2 }}>{a.bank}</div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: on ? a.color : 'transparent', border: `1.5px solid ${on ? a.color : t.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {on && <PelasIcon name="check" size={11} color="#fff" strokeWidth={3}/>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Período del gráfico</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['7d','7 días'],['30d','30 días'],['90d','90 días']].map(([id, label]) => (
              <div key={id} onClick={() => set('chartPeriod', id)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 500, background: local.chartPeriod === id ? t.accent : t.surface2, color: local.chartPeriod === id ? '#fff' : t.text2, transition: 'all 0.15s' }}>
                {label}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderRadius: 14, background: t.surface }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>Incluir inversiones</div>
            <div style={{ fontSize: 11, color: t.text2, marginTop: 2 }}>Suma el valor de la cartera al saldo total</div>
          </div>
          <Toggle on={local.includeInvestments} color={t.accent} onChange={() => set('includeInvestments', !local.includeInvestments)}/>
        </div>
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Divisa</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {CURRENCIES.map(c => {
              const on = (local.currency || 'EUR') === c.id;
              return (
                <div key={c.id} onClick={() => set('currency', c.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '12px 6px', borderRadius: 14, cursor: 'pointer', background: on ? t.accentSoft : t.surface2, border: `1.5px solid ${on ? t.accent : 'transparent'}`, transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: on ? t.accent : t.text }}>{c.symbol}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: on ? t.accent : t.text2, letterSpacing: 0.3 }}>{c.id}</div>
                  <div style={{ fontSize: 9, color: t.text3, textAlign: 'center', lineHeight: 1.2 }}>{c.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );

    // ── accounts ──
    if (widgetId === 'accounts') return (
      <>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Orden y visibilidad</div>
        <div style={{ fontSize: 11.5, color: t.text3, marginBottom: 12 }}>Arrastra para reordenar · ojo para ocultar</div>
        {local.order.map((id, idx) => {
          const a = PELAS_ACCOUNTS.find(x => x.id === id);
          if (!a) return null;
          return <DraggableRow key={id} id={id} label={a.name} sub={a.bank} color={a.color} icon={a.icon} idx={idx} orderKey="order"/>;
        })}
      </>
    );

    // ── transactions ──
    if (widgetId === 'transactions') return (
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 }}>Número de movimientos</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
          <div onClick={() => set('count', Math.max(1, local.count - 1))} style={{ width: 44, height: 44, borderRadius: 22, background: t.surface2, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, fontWeight: 300 }}>−</div>
          <div style={{ fontSize: 36, fontWeight: 700, minWidth: 48, textAlign: 'center', color: t.accent }}>{local.count}</div>
          <div onClick={() => set('count', Math.min(10, local.count + 1))} style={{ width: 44, height: 44, borderRadius: 22, background: t.surface2, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, fontWeight: 300 }}>+</div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11.5, color: t.text2, marginTop: 10 }}>Mínimo 1 · Máximo 10</div>
      </div>
    );

    // ── cards ──
    if (widgetId === 'cards') return (
      <>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Orden y visibilidad</div>
        <div style={{ fontSize: 11.5, color: t.text3, marginBottom: 12 }}>Arrastra para reordenar · ojo para ocultar</div>
        {local.order.map((id, idx) => {
          const c = PELAS_CARDS.find(x => x.id === id);
          if (!c) return null;
          const color = c.type === 'visa' ? '#0066FF' : '#7C5CFF';
          return <DraggableRow key={id} id={id} label={c.bank} sub={`•••• ${c.last4} · ${c.type === 'visa' ? 'Visa' : 'Mastercard'}`} color={color} icon="card" idx={idx} orderKey="order"/>;
        })}
      </>
    );

    // ── budget-bar ──
    if (widgetId === 'budget-bar') {
      const modes = [{ id: 'simple', label: 'Simple', sub: 'Porcentaje y dinero restante' }, { id: 'extended', label: 'Extenso', sub: 'Desglose por categoría' }];
      return (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>Tipo de widget</div>
          {modes.map(m => (
            <div key={m.id} onClick={() => set('mode', m.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, marginBottom: 8, background: local.mode === m.id ? t.accentSoft : t.surface, border: `1.5px solid ${local.mode === m.id ? t.accent : t.border}`, cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: local.mode === m.id ? t.accent : t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PelasIcon name={m.id === 'simple' ? 'chart-bar' : 'list'} size={16} color={local.mode === m.id ? '#fff' : t.text2}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: local.mode === m.id ? t.accent : t.text }}>{m.label}</div>
                <div style={{ fontSize: 11.5, color: t.text2, marginTop: 2 }}>{m.sub}</div>
              </div>
              <div style={{ width: 20, height: 20, borderRadius: 10, border: `2px solid ${local.mode === m.id ? t.accent : t.borderStrong}`, background: local.mode === m.id ? t.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {local.mode === m.id && <div style={{ width: 8, height: 8, borderRadius: 4, background: '#fff' }}/>}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // ── budgets ──
    if (widgetId === 'budgets') return (
      <>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Orden y visibilidad</div>
        <div style={{ fontSize: 11.5, color: t.text3, marginBottom: 12 }}>Arrastra para reordenar · ojo para ocultar</div>
        {local.order.map((id, idx) => {
          const b = PELAS_BUDGETS.find(x => x.id === id);
          if (!b) return null;
          return <DraggableRow key={id} id={id} label={b.label} sub={`${b.spent} € / ${b.budget} €`} color={b.color} icon="wallet" idx={idx} orderKey="order"/>;
        })}
      </>
    );

    // ── goals ──
    if (widgetId === 'donut-both') return (
      <>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>Periodo</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DONUT_PERIODS.map(opt => {
            const selected = (local.period || 'month') === opt.id;
            return (
              <div key={opt.id} onClick={() => set('period', opt.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 14, cursor: 'pointer', background: selected ? t.accent + '14' : t.surface2, border: `1.5px solid ${selected ? t.accent : 'transparent'}`, transition: 'all 0.15s' }}>
                <div style={{ width: 20, height: 20, borderRadius: 10, background: selected ? t.accent : 'transparent', border: `1.5px solid ${selected ? t.accent : t.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                  {selected && <PelasIcon name="check" size={11} color="#fff" strokeWidth={3}/>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: selected ? 600 : 400, color: selected ? t.accent : t.text }}>{opt.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );

    if (widgetId === 'goals') return (
      <>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Orden y visibilidad</div>
        <div style={{ fontSize: 11.5, color: t.text3, marginBottom: 12 }}>Arrastra para reordenar · ojo para ocultar</div>
        {local.order.map((id, idx) => {
          const g = PELAS_GOALS.find(x => x.id === id);
          if (!g) return null;
          return <DraggableRow key={id} id={id} label={g.label} sub={g.due} color={g.color} icon={g.icon} idx={idx} orderKey="order"/>;
        })}
      </>
    );

    return null;
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 52, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', maxHeight: '88%', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.22s ease-out' }}>
        <div style={{ padding: '14px 22px 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 14px' }}/>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginRight: 12 }}>
              <PelasIcon name="arrow-left" size={15} color={t.text2}/>
            </div>
            <div style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>{TITLES[widgetId]}</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 8px' }}>
          {renderContent()}
        </div>
        <div style={{ padding: '12px 22px 22px', flexShrink: 0 }}>
          <button onClick={() => { onSave(local); onClose(); }} style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: t.accent, color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Home config sheet ─────────────────────────────────────────────────────────

const ColPicker = ({ value, onChange, color, t }) => {
  const opts = [
    { id: 'left',  label: 'Izq.' },
    { id: 'full',  label: 'Todo' },
    { id: 'right', label: 'Der.' },
  ];
  return (
    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
      {opts.map(opt => {
        const sel = value === opt.id;
        return (
          <div key={opt.id} onClick={() => onChange(opt.id)} title={opt.label}
            style={{ width: 34, height: 26, borderRadius: 7, border: `1.5px solid ${sel ? color : t.border}`, background: sel ? color + '18' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '0 5px', cursor: 'pointer', transition: 'all 0.15s' }}>
            {opt.id === 'left'  && (
              <><div style={{ flex: 1, height: 9, borderRadius: 2, background: sel ? color : t.borderStrong }}/><div style={{ flex: 1, height: 9, borderRadius: 2, border: `1px solid ${t.border}` }}/></>
            )}
            {opt.id === 'full'  && (
              <div style={{ flex: 1, height: 9, borderRadius: 2, background: sel ? color : t.borderStrong }}/>
            )}
            {opt.id === 'right' && (
              <><div style={{ flex: 1, height: 9, borderRadius: 2, border: `1px solid ${t.border}` }}/><div style={{ flex: 1, height: 9, borderRadius: 2, background: sel ? color : t.borderStrong }}/></>
            )}
          </div>
        );
      })}
    </div>
  );
};

const HomeConfigSheet = ({ theme, widgets, setWidgets, widgetSettings, setWidgetSettings, tablet, tabletVertical, onClose }) => {
  const t = T(theme);
  const dragIndex = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  const [settingsFor, setSettingsFor] = useState(null); // widget id | null

  const toggle = (id) =>
    setWidgets(ws => ws.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));

  const setTabletCol = (id, col) =>
    setWidgets(ws => ws.map(w => w.id === id ? { ...w, tabletCol: col } : w));

  const onDragStart = (i) => { dragIndex.current = i; };

  const onDragOver = (e, i) => {
    e.preventDefault();
    if (dragIndex.current !== null && dragIndex.current !== i) setDragOver(i);
  };

  const onDrop = (e, i) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === i) return;
    setWidgets(ws => {
      const next = [...ws];
      const [moved] = next.splice(dragIndex.current, 1);
      next.splice(i, 0, moved);
      return next;
    });
    dragIndex.current = null;
    setDragOver(null);
  };

  const onDragEnd = () => { dragIndex.current = null; setDragOver(null); };

  const WIDGET_COLORS = {
    balance: '#0066FF', accounts: '#3FB984', transactions: '#7C5CFF',
    cards: '#FFC234', 'budget-bar': '#FF8A4C', budgets: '#FF8A4C',
    'donut-both': '#7C5CFF',
    goals: '#1DBF7B',
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', maxHeight: '88%', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease-out' }}>
        {/* Handle */}
        <div style={{ padding: '14px 22px 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 14px' }}/>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 600 }}>Personalizar inicio</div>
              <div style={{ fontSize: 11.5, color: t.text2, marginTop: 2 }}>
                {tabletVertical ? 'Activa, desactiva y arrastra para reordenar' : tablet ? 'Activa, reordena y elige columna en tablet' : 'Activa, desactiva y arrastra para reordenar'}
              </div>
            </div>
            <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PelasIcon name="x" size={15} color={t.text2}/>
            </div>
          </div>
          {tablet && !tabletVertical && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: t.accentSoft, marginBottom: 10 }}>
              <PelasIcon name="laptop" size={13} color={t.accent}/>
              <div style={{ fontSize: 11.5, color: t.accent, fontWeight: 500 }}>Modo tablet activo — configura la columna de cada widget</div>
            </div>
          )}
        </div>

        {/* Widget list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 22px 0' }}>
          {widgets.map((w, i) => {
            const color = WIDGET_COLORS[w.id] || t.accent;
            const isOver = dragOver === i;
            return (
              <div key={w.id}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={e => onDragOver(e, i)}
                onDrop={e => onDrop(e, i)}
                onDragEnd={onDragEnd}
                style={{
                  padding: '13px 14px', marginBottom: 8, borderRadius: 16,
                  background: isOver ? t.accentSoft : t.surface,
                  border: `1px solid ${isOver ? t.accent : t.border}`,
                  transition: 'background 0.12s, border-color 0.12s',
                  cursor: 'grab',
                }}
              >
                {/* Main row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Drag handle */}
                  <div style={{ opacity: 0.4, flexShrink: 0 }}>
                    <GripIcon color={t.text}/>
                  </div>

                  {/* Icon */}
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PelasIcon name={w.icon} size={16} color={color}/>
                  </div>

                  {/* Label */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: w.enabled ? t.text : t.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.label}</div>
                    <div style={{ fontSize: 11, color: t.text3, marginTop: 1 }}>
                      {w.enabled ? 'Visible' : 'Oculto'}
                    </div>
                  </div>

                  {/* Settings ··· (only for configurable widgets) */}
                  {WIDGETS_WITH_SETTINGS.includes(w.id) && (
                    <div
                      onClick={e => { e.stopPropagation(); setSettingsFor(w.id); }}
                      style={{ width: 30, height: 30, borderRadius: 9, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                    >
                      <PelasIcon name="more" size={14} color={t.text2}/>
                    </div>
                  )}

                  {/* Toggle */}
                  <Toggle on={w.enabled} color={color} onChange={() => toggle(w.id)}/>
                </div>

                {/* Tablet column picker — second row */}
                {tablet && !tabletVertical && (
                  <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, flex: 1 }}>Columna en tablet</div>
                    <ColPicker
                      value={w.tabletCol || 'full'}
                      onChange={col => setTabletCol(w.id, col)}
                      color={color}
                      t={t}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px 22px', flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: t.accent, color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Listo
          </button>
        </div>
      </div>

      {/* Per-widget settings panel — slides over the config sheet */}
      {settingsFor && (
        <WidgetSettingsSheet
          theme={theme}
          widgetId={settingsFor}
          settings={widgetSettings[settingsFor]}
          onSave={(s) => setWidgetSettings(ws => ({ ...ws, [settingsFor]: s }))}
          onClose={() => setSettingsFor(null)}
        />
      )}
    </div>
  );
};

// ── Header ────────────────────────────────────────────────────────────────────

const HomeHeader = ({ theme, onNavigate, onMore }) => {
  const t = T(theme);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
      <div onClick={() => onNavigate('profile')} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer' }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: 'linear-gradient(135deg,#0066FF,#7C5CFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 13 }}>MB</div>
        <div>
          <div style={{ fontSize: 11, color: t.text2 }}>Buenas tardes</div>
          <div style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            Marta <PelasIcon name="chevron-right" size={12} color={t.text2}/>
          </div>
        </div>
      </div>
      <div onClick={() => onNavigate('search')} style={{ cursor: 'pointer' }}>
        <PelasIcon name="search" size={20} color={t.text2}/>
      </div>
      <div onClick={() => onNavigate('notifications')} style={{ cursor: 'pointer', position: 'relative' }}>
        <PelasIcon name="bell" size={20} color={t.text2}/>
        <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, background: t.accent, border: `2px solid ${theme === 'dark' ? '#0E0E1A' : '#F4F6FB'}` }}/>
      </div>
      <div onClick={onMore} style={{ cursor: 'pointer' }}>
        <PelasIcon name="more" size={20} color={t.text2}/>
      </div>
    </div>
  );
};

// ── Configurable home (variant A) ─────────────────────────────────────────────

const tabletGridCol = (col) =>
  col === 'full' ? '1 / -1' : col === 'left' ? '1' : '2';

const HomeVariantA = ({ theme, onNavigate, tablet = false, tabletVertical = false, familyGroup }) => {
  const t = T(theme);
  const [hideBalance, setHideBalance] = useState(false);
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);
  const [widgetSettings, setWidgetSettings] = useState(DEFAULT_WIDGET_SETTINGS);
  const [showConfig, setShowConfig] = useState(false);

  const active = widgets.filter(w => w.enabled);

  const renderWidget = (w) => {
    switch (w.id) {
      case 'balance':
        return <WidgetBalance key={w.id} theme={theme} hideBalance={hideBalance} setHideBalance={setHideBalance} onNavigate={onNavigate} settings={widgetSettings.balance}/>;
      case 'accounts':
        return <WidgetAccounts key={w.id} theme={theme} hideBalance={hideBalance} onNavigate={onNavigate} settings={widgetSettings.accounts}/>;
      case 'transactions':
        return <WidgetTransactions key={w.id} theme={theme} onNavigate={onNavigate} settings={widgetSettings.transactions}/>;
      case 'cards':
        return <WidgetCards key={w.id} theme={theme} onNavigate={onNavigate} settings={widgetSettings.cards}/>;
      case 'budget-bar':
        return <WidgetBudgetBar key={w.id} theme={theme} onNavigate={onNavigate} settings={widgetSettings['budget-bar']}/>;
      case 'budgets':
        return <WidgetBudgets key={w.id} theme={theme} onNavigate={onNavigate} settings={widgetSettings.budgets}/>;
      case 'donut-both':
        return <WidgetDonutCombined key={w.id} theme={theme} settings={widgetSettings['donut-both']}/>;
      case 'shared-accounts':
        return <WidgetSharedAccounts key={w.id} theme={theme} onNavigate={onNavigate} familyGroup={familyGroup}/>;
      case 'goals':
        return <WidgetGoals key={w.id} theme={theme} onNavigate={onNavigate} settings={widgetSettings.goals}/>;
      default:
        return null;
    }
  };

  const widgetArea = (tablet && !tabletVertical) ? (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12, alignItems: 'start' }}>
      {active.map(w => (
        <div key={w.id} style={{ gridColumn: tabletGridCol(w.tabletCol || 'full') }}>
          {renderWidget(w)}
        </div>
      ))}
    </div>
  ) : (
    active.map(renderWidget)
  );

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ padding: '8px 22px 24px', overflowY: 'auto', height: '100%' }}>
        <HomeHeader theme={theme} onNavigate={onNavigate} onMore={() => setShowConfig(true)}/>
        {active.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: t.text2 }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>🧩</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Pantalla vacía</div>
            <div style={{ fontSize: 12 }}>Pulsa ··· para añadir widgets</div>
          </div>
        )}
        {widgetArea}
      </div>

      {showConfig && (
        <HomeConfigSheet
          theme={theme}
          widgets={widgets}
          setWidgets={setWidgets}
          widgetSettings={widgetSettings}
          setWidgetSettings={setWidgetSettings}
          tablet={tablet}
          tabletVertical={tabletVertical}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  );
};

// ── Variant B — card hero ─────────────────────────────────────────────────────

const HomeVariantB = ({ theme, onNavigate }) => {
  const t = T(theme);
  const [cardIdx, setCardIdx] = useState(0);
  const card = PELAS_CARDS[cardIdx];
  return (
    <div style={{ padding: '8px 22px 24px' }}>
      <HomeHeader theme={theme} onNavigate={onNavigate} onMore={() => {}}/>
      <div style={{ position: 'relative', marginBottom: 18 }}>
        <CreditCard theme={theme} card={card}/>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          {PELAS_CARDS.map((_, i) => (
            <div key={i} onClick={() => setCardIdx(i)} style={{ width: i === cardIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === cardIdx ? t.accent : t.borderStrong, transition: 'width 0.2s', cursor: 'pointer' }}/>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, marginBottom: 22 }}>
        {[{ icon: 'arrow-up', label: 'Enviar' }, { icon: 'arrow-down', label: 'Recibir' }, { icon: 'card', label: 'Pagar' }, { icon: 'plus', label: 'Recarga' }].map(a => (
          <div key={a.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <div style={{ width: 52, height: 52, borderRadius: 18, background: t.surface, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PelasIcon name={a.icon} size={18} color={t.accent} strokeWidth={2.2}/>
            </div>
            <div style={{ fontSize: 11, color: t.text2 }}>{a.label}</div>
          </div>
        ))}
      </div>
      <Card theme={theme} padding={16} radius={20} style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: t.text2 }}>Gasto esta semana</div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.6 }}>342,18 €</div>
            <div style={{ fontSize: 11, color: t.positive, fontWeight: 600 }}>↓ 18% vs semana anterior</div>
          </div>
          <div style={{ width: 100 }}>
            <Sparkline data={PELAS_SERIES_30D.slice(-7)} width={100} height={48} color={t.accent}/>
          </div>
        </div>
      </Card>
      <SectionTitle theme={theme} title="Movimientos" action="Ver todo" onAction={() => onNavigate('history')}/>
      {PELAS_TRANSACTIONS.slice(0, 5).map(tx => {
        const cat = PELAS_CATEGORIES.find(c => c.id === tx.cat);
        return <TxRow key={tx.id} theme={theme} tx={tx} cat={cat} onClick={() => onNavigate('tx-detail', { tx })}/>;
      })}
    </div>
  );
};

// ── Variant C — budgets + goals ───────────────────────────────────────────────

const HomeVariantC = ({ theme, onNavigate }) => {
  const t = T(theme);
  const totalBudget = PELAS_BUDGETS.reduce((s, b) => s + b.budget, 0);
  const totalSpent  = PELAS_BUDGETS.reduce((s, b) => s + b.spent, 0);
  const monthPct    = Math.round((totalSpent / totalBudget) * 100);
  return (
    <div style={{ padding: '8px 22px 24px' }}>
      <HomeHeader theme={theme} onNavigate={onNavigate} onMore={() => {}}/>
      <Card theme={theme} padding={20} radius={24} style={{ marginBottom: 18, background: `linear-gradient(135deg, ${theme === 'dark' ? '#1A1F3A' : '#EAF1FF'} 0%, ${t.surface} 80%)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ position: 'relative', width: 110, height: 110 }}>
            <Donut theme={theme} size={110} thickness={10} data={[
              { v: totalSpent, color: t.accent },
              { v: totalBudget - totalSpent, color: theme === 'dark' ? '#2A2C3C' : '#E6E8EE' },
            ]}/>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5 }}>{monthPct}%</div>
              <div style={{ fontSize: 9.5, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6 }}>del mes</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: t.text2 }}>Te quedan</div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.6 }}>{fmtEUR(totalBudget - totalSpent)}</div>
            <div style={{ fontSize: 11, color: t.text3, marginTop: 2 }}>de {fmtEUR(totalBudget)} planificados</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '4px 10px', background: 'rgba(63,185,132,0.16)', borderRadius: 100, width: 'fit-content' }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: t.positive }}/>
              <div style={{ fontSize: 10.5, color: t.positive, fontWeight: 600 }}>Vas en buen camino</div>
            </div>
          </div>
        </div>
      </Card>
      <SectionTitle theme={theme} title="Presupuestos" action="Editar" onAction={() => onNavigate('budgets')}/>
      <Card theme={theme} padding={16} radius={18} style={{ marginBottom: 22 }}>
        {PELAS_BUDGETS.map((b, i) => {
          const pct = (b.spent / b.budget) * 100;
          const danger = pct > 90;
          return (
            <div key={b.id} style={{ padding: '10px 0', borderBottom: i < PELAS_BUDGETS.length - 1 ? `1px solid ${t.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{b.label}</div>
                <div style={{ fontSize: 11.5, color: t.text2 }}>
                  <span style={{ color: danger ? t.negative : t.text, fontWeight: 600 }}>{b.spent} €</span> / {b.budget} €
                </div>
              </div>
              <Progress value={pct} color={danger ? t.negative : b.color} track={t.surface2} height={5}/>
            </div>
          );
        })}
      </Card>
      <SectionTitle theme={theme} title="Mis metas" action="+ Nueva"/>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginRight: -22, paddingRight: 22, marginBottom: 22 }}>
        {PELAS_GOALS.map(g => {
          const pct = Math.round((g.saved / g.target) * 100);
          return (
            <Card key={g.id} theme={theme} padding={14} radius={18} style={{ minWidth: 180, flexShrink: 0, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: g.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PelasIcon name={g.icon} size={16} color={g.color}/>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: g.color }}>{pct}%</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{g.label}</div>
              <div style={{ fontSize: 10.5, color: t.text3, marginBottom: 8 }}>{g.due}</div>
              <Progress value={pct} color={g.color} track={t.surface2} height={4}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10.5, color: t.text2 }}>
                <span>{g.saved} €</span><span>{g.target} €</span>
              </div>
            </Card>
          );
        })}
      </div>
      <SectionTitle theme={theme} title="Últimos movimientos" action="Ver todo" onAction={() => onNavigate('history')}/>
      {PELAS_TRANSACTIONS.slice(0, 3).map(tx => {
        const cat = PELAS_CATEGORIES.find(c => c.id === tx.cat);
        return <TxRow key={tx.id} theme={theme} tx={tx} cat={cat} onClick={() => onNavigate('tx-detail', { tx })}/>;
      })}
    </div>
  );
};

// ── Export ────────────────────────────────────────────────────────────────────

export const HomeScreen = ({ theme, onNavigate, tablet = false, tabletVertical = false, familyGroup }) => {
  return <HomeVariantA theme={theme} onNavigate={onNavigate} tablet={tablet} tabletVertical={tabletVertical} familyGroup={familyGroup}/>;
};
