import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { caminhos, type Imovel } from '@lartie/modelo';
import { Botao } from '../../componentes/Botao';
import { CaixaSelecao } from '../../componentes/CaixaSelecao';
import { CampoCidade, type Cidade } from '../../componentes/CampoCidade';
import { CampoMesAno, formatarMesAno, lerMesAno } from '../../componentes/CamposMascarados';
import { Contador } from '../../componentes/Contador';
import { EscolhaUnica } from '../../componentes/EscolhaUnica';
import { Texto } from '../../componentes/Texto';
import { atualizar, gravarImovel } from '../../dados/gravacao';
import { useDocumento } from '../../dados/leitura';
import { espacos } from '../../tema';
import { TelaOnboarding, useOnboarding } from './comum';

// T08 · Casa nova (Ob3Casa.dc.html). A cidade só aparece no modo "casa" (no modo "os_dois" veio do T07).
// Moradores: 2 (o T08 não pergunta; a especificação prevê "2 + pessoas informadas").

const MORADORES_PADRAO = 2;

export const TEXTOS_T08 = {
  cidade: 'Informe a cidade para ajustarmos o clima.',
  mudanca: 'Use o formato mês/ano, por exemplo 05/2027.',
} as const;

export function T08Casa() {
  const { casal, casalId, modo, avancar, aoFalhar } = useOnboarding();
  const imovel = useDocumento<Imovel>(casalId ? caminhos.imovel(casalId) : null).dados;
  const pedeCidade = modo === 'casa';

  const [tipo, setTipo] = useState<Imovel['tipo']>(imovel?.tipo ?? 'apartamento');
  const [quartos, setQuartos] = useState(imovel?.quartos ?? 2);
  const [banheiros, setBanheiros] = useState(imovel?.banheiros ?? 1);
  const [posse, setPosse] = useState<Imovel['posse']>(imovel?.posse ?? 'alugado');
  const [mobiliado, setMobiliado] = useState<Imovel['mobiliado']>(imovel?.mobiliado ?? 'nao');
  const [mudanca, setMudanca] = useState(formatarMesAno(imovel?.data_mudanca ?? null));
  const [pets, setPets] = useState(imovel?.tem_pets ?? false);
  const [cidade, setCidade] = useState<Cidade | null>(casal?.cidade && casal.uf ? { cidade: casal.cidade, uf: casal.uf } : null);
  const [tentou, setTentou] = useState(false);

  // Voltar mantém os dados: quando o imóvel já gravado chega do cache, preenche os campos uma vez.
  const preenchido = useRef(false);
  useEffect(() => {
    if (!imovel || preenchido.current) return;
    preenchido.current = true;
    setTipo(imovel.tipo);
    setQuartos(imovel.quartos);
    setBanheiros(imovel.banheiros);
    setPosse(imovel.posse);
    setMobiliado(imovel.mobiliado);
    setMudanca(formatarMesAno(imovel.data_mudanca));
    setPets(imovel.tem_pets);
  }, [imovel]);

  const erroCidade = pedeCidade && !cidade ? TEXTOS_T08.cidade : null;
  const erroMudanca = mudanca && !lerMesAno(mudanca) ? TEXTOS_T08.mudanca : null;

  const continuar = () => {
    setTentou(true);
    if (erroCidade || erroMudanca || !casalId) return;
    gravarImovel(
      casalId,
      {
        tipo,
        quartos,
        banheiros,
        posse,
        mobiliado,
        data_mudanca: lerMesAno(mudanca),
        tem_pets: pets,
        moradores: imovel?.moradores ?? MORADORES_PADRAO,
      },
      !!imovel,
      aoFalhar,
    );
    if (pedeCidade && cidade) atualizar(casalId, null, null, { cidade: cidade.cidade, uf: cidade.uf }, aoFalhar);
    avancar('T08');
  };

  return (
    <TelaOnboarding
      passo="T08"
      titulo="E a casa nova?"
      subtitulo="Assim criamos os cômodos e as quantidades certas."
      rodape={<Botao rotulo="Continuar" larguraTotal onPress={continuar} />}
    >
      <EscolhaUnica
        rotulo="Tipo de imóvel"
        opcoes={[
          { valor: 'apartamento', rotulo: 'Apartamento' },
          { valor: 'casa', rotulo: 'Casa' },
        ]}
        selecionado={tipo}
        onMudar={setTipo}
      />
      <View style={estilos.linha}>
        <Contador rotulo="Quartos" valor={quartos} onMudar={setQuartos} minimo={1} maximo={6} />
        <Contador rotulo="Banheiros" valor={banheiros} onMudar={setBanheiros} minimo={1} maximo={6} />
      </View>
      <EscolhaUnica
        rotulo="O imóvel é"
        opcoes={[
          { valor: 'alugado', rotulo: 'Alugado' },
          { valor: 'proprio', rotulo: 'Próprio' },
        ]}
        selecionado={posse}
        onMudar={setPosse}
      />
      <EscolhaUnica
        rotulo="Vem mobiliado?"
        opcoes={[
          { valor: 'sim', rotulo: 'Sim' },
          { valor: 'em_parte', rotulo: 'Em parte' },
          { valor: 'nao', rotulo: 'Não' },
        ]}
        selecionado={mobiliado}
        onMudar={setMobiliado}
      />
      <View style={[estilos.linha, estilos.base]}>
        <CampoMesAno rotulo="Data da mudança" texto={mudanca} onMudarTexto={setMudanca} erro={tentou ? erroMudanca : null} />
        <View style={estilos.pets}>
          <CaixaSelecao marcada={pets} onMudar={setPets} rotuloAcessivel="Temos pets">
            <Texto papel="nomeItem">Temos pets</Texto>
          </CaixaSelecao>
        </View>
      </View>
      {pedeCidade ? <CampoCidade valor={cidade} onMudar={setCidade} erro={tentou ? erroCidade : null} /> : null}
    </TelaOnboarding>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', gap: espacos.space3 },
  base: { alignItems: 'flex-end' },
  pets: { flex: 1, paddingBottom: espacos.space2 },
});
