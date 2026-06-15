import { createContext, useContext, useEffect, useState } from 'react';

const AppContext = createContext(null);

function getInitialTheme() {
  try {
    const stored = localStorage.getItem('sa-theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch (_) {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialLang() {
  try {
    const stored = localStorage.getItem('smartagri_lang');
    if (['en', 'si', 'ta'].includes(stored)) return stored;
  } catch (_) {}
  return 'en';
}

export function AppProvider({ children }) {
  const [lang,    setLang]    = useState(getInitialLang);
  const [weather, setWeather] = useState(null);
  const [theme,   setTheme]   = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Auto-follow system theme changes only when user hasn't set an explicit preference
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const handler = (e) => {
      try {
        if (!localStorage.getItem('sa-theme')) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      } catch (_) {}
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleTheme = () => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('sa-theme', next); } catch (_) {}
      return next;
    });
  };

  const changeLang = (code) => {
    setLang(code);
    try { localStorage.setItem('smartagri_lang', code); } catch (_) {}
  };

  return (
    <AppContext.Provider value={{ lang, setLang: changeLang, weather, setWeather, theme, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
