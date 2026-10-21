import React, { useCallback, useEffect, useState } from 'react';
import { ErroApi, ErroSemConexao } from '../../servicos/api';
import { prepararConta, sair } from '../../servicos/acesso';
import { registrarErro } from '../../servicos/analytics';
import { TelaSemConexao } from '../../feedback/TelaSemConexao';
import { TelaEstado } from '../../feedback/TelaEstado';
import { useSessao } from '../../dados/Sessao';
import { Abertura } from './Abertura';

// Depois do login, enquanto o usuário ainda não tem casal (claim casal_id): chama a API, que cria
// o casal vazio e o papel noivo_1 (T03) ou só confirma o casal existente. Falhou? T47 sem conexão,
// ou "Algo deu errado" com "Tentar de novo".

export function PreparandoConta() {
  const [estado, setEstado] = useState<'preparando' | 'sem_conexao' | 'erro'>('preparando');
  const { recarregarCasal } = useSessao();

  const tentar = useCallback(async () => {
    setEstado('preparando');
    try {
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
