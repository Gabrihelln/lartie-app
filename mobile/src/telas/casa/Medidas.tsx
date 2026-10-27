import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { raios } from '@lartie/tokens';
import type { ParedeLivre } from '@lartie/modelo';
import {
  checarEncaixe,
  formatarMetros,
  lerMetros,
  moduloVisivel,
  percentualOcupado,
  validarMedidaComodo,
} from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { CampoTexto } from '../../componentes/CampoTexto';
import {
  BarraProgresso,
  Cartao,
  Divisoria,
  TelaPilha,
  TituloSecao,
} from '../../componentes/Estrutura';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { Icone } from '../../componentes/Icone';
import { LinhaComGestos } from '../../componentes/LinhaComGestos';
import { Texto } from '../../componentes/Texto';
import { atualizar } from '../../dados/gravacao';
import { useComodos, useItens } from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import type { ParamsRaiz } from '../../navegacao/tipos';
import { registrarEvento } from '../../servicos/analytics';
import { useConfiguracaoRemota } from '../../servicos/configuracaoRemota';
import { espacos, useTema } from '../../tema';
import { ModuloOculto } from '../inicio/ModuloOculto';

// T21 · Medidas do cômodo (Medidas.dc.html). Cada campo salva ao sair (sem botão), com vírgula
// decimal e entre 0,5 e 30 m. A vista de cima mostra, em escala, os móveis com medidas; o que não
// cabe na parede de destino fica em `error`. A sugestão de medidas pela foto da planta usa IA (P14).
// O modelo não guarda a posição dos móveis: na vista de cima eles são arrumados em fileiras.

export function Medidas() {
  const { modo } = useSessao();
  const [ocultoNaAbertura] = useState(() => !moduloVisivel(modo, 'casa'));
  if (ocultoNaAbertura) return <ModuloOculto modulo="casa" />;
  if (!moduloVisivel(modo, 'casa')) return null;
  return <TelaMedidas />;
}

type Movel = { id: string; nome: string; l: number; p: number; cabe: boolean };

/** Arruma os móveis em fileiras dentro do retângulo do cômodo (escala em cm). */
function arrumar(moveis: Movel[], larguraCm: number) {
  const pos: (Movel & { x: number; y: number })[] = [];
  let x = 0;
  let y = 0;
  let alturaFileira = 0;
  const folga = 20;
  for (const m of [...moveis].sort((a, b) => b.l * b.p - a.l * a.p)) {
    const l = Math.min(m.l, larguraCm);
    if (x > 0 && x + l > larguraCm) {
      x = 0;
      y += alturaFileira + folga;
      alturaFileira = 0;
    }
    pos.push({ ...m, l, x, y });
    x += l + folga;
    alturaFileira = Math.max(alturaFileira, m.p);
  }
  return pos;
}

function TelaMedidas() {
  const { cores } = useTema();
  const { params } = useRoute<RouteProp<ParamsRaiz, 'Medidas'>>();
  const { casalId } = useSessao();
  const { iaAtiva } = useConfiguracaoRemota();
  const { confirmar, erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const comodo = useComodos().dados.find(c => c.id === params.comodoId);
  const itens = useItens().dados.filter(i => i.comodo_id === params.comodoId);
  const [campos, setCampos] = useState({
    largura: '',
    comprimento: '',
    pe: '',
  });
  const [erros, setErros] = useState<Record<string, string | null>>({});
  const [parede, setParede] = useState<
    (Partial<ParedeLivre> & { texto: string }) | null
  >(null);
  const [desenho, setDesenho] = useState(0);
  const preenchido = useRef(false);
  const aoFalhar = () => erroAoSalvar();

  useEffect(() => {
    if (!comodo || preenchido.current) return;
    preenchido.current = true;
    setCampos({
      largura: comodo.largura_m ? formatarMetros(comodo.largura_m) : '',
      comprimento: comodo.comprimento_m
        ? formatarMetros(comodo.comprimento_m)
        : '',
      pe: comodo.pe_direito_m ? formatarMetros(comodo.pe_direito_m) : '',
    });
  }, [comodo]);

  if (!comodo) return <TelaPilha titulo="Medidas">{null}</TelaPilha>;

  const salvarCampo = (k: 'largura' | 'comprimento' | 'pe') => {
    if (!casalId) return;
    const valor = lerMetros(campos[k]);
    const erro =
      campos[k].trim() && valor === null
        ? 'Use números, por exemplo 4,20.'
        : validarMedidaComodo(valor);
    setErros(e => ({ ...e, [k]: erro }));
    if (erro) return;
    const campo = {
      largura: 'largura_m',
      comprimento: 'comprimento_m',
      pe: 'pe_direito_m',
    }[k] as 'largura_m' | 'comprimento_m' | 'pe_direito_m';
    if (valor === comodo[campo]) return;
    atualizar(casalId, 'comodos', comodo.id, { [campo]: valor }, aoFalhar);
    registrarEvento({ nome: 'medidas_salvas', params: {} });
  };

  const paredes = comodo.paredes_livres ?? [];
  const salvarParede = () => {
    if (!casalId || !parede) return;
    const largura = lerMetros(parede.texto);
    const nome = parede.nome?.trim();
    if (!nome || !largura || largura <= 0 || largura > 30) {
      avisos.mostrar({
        texto: 'Informem o nome e a largura livre (até 30 m).',
        tipo: 'erro',
      });
      return;
    }
    const nova: ParedeLivre = {
      id: parede.id ?? `p${Date.now().toString(36)}`,
      nome,
      largura_m: largura,
    };
    const lista = parede.id
      ? paredes.map(p => (p.id === parede.id ? nova : p))
      : [...paredes, nova];
    atualizar(
      casalId,
      'comodos',
      comodo.id,
      { paredes_livres: lista },
      aoFalhar,
    );
    setParede(null);
  };

  const excluirParede = async (p: ParedeLivre) => {
    if (!casalId) return;
    const ok = await confirmar({
      tom: 'destrutivo',
      titulo: `Excluir “${p.nome}”?`,
      texto: 'Os itens que iam para esta parede ficam sem destino.',
      cancelar: 'Cancelar',
      confirmar: 'Excluir',
    });
    if (!ok) return;
    atualizar(
      casalId,
      'comodos',
      comodo.id,
      { paredes_livres: paredes.filter(x => x.id !== p.id) },
      aoFalhar,
    );
  };

  // Vista de cima ----------------------------------------------------------------------------
  const moveis: Movel[] = itens
    .filter(i => i.medidas?.largura_cm && i.medidas?.profundidade_cm)
    .map(i => {
      const e = checarEncaixe(
        { nome: i.nome, largura_cm: i.medidas!.largura_cm },
        paredes.find(p => p.id === i.parede_destino) ?? null,
      );
      return {
        id: i.id,
        nome: i.nome,
        l: i.medidas!.largura_cm!,
        p: i.medidas!.profundidade_cm!,
        cabe: e ? e.cabe : true,
      };
    });
  const alertas = itens
    .map(i =>
      checarEncaixe(
        { nome: i.nome, largura_cm: i.medidas?.largura_cm ?? null },
        paredes.find(p => p.id === i.parede_destino) ?? null,
      ),
    )
    .filter(e => e && !e.cabe)
    .map(e => e!.alerta!);
  const ocupado = percentualOcupado(comodo, itens);
  const temMedidas = !!comodo.largura_m && !!comodo.comprimento_m;
  const larguraCm = (comodo.largura_m ?? 0) * 100;
  const comprimentoCm = (comodo.comprimento_m ?? 0) * 100;
  const escala = temMedidas && desenho ? desenho / larguraCm : 0;
  const posicoes = temMedidas ? arrumar(moveis, larguraCm) : [];

  return (
    <TelaPilha titulo={`Medidas · ${comodo.nome}`}>
      <View style={estilos.linha}>
        {(
          [
            ['largura', 'Largura (m)'],
            ['comprimento', 'Compr. (m)'],
            ['pe', 'Pé-direito (m)'],
          ] as const
        ).map(([k, rotulo]) => (
          <View key={k} style={estilos.flex}>
            <CampoTexto
              rotulo={rotulo}
              value={campos[k]}
              onChangeText={t =>
                setCampos(c => ({
                  ...c,
                  [k]: t.replace(/[^\d,.]/g, '').slice(0, 5),
                }))
              }
              onBlur={() => salvarCampo(k)}
              keyboardType="decimal-pad"
              placeholder="0,00"
              erro={erros[k]}
            />
          </View>
        ))}
      </View>

      {iaAtiva ? (
        <Cartao
          tracejado
          fundo="primaryContainer"
          onPress={() => {}}
          rotuloAcessivel="Enviar foto da planta para sugerir medidas"
        >
          <View style={estilos.linhaCentro}>
            <Icone nome="assistente" cor={cores.primary} />
            <Texto papel="nomeItem" peso="600" cor="primary">
              Enviar foto da planta para sugerir medidas
            </Texto>
          </View>
        </Cartao>
      ) : null}

      <Cartao style={estilos.vista}>
        <View style={estilos.linhaCentro}>
          <Texto papel="metadado" cor="onSurfaceVariant" style={estilos.flex}>
            Vista de cima
          </Texto>
          {temMedidas ? (
            <Texto papel="metadado" cor="onSurfaceVariant">
              {formatarMetros(comodo.largura_m!)} ×{' '}
              {formatarMetros(comodo.comprimento_m!)} m
            </Texto>
          ) : null}
        </View>
        {temMedidas ? (
          <View
            onLayout={(e: LayoutChangeEvent) =>
              setDesenho(e.nativeEvent.layout.width)
            }
            style={estilos.desenhoFora}
          >
            {escala ? (
              <View
                style={[
                  estilos.planta,
                  {
                    height: comprimentoCm * escala,
                    borderColor: cores.onSurface,
                    backgroundColor: cores.background,
                  },
                ]}
                accessible
                accessibilityLabel={`Planta de ${formatarMetros(
                  comodo.largura_m!,
                )} por ${formatarMetros(comodo.comprimento_m!)} metros com ${
                  moveis.length
                } móveis`}
              >
                {posicoes.map(m => (
                  <View
                    key={m.id}
                    style={[
                      estilos.movel,
                      {
                        left: m.x * escala,
                        top: m.y * escala,
                        width: m.l * escala,
                        height: Math.min(m.p, comprimentoCm) * escala,
                        backgroundColor: m.cabe
                          ? cores.homeContainer
                          : cores.errorContainer,
                        borderColor: m.cabe ? cores.homeContainer : cores.error,
                      },
                    ]}
                  >
                    <Texto
                      papel="ajuda"
                      peso="700"
                      cor={m.cabe ? 'onHomeContainer' : 'error'}
                      numberOfLines={1}
                    >
                      {m.nome} {formatarMetros(m.l / 100)}
                    </Texto>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <Texto papel="corpo" cor="onSurfaceVariant">
            Informem a largura e o comprimento para ver o cômodo em escala.
          </Texto>
        )}
        {ocupado !== null ? (
          <View style={estilos.linhaCentro}>
            <View style={estilos.flex}>
              <BarraProgresso
                fracao={ocupado / 100}
                cor={ocupado > 100 ? 'error' : 'primary'}
                trilho="surfaceVariant"
              />
            </View>
            <Texto papel="nomeItem" peso="700">
              {ocupado}% ocupado
            </Texto>
          </View>
        ) : null}
      </Cartao>

      {alertas.map(a => (
        <View
          key={a}
          style={[estilos.alerta, { backgroundColor: cores.errorContainer }]}
          accessibilityRole="alert"
        >
          <Icone nome="aviso" cor={cores.error} />
          <Texto papel="corpo" cor="error" style={estilos.flex}>
            {a}
          </Texto>
        </View>
      ))}

      <TituloSecao
        titulo="Paredes livres"
        link={{
          rotulo: '+ Adicionar',
          onPress: () => setParede({ nome: '', texto: '' }),
        }}
      />
      {paredes.length === 0 ? (
        <Texto papel="corpo" cor="onSurfaceVariant">
          Cadastrem as paredes ou espaços livres (por exemplo, “Parede da TV”)
          para conferir se os móveis cabem.
        </Texto>
      ) : (
        <Cartao semPadding>
          {paredes.map((p, i) => (
            <View key={p.id}>
              {i > 0 ? <Divisoria /> : null}
              <LinhaComGestos
                acoes={[
                  {
                    rotulo: 'Excluir',
                    fundo: 'error',
                    texto: 'onPrimary',
                    onPress: () => excluirParede(p),
                  },
                ]}
                acoesAcessiveis={[
                  {
                    nome: 'excluir',
                    rotulo: 'Excluir',
                    onAcao: () => excluirParede(p),
                  },
                ]}
              >
                {() => (
                  <Pressable
                    onPress={() =>
                      setParede({
                        id: p.id,
                        nome: p.nome,
                        texto: formatarMetros(p.largura_m),
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${p.nome}, ${formatarMetros(
                      p.largura_m,
                    )} metros livres`}
                    style={estilos.parede}
                  >
                    <Texto papel="corpo" style={estilos.flex}>
                      {p.nome}
                    </Texto>
                    <Texto papel="nomeItem" peso="700">
                      {formatarMetros(p.largura_m)} m
                    </Texto>
                  </Pressable>
                )}
              </LinhaComGestos>
            </View>
          ))}
        </Cartao>
      )}

      <FolhaInferior
        visivel={!!parede}
        titulo={parede?.id ? 'Parede livre' : 'Nova parede livre'}
        onFechar={() => setParede(null)}
      >
        <CampoTexto
          rotulo="Nome"
          placeholder="Parede da TV"
          value={parede?.nome ?? ''}
          onChangeText={t => setParede(x => x && { ...x, nome: t })}
          maxLength={40}
        />
        <CampoTexto
          rotulo="Largura livre (m)"
          placeholder="3,10"
          value={parede?.texto ?? ''}
          onChangeText={t =>
            setParede(
              x => x && { ...x, texto: t.replace(/[^\d,.]/g, '').slice(0, 5) },
            )
          }
          keyboardType="decimal-pad"
        />
        <Botao
          rotulo="Salvar"
          variante="casa"
          larguraTotal
          onPress={salvarParede}
        />
        {parede?.id ? (
          <Botao
            rotulo="Excluir"
            variante="destrutivo"
            larguraTotal
            onPress={() => {
              const p = paredes.find(x => x.id === parede.id);
              setParede(null);
              if (p) excluirParede(p);
            }}
          />
        ) : null}
      </FolhaInferior>
    </TelaPilha>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  linha: {
    flexDirection: 'row',
    gap: espacos.space3,
    alignItems: 'flex-start',
  },
  linhaCentro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space3,
  },
  vista: { gap: espacos.space3 },
  desenhoFora: { width: '100%' },
  planta: {
    width: '100%',
    borderWidth: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  movel: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: raios.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  alerta: {
    flexDirection: 'row',
    gap: espacos.space3,
    padding: espacos.space4,
    borderRadius: raios.radiusLg,
    alignItems: 'flex-start',
  },
  parede: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space3,
    padding: espacos.space4,
  },
});
