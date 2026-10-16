import {
  configured,
  records,
  saveRecord,
  deleteRecord,
  isAdmin,
  sameOrigin,
} from '../../../lib/server/store';
import {
  initialProducts,
  initialSettings,
  categories,
  isCompatibleMediaCategory,
  Product,
  Settings,
} from '../../../lib/catalog';
import { z } from 'zod';
import { imageUrl, validPoster } from '../../../lib/server/tmdb';
export async function GET() {
  try {
    const admin = await isAdmin();
    const rows = configured() ? await records<Product>('catalog') : [];
    const config = configured() ? await records<Settings>('settings', 'store') : [];
    return Response.json(
      {
        products: [
          ...initialProducts.filter((p) => !rows.some((r) => r.id === p.id)),
          ...rows.map((r) => r.data),
        ].filter((p) => !p.deleted && (admin || p.active)),
        settings: config[0]?.data ?? initialSettings,
        admin,
        orderingEnabled: configured(),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json({ error: 'Não foi possível carregar o catálogo.' }, { status: 503 });
  }
}
const price = z.number().min(0.01).max(100000).nullable();
const product = z.object({
  id: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/),
  title: z.string().trim().min(1).max(100),
  category: z.enum(categories as [string, ...string[]]),
  image: z.string(),
  description: z.string().max(1000),
  framePrice: price,
  active: z.boolean(),
  demo: z.boolean(),
  deleted: z.boolean().optional(),
  tmdb: z
    .object({
      id: z.number().int().positive(),
      type: z.enum(['movie', 'tv']),
      posterPath: z.string(),
      category: z.enum(['Filmes', 'Séries', 'Animes']),
    })
    .optional(),
});
const settings = z.object({
  name: z.string().trim().min(1).max(60),
  whatsapp: z.string().max(20),
  framePrice: price,
});
export async function POST(request: Request) {
  if (!(await isAdmin()) || !sameOrigin(request))
    return Response.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 });
  try {
    const body = await request.json();
    const isSettings = body.type === 'settings';
    const data = (isSettings ? settings : product).parse(body.data);
    if (!isSettings) {
      const model = data as Product;
      const localImage = /^\/(art\/[a-z-]+\.svg|api\/images\/[a-zA-Z0-9-]+)$/.test(model.image);
      const tmdbImage =
        !!model.tmdb &&
        validPoster(model.tmdb.posterPath) &&
        model.category === model.tmdb.category &&
        model.image === imageUrl(model.tmdb.posterPath, 'original') &&
        isCompatibleMediaCategory(model.tmdb.type, model.tmdb.category);
      if (!localImage && !tmdbImage) throw Error('Imagem inválida.');
    }
    await saveRecord(
      isSettings ? 'settings' : 'catalog',
      isSettings ? 'store' : (data as Product).id,
      data,
    );
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: 'Não foi possível salvar. Revise os campos e tente novamente.' },
      { status: 400 },
    );
  }
}
export async function DELETE(request: Request) {
  if (!(await isAdmin()) || !sameOrigin(request))
    return Response.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 });
  try {
    const { id } = z
      .object({ id: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/) })
      .parse(await request.json());
    const row = (await records<Product>('catalog', id))[0];
    const initial = initialProducts.find((p) => p.id === id);
    if (!row && !initial)
      return Response.json({ error: 'Modelo não encontrado.' }, { status: 404 });

    if (initial) {
      const archived: Product = {
        ...(row?.data ?? initial),
        active: false,
        deleted: true,
      };
      await saveRecord('catalog', id, archived);
    } else {
      await deleteRecord('catalog', id);
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Não foi possível excluir este modelo.' }, { status: 400 });
  }
}
