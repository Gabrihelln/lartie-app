import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

// T20 "Link da loja": ao colar, a API tenta ler o nome, a foto e o preço da página. Pode falhar sem
// aviso (a especificação permite). A busca é feita pelo servidor, com proteções: só http(s), nada de
// endereços internos (inclusive depois de redirecionar), tempo e tamanho limitados.

const TEMPO_MS = 6000;
const MAXIMO_HTML = 1_500_000;
export const MAXIMO_IMAGEM = 5 * 1024 * 1024;

export class ErroLink extends Error {
  constructor(readonly codigo: 'link_invalido' | 'link_bloqueado' | 'link_falhou') {
    super(codigo);
  }
}

/** Endereços que o servidor nunca acessa: locais, privados, link-local, reservados. */
export function enderecoInterno(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number) as [number, number];
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  const v = ip.toLowerCase();
  if (v.startsWith('::ffff:')) return enderecoInterno(v.slice(7));
  return v === '::' || v === '::1' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe8') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb');
}

async function validarDestino(endereco: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(endereco);
  } catch {
    throw new ErroLink('link_invalido');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new ErroLink('link_invalido');
  if (url.username || url.password) throw new ErroLink('link_bloqueado');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const ips = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((r) => r.address);
  if (ips.length === 0) throw new ErroLink('link_falhou');
  if (ips.some(enderecoInterno)) throw new ErroLink('link_bloqueado');
  return url;
}

/** GET com redirecionamentos conferidos um a um (até 3). */
export async function buscarSeguro(endereco: string, aceitar: string): Promise<Response> {
  let atual = endereco;
  for (let i = 0; i < 4; i++) {
    const url = await validarDestino(atual);
    const r = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TEMPO_MS),
      headers: { accept: aceitar, 'user-agent': 'Mozilla/5.0 (compatible; LartieBot/1.0; +https://lartie.app)' },
    }).catch(() => {
      throw new ErroLink('link_falhou');
    });
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
      atual = new URL(r.headers.get('location')!, url).toString();
      continue;
    }
    if (!r.ok) throw new ErroLink('link_falhou');
    return r;
  }
  throw new ErroLink('link_falhou');
}

/** Lê o corpo até `limite` bytes. */
export async function lerAte(r: Response, limite: number): Promise<Buffer> {
  const leitor = r.body?.getReader();
  if (!leitor) return Buffer.alloc(0);
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    total += value.length;
    if (total > limite) {
      await leitor.cancel();
      throw new ErroLink('link_falhou');
    }
    partes.push(value);
  }
  return Buffer.concat(partes);
}

function meta(html: string, nomes: string[]): string | null {
  for (const nome of nomes) {
    const r1 = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${nome}["'][^>]*content=["']([^"']+)["']`, 'i').exec(html);
    if (r1) return r1[1]!;
    const r2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name|itemprop)=["']${nome}["']`, 'i').exec(html);
    if (r2) return r2[1]!;
  }
  return null;
}

/** "3.199,90", "3199.90", "R$ 450" → centavos. */
export function lerPreco(texto: string | null | undefined): number | null {
  if (!texto) return null;
  let t = String(texto).replace(/[^\d.,]/g, '');
  if (!t) return null;
  if (t.includes(',') && t.includes('.')) t = t.lastIndexOf(',') > t.lastIndexOf('.') ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  else if (t.includes(',')) t = /,\d{1,2}$/.test(t) ? t.replace(',', '.') : t.replace(/,/g, '');
  else if (/\.\d{3}$/.test(t)) t = t.replace(/\./g, '');
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}

const decodificar = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

/** Extrai nome, foto e preço de uma página de produto (Open Graph, microdados ou JSON-LD). */
export function extrairPrevia(html: string, base: string) {
  const titulo = meta(html, ['og:title', 'twitter:title']) ?? /<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1] ?? null;
  const imagem = meta(html, ['og:image', 'og:image:secure_url', 'twitter:image']);
  let preco = lerPreco(meta(html, ['product:price:amount', 'og:price:amount', 'price']));
  if (preco === null) {
    const jsonld = /"price"\s*:\s*"?([\d.,]+)"?/i.exec(html);
    preco = lerPreco(jsonld?.[1]);
  }
  let imagemAbsoluta: string | null = null;
  if (imagem) {
    try {
      imagemAbsoluta = new URL(decodificar(imagem), base).toString();
    } catch {
      imagemAbsoluta = null;
    }
  }
  return { titulo: titulo ? decodificar(titulo).slice(0, 120) : null, preco, imagem: imagemAbsoluta };
}

export async function previaDoLink(endereco: string) {
  const r = await buscarSeguro(endereco, 'text/html,application/xhtml+xml');
  if (!(r.headers.get('content-type') ?? '').includes('html')) throw new ErroLink('link_falhou');
  const html = (await lerAte(r, MAXIMO_HTML)).toString('utf8');
  return extrairPrevia(html, r.url || endereco);
}
