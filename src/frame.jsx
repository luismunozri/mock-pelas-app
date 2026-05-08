import { useState } from 'react';
import { PelasIcon } from './icons';
import { T } from './theme';

const StatusIcons = ({ color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
    <svg width="14" height="10" viewBox="0 0 14 10" fill={color}><rect x="0" y="7" width="2" height="3" rx="0.5"/><rect x="3" y="5" width="2" height="5" rx="0.5"/><rect x="6" y="3" width="2" height="7" rx="0.5"/><rect x="9" y="0" width="2" height="10" rx="0.5"/></svg>
    <svg width="14" height="10" viewBox="0 0 14 10" fill={color}><path d="M7 1.5a8 8 0 0 1 6.5 3.2L12 6a6 6 0 0 0-10 0L0.5 4.7A8 8 0 0 1 7 1.5z"/><path d="M7 5a4 4 0 0 1 3 1.4L8.6 7.6a2 2 0 0 0-3.2 0L4 6.4A4 4 0 0 1 7 5z"/><circle cx="7" cy="9" r="1"/></svg>
    <svg width="22" height="10" viewBox="0 0 22 10"><rect x="0.5" y="0.5" width="18" height="9" rx="2" fill="none" stroke={color} opacity="0.5"/><rect x="2" y="2" width="15" height="6" rx="1" fill={color}/><rect x="19" y="3" width="2" height="4" rx="0.6" fill={color} opacity="0.5"/></svg>
  </div>
);

export const PelasTabSidebar = ({ theme, active, onChange }) => {
  const t = T(theme);
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: 'home',   icon: 'home',     label: 'Inicio' },
    { id: 'stats',  icon: 'chart',    label: 'Estadísticas' },
    { id: 'tx',     icon: 'wallet',   label: 'Movimientos' },
    { id: 'invest', icon: 'trending', label: 'Inversiones' },
  ];

  const W = collapsed ? 54 : 200;

  return (
    <div style={{
      width: W, flexShrink: 0, height: '100%',
      background: theme === 'dark' ? '#0f0f1c' : '#f5f6fa',
      borderRight: `1px solid ${t.border}`,
      display: 'flex', flexDirection: 'column',
      padding: collapsed ? '14px 6px' : '14px 10px',
      overflowY: 'auto', overflowX: 'hidden',
      transition: 'width 0.26s cubic-bezier(0.4,0,0.2,1), padding 0.26s ease',
    }}>

      {/* Brand row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 8, padding: collapsed ? '6px 0' : '6px 8px', marginBottom: 6 }}>
        <PelasIcon name="pelas" size={18} color={t.accent} strokeWidth={2.6}/>
        {!collapsed && (
          <>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: t.text, letterSpacing: -0.3, whiteSpace: 'nowrap', overflow: 'hidden' }}>Pelas</div>
            <div onClick={() => setCollapsed(true)} title="Reducir" style={{ width: 24, height: 24, borderRadius: 7, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s' }}>
              <PelasIcon name="arrow-left" size={12} color={t.text2}/>
            </div>
          </>
        )}
      </div>

      {/* Expand button (collapsed mode only) */}
      {collapsed && (
        <div onClick={() => setCollapsed(false)} title="Expandir" style={{ width: 32, height: 32, borderRadius: 10, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: '4px auto 10px', transition: 'background 0.15s' }}>
          <PelasIcon name="arrow-right" size={13} color={t.text2}/>
        </div>
      )}

      {/* Section label */}
      {!collapsed && <div style={{ fontSize: 9, color: t.text3, fontWeight: 700, letterSpacing: 0.9, textTransform: 'uppercase', paddingLeft: 10, marginBottom: 4, marginTop: 4 }}>Menú</div>}

      {/* Nav items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {navItems.map(item => {
          const isActive = active === item.id;
          return (
            <div key={item.id} onClick={() => onChange(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, padding: collapsed ? '10px 0' : '10px 12px', borderRadius: 12, cursor: 'pointer', background: isActive ? t.accent + '18' : 'transparent', justifyContent: collapsed ? 'center' : 'flex-start', transition: 'background 0.15s' }}>
              <PelasIcon name={item.icon} size={17} color={isActive ? t.accent : t.text2} strokeWidth={isActive ? 2 : 1.6}/>
              {!collapsed && <div style={{ flex: 1, fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? t.accent : t.text, whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.label}</div>}
              {!collapsed && isActive && <div style={{ width: 6, height: 6, borderRadius: 3, background: t.accent, flexShrink: 0 }}/>}
            </div>
          );
        })}
      </div>

      {/* Add button */}
      <div onClick={() => onChange('add')}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: collapsed ? 0 : 8, padding: collapsed ? '10px 0' : '12px 14px', borderRadius: 14, cursor: 'pointer', background: t.accent, marginBottom: 8 }}>
        <PelasIcon name="plus" size={16} color="#fff" strokeWidth={2.4}/>
        {!collapsed && <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Añadir</div>}
      </div>

      {/* Profile chip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: collapsed ? 0 : 8, padding: collapsed ? '8px 0' : '9px 10px', borderRadius: 12, background: t.surface2, cursor: 'pointer' }}>
        <div style={{ width: 26, height: 26, borderRadius: 13, background: 'linear-gradient(135deg,#0066FF,#7C5CFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9.5, fontWeight: 700, flexShrink: 0 }}>MB</div>
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Marta Bayón</div>
              <div style={{ fontSize: 9.5, color: t.accent, fontWeight: 600 }}>PRO</div>
            </div>
            <PelasIcon name="more" size={13} color={t.text2}/>
          </>
        )}
      </div>
    </div>
  );
};

export const PelasFrame = ({ children, theme = 'dark', tabBar, sidebar, hideStatus = false, statusBg, landscape = false, tablet = false }) => {
  const t = T(theme);
  const isTablet = tablet && !landscape;
  const W = landscape ? 740 : isTablet ? 960 : 390;
  const H = landscape ? 370 : isTablet ? 540 : 820;
  const radius = landscape ? 48 : isTablet ? 20 : 44;
  const borderW = isTablet ? 11 : 9;

  return (
    <div style={{
      width: W, height: H, borderRadius: radius, background: t.bg,
      border: `${borderW}px solid ${theme === 'dark' ? '#0a0a12' : '#d3d6dd'}`,
      boxShadow: `0 ${landscape ? 24 : 40}px ${landscape ? 60 : 100}px rgba(0,0,0,${theme === 'dark' ? 0.55 : 0.18}), 0 0 0 2px ${theme === 'dark' ? '#1a1a25' : '#bcc0cb'}`,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      position: 'relative', fontFamily: 'inherit', color: t.text,
      transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1), height 0.45s cubic-bezier(0.4,0,0.2,1), border-radius 0.45s ease',
    }}>
      {/* Status bar */}
      {!hideStatus && (
        <div style={{
          height: isTablet ? 30 : landscape ? 28 : 36,
          padding: `0 ${landscape ? 28 : 22}px`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: t.text, fontSize: isTablet ? 12 : landscape ? 11 : 13, fontWeight: 600, fontFamily: 'Inter',
          background: statusBg || 'transparent', flexShrink: 0, position: 'relative',
        }}>
          <div>9:41</div>
          {/* Phone notch */}
          {!landscape && !isTablet && <div style={{ position: 'absolute', left: '50%', top: 8, transform: 'translateX(-50%)', width: 22, height: 22, borderRadius: 11, background: '#0a0a10' }}/>}
          {/* Tablet front camera */}
          {isTablet && <div style={{ position: 'absolute', top: 9, right: 22, width: 9, height: 9, borderRadius: 5, background: '#0c0c18' }}/>}
          <StatusIcons color={t.text}/>
        </div>
      )}

      {/* Content area */}
      {isTablet ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
          {sidebar}
          <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      )}

      {/* Phone tab bar */}
      {!isTablet && tabBar}

      {/* Home indicator */}
      <div style={{ height: isTablet ? 18 : landscape ? 14 : 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: (!isTablet && tabBar) ? (theme === 'dark' ? '#1A1A28' : '#ffffff') : 'transparent', flexShrink: 0 }}>
        <div style={{ width: isTablet ? 100 : landscape ? 80 : 120, height: 4, borderRadius: 2, background: t.text, opacity: 0.32 }}/>
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
