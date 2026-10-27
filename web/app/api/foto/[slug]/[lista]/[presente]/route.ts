import { API_URL, caminhoLista } from '../../../../../../lib/api';

// Foto de um presente da lista publicada (a API só entrega fotos de itens da lista).
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; lista: string; presente: string }> }) {
  const { slug, lista, presente } = await params;
  const r = await fetch(`${API_URL}${caminhoLista(slug, lista)}/fotos/${encodeURIComponent(presente)}`);
  if (!r.ok) return new Response(null, { status: 404 });
  return new Response(r.body, { headers: { 'content-type': r.headers.get('content-type') ?? 'image/jpeg', 'cache-control': 'public, max-age=3600' } });
}
