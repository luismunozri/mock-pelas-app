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
  const allLocations = [...new Set(PELAS_TRANSACTIONS.map(tx => tx.location).filter(Boolean))];
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
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {allLocations.map(loc => {
                const active = filters.locations.includes(loc);
                return (
                  <div key={loc} onClick={() => togglePill('locations', loc)} style={{ padding: '7px 12px', borderRadius: 100, cursor: 'pointer', fontSize: 11, fontWeight: 500, background: active ? t.accent + '22' : t.surface2, color: active ? t.accent : t.text2, border: `1px solid ${active ? t.accent : 'transparent'}`, display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 11 }}>📍</span>{loc}
                  </div>
                );
              })}
            </div>
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
          <button onClick={onReset} style={{ flex: 1, height: 46, borderRadius: 23, background: t.surface2, border: `1px solid ${t.border}`, color: t.text, fontFamily: 'Poppins', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Limpiar</button>
          <button onClick={onApply} style={{ flex: 1.6, height: 46, borderRadius: 23, border: 'none', background: t.accent, color: '#fff', fontFamily: 'Poppins', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Mostrar {count}</button>
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
    if (filters.locations.length  && !filters.locations.includes(tx.location))return false;
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

export const TxDetailScreen = ({ theme, tx, onBack, onNavigate }) => {
  const t = T(theme);
  if (!tx) return null;
  const cat = PELAS_CATEGORIES.find(c => c.id === tx.cat);
  const positive = tx.amount >= 0;
  return (
    <div>
      <PelasHeader theme={theme} title="Detalle" onBack={onBack} action={
        <div style={{ width: 40, height: 40, borderRadius: 20, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <PelasIcon name="more" size={18} color={t.text}/>
        </div>
      }/>
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
        <Card theme={theme} padding={14} radius={18} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PelasIcon name="people" size={16} color={t.accent}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Compartir gasto</div>
              <div style={{ fontSize: 11, color: t.text2 }}>Divide con Carla, Diego o el grupo "Casa"</div>
            </div>
            <PelasIcon name="chevron-right" size={18} color={t.text2}/>
          </div>
        </Card>
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
    { title: 'Cuenta', items: [{ icon: 'user', label: 'Datos personales', sub: 'Nombre, email, teléfono' }, { icon: 'card', label: 'Tarjetas y cuentas', sub: '2 tarjetas vinculadas' }, { icon: 'lock', label: 'Seguridad', sub: 'Biometría, PIN, contraseña' }] },
    { title: 'Preferencias', items: [{ icon: 'bell', label: 'Notificaciones', sub: 'Personaliza alertas' }, { icon: 'globe', label: 'Idioma', sub: 'Español (España)' }, { icon: 'people', label: 'Cuentas compartidas', sub: '2 grupos activos' }] },
    { title: 'Ayuda', items: [{ icon: 'mail', label: 'Soporte', sub: 'Estamos aquí 24/7' }, { icon: 'book', label: 'Términos y condiciones' }, { icon: 'logout', label: 'Cerrar sesión', danger: true }] },
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
        <PelasIcon name="edit" size={18} color={t.text2}/>
      </Card>
      {groups.map(g => (
        <div key={g.title} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>{g.title}</div>
          <Card theme={theme} padding={6} radius={18}>
            {g.items.map((it, i) => (
              <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', borderBottom: i < g.items.length - 1 ? `1px solid ${t.border}` : 'none', cursor: 'pointer' }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: it.danger ? 'rgba(225,99,100,0.16)' : t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PelasIcon name={it.icon} size={16} color={it.danger ? t.negative : t.accent}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: it.danger ? t.negative : t.text }}>{it.label}</div>
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

const AddBudgetSheet = ({ theme, initial, onSave, onClose }) => {
  const t = T(theme);
  const isEdit = !!initial;
  const [form, setForm] = useState({
    label: initial?.label || '',
    budget: initial?.budget?.toString() || '',
    spent: initial?.spent?.toString() || '0',
    color: initial?.color || BUDGET_COLORS[0],
  });
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));

  const handleSave = () => {
    if (!form.label.trim() || !form.budget) return;
    onSave({
      id: initial?.id || ('b' + Date.now()),
      label: form.label.trim(),
      budget: parseFloat(form.budget) || 0,
      spent: parseFloat(form.spent) || 0,
      color: form.color,
    });
  };

  const NumberField = ({ label, value, onChange, placeholder }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48, gap: 6 }}>
        <input value={value} onChange={e => onChange(e.target.value.replace(/[^0-9.]/g,''))} placeholder={placeholder} inputMode="decimal"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'Poppins', fontSize: 15, fontWeight: 500 }}/>
        <span style={{ fontSize: 14, color: t.text2 }}>€</span>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', maxHeight: '90%', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease-out' }}>
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
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>Nombre</div>
            <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48 }}>
              <input value={form.label} onChange={e => set('label', e.target.value)} placeholder="p. ej. Comida y restaurantes"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'Poppins', fontSize: 14 }}/>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><NumberField label="Límite mensual" value={form.budget} onChange={v => set('budget', v)} placeholder="600"/></div>
            <div style={{ flex: 1 }}><NumberField label="Ya gastado" value={form.spent} onChange={v => set('spent', v)} placeholder="0"/></div>
          </div>
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
          <button onClick={handleSave} style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: !form.label.trim() || !form.budget ? t.surface2 : t.accent, color: !form.label.trim() || !form.budget ? t.text2 : '#fff', fontFamily: 'Poppins', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            {isEdit ? 'Guardar cambios' : 'Crear presupuesto'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Budgets Screen ─────────────────────────────────────────────────────────────

export const BudgetsScreen = ({ theme, onBack }) => {
  const t = T(theme);
  const [budgets, setBudgets] = useState(PELAS_BUDGETS);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const totalSpent  = budgets.reduce((s, b) => s + b.spent, 0);
  const totalBudget = budgets.reduce((s, b) => s + b.budget, 0);
  const pct         = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const remaining   = totalBudget - totalSpent;
  const daysLeft    = 28;
  const barColor    = pct < 70 ? t.positive : pct < 90 ? t.warning : t.negative;

  const handleSave = (b) => {
    setBudgets(prev => prev.some(x => x.id === b.id) ? prev.map(x => x.id === b.id ? b : x) : [...prev, b]);
    setShowAdd(false); setEditItem(null);
  };

  const handleDelete = (id) => setBudgets(prev => prev.filter(x => x.id !== id));

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ overflowY: 'auto', height: '100%' }}>
        <PelasHeader theme={theme} title="Presupuestos"
          onBack={onBack}
          action={<div onClick={() => setShowAdd(true)} style={{ fontSize: 13, fontWeight: 600, color: t.accent, cursor: 'pointer' }}>+ Nuevo</div>}
        />
        <div style={{ padding: '0 22px 100px' }}>

          {/* Resumen del mes */}
          <Card theme={theme} padding={18} radius={20} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: t.text2, marginBottom: 4 }}>Gastado este mes</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.8, color: barColor }}>{pct}%</span>
                  <span style={{ fontSize: 12, color: t.text2 }}>de {totalBudget.toLocaleString('es-ES')} €</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: t.text2 }}>Te quedan</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: t.text }}>{remaining.toLocaleString('es-ES')} €</div>
                <div style={{ fontSize: 10.5, color: t.text3 }}>{daysLeft} días</div>
              </div>
            </div>
            <div style={{ width: '100%', height: 8, background: t.surface2, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: 4, background: barColor, transition: 'width 0.5s ease' }}/>
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
      <div onClick={() => setShowAdd(true)} style={{ position: 'absolute', bottom: 24, right: 22, display: 'flex', alignItems: 'center', gap: 8, background: t.accent, color: '#fff', borderRadius: 28, padding: '14px 22px', fontFamily: 'Poppins', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,102,255,0.35)' }}>
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
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'Poppins', fontSize: 15, fontWeight: 500 }}/>
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
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'Poppins', fontSize: 14 }}/>
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
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'Poppins', fontSize: 14 }}/>
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
          <button onClick={handleSave} style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: !form.label.trim() || !form.target ? t.surface2 : t.accent, color: !form.label.trim() || !form.target ? t.text2 : '#fff', fontFamily: 'Poppins', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            {isEdit ? 'Guardar cambios' : 'Crear meta'}
          </button>
        </div>
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

  const totalSaved  = goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);

  const handleSave = (g) => {
    setGoals(prev => prev.some(x => x.id === g.id) ? prev.map(x => x.id === g.id ? g : x) : [...prev, g]);
    setShowAdd(false); setEditItem(null);
  };

  const handleDelete = (id) => setGoals(prev => prev.filter(x => x.id !== id));

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ overflowY: 'auto', height: '100%' }}>
        <PelasHeader theme={theme} title="Mis metas"
          onBack={onBack}
          action={<div onClick={() => setShowAdd(true)} style={{ fontSize: 13, fontWeight: 600, color: t.accent, cursor: 'pointer' }}>+ Nueva</div>}
        />
        <div style={{ padding: '0 22px 100px' }}>

          {/* Resumen global */}
          {goals.length > 0 && (
            <Card theme={theme} padding={18} radius={20} style={{ marginBottom: 20, background: theme === 'dark' ? 'linear-gradient(140deg,#0B2A1F 0%,#1A1A28 80%)' : 'linear-gradient(140deg,#E0FFF0 0%,#FFFFFF 80%)', border: 'none' }}>
              <div style={{ fontSize: 11, color: t.text2, marginBottom: 4 }}>Total ahorrado</div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8, color: t.positive }}>
                {totalSaved.toLocaleString('es-ES')} €
              </div>
              <div style={{ fontSize: 11.5, color: t.text2, marginTop: 4 }}>
                de {totalTarget.toLocaleString('es-ES')} € en {goals.length} meta{goals.length !== 1 ? 's' : ''}
              </div>
              <div style={{ width: '100%', height: 6, background: t.surface2, borderRadius: 3, overflow: 'hidden', marginTop: 14 }}>
                <div style={{ width: `${Math.min(100, Math.round((totalSaved / totalTarget) * 100))}%`, height: '100%', borderRadius: 3, background: t.positive }}/>
              </div>
            </Card>
          )}

          {/* Lista de metas */}
          {goals.map(g => {
            const pct = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0;
            const left = g.target - g.saved;
            return (
              <Card key={g.id} theme={theme} padding={16} radius={18} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: g.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PelasIcon name={g.icon} size={20} color={g.color}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{g.label}</div>
                    <div style={{ fontSize: 11, color: t.text2, marginTop: 2 }}>{g.due}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: g.color }}>{pct}%</div>
                      <div style={{ fontSize: 10.5, color: t.text2 }}>faltan {left.toLocaleString('es-ES')} €</div>
                    </div>
                    <div onClick={() => setEditItem(g)} style={{ width: 30, height: 30, borderRadius: 9, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
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
      </div>

      {/* FAB */}
      <div onClick={() => setShowAdd(true)} style={{ position: 'absolute', bottom: 24, right: 22, display: 'flex', alignItems: 'center', gap: 8, background: t.positive, color: '#fff', borderRadius: 28, padding: '14px 22px', fontFamily: 'Poppins', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(63,185,132,0.35)' }}>
        <PelasIcon name="plus" size={16} color="#fff" strokeWidth={2.6}/>
        Nueva meta
      </div>

      {showAdd  && <AddGoalSheet theme={theme} onSave={handleSave} onClose={() => setShowAdd(false)}/>}
      {editItem && <AddGoalSheet theme={theme} initial={editItem} onSave={handleSave} onClose={() => setEditItem(null)}/>}
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
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar gastos, ingresos…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'Poppins', fontSize: 13.5 }}/>
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
