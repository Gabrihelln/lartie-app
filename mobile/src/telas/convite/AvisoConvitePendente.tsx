import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { raios } from '@lartie/tokens';
import { Botao } from '../../componentes/Botao';
import { Icone } from '../../componentes/Icone';
import { Texto } from '../../componentes/Texto';
import { espacos, useTema } from '../../tema';
import { conviteGuardado, esquecerConvitePendente } from './Convite';

// T03 e T04 depois do T66 (correção da Etapa 2): deixa claro que a conta vai entrar no plano de quem
// convidou, e permite desistir. Sem isto, um convite guardado de um teste anterior era usado em silêncio.
export function AvisoConvitePendente() {
  const { cores } = useTema();
  const [convite, setConvite] = useState(() => conviteGuardado());
  if (!convite) return null;
  return (
    <View style={[estilos.caixa, { backgroundColor: cores.primaryContainer }]} accessibilityRole="summary">
      <View style={estilos.linha}>
        <Icone nome="coracao" cor={cores.onPrimaryContainer} tamanho={20} />
        <Texto papel="metadado" cor="onPrimaryContainer" style={estilos.texto}>
          Você vai entrar no plano de {convite.nome_1}. Vocês vão ver e editar o mesmo plano.
        </Texto>
      </View>
      <Botao
        rotulo="Não usar este convite"
        variante="texto"
        compacto
        onPress={() => {
          esquecerConvitePendente();
          setConvite(null);
        }}
        style={estilos.botao}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { borderRadius: raios.radiusMd, padding: espacos.space3, gap: espacos.space1 },
  linha: { flexDirection: 'row', gap: espacos.space2, alignItems: 'flex-start' },
  texto: { flex: 1 },
  botao: { alignSelf: 'flex-start' },
});
