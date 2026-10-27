import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { raios, tamanhos } from '@lartie/tokens';
import { formatarData, hojeLocal } from '@lartie/regras';
import { espacos, useTema } from '../tema';
import { Botao } from './Botao';
import { ErroCampo } from './CampoTexto';
import { FolhaInferior } from './FolhaInferior';
import { Icone } from './Icone';
import { Texto } from './Texto';

// Campo de data com o seletor nativo (especificação 2.3): no iOS, o calendário numa folha
// inferior com "Confirmar"; no Android, o diálogo do Material. Mostra e guarda dd/mm/aaaa ↔ aaaa-mm-dd.

interface Props {
  rotulo: string;
  /** "aaaa-mm-dd" */
  valor: string | null;
  onMudar: (data: string) => void;
  desativado?: boolean;
  /** Primeira data permitida ("aaaa-mm-dd"). */
  minimo?: string;
  erro?: string | null;
  placeholder?: string;
}

const paraDate = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a!, m! - 1, d!, 12);
};

export function CampoData({ rotulo, valor, onMudar, desativado, minimo, erro, placeholder = 'dd/mm/aaaa' }: Props) {
  const { cores, tema } = useTema();
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<Date>(paraDate(valor ?? minimo ?? hojeLocal()));

  const abrir = () => {
    if (desativado) return;
    const inicial = paraDate(valor ?? minimo ?? hojeLocal());
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: inicial,
        mode: 'date',
        minimumDate: minimo ? paraDate(minimo) : undefined,
        onChange: (evento, data) => {
          if (evento.type === 'set' && data) onMudar(hojeLocal(data));
        },
      });
    } else {
      setRascunho(inicial);
      setAberto(true);
    }
  };

  return (
    <View style={estilos.grupo}>
      <Texto papel="rotuloCampo">{rotulo}</Texto>
      <Pressable
        onPress={abrir}
        disabled={desativado}
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${valor ? formatarData(valor) : 'não escolhida'}`}
        accessibilityState={{ disabled: desativado }}
        style={[
          estilos.caixa,
          {
            backgroundColor: cores.surface,
            borderColor: erro ? cores.error : cores.outlineSoft,
            borderWidth: erro ? 2 : 1.5,
            opacity: desativado ? 0.38 : 1,
          },
        ]}
      >
        <Texto papel="corpo" cor={valor ? 'onSurface' : 'onSurfaceVariant'} style={estilos.texto}>
          {valor ? formatarData(valor) : placeholder}
        </Texto>
        <Icone nome="evento" cor={cores.onSurfaceVariant} tamanho={20} />
      </Pressable>
      {erro ? <ErroCampo mensagem={erro} /> : null}
      {Platform.OS === 'ios' ? (
        <FolhaInferior visivel={aberto} titulo={rotulo} onFechar={() => setAberto(false)}>
          <DateTimePicker
            value={rascunho}
            mode="date"
            display="inline"
            locale="pt-BR"
            minimumDate={minimo ? paraDate(minimo) : undefined}
            themeVariant={tema === 'escuro' ? 'dark' : 'light'}
            accentColor={cores.primary}
            onChange={(_, data) => data && setRascunho(data)}
          />
          <Botao
            rotulo="Confirmar"
            larguraTotal
            onPress={() => {
              onMudar(hojeLocal(rascunho));
              setAberto(false);
            }}
          />
        </FolhaInferior>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espacos.space1 + 2 },
  caixa: {
    minHeight: tamanhos.fieldHeight,
    borderRadius: raios.radiusMd,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: espacos.space4 - 2,
    gap: espacos.space2,
  },
  texto: { flex: 1 },
});
