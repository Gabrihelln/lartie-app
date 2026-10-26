import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { raios } from '@lartie/tokens';
import { tokenAtual, urlApi } from '../servicos/api';
import { espacos, useTema } from '../tema';
import { Icone } from './Icone';
import { Texto } from './Texto';

// Foto do casal (T06). A foto fica na API (no Mac até a VPS existir) e só quem é do casal lê:
// a imagem é pedida com o token do Firebase.

/** Fonte da imagem com o token, para caminhos "/v1/arquivos/…" gravados em casal.foto. */
export function useFonteArquivo(caminho: string | null | undefined) {
  const [fonte, setFonte] = useState<{ uri: string; headers: Record<string, string> } | null>(null);
  useEffect(() => {
    let ativo = true;
    if (!caminho) {
      setFonte(null);
      return;
    }
    tokenAtual()
      .then((token) => ativo && setFonte({ uri: `${urlApi()}${caminho}`, headers: { Authorization: `Bearer ${token}` } }))
      .catch(() => ativo && setFonte(null));
    return () => {
      ativo = false;
    };
  }, [caminho]);
  return fonte;
}

interface Props {
  foto: string | null | undefined;
  enviando: boolean;
  onPress: () => void;
  tamanho?: number;
}

export function FotoCasal({ foto, enviando, onPress, tamanho = 112 }: Props) {
  const { cores } = useTema();
  const fonte = useFonteArquivo(foto);
  return (
    <View style={estilos.grupo}>
      <Pressable
        onPress={onPress}
        disabled={enviando}
        accessibilityRole="button"
        accessibilityLabel={foto ? 'Foto do casal. Toque para trocar ou remover' : 'Adicionar foto do casal (opcional)'}
        style={[
          estilos.circulo,
          { width: tamanho, height: tamanho, borderColor: cores.outlineAccent, borderStyle: foto ? 'solid' : 'dashed' },
        ]}
      >
        {fonte ? (
          <Image source={fonte} style={{ width: tamanho - 4, height: tamanho - 4, borderRadius: raios.radiusFull }} />
        ) : (
          <View style={estilos.vazio}>
            <Icone nome="camera" cor={cores.primary} tamanho={28} />
            <Texto papel="ajuda" peso="600" cor="primary">
              Foto do casal
            </Texto>
          </View>
        )}
        {enviando ? (
          <View style={[StyleSheet.absoluteFill, estilos.carregando, { backgroundColor: cores.scrim }]}>
            <ActivityIndicator color={cores.brandCream} accessibilityLabel="Enviando a foto" />
          </View>
        ) : null}
      </Pressable>
      <Texto papel="ajuda" cor="onSurfaceVariant">
        Opcional
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { alignItems: 'center', gap: espacos.space2 },
  circulo: { borderRadius: raios.radiusFull, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  vazio: { alignItems: 'center', gap: espacos.space1 },
  carregando: { alignItems: 'center', justifyContent: 'center', borderRadius: raios.radiusFull },
});
