import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { serverTimestamp } from '@react-native-firebase/firestore';
import { raios } from '@lartie/tokens';
import { caminhos, type Grupo as TipoGrupo, type Lado, type TipoGrupo as Tipo } from '@lartie/modelo';
import { moduloVisivel } from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { CampoTexto } from '../../componentes/CampoTexto';
import { mascararTelefone } from '../../componentes/CamposMascarados';
import { EscolhaUnica } from '../../componentes/EscolhaUnica';
import { Cartao, TelaPilha } from '../../componentes/Estrutura';
import { LinhaComGestos } from '../../componentes/LinhaComGestos';
import { Texto } from '../../componentes/Texto';
import { emLote, novoId, type OperacaoLote } from '../../dados/gravacao';
import { useDocumento } from '../../dados/leitura';
import { useConvidados, useNomes } from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { useDescartarAlteracoes } from '../../feedback/useDescartarAlteracoes';
import type { ParamsRaiz } from '../../navegacao/tipos';
import { registrarEvento } from '../../servicos/analytics';
import { useConexao } from '../../servicos/conexao';
import { espacos, estiloTexto, useTema } from '../../tema';
import { ModuloOculto } from '../inicio/ModuloOculto';
import { abrirWhatsApp, useMensagensRsvp, type GrupoComId } from './comum';

// T29 · Grupo de convidados (NovoGrupo.dc.html), criar e editar. Pelo menos 1 pessoa com nome.
// "Salvar e enviar convite" salva, gera o link do grupo e abre o WhatsApp com a mensagem pronta.
// Arrastar uma pessoa para a esquerda remove (com "Desfazer"). Voltar com alterações: T36.

type Pessoa = { chave: string; id: string | null; nome: string; faixa: 'adulto' | 'crianca' };

let contador = 0;
const novaChave = () => `nova-${Date.now()}-${contador++}`;

export function Grupo() {
  const { modo } = useSessao();
  const [ocultoNaAbertura] = useState(() => !moduloVisivel(modo, 'convidados'));
  if (ocultoNaAbertura) return <ModuloOculto modulo="casamento" />;
  if (!moduloVisivel(modo, 'convidados')) return null;
  return <TelaGrupo />;
}

function TelaGrupo() {
  const { cores, alvoToque } = useTema();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<ParamsRaiz, 'Grupo'>>();
  const { casalId } = useSessao();
  const { nome1, nome2 } = useNomes();
  const { online } = useConexao();
  const { confirmar, erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const mensagens = useMensagensRsvp();
  const novo = !params?.id;
  const id = useMemo(() => params?.id ?? (casalId ? novoId(casalId, 'grupos') : ''), [params?.id, casalId]);
  const leitura = useDocumento<TipoGrupo>(casalId && !novo ? caminhos.documento(casalId, 'grupos', id) : null);
  const grupo = leitura.dados;
  const todas = useConvidados().dados;
  const daqui = useMemo(() => todas.filter((p) => p.grupo_id === id), [todas, id]);

  const [nome, setNome] = useState('');
  const [lado, setLado] = useState<Lado>('os_dois');
  const [tipo, setTipo] = useState<Tipo>('familia');
  const [whatsapp, setWhatsapp] = useState('');
  const [pessoas, setPessoas] = useState<Pessoa[]>([{ chave: novaChave(), id: null, nome: '', faixa: 'adulto' }]);
  const [tentou, setTentou] = useState(false);
  const inicial = useRef<string>('');
  const liberado = useRef(false);
  const preenchido = useRef(false);
  const ultimoCampo = useRef<TextInput | null>(null);

  useEffect(() => {
    if (preenchido.current) return;
    if (novo) {
      preenchido.current = true;
      inicial.current = JSON.stringify(['', 'os_dois', 'familia', '', [{ nome: '', faixa: 'adulto' }]]);
      return;
    }
    if (!grupo || leitura.carregando) return;
    preenchido.current = true;
    const lista = daqui.map((p) => ({ chave: p.id, id: p.id, nome: p.nome, faixa: p.faixa })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    setNome(grupo.nome);
    setLado(grupo.lado);
    setTipo(grupo.tipo);
    setWhatsapp(grupo.whatsapp ? mascararTelefone(grupo.whatsapp) : '');
    setPessoas(lista.length ? lista : [{ chave: novaChave(), id: null, nome: '', faixa: 'adulto' }]);
    inicial.current = JSON.stringify([grupo.nome, grupo.lado, grupo.tipo, grupo.whatsapp ? mascararTelefone(grupo.whatsapp) : '', lista.map((p) => ({ nome: p.nome, faixa: p.faixa }))]);
  }, [grupo, leitura.carregando, daqui, novo]);

  const atual = JSON.stringify([nome, lado, tipo, whatsapp, pessoas.map((p) => ({ nome: p.nome, faixa: p.faixa }))]);
  useDescartarAlteracoes({ temAlteracoes: preenchido.current && atual !== inicial.current, oQue: 'este grupo', liberado });

  if (!novo && leitura.carregando) return <TelaPilha titulo="Grupo de convidados">{null}</TelaPilha>;
  if (!novo && !grupo) {
    return (
      <TelaPilha titulo="Grupo de convidados">
        <Texto papel="corpo" cor="onSurfaceVariant">
          Este grupo foi excluído.
        </Texto>
      </TelaPilha>
    );
  }

  const comNome = pessoas.filter((p) => p.nome.trim());
  const erros = {
    nome: nome.trim() ? null : 'Informe o nome do grupo.',
    pessoas: comNome.length ? null : 'Adicionem pelo menos 1 pessoa com nome.',
    whatsapp: !whatsapp || whatsapp.replace(/\D/g, '').length >= 10 ? null : 'Confira o número com o DDD.',
  };
  const valido = !erros.nome && !erros.pessoas && !erros.whatsapp;
  const aoFalhar = () => erroAoSalvar();

  const mudarPessoa = (chave: string, campos: Partial<Pessoa>) => setPessoas((l) => l.map((p) => (p.chave === chave ? { ...p, ...campos } : p)));
  const removerPessoa = (p: Pessoa) => {
    const antes = pessoas;
    setPessoas((l) => l.filter((x) => x.chave !== p.chave));
    avisos.comDesfazer(`${p.nome.trim() || 'Pessoa'} removida`, () => setPessoas(antes));
  };

  /** Grava o grupo e as pessoas num lote (offline também). */
  const gravar = () => {
    if (!casalId) return;
    const ops: OperacaoLote[] = [];
    const dadosGrupo = { nome: nome.trim(), lado, tipo, whatsapp: whatsapp.replace(/\D/g, '') || null };
    if (novo) ops.push({ tipo: 'criar', sub: 'grupos', id, dados: { ...dadosGrupo, convite_enviado_em: null, ultimo_lembrete_em: null, recado: null, respondido_em: null } });
    else ops.push({ tipo: 'atualizar', sub: 'grupos', id, dados: dadosGrupo });
    const ficam = new Set(comNome.map((p) => p.id).filter(Boolean));
    for (const p of daqui) if (!ficam.has(p.id)) ops.push({ tipo: 'excluir', sub: 'convidados', id: p.id });
    for (const p of comNome) {
      if (p.id) {
        const antes = daqui.find((x) => x.id === p.id);
        if (antes && (antes.nome !== p.nome.trim() || antes.faixa !== p.faixa)) ops.push({ tipo: 'atualizar', sub: 'convidados', id: p.id, dados: { nome: p.nome.trim(), faixa: p.faixa } });
      } else {
        ops.push({ tipo: 'criar', sub: 'convidados', dados: { grupo_id: id, nome: p.nome.trim().slice(0, 60), faixa: p.faixa, presenca: 'sem_resposta', restricao_alimentar: 'nenhuma', restricao_outra: null } });
      }
    }
    emLote(casalId, ops, 'salvar grupo', aoFalhar);
    if (novo) registrarEvento({ nome: 'grupo_criado', params: { pessoas: comNome.length } });
    liberado.current = true;
  };

  const soSalvar = () => {
    setTentou(true);
    if (!valido) return;
    gravar();
    navigation.goBack();
    avisos.mostrar({ texto: 'Grupo salvo', tipo: 'sucesso' });
  };

  const salvarEEnviar = async () => {
    setTentou(true);
    if (!valido) return;
    const numero = whatsapp.replace(/\D/g, '');
    if (!numero) {
      avisos.mostrar({ texto: 'Informem o WhatsApp do grupo para enviar o convite.', tipo: 'erro' });
      return;
    }
    if (!online) {
      gravar();
      navigation.goBack();
      avisos.mostrar({ texto: 'Grupo salvo. O convite precisa de internet: enviem depois.', tipo: 'erro' });
      return;
    }
    gravar();
    try {
      const [m] = await mensagens([{ ...(grupo as TipoGrupo), id, nome: nome.trim(), whatsapp: numero } as GrupoComId], 'convite');
      await abrirWhatsApp(numero, m!.texto);
      if (casalId) emLote(casalId, [{ tipo: 'atualizar', sub: 'grupos', id, dados: { convite_enviado_em: serverTimestamp() } }], 'convite enviado');
      registrarEvento({ nome: 'convite_rsvp_enviado', params: {} });
      navigation.goBack();
    } catch {
      navigation.goBack();
      avisos.mostrar({ texto: 'Grupo salvo, mas não foi possível preparar o convite. Tentem de novo.', tipo: 'erro' });
    }
  };

  const excluirGrupo = async () => {
    if (!casalId) return;
    const ok = await confirmar({
      icone: 'excluir',
      tom: 'destrutivo',
      titulo: `Excluir ${nome.trim() || 'este grupo'} e ${daqui.length} ${daqui.length === 1 ? 'pessoa' : 'pessoas'}?`,
      texto: 'O link de confirmação deste grupo deixa de funcionar. Não dá para desfazer.',
      cancelar: 'Cancelar',
      confirmar: 'Excluir',
    });
    if (!ok) return;
    liberado.current = true;
    emLote(casalId, [...daqui.map((p) => ({ tipo: 'excluir' as const, sub: 'convidados' as const, id: p.id })), { tipo: 'excluir', sub: 'grupos', id }], 'excluir grupo', aoFalhar);
    navigation.goBack();
    avisos.mostrar({ texto: 'Grupo excluído' });
  };

  return (
    <TelaPilha
      titulo="Grupo de convidados"
      rodape={
        <>
          <Botao rotulo="Salvar e enviar convite" variante="whatsapp" larguraTotal onPress={salvarEEnviar} />
          <Botao rotulo="Só salvar" variante="texto" larguraTotal onPress={soSalvar} />
        </>
      }
    >
      <CampoTexto rotulo="Nome do grupo" value={nome} onChangeText={setNome} placeholder="Família Souza" maxLength={60} autoCapitalize="words" erro={tentou ? erros.nome : null} />
      <EscolhaUnica
        rotulo="Lado"
        opcoes={[
          { valor: 'noivo_1', rotulo: nome1 },
          { valor: 'noivo_2', rotulo: nome2 },
          { valor: 'os_dois', rotulo: 'Os dois' },
        ]}
        selecionado={lado}
        onMudar={setLado}
      />
      <EscolhaUnica
        rotulo="Tipo"
        opcoes={[
          { valor: 'familia', rotulo: 'Família' },
          { valor: 'amigos', rotulo: 'Amigos' },
          { valor: 'trabalho', rotulo: 'Trabalho' },
        ]}
        selecionado={tipo}
        onMudar={setTipo}
      />
      <CampoTexto
        rotulo="WhatsApp para o convite"
        value={whatsapp}
        onChangeText={(t) => setWhatsapp(mascararTelefone(t))}
        placeholder="(41) 99999-0000"
        keyboardType="phone-pad"
        maxLength={15}
        erro={tentou ? erros.whatsapp : null}
      />

      <View style={estilos.linhaCentro}>
        <Texto papel="rotuloCampo" style={estilos.flex}>
          Pessoas ({comNome.length})
        </Texto>
        <Pressable
          onPress={() => {
            setPessoas((l) => [...l, { chave: novaChave(), id: null, nome: '', faixa: 'adulto' }]);
            setTimeout(() => ultimoCampo.current?.focus(), 50);
          }}
          accessibilityRole="button"
          hitSlop={8}
          style={{ minHeight: alvoToque, justifyContent: 'center' }}
        >
          <Texto papel="corpo" peso="600" cor="primary">
            + Adicionar pessoa
          </Texto>
        </Pressable>
      </View>
      {tentou && erros.pessoas ? (
        <Texto papel="metadado" cor="error">
          {erros.pessoas}
        </Texto>
      ) : null}
      {pessoas.map((p, i) => (
        <Cartao key={p.chave} semPadding>
          <LinhaComGestos
            acoes={[{ rotulo: 'Remover', fundo: 'error', texto: 'onPrimary', onPress: () => removerPessoa(p) }]}
            acoesAcessiveis={[{ nome: 'remover', rotulo: 'Remover', onAcao: () => removerPessoa(p) }]}
          >
            {() => (
              <View style={estilos.pessoa}>
                <TextInput
                  ref={i === pessoas.length - 1 ? ultimoCampo : undefined}
                  value={p.nome}
                  onChangeText={(t) => mudarPessoa(p.chave, { nome: t })}
                  placeholder="Nome"
                  placeholderTextColor={cores.onSurfaceVariant}
                  maxLength={60}
                  autoCapitalize="words"
                  accessibilityLabel={`Nome da pessoa ${i + 1}`}
                  style={[estiloTexto('nomeItem'), estilos.flex, { color: cores.onSurface, minHeight: alvoToque }]}
                />
                <Pressable
                  onPress={() => mudarPessoa(p.chave, { faixa: p.faixa === 'adulto' ? 'crianca' : 'adulto' })}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.faixa === 'adulto' ? 'Adulto' : 'Criança'}. Tocar para mudar`}
                  style={[estilos.faixa, { backgroundColor: p.faixa === 'adulto' ? cores.surfaceVariant : cores.warningContainer, minHeight: alvoToque }]}
                >
                  <Texto papel="metadado" peso="700" cor={p.faixa === 'adulto' ? 'onSurface' : 'warning'}>
                    {p.faixa === 'adulto' ? 'Adulto' : 'Criança'}
                  </Texto>
                </Pressable>
              </View>
            )}
          </LinhaComGestos>
        </Cartao>
      ))}

      <Texto papel="metadado" cor="onSurfaceVariant">
        O grupo recebe um link próprio. Cada pessoa confirma presença e informa restrição alimentar.
      </Texto>
      {grupo?.recado ? (
        <Cartao fundo="surfaceVariant" semBorda>
          <Texto papel="rotuloCampo">Recado do grupo</Texto>
          <Texto papel="corpo">{grupo.recado}</Texto>
        </Cartao>
      ) : null}
      {novo ? null : <Botao rotulo="Excluir grupo" variante="destrutivo" onPress={excluirGrupo} style={estilos.esquerda} />}
    </TelaPilha>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  linhaCentro: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3 },
  pessoa: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3, paddingLeft: espacos.space4, paddingRight: espacos.space2, paddingVertical: espacos.space2 },
  faixa: { borderRadius: raios.radiusMd, paddingHorizontal: espacos.space3, alignItems: 'center', justifyContent: 'center' },
  esquerda: { alignSelf: 'flex-start' },
});
