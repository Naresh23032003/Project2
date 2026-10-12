// Mid-tone hues that hold white text at 4.5:1 or better. No reds: red means Cancel here.
const COLORS = ['#2b3a8c', '#00796b', '#6a3fa0', '#8a5a00', '#2e7d32', '#a8216b', '#455a64', '#1565c0'];

export function monogramColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length] as string;
}

export function initial(name: string): string {
  return (name.trim().charAt(0) || '?').toUpperCase();
}
