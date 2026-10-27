import React, { useState } from 'react';
import { modoAoAtivar, textoAtivarModulo, type ModuloAtivavel } from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { Texto } from '../../componentes/Texto';
import { useSessao } from '../../dados/Sessao';
import { useTrocarModo } from '../../dados/useTrocarModo';

// Folha "Ativar {módulo}?" (13.9 regra 6): links e notificações antigas para telas de um módulo
// oculto abrem o Início com esta folha. "Ativar" segue a regra 2 (pede só os dados que faltam).
export function FolhaAtivarModulo({ modulo, onFechar }: { modulo: ModuloAtivavel | null; onFechar: () => void }) {
  const { modo } = useSessao();
  const trocar = useTrocarModo();
  const [ativando, setAtivando] = useState(false);
  const texto = modulo ? textoAtivarModulo(modulo) : null;
  return (
    <FolhaInferior visivel={!!modulo} titulo={texto?.titulo} onFechar={onFechar}>
      <Texto papel="corpo" cor="onSurfaceVariant">
        {texto?.texto}
      </Texto>
      <Botao
        rotulo="Ativar"
        larguraTotal
        carregando={ativando}
        onPress={async () => {
          if (!modulo) return;
          setAtivando(true);
          onFechar();
          await trocar(modoAoAtivar(modo, modulo), 'folha_ativar');
          setAtivando(false);
        }}
      />
      <Botao rotulo="Agora não" variante="texto" larguraTotal onPress={onFechar} />
    </FolhaInferior>
  );
}
