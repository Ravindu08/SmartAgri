export default function FeatureCard({ title, description, icon, ...rest }) {
  return (
    <article className="feature-card" {...rest}>
      <div className="feature-card__icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}
