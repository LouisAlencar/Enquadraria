import { tmdb, TMDBError, validPoster, imageUrl } from '../../../../lib/server/tmdb';
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const type = p.get('type'),
    id = p.get('id');
  if (!['movie', 'tv'].includes(type || '') || !/^\d{1,10}$/.test(id || ''))
    return Response.json({ error: 'Título inválido.' }, { status: 400 });
  try {
    const d = await tmdb(type + '/' + id, {
      language: 'pt-BR',
      append_to_response: 'images',
      include_image_language: 'pt,en,ja,null',
    });
    if (d.adult) return new Response('Título indisponível', { status: 404 });
    const posters = (d.images?.posters || [])
      .filter((p: { file_path: string }) => validPoster(p.file_path))
      .map((p: { file_path: string; width: number; height: number; iso_639_1: string | null }) => ({
        path: p.file_path,
        url: imageUrl(p.file_path),
        width: p.width,
        height: p.height,
        language: p.iso_639_1,
      }));
    return Response.json(
      { id: Number(id), type, title: d.title || d.name, posters },
      { headers: { 'Cache-Control': 'public, max-age=600' } },
    );
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      { status: e instanceof TMDBError ? e.status : 502 },
    );
  }
}
