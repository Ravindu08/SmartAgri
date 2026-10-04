import { Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TOOLS, toolText, toolUi } from '../data/tools';

/**
 * The opening block of a tool page: what the tool is, what it does, and how to
 * use it in three steps. All text comes from data/tools.js.
 */
export default function ToolIntro({ tool: key }) {
  const { lang } = useApp();
  const tool = TOOLS.find(t => t.key === key);
  const text = toolText(tool, lang);
  const ui = toolUi(lang);

  return (
    <section className={`tu-intro tu-tone-${tool.tone} tu-rise`}>
      <div className="tu-intro__main">
        <span className="tu-eyebrow"><tool.Icon size={15} />{text.kind}</span>
        <h1>{text.title}</h1>
        <p>{text.what}</p>
        <span className="tu-intro__free"><Check size={15} strokeWidth={3} />{ui.free}</span>
      </div>
      <ol className="tu-intro__steps" aria-label={ui.how}>
        <li className="tu-intro__how">{ui.how}</li>
        {text.steps.map((step, i) => (
          <li key={step}><b>{i + 1}</b>{step}</li>
        ))}
      </ol>
    </section>
  );
}
