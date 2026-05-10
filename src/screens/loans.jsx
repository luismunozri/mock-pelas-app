import { useState, useId } from 'react';
import { PelasIcon } from '../icons';
import { T } from '../theme';
import { Card, SectionTitle, Progress, PrimaryButton, Sparkline } from '../components';
import { PelasHeader } from '../frame';
import { PELAS_LOANS, PELAS_ACCOUNTS } from '../data';

// ── Constants ─────────────────────────────────────────────────────────────────

const LOAN_TYPES = [
  { id: 'mortgage', label: 'Hipoteca',   icon: 'home',    color: '#0066FF' },
  { id: 'car',      label: 'Coche',      icon: 'car',     color: '#7C5CFF' },
  { id: 'personal', label: 'Personal',   icon: 'wallet',  color: '#FF8A4C' },
  { id: 'student',  label: 'Estudios',   icon: 'book',    color: '#3FB984' },
  { id: 'other',    label: 'Otro',       icon: 'card',    color: '#A2A2A7' },
];

const LOAN_COLORS = ['#0066FF','#7C5CFF','#FF8A4C','#3FB984','#E16364','#FFC234','#5B8DEF','#1B3A8C'];

const fmtEUR = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2 }) + ' €';
const fmtShort = (n) => n >= 1000 ? (n / 1000).toFixed(1).replace('.', ',') + 'k €' : fmtEUR(n);

const paidPct = (loan) => Math.round((loan.paid / loan.totalAmount) * 100);

// ── Sparkline for amortization preview ───────────────────────────────────────

const AmortizationSparkline = ({ loan, theme }) => {
  const t = T(theme);
  const uid = useId().replace(/:/g, '');
  const steps = 12;
  const data = Array.from({ length: steps }, (_, i) => {
    const progress = (loan.monthsTotal - loan.monthsRemaining + i) / loan.monthsTotal;
    return loan.totalAmount * (1 - progress);
  });
  const max = data[0];
  const W = 240, H = 56;
  const pts = data.map((v, i) => [i * (W / (steps - 1)), H - (v / max) * (H - 6) - 3]);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i-1][0] + pts[i][0]) / 2;
    d += ` C ${cx} ${pts[i-1][1]}, ${cx} ${pts[i][1]}, ${pts[i][0]} ${pts[i][1]}`;
  }
  const gradId = `amort-${uid}`;
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" style={{ stopColor: loan.color, stopOpacity: 0.28 }}/>
          <stop offset="100%" style={{ stopColor: loan.color, stopOpacity: 0 }}/>
        </linearGradient>
      </defs>
      <path d={`${d} L ${W} ${H} L 0 ${H} Z`} fill={`url(#${gradId})`}/>
      <path d={d} style={{ stroke: loan.color }} strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
};

// ── Add / Edit Loan Sheet ─────────────────────────────────────────────────────

const AddLoanSheet = ({ theme, initial, onSave, onClose }) => {
  const t = T(theme);
  const isEdit = !!initial;

  const [form, setForm] = useState({
    name:           initial?.name           || '',
    entity:         initial?.entity         || '',
    type:           initial?.type           || 'mortgage',
    color:          initial?.color          || '#0066FF',
    totalAmount:    initial?.totalAmount?.toString() || '',
    remaining:      initial?.remaining?.toString()   || '',
    monthlyPayment: initial?.monthlyPayment?.toString() || '',
    interestRate:   initial?.interestRate?.toString()   || '',
    tae:            initial?.tae?.toString()            || '',
    startDate:      initial?.startDate      || '',
    endDate:        initial?.endDate        || '',
    accountId:      initial?.accountId      || 'a2',
  });

  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));

  const selectedType = LOAN_TYPES.find(lt => lt.id === form.type);

  const handleSave = () => {
    if (!form.name.trim() || !form.totalAmount || !form.monthlyPayment) return;
    const total  = parseFloat(form.totalAmount.replace(',', '.'))  || 0;
    const rem    = parseFloat(form.remaining.replace(',', '.'))    || total;
    const paid   = total - rem;
    const months = form.monthlyPayment
      ? Math.ceil(rem / parseFloat(form.monthlyPayment.replace(',', '.')))
      : 0;
    onSave({
      id:             initial?.id || ('l' + Date.now()),
      name:           form.name.trim(),
      entity:         form.entity.trim(),
      type:           form.type,
      icon:           selectedType?.icon || 'card',
      color:          form.color,
      totalAmount:    total,
      remaining:      rem,
      paid:           paid,
      monthlyPayment: parseFloat(form.monthlyPayment.replace(',', '.')) || 0,
      interestRate:   parseFloat(form.interestRate.replace(',', '.'))   || 0,
      tae:            parseFloat(form.tae.replace(',', '.'))            || 0,
      startDate:      form.startDate,
      endDate:        form.endDate,
      monthsRemaining: months,
      monthsTotal:    initial?.monthsTotal || months,
      nextPaymentDate: '1 del próximo mes',
      daysToNext:     30,
      accountId:      form.accountId,
      status:         'active',
      payments:       initial?.payments || [],
    });
  };

  const valid = form.name.trim() && form.totalAmount && form.monthlyPayment;

  const NumField = ({ label, field, placeholder, suffix = '€' }) => (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10.5, color: t.text2, fontWeight: 500, marginBottom: 5 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12, padding: '0 12px', height: 46, gap: 6 }}>
        <input
          value={form[field]}
          onChange={e => set(field, e.target.value.replace(/[^0-9.,]/g, ''))}
          placeholder={placeholder}
          inputMode="decimal"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14, fontWeight: 500 }}
        />
        <span style={{ fontSize: 12, color: t.text2 }}>{suffix}</span>
      </div>
    </div>
  );

  const TextField = ({ label, field, placeholder }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10.5, color: t.text2, fontWeight: 500, marginBottom: 5 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12, padding: '0 14px', height: 46 }}>
        <input
          value={form[field]}
          onChange={e => set(field, e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}
        />
      </div>
    </div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', maxHeight: '94%', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease-out' }}>

        {/* Header */}
        <div style={{ padding: '14px 22px 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 14px' }}/>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>{isEdit ? 'Editar préstamo' : 'Nuevo préstamo'}</div>
            <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PelasIcon name="x" size={15} color={t.text2}/>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 8px' }}>

          {/* Tipo */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, color: t.text2, fontWeight: 500, marginBottom: 8 }}>Tipo de préstamo</div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
              {LOAN_TYPES.map(lt => {
                const sel = form.type === lt.id;
                return (
                  <div key={lt.id} onClick={() => { set('type', lt.id); set('color', lt.color); }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 14px', borderRadius: 14, cursor: 'pointer', background: sel ? lt.color + '18' : t.surface2, border: `1.5px solid ${sel ? lt.color : 'transparent'}`, flexShrink: 0, transition: 'all 0.15s' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 11, background: sel ? lt.color + '25' : t.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PelasIcon name={lt.icon} size={16} color={sel ? lt.color : t.text2}/>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: sel ? 600 : 400, color: sel ? lt.color : t.text2 }}>{lt.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <TextField label="Nombre del préstamo" field="name" placeholder="p. ej. Hipoteca piso Madrid"/>
          <TextField label="Entidad / banco" field="entity" placeholder="p. ej. BBVA, Santander…"/>

          {/* Importes */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10.5, color: t.text2, fontWeight: 500, marginBottom: 8 }}>Importes</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <NumField label="Capital inicial" field="totalAmount" placeholder="150 000"/>
              <NumField label="Capital pendiente" field="remaining" placeholder="auto"/>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <NumField label="Cuota mensual" field="monthlyPayment" placeholder="720"/>
              <NumField label="TIN %" field="interestRate" placeholder="2,4" suffix="%"/>
            </div>
          </div>

          {/* TAE */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10.5, color: t.text2, fontWeight: 500, marginBottom: 5 }}>TAE %</div>
            <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12, padding: '0 12px', height: 46, gap: 6 }}>
              <input value={form.tae} onChange={e => set('tae', e.target.value.replace(/[^0-9.,]/g,''))} placeholder="2,6" inputMode="decimal"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14, fontWeight: 500 }}/>
              <span style={{ fontSize: 12, color: t.text2 }}>%</span>
            </div>
          </div>

          {/* Fechas */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: t.text2, fontWeight: 500, marginBottom: 5 }}>Fecha inicio</div>
              <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12, padding: '0 12px', height: 46 }}>
                <input value={form.startDate} onChange={e => set('startDate', e.target.value)} placeholder="Jun 2024"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 13 }}/>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: t.text2, fontWeight: 500, marginBottom: 5 }}>Fecha fin</div>
              <div style={{ display: 'flex', alignItems: 'center', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12, padding: '0 12px', height: 46 }}>
                <input value={form.endDate} onChange={e => set('endDate', e.target.value)} placeholder="Jun 2034"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 13 }}/>
              </div>
            </div>
          </div>

          {/* Cuenta vinculada */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10.5, color: t.text2, fontWeight: 500, marginBottom: 8 }}>Cuenta vinculada</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PELAS_ACCOUNTS.filter(a => a.type === 'bank').map(a => {
                const sel = form.accountId === a.id;
                return (
                  <div key={a.id} onClick={() => set('accountId', a.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: sel ? a.color + '14' : t.surface2, border: `1px solid ${sel ? a.color : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: a.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <PelasIcon name={a.icon} size={13} color={a.color}/>
                    </div>
                    <div style={{ flex: 1, fontSize: 13 }}>{a.name} · {a.bank}</div>
                    <div style={{ width: 18, height: 18, borderRadius: 9, background: sel ? a.color : 'transparent', border: `1.5px solid ${sel ? a.color : t.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {sel && <PelasIcon name="check" size={10} color="#fff" strokeWidth={3}/>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Color */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10.5, color: t.text2, fontWeight: 500, marginBottom: 8 }}>Color</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {LOAN_COLORS.map(c => (
                <div key={c} onClick={() => set('color', c)} style={{ flex: 1, height: 30, borderRadius: 9, background: c, cursor: 'pointer', border: form.color === c ? '2.5px solid #fff' : '2px solid transparent', boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none', transition: 'box-shadow 0.15s' }}/>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 22px 22px', flexShrink: 0 }}>
          <button onClick={handleSave} disabled={!valid}
            style={{ width: '100%', height: 52, borderRadius: 26, border: 'none', background: valid ? t.accent : t.surface2, color: valid ? '#fff' : t.text2, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: valid ? 'pointer' : 'default', transition: 'all 0.2s' }}>
            {isEdit ? 'Guardar cambios' : 'Añadir préstamo'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Loan Detail Screen ────────────────────────────────────────────────────────

export const LoanDetailScreen = ({ theme, loan: initialLoan, onBack, onEdit }) => {
  const t = T(theme);
  const [loan, setLoan] = useState(initialLoan);
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  if (!loan) return null;

  const pct = paidPct(loan);
  const loanType = LOAN_TYPES.find(lt => lt.id === loan.type);
  const monthlyInterest = (loan.remaining * loan.interestRate / 100) / 12;
  const monthlyPrincipal = loan.monthlyPayment - monthlyInterest;
  const totalInterestRemaining = (loan.monthlyPayment * loan.monthsRemaining) - loan.remaining;
  const yearsRemaining = Math.floor(loan.monthsRemaining / 12);
  const monthsRemainingMod = loan.monthsRemaining % 12;

  // Projection data: remaining capital month by month (12 steps)
  const projectionData = Array.from({ length: 12 }, (_, i) => {
    const pctDone = (loan.monthsTotal - loan.monthsRemaining + i) / loan.monthsTotal;
    return Math.max(0, loan.totalAmount * (1 - pctDone));
  });

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ overflowY: 'auto', height: '100%' }}>
        <PelasHeader theme={theme} title="Detalle del préstamo" onBack={onBack} action={
          <div style={{ position: 'relative' }}>
            <div onClick={() => setShowMenu(v => !v)} style={{ width: 40, height: 40, borderRadius: 20, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PelasIcon name="more" size={18} color={t.text}/>
            </div>
            {showMenu && (
              <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 46, right: 0, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: 10, minWidth: 160, overflow: 'hidden' }}>
                <div onClick={() => { setShowMenu(false); setShowEdit(true); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', cursor: 'pointer', borderBottom: `1px solid ${t.border}` }}>
                  <PelasIcon name="edit" size={15} color={t.text2}/>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Editar</span>
                </div>
                <div onClick={() => { setShowMenu(false); onBack(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', cursor: 'pointer' }}>
                  <PelasIcon name="x" size={15} color={t.negative}/>
                  <span style={{ fontSize: 13, fontWeight: 500, color: t.negative }}>Eliminar</span>
                </div>
              </div>
            )}
          </div>
        }/>
        {showMenu && <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 5 }}/>}

        <div style={{ padding: '0 22px 32px' }}>

          {/* Hero card */}
          <Card theme={theme} padding={22} radius={24} style={{ marginBottom: 18, background: theme === 'dark' ? `linear-gradient(140deg, ${loan.color}22 0%, #1A1A28 80%)` : `linear-gradient(140deg, ${loan.color}12 0%, #fff 80%)`, border: `1px solid ${loan.color}30` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 46, height: 46, borderRadius: 16, background: loan.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PelasIcon name={loan.icon} size={22} color={loan.color}/>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{loan.name}</div>
                <div style={{ fontSize: 12, color: t.text2 }}>{loan.entity} · {loanType?.label}</div>
              </div>
            </div>

            {/* Capital pendiente */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: t.text2, marginBottom: 3 }}>Capital pendiente</div>
              <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, color: loan.color }}>
                {fmtShort(loan.remaining)}
              </div>
              <div style={{ fontSize: 12, color: t.text2, marginTop: 2 }}>de {fmtShort(loan.totalAmount)} totales</div>
            </div>

            {/* Progreso */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: t.text2 }}>Amortizado</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: t.positive }}>{pct}%</div>
              </div>
              <div style={{ width: '100%', height: 8, background: t.surface2, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: loan.color, borderRadius: 4, transition: 'width 0.5s' }}/>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10.5, color: t.text2 }}>
                <span style={{ color: t.positive, fontWeight: 600 }}>{fmtShort(loan.paid)} pagado</span>
                <span>{fmtShort(loan.remaining)} pendiente</span>
              </div>
            </div>
          </Card>

          {/* Key metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 18 }}>
            {[
              { label: 'Cuota mensual',       value: fmtEUR(loan.monthlyPayment), icon: 'refresh', color: t.accent },
              { label: 'Próximo pago',         value: loan.nextPaymentDate, icon: 'calendar', color: '#FFC234' },
              { label: 'TIN / TAE',            value: `${loan.interestRate}% / ${loan.tae}%`, icon: 'trending', color: '#5B8DEF' },
              { label: 'Tiempo restante',      value: yearsRemaining > 0 ? `${yearsRemaining}a ${monthsRemainingMod}m` : `${loan.monthsRemaining} meses`, icon: 'clock', color: t.positive },
              { label: 'Intereses/mes',        value: fmtEUR(Math.round(monthlyInterest * 100) / 100), icon: 'arrow-up', color: t.negative },
              { label: 'Principal/mes',        value: fmtEUR(Math.round(monthlyPrincipal * 100) / 100), icon: 'arrow-down', color: t.positive },
            ].map(m => (
              <Card key={m.label} theme={theme} padding={14} radius={16}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: m.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PelasIcon name={m.icon} size={13} color={m.color}/>
                  </div>
                  <div style={{ fontSize: 10.5, color: t.text2 }}>{m.label}</div>
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>{m.value}</div>
              </Card>
            ))}
          </div>

          {/* Evolución proyectada */}
          <div style={{ marginBottom: 18 }}>
            <SectionTitle theme={theme} title="Evolución proyectada"/>
            <Card theme={theme} padding={16} radius={18}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10.5, color: t.text2 }}>Intereses totales restantes (est.)</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: t.negative }}>
                    {fmtShort(Math.max(0, Math.round(totalInterestRemaining)))}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10.5, color: t.text2 }}>Fin previsto</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{loan.endDate}</div>
                </div>
              </div>
              <AmortizationSparkline loan={loan} theme={theme}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9.5, color: t.text3 }}>
                <span>Hoy</span>
                <span>+6 meses</span>
                <span>+12 meses</span>
              </div>
            </Card>
          </div>

          {/* Desglose cuota */}
          <div style={{ marginBottom: 18 }}>
            <SectionTitle theme={theme} title="Desglose de cuota"/>
            <Card theme={theme} padding={16} radius={18}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: t.text2 }}>Cuota de</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{fmtEUR(loan.monthlyPayment)}</div>
              </div>
              {[
                { label: 'Principal', amount: Math.round(monthlyPrincipal * 100) / 100, color: loan.color, pct: Math.round((monthlyPrincipal / loan.monthlyPayment) * 100) },
                { label: 'Intereses', amount: Math.round(monthlyInterest * 100) / 100, color: t.negative, pct: Math.round((monthlyInterest / loan.monthlyPayment) * 100) },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: item.color }}/>
                      <div style={{ fontSize: 12, color: t.text2 }}>{item.label}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.pct}% · {fmtEUR(item.amount)}</div>
                  </div>
                  <div style={{ width: '100%', height: 6, background: t.surface2, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: 3 }}/>
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Últimos pagos */}
          {loan.payments?.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <SectionTitle theme={theme} title="Últimos pagos"/>
              <Card theme={theme} padding={0} radius={18}>
                {loan.payments.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderBottom: i < loan.payments.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: t.positive + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <PelasIcon name="check" size={14} color={t.positive} strokeWidth={2.5}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.date}</div>
                      <div style={{ fontSize: 11, color: t.text2, marginTop: 1 }}>
                        Principal: {fmtEUR(p.principal)} · Intereses: {fmtEUR(p.interest)}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtEUR(p.amount)}</div>
                  </div>
                ))}
              </Card>
            </div>
          )}

        </div>
      </div>

      {showEdit && (
        <AddLoanSheet
          theme={theme}
          initial={loan}
          onSave={updated => { setLoan(updated); setShowEdit(false); if (onEdit) onEdit(updated); }}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
};

// ── Main Loans Screen ─────────────────────────────────────────────────────────

export const LoansScreen = ({ theme, onBack, onNavigate }) => {
  const t = T(theme);
  const [loans, setLoans] = useState(PELAS_LOANS);
  const [filter, setFilter] = useState('active'); // 'all' | 'active' | 'paid'
  const [showAdd, setShowAdd] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  const totalDebt     = loans.filter(l => l.status === 'active').reduce((s, l) => s + l.remaining, 0);
  const totalMonthly  = loans.filter(l => l.status === 'active').reduce((s, l) => s + l.monthlyPayment, 0);
  const totalOriginal = loans.filter(l => l.status === 'active').reduce((s, l) => s + l.totalAmount, 0);
  const totalPaid     = loans.filter(l => l.status === 'active').reduce((s, l) => s + l.paid, 0);
  const overallPct    = totalOriginal > 0 ? Math.round((totalPaid / totalOriginal) * 100) : 0;

  const displayLoans = loans.filter(l =>
    filter === 'all' ? true : filter === 'active' ? l.status === 'active' : l.status === 'paid'
  );

  const handleSave = (loan) => {
    setLoans(prev => prev.some(l => l.id === loan.id) ? prev.map(l => l.id === loan.id ? loan : l) : [...prev, loan]);
    setShowAdd(false);
  };

  const handleDelete = (id) => {
    setLoans(prev => prev.filter(l => l.id !== id));
    setSelectedLoan(null);
  };

  if (selectedLoan) {
    return (
      <LoanDetailScreen
        theme={theme}
        loan={selectedLoan}
        onBack={() => setSelectedLoan(null)}
        onEdit={updated => setLoans(prev => prev.map(l => l.id === updated.id ? updated : l))}
      />
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ overflowY: 'auto', height: '100%' }}>
        <PelasHeader theme={theme} title="Préstamos" onBack={onBack} action={
          <div onClick={() => setShowAdd(true)} style={{ width: 40, height: 40, borderRadius: 20, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PelasIcon name="plus" size={20} color="#fff" strokeWidth={2.4}/>
          </div>
        }/>

        <div style={{ padding: '0 22px 32px' }}>

          {/* Resumen global */}
          <Card theme={theme} padding={22} radius={24} style={{ marginBottom: 20, background: theme === 'dark' ? 'linear-gradient(140deg,#0B1F4A,#1A1A28)' : 'linear-gradient(140deg,#E0EBFF,#fff)', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11.5, color: t.text2, marginBottom: 4 }}>Deuda total activa</div>
                <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1 }}>{fmtShort(totalDebt)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: t.text2 }}>Cuota total/mes</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: t.negative, marginTop: 2 }}>{fmtEUR(totalMonthly)}</div>
              </div>
            </div>

            {/* Barra global de amortización */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: t.text2 }}>Amortización global</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: t.positive }}>{overallPct}%</div>
              </div>
              <div style={{ width: '100%', height: 8, background: t.surface2, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${overallPct}%`, height: '100%', background: t.accent, borderRadius: 4 }}/>
              </div>
            </div>

            {/* Préstamos activos dots */}
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              {loans.filter(l => l.status === 'active').map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, background: l.color + '18' }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: l.color }}/>
                  <span style={{ fontSize: 10, fontWeight: 600, color: l.color }}>{l.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 18, padding: 4, background: t.surface2, borderRadius: 14 }}>
            {[{ id: 'active', label: `Activos (${loans.filter(l => l.status === 'active').length})` }, { id: 'all', label: 'Todos' }, { id: 'paid', label: 'Finalizados' }].map(f => (
              <div key={f.id} onClick={() => setFilter(f.id)}
                style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 500, background: filter === f.id ? t.surface : 'transparent', color: filter === f.id ? t.accent : t.text2, transition: 'all 0.15s', boxShadow: filter === f.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                {f.label}
              </div>
            ))}
          </div>

          {/* Loan cards */}
          {displayLoans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: t.text2 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>¡Sin deudas!</div>
              <div style={{ fontSize: 12 }}>No tienes préstamos en esta categoría.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {displayLoans.map(loan => {
                const pct = paidPct(loan);
                const monthlyInterest = (loan.remaining * loan.interestRate / 100) / 12;
                return (
                  <Card key={loan.id} theme={theme} padding={18} radius={20} style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                    onClick={() => setSelectedLoan(loan)}>
                    {/* Color stripe */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: loan.color, borderRadius: '20px 0 0 20px' }}/>

                    <div style={{ paddingLeft: 8 }}>
                      {/* Row 1: icon + name + amount */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 14, background: loan.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <PelasIcon name={loan.icon} size={20} color={loan.color}/>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{loan.name}</div>
                          <div style={{ fontSize: 11.5, color: t.text2, marginTop: 2 }}>{loan.entity} · TIN {loan.interestRate}%</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: loan.color }}>{fmtShort(loan.remaining)}</div>
                          <div style={{ fontSize: 10.5, color: t.text3, marginTop: 1 }}>pendiente</div>
                        </div>
                      </div>

                      {/* Progress */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ width: '100%', height: 6, background: t.surface2, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: loan.color, borderRadius: 3 }}/>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: t.text3 }}>
                          <span style={{ color: t.positive, fontWeight: 600 }}>{pct}% amortizado</span>
                          <span>{loan.monthsRemaining} meses restantes</span>
                        </div>
                      </div>

                      {/* Pills row */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: t.surface2, padding: '4px 9px', borderRadius: 8 }}>
                          <PelasIcon name="refresh" size={10} color={t.text2}/>
                          <span style={{ fontSize: 10.5, color: t.text2, fontWeight: 500 }}>{fmtEUR(loan.monthlyPayment)}/mes</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: t.negative + '14', padding: '4px 9px', borderRadius: 8 }}>
                          <PelasIcon name="trending" size={10} color={t.negative}/>
                          <span style={{ fontSize: 10.5, color: t.negative, fontWeight: 500 }}>{fmtEUR(Math.round(monthlyInterest * 100) / 100)}/mes intereses</span>
                        </div>
                        {loan.daysToNext <= 30 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FFC234' + '18', padding: '4px 9px', borderRadius: 8 }}>
                            <PelasIcon name="calendar" size={10} color="#FFC234"/>
                            <span style={{ fontSize: 10.5, color: '#FFC234', fontWeight: 500 }}>Pago: {loan.nextPaymentDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Add first loan CTA */}
          {loans.length === 0 && (
            <div onClick={() => setShowAdd(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 20px', borderRadius: 20, border: `2px dashed ${t.borderStrong}`, cursor: 'pointer', marginTop: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 18, background: t.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PelasIcon name="plus" size={24} color={t.accent} strokeWidth={2.4}/>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Añade tu primer préstamo</div>
                <div style={{ fontSize: 12, color: t.text2 }}>Hipoteca, coche, personal…</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddLoanSheet theme={theme} onSave={handleSave} onClose={() => setShowAdd(false)}/>}
    </div>
  );
};
