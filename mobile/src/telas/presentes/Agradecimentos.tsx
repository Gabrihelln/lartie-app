import React, { useEffect, useState } from 'react';
import { Linking, Pressable, Share, StyleSheet, View } from 'react-native';
import { serverTimestamp } from '@react-native-firebase/firestore';
import {
  iniciais,
  modeloAgradecimentoPadrao,
  NOME_OCASIAO,
  preencherAgradecimento,
} from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { CampoSelecao } from '../../componentes/CampoSelecao';
import { CampoTexto } from '../../componentes/CampoTexto';
import {
  AvatarIniciais,
  Cartao,
  Divisoria,
  TelaPilha,
} from '../../componentes/Estrutura';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { Icone } from '../../componentes/Icone';
import { Selo } from '../../componentes/Selo';
import { Texto } from '../../componentes/Texto';
import { atualizar, emLote } from '../../dados/gravacao';
import { useAgradecimentos, useItens, useNomes } from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { EsqueletoLista } from '../../feedback/Esqueleto';
import { registrarEvento } from '../../servicos/analytics';
import { espacos, useTema } from '../../tema';
import { useConferirComodo } from '../casa/comum';

// T27 · Agradecimentos (Agradecimentos.dc.html). Modelo editável com [nome] e [presente], salvo no
// casal. "Agradecer" abre o WhatsApp do convidado com o modelo preenchido (sem número: o
// compartilhamento do sistema) e marca como agradecido. "+ Registrar presente": recebido fora da lista.

export function Agradecimentos() {
  const { cores, alvoToque } = useTema();
  const { casal, casalId } = useSessao();
  const { nome1 } = useNomes();
  const { erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const lista = useAgradecimentos();
  const [editar, setEditar] = useState(false);
  const [registrar, setRegistrar] = useState(false);
  const modelo =
    casal?.modelo_agradecimento ??
    modeloAgradecimentoPadrao(
      nome1,
      casal?.parceiro?.nome ?? casal?.nome_2 ?? null,
    );
  const aoFalhar = () => erroAoSalvar();

  if (lista.carregando) return <EsqueletoLista />;
  const pendentes = lista.dados.filter(a => !a.agradecido).length;
  const ordenados = [...lista.dados].sort(
    (a, b) =>
      Number(a.agradecido) - Number(b.agradecido) ||
      a.nome.localeCompare(b.nome, 'pt-BR'),
  );

  const agradecer = (a: (typeof lista.dados)[number]) => {
    if (!casalId) return;
    const texto = preencherAgradecimento(
      modelo,
      a.nome,
      a.presente_descricao.toLocaleLowerCase('pt-BR'),
    );
    if (a.whatsapp) {
      const d = a.whatsapp.replace(/\D/g, '');
      Linking.openURL(
        `https://wa.me/${
          d.startsWith('55') ? d : `55${d}`
        }?text=${encodeURIComponent(texto)}`,
      );
    } else {
      Share.share({ message: texto });
    }
    atualizar(
      casalId,
      'agradecimentos',
      a.id,
      { agradecido: true, agradecido_em: serverTimestamp() },
      aoFalhar,
    );
    registrarEvento({
      nome: 'agradecimento_enviado',
      params: { canal: a.whatsapp ? 'whatsapp' : 'sistema' },
    });
  };

  return (
    <TelaPilha
      titulo="Agradecimentos"
      tituloGrande
      direita={
        <Pressable
          onPress={() => setRegistrar(true)}
          accessibilityRole="button"
          accessibilityLabel="Registrar presente"
          style={{ minHeight: alvoToque, justifyContent: 'center' }}
        >
          <Icone nome="adicionar" cor={cores.primary} />
        </Pressable>
      }
    >
      <Texto papel="corpo" cor="onSurfaceVariant">
        {lista.dados.length === 0
          ? 'Os presentes recebidos aparecem aqui.'
          : `${pendentes} de ${lista.dados.length} ainda sem agradecimento`}
      </Texto>

      <Cartao style={estilos.modelo}>
        <View style={estilos.linhaCentro}>
          <Texto papel="nomeItem" peso="700" style={estilos.flex}>
            Modelo de mensagem
          </Texto>
          <Botao
            rotulo="Editar modelo"
            variante="texto"
            compacto
            onPress={() => setEditar(true)}
          />
        </View>
        <Texto papel="corpo" cor="onSurfaceVariant">
          {modelo}
        </Texto>
      </Cartao>

      {ordenados.length ? (
        <Cartao semPadding>
          {ordenados.map((a, i) => (
            <View key={a.id}>
              {i > 0 ? <Divisoria /> : null}
              <View style={estilos.pessoa}>
                <AvatarIniciais texto={iniciais(a.nome)} tamanho={40} />
                <View style={estilos.flex}>
                  <Texto papel="nomeItem" peso="700">
                    {a.nome}
                  </Texto>
                  <Texto papel="metadado" cor="onSurfaceVariant">
                    {a.presente_descricao}
                    {a.ocasiao ? ` · ${NOME_OCASIAO[a.ocasiao]}` : ''}
                  </Texto>
                </View>
                {a.agradecido ? (
                  <Pressable
                    onPress={() =>
                      casalId &&
                      atualizar(
                        casalId,
                        'agradecimentos',
                        a.id,
                        { agradecido: false, agradecido_em: null },
                        aoFalhar,
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${a.nome}: agradecido. Tocar para desmarcar`}
                  >
                    <Selo texto="Agradecido" tom="success" />
                  </Pressable>
                ) : (
                  <Botao
                    rotulo="Agradecer"
                    variante="whatsapp"
                    compacto
                    onPress={() => agradecer(a)}
                  />
                )}
              </View>
            </View>
          ))}
        </Cartao>
      ) : null}

      <FolhaModelo
        visivel={editar}
        modelo={modelo}
        onFechar={() => setEditar(false)}
        onSalvar={m => {
          if (casalId)
            atualizar(
              casalId,
              null,
              null,
              { modelo_agradecimento: m },
              aoFalhar,
            );
          setEditar(false);
          avisos.mostrar({ texto: 'Modelo salvo', tipo: 'sucesso' });
        }}
      />
      <FolhaRegistrar
        visivel={registrar}
        onFechar={() => setRegistrar(false)}
      />
    </TelaPilha>
  );
}

function FolhaModelo({
  visivel,
  modelo,
  onFechar,
  onSalvar,
}: {
  visivel: boolean;
  modelo: string;
  onFechar: () => void;
  onSalvar: (m: string) => void;
}) {
  const [texto, setTexto] = useState(modelo);
  useEffect(() => {
    if (visivel) setTexto(modelo);
  }, [visivel, modelo]);
  return (
    <FolhaInferior
      visivel={visivel}
      titulo="Modelo de mensagem"
      onFechar={onFechar}
    >
      <CampoTexto
        rotulo="Mensagem"
        value={texto}
        onChangeText={setTexto}
        multiline
        maxLength={500}
        ajuda="Use [nome] e [presente]: o app troca pelo nome de quem deu e pelo presente."
      />
      <Botao
        rotulo="Salvar"
        larguraTotal
        desativado={!texto.trim()}
        onPress={() => onSalvar(texto.trim())}
      />
    </FolhaInferior>
  );
}

/** "+ Registrar presente": recebido fora da lista; com item do enxoval, ele vira "Já tenho" (ganhado). */
function FolhaRegistrar({
  visivel,
  onFechar,
}: {
  visivel: boolean;
  onFechar: () => void;
}) {
  const { casalId } = useSessao();
  const { erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const conferir = useConferirComodo();
  const itens = useItens()
    .dados.filter(i => i.estado !== 'ja_tenho')
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const [nome, setNome] = useState('');
  const [presente, setPresente] = useState('');
  const [itemId, setItemId] = useState<string | null>(null);
  useEffect(() => {
    if (!visivel) return;
    setNome('');
    setPresente('');
    setItemId(null);
  }, [visivel]);
  const salvar = () => {
    if (!casalId) return;
    const item = itens.find(i => i.id === itemId);
    emLote(
      casalId,
      [
        {
          tipo: 'criar',
          sub: 'agradecimentos',
          dados: {
            reserva_id: null,
            item_id: itemId,
            nome: nome.trim(),
            presente_descricao: presente.trim() || item?.nome || '',
            whatsapp: null,
            ocasiao: null,
            agradecido: false,
            agradecido_em: null,
          },
        },
        ...(item
          ? [
              {
                tipo: 'atualizar' as const,
                sub: 'itens' as const,
                id: item.id,
                dados: {
                  estado: 'ja_tenho',
                  origem: 'ganhado',
                  quem_deu: nome.trim(),
                },
              },
            ]
          : []),
      ],
      'registrar presente',
      () => erroAoSalvar(),
    );
    if (item) conferir(item.comodo_id, { [item.id]: { estado: 'ja_tenho' } });
    avisos.mostrar({ texto: 'Presente registrado', tipo: 'sucesso' });
    onFechar();
  };
  return (
    <FolhaInferior
      visivel={visivel}
      titulo="Registrar presente"
      onFechar={onFechar}
    >
      <CampoTexto
        rotulo="Quem deu"
        value={nome}
        onChangeText={setNome}
        autoCapitalize="words"
        maxLength={60}
      />
      <CampoTexto
        rotulo="Presente"
        value={presente}
        onChangeText={setPresente}
        maxLength={80}
      />
      <CampoSelecao
        rotulo="Item do enxoval (opcional)"
        placeholder="Nenhum"
        opcoes={itens.map(i => ({ valor: i.id, rotulo: i.nome }))}
        valor={itemId}
        onMudar={setItemId}
      />
      <Botao
        rotulo="Salvar"
        larguraTotal
        desativado={!nome.trim() || (!presente.trim() && !itemId)}
        onPress={salvar}
      />
    </FolhaInferior>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  linhaCentro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space3,
  },
  modelo: { gap: espacos.space2 },
  pessoa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space3,
    padding: espacos.space4,
  },
});
