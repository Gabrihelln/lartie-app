import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword } from '@react-native-firebase/auth';
import { Botao } from '../componentes/Botao';
import { Degrade } from '../componentes/Degrade';
import { MarcaLartie } from '../componentes/Logo';
import { Texto } from '../componentes/Texto';
import { ErroCampo } from '../componentes/CampoTexto';
import { auth } from '../servicos/firebase';
import { ambienteAtual } from '../servicos/ambiente';
import { espacos, useTema } from '../tema';

// Acesso provisório da Etapa 0 (substituído por T01 a T05 na Etapa 1).
// Entra com as contas de teste criadas por `npm run semear` nos emuladores (ambiente demo).
export const CONTAS_TESTE = {
  ana: { email: 'ana@teste.lartie.app', senha: 'lartie-teste' },
  pedro: { email: 'pedro@teste.lartie.app', senha: 'lartie-teste' },
} as const;

export function AcessoProvisorio() {
  const { margem } = useTema();
  const inset = useSafeAreaInsets();
  const [erro, setErro] = useState<string | null>(null);
  const demo = ambienteAtual() === 'demo';

  const entrar = async (quem: keyof typeof CONTAS_TESTE) => {
    setErro(null);
    try {
      await signInWithEmailAndPassword(auth(), CONTAS_TESTE[quem].email, CONTAS_TESTE[quem].senha);
    } catch {
      setErro('Não deu para entrar. Os emuladores estão rodando e as contas de teste foram criadas (npm run semear)?');
    }
  };

  return (
    <View style={estilos.raiz}>
      <Degrade nome="gradientOnboarding" aneis style={estilos.topo}>
        <View style={{ paddingTop: inset.top + espacos.space8, paddingHorizontal: margem + 4 }}>
          <MarcaLartie />
        </View>
      </Degrade>
      <View style={[estilos.corpo, { paddingHorizontal: margem, paddingBottom: inset.bottom + espacos.space10 }]}>
        <Texto papel="tituloTela" peso="700">
          Acesso provisório
        </Texto>
        <Texto papel="metadado" cor="onSurfaceVariant">
          O login de verdade (T01 a T05) chega na Etapa 1. Por enquanto, entre com uma das contas de teste para conferir a
          sincronização entre dois aparelhos.
        </Texto>
        {demo ? (
          <>
            <Botao rotulo="Entrar como Ana (noivo 1)" onPress={() => entrar('ana')} larguraTotal />
            <Botao rotulo="Entrar como Pedro (noivo 2)" onPress={() => entrar('pedro')} variante="contornado" larguraTotal />
          </>
        ) : (
          <Texto papel="metadado" cor="warning">
            Contas de teste só existem no ambiente demo (emuladores).
          </Texto>
        )}
        {erro ? <ErroCampo mensagem={erro} /> : null}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  topo: { height: 300 },
  corpo: { flex: 1, gap: espacos.space4, justifyContent: 'flex-end' },
});
