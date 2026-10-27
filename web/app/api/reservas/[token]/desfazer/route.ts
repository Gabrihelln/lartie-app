import { API_URL, caminhoReserva } from '../../../../../lib/api';

// T40: desfazer a reserva pelo convidado.
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await fetch(`${API_URL}${caminhoReserva(token)}/desfazer`, { method: 'POST' });
  return new Response(await r.text(), { status: r.status, headers: { 'content-type': 'application/json' } });
}
