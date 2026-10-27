// Gera os PNGs do ícone a partir dos SVGs de design-system/logos/svg e copia para o app
// (iOS: AppIcon do Xcode; Android: mipmaps legados, redondos e as camadas do ícone adaptativo).
// Uso: npm run icones -w @lartie/tokens
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const svg = (nome) => readFileSync(resolve(raiz, 'design-system/logos/svg', nome), 'utf8');
const png = resolve(raiz, 'design-system/logos/png');
const ios = resolve(raiz, 'mobile/ios/Lartie/Images.xcassets/AppIcon.appiconset');
const res = resolve(raiz, 'mobile/android/app/src/main/res');

function renderizar(fonte, largura, destino) {
  mkdirSync(dirname(destino), { recursive: true });
  const imagem = new Resvg(fonte, { fitTo: { mode: 'width', value: largura }, background: 'rgba(0,0,0,0)' }).render();
  writeFileSync(destino, imagem.asPng());
}

/** A App Store recusa ícone com canal alfa: passa por JPEG e volta para PNG sem alfa (sips do macOS). */
function semAlfa(arquivo) {
  const jpg = `${arquivo}.jpg`;
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '100', arquivo, '--out', jpg], { stdio: 'ignore' });
  execFileSync('sips', ['-s', 'format', 'png', jpg, '--out', arquivo], { stdio: 'ignore' });
  execFileSync('rm', [jpg]);
}

// O desenho do símbolo (sem o fundo) e o degradê, tirados do ícone oficial.
const icone = svg('icone-app-1024.svg');
const defs = /<defs>.*?<\/defs>/s.exec(icone)[0];
const fundos = [...icone.matchAll(/<rect [^>]*\/>/g)].map((m) => m[0]).join('');
const simbolo = /<g transform="[^"]+">(.*)<\/g><\/svg>/s.exec(icone)[1];

/** Camada da frente do ícone adaptativo: 108 dp, símbolo dentro da zona segura de 66 dp. */
function frente(cor) {
  const lado = 108;
  const tamanho = 58; // o símbolo (100 unidades) ocupa ~58 dp, dentro dos 66 dp seguros
  const escala = tamanho / 100;
  const deslocamento = (lado - tamanho) / 2;
  const desenho = cor ? simbolo.replaceAll('#FCEEE8', cor) : simbolo;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}"><g transform="translate(${deslocamento} ${deslocamento + 1}) scale(${escala})">${desenho}</g></svg>`;
}

/** Ícone redondo (ic_launcher_round) para lançadores antigos. */
const redondo = icone.replace(
  /<rect width="1024" height="1024" rx="0" fill="url\(#g\)"\/>/,
  '<clipPath id="c"><circle cx="512" cy="512" r="512"/></clipPath><g clip-path="url(#c)"><rect width="1024" height="1024" fill="url(#g)"/>',
).replace('</g></g></svg>', '</g></g></g></svg>');
const fundo = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs}${fundos}</svg>`;

// design-system/logos/png ------------------------------------------------------------------
renderizar(icone, 1024, resolve(png, 'ios-app-icon-1024.png'));
semAlfa(resolve(png, 'ios-app-icon-1024.png'));
renderizar(icone, 180, resolve(png, 'ios-180.png'));
renderizar(svg('icone-app-arredondado.svg'), 192, resolve(png, 'android-192.png'));
renderizar(svg('icone-app-arredondado.svg'), 512, resolve(png, 'icone-arredondado-512.png'));
renderizar(icone, 512, resolve(png, 'google-play-512.png'));
renderizar(fundo, 432, resolve(png, 'android-adaptive-fundo-432.png'));
renderizar(frente(null), 432, resolve(png, 'android-adaptive-frente-432.png'));
renderizar(frente('#000000'), 432, resolve(png, 'android-monocromatico-432.png'));
renderizar(svg('icone-app-arredondado.svg'), 32, resolve(png, 'favicon-32.png'));
renderizar(svg('simbolo-simplificado.svg'), 16, resolve(png, 'favicon-16.png'));
for (const cor of ['creme', 'rose', 'vinho']) renderizar(svg(`simbolo-${cor}.svg`), 208, resolve(png, `simbolo-${cor}.png`));

// iOS -------------------------------------------------------------------------------------
renderizar(icone, 1024, resolve(ios, 'icone-1024.png'));
semAlfa(resolve(ios, 'icone-1024.png'));

// Android ---------------------------------------------------------------------------------
const densidades = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, f] of Object.entries(densidades)) {
  const pasta = resolve(res, `mipmap-${d}`);
  renderizar(svg('icone-app-arredondado.svg'), 48 * f, resolve(pasta, 'ic_launcher.png'));
  renderizar(redondo, 48 * f, resolve(pasta, 'ic_launcher_round.png'));
  renderizar(fundo, 108 * f, resolve(pasta, 'ic_launcher_fundo.png'));
  renderizar(frente(null), 108 * f, resolve(pasta, 'ic_launcher_frente.png'));
  renderizar(frente('#000000'), 108 * f, resolve(pasta, 'ic_launcher_monocromatico.png'));
}
console.log('Ícones gerados.');
