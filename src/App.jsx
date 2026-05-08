import { useState, useEffect } from 'react';
import { PelasFrame, PelasTabBar, PelasTabSidebar } from './frame';
import { PelasIcon } from './icons';
import { T } from './theme';
import { OnboardingScreen, SignInScreen, SignUpScreen } from './screens/auth';
import { HomeScreen } from './screens/home';
import { StatsDetailScreen, StatsScreen } from './screens/stats';
import { HistoryScreen, TxDetailScreen, ProfileScreen, CategoriesScreen, BudgetsScreen, GoalsScreen, SearchScreen, NotificationsScreen, CategoryDetailScreen, ThemeStyleScreen, PersonalDataScreen, SecurityScreen, ProfileCategoriesScreen, NotificationSettingsScreen, LanguageScreen, ExportDataScreen, ImportDataScreen, CloudBackupScreen, FamilyGroupScreen } from './screens/other';
import { AddTransactionSheet, InvestmentsScreen } from './screens/extra';
import { AccountsScreen, AccountDetailScreen } from './screens/accounts';
import { CardsScreen } from './screens/cards';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [deviceMode, setDeviceMode] = useState('phone');
  const [route, setRoute] = useState({ name: 'onboarding', step: 0 });
  const [familyGroup, setFamilyGroup] = useState({
    group: { name: 'Familia Bayón' },
    members: [
      { id: 'u0',  name: 'Marta Bayón',  email: 'marta.bayon@correo.es',  role: 'admin',  status: 'active',  color: '#0066FF' },
      { id: 'u1',  name: 'Carlos Bayón', email: 'carlos.bayon@correo.es', role: 'member', status: 'active',  color: '#7C5CFF' },
      { id: 'u2',  name: 'Ana Bayón',    email: 'ana.bayon@correo.es',    role: 'member', status: 'active',  color: '#3FB984' },
      { id: 'u3',  name: 'Luis Bayón',   email: 'luis.bayon@correo.es',   role: 'member', status: 'pending', color: '#FF8A4C' },
    ],
  });
  const [tab, setTab] = useState('home');
  const [showAddSheet, setShowAddSheet] = useState(false);

  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('pelas-accent') || '#0066FF');
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('pelas-font') || "'Poppins', sans-serif");

  useEffect(() => {
    document.body.className = theme === 'light' ? 'theme-light' : '';
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('pelas-accent', accentColor);
    localStorage.setItem('pelas-font', fontFamily);

    const root = document.documentElement;
    root.style.setProperty('--pelas-accent', accentColor);
    root.style.setProperty('--pelas-font', fontFamily);

    // Convert hex to RGB
    let r = 0, g = 0, b = 0;
    if (accentColor.length === 7) {
      r = parseInt(accentColor.substring(1, 3), 16);
      g = parseInt(accentColor.substring(3, 5), 16);
      b = parseInt(accentColor.substring(5, 7), 16);
    }
    root.style.setProperty('--pelas-accent-rgb', `${r}, ${g}, ${b}`);
  }, [accentColor, fontFamily]);

  const navigate = (name, params = {}) => setRoute({ name, ...params });

  const handleTabChange = (newTab) => {
    if (newTab === 'add') { setShowAddSheet(true); return; }
    setTab(newTab);
  };

  const t = T(theme);

  const renderScreen = () => {
    if (route.name === 'onboarding') {
      return <OnboardingScreen theme={theme} step={route.step || 0}
        onNext={() => {
          if ((route.step || 0) < 2) setRoute({ name: 'onboarding', step: (route.step || 0) + 1 });
          else setRoute({ name: 'signin' });
        }}
        onSkip={() => setRoute({ name: 'signin' })}/>;
    }
    if (route.name === 'signin')   return <SignInScreen theme={theme} onSubmit={() => { setTab('home'); setRoute({ name: 'main' }); }} onSignUp={() => setRoute({ name: 'signup' })}/>;
    if (route.name === 'signup')   return <SignUpScreen theme={theme} onSubmit={() => { setTab('home'); setRoute({ name: 'main' }); }} onSignIn={() => setRoute({ name: 'signin' })}/>;
    if (route.name === 'tx-detail')    return <TxDetailScreen theme={theme} tx={route.tx} onBack={() => setRoute({ name: 'main' })} onNavigate={navigate}/>;
    if (route.name === 'history')      return <HistoryScreen theme={theme} onBack={() => setRoute({ name: 'main' })} onNavigate={navigate} initialFilters={route.filters} initialMonthIdx={route.monthIdx}/>;
    if (route.name === 'categories')   return <CategoriesScreen theme={theme} onBack={() => setRoute({ name: 'main' })} onNavigate={navigate}/>;
    if (route.name === 'budgets')      return <BudgetsScreen theme={theme} onBack={() => setRoute({ name: 'main' })} onNavigate={navigate}/>;
    if (route.name === 'goals')        return <GoalsScreen theme={theme} onBack={() => setRoute({ name: 'main' })} onNavigate={navigate}/>;
    if (route.name === 'search')       return <SearchScreen theme={theme} onBack={() => setRoute({ name: 'main' })} onNavigate={navigate}/>;
    if (route.name === 'notifications')return <NotificationsScreen theme={theme} onBack={() => setRoute({ name: 'main' })}/>;
    if (route.name === 'category')     return <CategoryDetailScreen theme={theme} cat={route.cat} onBack={() => setRoute({ name: 'main' })} onNavigate={navigate}/>;
    if (route.name === 'profile')               return <ProfileScreen theme={theme} onBack={() => setRoute({ name: 'main' })} onNavigate={navigate} setTheme={setTheme}/>;
    if (route.name === 'theme-style')           return <ThemeStyleScreen theme={theme} accentColor={accentColor} setAccentColor={setAccentColor} fontFamily={fontFamily} setFontFamily={setFontFamily} onBack={() => setRoute({ name: 'profile' })}/>;
    if (route.name === 'personal-data')         return <PersonalDataScreen theme={theme} onBack={() => setRoute({ name: 'profile' })}/>;
    if (route.name === 'security')              return <SecurityScreen theme={theme} onBack={() => setRoute({ name: 'profile' })}/>;
    if (route.name === 'profile-categories')    return <ProfileCategoriesScreen theme={theme} onBack={() => setRoute({ name: 'profile' })}/>;
    if (route.name === 'notification-settings') return <NotificationSettingsScreen theme={theme} onBack={() => setRoute({ name: 'profile' })}/>;
    if (route.name === 'language')              return <LanguageScreen theme={theme} onBack={() => setRoute({ name: 'profile' })}/>;
    if (route.name === 'family-group')          return <FamilyGroupScreen theme={theme} onBack={() => setRoute({ name: 'profile' })} familyGroup={familyGroup} setFamilyGroup={setFamilyGroup}/>;
    if (route.name === 'export-data')           return <ExportDataScreen theme={theme} onBack={() => setRoute({ name: 'profile' })}/>;
    if (route.name === 'import-data')           return <ImportDataScreen theme={theme} onBack={() => setRoute({ name: 'profile' })}/>;
    if (route.name === 'cloud-backup')          return <CloudBackupScreen theme={theme} onBack={() => setRoute({ name: 'profile' })}/>;
    if (route.name === 'accounts')        return <AccountsScreen theme={theme} onBack={() => setRoute({ name: 'main' })} onNavigate={navigate} initialFilters={route.filters} familyGroup={familyGroup}/>;
    if (route.name === 'account-detail')  return <AccountDetailScreen theme={theme} account={route.account} onBack={() => setRoute({ name: 'accounts' })}/>;
    if (route.name === 'cards')           return <CardsScreen theme={theme} onBack={() => setRoute({ name: 'main' })}/>;
    if (route.name === 'stats-detail')    return <StatsDetailScreen theme={theme} widgetId={route.widgetId} onBack={() => { setTab('stats'); setRoute({ name: 'main' }); }} onNavigate={navigate}/>;


    if (tab === 'home')   return <HomeScreen theme={theme} onNavigate={navigate} tablet={deviceMode === 'tablet'} tabletVertical={deviceMode === 'tablet-v'} familyGroup={familyGroup}/>;
    if (tab === 'stats')  return <StatsScreen theme={theme} onNavigate={navigate} tablet={deviceMode === 'tablet'} tabletVertical={deviceMode === 'tablet-v'}/>;
    if (tab === 'tx')     return <HistoryScreen theme={theme} onNavigate={navigate} onBack={() => setTab('home')}/>;
    if (tab === 'invest') return <InvestmentsScreen theme={theme} onNavigate={navigate}/>;
    return null;
  };

  const inMain = route.name === 'main' && ['home','stats','tx','invest'].includes(tab);
  const isTablet = deviceMode === 'tablet' || deviceMode === 'tablet-v';
  const isLandscape = !isTablet && route.name === 'stats-detail' && route.widgetId === 'stats-evolution';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      padding: 28, gap: 16,
      background: theme === 'dark'
        ? 'radial-gradient(80% 60% at 50% 0%, #15182a 0%, #0a0a12 50%, #07070d 100%)'
        : 'radial-gradient(80% 60% at 50% 0%, #ffffff 0%, #eef1f7 50%, #dde2eb 100%)',
    }}>
      <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <PelasIcon name="pelas" size={26} color={theme === 'dark' ? '#fff' : '#1E1E2D'} strokeWidth={2.6}/>
          <div style={{ fontSize: 22, fontWeight: 600, color: theme === 'dark' ? '#fff' : '#1E1E2D', letterSpacing: -0.4 }}>Pelas</div>
        </div>
        <div style={{ fontSize: 12, color: '#7E848D', marginTop: 4 }}>Tu app de finanzas personales · prototipo navegable</div>
      </div>

      <PelasFrame
        theme={theme}
        tablet={deviceMode === 'tablet'}
        tabletVertical={deviceMode === 'tablet-v'}
        landscape={isLandscape}
        tabBar={!isTablet && inMain ? <PelasTabBar theme={theme} active={tab} onChange={handleTabChange}/> : null}
        sidebar={isTablet && inMain ? <PelasTabSidebar theme={theme} active={tab} onChange={handleTabChange}/> : null}
      >
        {renderScreen()}
        {showAddSheet && <AddTransactionSheet theme={theme} onClose={() => setShowAddSheet(false)}/>}
      </PelasFrame>

      {/* Quick nav buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 460, marginTop: 8 }}>
        {[
          ['Onboarding', () => setRoute({ name: 'onboarding', step: 0 })],
          ['Sign In',    () => setRoute({ name: 'signin' })],
          ['Sign Up',    () => setRoute({ name: 'signup' })],
          ['Home',       () => { setTab('home');   setRoute({ name: 'main' }); }],
          ['Stats',      () => { setTab('stats');  setRoute({ name: 'main' }); }],
          ['Movs',       () => { setTab('tx');     setRoute({ name: 'main' }); }],
          ['Inversiones',() => { setTab('invest'); setRoute({ name: 'main' }); }],
          ['Perfil',     () => setRoute({ name: 'profile' })],
          ['+ Añadir',   () => setShowAddSheet(true)],
          ['Buscar',     () => setRoute({ name: 'search' })],
          ['Cuentas',     () => setRoute({ name: 'accounts' })],
          ['Tarjetas',    () => setRoute({ name: 'cards' })],
          ['Presupuestos',() => setRoute({ name: 'budgets' })],
          ['Metas',       () => setRoute({ name: 'goals' })],
          ['Notificaciones',() => setRoute({ name: 'notifications' })],
        ].map(([label, fn]) => (
          <div key={label} onClick={fn} style={{
            padding: '6px 12px', fontSize: 11.5,
            background: theme === 'dark' ? '#1E1E2D' : '#fff',
            color: theme === 'dark' ? '#fff' : '#1E1E2D',
            border: `1px solid ${theme === 'dark' ? '#2A2C3C' : '#E6E8EE'}`,
            borderRadius: 100, cursor: 'pointer', fontWeight: 500,
          }}>{label}</div>
        ))}
      </div>

      {/* Tweaks panel */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', padding: '12px 20px', background: theme === 'dark' ? '#1E1E2D' : '#fff', borderRadius: 16, border: `1px solid ${theme === 'dark' ? '#2A2C3C' : '#E6E8EE'}` }}>
        <div style={{ width: '100%', fontSize: 11, fontWeight: 600, color: '#7E848D', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tweaks</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: t.text }}>Tema:</span>
          {['dark','light'].map(v => (
            <div key={v} onClick={() => setTheme(v)} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', background: theme === v ? t.accent : t.surface2, color: theme === v ? '#fff' : t.text2, fontWeight: theme === v ? 600 : 400 }}>{v}</div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: t.text }}>Dispositivo:</span>
          {[
            { id: 'phone', label: '📱 Móvil' },
            { id: 'tablet', label: '⬛ Tablet H' },
            { id: 'tablet-v', label: '▮ Tablet V' }
          ].map(v => (
            <div key={v.id} onClick={() => setDeviceMode(v.id)} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', background: deviceMode === v.id ? t.accent : t.surface2, color: deviceMode === v.id ? '#fff' : t.text2, fontWeight: deviceMode === v.id ? 600 : 400 }}>{v.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
