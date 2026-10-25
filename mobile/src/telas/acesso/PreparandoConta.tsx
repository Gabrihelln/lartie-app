import React, { useCallback, useEffect, useState } from 'react';
import { getIdToken } from '@react-native-firebase/auth';
import { aceitarConvite, ErroApi, ErroSemConexao } from '../../servicos/api';
import { prepararConta, sair } from '../../servicos/acesso';
import { registrarErro } from '../../servicos/analytics';
import { armazenamento, CHAVES } from '../../servicos/armazenamento';
import { auth } from '../../servicos/firebase';
import { TelaSemConexao } from '../../feedback/TelaSemConexao';
import { TelaEstado } from '../../feedback/TelaEstado';
import { useSessao } from '../../dados/Sessao';
import { convitePendente, esquecerConvitePendente, TelaConviteExpirado } from '../convite/Convite';
import { Abertura } from './Abertura';

// Depois do login, enquanto o usuário ainda não tem casal (claim casal_id):
// - veio de um convite (T66): aceita e entra no casal como noivo_2 (pula o onboarding);
// - senão: a API cria o casal vazio e o papel noivo_1 (T03) ou só confirma o casal existente.
// Falhou? T47 sem conexão, ou "Algo deu errado" com "Tentar de novo".

type Estado = 'preparando' | 'sem_conexao' | 'erro' | 'convite_invalido';

export function PreparandoConta() {
  const [estado, setEstado] = useState<Estado>('preparando');
  const { recarregarCasal } = useSessao();

  const tentar = useCallback(async () => {
    setEstado('preparando');
    try {
      const codigo = convitePendente();
      if (codigo) {
        try {
          await aceitarConvite(codigo, armazenamento.getString(CHAVES.nomePendente) ?? undefined);
          esquecerConvitePendente();
          armazenamento.remove(CHAVES.nomePendente);
          await getIdToken(auth().currentUser!, true);
          recarregarCasal();
          return;
        } catch (erro) {
          // Convite expirado, usado ou do próprio casal: avisa (T53) e segue com um casal próprio.
          if (erro instanceof ErroApi && [404, 409, 410].includes(erro.status)) {
            esquecerConvitePendente();
            return setEstado('convite_invalido');
          }
          throw erro;
        }
      }
      await prepararConta();
      // O token renovado traz o casal; a navegação segue sozinha quando o casal carregar.
      recarregarCasal();
    } catch (erro) {
      if (erro instanceof ErroSemConexao) setEstado('sem_conexao');
      else {
        if (!(erro instanceof ErroApi && erro.status === 401)) registrarErro(erro, 'preparar conta');
        setEstado('erro');
      }
    }
  }, [recarregarCasal]);

  useEffect(() => {
    tentar();
  }, [tentar]);

  if (estado === 'convite_invalido') return <TelaConviteExpirado nome1={null} onEntendi={tentar} />;
  if (estado === 'sem_conexao') return <TelaSemConexao onTentarDeNovo={tentar} />;
  if (estado === 'erro') {
    return (
      <TelaEstado
        icone="erro"
        fundoIcone="errorContainer"
        corIcone="error"
        titulo="Algo deu errado"
        texto="Algo deu errado. Tente de novo em instantes."
        principal={{ rotulo: 'Tentar de novo', onPress: tentar }}
        secundaria={{ rotulo: 'Sair da conta', onPress: sair }}
      />
    );
  }
  return <Abertura carregando />;
}
