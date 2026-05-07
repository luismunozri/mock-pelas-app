import { useState } from 'react';
import { PelasIcon } from '../icons';
import { T } from '../theme';
import { PrimaryButton, TextField } from '../components';
import { PELAS_SERIES_30D } from '../data';
import { Sparkline, Donut } from '../components';

const OnboardIllus = ({ theme, kind }) => {
  const t = T(theme);
  if (kind === 'wallet') {
    return (
      <div style={{ position: 'relative', width: 280, height: 260 }}>
        <div style={{ position: 'absolute', left: 30, top: 20, width: 200, height: 220, borderRadius: 28, background: t.surface, border: `1px solid ${t.border}`, padding: 20, boxShadow: '0 30px 60px rgba(0,30,100,0.18)' }}>
          <div style={{ fontSize: 10, color: t.text2 }}>Saldo total</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: t.text, marginTop: 4 }}>4 287,42 €</div>
          <div style={{ marginTop: 12 }}>
            <Sparkline data={PELAS_SERIES_30D.slice(0,16)} width={160} height={60} color={t.accent}/>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {[20,38,12,50,28,42].map((h,i) => <div key={i} style={{ flex: 1, height: h, background: i === 4 ? t.accent : t.surface2, borderRadius: 3 }}/>)}
          </div>
        </div>
        <div style={{ position: 'absolute', right: 0, top: 80, width: 160, height: 100, borderRadius: 14, background: 'linear-gradient(135deg,#0044CC,#001A66)', boxShadow: '0 20px 40px rgba(0,30,100,0.4)', padding: 12, color: '#fff', fontSize: 10, transform: 'rotate(8deg)' }}>
          <div style={{ opacity: 0.7, fontSize: 9 }}>Pelas Black</div>
          <div style={{ fontWeight: 600, marginTop: 28, letterSpacing: 1.5, fontSize: 11 }}>•••• 7852</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
            <div style={{ fontSize: 9, opacity: 0.7 }}>08/29</div>
            <PelasIcon name="visa" size={11} color="#fff"/>
          </div>
        </div>
      </div>
    );
  }
  if (kind === 'chart') {
    return (
      <div style={{ width: 260, height: 240, position: 'relative' }}>
        <div style={{ background: t.surface, borderRadius: 24, padding: 20, border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 11, color: t.text2 }}>Gastos del mes</div>
          <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>1 842,58 €</div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <Donut theme={theme} size={140} thickness={16} data={[
              { v: 412, color: '#0066FF' }, { v: 720, color: '#7C5CFF' }, { v: 215, color: '#FF8A4C' }, { v: 128, color: '#5B8DEF' }, { v: 365, color: t.surface2 },
            ]}/>
          </div>
        </div>
      </div>
    );
  }
  if (kind === 'people') {
    return (
      <div style={{ width: 280, height: 240, position: 'relative' }}>
        {[
          { x: 40, y: 0, label: 'Cena', amount: '−24 €', color: '#FF8A4C' },
          { x: 0, y: 90, label: 'Piso', amount: '420 €', color: '#7C5CFF' },
          { x: 100, y: 140, label: 'Meta', amount: '+50 €', color: '#3FB984' },
          { x: 150, y: 30, label: 'Súper', amount: '−12 €', color: '#0066FF' },
        ].map((b, i) => (
          <div key={i} style={{ position: 'absolute', left: b.x, top: b.y, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center', boxShadow: '0 10px 30px rgba(0,30,100,0.1)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: b.color }}/>
            <div>
              <div style={{ fontSize: 10, color: t.text2 }}>{b.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{b.amount}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const OnboardingScreen = ({ theme, step, onNext, onSkip }) => {
  const t = T(theme);
  const slides = [
    { title: 'Tus pelas, bajo control', sub: 'Visualiza ingresos, gastos y ahorro al instante. Sin esfuerzo, sin hojas de cálculo.', illus: 'wallet' },
    { title: 'Categorías y presupuestos', sub: 'Asignamos categorías de forma inteligente y te avisamos antes de pasarte de presupuesto.', illus: 'chart' },
    { title: 'Comparte y ahorra mejor', sub: 'Cuentas compartidas, metas de ahorro y notificaciones útiles. Tus pelas, en equipo.', illus: 'people' },
  ];
  const slide = slides[step];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px 28px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <PelasIcon name="pelas" size={22} color={t.accent} strokeWidth={2.6}/>
          <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>Pelas</div>
        </div>
        <div onClick={onSkip} style={{ fontSize: 13, color: t.text2, cursor: 'pointer' }}>Saltar</div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <OnboardIllus theme={theme} kind={slide.illus}/>
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
        {slides.map((_, i) => (
          <div key={i} style={{ width: i === step ? 22 : 6, height: 6, borderRadius: 3, background: i === step ? t.accent : t.border, transition: 'width 0.3s' }}/>
        ))}
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, color: t.text, lineHeight: 1.2, textAlign: 'center', marginBottom: 12, letterSpacing: -0.4 }}>{slide.title}</div>
      <div style={{ fontSize: 13.5, color: t.text2, textAlign: 'center', lineHeight: 1.5, marginBottom: 28, padding: '0 8px' }}>{slide.sub}</div>
      <PrimaryButton full onClick={onNext} theme={theme}>{step === slides.length - 1 ? 'Empezar' : 'Continuar'}</PrimaryButton>
    </div>
  );
};

export const SignInScreen = ({ theme, onSubmit, onSignUp }) => {
  const t = T(theme);
  const [email, setEmail] = useState('marta.bayon@correo.es');
  const [pwd, setPwd] = useState('••••••••');
  const [showPwd, setShowPwd] = useState(false);
  return (
    <div style={{ padding: '12px 28px 28px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
        <PelasIcon name="pelas" size={22} color={t.accent} strokeWidth={2.6}/>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Pelas</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.15, letterSpacing: -0.6, marginBottom: 8 }}>Bienvenida<br/>de vuelta</div>
      <div style={{ fontSize: 13.5, color: t.text2, marginBottom: 28 }}>Entra para gestionar tus pelas como un pro.</div>
      <TextField theme={theme} label="Correo electrónico" value={email} onChange={setEmail} icon="mail"/>
      <TextField theme={theme} label="Contraseña" value={pwd} onChange={setPwd} type={showPwd ? 'text' : 'password'} icon="lock"
        suffix={<div onClick={() => setShowPwd(!showPwd)} style={{ cursor: 'pointer' }}><PelasIcon name={showPwd ? 'eye-off' : 'eye'} size={18} color={t.text2}/></div>}
      />
      <div style={{ textAlign: 'right', fontSize: 12, color: t.accent, marginTop: -8, marginBottom: 24, fontWeight: 500, cursor: 'pointer' }}>¿Has olvidado la contraseña?</div>
      <PrimaryButton full theme={theme} onClick={onSubmit}>Entrar</PrimaryButton>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: t.border }}/>
        <div style={{ fontSize: 11, color: t.text2 }}>o continúa con</div>
        <div style={{ flex: 1, height: 1, background: t.border }}/>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 'auto' }}>
        {['Google', 'Apple', 'Face ID'].map((p,i) => (
          <div key={p} style={{ flex: 1, height: 50, borderRadius: 16, background: t.surface2, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PelasIcon name={['globe', 'goal', 'face'][i]} size={18} color={t.text}/>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, color: t.text2, marginTop: 24 }}>
        ¿No tienes cuenta? <span onClick={onSignUp} style={{ color: t.accent, fontWeight: 500, cursor: 'pointer' }}>Regístrate</span>
      </div>
    </div>
  );
};

export const SignUpScreen = ({ theme, onSubmit, onSignIn }) => {
  const t = T(theme);
  const [name, setName] = useState('Marta Bayón');
  const [email, setEmail] = useState('marta.bayon@correo.es');
  const [pwd, setPwd] = useState('');
  const [accepted, setAccepted] = useState(true);
  return (
    <div style={{ padding: '12px 28px 28px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <PelasIcon name="pelas" size={22} color={t.accent} strokeWidth={2.6}/>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Pelas</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.15, letterSpacing: -0.6, marginBottom: 8 }}>Crea tu cuenta</div>
      <div style={{ fontSize: 13.5, color: t.text2, marginBottom: 24 }}>Te tomará 30 segundos. Sin papeleos, sin sustos.</div>
      <TextField theme={theme} label="Nombre completo" value={name} onChange={setName} icon="user"/>
      <TextField theme={theme} label="Correo electrónico" value={email} onChange={setEmail} icon="mail"/>
      <TextField theme={theme} label="Contraseña" value={pwd} onChange={setPwd} type="password" icon="lock" placeholder="Mínimo 8 caracteres"/>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20, marginTop: 4 }}>
        <div onClick={() => setAccepted(!accepted)} style={{ width: 20, height: 20, borderRadius: 6, marginTop: 1, cursor: 'pointer', background: accepted ? t.accent : 'transparent', border: `1.5px solid ${accepted ? t.accent : t.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {accepted && <PelasIcon name="check" size={12} color="#fff" strokeWidth={2.6}/>}
        </div>
        <div style={{ fontSize: 12, color: t.text2, lineHeight: 1.5 }}>
          Acepto los <span style={{ color: t.accent, fontWeight: 500 }}>Términos y Condiciones</span> y la <span style={{ color: t.accent, fontWeight: 500 }}>Política de Privacidad</span> de Pelas.
        </div>
      </div>
      <PrimaryButton full theme={theme} onClick={onSubmit}>Crear cuenta</PrimaryButton>
      <div style={{ textAlign: 'center', fontSize: 13, color: t.text2, marginTop: 'auto' }}>
        ¿Ya tienes cuenta? <span onClick={onSignIn} style={{ color: t.accent, fontWeight: 500, cursor: 'pointer' }}>Entrar</span>
      </div>
    </div>
  );
};
