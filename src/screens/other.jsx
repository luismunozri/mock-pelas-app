import { useState, useRef } from 'react';
import { PelasIcon } from '../icons';
import { T } from '../theme';
import { Card, SectionTitle, TxRow, Progress, PrimaryButton } from '../components';
import { PelasHeader } from '../frame';
import { PELAS_TRANSACTIONS, PELAS_CATEGORIES, PELAS_ACCOUNTS, PELAS_BUDGETS, PELAS_GOALS, PELAS_NOTIFICATIONS } from '../data';
import { MOCK_TX_MONTH_INDEX, txMatchesDateRange, txMatchesMonth } from '../mockDates';

// ── Filter Drawer ────────────────────────────────────────────────────────────

const DEFAULT_FILTERS = {
  type: 'all',
  accounts: [],
  categories: [],
  cards: [],
  locations: [],
  dateRange: 'all',
  dateFrom: '',
  dateTo: '',
  ignoreMonth: false,
  amountMin: 0,
  amountMax: 3000,
  sort: 'recent',
};

const mergeHistoryFilters = (initial = {}) => ({
  ...DEFAULT_FILTERS,
  ...initial,
  accounts: initial.accounts ? [...initial.accounts] : [],
  categories: initial.categories ? [...initial.categories] : [],
  cards: initial.cards ? [...initial.cards] : [],
  locations: initial.locations ? [...initial.locations] : [],
});

const FilterSection = ({ theme, title, count, children }) => {
  const t = T(theme);
  return (
    <div style={{ padding: '16px 0', borderBottom: `1px solid ${t.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: t.text, textTransform: 'uppercase', letterSpacing: 0.6 }}>{title}</div>
        {count > 0 && <div style={{ background: '#0066FF', color: '#fff', fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 8, minWidth: 16, textAlign: 'center' }}>{count}</div>}
      </div>
      {children}
    </div>
  );
};

const CheckBox = ({ checked, color, theme }) => {
  const t = T(theme);
  return (
    <div style={{ width: 20, height: 20, borderRadius: 6, background: checked ? (color || t.accent) : 'transparent', border: `1.5px solid ${checked ? (color || t.accent) : t.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
      {checked && <PelasIcon name="check" size={12} color="#fff" strokeWidth={3}/>}
    </div>
  );
};

const DateInput = ({ theme, label, value }) => {
  const t = T(theme);
  return (
    <div style={{ flex: 1, padding: '10px 12px', background: t.surface2, borderRadius: 12, cursor: 'pointer' }}>
      <div style={{ fontSize: 9.5, color: t.text3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 12.5, fontWeight: 500, marginTop: 2 }}>{value}</div>
    </div>
  );
};

const RangeSlider = ({ theme, min, max, step, valueMin, valueMax, onChange }) => {
  const t = T(theme);
  const trackRef = useRef(null);
  const pct = (v) => ((v - min) / (max - min)) * 100;
  const handleDrag = (which) => (e) => {
    e.preventDefault();
    const rect = trackRef.current.getBoundingClientRect();
    const move = (ev) => {
      const x = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const ratio = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
      const raw = min + ratio * (max - min);
      const snapped = Math.round(raw / step) * step;
      if (which === 'min') onChange(Math.min(snapped, valueMax - step), valueMax);
      else onChange(valueMin, Math.max(snapped, valueMin + step));
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', up);
  };
  return (
    <div ref={trackRef} style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2, background: t.surface2 }}/>
      <div style={{ position: 'absolute', left: pct(valueMin) + '%', right: (100 - pct(valueMax)) + '%', height: 4, borderRadius: 2, background: '#0066FF' }}/>
      {[{ v: valueMin, side: 'min' }, { v: valueMax, side: 'max' }].map(h => (
        <div key={h.side} onMouseDown={handleDrag(h.side)} onTouchStart={handleDrag(h.side)} style={{ position: 'absolute', left: `calc(${pct(h.v)}% - 11px)`, width: 22, height: 22, borderRadius: 11, background: '#fff', border: `2px solid #0066FF`, boxShadow: '0 2px 6px rgba(0,0,0,0.2)', cursor: 'grab', touchAction: 'none', zIndex: 2 }}/>
      ))}
    </div>
  );
};

const ActiveChip = ({ theme, label, color, onClear }) => {
  const t = T(theme);
  const c = color || t.accent;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 4px 5px 10px', borderRadius: 100, background: c + '22', color: c, fontSize: 11, fontWeight: 500, flexShrink: 0 }}>
      <span>{label}</span>
      <div onClick={onClear} style={{ width: 16, height: 16, borderRadius: 8, background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <PelasIcon name="x" size={9} color="#fff" strokeWidth={3}/>
      </div>
    </div>
  );
};

const FilterDrawer = ({ theme, open, onClose, filters, setFilters, onApply, onReset, count }) => {
  const t = T(theme);
  const togglePill = (key, value) => {
    setFilters(prev => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };
  const allCities = [...new Set(PELAS_TRANSACTIONS.map(tx => {
    if (!tx.location) return null;
    // Extract city: take the part before '·' or return the whole string if no '·'
    return tx.location.split('·')[0].trim();
  }).filter(Boolean))];
  const allCards = [...new Set(PELAS_TRANSACTIONS.map(tx => tx.card))];
  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 40, background: open ? 'rgba(0,0,0,0.5)' : 'transparent', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.25s', backdropFilter: open ? 'blur(3px)' : 'none' }}/>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 332, zIndex: 41, background: t.bg, boxShadow: '-12px 0 40px rgba(0,0,0,0.35)', transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0.18, 1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Filtros</div>
            <div style={{ fontSize: 11, color: t.text2, marginTop: 1 }}>{count} movimientos coinciden</div>
          </div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PelasIcon name="x" size={14} color={t.text2}/>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 16px' }}>
          <FilterSection theme={theme} title="Tipo">
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ id: 'all', label: 'Todos', color: t.accent, icon: 'wallet' }, { id: 'income', label: 'Ingresos', color: t.positive, icon: 'arrow-down' }, { id: 'expense', label: 'Gastos', color: t.negative, icon: 'arrow-up' }].map(o => (
                <div key={o.id} onClick={() => setFilters(p => ({ ...p, type: o.id }))} style={{ flex: 1, padding: '12px 4px', borderRadius: 12, cursor: 'pointer', background: filters.type === o.id ? o.color + '22' : t.surface2, border: `1px solid ${filters.type === o.id ? o.color : 'transparent'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}>
                  <PelasIcon name={o.icon} size={16} color={filters.type === o.id ? o.color : t.text2}/>
                  <div style={{ fontSize: 11, fontWeight: 500, color: filters.type === o.id ? o.color : t.text2 }}>{o.label}</div>
                </div>
              ))}
            </div>
          </FilterSection>
          <FilterSection theme={theme} title="Fecha">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
              {[{ id: 'today', label: 'Hoy' }, { id: 'week', label: 'Esta semana' }, { id: 'month', label: 'Este mes' }, { id: '3months', label: '3 meses' }, { id: 'all', label: 'Todo' }, { id: 'custom', label: 'Personalizar' }].map(o => (
                <div key={o.id} onClick={() => setFilters(p => ({ ...p, dateRange: o.id }))} style={{ padding: '8px 4px', borderRadius: 10, cursor: 'pointer', fontSize: 11, textAlign: 'center', fontWeight: 500, background: filters.dateRange === o.id ? t.accent : t.surface2, color: filters.dateRange === o.id ? '#fff' : t.text2, border: `1px solid ${filters.dateRange === o.id ? t.accent : 'transparent'}`, transition: 'all 0.15s' }}>{o.label}</div>
              ))}
            </div>
            {filters.dateRange === 'custom' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <DateInput theme={theme} label="Desde" value="01/04/26"/>
                <DateInput theme={theme} label="Hasta" value="02/05/26"/>
              </div>
            )}
          </FilterSection>
          <FilterSection theme={theme} title="Cuentas" count={filters.accounts.length}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PELAS_ACCOUNTS.map(a => {
                const active = filters.accounts.includes(a.id);
                return (
                  <div key={a.id} onClick={() => togglePill('accounts', a.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, cursor: 'pointer', background: active ? a.color + '18' : t.surface2, border: `1px solid ${active ? a.color : 'transparent'}`, transition: 'all 0.15s' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: a.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PelasIcon name={a.icon} size={14} color={a.color}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500 }}>{a.name}</div>
                      <div style={{ fontSize: 10.5, color: t.text2 }}>{a.bank}</div>
                    </div>
                    <CheckBox checked={active} color={a.color} theme={theme}/>
                  </div>
                );
              })}
            </div>
          </FilterSection>
          <FilterSection theme={theme} title="Categorías" count={filters.categories.length}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {PELAS_CATEGORIES.map(c => {
                const active = filters.categories.includes(c.id);
                return (
                  <div key={c.id} onClick={() => togglePill('categories', c.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 8, borderRadius: 10, cursor: 'pointer', background: active ? c.color + '22' : 'transparent', border: `1px solid ${active ? c.color : t.border}`, transition: 'all 0.15s' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 9, background: c.color + (active ? '33' : '18'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PelasIcon name={c.icon} size={13} color={c.color}/>
                    </div>
                    <div style={{ fontSize: 9.5, color: active ? t.text : t.text2, textAlign: 'center', fontWeight: active ? 600 : 400, lineHeight: 1.1 }}>{c.label.split(' ')[0]}</div>
                  </div>
                );
              })}
            </div>
          </FilterSection>
          <FilterSection theme={theme} title="Importe">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: t.text2 }}>Entre</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{filters.amountMin} € — {filters.amountMax} €</div>
            </div>
            <RangeSlider theme={theme} min={0} max={3000} step={10} valueMin={filters.amountMin} valueMax={filters.amountMax} onChange={(min, max) => setFilters(p => ({ ...p, amountMin: min, amountMax: max }))}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: t.text3 }}><span>0 €</span><span>3 000 €</span></div>
          </FilterSection>
          <FilterSection theme={theme} title="Tarjeta" count={filters.cards.length}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {allCards.map(c => {
                const active = filters.cards.includes(c);
                return (
                  <div key={c} onClick={() => togglePill('cards', c)} style={{ padding: '8px 14px', borderRadius: 100, cursor: 'pointer', fontSize: 11.5, fontWeight: 500, background: active ? t.accent : t.surface2, color: active ? '#fff' : t.text2, border: `1px solid ${active ? t.accent : 'transparent'}`, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
                    <PelasIcon name="card" size={12} color={active ? '#fff' : t.text2}/>{c}
                  </div>
                );
              })}
            </div>
          </FilterSection>
          <FilterSection theme={theme} title="Ubicación" count={filters.locations.length}>
            <div style={{ position: 'relative' }}>
              <select
                value={filters.locations[0] || ''}
                onChange={e => {
                  const v = e.target.value;
                  setFilters(p => ({ ...p, locations: v ? [v] : [] }));
                }}
                style={{ width: '100%', height: 44, borderRadius: 12, background: t.surface2, border: `1px solid ${filters.locations.length ? t.accent : t.border}`, color: filters.locations.length ? t.accent : t.text2, fontFamily: 'inherit', fontSize: 13, padding: '0 14px', outline: 'none', appearance: 'none', cursor: 'pointer' }}
              >
                <option value="">Todas las ciudades</option>
                {allCities.map(city => (
                  <option key={city} value={city} style={{ color: '#1E1E2D', background: '#fff' }}>{city}</option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <PelasIcon name="chevron-right" size={14} color={t.text2} style={{ transform: 'rotate(90deg)' }}/>
              </div>
            </div>
            {filters.locations.length > 0 && (
              <div onClick={() => setFilters(p => ({ ...p, locations: [] }))} style={{ marginTop: 8, fontSize: 11.5, color: t.accent, cursor: 'pointer', fontWeight: 500 }}>
                Limpiar ciudad
              </div>
            )}
          </FilterSection>
          <FilterSection theme={theme} title="Ordenar por">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {[{ id: 'recent', label: 'Más reciente', icon: 'arrow-down' }, { id: 'oldest', label: 'Más antiguo', icon: 'arrow-up' }, { id: 'highest', label: 'Mayor importe', icon: 'arrow-up' }, { id: 'lowest', label: 'Menor importe', icon: 'arrow-down' }].map(o => (
                <div key={o.id} onClick={() => setFilters(p => ({ ...p, sort: o.id }))} style={{ padding: '10px 12px', borderRadius: 12, cursor: 'pointer', fontSize: 11.5, fontWeight: 500, background: filters.sort === o.id ? t.accentSoft : t.surface2, color: filters.sort === o.id ? t.accent : t.text2, border: `1px solid ${filters.sort === o.id ? t.accent : 'transparent'}`, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
                  <PelasIcon name={o.icon} size={12} color={filters.sort === o.id ? t.accent : t.text2}/>{o.label}
                </div>
              ))}
            </div>
          </FilterSection>
        </div>
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 8, flexShrink: 0, background: t.bg }}>
          <button onClick={onReset} style={{ flex: 1, height: 46, borderRadius: 23, background: t.surface2, border: `1px solid ${t.border}`, color: t.text, fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Limpiar</button>
          <button onClick={onApply} style={{ flex: 1.6, height: 46, borderRadius: 23, border: 'none', background: t.accent, color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Mostrar {count}</button>
        </div>
      </div>
    </>
  );
};

// ── History Screen ───────────────────────────────────────────────────────────

const MONTHS     = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export const HistoryScreen = ({ theme, onNavigate, onBack, initialFilters, initialMonthIdx }) => {
  const t = T(theme);
  // Mock data lives in April (abr = index 3)
  const [monthIdx, setMonthIdx] = useState(initialMonthIdx ?? MOCK_TX_MONTH_INDEX);
  const [filters, setFilters]   = useState(() => mergeHistoryFilters(initialFilters));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const prevMonth = () => setMonthIdx(i => Math.max(0, i - 1));
  const nextMonth = () => setMonthIdx(i => Math.min(11, i + 1));

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 55 && Math.abs(dx) > dy) {
      dx > 0 ? prevMonth() : nextMonth();
    }
    touchStartX.current = null;
  };

  const matches = (tx) => {
    if (!filters.ignoreMonth && !txMatchesMonth(tx, monthIdx)) return false;
    if (!txMatchesDateRange(tx, filters.dateRange, filters.dateFrom, filters.dateTo)) return false;
    if (filters.type === 'income'  && tx.amount < 0)  return false;
    if (filters.type === 'expense' && tx.amount >= 0) return false;
    if (filters.accounts.length   && !filters.accounts.includes(tx.account))  return false;
    if (filters.categories.length && !filters.categories.includes(tx.cat))    return false;
    if (filters.cards.length      && !filters.cards.includes(tx.card))        return false;
    if (filters.locations.length  && !filters.locations.some(city => tx.location?.startsWith(city))) return false;
    const abs = Math.abs(tx.amount);
    if (abs < filters.amountMin || abs > filters.amountMax) return false;
    return true;
  };

  let filtered = PELAS_TRANSACTIONS.filter(matches);
  if (filters.sort === 'highest') filtered = [...filtered].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  if (filters.sort === 'lowest')  filtered = [...filtered].sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
  if (filters.sort === 'oldest')  filtered = [...filtered].reverse();

  const grouped = filtered.reduce((acc, tx) => {
    (acc[tx.date] = acc[tx.date] || []).push(tx);
    return acc;
  }, {});

  const activeCount =
    (filters.type !== 'all' ? 1 : 0) +
    filters.accounts.length + filters.categories.length +
    filters.cards.length + filters.locations.length +
    (filters.dateRange !== 'all' ? 1 : 0) +
    (filters.amountMin !== 0 || filters.amountMax !== 3000 ? 1 : 0) +
    (filters.sort !== 'recent' ? 1 : 0);

  const totalIn  = filtered.filter(tx => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
  const totalOut = filtered.filter(tx => tx.amount < 0).reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const net      = totalIn - totalOut;

  const IconBtn = ({ icon, onClick, active, badge }) => (
    <div onClick={onClick} style={{ width: 40, height: 40, borderRadius: 20, background: active ? t.accent : t.surface2, border: `1px solid ${active ? t.accent : t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
      <PelasIcon name={icon} size={16} color={active ? '#fff' : t.text}/>
      {badge > 0 && (
        <div style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: t.negative, color: '#fff', fontSize: 9.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${theme === 'dark' ? '#0E0E1A' : '#F4F6FB'}` }}>{badge}</div>
      )}
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 24px' }}>

        {/* Header — search + filter buttons */}
        <PelasHeader theme={theme} title="Historial" onBack={onBack} action={
          <div style={{ display: 'flex', gap: 8 }}>
            <IconBtn icon="search" onClick={() => onNavigate('search')}/>
            <IconBtn icon="filter" onClick={() => setDrawerOpen(true)} active={activeCount > 0} badge={activeCount}/>
          </div>
        }/>

        <div style={{ padding: '0 22px' }}>

          {/* Month navigator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: 18, background: t.surface2, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: monthIdx === 0 ? 'default' : 'pointer', opacity: monthIdx === 0 ? 0.3 : 1, flexShrink: 0 }}>
              <PelasIcon name="arrow-left" size={16} color={t.text2}/>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{MONTHS[monthIdx]}</div>
              <div style={{ fontSize: 11, color: t.text2 }}>2025</div>
            </div>
            <div onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: 18, background: t.surface2, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: monthIdx === 11 ? 'default' : 'pointer', opacity: monthIdx === 11 ? 0.3 : 1, flexShrink: 0 }}>
              <PelasIcon name="arrow-right" size={16} color={t.text2}/>
            </div>
          </div>

          {/* Active filter chips */}
          {activeCount > 0 && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginRight: -22, paddingRight: 22, marginBottom: 12 }}>
              {filters.type !== 'all' && <ActiveChip theme={theme} label={filters.type === 'income' ? 'Solo ingresos' : 'Solo gastos'} onClear={() => setFilters(p => ({ ...p, type: 'all' }))}/>}
              {filters.accounts.map(id => { const a = PELAS_ACCOUNTS.find(x => x.id === id); return <ActiveChip key={id} theme={theme} label={a?.name} color={a?.color} onClear={() => setFilters(p => ({ ...p, accounts: p.accounts.filter(x => x !== id) }))}/>; })}
              {filters.categories.map(id => { const c = PELAS_CATEGORIES.find(x => x.id === id); return <ActiveChip key={id} theme={theme} label={c?.label} color={c?.color} onClear={() => setFilters(p => ({ ...p, categories: p.categories.filter(x => x !== id) }))}/>; })}
              {filters.cards.map(c => <ActiveChip key={c} theme={theme} label={c} onClear={() => setFilters(p => ({ ...p, cards: p.cards.filter(x => x !== c) }))}/>)}
              {filters.locations.map(l => <ActiveChip key={l} theme={theme} label={'📍 ' + l} onClear={() => setFilters(p => ({ ...p, locations: p.locations.filter(x => x !== l) }))}/>)}
              {(filters.amountMin !== 0 || filters.amountMax !== 3000) && <ActiveChip theme={theme} label={`${filters.amountMin}–${filters.amountMax} €`} onClear={() => setFilters(p => ({ ...p, amountMin: 0, amountMax: 3000 }))}/>}
            </div>
          )}

          {/* Summary: Ingresos / Gastos / Neto */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, padding: '10px 10px', background: 'rgba(63,185,132,0.10)', borderRadius: 12 }}>
              <div style={{ fontSize: 9.5, color: t.text2 }}>Ingresos</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: t.positive, marginTop: 1 }}>+{totalIn.toFixed(2)} €</div>
            </div>
            <div style={{ flex: 1, padding: '10px 10px', background: 'rgba(225,99,100,0.10)', borderRadius: 12 }}>
              <div style={{ fontSize: 9.5, color: t.text2 }}>Gastos</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: t.negative, marginTop: 1 }}>−{totalOut.toFixed(2)} €</div>
            </div>
            <div style={{ flex: 1, padding: '10px 10px', background: net >= 0 ? 'rgba(63,185,132,0.10)' : 'rgba(225,99,100,0.10)', borderRadius: 12 }}>
              <div style={{ fontSize: 9.5, color: t.text2 }}>Neto</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: net >= 0 ? t.positive : t.negative, marginTop: 1 }}>{net >= 0 ? '+' : '−'}{Math.abs(net).toFixed(2)} €</div>
            </div>
          </div>

          {/* Transaction list */}
          <div style={{ marginTop: 4 }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: t.text2 }}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Sin movimientos</div>
                <div style={{ fontSize: 11.5 }}>No hay transacciones en {MONTHS[monthIdx].toLowerCase()}.</div>
              </div>
            )}
            {Object.entries(grouped).map(([date, txs]) => (
              <div key={date} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6, paddingLeft: 4 }}>{date}</div>
                <Card theme={theme} padding={14} radius={16}>
                  {txs.map((tx, i) => {
                    const cat = PELAS_CATEGORIES.find(c => c.id === tx.cat);
                    return (
                      <div key={tx.id}>
                        <TxRow theme={theme} tx={tx} cat={cat} onClick={() => onNavigate('tx-detail', { tx })}/>
                        {i < txs.length - 1 && <div style={{ height: 1, background: t.border, margin: '2px 0' }}/>}
                      </div>
                    );
                  })}
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
      <FilterDrawer theme={theme} open={drawerOpen} onClose={() => setDrawerOpen(false)} filters={filters} setFilters={setFilters} count={filtered.length} onApply={() => setDrawerOpen(false)} onReset={() => setFilters(DEFAULT_FILTERS)}/>
    </div>
  );
};

// ── TxDetail ─────────────────────────────────────────────────────────────────

// Mock map generator based on location text
const MockMap = ({ location, theme }) => {
  const t = T(theme);
  // Generate deterministic pin position based on location string
  const hash = location.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const pinX = 30 + (hash % 240);
  const pinY = 20 + ((hash * 7) % 80);
  const mapBg = theme === 'dark' ? '#1E2535' : '#E8EFF8';
  const roadColor = theme === 'dark' ? '#2A3448' : '#D0DCF0';
  const blockColor = theme === 'dark' ? '#252D3E' : '#D8E5F5';
  return (
    <svg width="100%" height={110} viewBox="0 0 320 110" style={{ display: 'block', borderRadius: 14 }}>
      <rect width="320" height="110" fill={mapBg}/>
      {/* Roads */}
      <rect x="0" y="40" width="320" height="12" fill={roadColor}/>
      <rect x="0" y="72" width="320" height="10" fill={roadColor}/>
      <rect x="60" y="0" width="10" height="110" fill={roadColor}/>
      <rect x="160" y="0" width="12" height="110" fill={roadColor}/>
      <rect x="250" y="0" width="10" height="110" fill={roadColor}/>
      {/* Blocks */}
      {[[10,5,45,32],[80,5,75,32],[188,5,55,32],[275,5,40,32],
        [10,56,45,50],[80,56,75,50],[188,56,55,50],[275,56,40,50]].map(([x,y,w,h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={blockColor} rx="3"/>
      ))}
      {/* Pin shadow */}
      <ellipse cx={pinX} cy={pinY + 18} rx="6" ry="2.5" fill="rgba(0,0,0,0.18)"/>
      {/* Pin */}
      <circle cx={pinX} cy={pinY} r="10" fill="var(--pelas-accent)" stroke="#fff" strokeWidth="2.5"/>
      <circle cx={pinX} cy={pinY} r="4" fill="#fff"/>
    </svg>
  );
};

export const TxDetailScreen = ({ theme, tx, onBack, onNavigate }) => {
  const t = T(theme);
  const [showMenu, setShowMenu] = useState(false);
  if (!tx) return null;
  const cat = PELAS_CATEGORIES.find(c => c.id === tx.cat);
  const positive = tx.amount >= 0;
  const hasLocation = tx.location && tx.location !== 'Online' && tx.location !== 'Transferencia' && tx.location !== 'Domiciliación';

  return (
    <div style={{ position: 'relative' }}>
      <PelasHeader theme={theme} title="Detalle" onBack={onBack} action={
        <div style={{ position: 'relative' }}>
          <div onClick={() => setShowMenu(v => !v)} style={{ width: 40, height: 40, borderRadius: 20, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PelasIcon name="more" size={18} color={t.text}/>
          </div>
          {showMenu && (
            <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 46, right: 0, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: 10, minWidth: 160, overflow: 'hidden' }}>
              <div onClick={() => setShowMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', cursor: 'pointer', borderBottom: `1px solid ${t.border}` }}>
                <PelasIcon name="edit" size={15} color={t.text2}/>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Editar</span>
              </div>
              <div onClick={() => setShowMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', cursor: 'pointer' }}>
                <PelasIcon name="x" size={15} color={t.negative}/>
                <span style={{ fontSize: 13, fontWeight: 500, color: t.negative }}>Eliminar</span>
              </div>
            </div>
          )}
        </div>
      }/>
      {showMenu && <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 5 }}/>}
      <div style={{ padding: '0 22px 24px' }}>
        <div style={{ textAlign: 'center', padding: '18px 0 24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: positive ? 'rgba(63,185,132,0.16)' : (cat?.color + '22' || t.surface2), display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <PelasIcon name={positive ? 'arrow-down' : (cat?.icon || 'card')} size={26} color={positive ? t.positive : (cat?.color || t.accent)}/>
          </div>
          <div style={{ fontSize: 13, color: t.text2 }}>{tx.sub}</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginTop: 2 }}>{tx.name}</div>
          <div style={{ fontSize: 30, fontWeight: 600, marginTop: 12, letterSpacing: -0.8, color: positive ? t.positive : t.text }}>
            {positive ? '+' : '−'}{Math.abs(tx.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </div>
          <div style={{ fontSize: 12, color: t.text2, marginTop: 4 }}>{tx.date} · {tx.time}</div>
        </div>
        <Card theme={theme} padding={16} radius={18} style={{ marginBottom: 14 }}>
          {[['Estado', <span key="e" style={{ color: t.positive, fontWeight: 500 }}>● Completado</span>], ['Tarjeta', tx.card + ' · ••7852'], ['Categoría', cat?.label || 'Otros'], ['Referencia', '#PLS-' + tx.id.toUpperCase() + '-2026'], ['Comisión', '0,00 €']].map(([k, v], i, arr) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : 'none' }}>
              <div style={{ fontSize: 12.5, color: t.text2 }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </Card>
        <Card theme={theme} padding={14} radius={18} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: t.text2, marginBottom: 6 }}>Nota</div>
          <div style={{ fontSize: 13 }}>Compra del fin de semana · pollo, verduras, fruta y café.</div>
        </Card>
        {hasLocation && (
          <Card theme={theme} padding={14} radius={18} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <PelasIcon name="search" size={13} color={t.accent}/>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{tx.location}</div>
            </div>
            <div style={{ borderRadius: 14, overflow: 'hidden' }}>
              <MockMap location={tx.location} theme={theme}/>
            </div>
          </Card>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <PrimaryButton theme={theme} variant="secondary" full>Repetir</PrimaryButton>
          <PrimaryButton theme={theme} full>Editar</PrimaryButton>
        </div>
      </div>
    </div>
  );
};

// ── Profile ───────────────────────────────────────────────────────────────────

export const ProfileScreen = ({ theme, onNavigate, onBack, setTheme }) => {
  const t = T(theme);
  const groups = [
    {
      title: 'Cuenta',
      items: [
        { icon: 'user', label: 'Datos personales', sub: 'Nombre, email, teléfono', onClick: () => onNavigate('personal-data') },
        { icon: 'lock', label: 'Seguridad', sub: 'Biometría, PIN, contraseña', onClick: () => onNavigate('security') },
        { icon: 'filter', label: 'Categorías', sub: 'Gestiona tus categorías', onClick: () => onNavigate('profile-categories') },
      ],
    },
    {
      title: 'Preferencias',
      items: [
        { icon: 'bell', label: 'Notificaciones', sub: 'Personaliza alertas', onClick: () => onNavigate('notification-settings') },
        { icon: 'settings', label: 'Tema y estilo', sub: 'Personaliza colores y fuentes', onClick: () => onNavigate('theme-style') },
        { icon: 'globe', label: 'Idioma', sub: 'Español (España)', onClick: () => onNavigate('language') },
      ],
    },
    {
      title: 'Familia',
      items: [
        { icon: 'people', label: 'Grupo familiar', sub: 'Comparte gastos con tu familia', onClick: () => onNavigate('family-group') },
      ],
    },
    {
      title: 'Datos',
      items: [
        { icon: 'arrow-up', label: 'Exportar base de datos', sub: 'CSV, JSON o Excel', onClick: () => onNavigate('export-data') },
        { icon: 'arrow-down', label: 'Importar base de datos', sub: 'Con archivo plantilla', onClick: () => onNavigate('import-data') },
        { icon: 'shield', label: 'Backup en la nube', sub: 'iCloud, Google Drive, OneDrive', onClick: () => onNavigate('cloud-backup') },
      ],
    },
  ];
  return (
    <div style={{ padding: '8px 22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        {onBack && (
          <div onClick={onBack} style={{ width: 40, height: 40, borderRadius: 20, background: t.surface2, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PelasIcon name="arrow-left" size={16} color={t.text}/>
          </div>
        )}
        <div style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>Perfil</div>
        <div onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ width: 40, height: 40, borderRadius: 20, background: t.surface2, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <PelasIcon name={theme === 'dark' ? 'sun' : 'moon'} size={18} color={t.text}/>
        </div>
      </div>
      <Card theme={theme} padding={18} radius={22} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <div style={{ width: 56, height: 56, borderRadius: 28, background: 'linear-gradient(135deg,#0066FF,#7C5CFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 18 }}>MB</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Marta Bayón</div>
          <div style={{ fontSize: 12, color: t.text2 }}>marta.bayon@correo.es</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, background: 'rgba(0,102,255,0.12)', padding: '2px 8px', borderRadius: 6 }}>
            <div style={{ width: 4, height: 4, borderRadius: 2, background: t.accent }}/>
            <span style={{ fontSize: 10.5, color: t.accent, fontWeight: 600 }}>PELAS PRO</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(225,99,100,0.1)', border: '1px solid rgba(225,99,100,0.25)', borderRadius: 12, padding: '7px 11px', cursor: 'pointer', flexShrink: 0 }}>
          <PelasIcon name="logout" size={14} color={t.negative}/>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: t.negative }}>Salir</span>
        </div>
      </Card>
      {groups.map(g => (
        <div key={g.title} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>{g.title}</div>
          <Card theme={theme} padding={6} radius={18}>
            {g.items.map((it, i) => (
              <div key={it.label} onClick={it.onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', borderBottom: i < g.items.length - 1 ? `1px solid ${t.border}` : 'none', cursor: 'pointer' }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PelasIcon name={it.icon} size={16} color={t.accent}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: t.text }}>{it.label}</div>
                  {it.sub && <div style={{ fontSize: 11, color: t.text2 }}>{it.sub}</div>}
                </div>
                <PelasIcon name="chevron-right" size={16} color={t.text2}/>
              </div>
            ))}
          </Card>
        </div>
      ))}
      <div style={{ textAlign: 'center', fontSize: 11, color: t.text3, marginTop: 16 }}>Pelas v2.4.0 · 2026</div>
    </div>
  );
};

// ── Categories ────────────────────────────────────────────────────────────────

export const CategoriesScreen = ({ theme, onNavigate, onBack }) => {
  const t = T(theme);
  const total = PELAS_CATEGORIES.reduce((s, c) => s + c.spent, 0);
  return (
    <div>
      <PelasHeader theme={theme} title="Categorías" onBack={onBack}/>
      <div style={{ padding: '0 22px 24px' }}>
        <Card theme={theme} padding={18} radius={20} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: t.text2 }}>Gasto este mes</div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.6, marginTop: 2 }}>{total.toFixed(2)} €</div>
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 12 }}>
            {PELAS_CATEGORIES.map(c => <div key={c.id} style={{ flex: c.spent, background: c.color }}/>)}
          </div>
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {PELAS_CATEGORIES.map(c => {
            const pct = (c.spent / c.budget) * 100;
            return (
              <Card key={c.id} theme={theme} padding={14} radius={16} onClick={() => onNavigate('category', { cat: c })} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: c.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PelasIcon name={c.icon} size={16} color={c.color}/>
                  </div>
                  <div style={{ fontSize: 11, color: pct > 90 ? t.negative : t.text2, fontWeight: 600 }}>{Math.round(pct)}%</div>
                </div>
                <div style={{ fontSize: 12, color: t.text2 }}>{c.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, marginBottom: 8 }}>{c.spent.toFixed(2)} €</div>
                <Progress value={pct} color={c.color} track={t.surface2} height={4}/>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Budgets ────────────────────────────────────────────────────────────────────

// ── Add / Edit Budget sheet ────────────────────────────────────────────────────

const BUDGET_COLORS = ['#0066FF','#7C5CFF','#FF8A4C','#5B8DEF','#3FB984','#E16364'];

const BUDGET_PERIODS = [
  { id: 'weekly',    label: 'Semanal' },
  { id: 'monthly',   label: 'Mensual' },
  { id: 'quarterly', label: 'Trimestral' },
  { id: 'yearly',    label: 'Anual' },
  { id: 'custom',    label: 'Personalizado' },
];

const AddBudgetSheet = ({ theme, initial, onSave, onClose }) => {
  const t = T(theme);
  const isEdit = !!initial;
  const [form, setForm] = useState({
    label: initial?.label || '',
    budget: initial?.budget?.toString() || '',
    spent: initial?.spent?.toString() || '0',
    color: initial?.color || BUDGET_COLORS[0],
    period: initial?.period || 'monthly',
    dateFrom: initial?.dateFrom || '',
    dateTo: initial?.dateTo || '',
    categories: initial?.categories || [],
  });
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));

  const toggleCategory = (id) => {
    setForm(s => ({
      ...s,
      categories: s.categories.includes(id)
        ? s.categories.filter(c => c !== id)
        : [...s.categories, id],
    }));
  };

  const handleSave = () => {
    if (!form.label.trim() || !form.budget) return;
    onSave({
      id: initial?.id || ('b' + Date.now()),
      label: form.label.trim(),
      budget: parseFloat(form.budget) || 0,
      spent: parseFloat(form.spent) || 0,
      color: form.color,
      period: form.period,
      categories: form.categories,
    });
  };

  const NumberField = ({ label, value, onChange, placeholder }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48, gap: 6 }}>
        <input value={value} onChange={e => onChange(e.target.value.replace(/[^0-9.]/g,''))} placeholder={placeholder} inputMode="decimal"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 15, fontWeight: 500 }}/>
        <span style={{ fontSize: 14, color: t.text2 }}>€</span>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', maxHeight: '92%', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease-out' }}>
        <div style={{ padding: '14px 22px 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 14px' }}/>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>{isEdit ? 'Editar presupuesto' : 'Nuevo presupuesto'}</div>
            <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PelasIcon name="x" size={15} color={t.text2}/>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px' }}>

          {/* Nombre */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>Nombre</div>
            <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48 }}>
              <input value={form.label} onChange={e => set('label', e.target.value)} placeholder="p. ej. Comida y restaurantes"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}/>
            </div>
          </div>

          {/* Periodo */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 8 }}>Periodo</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {BUDGET_PERIODS.map(p => (
                <div key={p.id} onClick={() => set('period', p.id)}
                  style={{ height: 36, paddingLeft: 12, paddingRight: 12, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: form.period === p.id ? t.accent : t.surface2, color: form.period === p.id ? '#fff' : t.text2, transition: 'all 0.18s' }}>
                  {p.label}
                </div>
              ))}
            </div>
            {form.period === 'custom' && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10.5, color: t.text3, marginBottom: 6 }}>Los presupuestos con fechas delimitadas no se repiten</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: t.text2, marginBottom: 4 }}>Fecha inicio</div>
                    <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12, padding: '0 12px', height: 44, gap: 8 }}>
                      <PelasIcon name="calendar" size={14} color={t.text2}/>
                      <input
                        type="date"
                        value={form.dateFrom}
                        onChange={e => set('dateFrom', e.target.value)}
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 13 }}
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: t.text2, marginBottom: 4 }}>Fecha fin</div>
                    <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12, padding: '0 12px', height: 44, gap: 8 }}>
                      <PelasIcon name="calendar" size={14} color={t.text2}/>
                      <input
                        type="date"
                        value={form.dateTo}
                        onChange={e => set('dateTo', e.target.value)}
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 13 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Límite y ya gastado */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><NumberField label="Límite" value={form.budget} onChange={v => set('budget', v)} placeholder="600"/></div>
            <div style={{ flex: 1 }}><NumberField label="Ya gastado" value={form.spent} onChange={v => set('spent', v)} placeholder="0"/></div>
          </div>

          {/* Categorías */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 4 }}>Categorías asociadas</div>
            <div style={{ fontSize: 10.5, color: t.text3, marginBottom: 10 }}>Selecciona las categorías que cuentan para este presupuesto</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PELAS_CATEGORIES.map(cat => {
                const selected = form.categories.includes(cat.id);
                return (
                  <div key={cat.id} onClick={() => toggleCategory(cat.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 13, background: selected ? cat.color + '18' : t.surface2, border: `1.5px solid ${selected ? cat.color : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: cat.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <PelasIcon name={cat.icon} size={14} color={cat.color}/>
                    </div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: selected ? t.text : t.text2 }}>{cat.label}</div>
                    <div style={{ width: 20, height: 20, borderRadius: 10, background: selected ? cat.color : t.surface2, border: `1.5px solid ${selected ? cat.color : t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}>
                      {selected && <PelasIcon name="check" size={11} color="#fff" strokeWidth={2.5}/>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Color */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 8 }}>Color</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {BUDGET_COLORS.map(c => (
                <div key={c} onClick={() => set('color', c)} style={{ flex: 1, height: 32, borderRadius: 10, background: c, cursor: 'pointer', border: form.color === c ? '2px solid #fff' : '2px solid transparent', boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none', transition: 'box-shadow 0.15s' }}/>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 22px 22px', flexShrink: 0 }}>
          <button onClick={handleSave} style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: !form.label.trim() || !form.budget ? t.surface2 : t.accent, color: !form.label.trim() || !form.budget ? t.text2 : '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            {isEdit ? 'Guardar cambios' : 'Crear presupuesto'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Budgets Screen ─────────────────────────────────────────────────────────────

const BUDGET_SUMMARY_MODES = [
  { id: 'weekly',  label: 'Semanal', mult: 0.25, daysLeft: 3   },
  { id: 'monthly', label: 'Mensual', mult: 1,    daysLeft: 28  },
  { id: 'yearly',  label: 'Anual',   mult: 12,   daysLeft: 245 },
];

export const BudgetsScreen = ({ theme, onBack }) => {
  const t = T(theme);
  const [budgets, setBudgets] = useState(PELAS_BUDGETS);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [summaryIdx, setSummaryIdx] = useState(1);
  const touchStartXBudget = useRef(null);

  const mode = BUDGET_SUMMARY_MODES[summaryIdx];
  const baseTotalSpent  = budgets.reduce((s, b) => s + b.spent, 0);
  const baseTotalBudget = budgets.reduce((s, b) => s + b.budget, 0);
  const totalSpent  = Math.round(baseTotalSpent  * mode.mult);
  const totalBudget = Math.round(baseTotalBudget * mode.mult);
  const pct         = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const remaining   = totalBudget - totalSpent;
  const barColor    = pct < 70 ? t.positive : pct < 90 ? t.warning : t.negative;

  const handleSave = (b) => {
    setBudgets(prev => prev.some(x => x.id === b.id) ? prev.map(x => x.id === b.id ? b : x) : [...prev, b]);
    setShowAdd(false); setEditItem(null);
  };

  const handleDelete = (id) => setBudgets(prev => prev.filter(x => x.id !== id));

  const onBudgetTouchStart = (e) => { touchStartXBudget.current = e.touches[0].clientX; };
  const onBudgetTouchEnd = (e) => {
    if (touchStartXBudget.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartXBudget.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) setSummaryIdx(i => Math.min(BUDGET_SUMMARY_MODES.length - 1, i + 1));
      else         setSummaryIdx(i => Math.max(0, i - 1));
    }
    touchStartXBudget.current = null;
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ overflowY: 'auto', height: '100%' }}>
        <PelasHeader theme={theme} title="Presupuestos"
          onBack={onBack}
          action={<div onClick={() => setShowAdd(true)} style={{ fontSize: 13, fontWeight: 600, color: t.accent, cursor: 'pointer' }}>+ Nuevo</div>}
        />
        <div style={{ padding: '0 22px 100px' }}>

          {/* Resumen deslizable (semanal/mensual/anual) */}
          <Card theme={theme} padding={18} radius={20} style={{ marginBottom: 20 }} onTouchStart={onBudgetTouchStart} onTouchEnd={onBudgetTouchEnd}>
            {/* Selector de período */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 14, padding: 3, background: t.surface2, borderRadius: 10 }}>
              {BUDGET_SUMMARY_MODES.map((m, i) => (
                <div key={m.id} onClick={() => setSummaryIdx(i)} style={{ flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 500, background: summaryIdx === i ? t.surface : 'transparent', color: summaryIdx === i ? t.accent : t.text2, transition: 'all 0.18s', boxShadow: summaryIdx === i ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                  {m.label}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: t.text2, marginBottom: 4 }}>
                  Gastado {mode.id === 'weekly' ? 'esta semana' : mode.id === 'monthly' ? 'este mes' : 'este año'}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.8, color: barColor }}>{pct}%</span>
                  <span style={{ fontSize: 12, color: t.text2 }}>de {totalBudget.toLocaleString('es-ES')} €</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: t.text2 }}>Te quedan</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: t.text }}>{remaining.toLocaleString('es-ES')} €</div>
                <div style={{ fontSize: 10.5, color: t.text3 }}>{mode.daysLeft} días</div>
              </div>
            </div>
            <div style={{ width: '100%', height: 8, background: t.surface2, borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: 4, background: barColor, transition: 'width 0.5s ease' }}/>
            </div>
            {/* Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
              {BUDGET_SUMMARY_MODES.map((_, i) => (
                <div key={i} onClick={() => setSummaryIdx(i)} style={{ width: summaryIdx === i ? 14 : 5, height: 5, borderRadius: 3, background: summaryIdx === i ? t.accent : t.borderStrong, transition: 'all 0.2s', cursor: 'pointer' }}/>
              ))}
            </div>
          </Card>

          {/* Lista de presupuestos */}
          {budgets.map(b => {
            const p   = b.budget > 0 ? Math.round((b.spent / b.budget) * 100) : 0;
            const rem = b.budget - b.spent;
            const danger = p > 90;
            return (
              <Card key={b.id} theme={theme} padding={16} radius={18} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: danger ? t.negative : b.color, marginTop: 2 }}/>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{b.label}</div>
                      <div style={{ fontSize: 11, color: t.text2, marginTop: 2 }}>Quedan {rem.toLocaleString('es-ES')} € · {daysLeft} días</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: danger ? t.negative : t.text }}>{b.spent} €</div>
                      <div style={{ fontSize: 11, color: t.text2 }}>de {b.budget} €</div>
                    </div>
                    <div onClick={() => setEditItem(b)} style={{ width: 30, height: 30, borderRadius: 9, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <PelasIcon name="more" size={14} color={t.text2}/>
                    </div>
                  </div>
                </div>
                <Progress value={p} color={danger ? t.negative : b.color} track={t.surface2} height={6}/>
              </Card>
            );
          })}

          {budgets.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: t.text2 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>💸</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Sin presupuestos</div>
              <div style={{ fontSize: 12 }}>Crea tu primer presupuesto mensual</div>
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <div onClick={() => setShowAdd(true)} style={{ position: 'absolute', bottom: 24, right: 22, display: 'flex', alignItems: 'center', gap: 8, background: t.accent, color: '#fff', borderRadius: 28, padding: '14px 22px', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,102,255,0.35)' }}>
        <PelasIcon name="plus" size={16} color="#fff" strokeWidth={2.6}/>
        Nuevo presupuesto
      </div>

      {showAdd   && <AddBudgetSheet theme={theme} onSave={handleSave} onClose={() => setShowAdd(false)}/>}
      {editItem  && (
        <AddBudgetSheet theme={theme} initial={editItem} onSave={handleSave} onClose={() => setEditItem(null)}>
          <div onClick={() => { handleDelete(editItem.id); setEditItem(null); }} style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: t.negative, cursor: 'pointer', fontWeight: 500 }}>
            Eliminar presupuesto
          </div>
        </AddBudgetSheet>
      )}
    </div>
  );
};

// ── Add / Edit Goal sheet ──────────────────────────────────────────────────────

const GOAL_ICONS = ['plane','shield','laptop','heart','globe','goal','cart','home','bag','book','sun','card'];
const GOAL_COLORS = ['#0066FF','#3FB984','#7C5CFF','#FF8A4C','#FFC234','#E16364'];

const AddGoalSheet = ({ theme, initial, onSave, onClose }) => {
  const t = T(theme);
  const isEdit = !!initial;
  const [form, setForm] = useState({
    label: initial?.label || '',
    target: initial?.target?.toString() || '',
    saved: initial?.saved?.toString() || '0',
    due: initial?.due || '',
    icon: initial?.icon || 'goal',
    color: initial?.color || GOAL_COLORS[0],
  });
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));

  const handleSave = () => {
    if (!form.label.trim() || !form.target) return;
    onSave({
      id: initial?.id || ('g' + Date.now()),
      label: form.label.trim(),
      target: parseFloat(form.target) || 0,
      saved: parseFloat(form.saved) || 0,
      due: form.due.trim() || 'Sin fecha',
      icon: form.icon,
      color: form.color,
    });
  };

  const NumberField = ({ label, value, onChange, placeholder }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48, gap: 6 }}>
        <input value={value} onChange={e => onChange(e.target.value.replace(/[^0-9.]/g,''))} placeholder={placeholder} inputMode="decimal"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 15, fontWeight: 500 }}/>
        <span style={{ fontSize: 14, color: t.text2 }}>€</span>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', maxHeight: '92%', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease-out' }}>
        <div style={{ padding: '14px 22px 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 14px' }}/>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>{isEdit ? 'Editar meta' : 'Nueva meta'}</div>
            <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PelasIcon name="x" size={15} color={t.text2}/>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px' }}>

          {/* Preview badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: form.color + '22', border: `2px solid ${form.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PelasIcon name={form.icon} size={28} color={form.color}/>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>Nombre de la meta</div>
            <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48 }}>
              <input value={form.label} onChange={e => set('label', e.target.value)} placeholder="p. ej. Viaje a Japón"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}/>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><NumberField label="Objetivo" value={form.target} onChange={v => set('target', v)} placeholder="4000"/></div>
            <div style={{ flex: 1 }}><NumberField label="Ya ahorrado" value={form.saved} onChange={v => set('saved', v)} placeholder="0"/></div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>Fecha objetivo</div>
            <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48, gap: 8 }}>
              <PelasIcon name="calendar" size={16} color={t.text2}/>
              <input value={form.due} onChange={e => set('due', e.target.value)} placeholder="p. ej. Octubre 2026"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}/>
            </div>
          </div>

          {/* Icon picker */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 8 }}>Icono</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {GOAL_ICONS.map(ic => (
                <div key={ic} onClick={() => set('icon', ic)} style={{ width: 42, height: 42, borderRadius: 12, background: form.icon === ic ? form.color + '22' : t.surface2, border: `1.5px solid ${form.icon === ic ? form.color : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <PelasIcon name={ic} size={18} color={form.icon === ic ? form.color : t.text2}/>
                </div>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 8 }}>Color</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {GOAL_COLORS.map(c => (
                <div key={c} onClick={() => set('color', c)} style={{ flex: 1, height: 32, borderRadius: 10, background: c, cursor: 'pointer', border: form.color === c ? '2px solid #fff' : '2px solid transparent', boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none', transition: 'box-shadow 0.15s' }}/>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 22px 22px', flexShrink: 0 }}>
          <button onClick={handleSave} style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: !form.label.trim() || !form.target ? t.surface2 : t.accent, color: !form.label.trim() || !form.target ? t.text2 : '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            {isEdit ? 'Guardar cambios' : 'Crear meta'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Add Goal Transaction Sheet ─────────────────────────────────────────────────

const AddGoalTransactionSheet = ({ theme, goal, onSave, onClose }) => {
  const t = T(theme);
  const [amount, setAmount] = useState('0');
  const [account, setAccount] = useState(PELAS_ACCOUNTS[1]);
  const [note, setNote] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);

  const press = (k) => {
    if (k === '⌫') { setAmount(a => a.length > 1 ? a.slice(0, -1) : '0'); return; }
    if (k === ',') { if (!amount.includes(',')) setAmount(a => a + ','); return; }
    setAmount(a => a === '0' ? k : a + k);
  };

  const numVal = parseFloat(amount.replace(',', '.')) || 0;

  const handleSave = () => {
    if (numVal <= 0) return;
    const now = new Date();
    onSave({
      id: 'gt' + Date.now(),
      goalId: goal.id,
      name: note.trim() || 'Aportación a meta',
      amount: numVal,
      account: account.name,
      date: 'Hoy',
      time: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    });
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', padding: '14px 22px 28px', animation: 'slideUp 0.25s ease-out', maxHeight: '92%', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 14px' }}/>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>Nueva aportación</div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PelasIcon name="x" size={15} color={t.text2}/>
          </div>
        </div>

        {/* Goal tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: goal.color + '18', border: `1px solid ${goal.color}44`, borderRadius: 14, padding: '10px 14px', marginBottom: 18 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: goal.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PelasIcon name={goal.icon} size={15} color={goal.color}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, color: t.text2 }}>Meta asociada</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: goal.color }}>{goal.label}</div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(63,185,132,0.15)', borderRadius: 8, padding: '3px 8px' }}>
            <PelasIcon name="arrow-down" size={11} color={t.positive}/>
            <span style={{ fontSize: 11, fontWeight: 600, color: t.positive }}>Ingreso</span>
          </div>
        </div>

        {/* Amount */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Importe</div>
          <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1.6, color: t.positive, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
            <span style={{ fontSize: 28, opacity: 0.7 }}>+</span>
            <span>{amount}</span>
            <span style={{ fontSize: 22, color: t.text2, fontWeight: 500 }}>€</span>
          </div>
        </div>

        {/* Account picker */}
        <Card theme={theme} padding={0} radius={14} style={{ marginBottom: 12, overflow: 'hidden' }}>
          <div onClick={() => setAccountOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer' }}>
            <div style={{ fontSize: 11, color: t.text2, width: 60, flexShrink: 0 }}>Cuenta</div>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: account.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PelasIcon name={account.icon} size={14} color={account.color}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{account.name}</div>
              <div style={{ fontSize: 11, color: t.text2 }}>{account.bank}</div>
            </div>
            <PelasIcon name="chevron-right" size={15} color={t.text2}/>
          </div>
          {accountOpen && (
            <div style={{ borderTop: `1px solid ${t.border}`, padding: 8 }}>
              {PELAS_ACCOUNTS.map(a => (
                <div key={a.id} onClick={() => { setAccount(a); setAccountOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, cursor: 'pointer', background: account.id === a.id ? t.accentSoft : 'transparent' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: a.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PelasIcon name={a.icon} size={13} color={a.color}/>
                  </div>
                  <div style={{ flex: 1, fontSize: 13 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: t.text2 }}>{a.balance.toFixed(2)} €</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Note */}
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Añadir nota (opcional)"
          style={{ width: '100%', boxSizing: 'border-box', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 13, padding: '13px 14px', fontSize: 13, color: t.text, outline: 'none', fontFamily: 'inherit', marginBottom: 12, display: 'block' }}
        />

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
          {['1','2','3','4','5','6','7','8','9',',','0','⌫'].map(k => (
            <div key={k} onClick={() => press(k)} style={{ padding: '12px 0', textAlign: 'center', borderRadius: 12, background: t.surface, border: `1px solid ${t.border}`, fontSize: 18, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>{k}</div>
          ))}
        </div>

        <button
          onClick={handleSave}
          style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: numVal > 0 ? t.positive : t.surface2, color: numVal > 0 ? '#fff' : t.text2, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Guardar aportación
        </button>
      </div>
    </div>
  );
};

// ── Goals Screen ───────────────────────────────────────────────────────────────

export const GoalsScreen = ({ theme, onBack }) => {
  const t = T(theme);
  const [goals, setGoals] = useState(PELAS_GOALS);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [goalTxs, setGoalTxs] = useState([]);
  const [showAddTx, setShowAddTx] = useState(false);

  const totalSaved  = goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);

  const currentGoal = selectedGoalId ? goals.find(g => g.id === selectedGoalId) : null;
  const currentTxs  = currentGoal ? goalTxs.filter(tx => tx.goalId === currentGoal.id) : [];

  const handleSave = (g) => {
    setGoals(prev => prev.some(x => x.id === g.id) ? prev.map(x => x.id === g.id ? g : x) : [...prev, g]);
    setShowAdd(false); setEditItem(null);
  };
  const handleDelete = (id) => { setGoals(prev => prev.filter(x => x.id !== id)); setSelectedGoalId(null); };
  const handleAddTx = (tx) => {
    setGoalTxs(prev => [tx, ...prev]);
    setGoals(prev => prev.map(g => g.id === tx.goalId ? { ...g, saved: parseFloat((g.saved + tx.amount).toFixed(2)) } : g));
    setShowAddTx(false);
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ overflowY: 'auto', height: '100%' }}>

        {currentGoal ? (
          /* ── Detail view ── */
          <>
            <PelasHeader
              theme={theme}
              title={currentGoal.label}
              onBack={() => setSelectedGoalId(null)}
              action={
                <div onClick={() => setEditItem(currentGoal)} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <PelasIcon name="more" size={16} color={t.text2}/>
                </div>
              }
            />
            <div style={{ padding: '0 22px 100px' }}>

              {/* Hero card */}
              {(() => {
                const pct = currentGoal.target > 0 ? Math.min(100, Math.round((currentGoal.saved / currentGoal.target) * 100)) : 0;
                const left = currentGoal.target - currentGoal.saved;
                return (
                  <Card theme={theme} padding={20} radius={22} style={{ marginBottom: 18, background: theme === 'dark' ? `linear-gradient(140deg,${currentGoal.color}18 0%,rgba(0,0,0,0) 100%)` : `linear-gradient(140deg,${currentGoal.color}0D 0%,#ffffff 100%)` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 17, background: currentGoal.color + '22', border: `2px solid ${currentGoal.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PelasIcon name={currentGoal.icon} size={24} color={currentGoal.color}/>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: t.text2, marginBottom: 2 }}>Objetivo · {currentGoal.due}</div>
                        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: currentGoal.color }}>{currentGoal.saved.toLocaleString('es-ES')} €</div>
                        <div style={{ fontSize: 12, color: t.text2 }}>de {currentGoal.target.toLocaleString('es-ES')} €</div>
                      </div>
                      <div style={{ fontSize: 30, fontWeight: 700, color: currentGoal.color }}>{pct}%</div>
                    </div>
                    <Progress value={pct} color={currentGoal.color} track={t.surface2} height={8}/>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: t.text2 }}>
                      <span>{currentGoal.saved.toLocaleString('es-ES')} € ahorrados</span>
                      <span>faltan {left.toLocaleString('es-ES')} €</span>
                    </div>
                  </Card>
                );
              })()}

              {/* Transactions */}
              <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>
                Aportaciones ({currentTxs.length})
              </div>

              {currentTxs.length === 0 ? (
                <Card theme={theme} padding={28} radius={18}>
                  <div style={{ textAlign: 'center', color: t.text2 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 16, background: currentGoal.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <PelasIcon name="plus" size={22} color={currentGoal.color}/>
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 4 }}>Sin aportaciones aún</div>
                    <div style={{ fontSize: 12 }}>Añade tu primera aportación a esta meta</div>
                  </div>
                </Card>
              ) : (
                <Card theme={theme} padding={6} radius={18}>
                  {currentTxs.map((tx, i) => (
                    <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', borderBottom: i < currentTxs.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: currentGoal.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <PelasIcon name={currentGoal.icon} size={16} color={currentGoal.color}/>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.name}</div>
                        <div style={{ fontSize: 11, color: t.text2, marginTop: 2 }}>{tx.date} · {tx.time} · {tx.account}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: t.positive }}>
                        +{tx.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          </>
        ) : (
          /* ── List view ── */
          <>
            <PelasHeader theme={theme} title="Mis metas"
              onBack={onBack}
              action={<div onClick={() => setShowAdd(true)} style={{ fontSize: 13, fontWeight: 600, color: t.accent, cursor: 'pointer' }}>+ Nueva</div>}
            />
            <div style={{ padding: '0 22px 100px' }}>

              {goals.length > 0 && (
                <Card theme={theme} padding={18} radius={20} style={{ marginBottom: 20, background: theme === 'dark' ? 'linear-gradient(140deg,#0B2A1F 0%,#1A1A28 80%)' : 'linear-gradient(140deg,#E0FFF0 0%,#FFFFFF 80%)', border: 'none' }}>
                  <div style={{ fontSize: 11, color: t.text2, marginBottom: 4 }}>Total ahorrado</div>
                  <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8, color: t.positive }}>{totalSaved.toLocaleString('es-ES')} €</div>
                  <div style={{ fontSize: 11.5, color: t.text2, marginTop: 4 }}>de {totalTarget.toLocaleString('es-ES')} € en {goals.length} meta{goals.length !== 1 ? 's' : ''}</div>
                  <div style={{ width: '100%', height: 6, background: t.surface2, borderRadius: 3, overflow: 'hidden', marginTop: 14 }}>
                    <div style={{ width: `${Math.min(100, Math.round((totalSaved / totalTarget) * 100))}%`, height: '100%', borderRadius: 3, background: t.positive }}/>
                  </div>
                </Card>
              )}

              {goals.map(g => {
                const pct = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0;
                const left = g.target - g.saved;
                const txCount = goalTxs.filter(tx => tx.goalId === g.id).length;
                return (
                  <Card key={g.id} theme={theme} padding={16} radius={18} style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => setSelectedGoalId(g.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: g.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <PelasIcon name={g.icon} size={20} color={g.color}/>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{g.label}</div>
                        <div style={{ fontSize: 11, color: t.text2, marginTop: 2 }}>
                          {g.due}{txCount > 0 ? ` · ${txCount} aportación${txCount !== 1 ? 'es' : ''}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: g.color }}>{pct}%</div>
                          <div style={{ fontSize: 10.5, color: t.text2 }}>faltan {left.toLocaleString('es-ES')} €</div>
                        </div>
                        <div onClick={e => { e.stopPropagation(); setEditItem(g); }} style={{ width: 30, height: 30, borderRadius: 9, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                          <PelasIcon name="more" size={14} color={t.text2}/>
                        </div>
                      </div>
                    </div>
                    <Progress value={pct} color={g.color} track={t.surface2} height={6}/>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: t.text2 }}>
                      <span>{g.saved.toLocaleString('es-ES')} € ahorrados</span>
                      <span>objetivo {g.target.toLocaleString('es-ES')} €</span>
                    </div>
                  </Card>
                );
              })}

              {goals.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: t.text2 }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>🎯</div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Sin metas todavía</div>
                  <div style={{ fontSize: 12 }}>Crea tu primera meta de ahorro</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* FAB */}
      {currentGoal ? (
        <div onClick={() => setShowAddTx(true)} style={{ position: 'absolute', bottom: 24, right: 22, display: 'flex', alignItems: 'center', gap: 8, background: currentGoal.color, color: '#fff', borderRadius: 28, padding: '14px 22px', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: `0 4px 20px ${currentGoal.color}55` }}>
          <PelasIcon name="plus" size={16} color="#fff" strokeWidth={2.6}/>
          Añadir aportación
        </div>
      ) : (
        <div onClick={() => setShowAdd(true)} style={{ position: 'absolute', bottom: 24, right: 22, display: 'flex', alignItems: 'center', gap: 8, background: t.positive, color: '#fff', borderRadius: 28, padding: '14px 22px', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(63,185,132,0.35)' }}>
          <PelasIcon name="plus" size={16} color="#fff" strokeWidth={2.6}/>
          Nueva meta
        </div>
      )}

      {showAdd   && <AddGoalSheet theme={theme} onSave={handleSave} onClose={() => setShowAdd(false)}/>}
      {editItem  && <AddGoalSheet theme={theme} initial={editItem} onSave={handleSave} onClose={() => setEditItem(null)}/>}
      {showAddTx && currentGoal && <AddGoalTransactionSheet theme={theme} goal={currentGoal} onSave={handleAddTx} onClose={() => setShowAddTx(false)}/>}
    </div>
  );
};

// ── Search ─────────────────────────────────────────────────────────────────────

export const SearchScreen = ({ theme, onBack, onNavigate }) => {
  const t = T(theme);
  const [q, setQ] = useState('');
  const recents = ['Mercadona', 'Spotify', 'Cabify', 'Nómina'];
  const results = q ? PELAS_TRANSACTIONS.filter(tx => tx.name.toLowerCase().includes(q.toLowerCase())) : [];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 22px 14px' }}>
        <div onClick={onBack} style={{ width: 40, height: 40, borderRadius: 20, background: t.surface2, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <PelasIcon name="arrow-left" size={18} color={t.text}/>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 20, padding: '0 14px', height: 44 }}>
          <PelasIcon name="search" size={18} color={t.text2}/>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar gastos, ingresos…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 13.5 }}/>
          {q && <div onClick={() => setQ('')} style={{ cursor: 'pointer' }}><PelasIcon name="x" size={16} color={t.text2}/></div>}
        </div>
      </div>
      <div style={{ padding: '0 22px 24px' }}>
        {!q && (
          <>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Búsquedas recientes</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
              {recents.map(r => <div key={r} onClick={() => setQ(r)} style={{ padding: '8px 14px', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 100, fontSize: 12.5, cursor: 'pointer' }}>{r}</div>)}
            </div>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Filtros rápidos</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[{ icon: 'arrow-up', label: 'Mayores gastos', color: t.negative }, { icon: 'arrow-down', label: 'Ingresos', color: t.positive }, { icon: 'refresh', label: 'Suscripciones', color: '#3FB984' }, { icon: 'people', label: 'Compartidos', color: '#7C5CFF' }].map(f => (
                <Card key={f.label} theme={theme} padding={14} radius={16}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: f.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <PelasIcon name={f.icon} size={14} color={f.color}/>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{f.label}</div>
                </Card>
              ))}
            </div>
          </>
        )}
        {q && (
          <>
            <div style={{ fontSize: 11, color: t.text2, marginBottom: 8 }}>{results.length} resultado{results.length !== 1 ? 's' : ''}</div>
            <Card theme={theme} padding={14} radius={16}>
              {results.length === 0 && <div style={{ fontSize: 13, color: t.text2, textAlign: 'center', padding: '20px 0' }}>Sin resultados para "{q}"</div>}
              {results.map((tx, i) => {
                const cat = PELAS_CATEGORIES.find(c => c.id === tx.cat);
                return (
                  <div key={tx.id}>
                    <TxRow theme={theme} tx={tx} cat={cat} onClick={() => onNavigate('tx-detail', { tx })}/>
                    {i < results.length - 1 && <div style={{ height: 1, background: t.border, margin: '2px 0' }}/>}
                  </div>
                );
              })}
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const NotificationsScreen = ({ theme, onBack }) => {
  const t = T(theme);
  return (
    <div>
      <PelasHeader theme={theme} title="Notificaciones" onBack={onBack}/>
      <div style={{ padding: '0 22px 24px' }}>
        {PELAS_NOTIFICATIONS.map(n => (
          <Card key={n.id} theme={theme} padding={14} radius={16} style={{ marginBottom: 10, display: 'flex', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: { warning: 'rgba(255,194,52,0.18)', success: 'rgba(63,185,132,0.18)', info: t.surface2 }[n.type], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PelasIcon name={n.icon} size={16} color={{ warning: t.warning, success: t.positive, info: t.accent }[n.type]}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, lineHeight: 1.4 }}>{n.title}</div>
              <div style={{ fontSize: 11, color: t.text2, marginTop: 2 }}>{n.time}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ── CategoryDetail ────────────────────────────────────────────────────────────

export const CategoryDetailScreen = ({ theme, cat, onBack, onNavigate }) => {
  const t = T(theme);
  if (!cat) return null;
  const txs = PELAS_TRANSACTIONS.filter(tx => tx.cat === cat.id);
  const pct = (cat.spent / cat.budget) * 100;
  return (
    <div>
      <PelasHeader theme={theme} title={cat.label} onBack={onBack}/>
      <div style={{ padding: '0 22px 24px' }}>
        <Card theme={theme} padding={20} radius={22} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 50, height: 50, borderRadius: 16, background: cat.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PelasIcon name={cat.icon} size={22} color={cat.color}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: t.text2 }}>Gasto en abril</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{cat.spent.toFixed(2)} €</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: t.text2 }}>Presupuesto</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{cat.budget} €</div>
            </div>
          </div>
          <Progress value={pct} color={cat.color} track={t.surface2}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: t.text2 }}>
            <span>{Math.round(pct)}% usado</span>
            <span>{(cat.budget - cat.spent).toFixed(2)} € restantes</span>
          </div>
        </Card>
        <SectionTitle theme={theme} title={`Movimientos · ${txs.length}`}/>
        <Card theme={theme} padding={14} radius={16}>
          {txs.length === 0 && <div style={{ fontSize: 13, color: t.text2, textAlign: 'center', padding: '20px 0' }}>Sin movimientos en esta categoría</div>}
          {txs.map((tx, i) => (
            <div key={tx.id}>
              <TxRow theme={theme} tx={tx} cat={cat} onClick={() => onNavigate('tx-detail', { tx })}/>
              {i < txs.length - 1 && <div style={{ height: 1, background: t.border, margin: '2px 0' }}/>}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ── Personal Data ─────────────────────────────────────────────────────────────

export const PersonalDataScreen = ({ theme, onBack }) => {
  const t = T(theme);
  const [form, setForm] = useState({ name: 'Marta Bayón', email: 'marta.bayon@correo.es', phone: '+34 612 345 678' });
  const [saved, setSaved] = useState(false);
  const set = (k, v) => { setForm(s => ({ ...s, [k]: v })); setSaved(false); };

  const fields = [
    { label: 'Nombre completo', key: 'name', placeholder: 'Tu nombre', icon: 'user' },
    { label: 'Email', key: 'email', placeholder: 'correo@ejemplo.com', icon: 'mail' },
    { label: 'Teléfono', key: 'phone', placeholder: '+34 600 000 000', icon: 'send' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PelasHeader theme={theme} title="Datos personales" onBack={onBack}/>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <div style={{ width: 80, height: 80, borderRadius: 40, background: 'linear-gradient(135deg,#0066FF,#7C5CFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 26 }}>MB</div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${t.bg}` }}>
              <PelasIcon name="edit" size={12} color="#fff"/>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: t.accent, fontWeight: 500, cursor: 'pointer' }}>Cambiar foto</div>
        </div>
        {fields.map(field => (
          <div key={field.key} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, marginBottom: 6 }}>{field.label.toUpperCase()}</div>
            <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 14, padding: '0 14px', height: 50, gap: 10 }}>
              <PelasIcon name={field.icon} size={16} color={t.text2}/>
              <input
                value={form[field.key]}
                onChange={e => set(field.key, e.target.value)}
                placeholder={field.placeholder}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 22px 28px', flexShrink: 0 }}>
        {saved && <div style={{ textAlign: 'center', fontSize: 12, color: t.positive, marginBottom: 10, fontWeight: 500 }}>Cambios guardados correctamente</div>}
        <button
          onClick={() => setSaved(true)}
          style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: t.accent, color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
        >
          Guardar cambios
        </button>
      </div>
    </div>
  );
};

// ── Security ──────────────────────────────────────────────────────────────────

const PinModal = ({ theme, onClose }) => {
  const t = T(theme);
  const [step, setStep] = useState('current');
  const [pins, setPins] = useState({ current: '', new: '', confirm: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const labels = { current: 'PIN actual', new: 'Nuevo PIN (4 dígitos)', confirm: 'Confirmar nuevo PIN' };
  const current = pins[step] || '';

  const handleDigit = (d) => {
    if (current.length >= 4) return;
    const next = current + d;
    setPins(s => ({ ...s, [step]: next }));
    setError('');
    if (next.length === 4) {
      setTimeout(() => {
        if (step === 'current') setStep('new');
        else if (step === 'new') setStep('confirm');
        else {
          if (pins.new !== next) { setError('Los PINs no coinciden'); setPins(s => ({ ...s, confirm: '' })); }
          else setDone(true);
        }
      }, 200);
    }
  };

  const handleDelete = () => { setPins(s => ({ ...s, [step]: s[step].slice(0, -1) })); setError(''); };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', padding: '20px 22px 32px', animation: 'slideUp 0.25s ease-out' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 20px' }}/>
        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: 'rgba(63,185,132,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <PelasIcon name="check" size={28} color={t.positive} strokeWidth={2.5}/>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>PIN actualizado</div>
            <div style={{ fontSize: 13, color: t.text2, marginBottom: 24 }}>Tu nuevo PIN ha sido guardado correctamente</div>
            <button onClick={onClose} style={{ width: '100%', height: 50, borderRadius: 25, border: 'none', background: t.accent, color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cerrar</button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Cambiar PIN</div>
              <div style={{ fontSize: 13, color: t.text2 }}>{labels[step]}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 8 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width: 14, height: 14, borderRadius: 7, background: current.length > i ? t.accent : t.surface2, border: `2px solid ${current.length > i ? t.accent : t.border}`, transition: 'all 0.15s' }}/>
              ))}
            </div>
            {error && <div style={{ textAlign: 'center', fontSize: 12, color: t.negative, marginBottom: 6 }}>{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 20 }}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
                <div key={i} onClick={() => d === '⌫' ? handleDelete() : d ? handleDigit(d) : null}
                  style={{ height: 56, borderRadius: 16, background: d === '' ? 'transparent' : t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: d === '⌫' ? 20 : 22, fontWeight: 600, cursor: d ? 'pointer' : 'default', color: t.text, userSelect: 'none' }}>
                  {d}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const PasswordModal = ({ theme, onClose }) => {
  const t = T(theme);
  const [form, setForm] = useState({ current: '', new: '', confirm: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => { setForm(s => ({ ...s, [k]: v })); setError(''); };
  const toggleShow = k => setShow(s => ({ ...s, [k]: !s[k] }));

  const handleSave = () => {
    if (!form.current || !form.new) { setError('Rellena todos los campos'); return; }
    if (form.new.length < 6) { setError('Mínimo 6 caracteres'); return; }
    if (form.new !== form.confirm) { setError('Las contraseñas no coinciden'); return; }
    setDone(true);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', padding: '20px 22px 32px', animation: 'slideUp 0.25s ease-out' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 20px' }}/>
        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: 'rgba(63,185,132,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <PelasIcon name="check" size={28} color={t.positive} strokeWidth={2.5}/>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Contraseña actualizada</div>
            <div style={{ fontSize: 13, color: t.text2, marginBottom: 24 }}>Tu contraseña ha sido cambiada correctamente</div>
            <button onClick={onClose} style={{ width: '100%', height: 50, borderRadius: 25, border: 'none', background: t.accent, color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cerrar</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 20 }}>Cambiar contraseña</div>
            {[{ label: 'Contraseña actual', key: 'current' }, { label: 'Nueva contraseña', key: 'new' }, { label: 'Confirmar nueva', key: 'confirm' }].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, marginBottom: 6 }}>{f.label.toUpperCase()}</div>
                <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48, gap: 8 }}>
                  <PelasIcon name="lock" size={15} color={t.text2}/>
                  <input
                    type={show[f.key] ? 'text' : 'password'}
                    value={form[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder="••••••••"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}
                  />
                  <div onClick={() => toggleShow(f.key)} style={{ cursor: 'pointer' }}>
                    <PelasIcon name={show[f.key] ? 'eye-off' : 'eye'} size={16} color={t.text2}/>
                  </div>
                </div>
              </div>
            ))}
            {error && <div style={{ fontSize: 12, color: t.negative, marginBottom: 10 }}>{error}</div>}
            <button onClick={handleSave} style={{ width: '100%', height: 50, borderRadius: 25, border: 'none', background: t.accent, color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
              Actualizar contraseña
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export const SecurityScreen = ({ theme, onBack }) => {
  const t = T(theme);
  const [biometric, setBiometric] = useState(true);
  const [showPin, setShowPin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const Toggle = ({ value, onChange }) => (
    <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, background: value ? t.accent : t.surface2, border: `1px solid ${value ? t.accent : t.border}`, position: 'relative', cursor: 'pointer', transition: 'all 0.25s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: value ? 22 : 2, width: 18, height: 18, borderRadius: 9, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)', transition: 'left 0.25s' }}/>
    </div>
  );

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ overflowY: 'auto', height: '100%' }}>
        <PelasHeader theme={theme} title="Seguridad" onBack={onBack}/>
        <div style={{ padding: '0 22px 32px' }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>PIN</div>
          <Card theme={theme} padding={6} radius={18} style={{ marginBottom: 18 }}>
            <div onClick={() => setShowPin(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 10px', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PelasIcon name="lock" size={16} color={t.accent}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>Modificar PIN</div>
                <div style={{ fontSize: 11, color: t.text2 }}>Cambia tu código de 4 dígitos</div>
              </div>
              <PelasIcon name="chevron-right" size={16} color={t.text2}/>
            </div>
          </Card>

          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>Biometría</div>
          <Card theme={theme} padding={6} radius={18} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 10px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PelasIcon name="face" size={16} color={t.accent}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>Huella digital</div>
                <div style={{ fontSize: 11, color: t.text2 }}>{biometric ? 'Activada' : 'Desactivada'}</div>
              </div>
              <Toggle value={biometric} onChange={setBiometric}/>
            </div>
          </Card>

          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>Contraseña</div>
          <Card theme={theme} padding={6} radius={18} style={{ marginBottom: 20 }}>
            <div onClick={() => setShowPassword(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 10px', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PelasIcon name="eye" size={16} color={t.accent}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>Actualizar contraseña</div>
                <div style={{ fontSize: 11, color: t.text2 }}>Cambia tu contraseña de acceso</div>
              </div>
              <PelasIcon name="chevron-right" size={16} color={t.text2}/>
            </div>
          </Card>

          <Card theme={theme} padding={14} radius={16} style={{ background: theme === 'dark' ? 'rgba(0,102,255,0.07)' : 'rgba(0,102,255,0.05)', border: '1px solid rgba(0,102,255,0.15)' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <PelasIcon name="shield" size={16} color={t.accent}/>
              <div style={{ fontSize: 12, color: t.text2, lineHeight: 1.5 }}>
                Tu cuenta está protegida con cifrado de extremo a extremo. Nunca compartimos tu información de seguridad.
              </div>
            </div>
          </Card>
        </div>
      </div>
      {showPin && <PinModal theme={theme} onClose={() => setShowPin(false)}/>}
      {showPassword && <PasswordModal theme={theme} onClose={() => setShowPassword(false)}/>}
    </div>
  );
};

// ── Profile Categories ────────────────────────────────────────────────────────

const PROFILE_CAT_ICONS = ['cart', 'heart', 'car', 'home', 'laptop', 'plane', 'bag', 'play', 'book', 'shield', 'globe', 'send'];
const PROFILE_CAT_COLORS = ['#0066FF','#7C5CFF','#FF8A4C','#3FB984','#FFC234','#E16364','#5B8DEF','#FF6B9D'];

const DEFAULT_EXPENSE_CATS = [
  { id: 'ec1', label: 'Alimentación', icon: 'cart', color: '#FF8A4C' },
  { id: 'ec2', label: 'Transporte', icon: 'car', color: '#0066FF' },
  { id: 'ec3', label: 'Ocio', icon: 'play', color: '#7C5CFF' },
  { id: 'ec4', label: 'Salud', icon: 'heart', color: '#E16364' },
  { id: 'ec5', label: 'Hogar', icon: 'home', color: '#5B8DEF' },
];

const DEFAULT_INCOME_CATS = [
  { id: 'ic1', label: 'Nómina', icon: 'send', color: '#3FB984' },
  { id: 'ic2', label: 'Freelance', icon: 'laptop', color: '#0066FF' },
  { id: 'ic3', label: 'Inversiones', icon: 'trending', color: '#FFC234' },
];

const AddCategorySheet = ({ theme, type, initial, onSave, onClose }) => {
  const t = T(theme);
  const isEdit = !!initial;
  const [form, setForm] = useState({ label: initial?.label || '', icon: initial?.icon || PROFILE_CAT_ICONS[0], color: initial?.color || PROFILE_CAT_COLORS[0] });
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', animation: 'slideUp 0.25s ease-out' }}>
        <div style={{ padding: '14px 22px 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 14px' }}/>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>{isEdit ? 'Editar categoría' : `Nueva categoría de ${type === 'expense' ? 'gasto' : 'ingreso'}`}</div>
            <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PelasIcon name="x" size={15} color={t.text2}/>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 22px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: form.color + '22', border: `2px solid ${form.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PelasIcon name={form.icon} size={24} color={form.color}/>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, marginBottom: 6 }}>NOMBRE</div>
            <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48 }}>
              <input value={form.label} onChange={e => set('label', e.target.value)} placeholder="Nombre de la categoría"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}/>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, marginBottom: 8 }}>ICONO</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PROFILE_CAT_ICONS.map(ic => (
                <div key={ic} onClick={() => set('icon', ic)} style={{ width: 40, height: 40, borderRadius: 11, background: form.icon === ic ? form.color + '22' : t.surface2, border: `1.5px solid ${form.icon === ic ? form.color : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <PelasIcon name={ic} size={18} color={form.icon === ic ? form.color : t.text2}/>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, marginBottom: 8 }}>COLOR</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {PROFILE_CAT_COLORS.map(c => (
                <div key={c} onClick={() => set('color', c)} style={{ flex: 1, height: 30, borderRadius: 8, background: c, cursor: 'pointer', border: form.color === c ? '2px solid #fff' : '2px solid transparent', boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none', transition: 'box-shadow 0.15s' }}/>
              ))}
            </div>
          </div>
          <button
            onClick={() => { if (form.label.trim()) onSave({ id: initial?.id || ('cat' + Date.now()), ...form }); }}
            style={{ width: '100%', height: 50, borderRadius: 25, border: 'none', background: form.label.trim() ? t.accent : t.surface2, color: form.label.trim() ? '#fff' : t.text2, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            {isEdit ? 'Guardar cambios' : 'Crear categoría'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProfileCategoriesScreen = ({ theme, onBack }) => {
  const t = T(theme);
  const [tab, setTab] = useState('expense');
  const [expCats, setExpCats] = useState(DEFAULT_EXPENSE_CATS);
  const [incCats, setIncCats] = useState(DEFAULT_INCOME_CATS);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const cats = tab === 'expense' ? expCats : incCats;
  const setCats = tab === 'expense' ? setExpCats : setIncCats;

  const handleSave = (cat) => {
    setCats(prev => prev.some(c => c.id === cat.id) ? prev.map(c => c.id === cat.id ? cat : c) : [...prev, cat]);
    setShowAdd(false); setEditItem(null);
  };

  const handleDelete = (id) => setCats(prev => prev.filter(c => c.id !== id));

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ overflowY: 'auto', height: '100%' }}>
        <PelasHeader theme={theme} title="Categorías"
          onBack={onBack}
          action={<div onClick={() => setShowAdd(true)} style={{ fontSize: 13, fontWeight: 600, color: t.accent, cursor: 'pointer' }}>+ Nueva</div>}
        />
        <div style={{ padding: '0 22px 32px' }}>
          <div style={{ display: 'flex', background: t.surface2, borderRadius: 14, padding: 4, marginBottom: 20 }}>
            {[{ id: 'expense', label: 'Gastos' }, { id: 'income', label: 'Ingresos' }].map(tp => (
              <div key={tp.id} onClick={() => setTab(tp.id)} style={{ flex: 1, height: 36, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: tab === tp.id ? t.bg : 'transparent', color: tab === tp.id ? t.accent : t.text2, transition: 'all 0.2s', boxShadow: tab === tp.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                {tp.label}
              </div>
            ))}
          </div>
          {cats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: t.text2 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{tab === 'expense' ? '📂' : '💰'}</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Sin categorías</div>
              <div style={{ fontSize: 12 }}>Crea tu primera categoría de {tab === 'expense' ? 'gasto' : 'ingreso'}</div>
            </div>
          ) : (
            <Card theme={theme} padding={6} radius={18}>
              {cats.map((cat, i) => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px', borderBottom: i < cats.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: cat.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PelasIcon name={cat.icon} size={16} color={cat.color}/>
                  </div>
                  <div style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{cat.label}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div onClick={() => setEditItem(cat)} style={{ width: 30, height: 30, borderRadius: 9, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <PelasIcon name="edit" size={13} color={t.text2}/>
                    </div>
                    <div onClick={() => handleDelete(cat.id)} style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(225,99,100,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <PelasIcon name="x" size={13} color={t.negative}/>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
      {showAdd && <AddCategorySheet theme={theme} type={tab} onSave={handleSave} onClose={() => setShowAdd(false)}/>}
      {editItem && <AddCategorySheet theme={theme} type={tab} initial={editItem} onSave={handleSave} onClose={() => setEditItem(null)}/>}
    </div>
  );
};

// ── Notification Settings ─────────────────────────────────────────────────────

export const NotificationSettingsScreen = ({ theme, onBack }) => {
  const t = T(theme);
  const [settings, setSettings] = useState({ spending: true, transfers: true, budgets: true, goals: false, system: true, marketing: false });
  const toggle = k => setSettings(s => ({ ...s, [k]: !s[k] }));

  const Toggle = ({ value, onChange }) => (
    <div onClick={onChange} style={{ width: 44, height: 24, borderRadius: 12, background: value ? t.accent : t.surface2, border: `1px solid ${value ? t.accent : t.border}`, position: 'relative', cursor: 'pointer', transition: 'all 0.25s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: value ? 22 : 2, width: 18, height: 18, borderRadius: 9, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)', transition: 'left 0.25s' }}/>
    </div>
  );

  const groups = [
    {
      title: 'Actividad',
      items: [
        { key: 'spending', icon: 'arrow-up', label: 'Alertas de gasto', sub: 'Cuando superas los límites configurados' },
        { key: 'transfers', icon: 'send', label: 'Nuevas transferencias', sub: 'Al recibir o enviar dinero' },
        { key: 'budgets', icon: 'chart', label: 'Recordatorios de presupuesto', sub: 'Antes de alcanzar tu límite mensual' },
        { key: 'goals', icon: 'goal', label: 'Actualizaciones de metas', sub: 'Progreso hacia tus objetivos de ahorro' },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { key: 'system', icon: 'bell', label: 'Notificaciones del sistema', sub: 'Actualizaciones y avisos de seguridad' },
        { key: 'marketing', icon: 'mail', label: 'Novedades y ofertas', sub: 'Nuevas funciones y promociones' },
      ],
    },
  ];

  return (
    <div>
      <PelasHeader theme={theme} title="Notificaciones" onBack={onBack}/>
      <div style={{ padding: '0 22px 32px' }}>
        {groups.map(g => (
          <div key={g.title} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>{g.title}</div>
            <Card theme={theme} padding={6} radius={18}>
              {g.items.map((item, i) => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 10px', borderBottom: i < g.items.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: settings[item.key] ? t.accent + '22' : t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PelasIcon name={item.icon} size={15} color={settings[item.key] ? t.accent : t.text2}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: t.text2, marginTop: 2 }}>{item.sub}</div>
                  </div>
                  <Toggle value={settings[item.key]} onChange={() => toggle(item.key)}/>
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Language ──────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'es-ES', label: 'Español (España)', flag: '🇪🇸' },
  { code: 'es-MX', label: 'Español (México)', flag: '🇲🇽' },
  { code: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { code: 'fr-FR', label: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt-PT', label: 'Português', flag: '🇵🇹' },
];

export const LanguageScreen = ({ theme, onBack }) => {
  const t = T(theme);
  const [selected, setSelected] = useState('es-ES');

  return (
    <div>
      <PelasHeader theme={theme} title="Idioma" onBack={onBack}/>
      <div style={{ padding: '0 22px 32px' }}>
        <Card theme={theme} padding={6} radius={18} style={{ marginBottom: 14 }}>
          {LANGUAGES.map((lang, i) => (
            <div key={lang.code} onClick={() => setSelected(lang.code)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 10px', borderBottom: i < LANGUAGES.length - 1 ? `1px solid ${t.border}` : 'none', cursor: 'pointer' }}>
              <div style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{lang.flag}</div>
              <div style={{ flex: 1, fontSize: 13.5, fontWeight: selected === lang.code ? 600 : 400, color: selected === lang.code ? t.accent : t.text }}>{lang.label}</div>
              {selected === lang.code && (
                <div style={{ width: 22, height: 22, borderRadius: 11, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PelasIcon name="check" size={12} color="#fff" strokeWidth={2.5}/>
                </div>
              )}
            </div>
          ))}
        </Card>
        <Card theme={theme} padding={14} radius={14} style={{ background: theme === 'dark' ? 'rgba(255,194,52,0.07)' : 'rgba(255,194,52,0.06)', border: '1px solid rgba(255,194,52,0.2)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <PelasIcon name="bell" size={15} color="#FFC234"/>
            <div style={{ fontSize: 12, color: t.text2, lineHeight: 1.5 }}>
              El cambio de idioma estará disponible próximamente. La interfaz aparecerá completamente traducida al idioma seleccionado.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ── Family Group ──────────────────────────────────────────────────────────────

const MEMBER_COLORS = ['#0066FF','#7C5CFF','#3FB984','#FF8A4C','#E16364','#FFC234','#5B8DEF'];
const getInitials = (name) => name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();

const CreateGroupSheet = ({ theme, onSave, onClose }) => {
  const t = T(theme);
  const [name, setName] = useState('');
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', padding: '14px 22px 32px', animation: 'slideUp 0.25s ease-out' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 20px' }}/>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>Nuevo grupo familiar</div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PelasIcon name="x" size={15} color={t.text2}/>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, marginBottom: 6 }}>NOMBRE DEL GRUPO</div>
          <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 50, gap: 10 }}>
            <PelasIcon name="people" size={16} color={t.text2}/>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="p. ej. Familia Bayón"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}
            />
          </div>
          <div style={{ fontSize: 11, color: t.text3, marginTop: 6 }}>Podrás invitar a los miembros una vez creado el grupo.</div>
        </div>
        <button
          onClick={() => { if (name.trim()) onSave(name.trim()); }}
          style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: name.trim() ? t.accent : t.surface2, color: name.trim() ? '#fff' : t.text2, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Crear grupo
        </button>
      </div>
    </div>
  );
};

const InviteMemberSheet = ({ theme, onInvite, onClose }) => {
  const t = T(theme);
  const [form, setForm] = useState({ name: '', email: '', role: 'member' });
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));
  const valid = form.name.trim() && form.email.includes('@');
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', padding: '14px 22px 32px', animation: 'slideUp 0.25s ease-out' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 20px' }}/>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>Invitar miembro</div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PelasIcon name="x" size={15} color={t.text2}/>
          </div>
        </div>

        {[{ label: 'NOMBRE COMPLETO', key: 'name', icon: 'user', placeholder: 'Nombre del familiar' }, { label: 'EMAIL', key: 'email', icon: 'mail', placeholder: 'correo@ejemplo.com' }].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, marginBottom: 6 }}>{f.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 50, gap: 10 }}>
              <PelasIcon name={f.icon} size={16} color={t.text2}/>
              <input
                value={form[f.key]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}
              />
            </div>
          </div>
        ))}

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, marginBottom: 8 }}>ROL</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ id: 'member', label: 'Miembro' }, { id: 'admin', label: 'Administrador' }].map(r => (
              <div key={r.id} onClick={() => set('role', r.id)}
                style={{ flex: 1, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: form.role === r.id ? t.accent : t.surface2, color: form.role === r.id ? '#fff' : t.text2, transition: 'all 0.15s' }}>
                {r.label}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => { if (valid) onInvite(form); }}
          style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: valid ? t.accent : t.surface2, color: valid ? '#fff' : t.text2, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Enviar invitación
        </button>
      </div>
    </div>
  );
};

const EditGroupNameSheet = ({ theme, current, onSave, onClose }) => {
  const t = T(theme);
  const [name, setName] = useState(current);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', padding: '14px 22px 32px', animation: 'slideUp 0.25s ease-out' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 20px' }}/>
        <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 18 }}>Editar nombre del grupo</div>
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 50, gap: 10 }}>
            <PelasIcon name="edit" size={16} color={t.text2}/>
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}/>
          </div>
        </div>
        <button onClick={() => { if (name.trim()) onSave(name.trim()); }}
          style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: name.trim() ? t.accent : t.surface2, color: name.trim() ? '#fff' : t.text2, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          Guardar
        </button>
      </div>
    </div>
  );
};

const FAMILY_ADMIN = { id: 'u0', name: 'Marta Bayón', email: 'marta.bayon@correo.es', role: 'admin', status: 'active' };

export const FamilyGroupScreen = ({ theme, onBack, familyGroup, setFamilyGroup }) => {
  const t = T(theme);
  const { group, members } = familyGroup;

  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleCreateGroup = (name) => {
    setFamilyGroup(prev => ({ ...prev, group: { name } }));
    setShowCreate(false);
  };

  const handleInvite = (form) => {
    const colorIdx = members.length % MEMBER_COLORS.length;
    setFamilyGroup(prev => ({
      ...prev,
      members: [...prev.members, {
        id: 'm' + Date.now(),
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        status: 'pending',
        color: MEMBER_COLORS[colorIdx],
      }],
    }));
    setShowInvite(false);
  };

  const handleRemove = (id) => {
    setFamilyGroup(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id) }));
    setConfirmDelete(null);
  };

  const handleDeleteGroup = () => {
    setFamilyGroup({ group: null, members: [FAMILY_ADMIN] });
  };

  // ── No group ──
  if (!group) return (
    <div style={{ position: 'relative', height: '100%' }}>
      <PelasHeader theme={theme} title="Grupo familiar" onBack={onBack}/>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', height: 'calc(100% - 60px)' }}>
        <div style={{ width: 80, height: 80, borderRadius: 26, background: t.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <PelasIcon name="people" size={36} color={t.accent}/>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, textAlign: 'center' }}>Sin grupo familiar</div>
        <div style={{ fontSize: 13, color: t.text2, textAlign: 'center', lineHeight: 1.6, marginBottom: 32, maxWidth: 260 }}>
          Crea un grupo para compartir gastos, presupuestos y metas con tu familia.
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: t.accent, color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <PelasIcon name="plus" size={16} color="#fff" strokeWidth={2.5}/>
          Crear grupo familiar
        </button>
      </div>
      {showCreate && <CreateGroupSheet theme={theme} onSave={handleCreateGroup} onClose={() => setShowCreate(false)}/>}
    </div>
  );

  // ── Has group ──
  const activeCount  = members.filter(m => m.status === 'active').length;
  const pendingCount = members.filter(m => m.status === 'pending').length;

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ overflowY: 'auto', height: '100%' }}>
        <PelasHeader
          theme={theme}
          title="Grupo familiar"
          onBack={onBack}
          action={
            <div onClick={() => setShowInvite(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 20, background: t.accentSoft, cursor: 'pointer' }}>
              <PelasIcon name="plus" size={13} color={t.accent} strokeWidth={2.5}/>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: t.accent }}>Invitar</span>
            </div>
          }
        />

        <div style={{ padding: '0 22px 32px' }}>
          {/* Group header card */}
          <Card theme={theme} padding={18} radius={22} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 18, background: t.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PelasIcon name="people" size={24} color={t.accent}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</div>
                <div style={{ fontSize: 12, color: t.text2, marginTop: 3 }}>
                  {activeCount} activo{activeCount !== 1 ? 's' : ''}{pendingCount > 0 ? ` · ${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}` : ''}
                </div>
              </div>
              <div onClick={() => setShowEditName(true)} style={{ width: 32, height: 32, borderRadius: 10, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <PelasIcon name="edit" size={14} color={t.text2}/>
              </div>
            </div>
            {/* Avatars preview */}
            <div style={{ display: 'flex', marginTop: 14, alignItems: 'center', gap: 4 }}>
              {members.slice(0, 5).map((m, i) => (
                <div key={m.id} style={{ width: 32, height: 32, borderRadius: 16, background: m.color || t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10.5, fontWeight: 700, border: `2px solid ${t.surface}`, marginLeft: i > 0 ? -8 : 0, zIndex: members.length - i, flexShrink: 0 }}>
                  {getInitials(m.name)}
                </div>
              ))}
              {members.length > 5 && (
                <div style={{ marginLeft: 4, fontSize: 11, color: t.text2 }}>+{members.length - 5} más</div>
              )}
            </div>
          </Card>

          {/* Members list */}
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 2 }}>
            Miembros ({members.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {members.map(m => {
              const avatarColor = m.id === 'u0' ? 'linear-gradient(135deg,#0066FF,#7C5CFF)' : m.color;
              return (
                <Card key={m.id} theme={theme} padding={14} radius={16}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Avatar */}
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {getInitials(m.name)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                        {m.role === 'admin' && (
                          <div style={{ flexShrink: 0, fontSize: 9.5, fontWeight: 700, color: t.accent, background: t.accentSoft, padding: '2px 6px', borderRadius: 6, letterSpacing: 0.3 }}>ADMIN</div>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, color: t.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
                    </div>

                    {/* Status + delete */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: 8, background: m.status === 'active' ? 'rgba(63,185,132,0.15)' : 'rgba(255,194,52,0.15)', color: m.status === 'active' ? t.positive : '#FFC234' }}>
                        {m.status === 'active' ? 'Activo' : 'Pendiente'}
                      </div>
                      {m.id !== 'u0' && (
                        <div onClick={() => setConfirmDelete(m.id)} style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(225,99,100,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <PelasIcon name="x" size={12} color={t.negative}/>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Confirm delete inline */}
                  {confirmDelete === m.id && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, fontSize: 12, color: t.text2 }}>¿Eliminar a {m.name} del grupo?</div>
                      <div onClick={() => setConfirmDelete(null)} style={{ padding: '6px 12px', borderRadius: 10, background: t.surface2, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: t.text2 }}>Cancelar</div>
                      <div onClick={() => handleRemove(m.id)} style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(225,99,100,0.12)', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: t.negative }}>Eliminar</div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Danger zone */}
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 2 }}>Zona de peligro</div>
          <Card theme={theme} padding={6} radius={16}>
            <div onClick={handleDeleteGroup} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 10px', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(225,99,100,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PelasIcon name="x" size={16} color={t.negative}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: t.negative }}>Disolver grupo familiar</div>
                <div style={{ fontSize: 11, color: t.text2 }}>Elimina el grupo y desvincula a todos los miembros</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {showCreate   && <CreateGroupSheet theme={theme} onSave={handleCreateGroup} onClose={() => setShowCreate(false)}/>}
      {showInvite   && <InviteMemberSheet theme={theme} onInvite={handleInvite} onClose={() => setShowInvite(false)}/>}
      {showEditName && <EditGroupNameSheet theme={theme} current={group.name} onSave={n => { setFamilyGroup(prev => ({ ...prev, group: { name: n } })); setShowEditName(false); }} onClose={() => setShowEditName(false)}/>}
    </div>
  );
};

// ── Export Data ───────────────────────────────────────────────────────────────

const EXPORT_FORMATS = [
  { id: 'csv',  label: 'CSV',   sub: 'Compatible con Excel y Google Sheets' },
  { id: 'json', label: 'JSON',  sub: 'Para desarrolladores e integraciones' },
  { id: 'xlsx', label: 'Excel', sub: 'Archivo .xlsx nativo de Microsoft' },
];
const EXPORT_RANGES = [
  { id: 'all', label: 'Todos los datos' },
  { id: '3m',  label: 'Últimos 3 meses' },
  { id: '1y',  label: 'Último año' },
  { id: '2026',label: 'Año 2026' },
];
const EXPORT_INCLUDES = [
  { key: 'transactions', label: 'Transacciones', sub: '127 registros' },
  { key: 'accounts',     label: 'Cuentas',        sub: '4 cuentas' },
  { key: 'budgets',      label: 'Presupuestos',   sub: '4 presupuestos' },
  { key: 'goals',        label: 'Metas',          sub: '3 metas' },
  { key: 'categories',   label: 'Categorías',     sub: '8 categorías' },
];

export const ExportDataScreen = ({ theme, onBack }) => {
  const t = T(theme);
  const [format, setFormat]   = useState('csv');
  const [range, setRange]     = useState('all');
  const [includes, setIncludes] = useState({ transactions: true, accounts: true, budgets: true, goals: true, categories: true });
  const [done, setDone]       = useState(false);
  const toggle = (k) => setIncludes(s => ({ ...s, [k]: !s[k] }));

  if (done) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PelasHeader theme={theme} title="Exportar datos" onBack={onBack}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: 24, background: 'rgba(63,185,132,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PelasIcon name="check" size={36} color={t.positive} strokeWidth={2.2}/>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Exportación completada</div>
          <div style={{ fontSize: 13, color: t.text2, lineHeight: 1.5 }}>
            Archivo <span style={{ fontWeight: 600, color: t.text }}>pelas_datos_{new Date().toISOString().slice(0,10)}.{format}</span> listo
          </div>
        </div>
        <Card theme={theme} padding={16} radius={16} style={{ width: '100%' }}>
          {[['Formato', format.toUpperCase()], ['Registros', '147'], ['Tamaño', '~24 KB']].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.text2, marginBottom: 8, '&:last-child': { marginBottom: 0 } }}>
              <span>{l}</span><span style={{ fontWeight: 600, color: t.text }}>{v}</span>
            </div>
          ))}
        </Card>
        <button onClick={() => setDone(false)} style={{ width: '100%', height: 50, borderRadius: 25, border: `1px solid ${t.border}`, background: 'transparent', color: t.text, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Nueva exportación
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PelasHeader theme={theme} title="Exportar datos" onBack={onBack}/>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 32px' }}>

        {/* Formato */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Formato</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {EXPORT_FORMATS.map(f => {
              const sel = format === f.id;
              return (
                <div key={f.id} onClick={() => setFormat(f.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, cursor: 'pointer', background: sel ? t.accent + '14' : t.surface2, border: `1.5px solid ${sel ? t.accent : 'transparent'}`, transition: 'all 0.15s' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: sel ? t.accent : t.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: sel ? '#fff' : t.text2 }}>{f.id.toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: sel ? 600 : 400, color: sel ? t.accent : t.text }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: t.text2, marginTop: 1 }}>{f.sub}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: 10, background: sel ? t.accent : 'transparent', border: `1.5px solid ${sel ? t.accent : t.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {sel && <PelasIcon name="check" size={11} color="#fff" strokeWidth={3}/>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Periodo */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Periodo</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EXPORT_RANGES.map(r => (
              <div key={r.id} onClick={() => setRange(r.id)} style={{ padding: '8px 14px', borderRadius: 100, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: range === r.id ? t.accent : t.surface2, color: range === r.id ? '#fff' : t.text2, transition: 'all 0.15s' }}>
                {r.label}
              </div>
            ))}
          </div>
        </div>

        {/* Incluir */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Incluir</div>
          <Card theme={theme} padding={6} radius={16}>
            {EXPORT_INCLUDES.map((item, i) => {
              const on = includes[item.key];
              return (
                <div key={item.key} onClick={() => toggle(item.key)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 10px', borderBottom: i < EXPORT_INCLUDES.length - 1 ? `1px solid ${t.border}` : 'none', cursor: 'pointer' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: on ? t.text : t.text2 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: t.text3, marginTop: 1 }}>{item.sub}</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: 7, background: on ? t.accent : 'transparent', border: `1.5px solid ${on ? t.accent : t.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                    {on && <PelasIcon name="check" size={12} color="#fff" strokeWidth={3}/>}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
      <div style={{ padding: '12px 22px 28px', flexShrink: 0 }}>
        <button onClick={() => setDone(true)} style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: t.accent, color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <PelasIcon name="arrow-up" size={16} color="#fff" strokeWidth={2.4}/>
          Exportar
        </button>
      </div>
    </div>
  );
};

// ── Import Data ────────────────────────────────────────────────────────────────

export const ImportDataScreen = ({ theme, onBack }) => {
  const t = T(theme);
  const [templateFormat, setTemplateFormat] = useState('csv');
  const [phase, setPhase]   = useState('idle'); // idle | importing | done
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState(null);

  const pickFile = () => {
    setFileName('mis_datos_banco.csv');
  };

  const startImport = () => {
    setPhase('importing');
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 22 + 8;
      if (p >= 100) {
        setProgress(100);
        clearInterval(iv);
        setTimeout(() => setPhase('done'), 350);
      } else {
        setProgress(p);
      }
    }, 280);
  };

  if (phase === 'done') return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PelasHeader theme={theme} title="Importar datos" onBack={onBack}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: 24, background: 'rgba(63,185,132,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PelasIcon name="check" size={36} color={t.positive} strokeWidth={2.2}/>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Importación completada</div>
          <div style={{ fontSize: 13, color: t.text2 }}>Tus datos han sido importados correctamente</div>
        </div>
        <Card theme={theme} padding={16} radius={16} style={{ width: '100%' }}>
          {[['Transacciones importadas', '+89', t.positive], ['Categorías actualizadas', '6', t.accent], ['Duplicados omitidos', '3', t.text3]].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.text2, marginBottom: 8 }}>
              <span>{l}</span><span style={{ fontWeight: 600, color: c }}>{v}</span>
            </div>
          ))}
        </Card>
        <button onClick={() => { setPhase('idle'); setFileName(null); }} style={{ width: '100%', height: 50, borderRadius: 25, border: `1px solid ${t.border}`, background: 'transparent', color: t.text, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Nueva importación
        </button>
      </div>
    </div>
  );

  if (phase === 'importing') return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PelasHeader theme={theme} title="Importar datos" onBack={() => {}}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', gap: 20 }}>
        <div style={{ width: 72, height: 72, borderRadius: 24, background: t.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PelasIcon name="refresh" size={32} color={t.accent} strokeWidth={1.8}/>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Importando datos…</div>
          <div style={{ fontSize: 12, color: t.text2 }}>No cierres la aplicación</div>
        </div>
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.text2, marginBottom: 6 }}>
            <span>Procesando registros</span><span style={{ fontWeight: 600 }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ width: '100%', height: 8, borderRadius: 4, background: t.surface2, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: t.accent, borderRadius: 4, transition: 'width 0.28s ease' }}/>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PelasHeader theme={theme} title="Importar datos" onBack={onBack}/>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 32px' }}>

        {/* Plantilla */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Plantilla oficial</div>
          <div style={{ fontSize: 12, color: t.text2, marginBottom: 12, lineHeight: 1.5 }}>
            Descarga la plantilla para rellenar tus datos con el formato correcto antes de importar.
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {['csv', 'xlsx'].map(f => (
              <div key={f} onClick={() => setTemplateFormat(f)} style={{ flex: 1, padding: '9px 0', borderRadius: 11, textAlign: 'center', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: templateFormat === f ? t.accent : t.surface2, color: templateFormat === f ? '#fff' : t.text2, transition: 'all 0.15s' }}>
                {f.toUpperCase()}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: t.accentSoft, border: `1px solid ${t.accent}33`, cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PelasIcon name="arrow-down" size={16} color="#fff" strokeWidth={2.4}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: t.accent }}>Descargar plantilla</div>
              <div style={{ fontSize: 11, color: t.text2 }}>pelas_plantilla.{templateFormat} · ~4 KB</div>
            </div>
            <PelasIcon name="chevron-right" size={15} color={t.accent}/>
          </div>
        </div>

        {/* Zona de carga */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Tu archivo</div>
          {fileName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: t.accent + '10', border: `1.5px solid ${t.accent}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: t.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PelasIcon name="check" size={16} color={t.accent} strokeWidth={2.5}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: t.accent }}>{fileName}</div>
                <div style={{ fontSize: 11, color: t.text2, marginTop: 1 }}>Listo para importar</div>
              </div>
              <div onClick={() => setFileName(null)} style={{ cursor: 'pointer' }}>
                <PelasIcon name="x" size={16} color={t.text2}/>
              </div>
            </div>
          ) : (
            <div onClick={pickFile} style={{ border: `2px dashed ${t.border}`, borderRadius: 18, padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, cursor: 'pointer', background: t.surface2, transition: 'border-color 0.15s' }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: t.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PelasIcon name="arrow-up" size={22} color={t.text2}/>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: t.text, marginBottom: 4 }}>Selecciona un archivo</div>
                <div style={{ fontSize: 11.5, color: t.text2 }}>CSV o Excel (.xlsx)</div>
              </div>
            </div>
          )}
        </div>

        {/* Aviso */}
        <Card theme={theme} padding={14} radius={14} style={{ background: theme === 'dark' ? 'rgba(255,194,52,0.08)' : 'rgba(255,194,52,0.06)', border: '1px solid rgba(255,194,52,0.25)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <PelasIcon name="bell" size={15} color="#FFC234"/>
            <div style={{ fontSize: 12, color: t.text2, lineHeight: 1.5 }}>
              La importación añade los nuevos registros sin borrar los existentes. Los duplicados se detectan y omiten automáticamente.
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: '12px 22px 28px', flexShrink: 0 }}>
        <button
          onClick={startImport}
          disabled={!fileName}
          style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: fileName ? t.accent : t.surface2, color: fileName ? '#fff' : t.text2, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: fileName ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s' }}
        >
          <PelasIcon name="arrow-down" size={16} color={fileName ? '#fff' : t.text2} strokeWidth={2.4}/>
          Importar datos
        </button>
      </div>
    </div>
  );
};

// ── Cloud Backup ───────────────────────────────────────────────────────────────

const CLOUD_PROVIDERS = [
  { id: 'icloud',   name: 'iCloud',       sub: 'Apple iCloud Drive',       color: '#0066FF', init: 'iC' },
  { id: 'gdrive',   name: 'Google Drive', sub: 'Google One Storage',       color: '#34A853', init: 'GD' },
  { id: 'onedrive', name: 'OneDrive',     sub: 'Microsoft OneDrive',       color: '#0078D4', init: 'OD' },
];

export const CloudBackupScreen = ({ theme, onBack }) => {
  const t = T(theme);
  const [connected, setConnected] = useState(null);
  const [backing, setBacking]     = useState(false);
  const [lastBackup, setLastBackup] = useState(null);

  const provider = CLOUD_PROVIDERS.find(p => p.id === connected);

  const doBackup = () => {
    setBacking(true);
    setTimeout(() => { setBacking(false); setLastBackup(new Date()); }, 2200);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PelasHeader theme={theme} title="Backup en la nube" onBack={onBack}/>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 32px' }}>

        {/* Estado de conexión */}
        {connected && (
          <Card theme={theme} padding={16} radius={18} style={{ marginBottom: 18, background: backing ? t.accentSoft : 'rgba(63,185,132,0.08)', border: `1px solid ${backing ? t.accent + '44' : 'rgba(63,185,132,0.25)'}`, transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 14, background: (backing ? t.accent : t.positive) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PelasIcon name={backing ? 'refresh' : 'check'} size={20} color={backing ? t.accent : t.positive} strokeWidth={2.2}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{backing ? 'Realizando backup…' : `Conectado a ${provider.name}`}</div>
                <div style={{ fontSize: 11, color: t.text2, marginTop: 2 }}>
                  {backing ? 'No cierres la aplicación' : lastBackup ? `Último backup: ${lastBackup.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Sin backup todavía'}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Proveedores */}
        <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Proveedor</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {CLOUD_PROVIDERS.map(p => {
            const isConn = connected === p.id;
            return (
              <Card key={p.id} theme={theme} padding={16} radius={18} style={{ border: `1.5px solid ${isConn ? p.color : t.border}`, background: isConn ? p.color + '0A' : t.surface, transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 15, background: p.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: p.color, letterSpacing: -0.3 }}>{p.init}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: t.text2, marginTop: 2 }}>{p.sub}</div>
                  </div>
                  {isConn ? (
                    <div onClick={() => { setConnected(null); setLastBackup(null); }} style={{ padding: '7px 14px', borderRadius: 20, background: 'rgba(225,99,100,0.1)', border: '1px solid rgba(225,99,100,0.25)', cursor: 'pointer' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: t.negative }}>Desconectar</span>
                    </div>
                  ) : (
                    <div onClick={() => { setConnected(p.id); setLastBackup(null); }} style={{ padding: '7px 14px', borderRadius: 20, background: p.color + '18', border: `1px solid ${p.color}44`, cursor: 'pointer' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: p.color }}>Conectar</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Configuración del backup (solo cuando conectado) */}
        {connected && (
          <>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Configuración</div>
            <Card theme={theme} padding={6} radius={16} style={{ marginBottom: 18 }}>
              {[
                { label: 'Backup automático',      sub: 'Diariamente a las 3:00 AM' },
                { label: 'Cifrado de datos',       sub: 'AES-256 end-to-end' },
                { label: 'Historial de versiones', sub: 'Últimas 30 copias' },
              ].map((opt, i, arr) => (
                <div key={opt.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 10px', borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: t.text2, marginTop: 1 }}>{opt.sub}</div>
                  </div>
                  <PelasIcon name="check" size={16} color={t.positive} strokeWidth={2.5}/>
                </div>
              ))}
            </Card>
          </>
        )}

        {/* Info */}
        <Card theme={theme} padding={14} radius={14} style={{ background: theme === 'dark' ? 'rgba(0,102,255,0.07)' : 'rgba(0,102,255,0.05)', border: '1px solid rgba(0,102,255,0.15)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <PelasIcon name="shield" size={15} color={t.accent}/>
            <div style={{ fontSize: 12, color: t.text2, lineHeight: 1.5 }}>
              Tus datos se cifran de extremo a extremo antes de subirse a la nube. Ni Pelas ni el proveedor pueden acceder a su contenido.
            </div>
          </div>
        </Card>
      </div>

      {/* Botón de backup */}
      {connected && (
        <div style={{ padding: '12px 22px 28px', flexShrink: 0 }}>
          <button
            onClick={doBackup}
            disabled={backing}
            style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: backing ? t.surface2 : provider.color, color: backing ? t.text2 : '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: backing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s' }}
          >
            <PelasIcon name={backing ? 'refresh' : 'shield'} size={16} color={backing ? t.text2 : '#fff'} strokeWidth={2.4}/>
            {backing ? 'Guardando en la nube…' : 'Hacer backup ahora'}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Theme & Style Customization ──────────────────────────────────────────────

export const ThemeStyleScreen = ({ theme, accentColor, setAccentColor, fontFamily, setFontFamily, onBack }) => {
  const t = T(theme);
  const colors = [
    { name: 'Azul', hex: '#0066FF' },
    { name: 'Morado', hex: '#7C5CFF' },
    { name: 'Verde', hex: '#3FB984' },
    { name: 'Naranja', hex: '#FF8A4C' },
    { name: 'Rojo', hex: '#E16364' },
  ];
  const fonts = [
    { name: 'Poppins', val: "'Poppins', sans-serif" },
    { name: 'Inter', val: "'Inter', sans-serif" },
    { name: 'Mono', val: "'JetBrains Mono', monospace" },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PelasHeader theme={theme} title="Tema y estilo" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px' }}>
        <SectionTitle theme={theme} title="Color del tema" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
          {colors.map(c => (
            <div key={c.hex} onClick={() => setAccentColor(c.hex)} style={{
              height: 48, borderRadius: 14, background: c.hex,
              cursor: 'pointer', position: 'relative',
              border: accentColor === c.hex ? '3px solid #fff' : 'none',
              boxShadow: accentColor === c.hex ? `0 0 0 2px ${c.hex}` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }}>
              {accentColor === c.hex && <PelasIcon name="check" size={20} color="#fff" strokeWidth={3} />}
            </div>
          ))}
        </div>

        <SectionTitle theme={theme} title="Tipografía" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {fonts.map(f => (
            <div key={f.name} onClick={() => setFontFamily(f.val)} style={{
              padding: '14px 18px', borderRadius: 16, background: t.surface,
              border: `1px solid ${fontFamily === f.val ? t.accent : t.border}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all 0.2s'
            }}>
              <div style={{ fontFamily: f.val, fontSize: 15, color: t.text }}>{f.name}</div>
              {fontFamily === f.val && <div style={{ width: 20, height: 20, borderRadius: 10, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PelasIcon name="check" size={12} color="#fff" strokeWidth={3} />
              </div>}
            </div>
          ))}
        </div>

        <SectionTitle theme={theme} title="Vista previa" />
        <Card theme={theme} padding={20} radius={22}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Balance total</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: t.accent, marginBottom: 16 }}>12.450,00 €</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, height: 44, borderRadius: 22, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500 }}>Secundario</div>
            <div style={{ flex: 1, height: 44, borderRadius: 22, background: t.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>Principal</div>
          </div>
        </Card>
      </div>
    </div>
  );
};
