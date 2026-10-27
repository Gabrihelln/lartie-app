'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Diálogo da web do convidado no padrão da Seção 15: véu scrim; tocar fora ou Esc = cancelar;
 * leitores de tela anunciam como alerta; o foco vai para o primeiro botão.
 */
export function Dialogo({ titulo, id, onCancelar, children }: { titulo: string; id: string; onCancelar?: () => void; children: ReactNode }) {
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    caixa.current?.querySelector<HTMLElement>('button, a')?.focus();
    if (!onCancelar) return;
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onCancelar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [onCancelar]);
  return (
    <div className="veu" role="alertdialog" aria-modal aria-labelledby={id} onClick={(e) => e.target === e.currentTarget && onCancelar?.()}>
      <div className="dialogo" ref={caixa}>
        <h2 id={id}>{titulo}</h2>
        {children}
      </div>
    </div>
  );
}
