import { useState, useRef } from 'react';
import { PelasIcon } from '../icons';
import { T } from '../theme';
import { Card, Progress, Sparkline, BarChart, Donut } from '../components';
import { PELAS_BALANCE, PELAS_CATEGORIES, PELAS_MONTHLY, PELAS_SERIES_30D, PELAS_INCOME_CATEGORIES, PELAS_ACCOUNTS, PELAS_BUDGETS, PELAS_GOALS, PELAS_TRANSACTIONS } from '../data';
import { MOCK_TX_MONTH_INDEX, MOCK_TX_YEAR, getMockTxDate, txMatchesDateRange } from '../mockDates';

// ── Shared micro-components ───────────────────────────────────────────────────

const GripIcon = ({ color }) => (
  <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
    <rect y="0"  width="16" height="2" rx="1" fill={color}/>
    <rect y="6"  width="16" height="2" rx="1" fill={color}/>
    <rect y="12" width="16" height="2" rx="1" fill={color}/>
  </svg>
);

const Toggle = ({ on, color = '#0066FF', onChange }) => (
  <div onClick={onChange} style={{ width: 40, height: 22, borderRadius: 11, position: 'relative', background: on ? color : '#44445A', transition: 'background 0.18s', cursor: 'pointer', flexShrink: 0 }}>
    <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 16, height: 16, borderRadius: 8, background: '#fff', transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }}/>
  </div>
);

const StatsDonutTile = ({ theme, id, label, data, total, color, active, onToggle }) => {
  const t = T(theme);
  const isActive = active === id;

  return (
    <div onClick={() => onToggle(id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '14px 10px', borderRadius: 16, background: isActive ? color + '14' : 'transparent', border: `1px solid ${isActive ? color : 'transparent'}`, transition: 'all 0.18s' }}>
      <div style={{ position: 'relative', width: 100, height: 100 }}>
        <Donut theme={theme} size={100} thickness={12} data={data}/>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 8.5, color: t.text2 }}>{label}</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{Math.round(total / 100) / 10}k €</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: isActive ? color : t.text2, fontWeight: isActive ? 600 : 400 }}>
        {isActive ? 'Ocultar ▲' : 'Ver desglose ▼'}
      </div>
    </div>
  );
};

const StatsSegmentedControl = ({ theme, value, options, onChange }) => {
  const t = T(theme);

  return (
    <div style={{ display: 'flex', gap: 4, padding: 4, background: t.surface2, borderRadius: 12, flexShrink: 0 }}>
      {options.map(option => {
        const selected = value === option.id;
        return (
          <div key={option.id} onClick={() => onChange(option.id)} style={{ minWidth: option.minWidth || 42, textAlign: 'center', padding: '6px 9px', borderRadius: 9, cursor: 'pointer', fontSize: 11.5, fontWeight: 600, background: selected ? t.accent : 'transparent', color: selected ? '#fff' : t.text2, transition: 'all 0.15s' }}>
            {option.label}
          </div>
        );
      })}
    </div>
  );
};

const StatsWidgetTitle = ({ theme, title, meta, onInfo }) => {
  const t = T(theme);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '4px 0 14px' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>{title}</div>
        {meta && <div style={{ fontSize: 11, color: t.text3, marginTop: 1 }}>{meta}</div>}
      </div>
      {onInfo && (
        <button onClick={onInfo} style={{ flexShrink: 0, border: `1px solid ${t.border}`, background: t.surface, color: t.accent, height: 30, borderRadius: 15, padding: '0 11px', fontFamily: 'Poppins', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          + Info
        </button>
      )}
    </div>
  );
};

// ── Filter state ──────────────────────────────────────────────────────────────

const DEFAULT_FILTERS = {
  period: 'month',     // today | week | month | 3months | year | all | custom
  dateFrom: '',
  dateTo: '',
  categories: [],      // [] = all
  type: 'all',         // all | expenses | income
};

const PERIOD_LABELS = {
  today: 'Hoy', week: 'Esta semana', month: 'Este mes',
  '3months': 'Últimos 3 meses', year: 'Este año', all: 'Todo', custom: 'Personalizado',
};

// ── Widget: Balance ───────────────────────────────────────────────────────────

const WidgetStatsBalance = ({ theme, onInfo }) => {
  const t = T(theme);
  const [range, setRange] = useState('month');
  const [selected, setSelected] = useState(null);

  const monthlyRows = PELAS_MONTHLY.map((row, index) => {
    const isCurrent = index === PELAS_MONTHLY.length - 1;
    const income = isCurrent ? PELAS_BALANCE.income : row.i;
    const expenses = isCurrent ? PELAS_BALANCE.expenses : row.v;
    return { m: row.m, v: income - expenses, income, expenses };
  });
  const yearlyRows = [
    { m: '2022', v: 1380, income: 24780, expenses: 23400 },
    { m: '2023', v: 2860, income: 28620, expenses: 25760 },
    { m: '2024', v: 4180, income: 31840, expenses: 27660 },
    { m: '2025', v: 6360, income: 35420, expenses: 29060 },
    { m: '2026', v: 8020, income: 37120, expenses: 29100 },
  ];
  const rows = range === 'month' ? monthlyRows : yearlyRows;
  const balanceOptions = [
    { id: 'month', label: 'Mes' },
    { id: 'year', label: 'Año' },
  ];

  const displayIdx = selected !== null ? selected : rows.length - 1;
  const current = rows[displayIdx];
  const max = Math.max(...rows.map(r => Math.abs(r.v))) || 1;
  const BAR_H = 90;

  const handleBarClick = (i) => setSelected(prev => prev === i ? null : i);
  const handleRangeChange = (r) => { setRange(r); setSelected(null); };

  return (
    <div style={{ marginBottom: 18 }}>
      <StatsWidgetTitle theme={theme} title="Balance" onInfo={onInfo}/>
      <Card theme={theme} padding={18} radius={22}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 11, color: t.text2 }}>
              {selected !== null ? rows[selected].m : 'Balance neto'}
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.8, marginTop: 2, color: current.v >= 0 ? t.positive : t.negative }}>
              {current.v >= 0 ? '+' : '−'}{Math.abs(current.v).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
            </div>
          </div>
          <StatsSegmentedControl theme={theme} value={range} options={balanceOptions} onChange={handleRangeChange}/>
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 2, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: t.positive }}/>
            <div style={{ fontSize: 11.5, color: t.positive, fontWeight: 600 }}>↑ {current.income.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: t.negative }}/>
            <div style={{ fontSize: 11.5, color: t.negative, fontWeight: 600 }}>↓ {current.expenses.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €</div>
          </div>
        </div>

        {/* Interactive bar chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, paddingTop: 28 }}>
          {rows.map((row, i) => {
            const isSelected = selected === i || (selected === null && i === rows.length - 1);
            const netColor = row.v >= 0 ? t.positive : t.negative;
            const bH = Math.max(4, (Math.abs(row.v) / max) * BAR_H);
            return (
              <div key={i} onClick={() => handleBarClick(i)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', position: 'relative' }}>
                {isSelected && (
                  <div style={{ position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)', fontSize: 9.5, fontWeight: 700, color: netColor, whiteSpace: 'nowrap', background: t.surface2, borderRadius: 6, padding: '2px 6px', border: `1px solid ${netColor}40` }}>
                    {row.v >= 0 ? '+' : '−'}{Math.abs(row.v).toLocaleString('es-ES', { maximumFractionDigits: 0 })}€
                  </div>
                )}
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: BAR_H }}>
                  <div style={{ flex: 1, height: bH, background: isSelected ? netColor : netColor + '55', borderRadius: '4px 4px 0 0', transition: 'all 0.2s' }}/>
                </div>
                <div style={{ fontSize: 9.5, color: isSelected ? t.text : t.text3, fontWeight: isSelected ? 700 : 400, marginTop: 2 }}>{row.m}</div>
              </div>
            );
          })}
        </div>

        {selected !== null && (
          <div onClick={() => setSelected(null)} style={{ marginTop: 10, textAlign: 'center', fontSize: 11, color: t.accent, cursor: 'pointer', fontWeight: 500 }}>
            Ver periodo actual
          </div>
        )}
      </Card>
    </div>
  );
};

// ── Widget: Gastos e ingresos (donuts combinados) ─────────────────────────────

const WidgetStatsCombined = ({ theme, filters, onInfo }) => {
  const t = T(theme);
  const [active, setActive] = useState(null); // null | 'exp' | 'inc'
  const [range, setRange] = useState('month');
  const rangeOptions = [
    { id: 'month', label: 'Mes' },
    { id: 'year', label: 'Año' },
  ];
  const yearlyExpenseFactor = {
    food: 11.8,
    transport: 10.9,
    home: 12,
    leisure: 11.4,
    health: 9.6,
    subs: 12,
    shopping: 10.7,
    edu: 8.4,
  };

  const expCats = filters.categories.length
    ? PELAS_CATEGORIES.filter(c => filters.categories.includes(c.id))
    : PELAS_CATEGORIES.slice(0, 5);
  const normalizedExpCats = expCats.map(c => ({
    ...c,
    spent: range === 'year' ? Math.round(c.spent * (yearlyExpenseFactor[c.id] || 11.5)) : c.spent,
  }));
  const expTotal = normalizedExpCats.reduce((s, c) => s + c.spent, 0);
  const incCats = PELAS_INCOME_CATEGORIES.map(c => ({
    ...c,
    amount: range === 'year' ? Math.round(c.amount * (c.id === 'salary' ? 12 : c.id === 'freelance' ? 10.5 : 8)) : c.amount,
  }));
  const incTotal = incCats.reduce((s, c) => s + c.amount, 0);

  const expData = normalizedExpCats.map(c => ({ v: c.spent, color: c.color }));
  const incData = incCats.map(c => ({ v: c.amount, color: c.color }));

  const breakdown = active === 'exp'
    ? normalizedExpCats.map(c => ({ label: c.label, color: c.color, pct: Math.round((c.spent / expTotal) * 100), amount: c.spent }))
    : active === 'inc'
    ? incCats.map(c => ({ label: c.label, color: c.color, pct: Math.round((c.amount / incTotal) * 100), amount: c.amount }))
    : [];
  const toggleActive = (id) => setActive(current => current === id ? null : id);


  return (
    <div style={{ marginBottom: 18 }}>
      <StatsWidgetTitle theme={theme} title="Gastos e ingresos" onInfo={onInfo}/>
      <Card theme={theme} padding={12} radius={22}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '2px 4px 12px' }}>
          <div>
            <div style={{ fontSize: 11, color: t.text2 }}>Vista del periodo</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 1 }}>{range === 'month' ? 'Mes actual' : 'Año actual'}</div>
          </div>
          <StatsSegmentedControl theme={theme} value={range} options={rangeOptions} onChange={setRange}/>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatsDonutTile theme={theme} id="exp" label="Gastos" data={expData} total={expTotal} color={t.negative} active={active} onToggle={toggleActive}/>
          <div style={{ width: 1, background: t.border, margin: '8px 0' }}/>
          <StatsDonutTile theme={theme} id="inc" label="Ingresos" data={incData} total={incTotal} color={t.positive} active={active} onToggle={toggleActive}/>
        </div>
        {active && (
          <div style={{ borderTop: `1px solid ${t.border}`, marginTop: 4, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {breakdown.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: item.color, flexShrink: 0 }}/>
                <div style={{ flex: 1, fontSize: 12.5 }}>{item.label}</div>
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

// ── Widget: Tendencia diaria ───────────────────────────────────────────────────

const WidgetStatsTrend = ({ theme, filters, onInfo }) => {
  const t = T(theme);
  const label = PERIOD_LABELS[filters.period] || 'Este mes';
  return (
    <div style={{ marginBottom: 18 }}>
      <StatsWidgetTitle theme={theme} title="Tendencia de gasto" meta={label} onInfo={onInfo}/>
      <Card theme={theme} padding={18} radius={22}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: t.text2 }}>Gasto medio diario</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>61,42 € / día</div>
          </div>
          <div style={{ background: 'rgba(63,185,132,0.16)', color: t.positive, fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 8 }}>−4,2%</div>
        </div>
        <div style={{ marginLeft: -8, marginRight: -8 }}>
          <Sparkline data={PELAS_SERIES_30D} width={326} height={90} color={t.accent}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: t.text3, marginTop: 4 }}>
          <span>1 abr</span><span>15 abr</span><span>30 abr</span>
        </div>
      </Card>
    </div>
  );
};

// ── Responsive mini sparkline (used in evolution widget) ─────────────────────

const EvolutionMiniChart = ({ data, color, labelColor = '#7E848D', height = 90, yLabels = [] }) => {
  const W = 400; const H = height;
  const padL = yLabels.length ? 46 : 4;
  const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1;
  const pts = data.map((v, i) => [
    padL + i * ((W - padL - 4) / (data.length - 1)),
    6 + ((H - 18) - ((v - min) / range) * (H - 24)),
  ]);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i - 1][0] + pts[i][0]) / 2;
    d += ` C ${cx} ${pts[i - 1][1]}, ${cx} ${pts[i][1]}, ${pts[i][0]} ${pts[i][1]}`;
  }
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} style={{ display: 'block' }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`evo-mini-${color.replace('#','')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {yLabels.map((lbl, i) => {
        const y = 6 + (i / (yLabels.length - 1)) * (H - 24);
        return (
          <g key={i}>
            <line x1={padL - 4} y1={y} x2={W - 4} y2={y} stroke={labelColor} strokeWidth="0.6" strokeOpacity="0.35"/>
            <text x={padL - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize="10" fill={labelColor}>{lbl}</text>
          </g>
        );
      })}
      <path d={`${d} L ${last[0]} ${H} L ${pts[0][0]} ${H} Z`} fill={`url(#evo-mini-${color.replace('#','')})`}/>
      <path d={d} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <circle cx={last[0]} cy={last[1]} r="4" fill={color}/>
    </svg>
  );
};

// ── Widget: Evolución del saldo ───────────────────────────────────────────────

const WidgetStatsEvolution = ({ theme, onInfo }) => {
  const t = T(theme);
  const [period, setPeriod] = useState('30d');

  const chartData = {
    '7d':  [4018, 4062, 4044, 4115, 4178, 4214, 4287],
    '30d': [3490, 3528, 3560, 3618, 3675, 3708, 3688, 3745, 3802, 3790, 3836, 3884, 3918, 3950, 3972, 4010, 3988, 4054, 4092, 4075, 4116, 4168, 4142, 4184, 4218, 4196, 4244, 4271, 4258, 4287],
    '90d': [2980, 3045, 3092, 3160, 3225, 3298, 3374, 3440, 3522, 3608, 3714, 3826, 3958, 4084, 4192, 4287],
    '1y':  [1840, 1965, 2058, 2146, 2284, 2398, 2510, 2668, 2814, 2986, 3164, 3428, 3715, 3968, 4122, 4287],
    '5y':  [820, 980, 1120, 1255, 1410, 1565, 1718, 1840, 2058, 2284, 2510, 2814, 3164, 3428, 3715, 3968, 4122, 4218, 4258, 4287],
    all:   [320, 410, 520, 640, 790, 980, 1180, 1410, 1718, 2058, 2510, 3164, 3715, 4122, 4287],
  }[period];

  const xLabels = {
    '7d':  ['L','M','X','J','V','S','D'],
    '30d': ['1 abr','8 abr','15 abr','22 abr','30 abr'],
    '90d': ['Ene','Feb','Mar','Abr'],
    '1y':  ['Ene','Mar','May','Jul','Sep','Nov','Dic'],
    '5y':  ['2022','2023','2024','2025','2026'],
    all:   ['2018','2020','2022','2024','2026'],
  }[period];

  const totalBalance = PELAS_ACCOUNTS.reduce((s, a) => s + a.balance, 0);
  const minVal = Math.min(...chartData);
  const maxVal = Math.max(...chartData);
  const midVal = Math.round((minVal + maxVal) / 2);
  const delta = chartData[chartData.length - 1] - chartData[0];
  const deltaPct = ((delta / chartData[0]) * 100).toFixed(1).replace('.', ',');
  const formatAxis = (value) => `${(value / 1000).toFixed(1).replace('.', ',')}k`;

  const PERIOD_CHIPS = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '1M' },
    { id: '90d', label: '3M' },
    { id: '1y', label: '1A' },
    { id: '5y', label: '5A' },
    { id: 'all', label: 'All' },
  ];

  return (
    <div style={{ marginBottom: 18 }}>
      <StatsWidgetTitle theme={theme} title="Evolución del saldo" onInfo={onInfo}/>
      <Card theme={theme} padding={18} radius={22}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: t.text2, marginBottom: 2 }}>Balance total</div>
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.8 }}>
              {totalBalance.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
            </div>
          </div>
          <div style={{ background: 'rgba(63,185,132,0.15)', color: t.positive, fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 10 }}>+{deltaPct}%</div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {PERIOD_CHIPS.map(chip => (
            <div key={chip.id} onClick={() => setPeriod(chip.id)} style={{ padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 11.5, fontWeight: 600, background: period === chip.id ? t.accent : t.surface2, color: period === chip.id ? '#fff' : t.text2, transition: 'all 0.15s' }}>
              {chip.label}
            </div>
          ))}
        </div>
        <div style={{ borderRadius: 14, background: t.surface2, border: `1px solid ${t.border}`, padding: '6px 8px 0' }}>
          <EvolutionMiniChart
            data={chartData}
            color={t.accent}
            labelColor={t.text3}
            height={96}
            yLabels={[formatAxis(maxVal), formatAxis(midVal), formatAxis(minVal)]}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 2px 6px' }}>
            {xLabels.map((lbl, i) => <span key={i} style={{ fontSize: 8.5, color: t.text3 }}>{lbl}</span>)}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
          <div style={{ flex: 1, padding: '10px 12px', borderRadius: 14, background: t.surface2 }}>
            <div style={{ fontSize: 10, color: t.text3, marginBottom: 2 }}>Inicio del periodo</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{chartData[0].toLocaleString('es-ES')} €</div>
          </div>
          <div style={{ flex: 1, padding: '10px 12px', borderRadius: 14, background: t.surface2 }}>
            <div style={{ fontSize: 10, color: t.text3, marginBottom: 2 }}>Variación neta</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: delta >= 0 ? t.positive : t.negative }}>
              {delta >= 0 ? '+' : ''}{delta.toLocaleString('es-ES')} €
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ── Widget: Distribución por divisas ──────────────────────────────────────────

const CURRENCY_META = {
  EUR: { label: 'Euro', color: '#0066FF', symbol: '€' },
  USD: { label: 'Dólar', color: '#3FB984', symbol: '$' },
  GBP: { label: 'Libra', color: '#FFC234', symbol: '£' },
  CHF: { label: 'Franco', color: '#7C5CFF', symbol: 'CHF' },
  JPY: { label: 'Yen', color: '#E16364', symbol: '¥' },
};

const getCurrencyRows = () => {
  const grouped = PELAS_ACCOUNTS.reduce((acc, account) => {
    const currency = account.currency ?? 'EUR';
    const meta = CURRENCY_META[currency] || { label: currency, color: account.color || '#0066FF', symbol: currency };
    if (!acc[currency]) acc[currency] = { id: currency, ...meta, amount: 0, accounts: [] };
    acc[currency].amount += account.balance;
    acc[currency].accounts.push(account);
    return acc;
  }, {});
  return Object.values(grouped).sort((a, b) => b.amount - a.amount);
};

const WidgetStatsCurrencies = ({ theme, onInfo }) => {
  const t = T(theme);
  const currencyData = getCurrencyRows();
  const total = currencyData.reduce((s, c) => s + c.amount, 0);
  const donutData = currencyData.map(c => ({ v: c.amount, color: c.color }));
  const totalK = (total / 1000).toFixed(1);

  return (
    <div style={{ marginBottom: 18 }}>
      <StatsWidgetTitle theme={theme} title="Patrimonio por divisa" onInfo={onInfo}/>
      <Card theme={theme} padding={18} radius={22}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
            <Donut theme={theme} size={110} thickness={13} data={donutData}/>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 9, color: t.text2 }}>Total</div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{totalK}k €</div>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {currencyData.map(c => {
              const pct = Math.round((c.amount / total) * 100);
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: c.color, flexShrink: 0 }}/>
                  <div style={{ fontSize: 12, fontWeight: 700, minWidth: 28 }}>{c.id}</div>
                  <div style={{ flex: 1, fontSize: 11.5, color: t.text2 }}>{c.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {c.symbol}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: c.color }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

const CurrencyDetailDonut = ({ theme, data, selectedId, onSelect, size = 210, thickness = 24 }) => {
  const t = T(theme);
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const segments = data.map((item, index) => {
    const before = data.slice(0, index).reduce((sum, d) => sum + d.amount, 0);
    const len = total > 0 ? (item.amount / total) * c : 0;
    return { item, len, off: total > 0 ? c - ((before / total) * c) : c };
  });

  return (
    <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.surface2} strokeWidth={thickness}/>
      {segments.map(({ item, len, off }) => {
        const active = selectedId === item.id;
        return (
          <circle
            key={item.id}
            onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={item.color}
            strokeWidth={active ? thickness + 5 : thickness}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={off}
            strokeLinecap="butt"
            opacity={active ? 1 : 0.42}
            style={{ cursor: 'pointer', transition: 'opacity 0.15s, stroke-width 0.15s' }}
          />
        );
      })}
    </svg>
  );
};

const WidgetCurrenciesDetail = ({ theme, onNavigate }) => {
  const t = T(theme);
  const currencyData = getCurrencyRows();
  const total = currencyData.reduce((sum, item) => sum + item.amount, 0);
  const [selectedId, setSelectedId] = useState(currencyData[0]?.id || 'EUR');
  const selected = currencyData.find(item => item.id === selectedId) || currencyData[0];
  const selectedPct = selected && total > 0 ? Math.round((selected.amount / total) * 100) : 0;
  const accounts = selected?.accounts || [];

  const navigateToAccounts = () => {
    if (!selected) return;
    onNavigate?.('accounts', { filters: { currency: selected.id } });
  };

  return (
    <div style={{ padding: '0 16px 24px', overflowY: 'auto', flex: 1 }}>
      <Card theme={theme} padding={18} radius={24} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: t.text2 }}>Patrimonio total</div>
            <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.8 }}>{total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
          </div>
          {selected && (
            <div style={{ padding: '6px 10px', borderRadius: 12, background: selected.color + '18', color: selected.color, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
              {selected.id} · {selectedPct}%
            </div>
          )}
        </div>

        <div style={{ position: 'relative', width: 210, height: 210, margin: '0 auto 16px' }}>
          <CurrencyDetailDonut theme={theme} data={currencyData} selectedId={selected?.id} onSelect={setSelectedId}/>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: t.text3 }}>Seleccionado</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: selected?.color || t.accent, lineHeight: 1.05 }}>{selected?.id}</div>
              <div style={{ fontSize: 11, color: t.text2, marginTop: 2 }}>{selected?.label}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center' }}>
          {currencyData.map(item => (
            <div key={item.id} onClick={() => setSelectedId(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 100, cursor: 'pointer', background: selected?.id === item.id ? item.color + '20' : t.surface2, border: `1px solid ${selected?.id === item.id ? item.color : t.border}`, color: selected?.id === item.id ? item.color : t.text2, fontSize: 11.5, fontWeight: 800 }}>
              <div style={{ width: 7, height: 7, borderRadius: 4, background: item.color }}/>
              {item.id}
            </div>
          ))}
        </div>
      </Card>

      {selected && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>Cuentas en {selected.id}</div>
              <div style={{ fontSize: 11, color: t.text3, marginTop: 1 }}>{accounts.length} cuenta{accounts.length === 1 ? '' : 's'} · {selected.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {selected.symbol}</div>
            </div>
            <div style={{ width: 9, height: 9, borderRadius: 5, background: selected.color, flexShrink: 0 }}/>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {accounts.map(account => (
              <div key={account.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 16, background: t.surface, border: `1px solid ${t.border}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: account.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PelasIcon name={account.icon} size={16} color={account.color}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{account.name}</div>
                  <div style={{ fontSize: 11, color: t.text3, marginTop: 1 }}>{account.bank} · {account.type === 'cash' ? 'Efectivo' : 'Cuenta bancaria'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 900, color: selected.color }}>{account.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                  <div style={{ fontSize: 10.5, color: t.text3, marginTop: 1 }}>{selected.id}</div>
                </div>
              </div>
            ))}

            <button onClick={navigateToAccounts} style={{ marginTop: 4, width: '100%', height: 46, borderRadius: 23, border: `1px solid ${selected.color}`, background: selected.color + '16', color: selected.color, fontFamily: 'Poppins', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
              Ver todas las cuentas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Widget: Ahorros por cuenta ────────────────────────────────────────────────

const WidgetStatsSavings = ({ theme, onInfo }) => {
  const t = T(theme);
  const total = PELAS_ACCOUNTS.reduce((s, a) => s + a.balance, 0);

  return (
    <div style={{ marginBottom: 18 }}>
      <StatsWidgetTitle theme={theme} title="Ahorros por cuenta" onInfo={onInfo}/>
      <Card theme={theme} padding={18} radius={22}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {PELAS_ACCOUNTS.map(acc => {
            const pct = Math.round((acc.balance / total) * 100);
            return (
              <div key={acc.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: acc.color, flexShrink: 0 }}/>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{acc.name}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{acc.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
                </div>
                <div style={{ width: '100%', height: 5, background: t.surface2, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: acc.color, borderRadius: 3, transition: 'width 0.4s ease' }}/>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// ── Widget: Gasto diario ──────────────────────────────────────────────────────

const WidgetStatsCalendar = ({ theme, onInfo }) => {
  const t = T(theme);
  const [granularity, setGranularity] = useState('day');
  const [monthPageStart, setMonthPageStart] = useState(12);
  const [yearPageStart, setYearPageStart] = useState(4);

  const [dailyMonth, setDailyMonth] = useState(MOCK_TX_MONTH_INDEX);
  const [dailyYear, setDailyYear] = useState(MOCK_TX_YEAR);

  const MOCK_TODAY_DAY = 30;
  const isCurrentMonth = dailyYear === MOCK_TX_YEAR && dailyMonth === MOCK_TX_MONTH_INDEX;
  const dailySpend = {
    1: 18, 2: 42, 4: 12, 7: 68, 8: 24, 10: 52, 12: 35,
    15: 89, 18: 64, 19: 42, 20: 128, 22: 78, 23: 28,
    24: 216, 25: 48, 26: 134, 27: 72, 28: 184, 29: 96, 30: 312,
  };
  const maxDailySpend = Math.max(...Object.values(dailySpend));
  const daysInMonthW = getDaysInMonth(dailyYear, dailyMonth);
  const avgDailySpend = PELAS_BALANCE.expenses / daysInMonthW;
  const weeks = buildMonthWeeks(dailyYear, dailyMonth);

  const changeDailyMonth = (delta) => {
    const next = new Date(dailyYear, dailyMonth + delta, 1);
    setDailyYear(next.getFullYear());
    setDailyMonth(next.getMonth());
  };

  const visibleMonths = CALENDAR_MONTHLY_DATA.slice(monthPageStart, monthPageStart + 6);
  const visibleYears = CALENDAR_YEARLY_DATA.slice(yearPageStart, yearPageStart + 4);
  const maxMonthlyV = Math.max(...visibleMonths.map(d => d.v));
  const avgMonthlySpend = visibleMonths.reduce((sum, d) => sum + d.v, 0) / visibleMonths.length;
  const maxYearlyV = Math.max(...visibleYears.map(d => d.v));
  const avgYearlySpend = visibleYears.reduce((sum, d) => sum + d.v, 0) / visibleYears.length;

  const heatAlpha = (value, max) => {
    const intensity = value / max;
    if (intensity > 0.86) return '80';
    if (intensity > 0.7) return '66';
    if (intensity > 0.52) return '4D';
    if (intensity > 0.34) return '33';
    return '22';
  };
  const heatTextColor = (value, max) => value / max > 0.58 ? '#fff' : t.text;

  const GRAN_OPTS = [
    { id: 'day',   label: 'Diario' },
    { id: 'month', label: 'Mensual' },
    { id: 'year',  label: 'Anual' },
  ];

  const NavArrow = ({ onClick, disabled, name }) => (
    <button onClick={onClick} style={{ width: 28, height: 28, borderRadius: 14, border: `1px solid ${t.border}`, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.3 : 1, flexShrink: 0 }}>
      <PelasIcon name={name} size={13} color={t.text}/>
    </button>
  );

  return (
    <div style={{ marginBottom: 18 }}>
      <StatsWidgetTitle theme={theme} title="Ritmo de gasto" onInfo={onInfo}/>
      <Card theme={theme} padding={16} radius={22} style={{ minHeight: granularity === 'day' ? 318 : 286 }}>
        {/* Segmented control */}
        <div style={{ display: 'flex', gap: 4, padding: 4, background: t.surface2, borderRadius: 12, marginBottom: 14 }}>
          {GRAN_OPTS.map(o => (
            <div key={o.id} onClick={() => setGranularity(o.id)} style={{ flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 500, background: granularity === o.id ? t.accent : 'transparent', color: granularity === o.id ? '#fff' : t.text2, transition: 'all 0.15s' }}>
              {o.label}
            </div>
          ))}
        </div>

        {granularity === 'day' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
              <NavArrow name="arrow-left" disabled={false} onClick={() => changeDailyMonth(-1)}/>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{CALENDAR_MONTH_LABELS[dailyMonth]} {dailyYear}</div>
              </div>
              <NavArrow name="arrow-right" disabled={false} onClick={() => changeDailyMonth(1)}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
              {['L','M','X','J','V','S','D'].map(h => (
                <div key={h} style={{ textAlign: 'center', fontSize: 10, color: t.text3, fontWeight: 700, height: 18, lineHeight: '18px' }}>{h}</div>
              ))}
              {weeks.map((week, wi) =>
                week.map((cell, ci) => {
                  const amount = isCurrentMonth && cell.day ? dailySpend[cell.day] || 0 : 0;
                  const intensity = amount / maxDailySpend;
                  const isToday = isCurrentMonth && cell.day === MOCK_TODAY_DAY;
                  const hA = intensity > 0.74 ? '66' : intensity > 0.46 ? '4D' : intensity > 0.22 ? '33' : '1F';
                  const background = isToday ? t.accent : amount ? t.negative + hA : t.surface2;
                  const color = isToday || intensity > 0.46 ? '#fff' : cell.day ? t.text : 'transparent';
                  return (
                    <div key={`${wi}-${ci}`} style={{ textAlign: 'center', height: 34, lineHeight: '34px', fontSize: 11.5, borderRadius: 9, background, color, fontWeight: isToday || amount ? 700 : 500, border: amount || isToday ? '1px solid transparent' : `1px solid ${t.border}` }}>
                      {cell.day || ''}
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10.5, color: t.text2, marginBottom: 2 }}>Gasto medio diario</div>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.4 }}>{isCurrentMonth ? avgDailySpend.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'} €/día</div>
              </div>
              <div style={{ fontSize: 11, color: t.text3, textAlign: 'right' }}>{CALENDAR_MONTH_LABELS[dailyMonth]}<br/>{isCurrentMonth ? PELAS_BALANCE.expenses.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' €' : '—'}</div>
            </div>
          </div>
        )}

        {granularity === 'month' && (
          <div style={{ paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
              <NavArrow name="arrow-left" disabled={monthPageStart === 0} onClick={() => setMonthPageStart(s => Math.max(0, s - 6))}/>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{visibleMonths[0]?.m} – {visibleMonths[visibleMonths.length - 1]?.m}</div>
              </div>
              <NavArrow name="arrow-right" disabled={monthPageStart + 6 >= CALENDAR_MONTHLY_DATA.length} onClick={() => setMonthPageStart(s => Math.min(CALENDAR_MONTHLY_DATA.length - 6, s + 6))}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {visibleMonths.map(d => {
                const isCurrent = d.year === MOCK_TX_YEAR && d.month === MOCK_TX_MONTH_INDEX;
                return (
                  <div key={d.m} style={{ minHeight: 78, borderRadius: 14, padding: '10px 9px', background: isCurrent ? t.accent : t.negative + heatAlpha(d.v, maxMonthlyV), color: isCurrent ? '#fff' : heatTextColor(d.v, maxMonthlyV), border: `1px solid ${isCurrent ? t.accent : t.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{d.m}</div>
                      {isCurrent && <div style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 5px', borderRadius: 6, background: 'rgba(255,255,255,0.18)' }}>ACT</div>}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>{(d.v / 1000).toFixed(1).replace('.', ',')}k</div>
                      <div style={{ fontSize: 9.5, opacity: 0.8 }}>{d.v.toLocaleString('es-ES')} €</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 11.5, color: t.text2, textAlign: 'center', marginTop: 4 }}>Media mensual: <span style={{ fontWeight: 700, color: t.text }}>{avgMonthlySpend.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €</span></div>
          </div>
        )}

        {granularity === 'year' && (
          <div style={{ paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
              <NavArrow name="arrow-left" disabled={yearPageStart === 0} onClick={() => setYearPageStart(s => Math.max(0, s - 4))}/>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{visibleYears[0]?.m} – {visibleYears[visibleYears.length - 1]?.m}</div>
              </div>
              <NavArrow name="arrow-right" disabled={yearPageStart + 4 >= CALENDAR_YEARLY_DATA.length} onClick={() => setYearPageStart(s => Math.min(CALENDAR_YEARLY_DATA.length - 4, s + 4))}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
              {visibleYears.map(d => {
                const isCurrent = d.year === MOCK_TX_YEAR;
                return (
                  <div key={d.m} style={{ minHeight: 70, borderRadius: 14, padding: '10px 12px', background: isCurrent ? t.accent : t.negative + heatAlpha(d.v, maxYearlyV), color: isCurrent ? '#fff' : heatTextColor(d.v, maxYearlyV), border: `1px solid ${isCurrent ? t.accent : t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{d.m}</div>
                      <div style={{ fontSize: 10, opacity: 0.78, marginTop: 2 }}>{isCurrent ? 'Año actual' : 'Histórico'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.4 }}>{Math.round(d.v / 1000)}k</div>
                      <div style={{ fontSize: 9.5, opacity: 0.8 }}>{d.v.toLocaleString('es-ES')} €</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 11.5, color: t.text2, textAlign: 'center', marginTop: 4 }}>Media anual: <span style={{ fontWeight: 700, color: t.text }}>{avgYearlySpend.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €</span></div>
          </div>
        )}
      </Card>
    </div>
  );
};

const CALENDAR_DAY_HEADERS = ['L','M','X','J','V','S','D'];
const CALENDAR_MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const CALENDAR_MONTHLY_DATA = [
  { m: 'Ene 24', month: 0, year: 2024, v: 1380 },
  { m: 'Feb 24', month: 1, year: 2024, v: 1520 },
  { m: 'Mar 24', month: 2, year: 2024, v: 1640 },
  { m: 'Abr 24', month: 3, year: 2024, v: 1710 },
  { m: 'May 24', month: 4, year: 2024, v: 1480 },
  { m: 'Jun 24', month: 5, year: 2024, v: 1890 },
  { m: 'Jul 24', month: 6, year: 2024, v: 2140 },
  { m: 'Ago 24', month: 7, year: 2024, v: 2240 },
  { m: 'Sep 24', month: 8, year: 2024, v: 1580 },
  { m: 'Oct 24', month: 9, year: 2024, v: 1760 },
  { m: 'Nov 24', month: 10, year: 2024, v: 1620 },
  { m: 'Dic 24', month: 11, year: 2024, v: 2840 },
  { m: 'Ene', month: 0, year: 2025, v: 1480 },
  { m: 'Feb', month: 1, year: 2025, v: 1720 },
  { m: 'Mar', month: 2, year: 2025, v: 1980 },
  { m: 'Abr', month: 3, year: 2025, v: 1842 },
  { m: 'May', month: 4, year: 2025, v: 1650 },
  { m: 'Jun', month: 5, year: 2025, v: 2100 },
];
const CALENDAR_YEARLY_DATA = [
  { m: '2019', year: 2019, v: 14820 },
  { m: '2020', year: 2020, v: 13240 },
  { m: '2021', year: 2021, v: 15680 },
  { m: '2022', year: 2022, v: 18420 },
  { m: '2023', year: 2023, v: 19800 },
  { m: '2024', year: 2024, v: 21200 },
  { m: '2025', year: 2025, v: 22140 },
  { m: '2026', year: 2026, v: 20880 },
];

const toInputDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const buildMonthWeeks = (year, month) => {
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = getDaysInMonth(year, month);
  const weeks = [];
  let day = 1;
  for (let week = 0; week < 6; week++) {
    const cells = [];
    for (let col = 0; col < 7; col++) {
      const isBlank = week === 0 && col < startOffset;
      cells.push({ day: isBlank ? null : day > daysInMonth ? null : day });
      if (!isBlank && day <= daysInMonth) day++;
    }
    weeks.push(cells);
  }
  return weeks.filter(week => week.some(cell => cell.day !== null));
};

const getCalendarSelectionRange = (view, selected) => {
  if (view === 'day') {
    const date = new Date(selected.year, selected.month, selected.day);
    return { from: date, to: date, label: `${selected.day} ${CALENDAR_MONTH_LABELS[selected.month].toLowerCase()} ${selected.year}`, monthIdx: selected.month, ignoreMonth: true };
  }
  if (view === 'month') {
    const yr = selected.year || MOCK_TX_YEAR;
    const from = new Date(yr, selected.month, 1);
    const to = new Date(yr, selected.month + 1, 0);
    return { from, to, label: `${CALENDAR_MONTH_LABELS[selected.month]} ${yr}`, monthIdx: selected.month, ignoreMonth: true };
  }
  const from = new Date(selected.year, 0, 1);
  const to = new Date(selected.year, 11, 31);
  return { from, to, label: `${selected.year}`, monthIdx: MOCK_TX_MONTH_INDEX, ignoreMonth: true };
};

const txMatchesCalendarSelection = (tx, view, selected) => {
  const date = getMockTxDate(tx.date);
  if (view === 'day') return date.getFullYear() === selected.year && date.getMonth() === selected.month && date.getDate() === selected.day;
  if (view === 'month') return date.getFullYear() === (selected.year || MOCK_TX_YEAR) && date.getMonth() === selected.month;
  return date.getFullYear() === selected.year;
};

const WidgetCalendarDetail = ({ theme, onNavigate }) => {
  const t = T(theme);
  const [view, setView] = useState('day');
  const [selectedDay, setSelectedDay] = useState(24);
  const [dailyMonth, setDailyMonth] = useState(MOCK_TX_MONTH_INDEX);
  const [dailyYear, setDailyYear] = useState(MOCK_TX_YEAR);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(15);
  const [monthPageStart, setMonthPageStart] = useState(12);
  const [selectedYearIdx, setSelectedYearIdx] = useState(6);
  const [yearPageStart, setYearPageStart] = useState(4);

  const expenseTxs = PELAS_TRANSACTIONS.filter(tx => tx.amount < 0);
  const accountMap = Object.fromEntries(PELAS_ACCOUNTS.map(a => [a.id, a]));
  const categoryMap = Object.fromEntries(PELAS_CATEGORIES.map(c => [c.id, c]));
  const visibleMonths = CALENDAR_MONTHLY_DATA.slice(monthPageStart, monthPageStart + 6);
  const visibleYears = CALENDAR_YEARLY_DATA.slice(yearPageStart, yearPageStart + 4);
  const maxMonthly = Math.max(...visibleMonths.map(item => item.v));
  const maxYearly = Math.max(...visibleYears.map(item => item.v));
  const dayTotals = expenseTxs.reduce((acc, tx) => {
    const date = getMockTxDate(tx.date);
    if (date.getFullYear() === dailyYear && date.getMonth() === dailyMonth) {
      acc[date.getDate()] = (acc[date.getDate()] || 0) + Math.abs(tx.amount);
    }
    return acc;
  }, {});
  const maxDay = Math.max(...Object.values(dayTotals), 1);

  const selected = view === 'day'
    ? { day: selectedDay, month: dailyMonth, year: dailyYear }
    : view === 'month'
    ? { month: CALENDAR_MONTHLY_DATA[selectedMonthIdx].month, year: CALENDAR_MONTHLY_DATA[selectedMonthIdx].year }
    : { year: CALENDAR_YEARLY_DATA[selectedYearIdx].year };
  const selectedRange = getCalendarSelectionRange(view, selected);
  const selectedTxs = expenseTxs.filter(tx => txMatchesCalendarSelection(tx, view, selected));
  const selectedTotal = selectedTxs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const switchView = (next) => {
    setView(next);
    if (next === 'month') { setSelectedMonthIdx(15); setMonthPageStart(12); }
    if (next === 'year') { setSelectedYearIdx(6); setYearPageStart(4); }
  };

  const changeDailyMonth = (delta) => {
    const next = new Date(dailyYear, dailyMonth + delta, 1);
    const nextYear = next.getFullYear();
    const nextMonth = next.getMonth();
    setDailyYear(nextYear);
    setDailyMonth(nextMonth);
    setSelectedDay(day => Math.min(day, getDaysInMonth(nextYear, nextMonth)));
  };

  const navigateToHistory = () => {
    onNavigate?.('history', {
      monthIdx: selectedRange.monthIdx,
      filters: {
        type: 'expense',
        dateRange: 'custom',
        dateFrom: toInputDate(selectedRange.from),
        dateTo: toInputDate(selectedRange.to),
        ignoreMonth: selectedRange.ignoreMonth,
        sort: 'recent',
      },
    });
  };

  const heatAlpha = (value, max) => {
    const intensity = value / max;
    if (intensity > 0.72) return '66';
    if (intensity > 0.44) return '4D';
    if (intensity > 0.18) return '33';
    return '1F';
  };

  return (
    <div style={{ padding: '0 16px 24px', overflowY: 'auto', flex: 1 }}>
      <Card theme={theme} padding={16} radius={24} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <StatsSegmentedControl
            theme={theme}
            value={view}
            options={[{ id: 'day', label: 'Diario' }, { id: 'month', label: 'Mensual' }, { id: 'year', label: 'Anual' }]}
            onChange={switchView}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginTop: 16, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: t.text2 }}>Periodo seleccionado</div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>{selectedRange.label}</div>
          </div>
          <div style={{ padding: '6px 10px', borderRadius: 12, background: t.negative + '18', color: t.negative, fontSize: 12, fontWeight: 900, flexShrink: 0 }}>
            {selectedTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </div>
        </div>

        {view === 'day' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
              <button onClick={() => changeDailyMonth(-1)} style={{ width: 34, height: 34, borderRadius: 17, border: `1px solid ${t.border}`, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <PelasIcon name="arrow-left" size={15} color={t.text}/>
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 900 }}>{CALENDAR_MONTH_LABELS[dailyMonth]} {dailyYear}</div>
                <div style={{ fontSize: 10.5, color: t.text3, marginTop: 1 }}>Gasto diario</div>
              </div>
              <button onClick={() => changeDailyMonth(1)} style={{ width: 34, height: 34, borderRadius: 17, border: `1px solid ${t.border}`, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <PelasIcon name="arrow-right" size={15} color={t.text}/>
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
              {CALENDAR_DAY_HEADERS.map(h => (
                <div key={h} style={{ textAlign: 'center', fontSize: 10, color: t.text3, fontWeight: 800, height: 18, lineHeight: '18px' }}>{h}</div>
              ))}
              {buildMonthWeeks(dailyYear, dailyMonth).map((week, wi) =>
                week.map((cell, ci) => {
                  const amount = cell.day ? dayTotals[cell.day] || 0 : 0;
                  const active = cell.day === selectedDay;
                  const background = active ? t.accent : amount ? t.negative + heatAlpha(amount, maxDay) : t.surface2;
                  const color = active || amount / maxDay > 0.44 ? '#fff' : cell.day ? t.text : 'transparent';
                  return (
                    <div key={`${wi}-${ci}`} onClick={() => cell.day && setSelectedDay(cell.day)} style={{ textAlign: 'center', height: 36, lineHeight: '36px', fontSize: 11.5, borderRadius: 10, background, color, fontWeight: active || amount ? 800 : 500, border: `1px solid ${active ? t.accent : amount ? 'transparent' : t.border}`, cursor: cell.day ? 'pointer' : 'default' }}>
                      {cell.day || ''}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {view === 'month' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
              <button
                onClick={() => setMonthPageStart(s => Math.max(0, s - 6))}
                style={{ width: 34, height: 34, borderRadius: 17, border: `1px solid ${t.border}`, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: monthPageStart === 0 ? 'default' : 'pointer', opacity: monthPageStart === 0 ? 0.3 : 1, flexShrink: 0 }}>
                <PelasIcon name="arrow-left" size={15} color={t.text}/>
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{visibleMonths[0]?.m} – {visibleMonths[visibleMonths.length - 1]?.m}</div>
                <div style={{ fontSize: 10, color: t.text3, marginTop: 1 }}>Gasto mensual</div>
              </div>
              <button
                onClick={() => setMonthPageStart(s => Math.min(CALENDAR_MONTHLY_DATA.length - 6, s + 6))}
                style={{ width: 34, height: 34, borderRadius: 17, border: `1px solid ${t.border}`, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: monthPageStart + 6 >= CALENDAR_MONTHLY_DATA.length ? 'default' : 'pointer', opacity: monthPageStart + 6 >= CALENDAR_MONTHLY_DATA.length ? 0.3 : 1, flexShrink: 0 }}>
                <PelasIcon name="arrow-right" size={15} color={t.text}/>
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {visibleMonths.map((item, i) => {
                const active = selectedMonthIdx === monthPageStart + i;
                return (
                  <div key={item.m} onClick={() => setSelectedMonthIdx(monthPageStart + i)} style={{ minHeight: 78, borderRadius: 14, padding: '10px 9px', background: active ? t.accent : t.negative + heatAlpha(item.v, maxMonthly), color: active || item.v / maxMonthly > 0.44 ? '#fff' : t.text, border: `1px solid ${active ? t.accent : t.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div style={{ fontSize: 12, fontWeight: 900 }}>{item.m}</div>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 900 }}>{(item.v / 1000).toFixed(1).replace('.', ',')}k</div>
                      <div style={{ fontSize: 9.5, opacity: 0.8 }}>{item.v.toLocaleString('es-ES')} €</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'year' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
              <button
                onClick={() => setYearPageStart(s => Math.max(0, s - 4))}
                style={{ width: 34, height: 34, borderRadius: 17, border: `1px solid ${t.border}`, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: yearPageStart === 0 ? 'default' : 'pointer', opacity: yearPageStart === 0 ? 0.3 : 1, flexShrink: 0 }}>
                <PelasIcon name="arrow-left" size={15} color={t.text}/>
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{visibleYears[0]?.m} – {visibleYears[visibleYears.length - 1]?.m}</div>
                <div style={{ fontSize: 10, color: t.text3, marginTop: 1 }}>Gasto anual</div>
              </div>
              <button
                onClick={() => setYearPageStart(s => Math.min(CALENDAR_YEARLY_DATA.length - 4, s + 4))}
                style={{ width: 34, height: 34, borderRadius: 17, border: `1px solid ${t.border}`, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: yearPageStart + 4 >= CALENDAR_YEARLY_DATA.length ? 'default' : 'pointer', opacity: yearPageStart + 4 >= CALENDAR_YEARLY_DATA.length ? 0.3 : 1, flexShrink: 0 }}>
                <PelasIcon name="arrow-right" size={15} color={t.text}/>
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {visibleYears.map((item, i) => {
                const active = selectedYearIdx === yearPageStart + i;
                return (
                  <div key={item.m} onClick={() => setSelectedYearIdx(yearPageStart + i)} style={{ minHeight: 72, borderRadius: 14, padding: '10px 12px', background: active ? t.accent : t.negative + heatAlpha(item.v, maxYearly), color: active || item.v / maxYearly > 0.44 ? '#fff' : t.text, border: `1px solid ${active ? t.accent : t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900 }}>{item.m}</div>
                      <div style={{ fontSize: 10, opacity: 0.78, marginTop: 2 }}>{item.year === MOCK_TX_YEAR ? 'Año actual' : 'Histórico'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 17, fontWeight: 900 }}>{Math.round(item.v / 1000)}k</div>
                      <div style={{ fontSize: 9.5, opacity: 0.8 }}>{item.v.toLocaleString('es-ES')} €</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>Gastos · {selectedRange.label}</div>
            <div style={{ fontSize: 11, color: t.text3, marginTop: 1 }}>{selectedTxs.length} movimiento{selectedTxs.length === 1 ? '' : 's'}</div>
          </div>
          <div style={{ width: 9, height: 9, borderRadius: 5, background: t.negative, flexShrink: 0 }}/>
        </div>

        {selectedTxs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: t.text3, fontSize: 12 }}>Sin gastos para este periodo</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedTxs.map(tx => {
              const cat = categoryMap[tx.cat];
              const acc = accountMap[tx.account];
              const color = cat?.color || t.negative;
              return (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 16, background: t.surface, border: `1px solid ${t.border}` }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PelasIcon name={cat?.icon || 'card'} size={15} color={color}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.name}</div>
                    <div style={{ fontSize: 11, color: t.text3, marginTop: 1 }}>{acc?.name || tx.card} · {tx.date}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: t.negative, flexShrink: 0 }}>
                    −{Math.abs(tx.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={navigateToHistory} style={{ marginTop: 12, width: '100%', height: 46, borderRadius: 23, border: `1px solid ${t.negative}`, background: t.negative + '16', color: t.negative, fontFamily: 'Poppins', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>
          Ver todos los movimientos
        </button>
      </div>
    </div>
  );
};

// ── Shared map data ───────────────────────────────────────────────────────────

// Geographic Spain outline (viewBox 0 0 380 260, lon -9.5→4.5, lat 35.8→44.2)
const SPAIN_GEO_PATH = 'M209 34 L240 27 L293 55 L339 64 L316 82 L309 90 L277 109 L265 132 L245 145 L260 166 L242 178 L229 199 L198 224 L141 224 L116 241 L110 244 L75 212 L64 210 L72 187 L74 159 L77 116 L79 76 L25 76 L26 66 L15 47 L38 34 L52 22 L64 23 L104 28 L156 31 L179 37 L203 35 Z';
// Geographically positioned cities (same projection as SPAIN_GEO_PATH)
const NATIONAL_CITIES = [
  { city: 'Madrid',    region: 'Comunidad de Madrid',  amount: 742.20, tx: 8, x: 159, y: 118, color: '#E16364' },
  { city: 'Barcelona', region: 'Cataluña',             amount: 428.60, tx: 5, x: 309, y: 90,  color: '#FF8A4C' },
  { city: 'Valencia',  region: 'Comunitat Valenciana', amount: 286.40, tx: 4, x: 245, y: 145, color: '#FFC234' },
  { city: 'Sevilla',   region: 'Andalucía',            amount: 214.90, tx: 3, x: 100, y: 205, color: '#5B8DEF' },
  { city: 'Bilbao',    region: 'País Vasco',           amount: 168.30, tx: 2, x: 179, y: 37,  color: '#7C5CFF' },
  { city: 'Málaga',    region: 'Andalucía',            amount: 132.10, tx: 2, x: 141, y: 224, color: '#3FB984' },
];
const NATIONAL_LOCAL_CITY = 'Valencia';

// Geographic world map — equirectangular 800×400
// x = (lon + 180) * 800/360,  y = (90 - lat) * 400/180
const TRAVEL_COUNTRIES = [
  { country: 'Portugal',  trips: 2, amount: 880,  x: 380, y: 114, color: '#0066FF' },
  { country: 'Francia',   trips: 1, amount: 760,  x: 405, y: 91,  color: '#5B8DEF' },
  { country: 'Italia',    trips: 1, amount: 940,  x: 428, y: 107, color: '#3FB984' },
  { country: 'Marruecos', trips: 1, amount: 620,  x: 382, y: 130, color: '#FFC234' },
  { country: 'Japón',     trips: 1, amount: 3220, x: 710, y: 121, color: '#E16364' },
];

// Simplified continent outlines in the same 800×400 equirectangular projection
const WORLD_MAP_PATHS = [
  // North America
  'M27,42 L33,80 L124,91 L129,116 L156,147 L184,142 L200,136 L222,144 L231,122 L238,109 L260,102 L282,96 L282,82 L253,60 L211,38 L89,38 L89,62 L51,42 Z',
  // Greenland
  'M302,67 L300,31 L356,16 L373,27 L360,42 Z',
  // South America
  'M238,173 L262,178 L322,209 L311,244 L304,251 L271,276 L251,322 L242,267 L229,211 L222,198 L229,187 Z',
  // Europe (incl. NW Russia up to Urals)
  'M380,118 L380,104 L393,102 L411,104 L420,102 L427,100 L438,104 L449,118 L460,118 L473,96 L482,84 L533,78 L511,49 L473,44 L456,42 L431,49 L411,67 L422,67 L422,73 L422,80 L411,82 L404,87 L389,89 L391,93 L396,104 L380,118 Z',
  // Africa
  'M387,120 L422,118 L429,127 L471,131 L511,173 L493,202 L489,213 L478,244 L440,276 L438,264 L427,211 L422,191 L407,187 L398,189 L362,167 L362,149 L371,138 L387,120 Z',
  // Asia (E of Urals + Middle East + South/SE Asia mainland)
  'M533,78 L600,73 L631,84 L700,89 L693,104 L689,122 L671,133 L653,149 L636,171 L631,178 L631,198 L618,182 L609,169 L600,151 L578,171 L571,182 L560,151 L549,144 L527,151 L511,142 L500,169 L480,133 L473,96 L482,84 L533,78 Z',
  // Japan (Honshu simplified)
  'M700,89 L718,100 L718,107 L711,120 L698,124 L693,104 Z',
  // Australia
  'M653,249 L691,227 L700,236 L722,238 L740,260 L736,276 L722,284 L707,278 L658,271 L653,249 Z',
];

// ── Widget: Mapa nacional de gasto ────────────────────────────────────────────

const WidgetStatsNationalHeatmap = ({ theme, onInfo }) => {
  const t = T(theme);
  const visibleCities = NATIONAL_CITIES.filter(c => c.city !== NATIONAL_LOCAL_CITY);
  const maxAmt = Math.max(...visibleCities.map(c => c.amount));
  const nationalSummary = {
    trips: visibleCities.reduce((sum, c) => sum + c.tx, 0),
    cities: visibleCities.length,
    amount: visibleCities.reduce((sum, c) => sum + c.amount, 0),
  };
  const mapFill = theme === 'dark' ? '#2A2C3D' : '#DCE5F5';
  const mapStroke = theme === 'dark' ? '#4A4C62' : '#B0BEDD';
  const seaFill = theme === 'dark' ? '#1A1B2A' : '#EDF1FA';

  return (
    <div style={{ marginBottom: 18 }}>
      <StatsWidgetTitle theme={theme} title="Mapa de calor nacional" onInfo={onInfo}/>
      <Card theme={theme} padding={16} radius={22}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Viajes', value: nationalSummary.trips },
            { label: 'Ciudades', value: nationalSummary.cities },
            { label: 'Gasto fuera', value: `${(nationalSummary.amount / 1000).toFixed(1).replace('.', ',')}k €` },
          ].map(item => (
            <div key={item.label} style={{ padding: '10px 8px', borderRadius: 14, background: t.surface2, textAlign: 'center' }}>
              <div style={{ fontSize: 10.5, color: t.text2, marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ borderRadius: 16, overflow: 'hidden', background: seaFill }}>
          <svg viewBox="0 0 380 260" width="100%" style={{ display: 'block' }}>
            <rect x="0" y="0" width="380" height="260" fill={seaFill}/>
            <path d={SPAIN_GEO_PATH} fill={mapFill} stroke={mapStroke} strokeWidth="1.5" strokeLinejoin="round"/>
            {visibleCities.map(city => {
              const intensity = city.amount / maxAmt;
              const outerR = 7 + intensity * 11;
              const innerR = 3 + intensity * 5;
              return (
                <g key={city.city}>
                  <circle cx={city.x} cy={city.y} r={outerR} fill={city.color} fillOpacity="0.18"/>
                  <circle cx={city.x} cy={city.y} r={innerR} fill={city.color} fillOpacity="0.45"/>
                  <circle cx={city.x} cy={city.y} r="4" fill={city.color} stroke="#fff" strokeWidth="1.2"/>
                  <text x={city.x + 6} y={city.y - 5} fontSize="8" fill={t.text2} fontWeight="700">{city.city}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </Card>
    </div>
  );
};

// ── Widget: Viajes internacionales ────────────────────────────────────────────

const WidgetStatsTravelHeatmap = ({ theme, onInfo }) => {
  const t = T(theme);
  const travelStats = {
    trips: TRAVEL_COUNTRIES.reduce((sum, c) => sum + c.trips, 0),
    countries: TRAVEL_COUNTRIES.length,
    amount: TRAVEL_COUNTRIES.reduce((sum, c) => sum + c.amount, 0),
  };
  const maxAmt = Math.max(...TRAVEL_COUNTRIES.map(c => c.amount));
  const mapFill = theme === 'dark' ? '#2A2C3D' : '#DCE5F5';
  const mapStroke = theme === 'dark' ? '#4A4C62' : '#B0BEDD';
  const seaFill = theme === 'dark' ? '#1A1B2A' : '#EDF1FA';

  return (
    <div style={{ marginBottom: 18 }}>
      <StatsWidgetTitle theme={theme} title="Mapa internacional de viajes" onInfo={onInfo}/>
      <Card theme={theme} padding={16} radius={22}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Viajes', value: travelStats.trips },
            { label: 'Países', value: travelStats.countries },
            { label: 'Gasto', value: `${(travelStats.amount / 1000).toFixed(1).replace('.', ',')}k €` },
          ].map(item => (
            <div key={item.label} style={{ padding: '10px 8px', borderRadius: 14, background: t.surface2, textAlign: 'center' }}>
              <div style={{ fontSize: 10.5, color: t.text2, marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ borderRadius: 16, overflow: 'hidden', background: seaFill }}>
          <svg viewBox="0 0 800 400" width="100%" style={{ display: 'block' }}>
            <rect x="0" y="0" width="800" height="400" fill={seaFill}/>
            {WORLD_MAP_PATHS.map((d, i) => (
              <path key={i} d={d} fill={mapFill} stroke={mapStroke} strokeWidth="1.2" strokeLinejoin="round"/>
            ))}
            {TRAVEL_COUNTRIES.map(country => {
              const intensity = country.amount / maxAmt;
              const outerR = 14 + intensity * 22;
              const innerR = 6 + intensity * 10;
              return (
                <g key={country.country}>
                  <circle cx={country.x} cy={country.y} r={outerR} fill={country.color} fillOpacity="0.18"/>
                  <circle cx={country.x} cy={country.y} r={innerR} fill={country.color} fillOpacity="0.45"/>
                  <circle cx={country.x} cy={country.y} r="8" fill={country.color} stroke="#fff" strokeWidth="2.4"/>
                  <text x={country.x + 11} y={country.y - 9} fontSize="14" fill={t.text2} fontWeight="700">{country.country}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </Card>
    </div>
  );
};

// ── Widget: Suscripciones digitales ───────────────────────────────────────────

const WidgetStatsSubscriptions = ({ theme, onInfo }) => {
  const t = T(theme);
  const subscriptions = [
    { name: 'Spotify',  plan: 'Premium', amount: 10.99, cycle: '15 may', color: '#1DB954', icon: 'play' },
    { name: 'Netflix',  plan: 'Estándar', amount: 12.99, cycle: '18 may', color: '#E50914', icon: 'play' },
    { name: 'iCloud+',  plan: '2 TB', amount: 9.99, cycle: '20 may', color: '#5B8DEF', icon: 'refresh' },
    { name: 'Notion',   plan: 'Plus', amount: 9.50, cycle: '27 may', color: '#A2A2A7', icon: 'book' },
    { name: 'YouTube',  plan: 'Premium', amount: 13.99, cycle: '2 jun', color: '#FF0033', icon: 'play' },
  ];
  const total = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
  const annualProjection = total * 12;

  return (
    <div style={{ marginBottom: 18 }}>
      <StatsWidgetTitle theme={theme} title="Suscripciones digitales" onInfo={onInfo}/>
      <Card theme={theme} padding={18} radius={22}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 10, marginBottom: 16 }}>
          <div style={{ padding: '14px 12px', borderRadius: 16, background: t.surface2 }}>
            <div style={{ fontSize: 10.5, color: t.text2, marginBottom: 5 }}>Total activas</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.6 }}>{subscriptions.length}</div>
          </div>
          <div style={{ padding: '14px 12px', borderRadius: 16, background: t.accentSoft }}>
            <div style={{ fontSize: 10.5, color: t.text2, marginBottom: 5 }}>Gasto mensual</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, color: t.accent }}>{total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
            <div style={{ fontSize: 10.5, color: t.text3, marginTop: 2 }}>{annualProjection.toLocaleString('es-ES', { maximumFractionDigits: 0 })} € al año</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {subscriptions.map(sub => (
            <div key={sub.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 12, background: sub.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PelasIcon name={sub.icon} size={14} color={sub.color}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{sub.name}</div>
                <div style={{ fontSize: 10.5, color: t.text3 }}>{sub.plan} · Próximo cargo {sub.cycle}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{sub.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ── Widget: Gastos recurrentes anuales ────────────────────────────────────────

const WidgetStatsRecurringAnnual = ({ theme, onInfo }) => {
  const t = T(theme);
  const recurringExpenses = [
    { label: 'Alquiler', detail: 'Vivienda principal', annual: 12000, cadence: 'Mensual', icon: 'home', color: '#0066FF' },
    { label: 'Domiciliaciones', detail: 'Comunidad y recibos fijos', annual: 540, cadence: 'Mensual', icon: 'refresh', color: '#7C5CFF' },
    { label: 'Luz', detail: 'Electricidad', annual: 937.20, cadence: 'Mensual', icon: 'sun', color: '#FFC234' },
    { label: 'Agua', detail: 'Suministro hogar', annual: 294, cadence: 'Bimestral', icon: 'down', color: '#5B8DEF' },
    { label: 'Gas', detail: 'Calefacción y cocina', annual: 537.60, cadence: 'Mensual', icon: 'home', color: '#FF8A4C' },
    { label: 'Internet', detail: 'Fibra y móvil', annual: 479.88, cadence: 'Mensual', icon: 'wifi-pay', color: '#3FB984' },
    { label: 'Seguro coche', detail: 'Póliza anual', annual: 480, cadence: 'Anual', icon: 'car', color: '#E16364' },
  ];
  const annualTotal = recurringExpenses.reduce((sum, expense) => sum + expense.annual, 0);
  const monthlyAverage = annualTotal / 12;
  const maxAnnual = Math.max(...recurringExpenses.map(expense => expense.annual));

  return (
    <div style={{ marginBottom: 18 }}>
      <StatsWidgetTitle theme={theme} title="Gastos recurrentes anuales" onInfo={onInfo}/>
      <Card theme={theme} padding={18} radius={22}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, marginBottom: 16 }}>
          <div style={{ padding: '14px 12px', borderRadius: 16, background: t.accentSoft }}>
            <div style={{ fontSize: 10.5, color: t.text2, marginBottom: 5 }}>Total anual</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, color: t.accent }}>{annualTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
          </div>
          <div style={{ padding: '14px 12px', borderRadius: 16, background: t.surface2 }}>
            <div style={{ fontSize: 10.5, color: t.text2, marginBottom: 5 }}>Media mensual</div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>{monthlyAverage.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
            <div style={{ fontSize: 10.5, color: t.text3, marginTop: 2 }}>{recurringExpenses.length} gastos fijos</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recurringExpenses.map(expense => {
            const pct = Math.round((expense.annual / maxAnnual) * 100);
            return (
              <div key={expense.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 12, background: expense.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PelasIcon name={expense.icon} size={14} color={expense.color}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{expense.label}</div>
                    <div style={{ fontSize: 10.5, color: t.text3 }}>{expense.detail} · {expense.cadence}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>{expense.annual.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €</div>
                    <div style={{ fontSize: 10.5, color: t.text3 }}>{(expense.annual / 12).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/mes</div>
                  </div>
                </div>
                <Progress value={pct} color={expense.color} track={t.surface2} height={5}/>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// ── Widget: Cumplimiento de presupuestos ──────────────────────────────────────

const WidgetStatsBudgetRate = ({ theme, onInfo }) => {
  const t = T(theme);
  const metCount = PELAS_BUDGETS.filter(b => b.spent <= b.budget).length;
  const successRate = Math.round((metCount / PELAS_BUDGETS.length) * 100);

  const r = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * r;
  const arcLength = (successRate / 100) * circumference;
  const cx = 54;
  const cy = 54;
  const size = 108;

  return (
    <div style={{ marginBottom: 18 }}>
      <StatsWidgetTitle theme={theme} title="Cumplimiento de presupuestos" onInfo={onInfo}/>
      <Card theme={theme} padding={18} radius={22}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          {/* Arc progress */}
          <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke={t.surface2} strokeWidth={strokeWidth}/>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke={t.positive} strokeWidth={strokeWidth}
                strokeDasharray={`${arcLength} ${circumference - arcLength}`}
                strokeDashoffset={0} strokeLinecap="round"/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: t.positive }}>{successRate}%</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text, lineHeight: 1.35 }}>
              de presupuestos<br/>cumplidos este mes
            </div>
            <div style={{ fontSize: 11.5, color: t.text2, marginTop: 4 }}>{metCount} de {PELAS_BUDGETS.length} categorías</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PELAS_BUDGETS.map(b => {
            const met = b.spent <= b.budget;
            const pct = Math.round((b.spent / b.budget) * 100);
            return (
              <div key={b.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: b.color, flexShrink: 0 }}/>
                  <div style={{ flex: 1, fontSize: 12.5, fontWeight: 500 }}>{b.label}</div>
                  <div style={{ fontSize: 11.5, color: t.text2 }}>{b.spent}€/{b.budget}€</div>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: met ? t.positive + '25' : t.negative + '25', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PelasIcon name={met ? 'check' : 'x'} size={10} color={met ? t.positive : t.negative} strokeWidth={2.5}/>
                  </div>
                </div>
                <Progress value={pct} color={met ? t.positive : t.negative} track={t.surface2} height={5}/>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// ── Widget: Progreso de metas ─────────────────────────────────────────────────

const WidgetStatsGoalsRate = ({ theme, onInfo }) => {
  const t = T(theme);
  const goals = PELAS_GOALS.map(goal => {
    const pct = Math.round((goal.saved / goal.target) * 100);
    let status = 'Retrasada';
    let statusColor = '#FFC234';
    let success = false;

    if (pct >= 100) {
      status = 'Cumplida';
      statusColor = t.positive;
      success = true;
    } else if (pct >= 30) {
      status = 'En ruta';
      statusColor = goal.color;
      success = true;
    }

    return { ...goal, pct, status, statusColor, success };
  });
  const successCount = goals.filter(goal => goal.success).length;
  const overallPct = Math.round((successCount / goals.length) * 100);

  return (
    <div style={{ marginBottom: 18 }}>
      <StatsWidgetTitle theme={theme} title="Tasa de éxito de metas" onInfo={onInfo}/>
      <Card theme={theme} padding={18} radius={22}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${t.border}` }}>
          <div style={{ width: 58, height: 58, borderRadius: 29, background: t.positive + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: t.positive }}>{overallPct}%</div>
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{successCount} de {goals.length} metas van según plan</div>
            <div style={{ fontSize: 11.5, color: t.text2, marginTop: 2 }}>Cuenta metas cumplidas y en ruta</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {goals.map(g => {
            return (
              <div key={g.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 16, background: g.color + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PelasIcon name={g.icon} size={14} color={g.color}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{g.label}</div>
                    <div style={{ fontSize: 10.5, color: t.text3 }}>Vence: {g.due}</div>
                  </div>
                  <div style={{ background: g.statusColor + '20', color: g.statusColor, fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, flexShrink: 0 }}>
                    {g.status}
                  </div>
                </div>
                <Progress value={g.pct} color={g.color} track={t.surface2} height={6}/>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <div style={{ fontSize: 11, color: t.text2 }}>{g.saved.toLocaleString('es-ES')} € / {g.target.toLocaleString('es-ES')} €</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: g.color, background: g.color + '18', padding: '2px 7px', borderRadius: 6 }}>{g.pct}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// ── Widget config sheet (slide from bottom) ───────────────────────────────────

const STATS_WIDGET_LIBRARY = [
  { id: 'stats-balance', label: 'Balance del mes', icon: 'chart', color: '#0066FF', enabled: true, component: WidgetStatsBalance },
  { id: 'stats-evolution', label: 'Evolución del saldo', icon: 'trending', color: '#3FB984', enabled: true, component: WidgetStatsEvolution },
  { id: 'stats-combined', label: 'Gastos e ingresos', icon: 'chart', color: '#7C5CFF', enabled: true, component: WidgetStatsCombined },
  { id: 'stats-currencies', label: 'Patrimonio por divisa', icon: 'globe', color: '#3FB984', enabled: true, component: WidgetStatsCurrencies },
  { id: 'stats-savings', label: 'Ahorros por cuenta', icon: 'wallet', color: '#FFC234', enabled: true, component: WidgetStatsSavings },
  { id: 'stats-calendar', label: 'Ritmo de gasto', icon: 'calendar', color: '#5B8DEF', enabled: true, component: WidgetStatsCalendar },
  { id: 'stats-national-heatmap', label: 'Mapa de calor nacional', icon: 'globe', color: '#E16364', enabled: true, component: WidgetStatsNationalHeatmap },
  { id: 'stats-travel-heatmap', label: 'Mapa internacional de viajes', icon: 'globe', color: '#5B8DEF', enabled: true, component: WidgetStatsTravelHeatmap },
  { id: 'stats-subscriptions', label: 'Suscripciones digitales', icon: 'refresh', color: '#1DB954', enabled: true, component: WidgetStatsSubscriptions },
  { id: 'stats-recurring-annual', label: 'Gastos recurrentes anuales', icon: 'home', color: '#0066FF', enabled: true, component: WidgetStatsRecurringAnnual },
  { id: 'stats-budget-rate', label: 'Cumplimiento de presupuestos', icon: 'chart', color: '#3FB984', enabled: true, component: WidgetStatsBudgetRate },
  { id: 'stats-goals-rate', label: 'Tasa de éxito de metas', icon: 'goal', color: '#7C5CFF', enabled: true, component: WidgetStatsGoalsRate },
  { id: 'stats-trend', label: 'Tendencia de gasto', icon: 'trending', color: '#FF8A4C', enabled: true, component: WidgetStatsTrend },
];

const DEFAULT_STATS_WIDGETS = STATS_WIDGET_LIBRARY.map(widget => ({
  id: widget.id,
  label: widget.label,
  icon: widget.icon,
  enabled: widget.enabled,
}));
const WIDGET_COLORS = Object.fromEntries(STATS_WIDGET_LIBRARY.map(widget => [widget.id, widget.color]));
const WIDGET_COMPONENTS = Object.fromEntries(STATS_WIDGET_LIBRARY.map(widget => [widget.id, widget.component]));

const StatsConfigSheet = ({ theme, widgets, setWidgets, onClose }) => {
  const t = T(theme);
  const dragIndex = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  const toggle = (id) => setWidgets(ws => ws.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  const onDragStart = (i) => { dragIndex.current = i; };
  const onDragOver = (e, i) => { e.preventDefault(); if (dragIndex.current !== null && dragIndex.current !== i) setDragOver(i); };
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

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', maxHeight: '88%', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease-out' }}>
        <div style={{ padding: '14px 22px 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 14px' }}/>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 600 }}>Personalizar estadísticas</div>
              <div style={{ fontSize: 11.5, color: t.text2, marginTop: 2 }}>Activa, desactiva y arrastra para reordenar</div>
            </div>
            <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PelasIcon name="x" size={15} color={t.text2}/>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 22px 0' }}>
          {widgets.map((w, i) => {
            const color = WIDGET_COLORS[w.id] || t.accent;
            return (
              <div key={w.id} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDrop={e => onDrop(e, i)} onDragEnd={onDragEnd}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', marginBottom: 8, borderRadius: 16, background: dragOver === i ? t.accentSoft : t.surface, border: `1px solid ${dragOver === i ? t.accent : t.border}`, transition: 'all 0.12s', cursor: 'grab' }}>
                <div style={{ opacity: 0.4, flexShrink: 0 }}><GripIcon color={t.text}/></div>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PelasIcon name={w.icon} size={16} color={color}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: w.enabled ? t.text : t.text2 }}>{w.label}</div>
                  <div style={{ fontSize: 11, color: t.text3, marginTop: 1 }}>{w.enabled ? 'Visible' : 'Oculto'}</div>
                </div>
                <Toggle on={w.enabled} color={color} onChange={() => toggle(w.id)}/>
              </div>
            );
          })}
        </div>
        <div style={{ padding: '14px 22px 22px', flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: t.accent, color: '#fff', fontFamily: 'Poppins', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Listo</button>
        </div>
      </div>
    </div>
  );
};

// ── Widget detail screens ─────────────────────────────────────────────────────

const StatsDetailHeader = ({ theme, title, onBack, onFilter, filtersActive }) => {
  const t = T(theme);
  return (
    <div style={{ padding: '8px 22px 14px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
      <div onClick={onBack} style={{ width: 38, height: 38, borderRadius: 19, background: t.surface, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        <PelasIcon name="arrow-left" size={17} color={t.text}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontSize: 11.5, color: t.text2, marginTop: 1 }}>Detalle interactivo</div>
      </div>
      {onFilter && (
        <div onClick={onFilter} style={{ position: 'relative', width: 38, height: 38, borderRadius: 19, background: filtersActive ? t.accentSoft : t.surface, border: `1px solid ${filtersActive ? t.accent : t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}>
          <PelasIcon name="filter" size={16} color={filtersActive ? t.accent : t.text}/>
          {filtersActive && (
            <div style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 4, background: t.accent, border: `1.5px solid ${t.bg}` }}/>
          )}
        </div>
      )}
    </div>
  );
};

const DetailChipRow = ({ theme, value, options, onChange }) => (
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
    {options.map(option => (
      <button key={option.id} onClick={() => onChange(option.id)} style={{ border: 'none', borderRadius: 10, padding: '7px 10px', background: value === option.id ? T(theme).accent : T(theme).surface2, color: value === option.id ? '#fff' : T(theme).text2, fontFamily: 'Poppins', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
        {option.label}
      </button>
    ))}
  </div>
);

const DetailBars = ({ theme, rows, metric, selected, onSelect }) => {
  const t = T(theme);
  const values = rows.map(row => metric === 'income' ? row.income : metric === 'expenses' ? row.expenses : row.v);
  const max = Math.max(...values.map(v => Math.abs(v))) || 1;
  const color = metric === 'income' ? t.positive : metric === 'expenses' ? t.negative : t.accent;

  return (
    <div style={{ height: 220, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '12px 4px 0' }}>
      {rows.map((row, index) => {
        const value = values[index];
        const active = selected === index;
        const height = Math.max(18, (Math.abs(value) / max) * 154);
        return (
          <div key={row.m} onClick={() => onSelect(index)} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <div style={{ height: 30, fontSize: 10.5, color: active ? color : t.text3, fontWeight: active ? 800 : 500, textAlign: 'center' }}>
              {active ? `${value.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€` : ''}
            </div>
            <div style={{ width: '72%', height, borderRadius: 8, background: active ? color : color + '33', border: `1px solid ${active ? color : t.border}`, transition: 'height 0.2s, background 0.2s' }}/>
            <div style={{ fontSize: 10.5, color: active ? t.text : t.text3, fontWeight: active ? 800 : 500 }}>{row.m}</div>
          </div>
        );
      })}
    </div>
  );
};

const METRIC_LABELS = { net: 'Balance neto', income: 'Ingresos', expenses: 'Gastos' };
const VIEW_LABELS   = { month: 'Mensual', year: 'Anual' };

const WidgetBalanceDetail = ({ theme, filters = BALANCE_FILTER_DEFAULT, onNavigate }) => {
  const t = T(theme);
  const { chartView = 'month', metric = 'net' } = filters;
  const [selected, setSelected] = useState(PELAS_MONTHLY.length - 1);

  const monthlyRows = PELAS_MONTHLY.map((row, index) => {
    const isCurrent = index === PELAS_MONTHLY.length - 1;
    const income = isCurrent ? PELAS_BALANCE.income : row.i;
    const expenses = isCurrent ? PELAS_BALANCE.expenses : row.v;
    return { m: row.m, v: income - expenses, income, expenses };
  });
  const yearlyRows = [
    { m: '2022', v: 1380, income: 24780, expenses: 23400 },
    { m: '2023', v: 2860, income: 28620, expenses: 25760 },
    { m: '2024', v: 4180, income: 31840, expenses: 27660 },
    { m: '2025', v: 6360, income: 35420, expenses: 29060 },
    { m: '2026', v: 8020, income: 37120, expenses: 29100 },
  ];
  const rows = chartView === 'month' ? monthlyRows : yearlyRows;
  const safeSelected = Math.min(selected, rows.length - 1);
  const current = rows[safeSelected];
  const currentValue = metric === 'income' ? current.income : metric === 'expenses' ? current.expenses : current.v;
  const valueColor = metric === 'expenses' ? t.negative : currentValue >= 0 ? t.positive : t.negative;

  const hasFilters = chartView !== 'month' || metric !== 'net' || filters.accounts.length > 0 || filters.categories.length > 0;

  // ── Transaction filtering ────────────────────────────────────────────────────
  const accountMap = Object.fromEntries(PELAS_ACCOUNTS.map(a => [a.id, a]));
  const categoryMap = Object.fromEntries(PELAS_CATEGORIES.map(c => [c.id, c]));

  const filteredTxs = PELAS_TRANSACTIONS.filter(tx => {
    if (filters.accounts.length > 0 && !filters.accounts.includes(tx.account)) return false;
    if (filters.categories.length > 0 && !filters.categories.includes(tx.cat)) return false;
    if (metric === 'income' && tx.amount <= 0) return false;
    if (metric === 'expenses' && tx.amount >= 0) return false;
    return true;
  });

  const MAX_SHOWN = 5;
  const shownTxs  = filteredTxs.slice(0, MAX_SHOWN);
  const hasMore   = filteredTxs.length > MAX_SHOWN;

  return (
    <div style={{ padding: '0 16px 24px', overflowY: 'auto', flex: 1 }}>
      {/* Filter summary */}
      {hasFilters && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, padding: '8px 14px', marginBottom: 12, borderRadius: 12, background: t.accentSoft, border: `1px solid ${t.accent}30` }}>
          <PelasIcon name="filter" size={13} color={t.accent}/>
          <div style={{ fontSize: 12, color: t.accent, fontWeight: 600 }}>
            {VIEW_LABELS[chartView]} · {METRIC_LABELS[metric]}
            {filters.accounts.length > 0 && ` · ${filters.accounts.map(id => accountMap[id]?.name || id).join(', ')}`}
            {filters.categories.length > 0 && ` · ${filters.categories.map(id => categoryMap[id]?.label || id).join(', ')}`}
          </div>
        </div>
      )}

      {/* Value card */}
      <Card theme={theme} padding={18} radius={22} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: t.text2, marginBottom: 2 }}>{METRIC_LABELS[metric]}</div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, color: valueColor }}>
              {metric !== 'expenses' && (currentValue >= 0 ? '+' : '−')}{Math.abs(currentValue).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
              <div style={{ fontSize: 11.5, color: t.positive, fontWeight: 600 }}>↑ {current.income.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €</div>
              <div style={{ fontSize: 11.5, color: t.negative, fontWeight: 600 }}>↓ {current.expenses.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €</div>
            </div>
          </div>
          <div style={{ padding: '8px 12px', borderRadius: 12, background: t.surface2, color: t.text, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{current.m}</div>
        </div>
      </Card>

      {/* Chart card */}
      <Card theme={theme} padding={16} radius={24} style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11.5, color: t.text2, marginBottom: 4 }}>Toca una barra para ver el importe</div>
        <DetailBars theme={theme} rows={rows} metric={metric} selected={safeSelected} onSelect={setSelected}/>
      </Card>

      {/* Transactions */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 10 }}>
          Movimientos · {current.m}
          <span style={{ fontSize: 11, fontWeight: 400, color: t.text3, marginLeft: 6 }}>({filteredTxs.length})</span>
        </div>

        {shownTxs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: t.text3, fontSize: 12 }}>
            Sin movimientos para este filtro
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {shownTxs.map(tx => {
              const cat = categoryMap[tx.cat];
              const acc = accountMap[tx.account];
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 16, background: t.surface, border: `1px solid ${t.border}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: (cat?.color || t.accent) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PelasIcon name={cat?.icon || 'card'} size={15} color={cat?.color || t.accent}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.name}</div>
                    <div style={{ fontSize: 11, color: t.text3, marginTop: 1 }}>{acc?.name || tx.card} · {tx.date}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isPositive ? t.positive : t.negative, flexShrink: 0 }}>
                    {isPositive ? '+' : ''}{tx.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasMore && (
          <div onClick={() => onNavigate?.('history')} style={{ marginTop: 10, width: '100%', padding: '12px 0', borderRadius: 16, border: `1px solid ${t.border}`, background: 'transparent', color: t.accent, fontFamily: 'Poppins', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
            Ver todos ({filteredTxs.length} movimientos)
          </div>
        )}
      </div>
    </div>
  );
};

// ── Detail: Gastos e ingresos ─────────────────────────────────────────────────

const COMBINED_FILTER_DEFAULT = {
  account: 'all',
  period: 'month',
  dateFrom: '',
  dateTo: '',
  categories: [],
};

const COMBINED_PERIOD_OPTIONS = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: '3months', label: '3 meses' },
  { id: 'year', label: 'Año' },
  { id: 'all', label: 'Todo' },
  { id: 'custom', label: 'Personalizado' },
];

const COMBINED_PERIOD_LABELS = {
  today: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
  '3months': 'Últimos 3 meses',
  year: 'Este año',
  all: 'Todo',
  custom: 'Personalizado',
};

const combinedKey = (item) => `${item.type}:${item.id}`;
const formatMoney = (amount, decimals = 0) => `${amount.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} €`;

const InteractiveDetailDonut = ({ theme, data, selectedKey, onSelect, size = 128, thickness = 17 }) => {
  const t = T(theme);
  const total = data.reduce((s, d) => s + d.amount, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const segments = data.map((item, index) => {
    const before = data.slice(0, index).reduce((s, d) => s + d.amount, 0);
    const len = total > 0 ? (item.amount / total) * c : 0;
    return { item, len, off: total > 0 ? c - ((before / total) * c) : c };
  });

  return (
    <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.surface2} strokeWidth={thickness}/>
      {total > 0 && segments.map(({ item, len, off }) => {
        const active = selectedKey === combinedKey(item);
        return (
          <circle
            key={combinedKey(item)}
            onClick={(e) => { e.stopPropagation(); onSelect(item); }}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={item.color}
            strokeWidth={active ? thickness + 4 : thickness}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={off}
            strokeLinecap="butt"
            opacity={active ? 1 : 0.48}
            style={{ cursor: 'pointer', transition: 'opacity 0.15s, stroke-width 0.15s' }}
          />
        );
      })}
    </svg>
  );
};

const CombinedDonutPanel = ({ theme, title, total, color, data, selectedKey, onSelect }) => {
  const t = T(theme);
  const selectedItem = data.find(item => selectedKey === combinedKey(item)) || data[0] || null;
  const selectedPct = selectedItem && total > 0 ? Math.round((selectedItem.amount / total) * 100) : 0;

  return (
    <div style={{ borderRadius: 20, background: t.surface, border: `1px solid ${t.border}`, padding: 16, minHeight: 254, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: t.text2 }}>{title}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color }}>{formatMoney(total)}</div>
        </div>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: color, flexShrink: 0 }}/>
      </div>
      <div style={{ position: 'relative', width: 148, height: 148, margin: '0 auto 14px' }}>
        <InteractiveDetailDonut theme={theme} data={data} selectedKey={selectedKey} onSelect={onSelect} size={148} thickness={18}/>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9.5, color: t.text3 }}>Total</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: t.text }}>{Math.round(total).toLocaleString('es-ES')}€</div>
          </div>
        </div>
      </div>
      {selectedItem ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 14, background: selectedItem.color + '18', border: `1px solid ${selectedItem.color}55` }}>
          <div style={{ width: 34, height: 34, borderRadius: 11, background: selectedItem.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PelasIcon name={selectedItem.icon || 'card'} size={14} color={selectedItem.color}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedItem.label}</div>
            <div style={{ fontSize: 11, color: t.text3, marginTop: 1 }}>{selectedPct}% del total</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: selectedItem.color, flexShrink: 0 }}>{formatMoney(selectedItem.amount)}</div>
        </div>
      ) : (
        <div style={{ fontSize: 11.5, color: t.text3, textAlign: 'center', padding: '13px 0' }}>Sin datos</div>
      )}
    </div>
  );
};

const CombinedDonutCarousel = ({ theme, view, onViewChange, expenseTotal, incomeTotal, expenseSegments, incomeSegments, selectedKey, onSelect }) => {
  const t = T(theme);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const activeIndex = view === 'income' ? 1 : 0;

  const goTo = (nextView) => {
    onViewChange(nextView);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 45 && Math.abs(dx) > dy) {
      goTo(dx < 0 ? 'income' : 'expense');
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ position: 'relative', overflow: 'hidden', borderRadius: 20 }}>
        <div style={{ display: 'flex', transform: `translateX(-${activeIndex * 100}%)`, transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0.18, 1)' }}>
          <div style={{ minWidth: '100%' }}>
            <CombinedDonutPanel theme={theme} title="Gastos" total={expenseTotal} color={t.negative} data={expenseSegments} selectedKey={selectedKey} onSelect={onSelect}/>
          </div>
          <div style={{ minWidth: '100%' }}>
            <CombinedDonutPanel theme={theme} title="Ingresos" total={incomeTotal} color={t.positive} data={incomeSegments} selectedKey={selectedKey} onSelect={onSelect}/>
          </div>
        </div>

        <button onClick={() => goTo('expense')} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: 16, border: `1px solid ${view === 'expense' ? t.border : t.borderStrong}`, background: view === 'expense' ? t.surface2 + '99' : t.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: view === 'expense' ? 'default' : 'pointer', opacity: view === 'expense' ? 0.35 : 1 }}>
          <PelasIcon name="arrow-left" size={14} color={t.text}/>
        </button>
        <button onClick={() => goTo('income')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: 16, border: `1px solid ${view === 'income' ? t.border : t.borderStrong}`, background: view === 'income' ? t.surface2 + '99' : t.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: view === 'income' ? 'default' : 'pointer', opacity: view === 'income' ? 0.35 : 1 }}>
          <PelasIcon name="arrow-right" size={14} color={t.text}/>
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginTop: 10 }}>
        {[
          { id: 'expense', color: t.negative },
          { id: 'income', color: t.positive },
        ].map(item => (
          <div key={item.id} onClick={() => goTo(item.id)} style={{ width: view === item.id ? 18 : 7, height: 7, borderRadius: 7, background: view === item.id ? item.color : t.borderStrong, cursor: 'pointer', transition: 'all 0.18s' }}/>
        ))}
      </div>
    </div>
  );
};

const CombinedFilterDrawer = ({ theme, filters, onApply, onClose }) => {
  const t = T(theme);
  const [local, setLocal] = useState(filters);

  const reset = () => setLocal(COMBINED_FILTER_DEFAULT);
  const apply = () => { onApply(local); onClose(); };
  const toggleCategory = (id) => setLocal(f => {
    const categories = f.categories.includes(id) ? f.categories.filter(cat => cat !== id) : [...f.categories, id];
    return { ...f, categories };
  });

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface2, color: t.text, fontFamily: 'Poppins', fontSize: 12, outline: 'none', boxSizing: 'border-box' };
  const sectionLabel = { fontSize: 10.5, fontWeight: 700, color: t.text3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 };
  const accounts = [{ id: 'all', name: 'Todas las cuentas', bank: 'Pelas', color: t.accent, icon: 'wallet' }, ...PELAS_ACCOUNTS];

  const Checkbox = ({ checked, color }) => (
    <div style={{ width: 19, height: 19, borderRadius: 6, border: `2px solid ${checked ? color : t.border}`, background: checked ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {checked && <PelasIcon name="check" size={10} color="#fff" strokeWidth={2.6}/>}
    </div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '84%', background: t.bg, borderLeft: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.25s ease-out' }}>

        <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${t.border}`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <PelasIcon name="x" size={14} color={t.text2}/>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Filtros</div>
            <div style={{ fontSize: 11, color: t.text2, marginTop: 1 }}>Gastos e ingresos</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 8px' }}>
          <div style={{ marginBottom: 22 }}>
            <div style={sectionLabel}>Periodo</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {COMBINED_PERIOD_OPTIONS.map(period => (
                <div key={period.id} onClick={() => setLocal(f => ({ ...f, period: period.id }))} style={{ padding: '7px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: local.period === period.id ? t.accent : t.surface2, color: local.period === period.id ? '#fff' : t.text2, transition: 'all 0.15s' }}>
                  {period.label}
                </div>
              ))}
            </div>
          </div>

          {local.period === 'custom' && (
            <div style={{ marginBottom: 22 }}>
              <div style={sectionLabel}>Rango personalizado</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, color: t.text2, marginBottom: 5 }}>Desde</div>
                  <input type="date" value={local.dateFrom} onChange={e => setLocal(f => ({ ...f, dateFrom: e.target.value }))} style={inputStyle}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, color: t.text2, marginBottom: 5 }}>Hasta</div>
                  <input type="date" value={local.dateTo} onChange={e => setLocal(f => ({ ...f, dateTo: e.target.value }))} style={inputStyle}/>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 22 }}>
            <div style={sectionLabel}>Cuenta</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {accounts.map(acc => {
                const selected = local.account === acc.id;
                return (
                  <div key={acc.id} onClick={() => setLocal(f => ({ ...f, account: acc.id }))} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 12px', borderRadius: 14, background: selected ? acc.color + '18' : t.surface, border: `1px solid ${selected ? acc.color : t.border}`, transition: 'all 0.15s' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: acc.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <PelasIcon name={acc.icon || 'card'} size={14} color={acc.color}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: selected ? 700 : 500, color: selected ? acc.color : t.text }}>{acc.name}</div>
                      <div style={{ fontSize: 10.5, color: t.text3, marginTop: 1 }}>{acc.bank}</div>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${selected ? acc.color : t.border}`, background: selected ? acc.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {selected && <div style={{ width: 6, height: 6, borderRadius: 3, background: '#fff' }}/>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={sectionLabel}>Categorías <span style={{ fontWeight: 400, fontSize: 10, textTransform: 'none' }}>(vacío = todas)</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PELAS_CATEGORIES.map(cat => {
                const checked = local.categories.includes(cat.id);
                return (
                  <div key={cat.id} onClick={() => toggleCategory(cat.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '9px 12px', borderRadius: 13, background: checked ? cat.color + '18' : t.surface, border: `1px solid ${checked ? cat.color : t.border}`, transition: 'all 0.15s' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 10, background: cat.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <PelasIcon name={cat.icon} size={13} color={cat.color}/>
                    </div>
                    <div style={{ flex: 1, fontSize: 12.5, fontWeight: checked ? 700 : 500, color: checked ? cat.color : t.text }}>{cat.label}</div>
                    <Checkbox checked={checked} color={cat.color}/>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 18px 24px', borderTop: `1px solid ${t.border}`, flexShrink: 0, display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{ flex: 1, height: 46, borderRadius: 23, border: `1px solid ${t.border}`, background: 'transparent', color: t.text2, fontFamily: 'Poppins', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Limpiar</button>
          <button onClick={apply} style={{ flex: 2, height: 46, borderRadius: 23, border: 'none', background: t.accent, color: '#fff', fontFamily: 'Poppins', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Aplicar</button>
        </div>
      </div>
    </div>
  );
};

const WidgetCombinedDetail = ({ theme, filters = COMBINED_FILTER_DEFAULT, onNavigate }) => {
  const t = T(theme);
  const [selected, setSelected] = useState({ type: 'expense', id: 'food' });
  const [carouselView, setCarouselView] = useState('expense');

  const accountMap = Object.fromEntries(PELAS_ACCOUNTS.map(a => [a.id, a]));
  const expenseCategoryMap = Object.fromEntries(PELAS_CATEGORIES.map(c => [c.id, c]));
  const accountLabel = filters.account === 'all' ? 'Todas las cuentas' : accountMap[filters.account]?.name || 'Cuenta';

  const baseTxs = PELAS_TRANSACTIONS.filter(tx => {
    if (filters.account !== 'all' && tx.account !== filters.account) return false;
    if (!txMatchesDateRange(tx, filters.period, filters.dateFrom, filters.dateTo)) return false;
    return true;
  });

  const expenseTxs = baseTxs.filter(tx => tx.amount < 0 && (!filters.categories.length || filters.categories.includes(tx.cat)));
  const incomeTxs = baseTxs.filter(tx => tx.amount > 0);

  const expenseSegments = PELAS_CATEGORIES
    .filter(cat => !filters.categories.length || filters.categories.includes(cat.id))
    .map(cat => ({
      ...cat,
      type: 'expense',
      amount: expenseTxs.filter(tx => tx.cat === cat.id).reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
      txCat: cat.id,
    }))
    .filter(cat => cat.amount > 0);

  const incomeSegments = PELAS_INCOME_CATEGORIES.map((cat, index) => ({
    ...cat,
    type: 'income',
    txCat: index === 0 ? 'income' : cat.id,
    amount: index === 0 ? incomeTxs.filter(tx => tx.cat === 'income').reduce((sum, tx) => sum + tx.amount, 0) : 0,
  })).filter(cat => cat.amount > 0);

  const expenseTotal = expenseSegments.reduce((sum, cat) => sum + cat.amount, 0);
  const incomeTotal = incomeSegments.reduce((sum, cat) => sum + cat.amount, 0);
  const activeCarouselView = carouselView === 'expense' && expenseSegments.length === 0 && incomeSegments.length > 0 ? 'income' : carouselView;
  const visibleSegments = activeCarouselView === 'income' ? incomeSegments : expenseSegments;
  const selectedSegment = visibleSegments.find(item => combinedKey(item) === combinedKey(selected)) || visibleSegments[0] || null;
  const selectedKey = selectedSegment ? combinedKey(selectedSegment) : null;

  const selectedTxs = selectedSegment
    ? baseTxs.filter(tx => {
      if (selectedSegment.type === 'income') return tx.amount > 0 && tx.cat === selectedSegment.txCat;
      return tx.amount < 0 && tx.cat === selectedSegment.txCat;
    })
    : [];

  const hasFilters = filters.account !== 'all' || filters.period !== 'month' || filters.categories.length > 0 || filters.dateFrom || filters.dateTo;
  const periodLabel = COMBINED_PERIOD_LABELS[filters.period] || 'Este mes';
  const categorySummary = filters.categories.map(id => expenseCategoryMap[id]?.label || id).join(', ');

  const handleSelect = (item) => setSelected({ type: item.type, id: item.id });
  const handleCarouselChange = (nextView) => {
    setCarouselView(nextView);
    const nextItem = nextView === 'income' ? incomeSegments[0] : expenseSegments[0];
    if (nextItem) setSelected({ type: nextItem.type, id: nextItem.id });
  };
  const navigateToHistory = () => {
    if (!selectedSegment) return;
    onNavigate?.('history', {
      monthIdx: MOCK_TX_MONTH_INDEX,
      filters: {
        type: selectedSegment.type === 'income' ? 'income' : 'expense',
        accounts: filters.account === 'all' ? [] : [filters.account],
        categories: selectedSegment.type === 'expense' ? [selectedSegment.txCat] : [],
        dateRange: filters.period,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        sort: 'recent',
      },
    });
  };

  return (
    <div style={{ padding: '0 16px 24px', overflowY: 'auto', flex: 1 }}>
      {hasFilters && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', marginBottom: 12, borderRadius: 13, background: t.accentSoft, border: `1px solid ${t.accent}30` }}>
          <PelasIcon name="filter" size={13} color={t.accent}/>
          <div style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: t.accent, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {accountLabel} · {periodLabel}{categorySummary ? ` · ${categorySummary}` : ''}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        <div style={{ padding: '11px 10px', borderRadius: 14, background: 'rgba(63,185,132,0.10)', border: `1px solid ${t.positive}20` }}>
          <div style={{ fontSize: 9.5, color: t.text2 }}>Ingresos</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: t.positive, marginTop: 2 }}>+{formatMoney(incomeTotal)}</div>
        </div>
        <div style={{ padding: '11px 10px', borderRadius: 14, background: 'rgba(225,99,100,0.10)', border: `1px solid ${t.negative}20` }}>
          <div style={{ fontSize: 9.5, color: t.text2 }}>Gastos</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: t.negative, marginTop: 2 }}>−{formatMoney(expenseTotal)}</div>
        </div>
        <div style={{ padding: '11px 10px', borderRadius: 14, background: t.surface, border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 9.5, color: t.text2 }}>Neto</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: incomeTotal - expenseTotal >= 0 ? t.positive : t.negative, marginTop: 2 }}>
            {incomeTotal - expenseTotal >= 0 ? '+' : '−'}{formatMoney(Math.abs(incomeTotal - expenseTotal))}
          </div>
        </div>
      </div>

      <CombinedDonutCarousel
        theme={theme}
        view={activeCarouselView}
        onViewChange={handleCarouselChange}
        expenseTotal={expenseTotal}
        incomeTotal={incomeTotal}
        expenseSegments={expenseSegments}
        incomeSegments={incomeSegments}
        selectedKey={selectedKey}
        onSelect={handleSelect}
      />

      <div style={{ marginTop: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{selectedSegment?.label || 'Movimientos'}</div>
            <div style={{ fontSize: 11, color: t.text3, marginTop: 1 }}>{periodLabel} · {selectedTxs.length} movimientos</div>
          </div>
          {selectedSegment && (
            <div style={{ padding: '5px 8px', borderRadius: 9, background: selectedSegment.color + '18', color: selectedSegment.color, fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
              {formatMoney(selectedSegment.amount)}
            </div>
          )}
        </div>

        {selectedTxs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: t.text3, fontSize: 12 }}>Sin movimientos para este filtro</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {selectedTxs.map(tx => {
              const cat = expenseCategoryMap[tx.cat];
              const acc = accountMap[tx.account];
              const isPositive = tx.amount > 0;
              const icon = isPositive ? 'arrow-down' : cat?.icon || 'card';
              const color = isPositive ? t.positive : cat?.color || selectedSegment.color;
              return (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 16, background: t.surface, border: `1px solid ${t.border}` }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PelasIcon name={icon} size={15} color={color}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.name}</div>
                    <div style={{ fontSize: 11, color: t.text3, marginTop: 1 }}>{acc?.name || tx.card} · {tx.date}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isPositive ? t.positive : t.negative, flexShrink: 0 }}>
                    {isPositive ? '+' : '−'}{formatMoney(Math.abs(tx.amount), 2)}
                  </div>
                </div>
              );
            })}
            <button onClick={navigateToHistory} style={{ marginTop: 4, width: '100%', height: 46, borderRadius: 23, border: `1px solid ${selectedSegment?.color || t.accent}`, background: selectedSegment ? selectedSegment.color + '16' : t.accentSoft, color: selectedSegment?.color || t.accent, fontFamily: 'Poppins', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
              Ver todos los movimientos
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const EVOLUTION_SERIES = {
  '1m':    { data: [3490, 3560, 3675, 3790, 3918, 4010, 4092, 4168, 4218, 4287], labels: ['1 abr','8 abr','15 abr','22 abr','30 abr'] },
  '3m':    { data: [2980, 3160, 3374, 3608, 3826, 4084, 4287], labels: ['Ene','Feb','Mar','Abr'] },
  '1y':    { data: [1840, 2058, 2284, 2510, 2814, 3164, 3715, 4122, 4287], labels: ['Ene','Mar','May','Jul','Sep','Nov','Dic'] },
  '5y':    { data: [820, 1120, 1410, 1840, 2510, 3164, 3968, 4287], labels: ['2022','2023','2024','2025','2026'] },
  all:     { data: [320, 520, 790, 1180, 1718, 2510, 3715, 4287], labels: ['2018','2020','2022','2024','2026'] },
  custom:  { data: [1840, 2058, 2284, 2510, 2814, 3164, 3715, 4122, 4287], labels: ['Ene','Mar','May','Jul','Sep','Nov','Dic'] },
};

const WidgetEvolutionDetail = ({ theme, filters = EVOLUTION_FILTER_DEFAULT }) => {
  const t = T(theme);
  const { period = '1y', account = 'all' } = filters;
  const [selected, setSelected] = useState(null);

  const periodData = EVOLUTION_SERIES[period] || EVOLUTION_SERIES['1y'];
  const totalBalance = PELAS_ACCOUNTS.reduce((s, a) => s + a.balance, 0);
  const accountFactor = account === 'all' ? 1
    : (PELAS_ACCOUNTS.find(a => a.id === account)?.balance || 0) / totalBalance;
  const data = periodData.data.map(v => Math.round(v * accountFactor));
  const selIdx = selected !== null ? Math.min(selected, data.length - 1) : data.length - 1;

  const selVal    = data[selIdx];
  const delta     = data[data.length - 1] - data[0];
  const deltaPct  = ((delta / data[0]) * 100).toFixed(1).replace('.', ',');
  const deltaColor = delta >= 0 ? t.positive : t.negative;
  const accountLabel = account === 'all' ? 'Todas las cuentas'
    : PELAS_ACCOUNTS.find(a => a.id === account)?.name || account;

  // Single SVG that contains everything: Y-labels, grid, area, line, X-labels, dots
  // viewBox coordinates — preserveAspectRatio="none" stretches to fill the container exactly
  const VW = 600; const VH = 200;
  const padL = 52; const padR = 10; const padT = 12; const padB = 26;
  const cW = VW - padL - padR;
  const cH = VH - padT - padB;
  const minV = Math.min(...data); const maxV = Math.max(...data); const rangeV = maxV - minV || 1;
  const fmtK = v => v >= 1000 ? `${(v / 1000).toFixed(1).replace('.', ',')}k €` : `${v} €`;

  const pts = data.map((v, i) => [
    padL + i * (cW / (data.length - 1)),
    padT + cH - ((v - minV) / rangeV) * cH,
  ]);
  let pathD = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i - 1][0] + pts[i][0]) / 2;
    pathD += ` C ${cx} ${pts[i - 1][1]}, ${cx} ${pts[i][1]}, ${pts[i][0]} ${pts[i][1]}`;
  }
  const last = pts[pts.length - 1];
  const baseY = padT + cH;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Compact value row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '4px 20px 8px', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 10.5, color: t.text2 }}>{accountLabel}</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.1 }}>
            {selVal.toLocaleString('es-ES')} €
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: t.text3 }}>
            {periodData.labels[Math.round(selIdx * (periodData.labels.length - 1) / (data.length - 1))] || ''}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: deltaColor, background: deltaColor + '18', padding: '4px 10px', borderRadius: 8, textAlign: 'right' }}>
              {delta >= 0 ? '+' : ''}{deltaPct}%
            </div>
            <div style={{ fontSize: 10, color: t.text3, marginTop: 2, textAlign: 'right' }}>
              {delta >= 0 ? '+' : ''}{delta.toLocaleString('es-ES')} €
            </div>
          </div>
        </div>
      </div>

      {/* Full-bleed chart — one SVG for everything */}
      <div style={{ flex: 1, minHeight: 0, background: t.surface2 }}>
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          style={{ display: 'block' }}
        >
          <defs>
            <linearGradient id="evo-d-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={t.accent} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={t.accent} stopOpacity="0.02"/>
            </linearGradient>
          </defs>

          {/* Y grid lines + labels (3 levels) */}
          {[0, 1, 2].map(i => {
            const y = padT + (i / 2) * cH;
            const val = maxV - (i / 2) * rangeV;
            return (
              <g key={i}>
                <line x1={padL} y1={y} x2={VW - padR} y2={y} stroke={t.borderStrong} strokeWidth="0.7" strokeOpacity="0.45"/>
                <text x={padL - 5} y={y} textAnchor="end" dominantBaseline="middle" fontSize="11" fill={t.text3}>{fmtK(Math.round(val))}</text>
              </g>
            );
          })}

          {/* Area */}
          <path d={`${pathD} L ${last[0]} ${baseY} L ${pts[0][0]} ${baseY} Z`} fill="url(#evo-d-fill)"/>

          {/* Line */}
          <path d={pathD} stroke={t.accent} strokeWidth="2.5" fill="none" strokeLinecap="round"/>

          {/* X-axis labels */}
          {periodData.labels.map((lbl, i) => {
            const x = padL + (i / (periodData.labels.length - 1)) * cW;
            return <text key={i} x={x} y={VH - 5} textAnchor="middle" fontSize="11" fill={t.text3}>{lbl}</text>;
          })}

          {/* Interactive dots + selected callout */}
          {pts.map((pt, i) => (
            <g key={i} onClick={() => setSelected(prev => prev === i ? null : i)} style={{ cursor: 'pointer' }}>
              <circle cx={pt[0]} cy={pt[1]} r="16" fill="transparent"/>
              {selIdx === i ? (
                <>
                  <line x1={pt[0]} y1={padT} x2={pt[0]} y2={baseY} stroke={t.accent} strokeWidth="1" strokeOpacity="0.35" strokeDasharray="4 3"/>
                  <circle cx={pt[0]} cy={pt[1]} r="8" fill={t.accent} opacity="0.15"/>
                  <circle cx={pt[0]} cy={pt[1]} r="5" fill={t.accent} stroke={theme === 'dark' ? '#0E0E1A' : '#fff'} strokeWidth="2.5"/>
                </>
              ) : (
                <circle cx={pt[0]} cy={pt[1]} r="3" fill={t.accent} opacity="0.4"/>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

// ── Shared: period filter for map detail panels ───────────────────────────────

const MAP_PERIOD_OPTS = [
  { id: 'month', label: 'Mes' },
  { id: '3m',    label: '3 meses' },
  { id: 'year',  label: 'Año' },
  { id: 'all',   label: 'Todo' },
  { id: 'custom',label: 'Periodo' },
];

const filterTxByMapPeriod = (txs, period, customFrom, customTo) => {
  if (period === 'all') return txs;
  const mockNow = new Date(MOCK_TX_YEAR, MOCK_TX_MONTH_INDEX, 30);
  let from;
  const to = period === 'custom' && customTo ? new Date(customTo) : mockNow;
  if (period === 'month')  from = new Date(MOCK_TX_YEAR, MOCK_TX_MONTH_INDEX, 1);
  else if (period === '3m') from = new Date(MOCK_TX_YEAR, MOCK_TX_MONTH_INDEX - 2, 1);
  else if (period === 'year') from = new Date(MOCK_TX_YEAR, 0, 1);
  else if (period === 'custom' && customFrom) from = new Date(customFrom);
  if (!from) return txs;
  return txs.filter(tx => { const d = getMockTxDate(tx.date); return d >= from && d <= to; });
};

const MapPeriodFilter = ({ theme, period, onChangePeriod, customFrom, customTo, onChangeFrom, onChangeTo }) => {
  const t = T(theme);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', gap: 3, padding: 4, background: t.surface2, borderRadius: 12 }}>
        {MAP_PERIOD_OPTS.map(o => (
          <div key={o.id} onClick={() => onChangePeriod(o.id)}
            style={{ flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 9, cursor: 'pointer', fontSize: 10.5, fontWeight: 600,
              background: period === o.id ? t.accent : 'transparent', color: period === o.id ? '#fff' : t.text2, transition: 'all 0.15s' }}>
            {o.label}
          </div>
        ))}
      </div>
      {period === 'custom' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <div style={{ flex: 1, padding: '8px 12px', background: t.surface2, borderRadius: 12 }}>
            <div style={{ fontSize: 9.5, color: t.text3, marginBottom: 3 }}>Desde</div>
            <input type="date" value={customFrom} onChange={e => onChangeFrom(e.target.value)}
              style={{ width: '100%', background: 'transparent', border: 'none', color: t.text, fontFamily: 'Poppins', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}/>
          </div>
          <div style={{ flex: 1, padding: '8px 12px', background: t.surface2, borderRadius: 12 }}>
            <div style={{ fontSize: 9.5, color: t.text3, marginBottom: 3 }}>Hasta</div>
            <input type="date" value={customTo} onChange={e => onChangeTo(e.target.value)}
              style={{ width: '100%', background: 'transparent', border: 'none', color: t.text, fontFamily: 'Poppins', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}/>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Detail: Mapa nacional de gasto ───────────────────────────────────────────

const SpainMapSVG = ({ theme, selectedCity, onSelect }) => {
  const t = T(theme);
  const [zoom, setZoom] = useState(1);
  const maxAmt = Math.max(...NATIONAL_CITIES.map(c => c.amount));
  const visibleCities = NATIONAL_CITIES.filter(c => c.city !== NATIONAL_LOCAL_CITY);
  const mapFill = theme === 'dark' ? '#2A2C3D' : '#DCE5F5';
  const mapStroke = theme === 'dark' ? '#4A4C62' : '#B0BEDD';
  const seaFill = theme === 'dark' ? '#1A1B2A' : '#EDF1FA';

  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: seaFill }}
      onWheel={e => { e.preventDefault(); setZoom(z => Math.min(3, Math.max(1, z - e.deltaY * 0.002))); }}>
      <svg viewBox="0 0 380 260" width="100%"
        style={{ display: 'block', transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s' }}>
        <rect x="0" y="0" width="380" height="260" fill={seaFill}/>
        <path d={SPAIN_GEO_PATH} fill={mapFill} stroke={mapStroke} strokeWidth="1.5" strokeLinejoin="round"/>
        {visibleCities.map(city => {
          const intensity = city.amount / maxAmt;
          const outerR = 9 + intensity * 13;
          const innerR = 4 + intensity * 6;
          const isSelected = selectedCity?.city === city.city;
          return (
            <g key={city.city} onClick={() => onSelect(isSelected ? null : city)} style={{ cursor: 'pointer' }}>
              <circle cx={city.x} cy={city.y} r={outerR + 9} fill="transparent"/>
              {isSelected && <circle cx={city.x} cy={city.y} r={innerR + 8} fill={city.color} fillOpacity="0.2"/>}
              <circle cx={city.x} cy={city.y} r={outerR} fill={city.color} fillOpacity={isSelected ? '0.3' : '0.16'}/>
              <circle cx={city.x} cy={city.y} r={innerR} fill={city.color} fillOpacity={isSelected ? '0.6' : '0.38'}/>
              <circle cx={city.x} cy={city.y} r="5.5" fill={city.color} stroke="#fff" strokeWidth={isSelected ? '2' : '1.2'}/>
              <text x={city.x + 8} y={city.y - 6} fontSize="9" fill={isSelected ? city.color : t.text2} fontWeight="800">{city.city}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {[{ label: '+', delta: 0.5 }, { label: '−', delta: -0.5 }].map(btn => (
          <button key={btn.label} onClick={() => setZoom(z => Math.min(3, Math.max(1, z + btn.delta)))}
            style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${t.border}`, background: t.surface + 'DD', color: t.text, fontFamily: 'Poppins', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const WidgetNationalHeatmapDetail = ({ theme, onNavigate }) => {
  const t = T(theme);
  const [selectedCity, setSelectedCity] = useState(null);
  const [period, setPeriod] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const expenseTxs = PELAS_TRANSACTIONS.filter(tx => tx.amount < 0);
  const accountMap = Object.fromEntries(PELAS_ACCOUNTS.map(a => [a.id, a]));
  const categoryMap = Object.fromEntries(PELAS_CATEGORIES.map(c => [c.id, c]));
  const visibleCities = NATIONAL_CITIES.filter(c => c.city !== NATIONAL_LOCAL_CITY);
  const periodFiltered = filterTxByMapPeriod(expenseTxs, period, customFrom, customTo);
  const nationalTxs = periodFiltered.filter(tx => visibleCities.some(c => tx.location?.includes(c.city)));
  const visitedCityNames = new Set(
    nationalTxs.map(tx => visibleCities.find(c => tx.location?.includes(c.city))?.city).filter(Boolean)
  );
  const nationalTotal = nationalTxs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const cityTxs = selectedCity ? periodFiltered.filter(tx => tx.location?.includes(selectedCity.city)) : [];
  const cityTotal = cityTxs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const navigateToHistory = () => {
    if (!selectedCity) return;
    const locs = [...new Set(cityTxs.map(tx => tx.location).filter(Boolean))];
    onNavigate?.('history', { filters: { type: 'expense', locations: locs.length ? locs : [selectedCity.city], dateRange: 'all', ignoreMonth: true, sort: 'recent' } });
  };

  return (
    <div style={{ padding: '0 16px 24px', overflowY: 'auto', flex: 1 }}>
      <MapPeriodFilter theme={theme} period={period} onChangePeriod={setPeriod}
        customFrom={customFrom} customTo={customTo} onChangeFrom={setCustomFrom} onChangeTo={setCustomTo}/>
      <Card theme={theme} padding={12} radius={22} style={{ marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Viajes', value: nationalTxs.length },
            { label: 'Ciudades', value: visitedCityNames.size },
            { label: 'Gasto viajes', value: nationalTotal > 0 ? `${(nationalTotal / 1000).toFixed(1).replace('.', ',')}k €` : '—' },
          ].map(item => (
            <div key={item.label} style={{ padding: '9px 8px', borderRadius: 12, background: t.surface2, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: t.text2, marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{item.value}</div>
            </div>
          ))}
        </div>
        <SpainMapSVG theme={theme} selectedCity={selectedCity} onSelect={setSelectedCity}/>
      </Card>

      {!selectedCity ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: t.text3, fontSize: 12 }}>Toca una ciudad en el mapa para ver los gastos</div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>{selectedCity.city} · {selectedCity.region}</div>
              <div style={{ fontSize: 11, color: t.text3, marginTop: 1 }}>{cityTxs.length} movimiento{cityTxs.length !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ padding: '4px 10px', borderRadius: 10, background: t.negative + '18', color: t.negative, fontSize: 12, fontWeight: 900 }}>
              {cityTotal > 0 ? `${cityTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €` : '—'}
            </div>
          </div>
          {cityTxs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: t.text3, fontSize: 12 }}>Sin gastos registrados en {selectedCity.city}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {cityTxs.map(tx => {
                const cat = categoryMap[tx.cat];
                const acc = accountMap[tx.account];
                const color = cat?.color || t.negative;
                return (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 16, background: t.surface, border: `1px solid ${t.border}` }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <PelasIcon name={cat?.icon || 'card'} size={15} color={color}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.name}</div>
                      <div style={{ fontSize: 11, color: t.text3, marginTop: 1 }}>{acc?.name || tx.card} · {tx.date} · {tx.location}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: t.negative, flexShrink: 0 }}>−{Math.abs(tx.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={navigateToHistory} style={{ width: '100%', height: 46, borderRadius: 23, border: `1px solid ${t.negative}`, background: t.negative + '16', color: t.negative, fontFamily: 'Poppins', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>
            Ver todos los movimientos
          </button>
        </div>
      )}
    </div>
  );
};

// ── Detail: Mapa internacional de viajes ─────────────────────────────────────

const WorldMapSVG = ({ theme, selectedCountry, onSelect }) => {
  const [zoom, setZoom] = useState(1);
  const t = T(theme);
  const mapFill = theme === 'dark' ? '#2A2C3D' : '#DCE5F5';
  const mapStroke = theme === 'dark' ? '#4A4C62' : '#B0BEDD';
  const seaFill = theme === 'dark' ? '#1A1B2A' : '#EDF1FA';

  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: seaFill }}
      onWheel={e => { e.preventDefault(); setZoom(z => Math.min(3, Math.max(1, z - e.deltaY * 0.002))); }}>
      <svg viewBox="0 0 400 220" width="100%"
        style={{ display: 'block', transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s' }}>
        <rect x="0" y="0" width="400" height="220" fill={seaFill}/>
        {[25,35,45].map(lat => <path key={`lat-${lat}`} d={`M0 ${(55-lat)*5.5} H400`} stroke={mapStroke} strokeWidth="0.4" strokeOpacity="0.5"/>)}
        {[0,40,80,120,160].map(lon => <path key={`lon-${lon}`} d={`M${(lon+20)*2.222} 0 V220`} stroke={mapStroke} strokeWidth="0.4" strokeOpacity="0.5"/>)}
        {/* W+C Europe */}
        <path d="M23 0 L122 0 L122 105 L107 105 L89 99 L80 99 L78 102 L62 94 L51 66 L44 94 L32 105 L24 99 Z" fill={mapFill} stroke={mapStroke} strokeWidth="0.8" strokeLinejoin="round"/>
        {/* Russia / N.Asia */}
        <path d="M122 0 L400 0 L400 90 L280 85 L200 85 L140 90 L122 0 Z" fill={mapFill} stroke={mapStroke} strokeWidth="0.8" strokeLinejoin="round"/>
        {/* Africa */}
        <path d="M32 105 L100 105 L130 115 L128 220 L0 220 L0 155 L16 149 L25 149 L33 121 L42 116 Z" fill={mapFill} stroke={mapStroke} strokeWidth="0.8" strokeLinejoin="round"/>
        {/* Middle East (fills gap) */}
        <path d="M122 105 L140 90 L148 130 L130 135 L100 105 Z" fill={mapFill} stroke={mapStroke} strokeWidth="0.8" strokeLinejoin="round"/>
        {/* S+E Asia / China */}
        <path d="M140 90 L400 90 L400 220 L165 220 L148 165 L148 130 L140 90 Z" fill={mapFill} stroke={mapStroke} strokeWidth="0.8" strokeLinejoin="round"/>
        {/* Visited countries (interactive) */}
        {TRAVEL_COUNTRIES.map(country => {
          const isSelected = selectedCountry?.country === country.country;
          return (
            <g key={country.country} onClick={() => onSelect(isSelected ? null : country)} style={{ cursor: 'pointer' }}>
              <circle cx={country.x} cy={country.y} r="22" fill="transparent"/>
              {isSelected && <circle cx={country.x} cy={country.y} r="14" fill={country.color} fillOpacity="0.2"/>}
              <path d={country.d} fill={country.color} fillOpacity={isSelected ? '1' : '0.82'} stroke="#fff" strokeWidth={isSelected ? '1.8' : '0.8'}/>
              <circle cx={country.x} cy={country.y} r={isSelected ? '4.5' : '3'} fill="#fff" fillOpacity="0.95"/>
              <text x={country.x + 6} y={country.y - 5} fontSize="8.5" fill={isSelected ? country.color : t.text2} fontWeight={isSelected ? '800' : '700'}>{country.country}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {[{ label: '+', delta: 0.5 }, { label: '−', delta: -0.5 }].map(btn => (
          <button key={btn.label} onClick={() => setZoom(z => Math.min(3, Math.max(1, z + btn.delta)))}
            style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${t.border}`, background: t.surface + 'DD', color: t.text, fontFamily: 'Poppins', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const WidgetTravelHeatmapDetail = ({ theme, onNavigate }) => {
  const t = T(theme);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [period, setPeriod] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const expenseTxs = PELAS_TRANSACTIONS.filter(tx => tx.amount < 0);
  const accountMap = Object.fromEntries(PELAS_ACCOUNTS.map(a => [a.id, a]));
  const categoryMap = Object.fromEntries(PELAS_CATEGORIES.map(c => [c.id, c]));
  const periodFiltered = filterTxByMapPeriod(expenseTxs, period, customFrom, customTo);
  const countryTxs = selectedCountry ? periodFiltered.filter(tx => tx.location?.includes(selectedCountry.country)) : [];
  const countryTotal = countryTxs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const navigateToHistory = () => {
    if (!selectedCountry) return;
    const locs = [...new Set(countryTxs.map(tx => tx.location).filter(Boolean))];
    onNavigate?.('history', { filters: { type: 'expense', locations: locs.length ? locs : [selectedCountry.country], dateRange: 'all', ignoreMonth: true, sort: 'recent' } });
  };

  return (
    <div style={{ padding: '0 16px 24px', overflowY: 'auto', flex: 1 }}>
      <MapPeriodFilter theme={theme} period={period} onChangePeriod={setPeriod}
        customFrom={customFrom} customTo={customTo} onChangeFrom={setCustomFrom} onChangeTo={setCustomTo}/>
      <Card theme={theme} padding={12} radius={22} style={{ marginBottom: 14 }}>
        <WorldMapSVG theme={theme} selectedCountry={selectedCountry} onSelect={setSelectedCountry}/>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {TRAVEL_COUNTRIES.map(country => {
            const active = selectedCountry?.country === country.country;
            return (
              <div key={country.country} onClick={() => setSelectedCountry(active ? null : country)}
                style={{ padding: '5px 11px', borderRadius: 10, background: active ? country.color : country.color + '18', color: active ? '#fff' : country.color, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${country.color}40` }}>
                {country.country} · {country.trips}v
              </div>
            );
          })}
        </div>
      </Card>

      {!selectedCountry ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: t.text3, fontSize: 12 }}>Toca un país en el mapa para ver los gastos</div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>{selectedCountry.country}</div>
              <div style={{ fontSize: 11, color: t.text3, marginTop: 1 }}>{countryTxs.length} movimiento{countryTxs.length !== 1 ? 's' : ''} · {selectedCountry.trips} viaje{selectedCountry.trips > 1 ? 's' : ''}</div>
            </div>
            <div style={{ padding: '4px 10px', borderRadius: 10, background: t.negative + '18', color: t.negative, fontSize: 12, fontWeight: 900 }}>
              {countryTotal > 0 ? `${countryTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €` : '—'}
            </div>
          </div>
          {countryTxs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: t.text3, fontSize: 12 }}>Sin movimientos registrados en {selectedCountry.country}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {countryTxs.map(tx => {
                const cat = categoryMap[tx.cat];
                const acc = accountMap[tx.account];
                const color = cat?.color || t.negative;
                return (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 16, background: t.surface, border: `1px solid ${t.border}` }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <PelasIcon name={cat?.icon || 'card'} size={15} color={color}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.name}</div>
                      <div style={{ fontSize: 11, color: t.text3, marginTop: 1 }}>{acc?.name || tx.card} · {tx.date} · {tx.location}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: t.negative, flexShrink: 0 }}>−{Math.abs(tx.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={navigateToHistory} style={{ width: '100%', height: 46, borderRadius: 23, border: `1px solid ${t.negative}`, background: t.negative + '16', color: t.negative, fontFamily: 'Poppins', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>
            Ver todos los movimientos
          </button>
        </div>
      )}
    </div>
  );
};

const StatsGenericDetail = ({ theme, title }) => {
  const t = T(theme);
  const [selected, setSelected] = useState(PELAS_MONTHLY.length - 1);
  const rows = PELAS_MONTHLY.map(row => ({ m: row.m, v: row.v, income: row.i, expenses: row.v }));
  const current = rows[selected];

  return (
    <div style={{ padding: '0 22px 24px', overflowY: 'auto' }}>
      <Card theme={theme} padding={18} radius={24}>
        <div style={{ fontSize: 11, color: t.text2, marginBottom: 4 }}>Vista ampliada</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{current.v.toLocaleString('es-ES')} €</div>
        <DetailBars theme={theme} rows={rows} metric="expenses" selected={selected} onSelect={setSelected}/>
        <div style={{ fontSize: 11.5, color: t.text2, textAlign: 'center', marginTop: 10 }}>{title}: toca una columna para ver el importe.</div>
      </Card>
    </div>
  );
};

// ── Evolution filter drawer (slides from right) ──────────────────────────────

const EVOLUTION_PERIOD_OPTS = [
  { id: '1m',    label: '1 mes' },
  { id: '3m',    label: '3 meses' },
  { id: '1y',    label: '1 año' },
  { id: '5y',    label: '5 años' },
  { id: 'all',   label: 'Todo' },
  { id: 'custom',label: 'Personalizado' },
];

const EvolutionFilterDrawer = ({ theme, filters, onApply, onClose }) => {
  const t = T(theme);
  const [local, setLocal] = useState(filters);
  const reset  = () => setLocal(EVOLUTION_FILTER_DEFAULT);
  const apply  = () => { onApply(local); onClose(); };

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface2, color: t.text, fontFamily: 'Poppins', fontSize: 12, outline: 'none', boxSizing: 'border-box' };
  const sectionLabel = { fontSize: 10.5, fontWeight: 700, color: t.text3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 };

  const accounts = [{ id: 'all', name: 'Todas las cuentas', color: t.accent }, ...PELAS_ACCOUNTS];

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '84%', background: t.bg, borderLeft: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.25s ease-out' }}>

        <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${t.border}`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <PelasIcon name="x" size={14} color={t.text2}/>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Filtros</div>
            <div style={{ fontSize: 11, color: t.text2, marginTop: 1 }}>Evolución del saldo</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 8px' }}>

          {/* Period */}
          <div style={{ marginBottom: 22 }}>
            <div style={sectionLabel}>Periodo</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EVOLUTION_PERIOD_OPTS.map(p => (
                <div key={p.id} onClick={() => setLocal(f => ({ ...f, period: p.id }))} style={{ padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: local.period === p.id ? t.accent : t.surface2, color: local.period === p.id ? '#fff' : t.text2, transition: 'all 0.15s' }}>
                  {p.label}
                </div>
              ))}
            </div>
          </div>

          {local.period === 'custom' && (
            <div style={{ marginBottom: 22 }}>
              <div style={sectionLabel}>Rango personalizado</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11.5, color: t.text2, marginBottom: 5 }}>Desde</div>
                <input type="date" value={local.dateFrom} onChange={e => setLocal(f => ({ ...f, dateFrom: e.target.value }))} style={inputStyle}/>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: t.text2, marginBottom: 5 }}>Hasta</div>
                <input type="date" value={local.dateTo} onChange={e => setLocal(f => ({ ...f, dateTo: e.target.value }))} style={inputStyle}/>
              </div>
            </div>
          )}

          {/* Account (single select) */}
          <div style={{ marginBottom: 8 }}>
            <div style={sectionLabel}>Cuenta</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {accounts.map(acc => {
                const selected = local.account === acc.id;
                return (
                  <div key={acc.id} onClick={() => setLocal(f => ({ ...f, account: acc.id }))} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 14, background: selected ? t.accentSoft : t.surface, border: `1px solid ${selected ? t.accent : t.border}`, transition: 'all 0.15s' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: acc.color || t.accent, flexShrink: 0 }}/>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: selected ? 600 : 400, color: selected ? t.accent : t.text }}>{acc.name}</div>
                    <div style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${selected ? t.accent : t.border}`, background: selected ? t.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                      {selected && <div style={{ width: 6, height: 6, borderRadius: 3, background: '#fff' }}/>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 18px 24px', borderTop: `1px solid ${t.border}`, flexShrink: 0, display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{ flex: 1, height: 46, borderRadius: 23, border: `1px solid ${t.border}`, background: 'transparent', color: t.text2, fontFamily: 'Poppins', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Limpiar</button>
          <button onClick={apply} style={{ flex: 2, height: 46, borderRadius: 23, border: 'none', background: t.accent, color: '#fff', fontFamily: 'Poppins', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Aplicar</button>
        </div>
      </div>
    </div>
  );
};

// ── Balance filter drawer (slides from right) ─────────────────────────────────

const EVOLUTION_FILTER_DEFAULT = {
  period: '1y',      // '1m' | '3m' | '1y' | '5y' | 'all' | 'custom'
  dateFrom: '',
  dateTo: '',
  account: 'all',    // 'all' | account id (single select)
};

const BALANCE_FILTER_DEFAULT = {
  accounts: [],
  categories: [],
  chartView: 'month',  // 'month' | 'year'
  metric: 'net',       // 'net' | 'income' | 'expenses'
};

const BALANCE_FILTER_PERIODS = [
  { id: 'today',    label: 'Hoy' },
  { id: 'week',     label: 'Semana' },
  { id: 'month',    label: 'Este mes' },
  { id: '3months',  label: '3 meses' },
  { id: 'year',     label: 'Este año' },
  { id: 'all',      label: 'Todo' },
  { id: 'custom',   label: 'Personalizado' },
];

const BalanceFilterDrawer = ({ theme, filters, onApply, onClose }) => {
  const t = T(theme);
  const [local, setLocal] = useState(filters);

  const toggleAccount = (id) => setLocal(f => {
    const next = f.accounts.includes(id) ? f.accounts.filter(a => a !== id) : [...f.accounts, id];
    return { ...f, accounts: next };
  });
  const toggleCategory = (id) => setLocal(f => {
    const next = f.categories.includes(id) ? f.categories.filter(c => c !== id) : [...f.categories, id];
    return { ...f, categories: next };
  });
  const reset = () => setLocal(BALANCE_FILTER_DEFAULT);
  const apply = () => { onApply(local); onClose(); };

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface2, color: t.text, fontFamily: 'Poppins', fontSize: 12, outline: 'none', boxSizing: 'border-box' };
  const sectionLabel = { fontSize: 10.5, fontWeight: 700, color: t.text3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 };
  const rowStyle = { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 12, background: t.surface, border: `1px solid ${t.border}`, marginBottom: 6 };

  const Checkbox = ({ checked }) => (
    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? t.accent : t.border}`, background: checked ? t.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
      {checked && <PelasIcon name="check" size={10} color="#fff" strokeWidth={2.5}/>}
    </div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '84%', background: t.bg, borderLeft: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.25s ease-out' }}>

        {/* Header */}
        <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${t.border}`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <PelasIcon name="x" size={14} color={t.text2}/>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Filtros</div>
            <div style={{ fontSize: 11, color: t.text2, marginTop: 1 }}>Personaliza la visualización</div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 8px' }}>

          {/* Chart view */}
          <div style={{ marginBottom: 22 }}>
            <div style={sectionLabel}>Vista del gráfico</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ id: 'month', label: 'Mensual' }, { id: 'year', label: 'Anual' }].map(v => (
                <div key={v.id} onClick={() => setLocal(f => ({ ...f, chartView: v.id }))} style={{ padding: '7px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: local.chartView === v.id ? t.accent : t.surface2, color: local.chartView === v.id ? '#fff' : t.text2, transition: 'all 0.15s' }}>
                  {v.label}
                </div>
              ))}
            </div>
          </div>

          {/* Metric */}
          <div style={{ marginBottom: 22 }}>
            <div style={sectionLabel}>Métrica</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[{ id: 'net', label: 'Balance neto' }, { id: 'income', label: 'Ingresos' }, { id: 'expenses', label: 'Gastos' }].map(v => (
                <div key={v.id} onClick={() => setLocal(f => ({ ...f, metric: v.id }))} style={{ padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: local.metric === v.id ? t.accent : t.surface2, color: local.metric === v.id ? '#fff' : t.text2, transition: 'all 0.15s' }}>
                  {v.label}
                </div>
              ))}
            </div>
          </div>

          {/* Accounts */}
          <div style={{ marginBottom: 22 }}>
            <div style={sectionLabel}>Cuentas <span style={{ fontWeight: 400, fontSize: 10, textTransform: 'none' }}>(vacío = todas)</span></div>
            {PELAS_ACCOUNTS.map(acc => {
              const checked = local.accounts.includes(acc.id);
              return (
                <div key={acc.id} onClick={() => toggleAccount(acc.id)} style={rowStyle}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: acc.color, flexShrink: 0 }}/>
                  <div style={{ flex: 1, fontSize: 12.5, fontWeight: 500 }}>{acc.name}</div>
                  <div style={{ fontSize: 11, color: t.text3 }}>{acc.balance.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €</div>
                  <Checkbox checked={checked}/>
                </div>
              );
            })}
          </div>

          {/* Categories */}
          <div style={{ marginBottom: 8 }}>
            <div style={sectionLabel}>Categorías <span style={{ fontWeight: 400, fontSize: 10, textTransform: 'none' }}>(vacío = todas)</span></div>
            {PELAS_CATEGORIES.map(cat => {
              const checked = local.categories.includes(cat.id);
              return (
                <div key={cat.id} onClick={() => toggleCategory(cat.id)} style={rowStyle}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: cat.color, flexShrink: 0 }}/>
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{cat.label}</div>
                  <Checkbox checked={checked}/>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px 24px', borderTop: `1px solid ${t.border}`, flexShrink: 0, display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{ flex: 1, height: 46, borderRadius: 23, border: `1px solid ${t.border}`, background: 'transparent', color: t.text2, fontFamily: 'Poppins', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Limpiar
          </button>
          <button onClick={apply} style={{ flex: 2, height: 46, borderRadius: 23, border: 'none', background: t.accent, color: '#fff', fontFamily: 'Poppins', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

export const StatsDetailScreen = ({ theme, widgetId, onBack, onNavigate }) => {
  const widget = STATS_WIDGET_LIBRARY.find(item => item.id === widgetId);
  const title = widget?.label || 'Detalle de estadísticas';
  const [filterOpen, setFilterOpen] = useState(false);
  const [balanceFilters, setBalanceFilters]   = useState(BALANCE_FILTER_DEFAULT);
  const [evolutionFilters, setEvolutionFilters] = useState(EVOLUTION_FILTER_DEFAULT);
  const [combinedFilters, setCombinedFilters] = useState(COMBINED_FILTER_DEFAULT);

  const isBalance   = widgetId === 'stats-balance';
  const isEvolution = widgetId === 'stats-evolution';
  const isCombined  = widgetId === 'stats-combined';
  const isCurrencies = widgetId === 'stats-currencies';
  const isCalendar = widgetId === 'stats-calendar';
  const isNationalHeatmap = widgetId === 'stats-national-heatmap';
  const isTravelHeatmap = widgetId === 'stats-travel-heatmap';
  const supportsFilter = isBalance || isEvolution || isCombined;

  const filtersActive = isBalance && (
    balanceFilters.chartView !== 'month' ||
    balanceFilters.metric !== 'net' ||
    balanceFilters.accounts.length > 0 ||
    balanceFilters.categories.length > 0
  ) || isEvolution && (
    evolutionFilters.period !== '1y' ||
    evolutionFilters.account !== 'all'
  ) || isCombined && (
    combinedFilters.account !== 'all' ||
    combinedFilters.period !== 'month' ||
    combinedFilters.categories.length > 0 ||
    combinedFilters.dateFrom ||
    combinedFilters.dateTo
  );

  const renderDetail = () => {
    if (isBalance)   return <WidgetBalanceDetail theme={theme} filters={balanceFilters} onNavigate={onNavigate}/>;
    if (isEvolution) return <WidgetEvolutionDetail theme={theme} filters={evolutionFilters}/>;
    if (isCombined)  return <WidgetCombinedDetail theme={theme} filters={combinedFilters} onNavigate={onNavigate}/>;
    if (isCurrencies) return <WidgetCurrenciesDetail theme={theme} onNavigate={onNavigate}/>;
    if (isCalendar) return <WidgetCalendarDetail theme={theme} onNavigate={onNavigate}/>;
    if (isNationalHeatmap) return <WidgetNationalHeatmapDetail theme={theme} onNavigate={onNavigate}/>;
    if (isTravelHeatmap) return <WidgetTravelHeatmapDetail theme={theme} onNavigate={onNavigate}/>;
    return <StatsGenericDetail theme={theme} title={title}/>;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <StatsDetailHeader
        theme={theme}
        title={title}
        onBack={onBack}
        onFilter={supportsFilter ? () => setFilterOpen(true) : undefined}
        filtersActive={!!filtersActive}
      />
      {renderDetail()}
      {filterOpen && isBalance && (
        <BalanceFilterDrawer
          theme={theme}
          filters={balanceFilters}
          onApply={setBalanceFilters}
          onClose={() => setFilterOpen(false)}
        />
      )}
      {filterOpen && isEvolution && (
        <EvolutionFilterDrawer
          theme={theme}
          filters={evolutionFilters}
          onApply={setEvolutionFilters}
          onClose={() => setFilterOpen(false)}
        />
      )}
      {filterOpen && isCombined && (
        <CombinedFilterDrawer
          theme={theme}
          filters={combinedFilters}
          onApply={setCombinedFilters}
          onClose={() => setFilterOpen(false)}
        />
      )}
    </div>
  );
};

// ── Main StatsScreen ──────────────────────────────────────────────────────────

export const StatsScreen = ({ theme, onNavigate }) => {
  const t = T(theme);
  const [widgets, setWidgets] = useState(DEFAULT_STATS_WIDGETS);
  const filters = DEFAULT_FILTERS;
  const [configOpen, setConfigOpen] = useState(false);

  const renderWidget = (w) => {
    const WidgetComponent = WIDGET_COMPONENTS[w.id];
    return WidgetComponent ? (
      <WidgetComponent
        key={w.id}
        theme={theme}
        filters={filters}
        onInfo={() => w.id === 'stats-savings'
          ? onNavigate?.('accounts')
          : onNavigate?.('stats-detail', { widgetId: w.id })}
      />
    ) : null;
  };

  const active = widgets.filter(w => w.enabled);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '8px 22px 14px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>Estadísticas</div>

        {/* Customise button */}
        <div onClick={() => setConfigOpen(true)} style={{ width: 40, height: 40, borderRadius: 20, background: t.surface, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <PelasIcon name="more" size={16} color={t.text}/>
        </div>
      </div>

      {/* Widget area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px' }}>
        {active.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: t.text2 }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>📊</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Sin widgets activos</div>
            <div style={{ fontSize: 12 }}>Pulsa ··· para añadir secciones</div>
          </div>
        )}
        {active.map(renderWidget)}
      </div>

      {/* Drawers / sheets */}
      {configOpen && <StatsConfigSheet theme={theme} widgets={widgets} setWidgets={setWidgets} onClose={() => setConfigOpen(false)}/>}
    </div>
  );
};
