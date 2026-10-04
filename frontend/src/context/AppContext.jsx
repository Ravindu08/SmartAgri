import { createContext, useContext, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

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
    const next = theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('sa-theme', next); } catch (_) {}
    const apply = () => {
      setTheme(next);
      // Set here as well as in the effect so the attribute is already in place
      // when the view transition takes its "after" snapshot.
      document.documentElement.setAttribute('data-theme', next);
    };
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // Where supported, the new theme grows out from the toggle (see motion.css).
    if (document.startViewTransition && !still && !document.hidden) {
      const transition = document.startViewTransition(() => flushSync(apply));
      // The browser can abandon the animation (e.g. the tab loses focus); the
      // theme itself has still been applied, so there is nothing to recover.
      transition.ready.catch(() => {});
      transition.finished.catch(() => {});
    } else {
      apply();
    }
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
