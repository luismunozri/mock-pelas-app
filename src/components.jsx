import { useId } from 'react';
import { PelasIcon } from './icons';
import { T } from './theme';

export { T };

export const Card = ({ theme, style, children, onClick, padding = 16, radius = 20 }) => {
  const t = T(theme);
  return (
    <div onClick={onClick} style={{ background: t.surface, borderRadius: radius, padding, border: `1px solid ${t.border}`, ...style }}>
      {children}
    </div>
  );
};

export const PrimaryButton = ({ children, onClick, full, style, variant = 'primary', theme = 'dark' }) => {
  const t = T(theme);
  const styles = {
    primary:   { background: t.accent, color: '#fff' },
    secondary: { background: t.surface2, color: t.text, border: `1px solid ${t.border}` },
    ghost:     { background: 'transparent', color: t.accent },
  }[variant];
  return (
    <button onClick={onClick} style={{
      width: full ? '100%' : 'auto',
      height: 56, borderRadius: 28, border: 'none',
      fontFamily: 'inherit', fontSize: 15, fontWeight: 500, letterSpacing: 0.2,
      cursor: 'pointer', transition: 'transform 0.08s, opacity 0.15s',
      padding: '0 28px',
      ...styles, ...style,
    }}
    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >{children}</button>
  );
};

export const TextField = ({ theme, label, value, onChange, placeholder, type = 'text', icon, suffix }) => {
  const t = T(theme);
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={{ fontSize: 12, color: t.text2, marginBottom: 8, fontWeight: 500 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 16, padding: '0 16px', height: 56 }}>
        {icon && <PelasIcon name={icon} size={20} color={t.text2} />}
        <input type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: 'inherit', fontSize: 15 }} />
        {suffix}
      </div>
    </div>
  );
};

export const IconCircle = ({ icon, color, bg, size = 42, theme = 'dark', emoji, image }) => {
  const t = T(theme);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg || t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundImage: image ? `url(${image})` : undefined, backgroundSize: 'cover' }}>
      {!image && (emoji
        ? <span style={{ fontSize: size * 0.45 }}>{emoji}</span>
        : <PelasIcon name={icon} size={size * 0.46} color={color || t.text} />
      )}
    </div>
  );
};

export const SectionTitle = ({ theme, title, action, onAction }) => {
  const t = T(theme);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 14px' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>{title}</div>
      {action && <div onClick={onAction} style={{ fontSize: 13, color: t.accent, fontWeight: 500, cursor: 'pointer' }}>{action}</div>}
    </div>
  );
};

export const TxRow = ({ theme, tx, cat, onClick }) => {
  const t = T(theme);
  const positive = tx.amount >= 0;
  const isIncome = tx.cat === 'income';
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', cursor: 'pointer' }}>
      <IconCircle theme={theme} icon={isIncome ? 'arrow-down' : (cat?.icon || 'card')} color={isIncome ? t.positive : (cat?.color || t.accent)} bg={t.surface2} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 500, color: t.text, marginBottom: 2 }}>{tx.name}</div>
        <div style={{ fontSize: 11.5, color: t.text2 }}>{tx.sub} · {tx.time}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: positive ? t.positive : t.text }}>
          {positive ? '+' : '−'}{Math.abs(tx.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
        </div>
        <div style={{ fontSize: 11, color: t.text3 }}>{tx.card?.replace('Pelas ', '')}</div>
      </div>
    </div>
  );
};

export const Progress = ({ value = 0, color = '#0066FF', track = '#23253355', height = 6 }) => (
  <div style={{ width: '100%', height, background: track, borderRadius: height, overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(100, value)}%`, height: '100%', background: color, borderRadius: height, transition: 'width 0.4s ease' }} />
  </div>
);

export const Sparkline = ({ data, color = '#0066FF', width = 280, height = 80, fill = true }) => {
  const uid = useId().replace(/:/g, '');
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => [i * stepX, height - ((v - min) / range) * (height - 6) - 3]);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  const gradId = `spark-${uid}`;
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.32 }}/>
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }}/>
        </linearGradient>
      </defs>
      {fill && <path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill={`url(#${gradId})`} />}
      <path d={d} style={{ stroke: color }} strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
};

export const BarChart = ({ theme, data, height = 140, accent = '#0066FF', highlight }) => {
  const t = T(theme);
  const hi = highlight ?? (data?.length - 1);
  const max = Math.max(...data.map(d => d.v));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: height + 22 }}>
      {data.map((d, i) => {
        const h = (d.v / max) * height;
        const isHigh = i === hi;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: '70%', height: h, background: isHigh ? accent : t.surface2, borderRadius: 6, border: isHigh ? 'none' : `1px solid ${t.border}`, transition: 'height 0.5s' }} />
            <div style={{ fontSize: 11, color: isHigh ? t.text : t.text2, fontWeight: isHigh ? 600 : 400 }}>{d.m}</div>
          </div>
        );
      })}
    </div>
  );
};

export const Donut = ({ data, size = 160, thickness = 18, theme }) => {
  const t = T(theme);
  const total = data.reduce((s, d) => s + d.v, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={t.surface2} strokeWidth={thickness} />
      {data.map((d, i) => {
        const len = (d.v / total) * c;
        const off = c - acc;
        acc += len;
        return (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={d.color} strokeWidth={thickness}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={off}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
};

export const CreditCard = ({ card, width = 320, height = 195, theme }) => {
  const meshes = {
    'mesh-blue':   'radial-gradient(120% 80% at 100% 0%, #1E3FFF 0%, #0044CC 38%, #001A66 100%)',
    'mesh-night':  'radial-gradient(120% 80% at 0% 100%, #2E2E5F 0%, #1A1A2E 50%, #0E0E1A 100%)',
    'mesh-purple': 'radial-gradient(120% 80% at 100% 0%, #9B5CFF 0%, #6332C8 38%, #2D1066 100%)',
    'mesh-gold':   'radial-gradient(120% 80% at 100% 0%, #C9A227 0%, #8B6D14 38%, #4A3800 100%)',
    'mesh-green':  'radial-gradient(120% 80% at 0% 0%, #1DBF7B 0%, #0D8A56 38%, #054830 100%)',
    'mesh-rose':   'radial-gradient(120% 80% at 100% 0%, #FF5A7E 0%, #CC2250 38%, #7A0028 100%)',
  };
  return (
    <div style={{ width, height, borderRadius: 22, padding: 22, background: meshes[card.color] || meshes['mesh-blue'], color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,30,100,0.35)', flexShrink: 0 }}>
      <div style={{ position: 'absolute', right: -40, bottom: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(2px)' }}/>
      <div style={{ position: 'absolute', left: -30, top: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}/>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 400 }}>{card.bank}</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{card.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
        </div>
        <PelasIcon name="wifi-pay" size={22} color="#fff"/>
      </div>
      <div style={{ position: 'absolute', left: 22, top: 88 }}>
        <PelasIcon name="chip" size={28} color="#FFD27A"/>
      </div>
      <div style={{ position: 'absolute', left: 22, right: 22, bottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 9, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase' }}>Titular</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{card.holder}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase' }}>Caduca</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{card.expiry}</div>
          </div>
          <div style={{ marginLeft: 8 }}>
            {card.type === 'visa' ? <PelasIcon name="visa" size={14} color="#fff"/> : <PelasIcon name="mc" size={20}/>}
          </div>
        </div>
        <div style={{ fontSize: 14, letterSpacing: 4, fontWeight: 500, opacity: 0.85, marginTop: -6 }}>
          •••• •••• •••• {card.last4}
        </div>
      </div>
    </div>
  );
};

export const TabBar = ({ theme, tabs, active, onChange }) => {
  const t = T(theme);
  return (
    <div style={{ display: 'flex', gap: 8, padding: 4, background: t.surface2, borderRadius: 16, border: `1px solid ${t.border}` }}>
      {tabs.map(tab => (
        <div key={tab} onClick={() => onChange(tab)} style={{
          flex: 1, textAlign: 'center', padding: '8px 0',
          fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
          borderRadius: 12,
          background: active === tab ? t.accent : 'transparent',
          color: active === tab ? '#fff' : t.text2,
          transition: 'all 0.18s',
        }}>{tab}</div>
      ))}
    </div>
  );
};
