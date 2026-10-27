import { API_URL, caminhoRsvp } from '../../../../lib/api';

// T30: repassa as respostas para a API.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await fetch(`${API_URL}${caminhoRsvp(token)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': req.headers.get('x-forwarded-for') ?? '' },
    body: await req.text(),
  });
  return new Response(await r.text(), { status: r.status, headers: { 'content-type': 'application/json' } });
}
