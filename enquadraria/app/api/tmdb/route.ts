import { tmdb, TMDBError, validPoster, imageUrl } from '../../../lib/server/tmdb';
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const query = p.get('q')?.trim() || '';
  const category = p.get('category') || 'movie';
  const page = Number(p.get('page') || 1);
  if (
    !['movie', 'tv', 'anime'].includes(category) ||
    query.length < 2 ||
    query.length > 100 ||
    !Number.isInteger(page) ||
    page < 1 ||
    page > 20
  )
    return Response.json({ error: 'Digite pelo menos 2 caracteres para buscar.' }, { status: 400 });
  try {
    const d = await tmdb('search/' + (category === 'anime' ? 'multi' : category), {
      query,
      language: 'pt-BR',
      include_adult: 'false',
      page: String(page),
    });
    const results = d.results
      .filter(
        (x: {
          adult?: boolean;
          media_type?: string;
          genre_ids?: number[];
          original_language?: string;
          origin_country?: string[];
        }) =>
          !x.adult &&
          (category !== 'anime' ||
            (['movie', 'tv'].includes(x.media_type || '') &&
              x.genre_ids?.includes(16) &&
              (x.original_language === 'ja' || x.origin_country?.includes('JP')))),
      )
      .map(
        (x: {
          id: number;
          title?: string;
          name?: string;
          poster_path?: string;
          release_date?: string;
          first_air_date?: string;
          overview?: string;
          media_type?: string;
        }) => ({
          id: x.id,
          title: x.title || x.name,
          year: (x.release_date || x.first_air_date || '').slice(0, 4),
          overview: x.overview || '',
          type: x.media_type || category,
          poster: validPoster(x.poster_path) ? imageUrl(x.poster_path) : null,
        }),
      );
    return Response.json(
      { results, page, totalPages: Math.min(d.total_pages, 20) },
      { headers: { 'Cache-Control': 'public, max-age=300' } },
    );
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      { status: e instanceof TMDBError ? e.status : 502 },
    );
  }
}
