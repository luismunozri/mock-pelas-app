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
          <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1.6, color: accent, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, fontFamily: 'Poppins' }}>
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
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Añadir nota (opcional)" style={{ width: '100%', boxSizing: 'border-box', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '14px 16px', fontSize: 13, color: t.text, outline: 'none', fontFamily: 'Poppins', marginBottom: 10, display: 'block' }}/>

        {/* Ubicación */}
        <div style={{ display: 'flex', alignItems: 'center', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '0 16px', height: 48, gap: 10, marginBottom: 14 }}>
          <PelasIcon name="search" size={16} color={location ? t.accent : t.text2}/>
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Añadir ubicación (opcional)"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'Poppins', fontSize: 13 }}
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
            <div key={k} onClick={() => press(k)} style={{ padding: '12px 0', textAlign: 'center', borderRadius: 12, background: t.surface, border: `1px solid ${t.border}`, fontSize: 18, fontWeight: 500, cursor: 'pointer', fontFamily: 'Poppins' }}>{k}</div>
          ))}
        </div>
        <button onClick={onClose} style={{ width: '100%', height: 54, borderRadius: 27, border: 'none', background: accent, color: '#fff', fontFamily: 'Poppins', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
          {type === 'income' ? 'Añadir ingreso' : type === 'transfer' ? 'Hacer transferencia' : isRefund ? 'Añadir reembolso' : 'Añadir gasto'}
        </button>
      </div>
    </div>
  );
};

// ── Investments Screen ─────────────────────────────────────────────────────────

const HoldingIcon = ({ theme, h }) => {
  const t = T(theme);
  if (h.iconKey === 'btc') return <PelasIcon name="btc" size={36}/>;
  if (h.iconKey === 'eth') return <PelasIcon name="eth" size={36}/>;
  const colorMap = { ETF: '#0066FF', 'Acción': '#7C5CFF', Cripto: '#FF8A4C', Fondo: '#3FB984' };
  const c = colorMap[h.type] || t.accent;
  return (
    <div style={{ width: 36, height: 36, borderRadius: 18, flexShrink: 0, background: c + '22', color: c, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: -0.2 }}>{h.symbol.slice(0, 4)}</div>
  );
};

export const InvestmentsScreen = ({ theme }) => {
  const t = T(theme);
  const [filter, setFilter] = useState('Todos');
  const [hideValue, setHideValue] = useState(false);

  const total = PELAS_HOLDINGS.reduce((s, h) => s + h.value, 0);
  const totalChange = PELAS_HOLDINGS.reduce((s, h) => s + h.change, 0);
  const totalPct = (totalChange / (total - totalChange)) * 100;
  const filtered = filter === 'Todos' ? PELAS_HOLDINGS : PELAS_HOLDINGS.filter(h => h.type === filter);

  const allocByType = ['ETF', 'Acción', 'Cripto', 'Fondo'].map(type => {
    const sum = PELAS_HOLDINGS.filter(h => h.type === type).reduce((s, h) => s + h.value, 0);
    return { type, sum, color: { ETF: '#0066FF', 'Acción': '#7C5CFF', Cripto: '#FF8A4C', Fondo: '#3FB984' }[type] };
  }).filter(a => a.sum > 0);

  return (
    <div style={{ padding: '8px 22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>Inversiones</div>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: t.surface, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <PelasIcon name="search" size={16} color={t.text}/>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: t.surface, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <PelasIcon name="more" size={16} color={t.text}/>
        </div>
      </div>
      <Card theme={theme} padding={20} radius={22} style={{ marginBottom: 18, background: theme === 'dark' ? 'linear-gradient(140deg, #0B1F4A 0%, #1A1A28 60%)' : 'linear-gradient(140deg, #E0EBFF 0%, #FFFFFF 60%)', border: 'none' }}>
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
        <div style={{ marginTop: 14, marginLeft: -8, marginRight: -8 }}>
          <Sparkline data={[42,48,46,52,55,53,58,62,60,68,72,70,78,82,85,88]} width={314} height={70} color={t.accent} fill={true}/>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'space-around' }}>
          {['1D','1S','1M','3M','1A','TODO'].map(p => (
            <div key={p} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 11.5, cursor: 'pointer', background: p === '1M' ? (theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)') : 'transparent', color: p === '1M' ? t.text : t.text2, fontWeight: p === '1M' ? 600 : 400 }}>{p}</div>
          ))}
        </div>
      </Card>
      <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
        {[{ label: 'Comprar', icon: 'plus', bg: t.accentSoft, color: t.accent }, { label: 'Vender', icon: 'arrow-up', bg: 'rgba(225,99,100,0.16)', color: t.negative }, { label: 'Aportar', icon: 'refresh', bg: 'rgba(124,92,255,0.16)', color: '#7C5CFF' }].map(a => (
          <Card key={a.label} theme={theme} padding={14} radius={16} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PelasIcon name={a.icon} size={14} color={a.color} strokeWidth={2.4}/>
            </div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{a.label}</div>
          </Card>
        ))}
      </div>
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
      <SectionTitle theme={theme} title="Mis posiciones" action="Ver todo"/>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', marginRight: -22, paddingRight: 22 }}>
        {['Todos','ETF','Acción','Cripto','Fondo'].map(f => (
          <div key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 100, fontSize: 11.5, cursor: 'pointer', background: filter === f ? t.accent : t.surface, color: filter === f ? '#fff' : t.text2, border: `1px solid ${filter === f ? t.accent : t.border}`, fontWeight: 500, flexShrink: 0 }}>{f}</div>
        ))}
      </div>
      <Card theme={theme} padding={0} radius={18}>
        {filtered.map((h, i) => (
          <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', borderBottom: i < filtered.length - 1 ? `1px solid ${t.border}` : 'none' }}>
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
        ))}
      </Card>
      <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: t.accentSoft, display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <PelasIcon name="trending" size={16} color="#fff" strokeWidth={2.2}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: t.accent }}>Empieza a invertir desde 1 €</div>
          <div style={{ fontSize: 10.5, color: t.text2 }}>Cartera autogestionada con 0,29% comisión anual</div>
        </div>
        <PelasIcon name="chevron-right" size={14} color={t.accent}/>
      </div>
    </div>
  );
};
