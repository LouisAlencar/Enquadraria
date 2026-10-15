import { cookies } from 'next/headers';
import { configured, sameOrigin } from '../../../lib/server/store';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response('Acesso negado', { status: 403 });
  if (!configured() || !process.env.ADMIN_EMAIL)
    return Response.json(
      { error: 'O acesso administrativo está em configuração.' },
      { status: 503 },
    );
  try {
    const { email, password } = await request.json();
    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      password.length > 256 ||
      email.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase()
    )
      return Response.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 });
    const r = await fetch(process.env.SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return Response.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 });
    const data = await r.json();
    if (!data.user?.email_confirmed_at)
      return Response.json({ error: 'Confirme seu e-mail antes de entrar.' }, { status: 401 });
    (await cookies()).set('enquadraria_session', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.min(data.expires_in || 3600, 3600),
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Não foi possível entrar. Tente novamente.' }, { status: 503 });
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return new Response('Acesso negado', { status: 403 });
  (await cookies()).delete('enquadraria_session');
  return Response.json({ ok: true });
}
