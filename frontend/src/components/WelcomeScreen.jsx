import { useSettings } from '../contexts/SettingsContext';

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function WelcomeScreen({ mode, suggestions, onSend, isAnonymous, onOpenAuth, user }) {
  const { t } = useSettings();

  const rawFirstName = user?.user_metadata?.full_name?.trim()?.split(/\s+/)[0] ||
                       user?.email?.split('@')[0] || '';
  const firstName = capitalize(rawFirstName);

  return (
    <div className="welcome-state">
      <h1 className="welcome-title">
        {t('whatNext', firstName)}
      </h1>
      {isAnonymous && (
        <p className="welcome-desc" style={{ marginTop: '12px' }}>
          {t('guestPrompt')}{' '}
          <button className="welcome-login-link" onClick={onOpenAuth}>
            {t('login')}
          </button>{' '}
          para guardar tu historial.
        </p>
      )}
    </div>
  );
}

export default WelcomeScreen;
