import { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

/** Validación de formato de email con regex */
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** Icono de Google como SVG */
function GoogleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function AuthModal({ isOpen, onClose }) {
  const { signInWithGoogle, signUpWithEmail, signInWithEmail } = useAuth();
  const { t } = useSettings();

  const [view, setView] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError('');
    setShowPassword(false);
    setIsSubmitting(false);
  };

  const switchView = (newView) => {
    resetForm();
    setView(newView);
  };

  const handleClose = () => {
    resetForm();
    setView('login');
    onClose();
  };

  const validate = () => {
    if (!email.trim()) return t('emailPlaceholder');
    if (!isValidEmail(email)) return 'Email inválido';
    if (!password) return t('passwordPlaceholder');
    if (password.length < 6) return 'Mínimo 6 caracteres';
    if (view === 'register' && !fullName.trim()) return t('namePlaceholder');
    return null;
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Error Google OAuth');
      setIsSubmitting(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    try {
      setIsSubmitting(true);
      setError('');
      await signInWithEmail(email, password);
      handleClose();
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials')) {
        setError('Email o contraseña incorrectos');
      } else {
        setError(msg || 'Error al iniciar sesión');
      }
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    try {
      setIsSubmitting(true);
      setError('');
      await signUpWithEmail(email, password, fullName.trim());
      handleClose();
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('already registered')) {
        setError('Este email ya está registrado.');
      } else {
        setError(msg || 'Error al registrarse');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={handleClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Botón cerrar */}
        <button className="auth-close" onClick={handleClose} title={t('close')}>
          <X size={18} />
        </button>

        {/* ═══ VISTA: LOGIN ═══ */}
        {view === 'login' && (
          <>
            <div className="auth-header">
              <div className="settings-header-icon">
                <Shield size={28} />
              </div>
              <h2 className="auth-title">{t('loginTitle')}</h2>
              <p className="auth-subtitle">
                {t('loginSubtitle')}
              </p>
            </div>

            {/* Google OAuth */}
            <button
              className="auth-btn auth-btn-google"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
            >
              <GoogleIcon size={20} />
              <span>{t('googleLogin')}</span>
            </button>

            <div className="auth-divider"><span>o</span></div>

            {/* Formulario email/contraseña */}
            <form onSubmit={handleEmailLogin} className="auth-form">
              <div className="auth-field">
                <Mail size={16} className="auth-field-icon" />
                <input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  autoComplete="email"
                  className="auth-input"
                />
              </div>

              <div className="auth-field">
                <Lock size={16} className="auth-field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                  className="auth-input"
                />
                <button
                  type="button"
                  className="auth-field-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button
                type="submit"
                className="auth-btn auth-btn-primary"
                disabled={isSubmitting}
              >
                {t('login')}
              </button>
            </form>

            <p className="auth-switch">
              {t('noAccount')}{' '}
              <button className="auth-switch-link" onClick={() => switchView('register')}>
                {t('register')}
              </button>
            </p>

            {/* Continuar sin cuenta */}
            <div className="auth-divider"><span>o</span></div>
            <button className="auth-btn auth-btn-guest" onClick={handleClose}>
              {t('guestContinue')}
            </button>
            <p className="auth-hint">
              {t('guestHint')}
            </p>
          </>
        )}

        {/* ═══ VISTA: REGISTER ═══ */}
        {view === 'register' && (
          <>
            <div className="auth-header">
              <button className="auth-back" onClick={() => switchView('login')} title="Volver">
                <ArrowLeft size={18} />
              </button>
              <div className="settings-header-icon">
                <Shield size={28} />
              </div>
              <h2 className="auth-title">{t('createAccount')}</h2>
              <p className="auth-subtitle">
                {t('loginSubtitle')}
              </p>
            </div>

            {/* Google OAuth */}
            <button
              className="auth-btn auth-btn-google"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
            >
              <GoogleIcon size={20} />
              <span>{t('googleLogin')}</span>
            </button>

            <div className="auth-divider"><span>o</span></div>

            {/* Formulario de registro */}
            <form onSubmit={handleRegister} className="auth-form">
              <div className="auth-field">
                <User size={16} className="auth-field-icon" />
                <input
                  type="text"
                  placeholder={t('namePlaceholder')}
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setError(''); }}
                  autoComplete="name"
                  className="auth-input"
                />
              </div>

              <div className="auth-field">
                <Mail size={16} className="auth-field-icon" />
                <input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  autoComplete="email"
                  className="auth-input"
                />
              </div>

              <div className="auth-field">
                <Lock size={16} className="auth-field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  autoComplete="new-password"
                  className="auth-input"
                />
                <button
                  type="button"
                  className="auth-field-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button
                type="submit"
                className="auth-btn auth-btn-primary"
                disabled={isSubmitting}
              >
                {t('register')}
              </button>
            </form>

            <p className="auth-switch">
              {t('hasAccount')}{' '}
              <button className="auth-switch-link" onClick={() => switchView('login')}>
                {t('login')}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
