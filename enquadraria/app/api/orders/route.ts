import {
  configured,
  records,
  saveRecord,
  isAdmin,
  sameOrigin,
  uploadImage,
  removeOrderImage,
} from '../../../lib/server/store';
import { initialProducts, initialSettings, Product, Settings } from '../../../lib/catalog';
import { tmdb, validPoster, imageUrl } from '../../../lib/server/tmdb';
import { z } from 'zod';
const input = z.object({
  productId: z.string().max(80),
  variant: z.enum(['frame', 'poster']),
  quantity: z.coerce.number().int().min(1).max(99),
  name: z.string().trim().min(2).max(100),
  contact: z.string().trim().min(6).max(150),
  notes: z.string().max(1000),
});
export async function GET() {
  if (!(await isAdmin())) return new Response('Acesso negado', { status: 403 });
  try {
    return Response.json(
      { orders: (await records('orders')).map((r) => r.data) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json({ error: 'Não foi possível carregar os pedidos.' }, { status: 503 });
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response('Origem inválida', { status: 403 });
  if (!configured())
    return Response.json(
      { error: 'O recebimento de pedidos está em configuração. Nenhum pedido foi enviado.' },
      { status: 503 },
    );
  if (Number(request.headers.get('content-length')) > 4000000)
    return Response.json({ error: 'A imagem deve ter até 3,5 MB.' }, { status: 413 });
  let imageId: string | null = null;
  try {
    const form = await request.formData();
    const data = input.parse(Object.fromEntries(form));
    let price: number | null = null,
      title = '',
      image: string | null = null,
      source: unknown = null;
    if (data.productId === 'custom') {
      const s = (await records<Settings>('settings', 'store'))[0]?.data ?? initialSettings;
      price = data.variant === 'frame' ? s.framePrice : s.posterPrice;
      title = 'Foto personalizada';
      const file = form.get('photo');
      if (!(file instanceof File)) throw Error('Selecione sua foto.');
      imageId = await uploadImage(file, true);
      image = '/api/images/' + imageId;
    } else if (data.productId.startsWith('tmdb-')) {
      const selected = z
        .object({
          id: z.number().int().positive(),
          type: z.enum(['movie', 'tv']),
          posterPath: z.string(),
        })
        .parse(JSON.parse(String(form.get('tmdb'))));
      if (!validPoster(selected.posterPath)) throw Error('Pôster inválido.');
      const d = await tmdb(selected.type + '/' + selected.id, {
        language: 'pt-BR',
        append_to_response: 'images',
        include_image_language: 'pt,en,ja,null',
      });
      if (
        d.adult ||
        !d.images?.posters?.some((p: { file_path: string }) => p.file_path === selected.posterPath)
      )
        throw Error('Esse pôster não está disponível.');
      title = d.title || d.name;
      image = imageUrl(selected.posterPath, 'original');
      source = selected;
    } else {
      const p =
        (await records<Product>('catalog', data.productId))[0]?.data ??
        initialProducts.find((p) => p.id === data.productId);
      if (!p?.active) throw Error('Modelo indisponível.');
      price = data.variant === 'frame' ? p.framePrice : p.posterPrice;
      title = p.title;
      image = p.image;
    }
    const id = crypto.randomUUID();
    await saveRecord('orders', id, {
      ...data,
      id,
      title,
      unitPrice: price,
      total: price === null ? null : Math.round(price * data.quantity * 100) / 100,
      image,
      source,
      status: 'Novo',
      createdAt: new Date().toISOString(),
      size: 'A3 · 29,7 × 42 cm',
      paper: 'Couché 250 g/m²',
    });
    return Response.json({ id }, { status: 201 });
  } catch (e) {
    if (imageId) await removeOrderImage(imageId).catch(() => {});
    return Response.json(
      { error: e instanceof z.ZodError ? 'Revise os dados do pedido.' : (e as Error).message },
      { status: 400 },
    );
  }
}
export async function PATCH(request: Request) {
  if (!(await isAdmin()) || !sameOrigin(request))
    return new Response('Acesso negado', { status: 403 });
  try {
    const { id, status } = z
      .object({
        id: z.string().uuid(),
        status: z.enum(['Novo', 'Em atendimento', 'Em produção', 'Concluído', 'Cancelado']),
      })
      .parse(await request.json());
    const row = (await records<Record<string, unknown>>('orders', id))[0];
    if (!row) return new Response('Não encontrado', { status: 404 });
    await saveRecord('orders', id, { ...row.data, status });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Falha ao atualizar o pedido.' }, { status: 400 });
  }
}
