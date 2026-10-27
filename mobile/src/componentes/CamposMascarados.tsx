import React from 'react';
import { CampoTexto } from './CampoTexto';

// Campos com máscara (especificação 2.3): valor em reais ("R$ 60.000", guardado em centavos) e
// mês/ano da mudança ("05/2027", guardado como "aaaa-mm").

export function formatarReais(centavos: number | null): string {
  if (centavos === null) return '';
  return `R$ ${Math.round(centavos / 100).toLocaleString('pt-BR')}`;
}

export function lerReais(texto: string): number | null {
  const digitos = texto.replace(/\D/g, '');
  return digitos ? Number(digitos) * 100 : null;
}

interface PropsMoeda {
  rotulo: string;
  valor: number | null;
  onMudar: (centavos: number | null) => void;
  erro?: string | null;
  placeholder?: string;
  onBlur?: () => void;
}

/** Valor inteiro em reais, como no protótipo do T07 ("R$ 60.000"). */
export function CampoMoeda({ rotulo, valor, onMudar, erro, placeholder = 'R$ 0', onBlur }: PropsMoeda) {
  return (
    <CampoTexto
      rotulo={rotulo}
      onBlur={onBlur}
      erro={erro}
      placeholder={placeholder}
      keyboardType="number-pad"
      value={formatarReais(valor)}
      onChangeText={(t) => onMudar(lerReais(t))}
      maxLength={16}
    />
  );
}

/** "05/2027" → "2027-05"; null se incompleto ou inválido. */
export function lerMesAno(texto: string): string | null {
  const m = /^(\d{2})\/(\d{4})$/.exec(texto);
  if (!m) return null;
  const mes = Number(m[1]);
  return mes >= 1 && mes <= 12 ? `${m[2]}-${m[1]}` : null;
}

export function formatarMesAno(valor: string | null): string {
  if (!valor) return '';
  const [a, m] = valor.split('-');
  return `${m}/${a}`;
}

/** Máscara mm/aaaa enquanto digita. */
export function mascararMesAno(texto: string): string {
  const d = texto.replace(/\D/g, '').slice(0, 6);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

interface PropsMesAno {
  rotulo: string;
  texto: string;
  onMudarTexto: (texto: string) => void;
  erro?: string | null;
  onBlur?: () => void;
}

export function CampoMesAno({ rotulo, texto, onMudarTexto, erro, onBlur }: PropsMesAno) {
  return (
    <CampoTexto
      rotulo={rotulo}
      placeholder="mm/aaaa"
      keyboardType="number-pad"
      value={texto}
      onChangeText={(t) => onMudarTexto(mascararMesAno(t))}
      onBlur={onBlur}
      erro={erro}
      maxLength={7}
    />
  );
}
