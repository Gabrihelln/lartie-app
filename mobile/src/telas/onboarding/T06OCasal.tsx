import React, { useState } from 'react';
import { Linking, Modal, StyleSheet, View } from 'react-native';
import { launchCamera, launchImageLibrary, type ImagePickerResponse } from 'react-native-image-picker';
import { Botao } from '../../componentes/Botao';
import { CampoTexto } from '../../componentes/CampoTexto';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { FotoCasal } from '../../componentes/FotoCasal';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { ExplicacaoPermissao } from '../../feedback/ExplicacaoPermissao';
import { enviarFotoCasal, removerFotoCasal } from '../../servicos/api';
import { armazenamento } from '../../servicos/armazenamento';
import { useConexao } from '../../servicos/conexao';
import { espacos } from '../../tema';
import { validarNome } from '../acesso/validacao';
import { TelaOnboarding, useOnboarding } from './comum';

// T06 · O casal (Ob1Casal.dc.html). Foto opcional; "Seu nome" pré-preenchido; "Nome do seu amor"
// obrigatório (vira nome_2 provisório até o parceiro entrar).

const CHAVE_EXPLICOU_CAMERA = 'permissao.camera.explicada';
const OPCOES_FOTO = { mediaType: 'photo', maxWidth: 1024, maxHeight: 1024, quality: 0.8, includeBase64: false } as const;

export function T06OCasal() {
  const { casal, avancar } = useOnboarding();
  const { online } = useConexao();
  const avisos = useAvisos();
  const { confirmar } = useDialogo();
  const [nome1, setNome1] = useState(casal?.nome_1 ?? '');
  const [nome2, setNome2] = useState(casal?.nome_2 ?? '');
  const [tocados, setTocados] = useState({ nome1: false, nome2: false });
  const [folha, setFolha] = useState(false);
  const [explicarCamera, setExplicarCamera] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const erro1 = validarNome(nome1);
  const erro2 = validarNome(nome2);
  const valido = !erro1 && !erro2;

  const tratarFoto = async (r: ImagePickerResponse) => {
    if (r.didCancel) return;
    if (r.errorCode === 'permission') {
      // T50 (texto adaptado: aqui a câmera é para a foto do casal).
      const abrir = await confirmar({
        icone: 'camera',
        titulo: 'Sem acesso à câmera',
        texto: 'Para tirar a foto do casal, permita o acesso à câmera nos Ajustes do celular.',
        cancelar: 'Agora não',
        confirmar: 'Abrir Ajustes',
      });
      if (abrir) Linking.openSettings();
      return;
    }
    const arquivo = r.assets?.[0];
    if (r.errorCode || !arquivo?.uri) {
      avisos.mostrar({ texto: 'Não foi possível usar esta foto. Tente outra.', tipo: 'erro' });
      return;
    }
    setEnviando(true);
    try {
      await enviarFotoCasal({ uri: arquivo.uri, tipo: arquivo.type ?? 'image/jpeg', nome: arquivo.fileName ?? 'foto.jpg' });
    } catch {
      avisos.mostrar({ texto: 'Não foi possível enviar a foto. Tente de novo.', tipo: 'erro' });
    } finally {
      setEnviando(false);
    }
  };

  const semConexao = () => avisos.mostrar({ texto: 'A foto precisa de internet. Dá para adicionar depois.', tipo: 'erro' });

  const tirarFoto = () => {
    setFolha(false);
    if (!online) return semConexao();
    // T58 antes do primeiro pedido nativo de câmera.
    if (!armazenamento.getBoolean(CHAVE_EXPLICOU_CAMERA)) return setExplicarCamera(true);
    launchCamera({ ...OPCOES_FOTO, saveToPhotos: false, cameraType: 'front' }).then(tratarFoto);
  };

  const escolherDaGaleria = () => {
    setFolha(false);
    if (!online) return semConexao();
    launchImageLibrary({ ...OPCOES_FOTO, selectionLimit: 1 }).then(tratarFoto);
  };

  const removerFoto = async () => {
    setFolha(false);
    if (!online) return semConexao();
    setEnviando(true);
    try {
      await removerFotoCasal();
    } catch {
      avisos.mostrar({ texto: 'Não foi possível remover a foto. Tente de novo.', tipo: 'erro' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <TelaOnboarding
      passo="T06"
      modo={null}
      titulo="Primeiro, quem são vocês?"
      subtitulo="Os nomes aparecem na tela inicial e na página de presentes."
      semVoltar
      rodape={
        <Botao
          rotulo="Continuar"
          larguraTotal
          desativado={!valido}
          onPress={() => avancar('T06', { nome_1: nome1.trim(), nome_2: nome2.trim() })}
        />
      }
    >
      <View style={estilos.foto}>
        <FotoCasal foto={casal?.foto} enviando={enviando} onPress={() => setFolha(true)} />
      </View>
      <CampoTexto
        rotulo="Seu nome"
        placeholder="Ana"
        value={nome1}
        onChangeText={setNome1}
        onBlur={() => setTocados((t) => ({ ...t, nome1: true }))}
        erro={tocados.nome1 ? erro1 : null}
        autoCapitalize="words"
        maxLength={40}
      />
      <CampoTexto
        rotulo="Nome do seu amor"
        placeholder="Pedro"
        value={nome2}
        onChangeText={setNome2}
        onBlur={() => setTocados((t) => ({ ...t, nome2: true }))}
        erro={tocados.nome2 ? erro2 : null}
        autoCapitalize="words"
        maxLength={40}
      />

      <FolhaInferior visivel={folha} titulo="Foto do casal" onFechar={() => setFolha(false)}>
        <Botao rotulo="Tirar foto" variante="tonal" icone="camera" larguraTotal onPress={tirarFoto} />
        <Botao rotulo="Escolher da galeria" variante="tonal" larguraTotal onPress={escolherDaGaleria} />
        {casal?.foto ? <Botao rotulo="Remover foto" variante="destrutivo" larguraTotal onPress={removerFoto} /> : null}
      </FolhaInferior>

      <Modal visible={explicarCamera} animationType="slide" onRequestClose={() => setExplicarCamera(false)}>
        <ExplicacaoPermissao
          tipo="camera"
          onPermitir={() => {
            armazenamento.set(CHAVE_EXPLICOU_CAMERA, true);
            setExplicarCamera(false);
            launchCamera({ ...OPCOES_FOTO, saveToPhotos: false, cameraType: 'front' }).then(tratarFoto);
          }}
          onAgoraNao={() => setExplicarCamera(false)}
        />
      </Modal>
    </TelaOnboarding>
  );
}

const estilos = StyleSheet.create({
  foto: { alignItems: 'center', marginVertical: espacos.space2 },
});
