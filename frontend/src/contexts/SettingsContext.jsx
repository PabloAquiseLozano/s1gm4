import { createContext, useContext, useState, useEffect } from 'react';

const TRANSLATIONS = {
  es: {
    brandSub: "Coaching Estoico · IA",
    inputPlaceholder: "Escribe tu mensaje...",
    settingsTitle: "Configuración",
    themeLabel: "Apariencia",
    themeDark: "Oscuro",
    themeLight: "Claro",
    themeSystem: "Sistema",
    languageLabel: "Idioma",
    languageES: "Español",
    languageEN: "English",
    languagePT: "Português",
    languageFR: "Français",
    close: "Cerrar",
    login: "Iniciar sesión",
    register: "Registrarse",
    newChat: "Nuevo Chat",
    conversaciones: "Conversaciones",
    guestNotice: "Inicia sesión para guardar tu historial.",
    guestPrompt: "Estás en modo invitado.",
    logout: "Cerrar sesión",
    whatNext: (name) => name ? `¿Qué toca ahora, ${name}?` : `¿Qué toca ahora?`,
    tagline: "(Soy una inteligencia artificial programada para ayudarte netamente en motivación)",
    modeReflexive: "Reflexivo",
    modeAggressive: "Modo Bestia",
    listening: "Escuchando...",
    thinking: "Pensando...",
    emailCheckTitle: "Revisa tu email",
    emailCheckDesc: "Enviamos un enlace de confirmación a tu correo. Haz clic en el enlace para activar tu cuenta.",
    understood: "Entendido",
    loginTitle: "Inicia sesión",
    loginSubtitle: "Accede a tu historial y chats ilimitados",
    googleLogin: "Continuar con Google",
    createAccount: "Crea tu cuenta",
    noAccount: "¿No tienes cuenta?",
    hasAccount: "¿Ya tienes cuenta?",
    guestContinue: "Continuar sin cuenta",
    guestHint: "Sin cuenta solo tendrás 1 chat temporal que se pierde al recargar",
    namePlaceholder: "Nombre",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Contraseña",
  },
  en: {
    brandSub: "Stoic Coaching · AI",
    inputPlaceholder: "Type your message...",
    settingsTitle: "Settings",
    themeLabel: "Appearance",
    themeDark: "Dark",
    themeLight: "Light",
    themeSystem: "System",
    languageLabel: "Language",
    languageES: "Español",
    languageEN: "English",
    languagePT: "Português",
    languageFR: "Français",
    close: "Close",
    login: "Log in",
    register: "Sign up",
    newChat: "New Chat",
    conversaciones: "Conversations",
    guestNotice: "Log in to save your history.",
    guestPrompt: "You are in guest mode.",
    logout: "Log out",
    whatNext: (name) => name ? `What's next, ${name}?` : `What's next?`,
    tagline: "(I am an artificial intelligence programmed purely to help you with motivation)",
    modeReflexive: "Reflective",
    modeAggressive: "Beast Mode",
    listening: "Listening...",
    thinking: "Thinking...",
    emailCheckTitle: "Check your email",
    emailCheckDesc: "We sent a confirmation link to your email. Click the link to activate your account.",
    understood: "Understood",
    loginTitle: "Log in",
    loginSubtitle: "Access your history and unlimited chats",
    googleLogin: "Continue with Google",
    createAccount: "Create your account",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    guestContinue: "Continue without account",
    guestHint: "Without an account you will only have 1 temporary chat lost on reload",
    namePlaceholder: "Name",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
  },
  pt: {
    brandSub: "Coaching Estóico · IA",
    inputPlaceholder: "Digite sua mensagem...",
    settingsTitle: "Configurações",
    themeLabel: "Aparência",
    themeDark: "Escuro",
    themeLight: "Claro",
    themeSystem: "Sistema",
    languageLabel: "Idioma",
    languageES: "Español",
    languageEN: "English",
    languagePT: "Português",
    languageFR: "Français",
    close: "Fechar",
    login: "Entrar",
    register: "Cadastrar-se",
    newChat: "Novo Chat",
    conversaciones: "Conversas",
    guestNotice: "Faça login para salvar seu histórico.",
    guestPrompt: "Você está no modo convidado.",
    logout: "Sair",
    whatNext: (name) => name ? `Qual o próximo passo, ${name}?` : `Qual o próximo passo?`,
    tagline: "(Sou uma inteligência artificial programada puramente para te ajudar com motivação)",
    modeReflexive: "Reflexivo",
    modeAggressive: "Modo Fera",
    listening: "Ouvindo...",
    thinking: "Pensando...",
    emailCheckTitle: "Verifique seu email",
    emailCheckDesc: "Enviamos um link de confirmação para seu email. Clique no link para ativar sua conta.",
    understood: "Entendido",
    loginTitle: "Faça login",
    loginSubtitle: "Acesse seu histórico e chats ilimitados",
    googleLogin: "Continuar com o Google",
    createAccount: "Crie sua conta",
    noAccount: "Não tem uma conta?",
    hasAccount: "Já tem uma conta?",
    guestContinue: "Continuar sem conta",
    guestHint: "Sem conta você terá apenas 1 chat temporário que se perde ao recarregar",
    namePlaceholder: "Nome",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Senha",
  },
  fr: {
    brandSub: "Coaching Stoïcien · IA",
    inputPlaceholder: "Écrivez votre message...",
    settingsTitle: "Paramètres",
    themeLabel: "Apparence",
    themeDark: "Sombre",
    themeLight: "Clair",
    themeSystem: "Système",
    languageLabel: "Langue",
    languageES: "Español",
    languageEN: "English",
    languagePT: "Português",
    languageFR: "Français",
    close: "Fermer",
    login: "Se connecter",
    register: "S'inscrire",
    newChat: "Nouveau Chat",
    conversaciones: "Conversations",
    guestNotice: "Connectez-vous pour enregistrer votre historique.",
    guestPrompt: "Vous êtes en mode invité.",
    logout: "Se déconnecter",
    whatNext: (name) => name ? `Quelle est la suite, ${name}?` : `Quelle est la suite?`,
    tagline: "(Je suis une intelligence artificielle programmée uniquement pour vous aider avec la motivation)",
    modeReflexive: "Réfléchi",
    modeAggressive: "Mode Bête",
    listening: "Écoute...",
    thinking: "Réflexion...",
    emailCheckTitle: "Vérifiez vos e-mails",
    emailCheckDesc: "Nous avons envoyé un lien de confirmation à votre e-mail. Cliquez sur le lien pour activer votre compte.",
    understood: "Compris",
    loginTitle: "Connexion",
    loginSubtitle: "Accédez à votre historique et chats illimités",
    googleLogin: "Continuer avec Google",
    createAccount: "Créez votre compte",
    noAccount: "Vous n'avez pas de compte?",
    hasAccount: "Vous avez déjà un compte?",
    guestContinue: "Continuer sans compte",
    guestHint: "Sans compte, vous n'aurez qu'un seul chat temporaire perdu lors du rechargement",
    namePlaceholder: "Nom",
    emailPlaceholder: "E-mail",
    passwordPlaceholder: "Mot de passe",
  },
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('s1gm4_theme') || 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('s1gm4_lang') || 'es');

  useEffect(() => {
    localStorage.setItem('s1gm4_theme', theme);
    const root = document.documentElement;

    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', systemDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('s1gm4_lang', language);
  }, [language]);

  /** Helper para obtener traducciones de interfaz */
  const t = (key, param) => {
    const val = TRANSLATIONS[language]?.[key] || TRANSLATIONS.es[key] || key;
    if (typeof val === 'function') return val(param);
    return val;
  };

  return (
    <SettingsContext.Provider value={{
      theme,
      setTheme,
      language,
      setLanguage,
      t,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings debe usarse dentro de SettingsProvider');
  }
  return context;
}
