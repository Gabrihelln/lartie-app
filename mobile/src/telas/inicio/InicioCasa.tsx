import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { raios } from '@lartie/tokens';
import { FASES_ITEM, type FaseItem } from '@lartie/modelo';
import {
  diferencaEmDias,
  FASES_ENXOVAL,
  faseAtualEnxoval,
  hojeLocal,
  mesAnoPorExtenso,
  mesesAte,
  percentual,
  progressoCasa,
} from '@lartie/regras';
import { formatarReais } from '../../componentes/CamposMascarados';
import { BarraProgresso, Cartao, Divisoria, TituloSecao } from '../../componentes/Estrutura';
import { Icone, type NomeIcone } from '../../componentes/Icone';
import { Selo } from '../../componentes/Selo';
import { Texto } from '../../componentes/Texto';
import { useComodos, useImovel, useItens } from '../../dados/plano';
import { Esqueleto } from '../../feedback/Esqueleto';
import { useConfiguracaoRemota } from '../../servicos/configuracaoRemota';
import { espacos, useTema } from '../../tema';
import { CartaoConvite, type NavegacaoInicio } from './Inicio';

// T12c · Início: só casa nova (InicioCasa.dc.html). Os toques abrem T18, T19, T20 e T21.

/** O cadastro por foto (T22) usa IA: fica escondido enquanto a IA estiver fora do escopo (P14). */
const PROVISORIA_FOTO = { titulo: 'Cadastrar por foto', id: 'T22', etapa: 9 } as const;

/** "Apê de 2 quartos" / "Casa de 1 quarto". */
export function resumoImovel(tipo: 'apartamento' | 'casa', quartos: number) {
  return `${tipo === 'apartamento' ? 'Apê' : 'Casa'} de ${quartos} ${quartos === 1 ? 'quarto' : 'quartos'}`;
}

/** "Mudança em {n} meses" (ou "{n} dias" se faltar menos de 60). Mês/ano vale como dia 1 do mês. */
function quandoMuda(mesAno: string, hoje: string) {
  const dias = diferencaEmDias(hoje, `${mesAno}-01`);
  if (dias < 60) return Math.max(0, dias) === 1 ? '1 dia' : `${Math.max(0, dias)} dias`;
  const meses = mesesAte(hoje, mesAno);
  return meses === 1 ? '1 mês' : `${meses} meses`;
}

function Atalho({ icone, texto, fundo, onPress }: { icone: NomeIcone; texto: string; fundo: 'home' | 'homeContainer'; onPress: () => void }) {
  const { cores } = useTema();
  return (
    <Cartao onPress={onPress} rotuloAcessivel={texto} style={estilos.atalho}>
      <View style={[estilos.circulo, { backgroundColor: cores[fundo] }]}>
        <Icone nome={icone} cor={fundo === 'home' ? cores.onPrimary : cores.home} />
      </View>
      <Texto papel="nomeItem" peso="700" style={estilos.flex}>
        {texto}
      </Texto>
    </Cartao>
  );
}

export function InicioCasa() {
  const { cores } = useTema();
  const navigation = useNavigation<NavegacaoInicio>();
  const { iaAtiva } = useConfiguracaoRemota();
  const imovel = useImovel();
  const itens = useItens();
  const comodos = useComodos().dados;
  if (itens.carregando || imovel.carregando) return <Esqueleto />;

  const hoje = hojeLocal();
  const total = progressoCasa(itens.dados);
  const pct = percentual(total);
  const fase = faseAtualEnxoval(itens.dados);
  const im = imovel.dados;
  const nomeComodo = new Map(comodos.map((c) => [c.id, c.nome]));

  // Os 4 cômodos com mais itens faltando.
  const porComodo = comodos
    .map((c) => {
      const doComodo = itens.dados.filter((i) => i.comodo_id === c.id);
      return { comodo: c, ...progressoCasa(doComodo), faltam: doComodo.filter((i) => i.estado === 'falta').length };
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.faltam - a.faltam || a.comodo.ordem - b.comodo.ordem)
    .slice(0, 4);

  // "Faltam para a primeira noite": itens "Falta" da fase atual (até 3).
  const faltam = fase ? itens.dados.filter((i) => i.fase === fase && i.estado === 'falta').slice(0, 3) : [];
  const tituloFaltam: Record<FaseItem, string> = {
    primeira_noite: 'Faltam para a primeira noite',
    primeiro_mes: 'Faltam para o primeiro mês',
    com_calma: 'Faltam para depois, com calma',
  };

  const semComodoComMedidas = [...comodos].sort((a, b) => a.ordem - b.ordem).find((c) => c.largura_m === null);

  return (
    <>
      <Pressable onPress={() => navigation.navigate('casa')} accessibilityRole="button" accessibilityLabel={`Casa nova: ${pct}%, ${total.feitos} de ${total.total} itens`}>
        <View style={[estilos.mudanca, { backgroundColor: cores.home }]}>
          <View style={estilos.linhaTopo}>
            <View style={estilos.flex}>
              {im?.data_mudanca ? (
                <>
                  <Texto papel="corpo" cor="onPrimary">
                    Mudança em
                  </Texto>
                  <Texto papel="numeroDestaque" peso="700" cor="onPrimary">
                    {quandoMuda(im.data_mudanca, hoje)}
                  </Texto>
                  <Texto papel="corpo" cor="onPrimary">
                    {mesAnoPorExtenso(im.data_mudanca)} · {resumoImovel(im.tipo, im.quartos)}
                  </Texto>
                </>
              ) : (
                <>
                  <Texto papel="tituloDestaque" peso="700" cor="onPrimary">
                    Data da mudança a definir
                  </Texto>
                  <Pressable onPress={() => navigation.navigate('DadosCasa')} accessibilityRole="link" hitSlop={8}>
                    <Texto papel="corpo" peso="600" cor="onPrimary" style={estilos.sublinhado}>
                      Definir
                    </Texto>
                  </Pressable>
                </>
              )}
            </View>
            <View style={estilos.percentual}>
              <Texto papel="numeroDestaque" peso="700" cor="onPrimary">
                {pct}%
              </Texto>
              <Texto papel="metadado" cor="onPrimary">
                {total.feitos} de {total.total} itens
              </Texto>
            </View>
          </View>
          <BarraProgresso fracao={pct / 100} cor="onPrimary" trilho="homeContainer" />
        </View>
      </Pressable>

      <View style={estilos.linha}>
        {FASES_ITEM.map((f) => {
          const c = progressoCasa(itens.dados, f);
          const atual = f === fase;
          return (
            <Pressable
              key={f}
              onPress={() => navigation.navigate('casa', { fase: f })}
              accessibilityRole="button"
              accessibilityLabel={`${FASES_ENXOVAL[f]}: ${c.feitos} de ${c.total}${atual ? ', fase atual' : ''}`}
              style={[
                estilos.fase,
                atual
                  ? { backgroundColor: cores.inverseSurface, borderColor: cores.inverseSurface }
                  : { backgroundColor: cores.surface, borderColor: cores.outlineVariant },
              ]}
            >
              <Texto papel="metadado" peso="700" cor={atual ? 'onInverseSurface' : 'onSurface'}>
                {FASES_ENXOVAL[f]}
              </Texto>
              <Texto papel="metadado" cor={atual ? 'onInverseSurface' : 'onSurfaceVariant'}>
                {c.feitos} de {c.total}
              </Texto>
            </Pressable>
          );
        })}
      </View>

      <View style={estilos.linha}>
        {/* O cadastro por foto usa IA: escondido enquanto a IA estiver fora do escopo (P14). */}
        {iaAtiva ? <Atalho icone="camera" texto="Cadastrar por foto" fundo="home" onPress={() => navigation.navigate('Provisoria', PROVISORIA_FOTO)} /> : null}
        <Atalho
          icone="medidas"
          texto="Medidas dos cômodos"
          fundo="homeContainer"
          onPress={() => {
            // T21 do primeiro cômodo sem medidas; todos com medidas: a Casa, para escolher o cômodo.
            const alvo = semComodoComMedidas ?? null;
            if (alvo) navigation.navigate('Medidas', { comodoId: alvo.id });
            else navigation.navigate('casa');
          }}
        />
      </View>

      <TituloSecao titulo="Cômodos" link={{ rotulo: 'Ver todos', onPress: () => navigation.navigate('casa') }} />
      <View style={estilos.grade}>
        {porComodo.map((c) => (
          <Cartao
            key={c.comodo.id}
            onPress={() => navigation.navigate('Comodo', { id: c.comodo.id })}
            rotuloAcessivel={`${c.comodo.nome}: ${c.feitos} de ${c.total} itens`}
            style={estilos.celula}
          >
            <Texto papel="nomeItem" peso="700" numberOfLines={1}>
              {c.comodo.nome}
            </Texto>
            <Texto papel="metadado" cor="onSurfaceVariant">
              {c.feitos} de {c.total} itens
            </Texto>
            <BarraProgresso fracao={c.total ? c.feitos / c.total : 0} cor="home" trilho="homeContainer" altura={6} />
          </Cartao>
        ))}
      </View>

      {fase && faltam.length ? (
        <>
          <TituloSecao titulo={tituloFaltam[fase]} />
          <Cartao semPadding>
            {faltam.map((i, n) => (
              <View key={i.id}>
                {n > 0 ? <Divisoria /> : null}
                <Pressable
                  onPress={() => navigation.navigate('Item', { id: i.id })}
                  accessibilityRole="button"
                  accessibilityLabel={`${i.nome}, falta`}
                  style={estilos.item}
                >
                  <View style={estilos.flex}>
                    <Texto papel="nomeItem" peso="700">
                      {i.nome}
                    </Texto>
                    <Texto papel="metadado" cor="onSurfaceVariant">
                      {nomeComodo.get(i.comodo_id) ?? ''} ·{' '}
                      {i.quantidade > 1 ? `${i.quantidade} un` : i.preco_estimado ? formatarReais(i.preco_estimado) : '1 un'}
                    </Texto>
                  </View>
                  <Selo texto="Falta" tom="warning" />
                </Pressable>
              </View>
            ))}
          </Cartao>
        </>
      ) : null}

      <CartaoConvite
        texto="Vão casar também?"
        onPress={() => navigation.navigate('ConfigModo', { preSelecionado: 'os_dois', origem: 'cartao' })}
      />
    </>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  mudanca: { borderRadius: raios.radiusXl, padding: espacos.space5, gap: espacos.space4 },
  linhaTopo: { flexDirection: 'row', alignItems: 'flex-end', gap: espacos.space3 },
  percentual: { alignItems: 'flex-end' },
  sublinhado: { textDecorationLine: 'underline', marginTop: espacos.space2 },
  linha: { flexDirection: 'row', gap: espacos.space3 },
  fase: { flex: 1, borderRadius: raios.radiusLg, borderWidth: 1, padding: espacos.space3, gap: espacos.space1 },
  atalho: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: espacos.space3, padding: espacos.space3 },
  circulo: { width: 44, height: 44, borderRadius: raios.radiusFull, alignItems: 'center', justifyContent: 'center' },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.space3 },
  celula: { width: '48%', flexGrow: 1, gap: espacos.space2 },
  item: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3, padding: espacos.space4 },
});
