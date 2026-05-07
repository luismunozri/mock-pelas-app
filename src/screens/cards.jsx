import { useState } from 'react';
import { PelasIcon } from '../icons';
import { T } from '../theme';
import { Card } from '../components';
import { CreditCard } from '../components';
import { PelasHeader } from '../frame';
import { PELAS_CARDS, PELAS_USER } from '../data';

// ── Constants ─────────────────────────────────────────────────────────────────

const CARD_COLORS = [
  { id: 'mesh-blue',   label: 'Azul',   bg: 'linear-gradient(135deg,#1E3FFF,#001A66)' },
  { id: 'mesh-night',  label: 'Noche',  bg: 'linear-gradient(135deg,#2E2E5F,#0E0E1A)' },
  { id: 'mesh-purple', label: 'Morado', bg: 'linear-gradient(135deg,#9B5CFF,#2D1066)' },
  { id: 'mesh-gold',   label: 'Oro',    bg: 'linear-gradient(135deg,#C9A227,#4A3800)' },
  { id: 'mesh-green',  label: 'Verde',  bg: 'linear-gradient(135deg,#1DBF7B,#054830)' },
  { id: 'mesh-rose',   label: 'Rosa',   bg: 'linear-gradient(135deg,#FF5A7E,#7A0028)' },
];

const MESH_DOT = {
  'mesh-blue': '#0066FF', 'mesh-night': '#7C5CFF', 'mesh-purple': '#9B5CFF',
  'mesh-gold': '#C9A227', 'mesh-green': '#1DBF7B', 'mesh-rose': '#FF5A7E',
};

// ── Card data modal ───────────────────────────────────────────────────────────

const CardDataModal = ({ theme, card, onClose }) => {
  const t = T(theme);
  const [showNum, setShowNum] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const fullNumber = card.fullNumber
    ? card.fullNumber.replace(/(.{4})/g, '$1 ').trim()
    : `•••• •••• •••• ${card.last4}`;
  const cvv = card.cvv || '•••';

  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 340 }}>
        <div style={{ borderRadius: '18px 18px 0 0', overflow: 'hidden' }}>
          <CreditCard theme={theme} card={card} width={340} height={207}/>
        </div>
        <div style={{ background: t.surface, borderRadius: '0 0 18px 18px', overflow: 'hidden' }}>
          <DataRow label="Titular" value={card.holder}/>
          <DataRow label="Número" value={showNum ? fullNumber : `•••• •••• •••• ${card.last4}`}
            mono={showNum} onToggle={() => setShowNum(v => !v)} showing={showNum}/>
          <DataRow label="Caducidad" value={card.expiry} border={false} half/>
          <DataRow label="CVV" value={showCvv ? cvv : '•'.repeat(cvv.length)}
            onToggle={() => setShowCvv(v => !v)} showing={showCvv} border={false} half isRight/>
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

const DataRow = ({ label, value, mono, onToggle, showing, border = true, half, isRight }) => {
  // Used for half-width rows (Caducidad + CVV side by side)
  // Rendered inline by parent when half=true
  return null; // handled inline below
};

// Inline helper for CardDataModal rows
const CardDataModalRows = ({ theme, card }) => {
  const t = T(theme);
  const [showNum, setShowNum] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const fullNumber = card.fullNumber
    ? card.fullNumber.replace(/(.{4})/g, '$1 ').trim()
    : `•••• •••• •••• ${card.last4}`;
  const cvv = card.cvv || '•••';

  const Row = ({ label, value, mono, onToggle, showing, noBorder }) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: noBorder ? 'none' : `1px solid ${t.border}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10.5, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: mono ? 1.5 : 0, fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit' }}>{value}</div>
      </div>
      {onToggle && (
        <div onClick={onToggle} style={{ cursor: 'pointer', padding: 4 }}>
          <PelasIcon name={showing ? 'eye-off' : 'eye'} size={18} color={t.text2}/>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Row label="Titular" value={card.holder}/>
      <Row label="Número" value={showNum ? fullNumber : `•••• •••• •••• ${card.last4}`} mono={showNum} onToggle={() => setShowNum(v => !v)} showing={showNum}/>
      <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ flex: 1, padding: '14px 18px', borderRight: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 10.5, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 }}>Caducidad</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{card.expiry}</div>
        </div>
        <div style={{ flex: 1, padding: '14px 18px', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 }}>CVV</div>
            <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: showCvv ? 2 : 3 }}>{showCvv ? cvv : '•'.repeat(cvv.length)}</div>
          </div>
          <div onClick={() => setShowCvv(v => !v)} style={{ cursor: 'pointer', padding: 4 }}>
            <PelasIcon name={showCvv ? 'eye-off' : 'eye'} size={18} color={t.text2}/>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Add card sheet ────────────────────────────────────────────────────────────

const AddCardSheet = ({ theme, onClose, onSave }) => {
  const t = T(theme);
  const [form, setForm] = useState({ bank: '', number: '', expiry: '', cvv: '', holder: PELAS_USER.name, type: 'visa', color: 'mesh-blue' });
  const [showCvv, setShowCvv] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const formatNumber = (raw) => raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const handleSave = () => {
    const digits = form.number.replace(/\D/g, '');
    if (digits.length < 4) return;
    onSave({ id: 'c' + Date.now(), bank: form.bank || 'Mi tarjeta', last4: digits.slice(-4), expiry: form.expiry || '00/00', holder: form.holder || PELAS_USER.name, type: form.type, balance: 0, color: form.color, fullNumber: form.number.replace(/\s/g, ''), cvv: form.cvv });
    onClose();
  };

  const preview = { bank: form.bank || 'Mi tarjeta', last4: (form.number.replace(/\D/g, '') || '0000').slice(-4).padStart(4,'0'), expiry: form.expiry || 'MM/AA', holder: form.holder || PELAS_USER.name, type: form.type, balance: 0, color: form.color };

  const FInput = ({ label, value, onChange, placeholder, type = 'text', suffix }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48, gap: 8 }}>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}/>
        {suffix}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', maxHeight: '94%', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease-out' }}>
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
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <CreditCard theme={theme} card={preview} width={300} height={183}/>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 8 }}>Color</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {CARD_COLORS.map(c => (
                <div key={c.id} onClick={() => set('color', c.id)} style={{ flex: 1, height: 32, borderRadius: 10, background: c.bg, cursor: 'pointer', border: form.color === c.id ? '2px solid #fff' : '2px solid transparent', boxShadow: form.color === c.id ? '0 0 0 2px #0066FF' : 'none', transition: 'box-shadow 0.15s' }}/>
              ))}
            </div>
          </div>
          <FInput label="Banco / Nombre" value={form.bank} onChange={v => set('bank', v)} placeholder="p. ej. BBVA, Revolut…"/>
          <FInput label="Número" value={form.number} onChange={v => set('number', formatNumber(v))} placeholder="1234 5678 9012 3456"/>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>Caducidad</div>
              <div style={{ display: 'flex', alignItems: 'center', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48 }}>
                <input value={form.expiry} placeholder="MM/AA" maxLength={5}
                  onChange={e => { const r = e.target.value.replace(/\D/g,'').slice(0,4); set('expiry', r.length > 2 ? r.slice(0,2)+'/'+r.slice(2) : r); }}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}/>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>CVV</div>
              <div style={{ display: 'flex', alignItems: 'center', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 13, padding: '0 14px', height: 48, gap: 8 }}>
                <input value={form.cvv} placeholder="•••" maxLength={4} type={showCvv ? 'text' : 'password'}
                  onChange={e => set('cvv', e.target.value.replace(/\D/g,'').slice(0,4))}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}/>
                <div onClick={() => setShowCvv(v => !v)} style={{ cursor: 'pointer' }}>
                  <PelasIcon name={showCvv ? 'eye-off' : 'eye'} size={16} color={t.text2}/>
                </div>
              </div>
            </div>
          </div>
          <FInput label="Titular" value={form.holder} onChange={v => set('holder', v)} placeholder="Nombre completo"/>
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
        <div style={{ padding: '12px 22px 22px', flexShrink: 0 }}>
          <button onClick={handleSave} style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: t.accent, color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Guardar tarjeta
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Cards Screen ──────────────────────────────────────────────────────────────

export const CardsScreen = ({ theme, onBack }) => {
  const t = T(theme);
  const [active, setActive] = useState(PELAS_CARDS.map(c => ({ ...c })));
  const [archived, setArchived] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [peekCard, setPeekCard] = useState(null);

  const archive = (id) => {
    const card = active.find(c => c.id === id);
    if (!card) return;
    setActive(cs => cs.filter(c => c.id !== id));
    setArchived(cs => [...cs, card]);
  };

  const restore = (id) => {
    const card = archived.find(c => c.id === id);
    if (!card) return;
    setArchived(cs => cs.filter(c => c.id !== id));
    setActive(cs => [...cs, card]);
  };

  const addCard = (card) => setActive(cs => [...cs, card]);

  const dot = (color) => MESH_DOT[color] || '#0066FF';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <PelasHeader theme={theme} title="Mis tarjetas" onBack={onBack} action={
          <div onClick={() => setShowAdd(true)} style={{ width: 40, height: 40, borderRadius: 20, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PelasIcon name="plus" size={20} color="#fff" strokeWidth={2.4}/>
          </div>
        }/>

        <div style={{ padding: '0 22px 32px' }}>

          {/* Summary chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: -4 }}>
              {active.slice(0, 4).map((c, i) => (
                <div key={c.id} style={{ width: 20, height: 20, borderRadius: 10, background: dot(c.color), border: `2px solid ${t.bg}`, marginLeft: i > 0 ? -6 : 0 }}/>
              ))}
            </div>
            <div style={{ fontSize: 13, color: t.text2 }}>
              <span style={{ fontWeight: 600, color: t.text }}>{active.length}</span> tarjeta{active.length !== 1 ? 's' : ''} activa{active.length !== 1 ? 's' : ''}
              {archived.length > 0 && <span> · {archived.length} archivada{archived.length !== 1 ? 's' : ''}</span>}
            </div>
          </div>

          {/* Active cards */}
          {active.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: t.text2 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>💳</div>
              <div style={{ fontSize: 13 }}>No tienes tarjetas activas</div>
            </div>
          )}

          {active.map(card => (
            <div key={card.id} style={{ marginBottom: 20 }}>
              {/* Card visual */}
              <div style={{ borderRadius: 22, overflow: 'hidden', marginBottom: 12 }}>
                <CreditCard theme={theme} card={card} width={346} height={211}/>
              </div>

              {/* Card info row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingLeft: 4 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{card.bank}</div>
                  <div style={{ fontSize: 12, color: t.text2, marginTop: 1 }}>
                    •••• {card.last4} · Caduca {card.expiry} · {card.type === 'visa' ? 'Visa' : 'Mastercard'}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div onClick={() => setPeekCard(card)} style={{ flex: 1, height: 42, borderRadius: 13, background: t.surface, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer' }}>
                  <PelasIcon name="eye" size={15} color={t.text2}/>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: t.text2 }}>Ver datos</span>
                </div>
                <div onClick={() => archive(card.id)} style={{ flex: 1, height: 42, borderRadius: 13, background: 'rgba(255,194,52,0.10)', border: '1px solid rgba(255,194,52,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer' }}>
                  <PelasIcon name="eye-off" size={15} color={t.warning}/>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: t.warning }}>Archivar</span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: t.border, marginTop: 20 }}/>
            </div>
          ))}

          {/* Archived section */}
          {archived.length > 0 && (
            <div style={{ marginTop: 4 }}>
              {/* Collapsible header */}
              <div onClick={() => setShowArchived(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: 9, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PelasIcon name="eye-off" size={13} color={t.text2}/>
                </div>
                <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: t.text2 }}>
                  Archivadas ({archived.length})
                </div>
                <PelasIcon name={showArchived ? 'chevron-down' : 'chevron-right'} size={16} color={t.text2}/>
              </div>

              {showArchived && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {archived.map(card => (
                    <Card key={card.id} theme={theme} padding={14} radius={16} style={{ opacity: 0.7 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Color dot */}
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: dot(card.color) + '28', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <PelasIcon name="card" size={16} color={dot(card.color)}/>
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{card.bank}</div>
                          <div style={{ fontSize: 11.5, color: t.text2, marginTop: 1 }}>
                            •••• {card.last4} · {card.type === 'visa' ? 'Visa' : 'Mastercard'}
                          </div>
                        </div>
                        {/* Restore */}
                        <div onClick={() => restore(card.id)} style={{ padding: '7px 12px', borderRadius: 10, background: t.accentSoft, cursor: 'pointer' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: t.accent }}>Restaurar</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add dashed */}
          <div onClick={() => setShowAdd(true)} style={{ marginTop: 16, padding: '16px 20px', borderRadius: 18, border: `1.5px dashed ${t.borderStrong}`, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: t.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PelasIcon name="plus" size={20} color={t.accent} strokeWidth={2.4}/>
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: t.accent }}>Añadir nueva tarjeta</div>
              <div style={{ fontSize: 11.5, color: t.text2, marginTop: 1 }}>Visa, Mastercard u otra red</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {peekCard && (
        <div onClick={() => setPeekCard(null)} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 340 }}>
            <div style={{ borderRadius: '18px 18px 0 0', overflow: 'hidden' }}>
              <CreditCard theme={theme} card={peekCard} width={340} height={207}/>
            </div>
            <div style={{ background: t.surface, borderRadius: '0 0 18px 18px', overflow: 'hidden' }}>
              <CardDataModalRows theme={theme} card={peekCard}/>
              <div style={{ padding: '12px 18px' }}>
                <button onClick={() => setPeekCard(null)} style={{ width: '100%', height: 44, borderRadius: 22, border: `1px solid ${t.border}`, background: t.surface2, color: t.text2, fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdd && <AddCardSheet theme={theme} onClose={() => setShowAdd(false)} onSave={addCard}/>}
    </div>
  );
};
