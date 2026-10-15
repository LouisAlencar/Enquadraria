import 'server-only';
import { cookies } from 'next/headers';
export function configured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
function config() {
  if (!configured())
    throw new Error('O recebimento de pedidos está em configuração. Nenhum pedido foi enviado.');
  return {
    url: process.env.SUPABASE_URL!.replace(/\/$/, ''),
    key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  };
}
export async function supabase(path: string, init: RequestInit = {}) {
  const { url, key } = config();
  const r = await fetch(url + path, {
    ...init,
    headers: { apikey: key, Authorization: 'Bearer ' + key, ...init.headers },
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok)
    throw new Error('Não foi possível acessar o serviço de pedidos. Tente novamente mais tarde.');
  return r;
}
export async function records<T>(
  table: 'catalog' | 'settings' | 'orders',
  id?: string,
): Promise<{ id: string; data: T }[]> {
  const r = await supabase(
    '/rest/v1/shop_' +
      table +
      '?select=id,data' +
      (id ? '&id=eq.' + encodeURIComponent(id) : '') +
      (table === 'orders' ? '&order=created_at.desc&limit=500' : ''),
  );
  return r.json();
}
export async function saveRecord(
  table: 'catalog' | 'settings' | 'orders',
  id: string,
  data: unknown,
) {
  await supabase('/rest/v1/shop_' + table, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ id, data }),
  });
}
export async function isAdmin() {
  const token = (await cookies()).get('enquadraria_session')?.value;
  if (!token || !process.env.ADMIN_EMAIL || !configured()) return false;
  try {
    const r = await fetch(process.env.SUPABASE_URL + '/auth/v1/user', {
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: 'Bearer ' + token },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return false;
    const user = await r.json();
    return (
      !!user.email_confirmed_at &&
      user.email?.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()
    );
  } catch {
    return false;
  }
}
export function sameOrigin(r: Request) {
  return r.headers.get('origin') === new URL(r.url).origin;
}
export async function uploadImage(file: File, privateImage: boolean) {
  if (!file.size || file.size > 3500000) throw new Error('Use uma imagem de até 3,5 MB.');
  const bytes = await file.arrayBuffer();
  const b = new Uint8Array(bytes);
  const mime =
    b[0] === 255 && b[1] === 216 && b[2] === 255
      ? 'image/jpeg'
      : b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71
        ? 'image/png'
        : String.fromCharCode(...b.slice(0, 4)) === 'RIFF' &&
            String.fromCharCode(...b.slice(8, 12)) === 'WEBP'
          ? 'image/webp'
          : null;
  if (!mime) throw new Error('Use uma imagem JPG, PNG ou WebP.');
  const id = (privateImage ? 'order-' : '') + crypto.randomUUID();
  await supabase(
    '/storage/v1/object/' + (privateImage ? 'order-photos' : 'catalog-images') + '/' + id,
    { method: 'POST', headers: { 'Content-Type': mime }, body: bytes },
  );
  return id;
}
export async function removeOrderImage(id: string) {
  await supabase('/storage/v1/object/order-photos', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: [id] }),
  });
}
