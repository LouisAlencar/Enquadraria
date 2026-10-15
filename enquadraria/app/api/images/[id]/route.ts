import { isAdmin, supabase } from '../../../../lib/server/store';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^(order-)?[a-f0-9-]{36}$/.test(id)) return new Response('Não encontrado', { status: 404 });
  const privateImage = id.startsWith('order-');
  if (privateImage && !(await isAdmin())) return new Response('Acesso negado', { status: 403 });
  try {
    const r = await supabase(
      '/storage/v1/object/' + (privateImage ? 'order-photos' : 'catalog-images') + '/' + id,
    );
    return new Response(r.body, {
      headers: {
        'Content-Type': r.headers.get('content-type') || 'application/octet-stream',
        'Cache-Control': privateImage ? 'private, no-store' : 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Não encontrado', { status: 404 });
  }
}
