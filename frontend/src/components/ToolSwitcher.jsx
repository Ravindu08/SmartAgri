import { Link, useLocation } from 'react-router';
import { useApp } from '../context/AppContext';
import { TOOLS, toolText } from '../data/tools';

/** The four-tab strip at the top of every AI tool page. */
export default function ToolSwitcher() {
  const { lang } = useApp();
  const { pathname } = useLocation();

  return (
    <nav className="tu-switch" aria-label="AI tools">
      {TOOLS.map(tool => {
        const text = toolText(tool, lang);
        return (
          <Link key={tool.key} to={tool.path} className={`tu-tone-${tool.tone}`}
            aria-current={pathname.startsWith(tool.path) ? 'page' : undefined}>
            <span className="tu-ic tu-ic--sm"><tool.Icon size={18} /></span>
            <span><b>{text.name}</b><small>{text.q}</small></span>
          </Link>
        );
      })}
    </nav>
  );
}
