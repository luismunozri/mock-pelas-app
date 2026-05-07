import { PelasIcon } from './icons';
import { T } from './theme';

export const PelasFrame = ({ children, theme = 'dark', tabBar, hideStatus = false, statusBg, landscape = false }) => {
  const t = T(theme);
  const W = landscape ? 740 : 390;
  const H = landscape ? 370 : 820;
  return (
    <div style={{
      width: W, height: H,
      borderRadius: landscape ? 48 : 44,
      background: t.bg,
      border: `9px solid ${theme === 'dark' ? '#0a0a12' : '#d3d6dd'}`,
      boxShadow: `0 ${landscape ? 24 : 40}px ${landscape ? 60 : 100}px rgba(0,0,0,${theme === 'dark' ? 0.55 : 0.18}), 0 0 0 2px ${theme === 'dark' ? '#1a1a25' : '#bcc0cb'}`,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
      fontFamily: 'Poppins, system-ui, sans-serif',
      color: t.text,
      transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1), height 0.4s cubic-bezier(0.4,0,0.2,1), border-radius 0.4s ease',
    }}>
      {/* Portrait status bar */}
      {!hideStatus && !landscape && (
        <div style={{
          height: 36, padding: '0 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: t.text, fontSize: 13, fontWeight: 600, fontFamily: 'Inter',
          background: statusBg || 'transparent',
          flexShrink: 0,
        }}>
          <div>9:41</div>
          <div style={{ position: 'absolute', left: '50%', top: 8, transform: 'translateX(-50%)', width: 22, height: 22, borderRadius: 11, background: '#0a0a10' }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="14" height="10" viewBox="0 0 14 10" fill={t.text}><rect x="0" y="7" width="2" height="3" rx="0.5"/><rect x="3" y="5" width="2" height="5" rx="0.5"/><rect x="6" y="3" width="2" height="7" rx="0.5"/><rect x="9" y="0" width="2" height="10" rx="0.5"/></svg>
            <svg width="14" height="10" viewBox="0 0 14 10" fill={t.text}><path d="M7 1.5a8 8 0 0 1 6.5 3.2L12 6a6 6 0 0 0-10 0L0.5 4.7A8 8 0 0 1 7 1.5z"/><path d="M7 5a4 4 0 0 1 3 1.4L8.6 7.6a2 2 0 0 0-3.2 0L4 6.4A4 4 0 0 1 7 5z"/><circle cx="7" cy="9" r="1"/></svg>
            <svg width="22" height="10" viewBox="0 0 22 10"><rect x="0.5" y="0.5" width="18" height="9" rx="2" fill="none" stroke={t.text} opacity="0.5"/><rect x="2" y="2" width="15" height="6" rx="1" fill={t.text}/><rect x="19" y="3" width="2" height="4" rx="0.6" fill={t.text} opacity="0.5"/></svg>
          </div>
        </div>
      )}
      {/* Landscape status bar */}
      {!hideStatus && landscape && (
        <div style={{
          height: 28, padding: '0 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: t.text, fontSize: 11, fontWeight: 600, fontFamily: 'Inter',
          background: statusBg || 'transparent',
          flexShrink: 0,
        }}>
          <div>9:41</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="14" height="10" viewBox="0 0 14 10" fill={t.text}><rect x="0" y="7" width="2" height="3" rx="0.5"/><rect x="3" y="5" width="2" height="5" rx="0.5"/><rect x="6" y="3" width="2" height="7" rx="0.5"/><rect x="9" y="0" width="2" height="10" rx="0.5"/></svg>
            <svg width="22" height="10" viewBox="0 0 22 10"><rect x="0.5" y="0.5" width="18" height="9" rx="2" fill="none" stroke={t.text} opacity="0.5"/><rect x="2" y="2" width="15" height="6" rx="1" fill={t.text}/><rect x="19" y="3" width="2" height="4" rx="0.6" fill={t.text} opacity="0.5"/></svg>
          </div>
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </div>
      {tabBar}
      <div style={{ height: landscape ? 14 : 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: tabBar ? (theme === 'dark' ? '#1A1A28' : '#ffffff') : 'transparent', flexShrink: 0 }}>
        <div style={{ width: landscape ? 80 : 120, height: 4, borderRadius: 2, background: t.text, opacity: 0.32 }}/>
      </div>
    </div>
  );
};

export const PelasTabBar = ({ theme, active, onChange }) => {
  const t = T(theme);
  const tabs = [
    { id: 'home',   icon: 'home',    label: 'Inicio' },
    { id: 'stats',  icon: 'chart',   label: 'Stats' },
    { id: 'add',    icon: 'plus',    label: '' },
    { id: 'tx',     icon: 'wallet',  label: 'Movs' },
    { id: 'invest', icon: 'trending',label: 'Inversiones' },
  ];
  return (
    <div style={{ background: theme === 'dark' ? '#1A1A28' : '#ffffff', borderTop: `1px solid ${t.border}`, padding: '8px 8px 6px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexShrink: 0, position: 'relative' }}>
      {tabs.map(tab => {
        const isActive = active === tab.id;
        if (tab.id === 'add') {
          return (
            <div key={tab.id} onClick={() => onChange(tab.id)} style={{ width: 56, height: 56, borderRadius: 28, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -22, cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,102,255,0.4)' }}>
              <PelasIcon name="plus" size={26} color="#fff" strokeWidth={2.4}/>
            </div>
          );
        }
        return (
          <div key={tab.id} onClick={() => onChange(tab.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 12px', cursor: 'pointer', minWidth: 56 }}>
            <PelasIcon name={tab.icon} size={22} color={isActive ? t.accent : t.text2} strokeWidth={isActive ? 2 : 1.6}/>
            <div style={{ fontSize: 10, color: isActive ? t.accent : t.text2, fontWeight: isActive ? 600 : 400 }}>{tab.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export const PelasHeader = ({ theme, title, onBack, action, subtitle }) => {
  const t = T(theme);
  return (
    <div style={{ padding: '8px 22px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
      {onBack && (
        <div onClick={onBack} style={{ width: 40, height: 40, borderRadius: 20, background: t.surface2, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <PelasIcon name="arrow-left" size={18} color={t.text}/>
        </div>
      )}
      <div style={{ flex: 1, textAlign: onBack ? 'center' : 'left' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: t.text2 }}>{subtitle}</div>}
      </div>
      {action || (onBack && <div style={{ width: 40 }}/>)}
    </div>
  );
};
