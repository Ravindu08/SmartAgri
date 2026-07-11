import { useCountUp } from '../hooks/useCountUp';

// Drop-in replacement for a raw number in JSX — animates from the previous
// value to `value` whenever it changes.
export default function CountUp({ value }) {
  const display = useCountUp(value ?? 0);
  return <span className="count-up">{display}</span>;
}
