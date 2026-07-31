import { useSettings } from '../contexts/SettingsContext';

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function WelcomeScreen({ isAnonymous, onOpenAuth, user }) {
  const { t } = useSettings();

  const rawFirstName = user?.user_metadata?.full_name?.trim()?.split(/\s+/)[0] ||
                       user?.email?.split('@')[0] || '';
  const firstName = capitalize(rawFirstName);

  return (
    <div className="mx-auto flex max-w-[600px] flex-col items-center justify-center gap-3 text-center animate-fade-in-slow max-md:gap-2.5 max-md:px-3">
      <h1 className="font-display text-[32px] font-semibold text-ink-strong max-md:text-2xl max-[480px]:text-[21px]">
        {t('whatNext', firstName)}
      </h1>
      {isAnonymous && (
        <p className="mt-3 text-[13px] leading-relaxed text-ink-muted max-md:text-[12.5px]">
          {t('guestPrompt')}{' '}
          <button className="text-accent underline hover:text-[#2ae69a]" onClick={onOpenAuth}>
            {t('login')}
          </button>{' '}
          para guardar tu historial.
        </p>
      )}
    </div>
  );
}

export default WelcomeScreen;
