import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { raios } from '@lartie/tokens';
import municipios from '../../../dados/municipios.json';
import { espacos, useTema } from '../tema';
import { CampoTexto } from './CampoTexto';
import { Texto } from './Texto';

// Campo "Cidade" com sugestões (T07 e T08): lista de municípios do IBGE (dados/municipios.json).
// Só vale uma cidade escolhida da lista ("Curitiba, PR"): é ela que define o clima do enxoval.

export interface Cidade {
  cidade: string;
  uf: string;
}

const LISTA = (municipios as unknown as { municipios: [string, string][] }).municipios;
const sem = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
const INDICE = LISTA.map(([cidade, uf]) => ({ cidade, uf, chave: sem(cidade) }));

export const rotuloCidade = (c: Cidade) => `${c.cidade}, ${c.uf}`;

/** Até 6 sugestões: primeiro as que começam com o texto, depois as que o contêm. */
export function sugerirCidades(texto: string, limite = 6): Cidade[] {
  const [nome = '', uf] = texto.split(',').map((p) => p.trim());
  const busca = sem(nome);
  if (busca.length < 2) return [];
  const ufBusca = uf?.toUpperCase();
  const comecam: Cidade[] = [];
  const contem: Cidade[] = [];
  for (const m of INDICE) {
    if (ufBusca && !m.uf.startsWith(ufBusca)) continue;
    if (m.chave.startsWith(busca)) comecam.push(m);
    else if (m.chave.includes(busca)) contem.push(m);
    if (comecam.length >= limite) break;
  }
  return [...comecam, ...contem].slice(0, limite).map(({ cidade, uf: u }) => ({ cidade, uf: u }));
}

interface Props {
  rotulo?: string;
  valor: Cidade | null;
  onMudar: (cidade: Cidade | null) => void;
  erro?: string | null;
  onBlur?: () => void;
}

export function CampoCidade({ rotulo = 'Cidade', valor, onMudar, erro, onBlur }: Props) {
  const { cores, alvoToque } = useTema();
  const [texto, setTexto] = useState(valor ? rotuloCidade(valor) : '');
  const [aberto, setAberto] = useState(false);
  const sugestoes = useMemo(() => (aberto ? sugerirCidades(texto) : []), [texto, aberto]);

  return (
    <View style={estilos.grupo}>
      <CampoTexto
        rotulo={rotulo}
        placeholder="Curitiba, PR"
        value={texto}
        onChangeText={(t) => {
          setTexto(t);
          setAberto(true);
          if (valor && t !== rotuloCidade(valor)) onMudar(null);
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => {
          // Dá tempo de o toque na sugestão chegar antes de fechar a lista.
          setTimeout(() => setAberto(false), 150);
          onBlur?.();
        }}
        erro={erro}
        autoCorrect={false}
        autoCapitalize="words"
        textContentType="addressCity"
      />
      {sugestoes.length > 0 ? (
        <View
          style={[estilos.lista, { backgroundColor: cores.surface, borderColor: cores.outlineVariant }]}
          accessibilityLabel="Sugestões de cidade"
        >
          {sugestoes.map((c) => (
            <Pressable
              key={rotuloCidade(c)}
              onPress={() => {
                onMudar(c);
                setTexto(rotuloCidade(c));
                setAberto(false);
              }}
              accessibilityRole="button"
              style={[estilos.sugestao, { minHeight: alvoToque, borderBottomColor: cores.divider }]}
            >
              <Texto papel="corpo">{rotuloCidade(c)}</Texto>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espacos.space1, flex: 1 },
  lista: { borderWidth: 1, borderRadius: raios.radiusMd, overflow: 'hidden' },
  sugestao: { justifyContent: 'center', paddingHorizontal: espacos.space4, borderBottomWidth: StyleSheet.hairlineWidth },
});
