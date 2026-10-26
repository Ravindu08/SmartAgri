// Cultivation tasks are stored in English; the ML service adds `title_si`,
// `description_ta`, … to every task it returns. Picks the one for `lang`,
// falling back to the English field.
export function taskText(task, key, lang) {
  if (!task) return "";
  return (lang && lang !== "en" && task[`${key}_${lang}`]) || task[key] || "";
}
