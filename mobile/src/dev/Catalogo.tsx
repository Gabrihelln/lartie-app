import React, { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MODOS_APP, type EstadoItem, type ModoApp } from '@lartie/modelo';
import { abasDoModo, telaInicial, type Aba } from '@lartie/regras';
import { raios, type NomeCor } from '@lartie/tokens';
import { AvatarDuplo } from '../componentes/AvatarDuplo';
import { BarraAbas } from '../componentes/BarraNavegacao';
import { Botao, type VarianteBotao } from '../componentes/Botao';
import { CampoTexto } from '../componentes/CampoTexto';
import { CartaoProgresso } from '../componentes/CartaoProgresso';
import { Chip } from '../componentes/Chip';
import { ControleSegmentado } from '../componentes/ControleSegmentado';
import { Degrade } from '../componentes/Degrade';
import { FolhaInferior } from '../componentes/FolhaInferior';
import { ItemEnxoval } from '../componentes/ItemEnxoval';
import { IconeApp, MarcaLartie, SimboloLartie } from '../componentes/Logo';
import { OpcaoModo } from '../componentes/OpcaoModo';
import { Selo } from '../componentes/Selo';
import { Texto } from '../componentes/Texto';
import { atualizar, trocarModoApp } from '../dados/gravacao';
import { useSessao } from '../dados/Sessao';
import { AtualizacaoApp } from '../feedback/AtualizacaoApp';
import { useAvisos } from '../feedback/Avisos';
import { useDialogo } from '../feedback/Dialogo';
import { Esqueleto } from '../feedback/Esqueleto';
import { EstadoVazio } from '../feedback/EstadoVazio';
import { ExplicacaoPermissao } from '../feedback/ExplicacaoPermissao';
import { TelaSemConexao } from '../feedback/TelaSemConexao';
import { useDescartarAlteracoes } from '../feedback/useDescartarAlteracoes';
import type { EstadoCatalogo, ParamsRaiz } from '../navegacao/tipos';
import { registrarEvento } from '../servicos/analytics';
import { useConexao } from '../servicos/conexao';
import { sair } from '../servicos/acesso';
import { espacos, useTema } from '../tema';

// Catálogo interno (só em desenvolvimento, plano 2.2 item 9): todos os componentes e os padrões de
// diálogo, aviso, erro, vazio e esqueleto, nos dois temas, para validação visual da Etapa 0.

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={estilos.secao}>
      <Texto papel="tituloSecao" accessibilityRole="header">
        {titulo}
      </Texto>
      {children}
    </View>
  );
}

const ROTULOS_MODO: Record<ModoApp, string> = {
  os_dois: 'Os dois',
  casamento: 'Só casamento',
  casa: 'Só casa',
  indefinido: 'Decidir depois',
};

export function Catalogo() {
  const { cores, margem, tema, temaForcado, forcarTema } = useTema();
  const navigation = useNavigation();
  const inset = useSafeAreaInsets();
  const { confirmar, erroAoSalvar } = useDialogo();
  const avisos = useAvisos();

  const [chip, setChip] = useState('todas');
  const [segmento, setSegmento] = useState<'checklist' | 'orcamento' | 'fornecedores' | 'convidados'>('checklist');
  const [estadoItem, setEstadoItem] = useState<EstadoItem>('falta');
  const [opcao, setOpcao] = useState<ModoApp>('os_dois');
  const [folha, setFolha] = useState(false);
  const [abaVista, setAbaVista] = useState<Aba>('inicio');

  const abrirEstado = (estado: EstadoCatalogo) => navigation.navigate('CatalogoEstado', { estado });

  return (
    <ScrollView
      style={{ backgroundColor: cores.background }}
      contentContainerStyle={[estilos.conteudo, { paddingHorizontal: margem, paddingBottom: inset.bottom + espacos.space10 }]}
    >
      <Secao titulo="Tema">
        <Texto papel="metadado" cor="onSurfaceVariant">
          Agora: {tema}
          {temaForcado ? ' (forçado)' : ' (segue o sistema)'}
        </Texto>
        <View style={estilos.linhaChips}>
          <Chip rotulo="Sistema" selecionado={!temaForcado} onPress={() => forcarTema(null)} />
          <Chip rotulo="Claro" selecionado={temaForcado === 'claro'} onPress={() => forcarTema('claro')} />
          <Chip rotulo="Escuro" selecionado={temaForcado === 'escuro'} onPress={() => forcarTema('escuro')} />
        </View>
      </Secao>

      <TesteModoESincronizacao />

      <Secao titulo="Marca">
        <View style={estilos.linha}>
          <IconeApp tamanho={96} />
          <IconeApp tamanho={56} />
          <SimboloLartie altura={40} cor="primary" />
          <SimboloLartie altura={20} cor="onSurface" />
        </View>
        <MarcaLartie slogan />
        <Degrade nome="gradientSplash" style={estilos.degrade}>
          <View style={estilos.centro}>
            <MarcaLartie sobre="marca" slogan tamanhoNome={32} />
          </View>
        </Degrade>
        <Degrade nome="gradientOnboarding" aneis style={estilos.degrade} />
        <Degrade nome="gradientIcon" style={estilos.degradePequeno} />
      </Secao>

      <Secao titulo="Cores">
        <View style={estilos.grade}>
          {(Object.keys(cores) as NomeCor[]).map((nome) => (
            <View key={nome} style={estilos.amostra}>
              <View style={[estilos.cor, { backgroundColor: cores[nome], borderColor: cores.outlineVariant }]} />
              <Texto papel="selo" cor="onSurfaceVariant" numberOfLines={1}>
                {nome}
              </Texto>
            </View>
          ))}
        </View>
      </Secao>

      <Secao titulo="Tipografia">
        <Texto papel="tituloAba">Casamento</Texto>
        <Texto papel="tituloDestaque">Faltam 186 dias</Texto>
        <Texto papel="tituloTela">Cozinha</Texto>
        <Texto papel="tituloSecao">Próximas tarefas</Texto>
        <Texto papel="nomeItem">Fechar fotógrafo</Texto>
        <Texto papel="corpo">Os nomes aparecem na tela inicial.</Texto>
        <Texto papel="metadado" cor="onSurfaceVariant">
          15 de 64 tarefas
        </Texto>
        <Texto papel="ajuda" cor="onSurfaceVariant">
          Lembrete 3 dias antes
        </Texto>
      </Secao>

      <Secao titulo="Botões">
        {(['principal', 'tonal', 'contornado', 'texto', 'destrutivo', 'whatsapp'] as VarianteBotao[]).map((v) => (
          <Botao key={v} rotulo={`Botão ${v}`} variante={v} onPress={() => {}} larguraTotal />
        ))}
        <Botao rotulo="Desativado" onPress={() => {}} desativado larguraTotal />
        <Botao rotulo="Salvar (carrega 2 s)" onPress={() => new Promise<void>((r) => setTimeout(r, 2000))} larguraTotal />
      </Secao>

      <Secao titulo="Campos">
        <CampoTexto rotulo="Nome do item" placeholder="Ex.: Jogo de panelas" ajuda="Aparece na lista de presentes." />
        <CampoTexto rotulo="Data" value="12/03/2020" erro="Escolha uma data depois de hoje." />
        <CampoTexto rotulo="E-mail" keyboardType="email-address" autoCapitalize="none" placeholder="voce@email.com" />
      </Secao>

      <Secao titulo="Chips, selos e controle segmentado">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.linhaChips}>
          {['todas', 'a fazer', 'atrasadas', 'concluídas'].map((c) => (
            <Chip key={c} rotulo={c[0]!.toUpperCase() + c.slice(1)} selecionado={chip === c} onPress={() => setChip(c)} />
          ))}
        </ScrollView>
        <View style={estilos.linhaChips}>
          <Selo texto="Atrasada" tom="error" />
          <Selo texto="Completo" tom="success" />
          <Selo texto="Expira em 2 dias" tom="warning" />
          <Selo texto="Na lista" tom="info" />
        </View>
        <ControleSegmentado
          rotulo="Seções do casamento"
          selecionado={segmento}
          onMudar={setSegmento}
          segmentos={[
            { valor: 'checklist', rotulo: 'Checklist' },
            { valor: 'orcamento', rotulo: 'Orçamento' },
            { valor: 'fornecedores', rotulo: 'Fornec.', rotuloAcessivel: 'Fornecedores' },
            { valor: 'convidados', rotulo: 'Convidados' },
          ]}
        />
      </Secao>

      <Secao titulo="Cartões de progresso e avatar">
        <AvatarDuplo pessoa1={{ nome: 'Ana' }} pessoa2={{ nome: 'Pedro' }} />
        <CartaoProgresso area="casamento" rotulo="Casamento" feitos={15} total={64} unidade="tarefas" />
        <CartaoProgresso area="casa" rotulo="Casa nova" feitos={48} total={182} unidade="itens" />
        <CartaoProgresso area="casa" rotulo="Quarto" feitos={30} total={30} unidade="itens" />
      </Secao>

      <Secao titulo="Item do enxoval">
        <ItemEnxoval
          nome="Jogo de panelas"
          detalhes="1 · Primeira noite · R$ 450"
          estado={estadoItem}
          onAbrir={() => avisos.mostrar({ texto: 'Abriria o detalhe do item (T20)' })}
          onMudarEstado={(novo) => {
            const anterior = estadoItem;
            setEstadoItem(novo);
            avisos.comDesfazer('Item atualizado', () => setEstadoItem(anterior));
          }}
        />
      </Secao>

      <Secao titulo="Opção de modo">
        <View accessibilityRole="radiogroup" accessibilityLabel="Modo do app" style={estilos.coluna}>
          <OpcaoModo
            titulo="Casamento e casa nova"
            descricao="Checklist, orçamento, convidados, enxoval e presentes."
            icone="casamento"
            fundoIcone="primaryContainer"
            corIcone="onPrimaryContainer"
            selo="Mais completo"
            selecionado={opcao === 'os_dois'}
            onPress={() => setOpcao('os_dois')}
          />
          <OpcaoModo
            titulo="Só o casamento"
            descricao="Checklist, orçamento, fornecedores e convidados."
            icone="casamento"
            fundoIcone="primaryContainer"
            corIcone="primary"
            selecionado={opcao === 'casamento'}
            onPress={() => setOpcao('casamento')}
          />
          <OpcaoModo
            titulo="Só a casa nova"
            descricao="Enxoval por cômodo, medidas e lista de presentes."
            icone="casa"
            fundoIcone="homeContainer"
            corIcone="home"
            selecionado={opcao === 'casa'}
            onPress={() => setOpcao('casa')}
          />
        </View>
      </Secao>

      <Secao titulo="Barra de navegação por modo">
        <View style={estilos.linhaChips}>
          {MODOS_APP.map((m) => (
            <Chip key={m} rotulo={ROTULOS_MODO[m]} selecionado={opcao === m} onPress={() => setOpcao(m)} />
          ))}
        </View>
        <View style={[estilos.molduraBarra, { borderColor: cores.outlineVariant }]}>
          <BarraAbas abas={abasDoModo(opcao)} ativa={abasDoModo(opcao).includes(abaVista) ? abaVista : 'inicio'} onTocar={setAbaVista} semAreaSegura />
        </View>
      </Secao>

      <Secao titulo="Diálogos de confirmação (T34 a T43)">
        <Botao
          rotulo="T34 Excluir tarefa"
          variante="contornado"
          onPress={async () => {
            const ok = await confirmar({
              icone: 'excluir',
              tom: 'destrutivo',
              titulo: 'Excluir esta tarefa?',
              texto: '"Fechar fotógrafo" sai do checklist de vocês dois. Não dá para desfazer.',
              confirmar: 'Excluir',
            });
            if (ok) avisos.mostrar({ texto: 'Tarefa excluída' });
          }}
        />
        <Botao
          rotulo="T38 Lembrar pendentes (WhatsApp)"
          variante="contornado"
          onPress={() =>
            confirmar({
              tom: 'whatsapp',
              titulo: 'Lembrar 86 pessoas?',
              texto: 'Cada um dos 21 grupos recebe pelo WhatsApp o link para confirmar presença até 18/02/2027.',
              confirmar: 'Enviar',
            })
          }
        />
        <Botao
          rotulo="T42 Excluir conta (digitar EXCLUIR)"
          variante="contornado"
          onPress={() =>
            confirmar({
              icone: 'excluir',
              tom: 'destrutivo',
              titulo: 'Excluir a conta e todos os dados?',
              texto:
                'Vamos apagar o checklist, o enxoval, as listas de presentes, os convidados e as fotos. Pedro também perde o acesso. Isso não pode ser desfeito.',
              textoExigido: 'EXCLUIR',
              rotuloCampo: 'Digite EXCLUIR para confirmar',
              confirmar: 'Excluir tudo',
            })
          }
        />
        <Botao rotulo="T48 Não foi possível salvar" variante="contornado" onPress={() => erroAoSalvar()} />
        <Botao
          rotulo="T51 Um botão só (Alguém reservou antes)"
          variante="contornado"
          onPress={() =>
            confirmar({
              icone: 'presentes',
              titulo: 'Alguém reservou antes',
              texto: 'Os pratos rasos acabaram de ser reservados por outro convidado. Que tal escolher outro presente?',
              cancelar: null,
              confirmar: 'Ver outros presentes',
            })
          }
        />
        <Botao rotulo="T36 Descartar alterações (formulário)" variante="contornado" onPress={() => navigation.navigate('CatalogoFormulario')} />
      </Secao>

      <Secao titulo="Avisos rápidos (T54)">
        <Botao rotulo="Neutro com Desfazer" variante="tonal" onPress={() => avisos.comDesfazer('Tarefa concluída', () => avisos.mostrar({ texto: 'Desfeito' }))} />
        <Botao rotulo="Sucesso" variante="tonal" onPress={() => avisos.mostrar({ texto: 'Item salvo na Cozinha', tipo: 'sucesso' })} />
        <Botao
          rotulo="Erro com Tentar de novo"
          variante="tonal"
          onPress={() => avisos.mostrar({ texto: 'Não foi possível enviar o lembrete', tipo: 'erro', acao: { rotulo: 'Tentar de novo', onPress: () => {} } })}
        />
        <Botao
          rotulo="Três em fila"
          variante="tonal"
          onPress={() => {
            avisos.mostrar({ texto: 'Primeiro aviso' });
            avisos.mostrar({ texto: 'Segundo aviso', tipo: 'sucesso' });
            avisos.mostrar({ texto: 'Link copiado' });
          }}
        />
      </Secao>

      <Secao titulo="Folha inferior">
        <Botao rotulo="Abrir folha" variante="tonal" onPress={() => setFolha(true)} />
        <FolhaInferior visivel={folha} titulo="Ativar casa nova?" onFechar={() => setFolha(false)}>
          <Texto papel="corpo" cor="onSurfaceVariant">
            Casa nova está desativado no momento. Querem ativar?
          </Texto>
          <Botao rotulo="Ativar" onPress={() => setFolha(false)} larguraTotal />
          <Botao rotulo="Agora não" variante="texto" onPress={() => setFolha(false)} larguraTotal />
        </FolhaInferior>
      </Secao>

      <Secao titulo="Estados de tela (T47, T57 a T64, T67)">
        {(
          [
            ['semConexao', 'T47 Sem conexão'],
            ['permNotificacoes', 'T57 Permissão de notificações'],
            ['permCamera', 'T58 Permissão de câmera'],
            ['permContatos', 'T59 Permissão de contatos'],
            ['vazioPresentes', 'T60 Vazio: presentes'],
            ['vazioConvidados', 'T61 Vazio: convidados'],
            ['vazioFornecedores', 'T62 Vazio: fornecedores'],
            ['vazioNotificacoes', 'T63 Vazio: notificações'],
            ['esqueleto', 'T64 Carregando'],
            ['atualizacao', 'T67 Atualização obrigatória'],
          ] as [EstadoCatalogo, string][]
        ).map(([estado, rotulo]) => (
          <Botao key={estado} rotulo={rotulo} variante="contornado" onPress={() => abrirEstado(estado)} />
        ))}
      </Secao>
    </ScrollView>
  );
}

/** Aceites da Etapa 0: trocar modo_app muda as abas; alteração num aparelho aparece no outro em até 2 s. */
function TesteModoESincronizacao() {
  const { casalId, casal, modo, usuario } = useSessao();
  const { online } = useConexao();
  const avisos = useAvisos();
  const [agora, setAgora] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  if (!casalId || !casal) {
    return (
      <Secao titulo="Modo do app e sincronização">
        <Texto papel="metadado" cor="onSurfaceVariant">
          Entre com uma conta de teste para testar.
        </Texto>
      </Secao>
    );
  }

  const teste = (casal as unknown as { teste_sincronizacao?: { valor: number; enviado_em: number; por: string } })
    .teste_sincronizacao;

  const trocarModo = (novo: ModoApp) => {
    if (novo === modo) return;
    // 13.9 regra 8: a troca de modo exige conexão.
    if (!online) {
      avisos.mostrar({ texto: 'Trocar o modo precisa de internet.', tipo: 'erro' });
      return;
    }
    trocarModoApp(casalId, novo, () => avisos.mostrar({ texto: 'Não foi possível trocar o modo.', tipo: 'erro' }));
    registrarEvento({ nome: 'modo_alterado', params: { de: modo, para: novo, origem: 'perfil' } });
  };

  return (
    <Secao titulo="Modo do app e sincronização">
      <Texto papel="metadado" cor="onSurfaceVariant">
        Conta: {usuario?.email} · modo: {ROTULOS_MODO[modo]} · tela inicial {telaInicial(modo)} · {online ? 'online' : 'offline'}
      </Texto>
      <View style={estilos.linhaChips}>
        {MODOS_APP.map((m) => (
          <Chip key={m} rotulo={ROTULOS_MODO[m]} selecionado={modo === m} onPress={() => trocarModo(m)} />
        ))}
      </View>
      <Botao
        rotulo={`Somar 1 (valor atual: ${teste?.valor ?? 0})`}
        variante="tonal"
        onPress={() =>
          atualizar(casalId, null, null, {
            teste_sincronizacao: { valor: (teste?.valor ?? 0) + 1, enviado_em: Date.now(), por: usuario?.email ?? '?' },
          })
        }
      />
      {teste ? (
        <Texto papel="ajuda" cor="onSurfaceVariant">
          Última alteração por {teste.por}, há {((agora - teste.enviado_em) / 1000).toFixed(1)} s. Abra o catálogo no outro
          aparelho, com a outra conta, e confira o valor.
        </Texto>
      ) : null}
      <Botao rotulo="Sair da conta" variante="texto" onPress={sair} />
    </Secao>
  );
}

export function CatalogoEstado() {
  const { params } = useRoute<RouteProp<ParamsRaiz, 'CatalogoEstado'>>();
  const navigation = useNavigation();
  const voltar = () => navigation.goBack();
  switch (params.estado) {
    case 'semConexao':
      return <TelaSemConexao onTentarDeNovo={() => new Promise<void>((r) => setTimeout(r, 1000))} onContinuarSemInternet={voltar} />;
    case 'permNotificacoes':
      return <ExplicacaoPermissao tipo="notificacoes" onPermitir={voltar} onAgoraNao={voltar} />;
    case 'permCamera':
      return <ExplicacaoPermissao tipo="camera" onPermitir={voltar} onAgoraNao={voltar} />;
    case 'permContatos':
      return <ExplicacaoPermissao tipo="contatos" onPermitir={voltar} onAgoraNao={voltar} />;
    case 'vazioPresentes':
      return <EstadoVazio tipo="presentes" onPrincipal={voltar} />;
    case 'vazioConvidados':
      return <EstadoVazio tipo="convidados" onPrincipal={voltar} onSecundaria={voltar} />;
    case 'vazioFornecedores':
      return <EstadoVazio tipo="fornecedores" onPrincipal={voltar} />;
    case 'vazioNotificacoes':
      return <EstadoVazio tipo="notificacoes" onPrincipal={voltar} />;
    case 'atualizacao':
      return <AtualizacaoApp nomeParceiro="Pedro" />;
    case 'esqueleto':
      return <Esqueleto />;
  }
}

export function CatalogoFormulario() {
  const { cores, margem } = useTema();
  const navigation = useNavigation();
  const avisos = useAvisos();
  const [nome, setNome] = useState('');
  const [salvo, setSalvo] = useState('');
  const mudou = nome !== salvo;
  useDescartarAlteracoes({ temAlteracoes: mudou });

  return (
    <View style={[estilos.formulario, { backgroundColor: cores.background, paddingHorizontal: margem }]}>
      <Texto papel="metadado" cor="onSurfaceVariant">
        Digite algo e tente voltar sem salvar: aparece "Descartar as alterações?" (T36).
      </Texto>
      <CampoTexto rotulo="Nome do item" value={nome} onChangeText={setNome} />
      <Botao
        rotulo="Salvar"
        larguraTotal
        desativado={!nome.trim()}
        onPress={async () => {
          await new Promise<void>((r) => setTimeout(r, 600));
          setSalvo(nome);
          avisos.mostrar({ texto: 'Item salvo na Cozinha', tipo: 'sucesso' });
          setTimeout(() => navigation.goBack(), 0);
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: { paddingTop: espacos.space4, gap: espacos.space8 },
  secao: { gap: espacos.space3 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espacos.space4, flexWrap: 'wrap' },
  linhaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.space2 },
  coluna: { gap: espacos.space3 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  degrade: { height: 180, borderRadius: raios.radiusLg },
  degradePequeno: { height: 80, width: 80, borderRadius: raios.radiusLg + 2 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.space3 },
  amostra: { width: 96, gap: espacos.space1 },
  cor: { height: 40, borderRadius: raios.radiusSm, borderWidth: 1 },
  molduraBarra: { borderWidth: 1, borderRadius: raios.radiusMd, overflow: 'hidden' },
  formulario: { flex: 1, paddingTop: espacos.space6, gap: espacos.space4 },
});
