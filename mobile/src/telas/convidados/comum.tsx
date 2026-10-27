import { useCallback } from 'react';
import { Linking } from 'react-native';
import { waitForPendingWrites } from '@react-native-firebase/firestore';
import type { Grupo } from '@lartie/modelo';
import { formatarData, linkDoRsvp, mensagemConviteRsvp, mensagemLembreteRsvp } from '@lartie/regras';
import { useNomes } from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { tokensDosGrupos } from '../../servicos/api';
import { db } from '../../servicos/firebase';

// Peças do RSVP no app: o link de cada grupo e as mensagens prontas do WhatsApp. Sem serviço de
// mensagens (P10, decidido em 27/10/2026), o app abre o WhatsApp grupo a grupo.

export type GrupoComId = Grupo & { id: string };

export function abrirWhatsApp(numero: string, texto: string) {
  const d = numero.replace(/\D/g, '');
  return Linking.openURL(`https://wa.me/${d.startsWith('55') ? d : `55${d}`}?text=${encodeURIComponent(texto)}`);
}

/** Mensagens de convite e lembrete com o link de cada grupo (o servidor guarda os tokens). */
export function useMensagensRsvp() {
  const { casal } = useSessao();
  const { saudacao } = useNomes();
  return useCallback(
    async (grupos: GrupoComId[], tipo: 'convite' | 'lembrete') => {
      if (!casal?.slug) throw new Error('sem_slug');
      // O grupo precisa estar no servidor para receber o token (pode ter sido criado agora, offline).
      await waitForPendingWrites(db());
      const { tokens } = await tokensDosGrupos(grupos.map((g) => g.id));
      return grupos.map((g) => {
        const link = `https://${linkDoRsvp(casal.slug!, tokens[g.id] ?? '')}`;
        const texto =
          tipo === 'convite'
            ? mensagemConviteRsvp({
                grupo: g.nome,
                casal: saudacao,
                data: casal.data_casamento ? formatarData(casal.data_casamento) : null,
                cidade: casal.cidade,
                prazo: casal.rsvp_prazo ? formatarData(casal.rsvp_prazo) : null,
                link,
              })
            : mensagemLembreteRsvp({ grupo: g.nome, casal: saudacao, link });
        return { grupo: g, texto, token: tokens[g.id] ?? null };
      });
    },
    [casal, saudacao],
  );
}
