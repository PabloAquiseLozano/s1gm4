import { X, Moon, Sun, Monitor, Globe, Sliders } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function SettingsModal({ isOpen, onClose }) {
  const { theme, setTheme, language, setLanguage, t } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/65 backdrop-blur-[10px] animate-auth-fade-in" onClick={onClose}>
      <div className="relative max-h-[90vh] w-[92%] max-w-[440px] overflow-y-auto rounded-[20px] border border-line-light bg-modal px-8 pb-8 pt-10 shadow-[0_24px_64px_rgba(0,0,0,0.5),0_0_32px_rgba(25,195,125,0.08)] animate-auth-scale-up max-md:w-[95%] max-md:max-w-[380px] max-md:rounded-[16px] max-md:px-[18px] max-md:pb-5 max-md:pt-6" onClick={(e) => e.stopPropagation()}>
        <button className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-ink-muted transition hover:bg-panel-light hover:text-ink" onClick={onClose} title={t('close')}>
          <X size={18} />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-dim text-accent">
            <Sliders size={28} />
          </div>
          <h2 className="font-display text-[22px] font-bold text-ink-strong max-md:text-[19px]">{t('settingsTitle')}</h2>
        </div>

        <div className="flex flex-col gap-2.5">
          <label className="flex items-center gap-2 text-[13px] font-semibold text-ink-secondary">
            <Sun size={15} />
            <span>{t('themeLabel')}</span>
          </label>
          <div className="grid grid-cols-3 gap-2 max-md:gap-1.5">
            <button
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-line bg-panel-light px-2 py-3 text-xs font-medium text-ink-muted transition hover:border-line-light hover:text-ink max-md:px-1 max-md:py-2.5 max-md:text-[11px] ${
                theme === 'dark' ? 'border-accent bg-accent-dim text-accent' : ''
              }`}
              onClick={() => setTheme('dark')}
            >
              <Moon size={18} />
              <span>{t('themeDark')}</span>
            </button>
            <button
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-line bg-panel-light px-2 py-3 text-xs font-medium text-ink-muted transition hover:border-line-light hover:text-ink max-md:px-1 max-md:py-2.5 max-md:text-[11px] ${
                theme === 'light' ? 'border-accent bg-accent-dim text-accent' : ''
              }`}
              onClick={() => setTheme('light')}
            >
              <Sun size={18} />
              <span>{t('themeLight')}</span>
            </button>
            <button
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-line bg-panel-light px-2 py-3 text-xs font-medium text-ink-muted transition hover:border-line-light hover:text-ink max-md:px-1 max-md:py-2.5 max-md:text-[11px] ${
                theme === 'system' ? 'border-accent bg-accent-dim text-accent' : ''
              }`}
              onClick={() => setTheme('system')}
            >
              <Monitor size={18} />
              <span>{t('themeSystem')}</span>
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <label className="flex items-center gap-2 text-[13px] font-semibold text-ink-secondary">
            <Globe size={15} />
            <span>{t('languageLabel')}</span>
          </label>
          <div className="grid grid-cols-2 gap-2 max-md:gap-1.5">
            {[
              { code: 'es', name: t('languageES'), tag: 'ES' },
              { code: 'en', name: t('languageEN'), tag: 'EN' },
              { code: 'pt', name: t('languagePT'), tag: 'PT' },
              { code: 'fr', name: t('languageFR'), tag: 'FR' },
            ].map((lang) => (
              <button
                key={lang.code}
                className={`flex items-center gap-2.5 rounded-xl border border-line bg-panel-light px-3.5 py-2.5 text-[13px] font-medium text-ink-secondary transition hover:border-line-light hover:text-ink max-md:px-2.5 max-md:py-2 max-md:text-xs ${
                  language === lang.code ? 'border-accent bg-accent-dim text-accent' : ''
                }`}
                onClick={() => setLanguage(lang.code)}
              >
                <span className={`rounded border px-1.5 py-0.5 text-[11px] font-bold ${
                  language === lang.code
                    ? 'border-accent bg-accent text-black'
                    : 'border-line bg-panel text-ink-muted'
                }`}>
                  {lang.tag}
                </span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-black transition enabled:hover:-translate-y-0.5 enabled:hover:bg-[#2ae69a] enabled:hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
          onClick={onClose}
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
}
