import { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

  const [view, setView] = useState('login');
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
      setError(msg.includes('Invalid login credentials')
        ? 'Email o contraseña incorrectos'
        : (msg || 'Error al iniciar sesión'));
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
      setError(msg.includes('already registered')
        ? 'Este email ya está registrado.'
        : (msg || 'Error al registrarse'));
      setIsSubmitting(false);
    }
  };

  const divider = (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-line" />
      <span className="whitespace-nowrap text-xs text-ink-muted">o</span>
      <div className="h-px flex-1 bg-line" />
    </div>
  );

  const googleButton = (
    <button
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#dadce0] bg-white px-5 py-3 text-sm font-medium text-[#1f1f1f] transition enabled:hover:-translate-y-0.5 enabled:hover:bg-[#f8f9fa] enabled:hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
      onClick={handleGoogleLogin}
      disabled={isSubmitting}
    >
      <GoogleIcon size={20} />
      <span>{t('googleLogin')}</span>
    </button>
  );

  const primaryButton = (label) => (
    <button
      type="submit"
      className="flex w-full items-center justify-center gap-3 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-black transition enabled:hover:-translate-y-0.5 enabled:hover:bg-[#2ae69a] enabled:hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isSubmitting}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/65 backdrop-blur-[10px] animate-auth-fade-in" onClick={handleClose}>
      <div className="relative max-h-[90vh] w-[92%] max-w-[420px] overflow-y-auto rounded-[20px] border border-line-light bg-modal px-8 pb-8 pt-10 shadow-[0_24px_64px_rgba(0,0,0,0.5),0_0_32px_rgba(25,195,125,0.08)] animate-auth-scale-up max-md:w-[95%] max-md:max-w-[380px] max-md:rounded-[16px] max-md:px-5 max-md:pb-6 max-md:pt-8" onClick={(e) => e.stopPropagation()}>
        <button className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-ink-muted transition hover:bg-panel-light hover:text-ink" onClick={handleClose} title={t('close')}>
          <X size={18} />
        </button>

        {view === 'login' && (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-dim text-accent">
                <Shield size={28} />
              </div>
              <h2 className="mb-2 font-display text-[22px] font-bold text-ink-strong max-md:text-[19px]">{t('loginTitle')}</h2>
              <p className="text-[13px] leading-relaxed text-ink-muted">{t('loginSubtitle')}</p>
            </div>

            {googleButton}
            {divider}

            <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-panel-light px-[14px] transition focus-within:border-accent max-md:px-2.5">
                <Mail size={16} className="flex-shrink-0 text-ink-muted" />
                <input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  autoComplete="email"
                  className="flex-1 bg-transparent py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-panel-light px-[14px] transition focus-within:border-accent max-md:px-2.5">
                <Lock size={16} className="flex-shrink-0 text-ink-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                  className="flex-1 bg-transparent py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                />
                <button
                  type="button"
                  className="text-ink-muted transition hover:text-ink"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && <p className="py-1 text-center text-xs leading-[1.4] text-danger">{error}</p>}
              {primaryButton(t('login'))}
            </form>

            <p className="mt-4 text-center text-[13px] text-ink-muted">
              {t('noAccount')}{' '}
              <button className="font-medium text-accent hover:text-[#2ae69a] hover:underline" onClick={() => switchView('register')}>
                {t('register')}
              </button>
            </p>

            {divider}
            <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-transparent px-5 py-3 text-[13px] font-medium text-ink-secondary transition hover:border-line-light hover:bg-panel-light hover:text-ink" onClick={handleClose}>
              {t('guestContinue')}
            </button>
            <p className="mt-2.5 text-center text-[11px] leading-[1.4] text-ink-muted">{t('guestHint')}</p>
          </>
        )}

        {view === 'register' && (
          <>
            <div className="mb-6 text-center">
              <button className="absolute left-3.5 top-3.5 flex items-center rounded-lg p-1.5 text-ink-muted transition hover:bg-panel-light hover:text-ink" onClick={() => switchView('login')} title="Volver">
                <ArrowLeft size={18} />
              </button>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-dim text-accent">
                <Shield size={28} />
              </div>
              <h2 className="mb-2 font-display text-[22px] font-bold text-ink-strong max-md:text-[19px]">{t('createAccount')}</h2>
              <p className="text-[13px] leading-relaxed text-ink-muted">{t('loginSubtitle')}</p>
            </div>

            {googleButton}
            {divider}

            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-panel-light px-[14px] transition focus-within:border-accent max-md:px-2.5">
                <User size={16} className="flex-shrink-0 text-ink-muted" />
                <input
                  type="text"
                  placeholder={t('namePlaceholder')}
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setError(''); }}
                  autoComplete="name"
                  className="flex-1 bg-transparent py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-panel-light px-[14px] transition focus-within:border-accent max-md:px-2.5">
                <Mail size={16} className="flex-shrink-0 text-ink-muted" />
                <input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  autoComplete="email"
                  className="flex-1 bg-transparent py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-panel-light px-[14px] transition focus-within:border-accent max-md:px-2.5">
                <Lock size={16} className="flex-shrink-0 text-ink-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  autoComplete="new-password"
                  className="flex-1 bg-transparent py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                />
                <button
                  type="button"
                  className="text-ink-muted transition hover:text-ink"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && <p className="py-1 text-center text-xs leading-[1.4] text-danger">{error}</p>}
              {primaryButton(t('register'))}
            </form>

            <p className="mt-4 text-center text-[13px] text-ink-muted">
              {t('hasAccount')}{' '}
              <button className="font-medium text-accent hover:text-[#2ae69a] hover:underline" onClick={() => switchView('login')}>
                {t('login')}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
