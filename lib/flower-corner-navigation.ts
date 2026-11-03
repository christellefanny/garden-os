/** Only public Library destinations can be used as a guide's return link. */
export function safeFlowerCornerReturn(value: unknown): string {
  const fallback = '/flower-corner';
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f]/.test(value)) return fallback;
  let url: URL;
  try { url = new URL(value, 'https://garden.invalid'); } catch { return fallback; }
  if (url.origin !== 'https://garden.invalid') return fallback;
  const workspace = url.pathname === '/' && url.searchParams.get('view') === 'flower-corner';
  if (url.pathname !== '/flower-corner' && !workspace) return fallback;
  const clean = new URLSearchParams();
  if (workspace) clean.set('view', 'flower-corner');
  const query = url.searchParams.get('q');
  if (query) clean.set('q', query.slice(0, 200));
  const kind = url.searchParams.get('kind');
  if (kind && ['all', 'flower', 'foliage'].includes(kind)) clean.set('kind', kind);
  const light = url.searchParams.get('light');
  if (light && ['all', 'sun', 'shade'].includes(light)) clean.set('light', light);
  return `${url.pathname}${clean.size ? `?${clean}` : ''}`;
}
