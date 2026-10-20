// Converte o design system (tokens.json + degradês de tokens.css) para o formato usado no app.
// Nomes: o token "on-primary-container" vira a chave "onPrimaryContainer"; "space-4" vira "space4".

export function camelCase(nome) {
  return nome.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

const px = (valor) => {
  const m = /^(-?[\d.]+)px$/.exec(String(valor).trim());
  if (!m) throw new Error(`Valor em px inválido: ${valor}`);
  return Number(m[1]);
};

function cores(json) {
  const claro = {};
  const escuro = {};
  for (const t of json.color.tokens) {
    claro[camelCase(t.name)] = t.value.light;
    escuro[camelCase(t.name)] = t.value.dark;
  }
  return { claro, escuro };
}

function escala(lista, conversor = px) {
  const saida = {};
  for (const t of lista) saida[camelCase(t.name)] = conversor(t.value);
  return saida;
}

function tipografia(json) {
  const grupos = { ios: {}, android: {}, marca: {} };
  for (const grupo of json.type.groups) {
    const destino = grupo.family === 'ios' ? 'ios' : grupo.family === 'android' ? 'android' : 'marca';
    for (const s of grupo.styles) {
      const tamanho = px(s.fontSize);
      const altura = s.lineHeight === '1' ? tamanho : px(s.lineHeight);
      const nome = camelCase(s.name.replace(/^(ios|md)-/, ''));
      grupos[destino][nome] = {
        fontSize: tamanho,
        lineHeight: altura,
        fontWeight: String(s.fontWeight),
        letterSpacing: px(s.letterSpacing),
        familia: s.family ?? grupo.family,
      };
    }
  }
  return grupos;
}

function sombras(json) {
  const claro = {};
  const escuro = {};
  for (const t of json.shadow.tokens) {
    const nome = camelCase(t.name);
    const valor = typeof t.value === 'string' ? { light: t.value, dark: t.value } : t.value;
    claro[nome] = valor.light === 'none' ? null : valor.light;
    escuro[nome] = valor.dark === 'none' ? null : valor.dark;
  }
  return { claro, escuro };
}

// Degradês: só existem em tokens.css. Formato: linear-gradient(Ndeg, var(--token) P%, ...),
// opcionalmente precedido de um radial-gradient(circle at X% Y%, cor, cor P%) (brilho do ícone).
function lerVariavelCss(css, nome) {
  const m = new RegExp(`--${nome}:\\s*([^;]+);`).exec(css);
  if (!m) throw new Error(`Degradê não encontrado em tokens.css: ${nome}`);
  return m[1].trim();
}

function parseLinear(texto) {
  const m = /linear-gradient\((\d+)deg,\s*(.+)\)\s*$/.exec(texto);
  if (!m) throw new Error(`linear-gradient inválido: ${texto}`);
  const paradas = m[2].split(/,\s*(?=var\()/).map((p) => {
    const pm = /var\(--([a-z0-9-]+)\)\s+([\d.]+)%/.exec(p);
    if (!pm) throw new Error(`Parada inválida: ${p}`);
    return { cor: camelCase(pm[1]), posicao: Number(pm[2]) / 100 };
  });
  return { angulo: Number(m[1]), paradas };
}

function parseRadial(texto) {
  const m = /radial-gradient\(circle at ([\d.]+)% ([\d.]+)%,\s*(rgba\([^)]+\)),\s*(rgba\([^)]+\))\s+([\d.]+)%\)/.exec(texto);
  if (!m) throw new Error(`radial-gradient inválido: ${texto}`);
  return {
    centroX: Number(m[1]) / 100,
    centroY: Number(m[2]) / 100,
    corInicio: m[3].replace(/\s/g, ''),
    corFim: m[4].replace(/\s/g, ''),
    raio: Number(m[5]) / 100,
  };
}

function degrades(css) {
  const saida = {};
  for (const nome of ['gradient-icon', 'gradient-splash', 'gradient-onboarding']) {
    const valor = lerVariavelCss(css, nome);
    const corte = valor.indexOf('linear-gradient(');
    const brilho = corte > 0 ? parseRadial(valor.slice(0, corte)) : null;
    saida[camelCase(nome)] = { ...parseLinear(valor.slice(corte)), brilho };
  }
  return saida;
}

export function converter(json, css) {
  const radius = {};
  for (const t of json.radius.tokens) {
    radius[camelCase(t.name)] = t.value.endsWith('%') ? Number(t.value.slice(0, -1)) / 100 : px(t.value);
  }
  return {
    versao: json.version,
    cores: cores(json),
    espacos: escala(json.spacing.tokens),
    raios: radius,
    tamanhos: escala(json.size.tokens),
    tipografia: tipografia(json),
    familias: json.type.families,
    sombras: sombras(json),
    degrades: degrades(css),
  };
}
