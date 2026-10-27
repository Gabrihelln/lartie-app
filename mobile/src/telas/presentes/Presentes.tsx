import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { raios, tamanhos } from '@lartie/tokens';
import type { ListaPresentes, Ocasiao } from '@lartie/modelo';
import {
  dataPorExtenso,
  daOcasiao,
  NOME_OCASIAO,
  ocasioesDoModo,
  resumoPresentes,
  sugerirSlugLista,
  validarSlugLista,
} from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { CampoData } from '../../componentes/CampoData';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Chip } from '../../componentes/Chip';
import { BarraProgresso, Cartao, TelaAba } from '../../componentes/Estrutura';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { Icone } from '../../componentes/Icone';
import { Selo } from '../../componentes/Selo';
import { Texto } from '../../componentes/Texto';
import { criarComId, novoId } from '../../dados/gravacao';
import {
  useAgradecimentos,
  useListaItens,
  useListas,
  useReservas,
} from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { EsqueletoLista } from '../../feedback/Esqueleto';
import { EstadoVazio } from '../../feedback/EstadoVazio';
import { registrarEvento } from '../../servicos/analytics';
import { armazenamento } from '../../servicos/armazenamento';
import { ErroApi, ErroSemConexao, publicarLista } from '../../servicos/api';
import { espacos, useTema } from '../../tema';
import { CHAVE_VISITA_PRESENTES } from '../inicio/Inicio';
import { FolhaCompartilhar, useLinkDaLista } from './comum';
import * as C from '../../feedback/confirmacoes';

// T23 · Presentes (Presentes.dc.html). Resumo de todas as listas, um cartão por lista, "+ Nova lista"
// (ocasiões conforme o modo, 13.9 regra 4) e Agradecimentos. Vazio: T60. Publicar: T39.

type ListaComId = ListaPresentes & { id: string };

/** T39 · "Publicar a lista do {ocasião}?" → servidor → T65. */
export function usePublicarLista() {
  const { confirmar } = useDialogo();
  const avisos = useAvisos();
  return async (lista: ListaComId, depois: () => void) => {
    const ok = await confirmar(C.publicarLista(daOcasiao(lista.ocasiao)));
    if (!ok) return;
    try {
      await publicarLista(lista.id);
      registrarEvento({
        nome: 'lista_publicada',
        params: { ocasiao: lista.ocasiao },
      });
      avisos.mostrar({ texto: 'Lista publicada', tipo: 'sucesso' });
      depois();
    } catch (erro) {
      if (erro instanceof ErroSemConexao)
        return avisos.mostrar({
          texto: 'Publicar a lista precisa de internet.',
          tipo: 'erro',
        });
      if (erro instanceof ErroApi && erro.codigo === 'slug_em_uso')
        return avisos.mostrar({
          texto:
            'Já existe uma lista com este endereço. Mudem em "Editar lista".',
          tipo: 'erro',
        });
      avisos.mostrar({
        texto: 'Não foi possível publicar. Tentem de novo.',
        tipo: 'erro',
      });
    }
  };
}

function CartaoLista({
  lista,
  reservados,
  total,
  onCompartilhar,
}: {
  lista: ListaComId;
  reservados: number;
  total: number;
  onCompartilhar: () => void;
}) {
  const navigation = useNavigation();
  const publicar = usePublicarLista();
  const publicada = lista.status === 'publicada';
  return (
    <Cartao style={estilos.cartao}>
      <View style={estilos.linhaTopo}>
        <View style={estilos.flex}>
          <Texto papel="tituloSecao" peso="700">
            {NOME_OCASIAO[lista.ocasiao]}
          </Texto>
          <Texto papel="metadado" cor="onSurfaceVariant">
            {lista.data_evento ? dataPorExtenso(lista.data_evento) : 'Sem data'}
          </Texto>
        </View>
        {publicada ? (
          <Selo texto="Publicada" tom="success" />
        ) : (
          <Selo
            texto={
              lista.status === 'despublicada' ? 'Despublicada' : 'Rascunho'
            }
            tom="primary"
          />
        )}
      </View>
      <View style={estilos.linhaTopo}>
        <View style={estilos.flex}>
          <BarraProgresso
            fracao={total ? reservados / total : 0}
            cor="info"
            trilho="infoContainer"
            altura={6}
          />
        </View>
        <Texto papel="metadado" peso="700">
          {reservados} de {total} reservados
        </Texto>
      </View>
      <View style={estilos.linha}>
        <View style={estilos.flex}>
          <Botao
            rotulo="Gerenciar"
            variante="contornado"
            larguraTotal
            onPress={() => navigation.navigate('Lista', { id: lista.id })}
          />
        </View>
        <View style={estilos.flex}>
          {publicada ? (
            <Botao
              rotulo="Ver como convidado"
              variante="tonal"
              larguraTotal
              onPress={onCompartilhar}
            />
          ) : (
            <Botao
              rotulo="Publicar link"
              variante="tonal"
              larguraTotal
              onPress={() => publicar(lista, onCompartilhar)}
            />
          )}
        </View>
      </View>
    </Cartao>
  );
}

export function Presentes() {
  const { cores, alvoToque } = useTema();
  const navigation = useNavigation();
  const { casal, casalId, modo } = useSessao();
  const { erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const listas = useListas();
  const listaItens = useListaItens().dados;
  const reservas = useReservas().dados;
  const agradecimentos = useAgradecimentos().dados;
  const [nova, setNova] = useState(false);
  const [compartilhar, setCompartilhar] = useState<ListaComId | null>(null);

  // Atalho "reservas novas" do Início: conta a partir da última visita.
  useFocusEffect(
    React.useCallback(() => {
      armazenamento.set(CHAVE_VISITA_PRESENTES, Date.now());
    }, []),
  );

  if (listas.carregando) {
    return (
      <TelaAba titulo="Presentes">
        <EsqueletoLista />
      </TelaAba>
    );
  }

  const ordenadas = [...listas.dados].sort((a, b) =>
    (a.data_evento ?? '9999').localeCompare(b.data_evento ?? '9999'),
  );
  const resumo = resumoPresentes(listaItens, reservas);
  const semAgradecimento = agradecimentos.filter(a => !a.agradecido).length;

  return (
    <TelaAba
      cabecalho={
        <View style={estilos.cabecalho}>
          <Texto
            papel="tituloAba"
            accessibilityRole="header"
            style={estilos.flex}
          >
            Presentes
          </Texto>
          {listas.dados.length ? (
            <Botao
              rotulo="+ Nova lista"
              compacto
              onPress={() => setNova(true)}
            />
          ) : null}
        </View>
      }
      onAtualizar={() => {}}
    >
      {listas.dados.length === 0 ? (
        <EstadoVazio tipo="presentes" onPrincipal={() => setNova(true)} />
      ) : (
        <>
          <View style={estilos.linha}>
            {(
              [
                [resumo.reservados, 'reservados'],
                [resumo.recebidos, 'recebidos'],
                [resumo.faltam, 'ainda faltam'],
              ] as const
            ).map(([n, rotulo]) => (
              <Cartao
                key={rotulo}
                style={estilos.numero}
                rotuloAcessivel={`${n} ${rotulo}`}
              >
                <Texto papel="tituloDestaque" peso="700" alinhamento="center">
                  {n}
                </Texto>
                <Texto
                  papel="metadado"
                  cor="onSurfaceVariant"
                  alinhamento="center"
                >
                  {rotulo}
                </Texto>
              </Cartao>
            ))}
          </View>
          {ordenadas.map(l => {
            const daLista = listaItens.filter(i => i.lista_id === l.id);
            const r = resumoPresentes(
              daLista,
              reservas.filter(x => x.lista_id === l.id),
            );
            return (
              <CartaoLista
                key={l.id}
                lista={l}
                reservados={r.reservados + r.recebidos}
                total={r.total}
                onCompartilhar={() => setCompartilhar(l)}
              />
            );
          })}
          <Pressable
            onPress={() => navigation.navigate('Agradecimentos')}
            accessibilityRole="button"
            style={[
              estilos.agradecimentos,
              {
                backgroundColor: cores.primaryContainer,
                minHeight: alvoToque + espacos.space6,
              },
            ]}
          >
            <Icone nome="coracao" cor={cores.onPrimaryContainer} />
            <View style={estilos.flex}>
              <Texto papel="nomeItem" peso="700" cor="onPrimaryContainer">
                Agradecimentos
              </Texto>
              <Texto papel="metadado" cor="onPrimaryContainer">
                {semAgradecimento === 0
                  ? 'Tudo agradecido por aqui'
                  : `${semAgradecimento} ${
                      semAgradecimento === 1
                        ? 'presente ainda sem agradecimento'
                        : 'presentes ainda sem agradecimento'
                    }`}
              </Texto>
            </View>
            <Icone nome="setaDireita" cor={cores.onPrimaryContainer} />
          </Pressable>
        </>
      )}

      <FolhaNovaLista
        visivel={nova}
        onFechar={() => setNova(false)}
        ocasioes={ocasioesDoModo(modo)}
        existentes={listas.dados.map(l => l.slug_lista)}
        slugCasal={casal?.slug ?? null}
        onCriar={dados => {
          if (!casalId) return;
          const id = novoId(casalId, 'listas_presentes');
          criarComId(
            casalId,
            'listas_presentes',
            id,
            {
              ...dados,
              status: 'rascunho',
              modo_surpresa: false,
              endereco_entrega: null,
              mensagem: null,
            },
            () => erroAoSalvar(),
          );
          registrarEvento({
            nome: 'lista_criada',
            params: { ocasiao: dados.ocasiao },
          });
          avisos.mostrar({ texto: 'Lista criada', tipo: 'sucesso' });
          setNova(false);
          navigation.navigate('Lista', { id });
          navigation.navigate('AdicionarItens', { listaId: id });
        }}
      />
      <FolhaCompartilhar
        lista={compartilhar}
        visivel={!!compartilhar}
        onFechar={() => setCompartilhar(null)}
      />
    </TelaAba>
  );
}

/** Folha "Nova lista" (T23): ocasião, data do evento e endereço do link, único no casal. */
export function FolhaNovaLista({
  visivel,
  onFechar,
  ocasioes,
  existentes,
  slugCasal,
  onCriar,
  inicial,
  rotulo = 'Criar e escolher itens',
}: {
  visivel: boolean;
  onFechar: () => void;
  ocasioes: Ocasiao[];
  existentes: string[];
  slugCasal: string | null;
  onCriar: (d: {
    ocasiao: Ocasiao;
    data_evento: string | null;
    slug_lista: string;
  }) => void;
  inicial?: {
    ocasiao: Ocasiao;
    data_evento: string | null;
    slug_lista: string;
  };
  rotulo?: string;
}) {
  const [ocasiao, setOcasiao] = useState<Ocasiao>(
    inicial?.ocasiao ?? ocasioes[0] ?? 'cha_panela',
  );
  const [data, setData] = useState<string | null>(inicial?.data_evento ?? null);
  const [slug, setSlug] = useState(
    inicial?.slug_lista ??
      sugerirSlugLista(ocasioes[0] ?? 'cha_panela', existentes),
  );
  const [mexeuNoSlug, setMexeuNoSlug] = useState(!!inicial);
  useEffect(() => {
    if (!visivel) return;
    setOcasiao(inicial?.ocasiao ?? ocasioes[0] ?? 'cha_panela');
    setData(inicial?.data_evento ?? null);
    setSlug(
      inicial?.slug_lista ??
        sugerirSlugLista(ocasioes[0] ?? 'cha_panela', existentes),
    );
    setMexeuNoSlug(!!inicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visivel]);
  const erro = validarSlugLista(slug, existentes);
  // Ocasiões de listas antigas continuam valendo na edição, mesmo fora do modo atual (13.9 regra 4).
  const opcoes =
    inicial && !ocasioes.includes(inicial.ocasiao)
      ? [inicial.ocasiao, ...ocasioes]
      : ocasioes;
  return (
    <FolhaInferior
      visivel={visivel}
      titulo={inicial ? 'Editar lista' : 'Nova lista'}
      onFechar={onFechar}
    >
      <View style={estilos.grupo}>
        <Texto papel="rotuloCampo">Ocasião</Texto>
        <View style={estilos.chips} accessibilityRole="radiogroup">
          {opcoes.map(o => (
            <Chip
              key={o}
              rotulo={NOME_OCASIAO[o]}
              selecionado={ocasiao === o}
              onPress={() => {
                setOcasiao(o);
                if (!mexeuNoSlug) setSlug(sugerirSlugLista(o, existentes));
              }}
            />
          ))}
        </View>
      </View>
      <CampoData
        rotulo="Data do evento (opcional)"
        valor={data}
        onMudar={setData}
      />
      <CampoTexto
        rotulo="Endereço do link"
        value={slug}
        onChangeText={t => {
          setMexeuNoSlug(true);
          setSlug(
            t
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, '')
              .slice(0, 40),
          );
        }}
        autoCapitalize="none"
        autoCorrect={false}
        ajuda={slugCasal ? `lartie.app/${slugCasal}/${slug}` : undefined}
        erro={erro}
      />
      <Botao
        rotulo={rotulo}
        larguraTotal
        desativado={!!erro}
        onPress={() =>
          onCriar({ ocasiao, data_evento: data, slug_lista: slug })
        }
      />
    </FolhaInferior>
  );
}

/** Link mostrado nos cartões e no T24 (útil para testes). */
export { useLinkDaLista };

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space3,
    minHeight: tamanhos.fab,
  },
  linha: { flexDirection: 'row', gap: espacos.space3 },
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space3,
  },
  numero: { flex: 1, paddingVertical: espacos.space3 },
  cartao: { gap: espacos.space3 },
  agradecimentos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space3,
    padding: espacos.space4,
    borderRadius: raios.radiusXl,
  },
  grupo: { gap: espacos.space2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.space2 },
});
