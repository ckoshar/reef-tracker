export const tod = () => new Date().toISOString().split("T")[0];

export const fmt = d => {
  try {
    return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
  } catch {
    return d;
  }
};

export const daysAgo = d => {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d + "T12:00:00")) / 864e5);
};

export const fmtTime = t => {
  if (!t) return "";
  try {
    const [h, m] = t.split(":");
    const hr = parseInt(h);
    const ampm = hr >= 12 ? "PM" : "AM";
    const hr12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
    return `${hr12}:${m} ${ampm}`;
  } catch {
    return t;
  }
};
