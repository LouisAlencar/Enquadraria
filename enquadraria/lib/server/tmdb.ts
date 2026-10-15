import 'server-only';
export class TMDBError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}
export async function tmdb(path: string, params: Record<string, string> = {}) {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  const key = process.env.TMDB_API_KEY;
  if (!token && !key)
    throw new TMDBError(
      'A busca de filmes está sendo preparada. Enquanto isso, explore a coleção ou envie sua foto.',
      503,
    );
  const url = new URL('https://api.themoviedb.org/3/' + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  if (!token) url.searchParams.set('api_key', key!);
  let r: Response;
  try {
    r = await fetch(url, {
      headers: token ? { Authorization: 'Bearer ' + token } : undefined,
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new TMDBError('O catálogo de filmes demorou a responder. Tente novamente.');
  }
  if (r.status === 401 || r.status === 403)
    throw new TMDBError('A conexão com o catálogo precisa ser revisada pela loja.', 503);
  if (r.status === 429)
    throw new TMDBError('Muitas buscas no momento. Tente novamente em instantes.', 429);
  if (!r.ok)
    throw new TMDBError('Não foi possível consultar esse título.', r.status === 404 ? 404 : 502);
  return r.json();
}
export const imageUrl = (path: string, size = 'w500') =>
  'https://image.tmdb.org/t/p/' + size + path;
export function validPoster(path: unknown): path is string {
  return typeof path === 'string' && /^\/[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(path);
}
