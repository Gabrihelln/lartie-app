import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { ModoApp } from '@lartie/modelo';
import { passosParaAtivar } from '@lartie/regras';
import { useAvisos } from '../feedback/Avisos';
import { useDialogo } from '../feedback/Dialogo';
import { ErroSemConexao, trocarModo } from '../servicos/api';
import { registrarErro, registrarEvento, type OrigemModo } from '../servicos/analytics';
import { useConexao } from '../servicos/conexao';
import { useSessao } from './Sessao';

/** Aviso de sucesso da troca de modo (T33b "Depois de salvar"). */
export const TEXTO_MODO_ATUALIZADO = 'Modo atualizado. O menu já mudou para vocês dois.';

/**
 * Troca de modo do casal (13.9), de qualquer origem: T33b, cartões do Início, T12d e a folha
 * "Ativar {módulo}?". Exige conexão (regra 8). Módulo nunca gerado → pede os dados que faltam
 * (regra 2, tela AtivarModulo); já gerado → só troca. Devolve true se o modo já mudou aqui.
 */
export function useTrocarModo() {
  const navigation = useNavigation();
  const { casal } = useSessao();
  const { online } = useConexao();
  const { confirmar, erroAoSalvar } = useDialogo();
  const avisos = useAvisos();

  const semConexao = useCallback(
    () =>
      confirmar({
        icone: 'semConexao',
        titulo: 'Sem conexão com a internet',
        texto: 'Mudar o modo do app precisa de internet. Confiram a conexão e tentem de novo.',
        cancelar: null,
        confirmar: 'Entendi',
      }),
    [confirmar],
  );

  return useCallback(
    async (alvo: ModoApp, origem: OrigemModo): Promise<boolean> => {
      if (!casal) return false;
      if (!online) {
        await semConexao();
        return false;
      }
      if (passosParaAtivar(alvo, casal.modulos_gerados).length) {
        navigation.navigate('AtivarModulo', { modo: alvo, origem });
        return false;
      }
      for (;;) {
        try {
          await trocarModo(alvo, origem);
          registrarEvento({ nome: 'modo_alterado', params: { de: casal.modo_app, para: alvo, origem } });
          avisos.mostrar({ texto: TEXTO_MODO_ATUALIZADO, tipo: 'sucesso' });
          return true;
        } catch (erro) {
          if (erro instanceof ErroSemConexao) {
            await semConexao();
            return false;
          }
          registrarErro(erro, 'trocar modo');
          if (!(await erroAoSalvar())) return false;
        }
      }
    },
    [casal, online, semConexao, navigation, avisos, erroAoSalvar],
  );
}
