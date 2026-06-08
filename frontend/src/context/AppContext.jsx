import { createContext, useContext, useEffect, useState } from 'react';

const AppContext = createContext(null);

function getInitialTheme() {
  try {
    const stored = localStorage.getItem('sa-theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch (_) {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function AppProvider({ children }) {
  const [lang,    setLang]    = useState('en');
  const [weather, setWeather] = useState(null);
  const [theme,   setTheme]   = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('sa-theme', theme); } catch (_) {}
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <AppContext.Provider value={{ lang, setLang, weather, setWeather, theme, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
