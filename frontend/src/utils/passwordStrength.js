// Simple heuristic scorer — not meant to replace a real zxcvbn-style check,
// just enough signal to nudge users away from "password1"-tier passwords.
export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "empty" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (password.length < 8) score = 0;

  const clamped = Math.min(score, 4);
  const labels = ["weak", "weak", "fair", "good", "strong"];
  return { score: clamped, label: labels[clamped] };
}
