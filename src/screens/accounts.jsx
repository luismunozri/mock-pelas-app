import { useState } from 'react';
import { PelasIcon } from '../icons';
import { T } from '../theme';
import { Card, PrimaryButton, Sparkline } from '../components';
import { PelasHeader } from '../frame';
import { PELAS_ACCOUNTS, PELAS_TRANSACTIONS, PELAS_CATEGORIES, PELAS_USER } from '../data';

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCOUNT_COLORS = [
  '#0066FF','#3FB984','#7C5CFF','#FF8A4C',
  '#E16364','#FFC234','#1B3A8C','#A2A2A7',
];

const CURRENCIES = ['EUR','USD','GBP','CHF','JPY','CAD','AUD'];

const ACCOUNT_TYPES = [
  { id: 'bank',       label: 'Banco',     icon: 'card'   },
  { id: 'cash',       label: 'Efectivo',  icon: 'wallet' },
  { id: 'investment', label: 'Inversión', icon: 'trending'},
];

// Seed existing accounts with extra fields
const seedAccounts = () => PELAS_ACCOUNTS.map(a => ({
  ...a,
  currency: a.currency ?? 'EUR',
  type: a.type,
  shared: false,
  sharedWith: [],
}));

// ── Add / Edit Sheet ──────────────────────────────────────────────────────────

const BLANK = {
  name: '', bank: '', currency: 'EUR',
  color: '#0066FF', type: 'bank',
  shared: false, sharedWith: [],
};

const mkInitials = (name) => name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

const AccountSheet = ({ theme, initial, onClose, onSave, familyGroup }) => {
  const t = T(theme);
  const editing = !!initial;
  const [form, setForm] = useState(initial ?? BLANK);
  const [inviteEmail, setInviteEmail] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const hasFamilyGroup = !!familyGroup?.group;
  const familyNonAdminMembers = (familyGroup?.members ?? []).filter(m => m.id !== 'u0');

  const handleToggleShared = () => {
    const next = !form.shared;
    if (next && hasFamilyGroup && familyNonAdminMembers.length > 0) {
      const autoAdded = familyNonAdminMembers.map(m => ({
        email: m.email,
        name: m.name,
        initials: mkInitials(m.name),
        fromFamily: true,
      }));
      setForm(f => ({ ...f, shared: true, sharedWith: autoAdded }));
    } else {
      set('shared', next);
    }
  };

  const addSharedUser = () => {
    const email = inviteEmail.trim();
    if (!email || form.sharedWith.some(u => u.email === email)) return;
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    set('sharedWith', [...form.sharedWith, { email, name, initials: mkInitials(name) }]);
    setInviteEmail('');
  };

  const removeShared = (email) =>
    set('sharedWith', form.sharedWith.filter(u => u.email !== email));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      id: initial?.id ?? 'a' + Date.now(),
      icon: form.type === 'cash' ? 'wallet' : form.type === 'investment' ? 'trending' : 'card',
      balance: initial?.balance ?? 0,
    });
    onClose();
  };

  const Field = ({ label, value, onChange, placeholder, icon }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '0 14px', height: 50, gap: 10 }}>
        {icon && <PelasIcon name={icon} size={18} color={t.text2}/>}
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 14 }}/>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: '24px 24px 0 0', maxHeight: '94%', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease-out' }}>
        {/* Handle */}
        <div style={{ padding: '14px 22px 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: t.borderStrong, margin: '0 auto 14px' }}/>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>{editing ? 'Editar cuenta' : 'Nueva cuenta'}</div>
            <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PelasIcon name="x" size={15} color={t.text2}/>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px' }}>

          {/* Preview badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: form.color + '14', borderRadius: 18, border: `1px solid ${form.color}33`, marginBottom: 20 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: form.color + '28', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PelasIcon name={form.type === 'cash' ? 'wallet' : form.type === 'investment' ? 'trending' : 'card'} size={20} color={form.color}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: form.color }}>{form.name || 'Nombre de cuenta'}</div>
              <div style={{ fontSize: 12, color: t.text2, marginTop: 2 }}>{form.bank || 'Entidad'} · {form.currency}</div>
            </div>
          </div>

          <Field label="Nombre a mostrar" value={form.name} onChange={v => set('name', v)} placeholder="p. ej. BBVA Principal" icon="edit"/>
          <Field label="Entidad" value={form.bank} onChange={v => set('bank', v)} placeholder="p. ej. BBVA, Revolut, ING…" icon="card"/>

          {/* Tipo */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 8 }}>Tipo de cuenta</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {ACCOUNT_TYPES.map(opt => (
                <div key={opt.id} onClick={() => set('type', opt.id)} style={{ flex: 1, padding: '10px 4px', borderRadius: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: form.type === opt.id ? form.color + '18' : t.surface2, border: `1px solid ${form.type === opt.id ? form.color : 'transparent'}`, transition: 'all 0.15s' }}>
                  <PelasIcon name={opt.icon} size={18} color={form.type === opt.id ? form.color : t.text2}/>
                  <div style={{ fontSize: 11.5, fontWeight: 500, color: form.type === opt.id ? form.color : t.text2 }}>{opt.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Divisa */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 8 }}>Divisa</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CURRENCIES.map(cur => (
                <div key={cur} onClick={() => set('currency', cur)} style={{ padding: '7px 14px', borderRadius: 100, cursor: 'pointer', fontSize: 12.5, fontWeight: 500, background: form.currency === cur ? form.color : t.surface2, color: form.currency === cur ? '#fff' : t.text2, border: `1px solid ${form.currency === cur ? form.color : 'transparent'}`, transition: 'all 0.15s' }}>
                  {cur}
                </div>
              ))}
            </div>
          </div>

          {/* Color */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: t.text2, fontWeight: 500, marginBottom: 8 }}>Color de personalización</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {ACCOUNT_COLORS.map(c => (
                <div key={c} onClick={() => set('color', c)} style={{ width: 36, height: 36, borderRadius: 10, background: c, cursor: 'pointer', border: form.color === c ? '3px solid #fff' : '3px solid transparent', boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none', transition: 'all 0.15s' }}/>
              ))}
            </div>
          </div>

          {/* Cuenta compartida */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.shared ? 14 : 0 }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>Cuenta compartida</div>
                <div style={{ fontSize: 11.5, color: t.text2, marginTop: 2 }}>Comparte el acceso con otras personas</div>
              </div>
              <div onClick={handleToggleShared} style={{ width: 42, height: 24, borderRadius: 12, position: 'relative', background: form.shared ? form.color : t.borderStrong, transition: 'background 0.18s', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 4, left: form.shared ? 22 : 4, width: 16, height: 16, borderRadius: 8, background: '#fff', transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }}/>
              </div>
            </div>

            {form.shared && (
              <>
                {/* Banner de grupo familiar si se auto-rellenó */}
                {hasFamilyGroup && form.sharedWith.some(u => u.fromFamily) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: form.color + '12', border: `1px solid ${form.color}33`, marginBottom: 12 }}>
                    <PelasIcon name="people" size={15} color={form.color}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: form.color }}>Miembros de "{familyGroup.group.name}" añadidos</div>
                      <div style={{ fontSize: 10.5, color: t.text2, marginTop: 1 }}>Puedes añadir o quitar miembros manualmente</div>
                    </div>
                  </div>
                )}

                {/* Lista de usuarios compartidos */}
                {form.sharedWith.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {form.sharedWith.map(u => (
                      <div key={u.email} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: t.surface, borderRadius: 14, border: `1px solid ${u.fromFamily ? form.color + '44' : t.border}` }}>
                        <div style={{ width: 34, height: 34, borderRadius: 17, background: form.color + '28', display: 'flex', alignItems: 'center', justifyContent: 'center', color: form.color, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{u.initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                            {u.fromFamily && (
                              <div style={{ fontSize: 9, fontWeight: 700, color: form.color, background: form.color + '18', padding: '1px 5px', borderRadius: 5, letterSpacing: 0.2 }}>FAMILIA</div>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: t.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                        </div>
                        <div onClick={() => removeShared(u.email)} style={{ width: 28, height: 28, borderRadius: 8, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <PelasIcon name="x" size={12} color={t.text2}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input de invitación manual */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '0 14px', height: 48, gap: 10 }}>
                    <PelasIcon name="mail" size={16} color={t.text2}/>
                    <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addSharedUser()}
                      placeholder="Añadir por email…"
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 13 }}/>
                  </div>
                  <div onClick={addSharedUser} style={{ width: 48, height: 48, borderRadius: 14, background: form.color, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <PelasIcon name="plus" size={20} color="#fff" strokeWidth={2.4}/>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: t.text3, marginTop: 6 }}>Los usuarios recibirán una invitación por email</div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 22px 22px', flexShrink: 0 }}>
          <PrimaryButton full theme={theme} onClick={handleSave}>
            {editing ? 'Guardar cambios' : 'Añadir cuenta'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

// ── Accounts Screen ───────────────────────────────────────────────────────────

export const AccountsScreen = ({ theme, onBack, onNavigate, initialFilters, familyGroup }) => {
  const t = T(theme);
  const [accounts, setAccounts] = useState(seedAccounts);
  const [archived, setArchived] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [currencyFilter, setCurrencyFilter] = useState(initialFilters?.currency || 'all');

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const filteredAccounts = currencyFilter === 'all'
    ? accounts
    : accounts.filter(a => (a.currency ?? 'EUR') === currencyFilter);
  const filteredArchived = currencyFilter === 'all'
    ? archived
    : archived.filter(a => (a.currency ?? 'EUR') === currencyFilter);
  const visibleBalance = filteredAccounts.reduce((s, a) => s + a.balance, 0);
  const visibleCurrencies = [...new Set(accounts.map(a => a.currency ?? 'EUR'))];

  const saveAccount = (account) =>
    setAccounts(prev =>
      prev.some(a => a.id === account.id)
        ? prev.map(a => a.id === account.id ? account : a)
        : [...prev, account]
    );

  const archiveAccount = (id) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    setAccounts(prev => prev.filter(a => a.id !== id));
    setArchived(prev => [...prev, acc]);
  };

  const restoreAccount = (id) => {
    const acc = archived.find(a => a.id === id);
    if (!acc) return;
    setArchived(prev => prev.filter(a => a.id !== id));
    setAccounts(prev => [...prev, acc]);
  };

  const deleteArchived = (id) =>
    setArchived(prev => prev.filter(a => a.id !== id));

  const AccountRow = ({ a }) => (
    <Card key={a.id} theme={theme} padding={16} radius={18} style={{ position: 'relative' }} onClick={() => onNavigate?.('account-detail', { account: a })}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
        <div style={{ width: 46, height: 46, borderRadius: 15, background: a.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <PelasIcon name={a.icon} size={20} color={a.color}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</div>
            {a.shared && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: t.accentSoft, padding: '2px 7px', borderRadius: 6 }}>
                <PelasIcon name="people" size={10} color={t.accent}/>
                <span style={{ fontSize: 9.5, color: t.accent, fontWeight: 600 }}>Compartida</span>
              </div>
            )}
          </div>
          <div style={{ fontSize: 12, color: t.text2, marginTop: 2 }}>{a.bank} · {a.currency ?? 'EUR'}</div>
          {a.shared && a.sharedWith?.length > 0 && (
            <div style={{ display: 'flex', marginTop: 6 }}>
              {a.sharedWith.slice(0, 3).map((u, i) => (
                <div key={u.email} style={{ width: 22, height: 22, borderRadius: 11, background: a.color + '33', border: `2px solid ${t.surface}`, marginLeft: i === 0 ? 0 : -6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: a.color }}>
                  {u.initials}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {a.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {a.currency ?? '€'}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
            <div onClick={e => { e.stopPropagation(); setEditing(a); }} style={{ width: 30, height: 30, borderRadius: 9, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PelasIcon name="edit" size={13} color={t.text2}/>
            </div>
            <div onClick={e => { e.stopPropagation(); archiveAccount(a.id); }} style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,194,52,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PelasIcon name="eye-off" size={13} color={t.warning}/>
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, borderRadius: '0 2px 2px 0', background: a.color }}/>
    </Card>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <PelasHeader theme={theme} title="Mis cuentas" onBack={onBack} action={
          <div onClick={() => setShowAdd(true)} style={{ width: 40, height: 40, borderRadius: 20, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PelasIcon name="plus" size={20} color="#fff" strokeWidth={2.4}/>
          </div>
        }/>

        <div style={{ padding: '0 22px 24px' }}>
          {/* Total summary */}
          <Card theme={theme} padding={20} radius={22} style={{ marginBottom: 22, background: theme === 'dark' ? 'linear-gradient(135deg,#0B1F4A,#1A1A28)' : 'linear-gradient(135deg,#E0EBFF,#fff)', border: 'none' }}>
            <div style={{ fontSize: 11.5, color: t.text2, marginBottom: 4 }}>Saldo total · cuentas activas</div>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -1 }}>
              {totalBalance.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {accounts.map(a => (
                <div key={a.id} style={{ width: 8, height: 8, borderRadius: 4, background: a.color }}/>
              ))}
            </div>
            {archived.length > 0 && (
              <div style={{ fontSize: 11, color: t.text3, marginTop: 8 }}>
                {archived.length} cuenta{archived.length > 1 ? 's' : ''} archivada{archived.length > 1 ? 's' : ''} no incluida{archived.length > 1 ? 's' : ''}
              </div>
            )}
          </Card>

          {/* Currency filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '-8px 0 16px', overflowX: 'auto', paddingBottom: 2 }}>
            <div onClick={() => setCurrencyFilter('all')} style={{ padding: '7px 12px', borderRadius: 100, background: currencyFilter === 'all' ? t.accent : t.surface2, color: currencyFilter === 'all' ? '#fff' : t.text2, border: `1px solid ${currencyFilter === 'all' ? t.accent : t.border}`, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              Todas
            </div>
            {visibleCurrencies.map(cur => (
              <div key={cur} onClick={() => setCurrencyFilter(cur)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 100, background: currencyFilter === cur ? t.accentSoft : t.surface2, color: currencyFilter === cur ? t.accent : t.text2, border: `1px solid ${currencyFilter === cur ? t.accent : t.border}`, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                <PelasIcon name="globe" size={11} color={currencyFilter === cur ? t.accent : t.text2}/>
                {cur}
              </div>
            ))}
          </div>

          {currencyFilter !== 'all' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 14, background: t.accentSoft, border: `1px solid ${t.accent}30`, marginBottom: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: t.accent, fontWeight: 800 }}>Filtro por divisa</div>
                <div style={{ fontSize: 12.5, color: t.text, fontWeight: 700, marginTop: 1 }}>{currencyFilter} · {filteredAccounts.length} cuenta{filteredAccounts.length === 1 ? '' : 's'} · {visibleBalance.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {currencyFilter}</div>
              </div>
              <div onClick={() => setCurrencyFilter('all')} style={{ width: 30, height: 30, borderRadius: 15, background: t.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <PelasIcon name="x" size={12} color={t.text2}/>
              </div>
            </div>
          )}

          {/* Active accounts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredAccounts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: t.text2, fontSize: 13 }}>
                No tienes cuentas activas en {currencyFilter === 'all' ? 'este filtro' : currencyFilter}
              </div>
            )}
            {filteredAccounts.map(a => <AccountRow key={a.id} a={a}/>)}
          </div>

          {/* Archived section */}
          {filteredArchived.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div onClick={() => setShowArchived(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: 9, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PelasIcon name="eye-off" size={13} color={t.text2}/>
                </div>
                <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: t.text2 }}>
                  Archivadas ({filteredArchived.length})
                </div>
                <PelasIcon name={showArchived ? 'chevron-down' : 'chevron-right'} size={16} color={t.text2}/>
              </div>

              {showArchived && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {filteredArchived.map(a => (
                    <Card key={a.id} theme={theme} padding={14} radius={16} style={{ opacity: 0.7 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: a.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <PelasIcon name={a.icon} size={16} color={a.color}/>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{a.name}</div>
                          <div style={{ fontSize: 11.5, color: t.text2 }}>{a.bank} · {a.currency ?? 'EUR'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <div onClick={() => restoreAccount(a.id)} style={{ padding: '7px 12px', borderRadius: 10, background: t.accentSoft, cursor: 'pointer' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: t.accent }}>Restaurar</span>
                          </div>
                          <div onClick={() => deleteArchived(a.id)} style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(225,99,100,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <PelasIcon name="x" size={13} color={t.negative}/>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add account dashed */}
          <div onClick={() => setShowAdd(true)} style={{ marginTop: 16, padding: '16px 20px', borderRadius: 18, border: `1.5px dashed ${t.borderStrong}`, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: t.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PelasIcon name="plus" size={20} color={t.accent} strokeWidth={2.4}/>
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: t.accent }}>Agregar cuenta</div>
              <div style={{ fontSize: 11.5, color: t.text2, marginTop: 1 }}>Banco, efectivo o inversión</div>
            </div>
          </div>
        </div>
      </div>

      {showAdd && <AccountSheet theme={theme} initial={null} onClose={() => setShowAdd(false)} onSave={saveAccount} familyGroup={familyGroup}/>}
      {editing && <AccountSheet theme={theme} initial={editing} onClose={() => setEditing(null)} onSave={saveAccount} familyGroup={familyGroup}/>}
    </div>
  );
};

// ── Account Detail Screen ─────────────────────────────────────────────────────

const MOCK_BANKING = {
  a1: { iban: null,                          bic: null,           holder: PELAS_USER.name, openDate: 'Efectivo' },
  a2: { iban: 'ES76 0049 1500 05 2810374562', bic: 'BBVAESMMXXX', holder: PELAS_USER.name, openDate: '14/03/2021' },
  a3: { iban: 'ES21 0081 0123 45 0001234567', bic: 'BSABESBBXXX', holder: PELAS_USER.name, openDate: '02/09/2019' },
  a4: { iban: 'GB29 REVO 0099 6933 1926 81',  bic: 'REVOGB21XXX', holder: PELAS_USER.name, openDate: '20/11/2022' },
};

const MOCK_BALANCE_HISTORY = {
  a1: {
    today:    { v:[178,179,179,180,180,180], x:['9h','11h','13h','15h','18h','21h'] },
    week:     { v:[165,168,172,170,175,178,180], x:['L','M','X','J','V','S','D'] },
    month:    { v:[140,148,155,158,162,168,174,180], x:['1','8','15','22','30 abr'] },
    '3months':{ v:[120,135,148,155,162,170,176,180], x:['Feb','Mar','Abr'] },
    year:     { v:[90,105,120,135,150,162,172,180], x:['Ene','Mar','May','Jul','Sep','Nov'] },
    all:      { v:[60,85,110,130,148,162,174,180], x:['\'22','\'23','\'24','\'25'] },
  },
  a2: {
    today:    { v:[2840,2845,2850,2855,2858,2860], x:['9h','11h','13h','15h','18h','21h'] },
    week:     { v:[2750,2790,2810,2780,2820,2840,2860], x:['L','M','X','J','V','S','D'] },
    month:    { v:[2480,2550,2600,2640,2700,2740,2800,2860], x:['1','8','15','22','30 abr'] },
    '3months':{ v:[2100,2250,2400,2500,2600,2700,2780,2860], x:['Feb','Mar','Abr'] },
    year:     { v:[1800,2000,2200,2350,2500,2600,2720,2860], x:['Ene','Mar','May','Jul','Sep','Nov'] },
    all:      { v:[1200,1600,1900,2100,2300,2500,2680,2860], x:['\'21','\'22','\'23','\'24','\'25'] },
  },
  a3: {
    today:    { v:[1105,1106,1107,1107,1107,1107], x:['9h','11h','13h','15h','18h','21h'] },
    week:     { v:[1080,1090,1095,1092,1100,1104,1107], x:['L','M','X','J','V','S','D'] },
    month:    { v:[1200,1170,1140,1120,1100,1095,1100,1107], x:['1','8','15','22','30 abr'] },
    '3months':{ v:[1300,1220,1160,1120,1090,1095,1102,1107], x:['Feb','Mar','Abr'] },
    year:     { v:[1500,1400,1300,1200,1150,1110,1100,1107], x:['Ene','Mar','May','Jul','Sep','Nov'] },
    all:      { v:[800,1000,1200,1350,1300,1200,1150,1107], x:['\'19','\'20','\'21','\'22','\'23','\'24','\'25'] },
  },
  a4: {
    today:    { v:[138,139,140,140,140,140], x:['9h','11h','13h','15h','18h','21h'] },
    week:     { v:[120,125,130,128,133,137,140], x:['L','M','X','J','V','S','D'] },
    month:    { v:[200,185,175,165,155,148,142,140], x:['1','8','15','22','30 abr'] },
    '3months':{ v:[250,220,200,180,165,155,148,140], x:['Feb','Mar','Abr'] },
    year:     { v:[350,300,250,220,190,170,155,140], x:['Ene','Mar','May','Jul','Sep','Nov'] },
    all:      { v:[500,420,350,280,230,185,160,140], x:['\'22','\'23','\'24','\'25'] },
  },
};

const BalanceChart = ({ values, xLabels, color, theme }) => {
  const t = T(theme);
  const YPAD = 52; // left margin for y-axis labels
  const BPAD = 22; // bottom margin for x-axis labels
  const W    = 270; // chart area width
  const H    = 90;  // chart area height
  const totalW = YPAD + W;
  const totalH = H + BPAD;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const toY   = (v) => H - ((v - min) / range) * (H - 10) - 5;
  const toX   = (i) => YPAD + (i / (values.length - 1)) * W;

  // Smooth path
  const pts = values.map((v, i) => [toX(i), toY(v)]);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i-1][0] + pts[i][0]) / 2;
    d += ` C ${cx} ${pts[i-1][1]}, ${cx} ${pts[i][1]}, ${pts[i][0]} ${pts[i][1]}`;
  }
  const area = `${d} L ${pts[pts.length-1][0]} ${H} L ${YPAD} ${H} Z`;

  // Y-axis: 3 grid lines
  const yTicks = [max, (max + min) / 2, min];
  const fmtY   = (v) => v >= 1000
    ? (v / 1000).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'k'
    : Math.round(v).toString();

  // X-axis: show first, middle and last labels at minimum, up to all if ≤6
  const xShow = xLabels.length <= 6
    ? xLabels.map((l, i) => ({ l, x: toX(i) }))
    : [0, Math.floor((values.length - 1) / 2), values.length - 1].map(i => ({ l: xLabels[i], x: toX(i) }));

  const gradId = `bal-${color.replace('#', '')}`;

  return (
    <svg width={totalW} height={totalH} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.28"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Grid lines + Y labels */}
      {yTicks.map((v, i) => {
        const y = toY(v);
        return (
          <g key={i}>
            <line x1={YPAD} y1={y} x2={YPAD + W} y2={y} stroke={t.border} strokeWidth={1} strokeDasharray="3 3"/>
            <text x={YPAD - 6} y={y + 4} textAnchor="end" fontSize="10" fill={t.text2} fontFamily="inherit">
              {fmtY(v)} €
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={area} fill={`url(#${gradId})`}/>

      {/* Line */}
      <path d={d} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Dots at first and last point */}
      {[pts[0], pts[pts.length - 1]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.5} fill={color} stroke={t.bg} strokeWidth={2}/>
      ))}

      {/* X labels */}
      {xShow.map(({ l, x }, i) => (
        <text key={i} x={x} y={H + 16} textAnchor="middle" fontSize="10" fill={t.text2} fontFamily="inherit">{l}</text>
      ))}

      {/* X axis line */}
      <line x1={YPAD} y1={H} x2={YPAD + W} y2={H} stroke={t.borderStrong} strokeWidth={1}/>
    </svg>
  );
};

const PERIODS = [
  { id: 'today',   label: 'Hoy' },
  { id: 'week',    label: 'Esta semana' },
  { id: 'month',   label: 'Este mes' },
  { id: '3months', label: '3 meses' },
  { id: 'year',    label: 'Este año' },
  { id: 'all',     label: 'Todo' },
];

const CopyButton = ({ value, theme }) => {
  const t = T(theme);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div onClick={copy} style={{ padding: '4px 10px', borderRadius: 8, background: copied ? t.positive + '22' : t.surface2, cursor: 'pointer', transition: 'all 0.2s' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: copied ? t.positive : t.text2 }}>
        {copied ? '✓ Copiado' : 'Copiar'}
      </span>
    </div>
  );
};

const PeriodFilterDrawer = ({ theme, open, period, setPeriod, onClose }) => {
  const t = T(theme);
  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 40, background: open ? 'rgba(0,0,0,0.45)' : 'transparent', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.22s', backdropFilter: open ? 'blur(3px)' : 'none' }}/>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 270, zIndex: 41, background: t.bg, boxShadow: '-10px 0 36px rgba(0,0,0,0.3)', transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.28s cubic-bezier(0.32,0.72,0.18,1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px 12px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>Período</div>
          <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: 15, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PelasIcon name="x" size={14} color={t.text2}/>
          </div>
        </div>
        <div style={{ flex: 1, padding: '12px 20px' }}>
          {PERIODS.map(p => (
            <div key={p.id} onClick={() => { setPeriod(p.id); onClose(); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', borderRadius: 14, marginBottom: 6, cursor: 'pointer', background: period === p.id ? t.accentSoft : t.surface, border: `1px solid ${period === p.id ? t.accent : t.border}`, transition: 'all 0.15s' }}>
              <span style={{ fontSize: 14, fontWeight: period === p.id ? 600 : 400, color: period === p.id ? t.accent : t.text }}>{p.label}</span>
              {period === p.id && <PelasIcon name="check" size={15} color={t.accent} strokeWidth={2.5}/>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export const AccountDetailScreen = ({ theme, account, onBack }) => {
  const t = T(theme);
  const [period, setPeriod] = useState('month');
  const [filterOpen, setFilterOpen] = useState(false);
  const [showBanking, setShowBanking] = useState(false);

  const banking = MOCK_BANKING[account.id] || { iban: null, bic: null, holder: PELAS_USER.name, openDate: '—' };
  const accountHistory = MOCK_BALANCE_HISTORY[account.id] || {};
  const historyEntry   = accountHistory[period] || accountHistory['month'] || { v:[100,100], x:['',''] };
  const balanceHistory = historyEntry.v;
  const balanceLabels  = historyEntry.x;
  const periodLabel = PERIODS.find(p => p.id === period)?.label || 'Este mes';

  // Filter transactions for this account
  const txs = PELAS_TRANSACTIONS.filter(tx => tx.account === account.id);
  const income  = txs.filter(tx => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
  const expense = txs.filter(tx => tx.amount < 0).reduce((s, tx) => s + Math.abs(tx.amount), 0);

  const DataRow = ({ label, value, copyable }) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '11px 0', borderBottom: `1px solid ${t.border}` }}>
      <div style={{ fontSize: 12, color: t.text2, width: 90, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13.5, fontWeight: 500, fontFamily: label === 'IBAN' || label === 'BIC' ? 'JetBrains Mono, monospace' : 'inherit', letterSpacing: label === 'IBAN' ? 0.5 : 0 }}>{value || '—'}</div>
      {copyable && value && <CopyButton value={value} theme={theme}/>}
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Header */}
        <PelasHeader theme={theme} title={account.name} onBack={onBack} action={
          <div onClick={() => setFilterOpen(true)} style={{ width: 40, height: 40, borderRadius: 20, background: period !== 'month' ? t.accent : t.surface, border: `1px solid ${period !== 'month' ? t.accent : t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PelasIcon name="filter" size={16} color={period !== 'month' ? '#fff' : t.text}/>
          </div>
        }/>

        <div style={{ padding: '0 22px 32px' }}>

          {/* Account hero card */}
          <div style={{ borderRadius: 22, overflow: 'hidden', marginBottom: 22 }}>
            <div style={{ background: `linear-gradient(135deg, ${account.color}DD, ${account.color}88)`, padding: '22px 22px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PelasIcon name={account.icon} size={22} color="#fff"/>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{account.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{account.bank} · {account.currency ?? 'EUR'}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Saldo disponible</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: -1, marginTop: 2 }}>
                {account.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {account.currency ?? '€'}
              </div>
              {/* Eye — toggle datos bancarios */}
              <div onClick={() => setShowBanking(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, width: 'fit-content', padding: '6px 12px', borderRadius: 100, background: showBanking ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)', cursor: 'pointer', transition: 'background 0.18s' }}>
                <PelasIcon name={showBanking ? 'eye-off' : 'eye'} size={14} color="#fff"/>
                <span style={{ fontSize: 11.5, color: '#fff', fontWeight: 500 }}>{showBanking ? 'Ocultar datos' : 'Ver datos bancarios'}</span>
              </div>
            </div>
          </div>

          {/* Banking data — visible only when the eye is toggled on */}
          {showBanking && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Datos bancarios</div>
              <Card theme={theme} padding={16} radius={18} style={{ marginBottom: 22 }}>
                {banking.iban   && <DataRow label="IBAN"      value={banking.iban} copyable/>}
                {banking.bic    && <DataRow label="BIC/SWIFT" value={banking.bic}  copyable/>}
                <DataRow label="Titular" value={banking.holder}/>
                <DataRow label="Tipo"    value={account.type === 'cash' ? 'Efectivo' : account.type === 'investment' ? 'Inversión' : 'Cuenta bancaria'}/>
                <DataRow label="Divisa"  value={account.currency ?? 'EUR'}/>
                <div style={{ display: 'flex', alignItems: 'center', padding: '11px 0' }}>
                  <div style={{ fontSize: 12, color: t.text2, width: 90, flexShrink: 0 }}>Alta</div>
                  <div style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{banking.openDate}</div>
                </div>
              </Card>
            </>
          )}

          {/* Period filter chip */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6 }}>Estadísticas</div>
            <div onClick={() => setFilterOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 100, background: t.accentSoft, cursor: 'pointer' }}>
              <PelasIcon name="filter" size={11} color={t.accent}/>
              <span style={{ fontSize: 11.5, color: t.accent, fontWeight: 600 }}>{periodLabel}</span>
            </div>
          </div>

          {/* Stats 3-column */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            <Card theme={theme} padding={14} radius={16} style={{ flex: 1 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: 'rgba(63,185,132,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <PelasIcon name="arrow-down" size={13} color={t.positive} strokeWidth={2.4}/>
              </div>
              <div style={{ fontSize: 10, color: t.text2, marginBottom: 3 }}>Ingresos</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.positive }}>+{income.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
            </Card>
            <Card theme={theme} padding={14} radius={16} style={{ flex: 1 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: 'rgba(225,99,100,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <PelasIcon name="arrow-up" size={13} color={t.negative} strokeWidth={2.4}/>
              </div>
              <div style={{ fontSize: 10, color: t.text2, marginBottom: 3 }}>Gastos</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.negative }}>-{expense.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
            </Card>
            <Card theme={theme} padding={14} radius={16} style={{ flex: 1 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: t.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <PelasIcon name="wallet" size={13} color={t.accent}/>
              </div>
              <div style={{ fontSize: 10, color: t.text2, marginBottom: 3 }}>Movimientos</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{txs.length}</div>
            </Card>
          </div>

          {/* Balance evolution chart */}
          <div style={{ fontSize: 11, fontWeight: 600, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Evolución del saldo</div>
          <Card theme={theme} padding={18} radius={18} style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: t.text2 }}>Saldo actual</div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6 }}>
                  {account.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                </div>
              </div>
              {(() => {
                const first = balanceHistory[0];
                const last  = balanceHistory[balanceHistory.length - 1];
                const diff  = last - first;
                const pct   = first > 0 ? ((diff / first) * 100).toFixed(1) : '0.0';
                const up    = diff >= 0;
                return (
                  <div style={{ background: up ? 'rgba(63,185,132,0.16)' : 'rgba(225,99,100,0.16)', color: up ? t.positive : t.negative, fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 8 }}>
                    {up ? '↑' : '↓'} {Math.abs(pct)}%
                  </div>
                );
              })()}
            </div>
            <div style={{ marginLeft: -4, marginTop: 8 }}>
              <BalanceChart values={balanceHistory} xLabels={balanceLabels} color={account.color} theme={theme}/>
            </div>
          </Card>

          {/* Transactions */}
          {txs.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.text2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Últimos movimientos</div>
              <Card theme={theme} padding={14} radius={18}>
                {txs.map((tx, i) => {
                  const cat = PELAS_CATEGORIES.find(c => c.id === tx.cat);
                  const positive = tx.amount >= 0;
                  return (
                    <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < txs.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: (positive ? t.positive : (cat?.color || t.accent)) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <PelasIcon name={positive ? 'arrow-down' : (cat?.icon || 'card')} size={16} color={positive ? t.positive : (cat?.color || t.accent)}/>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{tx.name}</div>
                        <div style={{ fontSize: 11, color: t.text2, marginTop: 1 }}>{tx.sub} · {tx.date}</div>
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: positive ? t.positive : t.text }}>
                        {positive ? '+' : '−'}{Math.abs(tx.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                      </div>
                    </div>
                  );
                })}
              </Card>
            </>
          )}
          {txs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: t.text2, fontSize: 13 }}>Sin movimientos en esta cuenta</div>
          )}
        </div>
      </div>

      <PeriodFilterDrawer theme={theme} open={filterOpen} period={period} setPeriod={setPeriod} onClose={() => setFilterOpen(false)}/>
    </div>
  );
};
