export type FlowerCornerFilters = {
  query: string;
  kind: 'all' | 'flower' | 'foliage';
  life: 'all' | 'annual' | 'biennial' | 'perennial';
  light: 'all' | 'sun' | 'shade';
};

export const defaultFlowerCornerFilters: FlowerCornerFilters = {
  query: '', kind: 'all', life: 'all', light: 'all',
};

/** Ignore unknown values so old or edited bookmarks remain usable. */
export function readFlowerCornerFilters(params: URLSearchParams): FlowerCornerFilters {
  const kind = params.get('kind');
  const life = params.get('life');
  const light = params.get('light');
  return {
    query: (params.get('q') || '').slice(0, 200),
    kind: kind === 'flower' || kind === 'foliage' ? kind : 'all',
    life: life === 'annual' || life === 'biennial' || life === 'perennial' ? life : 'all',
    light: light === 'sun' || light === 'shade' ? light : 'all',
  };
}

export function flowerCornerLibraryUrl(path: string, filters: FlowerCornerFilters): string {
  const pathname = path === '/' ? '/' : '/flower-corner';
  const params = new URLSearchParams();
  if (pathname === '/') params.set('view', 'flower-corner');
  if (filters.query) params.set('q', filters.query.slice(0, 200));
  if (filters.kind !== 'all') params.set('kind', filters.kind);
  if (filters.life !== 'all') params.set('life', filters.life);
  if (filters.light !== 'all') params.set('light', filters.light);
  return `${pathname}${params.size ? `?${params}` : ''}`;
}

/** Only public Library destinations can be used as a guide's return link. */
export function safeFlowerCornerReturn(value: unknown): string {
  const fallback = '/flower-corner';
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f]/.test(value)) return fallback;
  let url: URL;
  try { url = new URL(value, 'https://garden.invalid'); } catch { return fallback; }
  if (url.origin !== 'https://garden.invalid') return fallback;
  const workspace = url.pathname === '/' && url.searchParams.get('view') === 'flower-corner';
  if (url.pathname !== '/flower-corner' && !workspace) return fallback;
  return flowerCornerLibraryUrl(url.pathname, readFlowerCornerFilters(url.searchParams));
}
