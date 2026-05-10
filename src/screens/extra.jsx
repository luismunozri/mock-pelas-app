import { useState } from 'react';
import { PelasIcon } from '../icons';
import { T } from '../theme';
import { Card, SectionTitle, Sparkline } from '../components';
import { PELAS_ACCOUNTS, PELAS_CATEGORIES, PELAS_HOLDINGS, PELAS_CARDS } from '../data';

// ── Add Transaction Sheet ──────────────────────────────────────────────────────

const PickerRow = ({ theme, label, value, sub, color, icon, onClick }) => {
  const t = T(theme);
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}>
      <div style={{ fontSize: 11, color: t.text2, width: 70 }}>{label}</div>
      <div style={{ width: 36, height: 36, borderRadius: 12, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PelasIcon name={icon} size={16} color={color}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: t.text2 }}>{sub}</div>}
      </div>
      <PelasIcon name="chevron-right" size={16} color={t.text2}/>
    </div>
  );
};

export const AddTransactionSheet = ({ theme, onClose }) => {
  const t = T(theme);
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('0');
  const [account, setAccount] = useState(PELAS_ACCOUNTS[1]);
  const [category, setCategory] = useState(PELAS_CATEGORIES[0]);
  const [note, setNote] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [isRefund, setIsRefund] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null); // null = sin tarjeta
  const [cardOpen, setCardOpen] = useState(false);
  const [location, setLocation] = useState('');

  const REFUND_COLOR = '#FF8A4C';
  const accent = type === 'income' ? t.positive : type === 'transfer' ? '#7C5CFF' : (isRefund ? REFUND_COLOR : t.negative);
  const sign   = type === 'income' ? '+' : type === 'transfer' ? '' : (isRefund ? '+' : '−');

  const press = (k) => {
    if (k === '⌫') { setAmount(a => a.length > 1 ? a.slice(0, -1) : '0'); return; }
    if (k === ',') { if (!amount.includes(',')) setAmount(a => a + ','); return; }
    setAmount(a => a === '0' ? k : a + k);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', padding: '14px 22px 22px', animation: 'slideUp 0.25s ease-out', maxHeight: '92%', overflowY: 'auto' }}>
        <div style={{ margin: '0 auto 10px', width: 36, height: 4, borderRadius: 2, background: t.borderStrong }}/>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>Nuevo movimiento</div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PelasIcon name="x" size={16} color={t.text2}/>
          </div>
        </div>
        <div style={{ display: 'flex', padding: 4, background: t.surface2, borderRadius: 14, marginBottom: 18 }}>
          {[{ id: 'expense', label: 'Gasto', color: t.negative }, { id: 'income', label: 'Ingreso', color: t.positive }, { id: 'transfer', label: 'Transferencia', color: '#7C5CFF' }].map(o => (
            <div key={o.id} onClick={() => { setType(o.id); setIsRefund(false); }} style={{ flex: 1, padding: '10px 8px', borderRadius: 11, cursor: 'pointer', fontSize: 12.5, fontWeight: 500, textAlign: 'center', background: type === o.id ? t.surface : 'transparent', color: type === o.id ? o.color : t.text2, boxShadow: type === o.id ? '0 2px 8px rgba(0,0,0,0.12)' : 'none', transition: 'all 0.15s' }}>{o.label}</div>
          ))}
        </div>

        {type === 'expense' && (
          <div onClick={() => setIsRefund(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 16, padding: '10px 14px', borderRadius: 14, cursor: 'pointer',
            background: isRefund ? REFUND_COLOR + '18' : t.surface2,
            border: `1px solid ${isRefund ? REFUND_COLOR : 'transparent'}`,
            transition: 'all 0.18s',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: isRefund ? REFUND_COLOR + '22' : t.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PelasIcon name="refresh" size={15} color={isRefund ? REFUND_COLOR : t.text2}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: isRefund ? REFUND_COLOR : t.text }}>Es un reembolso</div>
              <div style={{ fontSize: 11, color: t.text2, marginTop: 1 }}>Compensa un gasto previo de la misma categoría</div>
            </div>
            <div style={{
              width: 36, height: 20, borderRadius: 10, position: 'relative',
              background: isRefund ? REFUND_COLOR : t.borderStrong,
              transition: 'background 0.18s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 3, left: isRefund ? 18 : 3,
                width: 14, height: 14, borderRadius: 7,
                background: '#fff', transition: 'left 0.18s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              }}/>
            </div>
          </div>
        )}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Importe</div>
          <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1.6, color: accent, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
            <span style={{ fontSize: 28, opacity: 0.7 }}>{sign}</span>
            <span>{amount}</span>
            <span style={{ fontSize: 22, color: t.text2, fontWeight: 500 }}>€</span>
          </div>
        </div>
        <Card theme={theme} padding={0} radius={16} style={{ marginBottom: 14, overflow: 'hidden' }}>
          <PickerRow theme={theme} label={type === 'transfer' ? 'Desde' : 'Cuenta'} value={account.name} sub={account.bank} color={account.color} icon={account.icon} onClick={() => { setAccountOpen(!accountOpen); setCategoryOpen(false); }}/>
          {accountOpen && (
            <div style={{ borderTop: `1px solid ${t.border}`, padding: 8 }}>
              {PELAS_ACCOUNTS.map(a => (
                <div key={a.id} onClick={() => { setAccount(a); setAccountOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, cursor: 'pointer', background: account.id === a.id ? t.accentSoft : 'transparent' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 9, background: a.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PelasIcon name={a.icon} size={14} color={a.color}/>
                  </div>
                  <div style={{ flex: 1, fontSize: 13 }}>{a.name}</div>
                  <div style={{ fontSize: 11.5, color: t.text2 }}>{a.balance.toFixed(2)} €</div>
                </div>
              ))}
            </div>
          )}
          {type !== 'transfer' && (
            <>
              <div style={{ height: 1, background: t.border }}/>
              <PickerRow theme={theme} label="Categoría" value={category.label} sub={null} color={category.color} icon={category.icon} onClick={() => { setCategoryOpen(!categoryOpen); setAccountOpen(false); }}/>
              {categoryOpen && (
                <div style={{ borderTop: `1px solid ${t.border}`, padding: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {PELAS_CATEGORIES.map(c => (
                    <div key={c.id} onClick={() => { setCategory(c); setCategoryOpen(false); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 6, borderRadius: 10, cursor: 'pointer', background: category.id === c.id ? t.accentSoft : 'transparent' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: c.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PelasIcon name={c.icon} size={15} color={c.color}/>
                      </div>
                      <div style={{ fontSize: 10, color: t.text2, textAlign: 'center' }}>{c.label.split(' ')[0]}</div>
                    </div>
                  ))}
                  {/* Añadir categoría */}
                  <div onClick={() => setCategoryOpen(false)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 6, borderRadius: 10, cursor: 'pointer' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: t.surface2, border: `1.5px dashed ${t.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PelasIcon name="plus" size={15} color={t.accent} strokeWidth={2.4}/>
                    </div>
                    <div style={{ fontSize: 10, color: t.accent, textAlign: 'center', fontWeight: 500 }}>Añadir</div>
                  </div>
                </div>
              )}
            </>
          )}
          {type === 'transfer' && (
            <>
              <div style={{ height: 1, background: t.border }}/>
              <PickerRow theme={theme} label="A" value={PELAS_ACCOUNTS[2].name} sub={PELAS_ACCOUNTS[2].bank} color={PELAS_ACCOUNTS[2].color} icon={PELAS_ACCOUNTS[2].icon} onClick={() => {}}/>
            </>
          )}

          {/* Tarjeta (opcional) */}
          <div style={{ height: 1, background: t.border }}/>
          <PickerRow
            theme={theme}
            label="Tarjeta"
            value={selectedCard ? selectedCard.bank : 'Sin tarjeta'}
            sub={selectedCard ? `•••• ${selectedCard.last4}` : 'Opcional'}
            color={selectedCard ? (selectedCard.type === 'visa' ? '#0066FF' : '#7C5CFF') : t.text3}
            icon="card"
            onClick={() => { setCardOpen(o => !o); setAccountOpen(false); setCategoryOpen(false); }}
          />
          {cardOpen && (
            <div style={{ borderTop: `1px solid ${t.border}`, padding: 8 }}>
              {/* "Sin tarjeta" option */}
              <div onClick={() => { setSelectedCard(null); setCardOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, cursor: 'pointer', background: selectedCard === null ? t.accentSoft : 'transparent' }}>
                <div style={{ width: 28, height: 28, borderRadius: 9, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PelasIcon name="x" size={13} color={t.text2}/>
                </div>
                <div style={{ flex: 1, fontSize: 13, color: t.text2 }}>Sin tarjeta</div>
              </div>
              {PELAS_CARDS.map(c => {
                const cardColor = c.type === 'visa' ? '#0066FF' : '#7C5CFF';
                return (
                  <div key={c.id} onClick={() => { setSelectedCard(c); setCardOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, cursor: 'pointer', background: selectedCard?.id === c.id ? t.accentSoft : 'transparent' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 9, background: cardColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PelasIcon name="card" size={14} color={cardColor}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{c.bank}</div>
                      <div style={{ fontSize: 11, color: t.text2 }}>•••• {c.last4} · {c.type === 'visa' ? 'Visa' : 'Mastercard'}</div>
                    </div>
                    {selectedCard?.id === c.id && <PelasIcon name="check" size={14} color={t.accent} strokeWidth={2.5}/>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Añadir nota (opcional)" style={{ width: '100%', boxSizing: 'border-box', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '14px 16px', fontSize: 13, color: t.text, outline: 'none', fontFamily: 'inherit', marginBottom: 10, display: 'block' }}/>

        {/* Ubicación */}
        <div style={{ display: 'flex', alignItems: 'center', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '0 16px', height: 48, gap: 10, marginBottom: 14 }}>
          <PelasIcon name="search" size={16} color={location ? t.accent : t.text2}/>
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Añadir ubicación (opcional)"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 13 }}
          />
          {location && (
            <div onClick={() => setLocation('')} style={{ cursor: 'pointer', flexShrink: 0 }}>
              <PelasIcon name="x" size={14} color={t.text2}/>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <Card theme={theme} padding={12} radius={14} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <PelasIcon name="calendar" size={16} color={t.text2}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: t.text2 }}>Fecha</div>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>Hoy · 2 may</div>
            </div>
          </Card>
          <Card theme={theme} padding={12} radius={14} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <PelasIcon name="refresh" size={16} color={t.text2}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: t.text2 }}>Repetir</div>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>No</div>
            </div>
          </Card>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
          {['1','2','3','4','5','6','7','8','9',',','0','⌫'].map(k => (
            <div key={k} onClick={() => press(k)} style={{ padding: '12px 0', textAlign: 'center', borderRadius: 12, background: t.surface, border: `1px solid ${t.border}`, fontSize: 18, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>{k}</div>
          ))}
        </div>
        <button onClick={onClose} style={{ width: '100%', height: 54, borderRadius: 27, border: 'none', background: accent, color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
          {type === 'income' ? 'Añadir ingreso' : type === 'transfer' ? 'Hacer transferencia' : isRefund ? 'Añadir reembolso' : 'Añadir gasto'}
        </button>
      </div>
    </div>
  );
};

// ── Investments Screen ─────────────────────────────────────────────────────────

const TYPE_COLORS = { ETF: '#0066FF', 'Acción': '#7C5CFF', Cripto: '#FF8A4C', Fondo: '#3FB984' };

const HoldingIcon = ({ theme, h }) => {
  const t = T(theme);
  if (h.iconKey === 'btc') return <PelasIcon name="btc" size={36}/>;
  if (h.iconKey === 'eth') return <PelasIcon name="eth" size={36}/>;
  const c = TYPE_COLORS[h.type] || t.accent;
  return (
    <div style={{ width: 36, height: 36, borderRadius: 18, flexShrink: 0, background: c + '22', color: c, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: -0.2 }}>{h.symbol.slice(0, 4)}</div>
  );
};

const HoldingRow = ({ theme, h, last }) => {
  const t = T(theme);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', borderBottom: last ? 'none' : `1px solid ${t.border}` }}>
      <HoldingIcon theme={theme} h={h}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{h.symbol}</div>
          <div style={{ fontSize: 9.5, color: t.text3, padding: '1px 5px', borderRadius: 4, background: t.surface2, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>{h.type}</div>
        </div>
        <div style={{ fontSize: 11, color: t.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</div>
      </div>
      <div style={{ width: 50, height: 28 }}>
        <Sparkline data={h.spark} width={50} height={28} color={h.sparkColor} fill={false}/>
      </div>
      <div style={{ textAlign: 'right', minWidth: 78 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{h.value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: h.change >= 0 ? t.positive : t.negative }}>
          {h.change >= 0 ? '+' : ''}{h.changePct.toFixed(2)}%
        </div>
      </div>
    </div>
  );
};

// ── Watch list ────────────────────────────────────────────────────────────────

const WATCH_STOCKS = [
  { id: 'w1', symbol: 'MSFT', name: 'Microsoft',  price: 420.35, change:  3.24, changePct:  0.78, spark: [72,74,70,76,78,80,78,82,84,82,86,88,86,90], sparkColor: '#3FB984' },
  { id: 'w2', symbol: 'NVDA', name: 'NVIDIA',     price: 892.50, change: -12.80, changePct: -1.41, spark: [90,88,86,84,80,76,72,68,70,66,64,60,62,58], sparkColor: '#E16364' },
  { id: 'w3', symbol: 'AMZN', name: 'Amazon',     price: 185.20, change:  2.15, changePct:  1.17, spark: [50,52,54,52,56,58,60,58,62,64,62,66,68,70], sparkColor: '#3FB984' },
  { id: 'w4', symbol: 'TSLA', name: 'Tesla',      price: 178.40, change: -5.60, changePct: -3.04, spark: [80,78,76,72,68,64,60,58,54,50,48,44,46,42], sparkColor: '#E16364' },
];

// ── Widget config sheet ───────────────────────────────────────────────────────

const INV_WIDGET_DEFS = [
  { id: 'distribution', label: 'Distribución',              icon: 'chart',    color: '#0066FF' },
  { id: 'positions',    label: 'Mis posiciones',            icon: 'wallet',   color: '#7C5CFF' },
  { id: 'watchlist',   label: 'Seguimiento de acciones',   icon: 'trending', color: '#3FB984' },
];

const InvConfigSheet = ({ theme, widgets, onChange, onClose }) => {
  const t = T(theme);
  const toggle = (id) => onChange(widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', padding: '14px 22px 28px', animation: 'slideUp 0.25s ease-out' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 14px' }}/>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Personalizar vista</div>
            <div style={{ fontSize: 11.5, color: t.text2, marginTop: 2 }}>Activa o desactiva las secciones</div>
          </div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PelasIcon name="x" size={15} color={t.text2}/>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {widgets.map(w => {
            const def = INV_WIDGET_DEFS.find(d => d.id === w.id);
            if (!def) return null;
            return (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 16, background: t.surface, border: `1px solid ${t.border}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: def.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PelasIcon name={def.icon} size={16} color={def.color}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: w.enabled ? t.text : t.text2 }}>{def.label}</div>
                  <div style={{ fontSize: 11, color: t.text3, marginTop: 1 }}>{w.enabled ? 'Visible' : 'Oculto'}</div>
                </div>
                <div onClick={() => toggle(w.id)} style={{ width: 44, height: 24, borderRadius: 12, background: w.enabled ? def.color : t.surface2, border: `1px solid ${w.enabled ? def.color : t.border}`, position: 'relative', cursor: 'pointer', transition: 'all 0.25s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: w.enabled ? 22 : 2, width: 18, height: 18, borderRadius: 9, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 0.25s' }}/>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={onClose} style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: t.accent, color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Listo</button>
      </div>
    </div>
  );
};

// ── Add Position Sheet ────────────────────────────────────────────────────────

const POSITION_TYPES = ['ETF', 'Acción', 'Cripto', 'Fondo'];

const AddPositionSheet = ({ theme, onSave, onClose }) => {
  const t = T(theme);
  const [form, setForm] = useState({ symbol: '', name: '', type: 'ETF', value: '', changePct: '' });
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));

  const handleSave = () => {
    if (!form.symbol.trim() || !form.value) return;
    const val = parseFloat(form.value.replace(',', '.')) || 0;
    const pct = parseFloat(form.changePct.replace(',', '.')) || 0;
    const change = val * (pct / 100);
    const color = TYPE_COLORS[form.type] || '#0066FF';
    onSave({
      id: 'h' + Date.now(),
      symbol: form.symbol.trim().toUpperCase(),
      name: form.name.trim() || form.symbol.trim().toUpperCase(),
      type: form.type,
      value: val,
      change,
      changePct: pct,
      sparkColor: pct >= 0 ? '#3FB984' : '#E16364',
      spark: Array.from({ length: 14 }, (_, i) => 50 + Math.round(Math.random() * 30)),
    });
  };

  const valid = form.symbol.trim() && form.value;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', padding: '14px 22px 28px', animation: 'slideUp 0.25s ease-out', maxHeight: '90%', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 14px' }}/>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>Nueva posición</div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PelasIcon name="x" size={15} color={t.text2}/>
          </div>
        </div>

        {/* Tipo */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, marginBottom: 8 }}>TIPO</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {POSITION_TYPES.map(tp => (
              <div key={tp} onClick={() => set('type', tp)} style={{ flex: 1, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', background: form.type === tp ? TYPE_COLORS[tp] : t.surface2, color: form.type === tp ? '#fff' : t.text2, transition: 'all 0.15s' }}>{tp}</div>
            ))}
          </div>
        </div>

        {/* Ticker */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, marginBottom: 6 }}>TICKER / SÍMBOLO</div>
          <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48 }}>
            <input value={form.symbol} onChange={e => set('symbol', e.target.value.toUpperCase())} placeholder="p. ej. AAPL"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, letterSpacing: 0.5 }}/>
          </div>
        </div>

        {/* Nombre */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, marginBottom: 6 }}>NOMBRE (opcional)</div>
          <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48 }}>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="p. ej. Apple Inc."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}/>
          </div>
        </div>

        {/* Valor + Cambio */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, marginBottom: 6 }}>VALOR ACTUAL (€)</div>
            <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48, gap: 6 }}>
              <input value={form.value} onChange={e => set('value', e.target.value.replace(/[^0-9.,]/g, ''))} placeholder="0,00" inputMode="decimal"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14, fontWeight: 500 }}/>
              <span style={{ fontSize: 13, color: t.text2 }}>€</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 600, letterSpacing: 0.4, marginBottom: 6 }}>VAR. DIARIA (%)</div>
            <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48, gap: 6 }}>
              <input value={form.changePct} onChange={e => set('changePct', e.target.value.replace(/[^0-9.,-]/g, ''))} placeholder="0,00" inputMode="decimal"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14, fontWeight: 500 }}/>
              <span style={{ fontSize: 13, color: t.text2 }}>%</span>
            </div>
          </div>
        </div>

        <button onClick={handleSave} style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: valid ? t.accent : t.surface2, color: valid ? '#fff' : t.text2, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
          Añadir posición
        </button>
      </div>
    </div>
  );
};

// ── All Positions Screen ──────────────────────────────────────────────────────

const AllPositionsScreen = ({ theme, holdings, onAdd, onBack }) => {
  const t = T(theme);
  const [filter, setFilter] = useState('Todos');
  const [showAdd, setShowAdd] = useState(false);
  const filtered = filter === 'Todos' ? holdings : holdings.filter(h => h.type === filter);
  const total = holdings.reduce((s, h) => s + h.value, 0);

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ overflowY: 'auto', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 22px 14px' }}>
          <div onClick={onBack} style={{ width: 40, height: 40, borderRadius: 20, background: t.surface2, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PelasIcon name="arrow-left" size={16} color={t.text}/>
          </div>
          <div style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>Mis posiciones</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.accent }}>{holdings.length} activos</div>
        </div>

        <div style={{ padding: '0 22px 100px' }}>
          <Card theme={theme} padding={14} radius={16} style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: t.text2 }}>Valor total</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['ETF','Acción','Cripto','Fondo'].map(tp => {
                const n = holdings.filter(h => h.type === tp).length;
                if (!n) return null;
                return <div key={tp} style={{ padding: '4px 8px', borderRadius: 8, background: TYPE_COLORS[tp] + '20', fontSize: 10.5, fontWeight: 600, color: TYPE_COLORS[tp] }}>{n} {tp}</div>;
              })}
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', marginRight: -22, paddingRight: 22 }}>
            {['Todos','ETF','Acción','Cripto','Fondo'].map(f => (
              <div key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 100, fontSize: 11.5, cursor: 'pointer', background: filter === f ? t.accent : t.surface, color: filter === f ? '#fff' : t.text2, border: `1px solid ${filter === f ? t.accent : t.border}`, fontWeight: 500, flexShrink: 0 }}>{f}</div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: t.text2 }}>
              <div style={{ fontSize: 13 }}>Sin posiciones en esta categoría</div>
            </div>
          ) : (
            <Card theme={theme} padding={0} radius={18}>
              {filtered.map((h, i) => <HoldingRow key={h.id} theme={theme} h={h} last={i === filtered.length - 1}/>)}
            </Card>
          )}
        </div>
      </div>

      <div onClick={() => setShowAdd(true)} style={{ position: 'absolute', bottom: 24, right: 22, display: 'flex', alignItems: 'center', gap: 8, background: t.accent, color: '#fff', borderRadius: 28, padding: '14px 22px', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,102,255,0.35)' }}>
        <PelasIcon name="plus" size={16} color="#fff" strokeWidth={2.6}/>
        Nueva posición
      </div>

      {showAdd && <AddPositionSheet theme={theme} onSave={h => { onAdd(h); setShowAdd(false); }} onClose={() => setShowAdd(false)}/>}
    </div>
  );
};

// ── Chart data by period ──────────────────────────────────────────────────────

const INV_CHART_DATA = {
  '1D':   [16320,16280,16340,16290,16380,16400,16370,16420,16460,16510,16490,16530,16770],
  '1S':   [15800,15920,16050,15980,16120,16340,16770],
  '1M':   [14200,14580,14320,14760,15100,14920,15280,15620,15480,15840,16100,15960,16290,16770],
  '3M':   [12800,13200,13600,13200,14100,14800,15200,14900,15600,16100,15800,16400,16770],
  '1A':   [9800,10200,10800,11400,12100,11800,12600,13200,14100,15200,15800,16200,16770],
  'TODO': [4200,6800,8400,10200,12600,14100,15800,16770],
};

// ── Asset search data ────────────────────────────────────────────────────────

const SEARCHABLE_ASSETS = [
  { symbol: 'AAPL',  name: 'Apple Inc.',                 isin: 'US0378331005', type: 'Acción', price: 192.35, change:  1.24 },
  { symbol: 'MSFT',  name: 'Microsoft Corporation',      isin: 'US5949181045', type: 'Acción', price: 420.15, change:  3.84 },
  { symbol: 'NVDA',  name: 'NVIDIA Corporation',         isin: 'US67066G1040', type: 'Acción', price: 892.50, change: -12.80 },
  { symbol: 'VWCE',  name: 'Vanguard FTSE All-World',    isin: 'IE00B3RBWM25', type: 'ETF',    price: 112.40, change:  0.92 },
  { symbol: 'IWDA',  name: 'iShares Core MSCI World',    isin: 'IE00B4L5Y983', type: 'ETF',    price: 88.60,  change:  0.64 },
  { symbol: 'CSPX',  name: 'iShares Core S&P 500',       isin: 'IE00B5BMR087', type: 'ETF',    price: 518.30, change:  2.10 },
  { symbol: 'BTC',   name: 'Bitcoin',                    isin: '-',            type: 'Cripto', price: 67200,  change:  1840 },
  { symbol: 'ETH',   name: 'Ethereum',                   isin: '-',            type: 'Cripto', price: 3480,   change: -42.0 },
  { symbol: 'BBKCM', name: 'BBVA Bolsa USA Cubierto',    isin: 'ES0173343000', type: 'Fondo',  price: 14.28,  change:  0.18 },
  { symbol: 'TSLA',  name: 'Tesla Inc.',                 isin: 'US88160R1014', type: 'Acción', price: 178.40, change: -5.60 },
];

// ── Asset Search Sheet ────────────────────────────────────────────────────────

const AssetSearchSheet = ({ theme, watchlist, onAddToWatchlist, onCreateAlert, onClose }) => {
  const t = T(theme);
  const [query, setQuery] = useState('');
  const [alertAsset, setAlertAsset] = useState(null);
  const [alertPrice, setAlertPrice] = useState('');

  const results = query.length >= 1
    ? SEARCHABLE_ASSETS.filter(a =>
        a.symbol.toLowerCase().includes(query.toLowerCase()) ||
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.isin.toLowerCase().includes(query.toLowerCase())
      )
    : SEARCHABLE_ASSETS.slice(0, 6);

  const isInWatchlist = (symbol) => watchlist.some(w => w.symbol === symbol);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', maxHeight: '88%', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease-out' }}>
        <div style={{ padding: '14px 22px 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 14px' }}/>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>Buscar activo</div>
            <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PelasIcon name="x" size={15} color={t.text2}/>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 14, padding: '0 14px', height: 48, gap: 10, marginBottom: 6 }}>
            <PelasIcon name="search" size={16} color={t.text2}/>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Símbolo, nombre o ISIN…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}
            />
            {query && <div onClick={() => setQuery('')} style={{ cursor: 'pointer' }}><PelasIcon name="x" size={13} color={t.text2}/></div>}
          </div>
          <div style={{ fontSize: 10.5, color: t.text3, marginBottom: 10 }}>Busca por nombre, ticker o ISIN</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px' }}>
          {results.map(a => {
            const inList = isInWatchlist(a.symbol);
            const color = TYPE_COLORS[a.type] || t.accent;
            return (
              <div key={a.symbol} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: `1px solid ${t.border}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color, letterSpacing: -0.4 }}>{a.symbol.slice(0,4)}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.symbol}</div>
                    <div style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 4, background: color + '20', color, fontWeight: 700 }}>{a.type}</div>
                  </div>
                  <div style={{ fontSize: 11, color: t.text2, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                  {a.isin !== '-' && <div style={{ fontSize: 9.5, color: t.text3 }}>{a.isin}</div>}
                </div>
                <div style={{ textAlign: 'right', minWidth: 64, flexShrink: 0, marginRight: 6 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{a.price.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €</div>
                  <div style={{ fontSize: 11, color: a.change >= 0 ? '#3FB984' : '#E16364', fontWeight: 600 }}>{a.change >= 0 ? '+' : ''}{a.change.toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <div onClick={() => { if (!inList) onAddToWatchlist(a); }} style={{ width: 32, height: 32, borderRadius: 10, background: inList ? color + '20' : t.surface2, border: `1px solid ${inList ? color : t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: inList ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                    <PelasIcon name={inList ? 'check' : 'plus'} size={13} color={inList ? color : t.text2} strokeWidth={2.5}/>
                  </div>
                  <div onClick={() => setAlertAsset(alertAsset?.symbol === a.symbol ? null : a)} style={{ width: 32, height: 32, borderRadius: 10, background: alertAsset?.symbol === a.symbol ? '#FFC234' + '20' : t.surface2, border: `1px solid ${alertAsset?.symbol === a.symbol ? '#FFC234' : t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <PelasIcon name="bell" size={13} color={alertAsset?.symbol === a.symbol ? '#FFC234' : t.text2}/>
                  </div>
                </div>
              </div>
            );
          })}
          {alertAsset && (
            <div style={{ marginTop: 14, padding: 14, borderRadius: 16, background: '#FFC234' + '14', border: `1px solid ${'#FFC234'}` }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Alerta para {alertAsset.symbol}</div>
              <div style={{ fontSize: 11, color: t.text2, marginBottom: 10 }}>Precio actual: {alertAsset.price.toLocaleString('es-ES')} €</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: t.surface, border: `1px solid ${'#FFC234'}`, borderRadius: 12, padding: '0 12px', height: 44, gap: 8 }}>
                  <span style={{ fontSize: 13, color: t.text2 }}>€</span>
                  <input value={alertPrice} onChange={e => setAlertPrice(e.target.value.replace(/[^0-9.]/g,''))} placeholder="Precio objetivo" inputMode="decimal"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14, fontWeight: 500 }}/>
                </div>
                <div onClick={() => { if (alertPrice) { onCreateAlert({ asset: alertAsset, targetPrice: parseFloat(alertPrice) }); setAlertAsset(null); setAlertPrice(''); } }}
                  style={{ height: 44, borderRadius: 12, padding: '0 16px', background: alertPrice ? '#FFC234' : t.surface2, color: alertPrice ? '#000' : t.text2, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>
                  Crear
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Add Investment Movement Sheet ─────────────────────────────────────────────

const AddInvestmentSheet = ({ theme, holdings, onClose }) => {
  const t = T(theme);
  const [form, setForm] = useState({ type: 'buy', asset: '', units: '', price: '', commission: '', date: '' });
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));
  const total = parseFloat(form.units || '0') * parseFloat(form.price || '0');

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', maxHeight: '92%', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease-out' }}>
        <div style={{ padding: '14px 22px 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 14px' }}/>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>Añadir movimiento</div>
            <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PelasIcon name="x" size={15} color={t.text2}/>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 8px' }}>
          {/* Compra / Venta */}
          <div style={{ display: 'flex', padding: 4, background: t.surface2, borderRadius: 14, marginBottom: 18 }}>
            {[{ id: 'buy', label: 'Compra', color: t.positive }, { id: 'sell', label: 'Venta', color: t.negative }].map(o => (
              <div key={o.id} onClick={() => set('type', o.id)} style={{ flex: 1, padding: '10px 0', textAlign: 'center', borderRadius: 11, cursor: 'pointer', fontSize: 13, fontWeight: 500, background: form.type === o.id ? t.surface : 'transparent', color: form.type === o.id ? o.color : t.text2, boxShadow: form.type === o.id ? '0 2px 8px rgba(0,0,0,0.12)' : 'none', transition: 'all 0.15s' }}>
                {o.label}
              </div>
            ))}
          </div>
          {/* Activo */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>Activo</div>
            <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48, gap: 10 }}>
              <PelasIcon name="search" size={15} color={t.text2}/>
              <input value={form.asset} onChange={e => set('asset', e.target.value.toUpperCase())} placeholder="Símbolo o ISIN" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, letterSpacing: 0.5 }}/>
            </div>
          </div>
          {/* Número de títulos + Precio */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>Nº títulos</div>
              <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48 }}>
                <input value={form.units} onChange={e => set('units', e.target.value.replace(/[^0-9.]/g,''))} placeholder="0" inputMode="decimal"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14, fontWeight: 500 }}/>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>Precio (€)</div>
              <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48, gap: 4 }}>
                <input value={form.price} onChange={e => set('price', e.target.value.replace(/[^0-9.]/g,''))} placeholder="0,00" inputMode="decimal"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14, fontWeight: 500 }}/>
                <span style={{ fontSize: 13, color: t.text2 }}>€</span>
              </div>
            </div>
          </div>
          {/* Comisión */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>Comisión (€)</div>
            <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48, gap: 4 }}>
              <input value={form.commission} onChange={e => set('commission', e.target.value.replace(/[^0-9.]/g,''))} placeholder="0,00" inputMode="decimal"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14, fontWeight: 500 }}/>
              <span style={{ fontSize: 13, color: t.text2 }}>€</span>
            </div>
          </div>
          {/* Fecha */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>Fecha de operación</div>
            <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48, gap: 10 }}>
              <PelasIcon name="calendar" size={15} color={t.text2}/>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}/>
            </div>
          </div>
          {/* Total */}
          {total > 0 && (
            <div style={{ padding: '14px', borderRadius: 14, background: t.accentSoft, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: t.text2, marginBottom: 2 }}>Total de la operación</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: form.type === 'buy' ? t.negative : t.positive }}>
                {form.type === 'buy' ? '−' : '+'}{(total + parseFloat(form.commission || '0')).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '12px 22px 22px', flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: form.asset && form.units && form.price ? t.accent : t.surface2, color: form.asset && form.units && form.price ? '#fff' : t.text2, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            {form.type === 'buy' ? 'Registrar compra' : 'Registrar venta'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Investments Screen ───────────────────────────────────────────────────

export const InvestmentsScreen = ({ theme, onNavigate, tablet = false, tabletVertical = false }) => {
  const t = T(theme);
  const [filter, setFilter] = useState('Todos');
  const [chartPeriod, setChartPeriod] = useState('1M');
  const [hideValue, setHideValue] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showPositions, setShowPositions] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showAddMove, setShowAddMove] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [holdings, setHoldings] = useState(PELAS_HOLDINGS);
  const [widgets, setWidgets] = useState(INV_WIDGET_DEFS.map(d => ({ id: d.id, enabled: true })));
  const [watchlist, setWatchlist] = useState(WATCH_STOCKS);
  const [alerts, setAlerts] = useState([
    { id: 'al1', symbol: 'AAPL', name: 'Apple Inc.', targetPrice: 200, currentPrice: 192.35, triggered: false },
    { id: 'al2', symbol: 'BTC',  name: 'Bitcoin',    targetPrice: 70000, currentPrice: 67200, triggered: true  },
  ]);

  const isEnabled = (id) => widgets.find(w => w.id === id)?.enabled;
  const triggeredAlerts = alerts.filter(a => a.triggered);

  const total = holdings.reduce((s, h) => s + h.value, 0);
  const totalChange = holdings.reduce((s, h) => s + h.change, 0);
  const totalPct = (totalChange / (total - totalChange)) * 100;
  const filtered = filter === 'Todos' ? holdings : holdings.filter(h => h.type === filter);
  const chartData = INV_CHART_DATA[chartPeriod] || INV_CHART_DATA['1M'];

  const allocByType = ['ETF', 'Acción', 'Cripto', 'Fondo'].map(type => {
    const sum = holdings.filter(h => h.type === type).reduce((s, h) => s + h.value, 0);
    return { type, sum, color: TYPE_COLORS[type] };
  }).filter(a => a.sum > 0);

  const addToWatchlist = (asset) => {
    const spark = Array.from({ length: 14 }, () => 40 + Math.round(Math.random() * 40));
    const color = asset.change >= 0 ? '#3FB984' : '#E16364';
    setWatchlist(prev => [...prev, { id: 'w' + Date.now(), symbol: asset.symbol, name: asset.name, price: asset.price, change: asset.change, changePct: (asset.change / (asset.price - asset.change)) * 100, spark, sparkColor: color }]);
  };

  const createAlert = (alert) => {
    setAlerts(prev => [...prev, { id: 'al' + Date.now(), symbol: alert.asset.symbol, name: alert.asset.name, targetPrice: alert.targetPrice, currentPrice: alert.asset.price, triggered: false }]);
  };

  if (showPositions) {
    return (
      <AllPositionsScreen
        theme={theme}
        holdings={holdings}
        onAdd={h => setHoldings(prev => [...prev, h])}
        onBack={() => setShowPositions(false)}
      />
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ padding: '8px 22px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>Inversiones</div>
          {/* Alertas activas */}
          <div onClick={() => setShowAlerts(true)} style={{ width: 40, height: 40, borderRadius: 20, background: triggeredAlerts.length ? '#FFC234' + '20' : t.surface, border: `1px solid ${triggeredAlerts.length ? '#FFC234' : t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
            <PelasIcon name="bell" size={16} color={triggeredAlerts.length ? '#FFC234' : t.text}/>
            {triggeredAlerts.length > 0 && (
              <div style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16, borderRadius: 8, background: '#FFC234', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#000' }}>
                {triggeredAlerts.length}
              </div>
            )}
          </div>
          <div onClick={() => setShowSearch(true)} style={{ width: 40, height: 40, borderRadius: 20, background: t.surface, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PelasIcon name="search" size={16} color={t.text}/>
          </div>
          <div onClick={() => setShowConfig(true)} style={{ width: 40, height: 40, borderRadius: 20, background: t.surface, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PelasIcon name="more" size={16} color={t.text}/>
          </div>
        </div>

        {/* Portfolio hero */}
        <Card theme={theme} padding={20} radius={22} style={{ marginBottom: 4, background: theme === 'dark' ? 'linear-gradient(140deg, #0B1F4A 0%, #1A1A28 60%)' : 'linear-gradient(140deg, #E0EBFF 0%, #FFFFFF 60%)', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ fontSize: 11.5, color: t.text2 }}>Patrimonio total</div>
            <div onClick={() => setHideValue(!hideValue)} style={{ cursor: 'pointer' }}>
              <PelasIcon name={hideValue ? 'eye-off' : 'eye'} size={13} color={t.text2}/>
            </div>
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -1.2 }}>
            {hideValue ? '••••••' : total.toLocaleString('es-ES', { minimumFractionDigits: 2 }) + ' €'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: totalChange >= 0 ? t.positive : t.negative }}>
              {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)} €
            </div>
            <div style={{ background: totalChange >= 0 ? 'rgba(63,185,132,0.2)' : 'rgba(225,99,100,0.2)', color: totalChange >= 0 ? t.positive : t.negative, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>
              {totalChange >= 0 ? '↑' : '↓'} {Math.abs(totalPct).toFixed(2)}%
            </div>
            <div style={{ fontSize: 11, color: t.text2 }}>hoy</div>
          </div>
          {/* Chart — tap to go landscape */}
          <div onClick={() => onNavigate?.('invest-chart', { chartPeriod })} style={{ marginTop: 14, marginLeft: -8, marginRight: -8, cursor: 'pointer', position: 'relative' }}>
            <Sparkline data={chartData} width={314} height={70} color={t.accent} fill={true}/>
            <div style={{ position: 'absolute', top: 4, right: 12, width: 22, height: 22, borderRadius: 7, background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PelasIcon name="up" size={10} color={t.text2}/>
            </div>
          </div>
          {/* Period buttons */}
          <div style={{ display: 'flex', gap: 4, marginTop: 12, justifyContent: 'space-around' }}>
            {Object.keys(INV_CHART_DATA).map(p => (
              <div key={p} onClick={() => setChartPeriod(p)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 11.5, cursor: 'pointer', background: chartPeriod === p ? (theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)') : 'transparent', color: chartPeriod === p ? t.text : t.text2, fontWeight: chartPeriod === p ? 700 : 400, transition: 'all 0.15s' }}>{p}</div>
            ))}
          </div>
        </Card>

        {/* Añadir movimiento */}
        <div onClick={() => setShowAddMove(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', padding: '10px 0', marginBottom: 18, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: t.accentSoft, color: t.accent, borderRadius: 20, padding: '8px 16px', fontSize: 12.5, fontWeight: 600 }}>
            <PelasIcon name="plus" size={14} color={t.accent} strokeWidth={2.6}/>
            Añadir movimiento
          </div>
        </div>

        {/* Widgets area — 2-col on tablet H */}
        <div style={tablet && !tabletVertical ? { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12, alignItems: 'start' } : {}}>

          {/* Alertas */}
          {alerts.length > 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <SectionTitle theme={theme} title="Mis alertas" action="+ Nueva" onAction={() => setShowSearch(true)}/>
              <Card theme={theme} padding={0} radius={18} style={{ marginBottom: 22 }}>
                {alerts.map((al, i) => (
                  <div key={al.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < alerts.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: al.triggered ? '#FFC234' + '20' : t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <PelasIcon name="bell" size={15} color={al.triggered ? '#FFC234' : t.text2}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{al.symbol} <span style={{ fontSize: 11, color: t.text2, fontWeight: 400 }}>{al.name}</span></div>
                      <div style={{ fontSize: 11, color: t.text2, marginTop: 2 }}>
                        Alerta: <span style={{ fontWeight: 600, color: t.text }}>{al.targetPrice.toLocaleString('es-ES')} €</span>
                        {' · '}Actual: <span style={{ fontWeight: 600 }}>{al.currentPrice.toLocaleString('es-ES')} €</span>
                      </div>
                    </div>
                    {al.triggered && <div style={{ fontSize: 10, fontWeight: 700, color: '#FFC234', background: '#FFC234' + '20', padding: '3px 8px', borderRadius: 6, flexShrink: 0 }}>ACTIVA</div>}
                    <div onClick={() => setAlerts(prev => prev.filter(a => a.id !== al.id))} style={{ width: 28, height: 28, borderRadius: 8, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <PelasIcon name="x" size={12} color={t.text2}/>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* Distribución */}
          {isEnabled('distribution') && (
            <div style={{ minWidth: 0 }}>
              <SectionTitle theme={theme} title="Distribución" action="Detalles"/>
              <Card theme={theme} padding={16} radius={18} style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                  {allocByType.map(a => <div key={a.type} style={{ width: `${(a.sum / total) * 100}%`, background: a.color }}/>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {allocByType.map(a => (
                    <div key={a.type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: a.color }}/>
                      <div style={{ fontSize: 12, color: t.text }}>{a.type}</div>
                      <div style={{ marginLeft: 'auto', fontSize: 11.5, color: t.text2, fontWeight: 500 }}>{Math.round((a.sum / total) * 100)}%</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Seguimiento */}
          {isEnabled('watchlist') && (
            <div style={{ minWidth: 0 }}>
              <SectionTitle theme={theme} title="Seguimiento" action="+ Añadir" onAction={() => setShowSearch(true)}/>
              <Card theme={theme} padding={0} radius={18} style={{ marginBottom: 22 }}>
                {watchlist.map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < watchlist.length - 1 ? `1px solid ${t.border}` : 'none', cursor: 'pointer' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: s.sparkColor === '#3FB984' ? 'rgba(63,185,132,0.12)' : 'rgba(225,99,100,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: s.changePct >= 0 ? '#3FB984' : '#E16364', letterSpacing: -0.3 }}>{s.symbol.slice(0,4)}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.symbol}</div>
                      <div style={{ fontSize: 11, color: t.text2 }}>{s.name}</div>
                    </div>
                    <div style={{ width: 50, height: 28 }}>
                      <Sparkline data={s.spark} width={50} height={28} color={s.sparkColor} fill={false}/>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 70, flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: s.changePct >= 0 ? '#3FB984' : '#E16364' }}>
                        {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* Mis posiciones — full width */}
          {isEnabled('positions') && (
            <div style={{ gridColumn: tablet && !tabletVertical ? '1 / -1' : undefined, minWidth: 0 }}>
              <SectionTitle theme={theme} title="Mis posiciones" action="Ver todo" onAction={() => setShowPositions(true)}/>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', marginRight: -22, paddingRight: 22 }}>
                {['Todos','ETF','Acción','Cripto','Fondo'].map(f => (
                  <div key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 100, fontSize: 11.5, cursor: 'pointer', background: filter === f ? t.accent : t.surface, color: filter === f ? '#fff' : t.text2, border: `1px solid ${filter === f ? t.accent : t.border}`, fontWeight: 500, flexShrink: 0 }}>{f}</div>
                ))}
              </div>
              <Card theme={theme} padding={0} radius={18} style={{ marginBottom: 22 }}>
                {filtered.map((h, i) => <HoldingRow key={h.id} theme={theme} h={h} last={i === filtered.length - 1}/>)}
              </Card>
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      {showConfig && <InvConfigSheet theme={theme} widgets={widgets} onChange={setWidgets} onClose={() => setShowConfig(false)}/>}
      {showSearch && <AssetSearchSheet theme={theme} watchlist={watchlist} onAddToWatchlist={addToWatchlist} onCreateAlert={createAlert} onClose={() => setShowSearch(false)}/>}
      {showAddMove && <AddInvestmentSheet theme={theme} holdings={holdings} onClose={() => setShowAddMove(false)}/>}

      {/* Alertas disparadas sheet */}
      {showAlerts && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={() => setShowAlerts(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', maxHeight: '70%', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease-out' }}>
            <div style={{ padding: '14px 22px 14px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 14px' }}/>
              <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Alertas activas</div>
              <div style={{ fontSize: 11.5, color: t.text2 }}>{triggeredAlerts.length} alerta{triggeredAlerts.length !== 1 ? 's' : ''} alcanzada{triggeredAlerts.length !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px' }}>
              {triggeredAlerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: t.text2, fontSize: 13 }}>No hay alertas activas</div>
              ) : triggeredAlerts.map(al => (
                <div key={al.id} style={{ padding: '14px', borderRadius: 16, background: '#FFC234' + '14', border: `1px solid ${'#FFC234'}`, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PelasIcon name="bell" size={18} color="#FFC234"/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{al.symbol} ha alcanzado {al.targetPrice.toLocaleString('es-ES')} €</div>
                      <div style={{ fontSize: 11, color: t.text2, marginTop: 2 }}>Precio actual: {al.currentPrice.toLocaleString('es-ES')} €</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Invest Chart Detail Screen (landscape) ────────────────────────────────────

export const InvestChartDetailScreen = ({ theme, chartPeriod: initialPeriod = '1M', onBack }) => {
  const t = T(theme);
  const [period, setPeriod] = useState(initialPeriod);
  const [showFilters, setShowFilters] = useState(false);

  const chartData = INV_CHART_DATA[period] || INV_CHART_DATA['1M'];
  const minV = Math.min(...chartData);
  const maxV = Math.max(...chartData);
  const midV = (minV + maxV) / 2;
  const delta = chartData[chartData.length - 1] - chartData[0];
  const deltaPct = ((delta / chartData[0]) * 100).toFixed(1);
  const fmt = (v) => (v / 1000).toFixed(1) + 'k €';
  const CHART_W = 560;
  const CHART_H = 180;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px 8px', flexShrink: 0 }}>
        <div onClick={onBack} style={{ width: 34, height: 34, borderRadius: 17, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <PelasIcon name="arrow-left" size={15} color={t.text2}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: t.text2, marginBottom: 1 }}>Evolución del patrimonio</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.6 }}>{chartData[chartData.length - 1].toLocaleString('es-ES')} €</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: delta >= 0 ? t.positive : t.negative }}>
              {delta >= 0 ? '+' : ''}{deltaPct}%
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {Object.keys(INV_CHART_DATA).map(p => (
            <div key={p} onClick={() => setPeriod(p)} style={{ padding: '6px 11px', borderRadius: 18, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', background: period === p ? t.accent : t.surface2, color: period === p ? '#fff' : t.text2, transition: 'all 0.15s' }}>{p}</div>
          ))}
        </div>
        <div onClick={() => setShowFilters(true)} style={{ width: 34, height: 34, borderRadius: 17, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <PelasIcon name="filter" size={15} color={t.text2}/>
        </div>
      </div>
      {/* Chart */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', padding: '0 18px 10px', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 54, paddingBottom: 16, flexShrink: 0 }}>
          {[maxV, midV, minV].map((v, i) => (
            <div key={i} style={{ fontSize: 9, color: t.text3, textAlign: 'right' }}>{fmt(v)}</div>
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'visible' }}>
            <Sparkline data={chartData} width={CHART_W} height={CHART_H} color={t.accent}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, padding: '0 8px 0 10px' }}>
            {chartData.slice(0, Math.min(7, chartData.length)).map((_, i) => (
              <div key={i} style={{ fontSize: 9, color: t.text3 }}>P{i + 1}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
