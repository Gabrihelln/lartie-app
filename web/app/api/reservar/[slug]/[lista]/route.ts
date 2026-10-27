import { API_URL, caminhoLista } from '../../../../../lib/api';

// Repassa a reserva (T26) para a API, com o IP do convidado (o limite de tentativas é por IP).
export async function POST(req: Request, { params }: { params: Promise<{ slug: string; lista: string }> }) {
  const { slug, lista } = await params;
  const r = await fetch(`${API_URL}${caminhoLista(slug, lista)}/reservar`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': req.headers.get('x-forwarded-for') ?? '' },
    body: await req.text(),
  });
  return new Response(await r.text(), { status: r.status, headers: { 'content-type': 'application/json' } });
}
