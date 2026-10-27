import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Modal, PermissionsAndroid, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Contacts from 'react-native-contacts';
import { raios, tamanhos } from '@lartie/tokens';
import { agruparPorSobrenome } from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { Cartao, Divisoria, TelaPilha } from '../../componentes/Estrutura';
import { Icone } from '../../componentes/Icone';
import { Texto } from '../../componentes/Texto';
import { emLote, novoId, type OperacaoLote } from '../../dados/gravacao';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { ExplicacaoPermissao } from '../../feedback/ExplicacaoPermissao';
import { registrarEvento } from '../../servicos/analytics';
import { armazenamento } from '../../servicos/armazenamento';
import { espacos, estiloTexto, useTema } from '../../tema';

// T28 "Importar contatos": T59 na primeira vez → pedido nativo → seletor com busca e seleção
// múltipla → um grupo por contato ou agrupar por sobrenome (pergunta). Sem permissão: "Abrir Ajustes".

const CHAVE_EXPLICOU = 'permissao.contatos.explicada';

async function pedirPermissao(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
    return r === PermissionsAndroid.RESULTS.GRANTED;
  }
  const atual = await Contacts.checkPermission();
  if (atual === 'authorized' || atual === 'limited') return true;
  const r = await Contacts.requestPermission();
  return r === 'authorized' || r === 'limited';
}

/** Começa a importação a partir do T28 ou do T61. */
export function useImportarContatos() {
  const navigation = useNavigation();
  const { confirmar } = useDialogo();
  const [explicar, setExplicar] = useState(false);

  const seguir = async () => {
    if (await pedirPermissao()) return navigation.navigate('ImportarContatos');
    const abrir = await confirmar({
      icone: 'contatos',
      titulo: 'Sem acesso aos contatos',
      texto: 'Para importar da agenda, permitam o acesso aos contatos nos Ajustes do celular. Ou adicionem os grupos à mão.',
      cancelar: 'Agora não',
      confirmar: 'Abrir Ajustes',
    });
    if (abrir) Linking.openSettings();
  };

  const comecar = () => {
    if (!armazenamento.getBoolean(CHAVE_EXPLICOU)) return setExplicar(true);
    seguir();
  };

  const elementos = (
    <Modal visible={explicar} animationType="slide" onRequestClose={() => setExplicar(false)}>
      <ExplicacaoPermissao
        tipo="contatos"
        onPermitir={() => {
          armazenamento.set(CHAVE_EXPLICOU, true);
          setExplicar(false);
          seguir();
        }}
        onAgoraNao={() => {
          setExplicar(false);
          navigation.navigate('Grupo', {});
        }}
      />
    </Modal>
  );
  return { comecar, elementos };
}

interface ContatoSimples {
  id: string;
  nome: string;
  telefone: string | null;
}

export function ImportarContatos() {
  const { cores, alvoToque } = useTema();
  const navigation = useNavigation();
  const { casalId } = useSessao();
  const { confirmar, erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const [contatos, setContatos] = useState<ContatoSimples[] | null>(null);
  const [busca, setBusca] = useState('');
  const [marcados, setMarcados] = useState<Set<string>>(new Set());

  useEffect(() => {
    Contacts.getAllWithoutPhotos()
      .then((lista) =>
        setContatos(
          lista
            .map((c) => ({
              id: c.recordID,
              nome: (c.displayName || [c.givenName, c.familyName].filter(Boolean).join(' ')).trim(),
              telefone: c.phoneNumbers.find((t) => t.label === 'mobile')?.number ?? c.phoneNumbers[0]?.number ?? null,
            }))
            .filter((c) => c.nome)
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
        ),
      )
      .catch(() => setContatos([]));
  }, []);

  const visiveis = useMemo(() => {
    const t = busca.trim().toLocaleLowerCase('pt-BR');
    return (contatos ?? []).filter((c) => !t || c.nome.toLocaleLowerCase('pt-BR').includes(t)).slice(0, 300);
  }, [contatos, busca]);

  const importar = async () => {
    if (!casalId || !contatos) return;
    const escolhidos = contatos.filter((c) => marcados.has(c.id));
    const porSobrenome = await confirmar({
      icone: 'convidados',
      titulo: 'Como criar os grupos?',
      texto: 'Agrupar junta quem tem o mesmo sobrenome num grupo "Família {sobrenome}". Ou cada contato vira um grupo.',
      cancelar: 'Um grupo por contato',
      confirmar: 'Agrupar por sobrenome',
    });
    const grupos = porSobrenome ? agruparPorSobrenome(escolhidos) : escolhidos.map((c) => ({ nome: c.nome, pessoas: [c] }));
    const ops: OperacaoLote[] = [];
    for (const g of grupos) {
      const id = novoId(casalId, 'grupos');
      const telefone = g.pessoas.find((p) => p.telefone)?.telefone?.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '') ?? null;
      ops.push({
        tipo: 'criar',
        sub: 'grupos',
        id,
        dados: { nome: g.nome.slice(0, 60), lado: 'os_dois', tipo: 'familia', whatsapp: telefone, convite_enviado_em: null, ultimo_lembrete_em: null, recado: null, respondido_em: null },
      });
      for (const p of g.pessoas) {
        ops.push({ tipo: 'criar', sub: 'convidados', dados: { grupo_id: id, nome: p.nome.slice(0, 60), faixa: 'adulto', presenca: 'sem_resposta', restricao_alimentar: 'nenhuma', restricao_outra: null } });
      }
    }
    for (let i = 0; i < ops.length; i += 400) emLote(casalId, ops.slice(i, i + 400), 'importar contatos', () => erroAoSalvar());
    registrarEvento({ nome: 'contatos_importados', params: { contatos: escolhidos.length, agrupados: porSobrenome ? 1 : 0 } });
    avisos.mostrar({ texto: `${grupos.length} ${grupos.length === 1 ? 'grupo criado' : 'grupos criados'}. Confiram o lado e o tipo de cada um.`, tipo: 'sucesso' });
    navigation.goBack();
  };

  return (
    <TelaPilha titulo="Importar contatos" rodape={<Botao rotulo={`Importar ${marcados.size}`} larguraTotal desativado={marcados.size === 0} onPress={importar} />}>
      <View style={[estilos.busca, { backgroundColor: cores.surface, borderColor: cores.outlineSoft, minHeight: tamanhos.fieldHeight }]}>
        <Icone nome="busca" cor={cores.onSurfaceVariant} />
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar"
          placeholderTextColor={cores.onSurfaceVariant}
          accessibilityLabel="Buscar contato"
          style={[estiloTexto('corpo'), estilos.flex, { color: cores.onSurface }]}
        />
      </View>
      {contatos === null ? (
        <ActivityIndicator color={cores.primary} />
      ) : contatos.length === 0 ? (
        <Texto papel="corpo" cor="onSurfaceVariant">
          Nenhum contato encontrado.
        </Texto>
      ) : (
        <Cartao semPadding>
          {visiveis.map((c, i) => {
            const marcado = marcados.has(c.id);
            return (
              <View key={c.id}>
                {i > 0 ? <Divisoria /> : null}
                <Pressable
                  onPress={() =>
                    setMarcados((m) => {
                      const n = new Set(m);
                      if (marcado) n.delete(c.id);
                      else n.add(c.id);
                      return n;
                    })
                  }
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: marcado }}
                  style={[estilos.linha, { minHeight: alvoToque + espacos.space2 }]}
                >
                  <Icone nome={marcado ? 'caixaMarcada' : 'caixaVazia'} cor={marcado ? cores.primary : cores.outline} />
                  <View style={estilos.flex}>
                    <Texto papel="nomeItem">{c.nome}</Texto>
                    {c.telefone ? (
                      <Texto papel="metadado" cor="onSurfaceVariant">
                        {c.telefone}
                      </Texto>
                    ) : null}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </Cartao>
      )}
    </TelaPilha>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  busca: { flexDirection: 'row', alignItems: 'center', gap: espacos.space2, borderWidth: 1, borderRadius: raios.radiusMd, paddingHorizontal: espacos.space3 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3, paddingHorizontal: espacos.space4 },
});
