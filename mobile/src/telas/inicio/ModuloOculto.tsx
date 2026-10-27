import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { ModuloAtivavel } from '@lartie/regras';

// 13.9 regra 6: um link (ou notificação antiga) para uma tela de módulo oculto abre o Início com a
// folha "Ativar {módulo}?".
export function ModuloOculto({ modulo }: { modulo: ModuloAtivavel }) {
  const navigation = useNavigation();
  useEffect(() => {
    navigation.navigate('Abas', { screen: 'inicio', params: { ativar: modulo } });
  }, [navigation, modulo]);
  return null;
}
