import React from 'react';
import { X, Moon, Sun, Monitor, Globe, Sliders } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function SettingsModal({ isOpen, onClose }) {
  const { theme, setTheme, language, setLanguage, t } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Botón cerrar */}
        <button className="auth-close" onClick={onClose} title={t('close')}>
          <X size={18} />
        </button>

        <div className="auth-header" style={{ marginBottom: '24px' }}>
          <div className="settings-header-icon">
            <Sliders size={28} />
          </div>
          <h2 className="auth-title" style={{ marginTop: '8px' }}>{t('settingsTitle')}</h2>
        </div>

        <div className="settings-section">
          <label className="settings-label">
            <Sun size={15} />
            <span>{t('themeLabel')}</span>
          </label>
          <div className="settings-options-grid">
            <button
              className={`settings-opt-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              <Moon size={18} />
              <span>{t('themeDark')}</span>
            </button>
            <button
              className={`settings-opt-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
            >
              <Sun size={18} />
              <span>{t('themeLight')}</span>
            </button>
            <button
              className={`settings-opt-btn ${theme === 'system' ? 'active' : ''}`}
              onClick={() => setTheme('system')}
            >
              <Monitor size={18} />
              <span>{t('themeSystem')}</span>
            </button>
          </div>
        </div>

        <div className="settings-section" style={{ marginTop: '24px' }}>
          <label className="settings-label">
            <Globe size={15} />
            <span>{t('languageLabel')}</span>
          </label>
          <div className="settings-lang-grid">
            {[
              { code: 'es', name: t('languageES'), tag: 'ES' },
              { code: 'en', name: t('languageEN'), tag: 'EN' },
              { code: 'pt', name: t('languagePT'), tag: 'PT' },
              { code: 'fr', name: t('languageFR'), tag: 'FR' },
            ].map((lang) => (
              <button
                key={lang.code}
                className={`settings-lang-btn ${language === lang.code ? 'active' : ''}`}
                onClick={() => setLanguage(lang.code)}
              >
                <span className="lang-tag">{lang.tag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          className="auth-btn auth-btn-primary"
          style={{ marginTop: '28px' }}
          onClick={onClose}
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
}
